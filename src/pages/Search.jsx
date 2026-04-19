import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/config';
import { mapFlights } from '@/utils/mapFlight';
import airports from '@/data/airports.json';
import {
    Airplane,
    MagnifyingGlass,
    Gear,
    ArrowRight,
    X as XIcon,
} from '@phosphor-icons/react';
import TopBar from '@/components/design-system/TopBar';
import TabBar from '@/components/design-system/TabBar';
import Card from '@/components/design-system/Card';
import Button from '@/components/design-system/Button';
import StatusPill from '@/components/design-system/StatusPill';
import AuthModal from '@/components/engine/AuthModal';
import { cn } from '@/lib/utils';

/* ── Constants ──────────────────────────────────────────────────────────── */
const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3}\s?\d{1,4}$/;

function toIsoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function todayIso() { return toIsoDate(new Date()); }
function tomorrowIso() { return toIsoDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); }

/* ── Persisted Search state (sessionStorage) ─────────────────────────────
   Survives intra-flow back navigation (Search → Flight Selection → back)
   and refresh. Cleared by Engine when the user completes a new trip.
   Shape: { mode, from:{iata,name}|null, to:{iata,name}|null,
            flightNumber, date:'today'|'tomorrow'|ISO }.
   `mode` persists as 'route'|'flight'; internal state uses 'flight_number'. */
const SEARCH_STATE_KEY = 'airbridge_search_state';

function loadSearchState() {
    try {
        const raw = sessionStorage.getItem(SEARCH_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch { return null; }
}

function saveSearchState(state) {
    try { sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state)); }
    catch { /* quota / private-mode — ignore */ }
}

export function clearSearchState() {
    try { sessionStorage.removeItem(SEARCH_STATE_KEY); } catch { /* ignore */ }
}

function resolveStoredDate(d) {
    if (d === 'tomorrow') return tomorrowIso();
    if (d === 'today' || !d) return todayIso();
    return typeof d === 'string' ? d : todayIso();
}

function serializeDate(iso) {
    if (iso === todayIso()) return 'today';
    if (iso === tomorrowIso()) return 'tomorrow';
    return iso;
}

function airportInfo(iata) {
    if (!iata) return null;
    const a = airports.find((x) => x.iata === iata);
    return { iata, name: a?.name || '' };
}

function formatFriendlyDate(iso) {
    if (!iso) return '';
    if (iso === todayIso()) return 'Today';
    if (iso === tomorrowIso()) return 'Tomorrow';
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function initials(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/* ── Airport autocomplete (local, DS-styled) ─────────────────────────────── */
function AirportField({ label, placeholder, value, onChange }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const selected = useMemo(
        () => (value ? airports.find((a) => a.iata === value) : null),
        [value]
    );

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.trim().toLowerCase();
        return airports
            .filter(
                (a) =>
                    a.iata.toLowerCase().startsWith(q) ||
                    a.city.toLowerCase().includes(q) ||
                    a.name.toLowerCase().includes(q)
            )
            .slice(0, 8);
    }, [query]);

    useEffect(() => {
        function onClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    function handleSelect(airport) {
        onChange(airport.iata);
        setQuery('');
        setOpen(false);
    }

    function handleClear() {
        onChange('');
        setQuery('');
        inputRef.current?.focus();
    }

    function handleKeyDown(e) {
        if (!open || results.length === 0) {
            if (e.key === 'Escape') setOpen(false);
            return;
        }
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[highlightIdx]); }
        else if (e.key === 'Escape') { setOpen(false); }
    }

    return (
        <div ref={wrapperRef} className="relative">
            <span className="c-type-caption text-c-text-secondary block mb-c-2">{label}</span>
            <div
                className={cn(
                    'flex items-center gap-c-3 h-12 px-c-3 bg-c-ground-sunken border border-c-border-hairline rounded-c-md',
                    'focus-within:border-c-border-strong transition-colors duration-c-fast'
                )}
            >
                <Airplane size={18} weight="regular" className="text-c-text-tertiary shrink-0" />
                {selected ? (
                    <>
                        <span className="flex-1 c-type-body text-c-text-primary truncate">
                            {selected.iata} · {selected.city}
                        </span>
                        <button
                            type="button"
                            onClick={handleClear}
                            aria-label={`Clear ${label}`}
                            className="shrink-0 w-8 h-8 -mr-c-1 flex items-center justify-center rounded-c-pill text-c-text-tertiary hover:text-c-text-primary hover:bg-c-ground-elevated transition-colors"
                        >
                            <XIcon size={16} />
                        </button>
                    </>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(0); }}
                        onFocus={() => { if (query.trim()) setOpen(true); }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent outline-none c-type-body text-c-text-primary placeholder:text-c-text-tertiary"
                    />
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-30 mt-c-2 w-full bg-c-ground-elevated border border-c-border-hairline rounded-c-md shadow-c-lg overflow-hidden">
                    {results.map((a, i) => (
                        <button
                            key={a.iata}
                            type="button"
                            onMouseDown={() => handleSelect(a)}
                            onMouseEnter={() => setHighlightIdx(i)}
                            className={cn(
                                'w-full text-left px-c-4 py-c-3 c-type-body transition-colors',
                                i === highlightIdx ? 'bg-c-brand-primary-surface' : 'hover:bg-c-ground-sunken'
                            )}
                        >
                            <span className="text-c-text-primary">{a.city}</span>
                            <span className="text-c-text-secondary"> · {a.name} </span>
                            <span className="text-c-brand-primary font-semibold">({a.iata})</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Date pill group ─────────────────────────────────────────────────────── */
function DatePills({ value, onChange }) {
    const today = todayIso();
    const tomorrow = tomorrowIso();
    const isToday = value === today;
    const isTomorrow = value === tomorrow;
    const isCustom = !!value && !isToday && !isTomorrow;
    const datePickerRef = useRef(null);

    const pillClass = (active) =>
        cn(
            'flex-1 h-11 rounded-c-pill c-type-footnote font-semibold transition-colors duration-c-fast',
            active
                ? 'bg-c-brand-primary text-c-text-inverse'
                : 'bg-c-ground-sunken text-c-text-secondary hover:text-c-text-primary'
        );

    const openNativePicker = () => {
        const el = datePickerRef.current;
        if (!el) return;
        // showPicker is the reliable way on iOS Safari + modern Chrome/Edge.
        // Fallback: focus + click for older browsers (Firefox).
        if (typeof el.showPicker === 'function') {
            try { el.showPicker(); return; } catch { /* fall through */ }
        }
        el.focus();
        el.click();
    };

    return (
        <div className="flex items-center gap-c-2">
            <button type="button" className={pillClass(isToday)} onClick={() => onChange(today)}>
                Today
            </button>
            <button type="button" className={pillClass(isTomorrow)} onClick={() => onChange(tomorrow)}>
                Tomorrow
            </button>
            <button
                type="button"
                className={cn(pillClass(isCustom), 'inline-flex items-center justify-center relative')}
                onClick={openNativePicker}
                aria-label="Pick a date"
            >
                {isCustom ? formatFriendlyDate(value) : 'Pick a date'}
                {/* Hidden but focusable — visibility: hidden (not display: none)
                   keeps the element in the accessibility tree so showPicker() and
                   click() succeed on iOS Safari and older browsers. */}
                <input
                    ref={datePickerRef}
                    type="date"
                    min={today}
                    value={isCustom ? value : ''}
                    onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        opacity: 0,
                        pointerEvents: 'none',
                        left: '50%',
                        bottom: 0,
                    }}
                />
            </button>
        </div>
    );
}

/* ── Search screen ───────────────────────────────────────────────────────── */
export default function Search() {
    const navigate = useNavigate();
    const { display_name, isAuthenticated, token, login } = useAuth();

    // Hydrate from sessionStorage (set by prior interactions in this flow).
    // Falls back to defaults when the key is missing or JSON is corrupted.
    const [mode, setMode] = useState(() => {
        const h = loadSearchState();
        return h?.mode === 'flight' ? 'flight_number' : 'route';
    }); // 'route' | 'flight_number'
    const [origin, setOrigin] = useState(() => loadSearchState()?.from?.iata || '');
    const [destination, setDestination] = useState(() => loadSearchState()?.to?.iata || '');
    const [flightNumber, setFlightNumber] = useState(() => loadSearchState()?.flightNumber || '');
    const [departureDate, setDepartureDate] = useState(() => resolveStoredDate(loadSearchState()?.date));
    const [tabValue, setTabValue] = useState('search');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [authOpen, setAuthOpen] = useState(false);

    // Persist form state on every change so Flight Selection → back restores
    // the user's inputs. Cleared by Engine when a trip is tracked (Task 7.3).
    useEffect(() => {
        saveSearchState({
            mode: mode === 'flight_number' ? 'flight' : 'route',
            from: airportInfo(origin),
            to: airportInfo(destination),
            flightNumber,
            date: serializeDate(departureDate),
        });
    }, [mode, origin, destination, flightNumber, departureDate]);

    const flightNumberValid =
        FLIGHT_NUMBER_REGEX.test(flightNumber.trim().toUpperCase().replace(/\s+/g, ' '));
    const canSubmit =
        !searching && (
            mode === 'route'
                ? !!origin && !!destination && !!departureDate
                : flightNumberValid && !!departureDate
        );

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSearching(true);
        setSearchError(null);
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            let url;
            let lookupMode;
            let cleanedFlightNumber = '';
            if (mode === 'route') {
                const params = new URLSearchParams({ origin, destination, date: departureDate });
                url = `${API_BASE}/v1/flights/search?${params}`;
                lookupMode = 'route';
            } else {
                cleanedFlightNumber = flightNumber.trim().toUpperCase().replace(/\s+/g, '');
                url = `${API_BASE}/v1/flights/${encodeURIComponent(cleanedFlightNumber)}/${departureDate}`;
                lookupMode = 'flight_number';
            }
            const res = await fetch(url, { headers: authHeaders });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setSearchError(data?.detail || 'Could not look up flights. Please try again.');
                setSearching(false);
                return;
            }
            const data = await res.json();
            const flights = mapFlights(data.flights || []);
            const fromSearch = lookupMode === 'route'
                ? { mode: 'route', routeOrigin: origin, routeDestination: destination, departureDate, flights }
                : { mode: 'flight_number', flightNumber: cleanedFlightNumber, departureDate, flights };
            navigate(createPageUrl('Engine'), { state: { newTrip: true, fromSearch } });
        } catch (err) {
            console.error('Search failed:', err);
            setSearchError('Network error — please check your connection and try again.');
            setSearching(false);
        }
    };

    const handleAvatarTap = () => {
        if (isAuthenticated) navigate(createPageUrl('Settings'));
        else setAuthOpen(true);
    };
    const avatarInitials = initials(display_name) || '👤';

    const tabs = [
        {
            value: 'search',
            label: 'Search',
            icon: <MagnifyingGlass size={22} weight="regular" />,
            iconActive: <MagnifyingGlass size={22} weight="bold" />,
        },
        {
            value: 'trip',
            label: 'My Trip',
            icon: <Airplane size={22} weight="regular" />,
            iconActive: <Airplane size={22} weight="bold" />,
        },
        {
            value: 'settings',
            label: 'Settings',
            icon: <Gear size={22} weight="regular" />,
            iconActive: <Gear size={22} weight="bold" />,
        },
    ];

    const handleTabChange = (value) => {
        setTabValue(value);
        if (value === 'trip') navigate(createPageUrl('Trips'));
        else if (value === 'settings') navigate(createPageUrl('Settings'));
    };

    return (
        <div className="min-h-screen bg-c-ground font-c-sans text-c-text-primary">
            <TopBar
                variant="translucent"
                align="left"
                leftSlot={
                    <div className="flex items-center gap-c-2">
                        <div className="w-8 h-8 rounded-c-sm bg-c-brand-primary flex items-center justify-center">
                            <Airplane size={18} weight="bold" className="text-c-text-inverse" />
                        </div>
                        <span className="c-type-headline text-c-text-primary">AirBridge</span>
                    </div>
                }
                rightSlot={
                    isAuthenticated ? (
                        <button
                            type="button"
                            onClick={handleAvatarTap}
                            aria-label="Settings"
                            className="w-9 h-9 rounded-c-pill bg-c-brand-primary text-c-text-inverse c-type-footnote font-bold flex items-center justify-center hover:bg-c-brand-primary-hover transition-colors"
                        >
                            {avatarInitials}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleAvatarTap}
                            aria-label="Sign in"
                            className="h-9 px-c-4 rounded-c-pill bg-c-brand-primary text-c-text-inverse c-type-footnote font-semibold hover:bg-c-brand-primary-hover transition-colors"
                        >
                            Sign in
                        </button>
                    )
                }
            />

            {/* US-only badge */}
            <div className="px-c-6 pt-c-4">
                <StatusPill tone="neutral">🇺🇸 US domestic flights only</StatusPill>
            </div>

            {/* Content */}
            <main className="px-c-6 pt-c-8 pb-40 max-w-2xl mx-auto">
                <Card padding="lg">
                    <h1 className="c-type-title text-c-text-primary">Start your journey</h1>
                    <p className="c-type-body text-c-text-secondary mt-c-1">Never miss a flight again</p>

                    <div className="mt-c-6 space-y-c-4">
                        {mode === 'route' ? (
                            <>
                                <AirportField
                                    label="From"
                                    placeholder="Origin airport (e.g. SFO)"
                                    value={origin}
                                    onChange={setOrigin}
                                />
                                <AirportField
                                    label="To"
                                    placeholder="Destination airport (e.g. LAX)"
                                    value={destination}
                                    onChange={setDestination}
                                />
                            </>
                        ) : (
                            <div>
                                <span className="c-type-caption text-c-text-secondary block mb-c-2">Flight number</span>
                                <div className="flex items-center gap-c-3 h-14 px-c-4 bg-c-ground-sunken border border-c-border-hairline rounded-c-md focus-within:border-c-border-strong transition-colors duration-c-fast">
                                    <Airplane size={22} weight="regular" className="text-c-text-tertiary shrink-0" />
                                    <input
                                        type="text"
                                        value={flightNumber}
                                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                                        placeholder="UA 300"
                                        autoCapitalize="characters"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        className="flex-1 bg-transparent outline-none c-type-display text-c-text-primary placeholder:text-c-text-tertiary tracking-tight"
                                        style={{ fontSize: '32px' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-c-4">
                        <DatePills value={departureDate} onChange={setDepartureDate} />
                    </div>

                    {searchError && (
                        <div className="mt-c-4 p-c-3 rounded-c-md bg-c-urgency-surface border border-c-urgency/20">
                            <p className="c-type-footnote text-c-urgency">{searchError}</p>
                        </div>
                    )}

                    <div className="mt-c-6">
                        <Button
                            variant="primary"
                            full
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                            leftIcon={<MagnifyingGlass size={18} weight="bold" />}
                        >
                            {searching ? 'Searching…' : 'Search flights'}
                        </Button>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setMode((m) => (m === 'route' ? 'flight_number' : 'route'))
                        }
                        className="mt-c-4 w-full inline-flex items-center justify-center gap-c-1 c-type-headline text-c-brand-primary hover:text-c-brand-primary-hover transition-colors"
                    >
                        {mode === 'route'
                            ? 'Have a flight number? Enter it directly'
                            : 'Search by route instead'}
                        <ArrowRight size={18} weight="bold" />
                    </button>
                </Card>
            </main>

            <TabBar value={tabValue} onChange={handleTabChange} tabs={tabs} />

            <AuthModal
                open={authOpen}
                onOpenChange={setAuthOpen}
                onSuccess={(data) => {
                    login(data);
                    setAuthOpen(false);
                }}
            />
        </div>
    );
}
