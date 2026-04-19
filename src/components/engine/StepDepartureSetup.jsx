import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, Bus as BusIcon, Shield, Rocket, MapPin, NavigationArrow,
    WarningCircle,
} from '@phosphor-icons/react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import TopBar from '@/components/design-system/TopBar';
import Button from '@/components/design-system/Button';
import { loadGoogleMaps, reverseGeocode, getCurrentPosition } from '@/utils/geocode';
import { formatLocalTime } from '@/utils/format';

/* ── Persisted Setup state (sessionStorage) ─────────────────────────────
   Mirrors Task 7.3's airbridge_search_state: written on every input
   change, hydrated on mount, cleared only when the trip is submitted
   (parent calls clearSetupState() after successful Recalculate/Track).
*/
const SETUP_STATE_KEY = 'airbridge_setup_state';

function loadSetupState() {
    try {
        const raw = sessionStorage.getItem(SETUP_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch { return null; }
}

function saveSetupState(state) {
    try { sessionStorage.setItem(SETUP_STATE_KEY, JSON.stringify(state)); }
    catch { /* quota / private mode — ignore */ }
}

export function clearSetupState() {
    try { sessionStorage.removeItem(SETUP_STATE_KEY); } catch { /* ignore */ }
}

/* ── Transport card definitions ─────────────────────────────────────────
   The brief §4.4 shows four cards: Uber, Lyft, Public transit, Drive.
   Uber/Lyft both persist as transport='rideshare' backend-side; the
   provider chip is UI-only and captured in sessionStorage for
   continuity. Public transit maps to 'train' (Bay Area BART/rail tilt);
   flagged as a judgment call in the report.
*/
const TRANSPORT_CARDS = [
    { id: 'uber',    icon: Car,     label: 'Uber',           subtitle: 'Rideshare' },
    { id: 'lyft',    icon: Car,     label: 'Lyft',           subtitle: 'Rideshare' },
    { id: 'transit', icon: BusIcon, label: 'Public transit', subtitle: 'Bus, BART, rail' },
    { id: 'drive',   icon: Car,     label: 'Drive',          subtitle: '+~10 min parking' },
];

function cardIdFor(transport, rideshareProvider) {
    if (transport === 'rideshare') return rideshareProvider === 'lyft' ? 'lyft' : 'uber';
    if (transport === 'driving') return 'drive';
    if (transport === 'train' || transport === 'bus') return 'transit';
    return null;
}

function applyCardSelection(cardId) {
    switch (cardId) {
        case 'uber':    return { transport: 'rideshare', rideshareProvider: 'uber' };
        case 'lyft':    return { transport: 'rideshare', rideshareProvider: 'lyft' };
        case 'transit': return { transport: 'train',     rideshareProvider: null };
        case 'drive':   return { transport: 'driving',   rideshareProvider: null };
        default:        return null;
    }
}

export default function StepDepartureSetup({
    selectedFlight, flightNumber,
    startingAddress, setStartingAddress,
    addressError, setAddressError,
    addressContainerRef, addressInputRef,
    transport, setTransport,
    hasPrecheck, setHasPrecheck,
    setHasClear, setHasPriorityLane, // write-only: forced off to stay PreCheck/None (rule 17)
    bagCount, setBagCount,
    withChildren, setWithChildren,
    currentTripId, isSubmitting,
    apiError, setApiError,
    onRecalculate, onBack,
}) {
    const navigate = useNavigate();

    // Hydrate once from sessionStorage. A non-null hydration ref also
    // suppresses the persist effect from firing on the hydration-driven
    // state change (otherwise we'd stomp whatever the parent just fed us).
    const hydratedOnceRef = useRef(false);
    const [rideshareProvider, setRideshareProvider] = useState('uber');
    const [geolocation, setGeolocation] = useState({
        loading: false,
        denied: false,
        error: null,
    });

    useEffect(() => {
        if (hydratedOnceRef.current) return;
        hydratedOnceRef.current = true;
        const saved = loadSetupState();
        if (!saved) return;
        if (typeof saved.address === 'string' && saved.address && !startingAddress) {
            setStartingAddress(saved.address);
        }
        if (saved.transport && saved.transport !== transport) {
            setTransport(saved.transport);
        }
        if (saved.rideshareProvider === 'uber' || saved.rideshareProvider === 'lyft') {
            setRideshareProvider(saved.rideshareProvider);
        }
        if (saved.security === 'precheck') {
            setHasPrecheck(true); setHasClear(false); setHasPriorityLane(false);
        } else if (saved.security === 'none') {
            setHasPrecheck(false); setHasClear(false); setHasPriorityLane(false);
        }
        if (typeof saved.bags === 'boolean') {
            setBagCount(saved.bags ? 1 : 0);
        }
        if (typeof saved.children === 'boolean') {
            setWithChildren(saved.children);
        }
        if (saved.geolocationDenied) {
            setGeolocation((g) => ({ ...g, denied: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Security: derive the UI choice from the parent's 3-boolean state
    // (brief rule 17 restricts v1 to precheck | none — CLEAR / Priority
    // get forced off on any security change).
    const security = hasPrecheck ? 'precheck' : 'none';
    const setSecurity = (value) => {
        setHasClear(false);
        setHasPriorityLane(false);
        setHasPrecheck(value === 'precheck');
    };

    // Bags: toggle mirrors bagCount>0 (rule 18: always a toggle, never a
    // stepper). Any non-zero count reads as "on"; flipping on writes
    // bagCount=1 so the existing buildPreferences() payload stays happy.
    const bags = bagCount > 0;
    const setBags = (on) => setBagCount(on ? 1 : 0);

    // Persist on any form-state change, but skip the initial render so we
    // don't stomp the hydrated values before the parent's setters commit.
    useEffect(() => {
        if (!hydratedOnceRef.current) return;
        saveSetupState({
            address: startingAddress,
            transport,
            rideshareProvider,
            security,
            bags,
            children: withChildren,
            geolocationDenied: geolocation.denied,
        });
    }, [startingAddress, transport, rideshareProvider, security, bags, withChildren, geolocation.denied]);

    const hasAddress = startingAddress.trim().length > 0;
    const isCancelled = !!selectedFlight?.canceled;
    const canSubmit = !isSubmitting && hasAddress && !isCancelled;

    // Flight identifier subtitle: "UA 300 · SFO → LAX · 8:49 AM"
    const flightSubtitle = useMemo(() => {
        if (!selectedFlight) return flightNumber?.toUpperCase() || '';
        const num = (flightNumber || selectedFlight.flight_number || '').toUpperCase();
        const origin = selectedFlight.origin_code || '';
        const dest = selectedFlight.destination_code || '';
        const time = formatLocalTime(selectedFlight.departure_time);
        return [num, origin && dest ? `${origin} → ${dest}` : '', time]
            .filter(Boolean)
            .join(' · ');
    }, [selectedFlight, flightNumber]);

    const selectedCardId = cardIdFor(transport, rideshareProvider);

    const handleCardTap = (cardId) => {
        const next = applyCardSelection(cardId);
        if (!next) return;
        setTransport(next.transport);
        if (next.rideshareProvider !== null) {
            setRideshareProvider(next.rideshareProvider);
        }
    };

    const handleUseCurrentLocation = async () => {
        if (geolocation.loading) return;
        setGeolocation({ loading: true, denied: false, error: null });
        try {
            // Pre-warm the Maps SDK so the reverse-geocode right after
            // position resolves without a visible extra delay.
            loadGoogleMaps().catch(() => {});
            const pos = await getCurrentPosition();
            const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            setStartingAddress(address);
            setAddressError(null);
            setGeolocation({ loading: false, denied: false, error: null });
        } catch (err) {
            // GeolocationPositionError.code 1 = PERMISSION_DENIED
            const denied = err?.code === 1 || /denied|permission/i.test(err?.message || '');
            setGeolocation({
                loading: false,
                denied,
                error: denied ? null : (err?.message || 'Could not get your location'),
            });
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto -mx-4">
            <TopBar title="Departure setup" onBack={onBack} />

            {/* Flight subtitle strip — the DS TopBar intentionally doesn't
                stack a subtitle inside its 56px shell (brief §2.4 keeps
                the bar single-line), so the "UA 300 · SFO → LAX · 8:49
                AM" line sits directly below, visually tied to it. */}
            {flightSubtitle && (
                <div className="border-b border-c-border-hairline bg-c-ground px-c-4 py-c-2">
                    <p className="c-type-footnote text-c-text-secondary text-center">{flightSubtitle}</p>
                </div>
            )}

            <div className="px-c-6 pb-c-12 pt-c-6 space-y-c-8">

                {/* Cancelled flight banner — blocks the entire form */}
                {isCancelled && (
                    <div className="rounded-c-lg bg-c-urgency-surface border border-c-urgency/30 p-c-5">
                        <div className="flex items-start gap-c-3">
                            <WarningCircle size={24} weight="fill" className="text-c-urgency shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h3 className="c-type-headline text-c-urgency">This flight has been cancelled.</h3>
                                <p className="c-type-body text-c-text-primary mt-c-1">
                                    We can't plan a journey for a flight that isn't happening. You may want to search for an alternative.
                                </p>
                                <div className="mt-c-4">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => navigate('/', { replace: true })}
                                    >
                                        Search for alternatives
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {apiError && !isCancelled && (
                    <div className="rounded-c-md bg-c-urgency-surface border border-c-urgency/30 p-c-4 flex items-start gap-c-3">
                        <WarningCircle size={20} weight="regular" className="text-c-urgency shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="c-type-footnote text-c-urgency">{apiError}</p>
                            <button
                                type="button"
                                onClick={() => setApiError(null)}
                                className="c-type-footnote text-c-urgency underline mt-c-1"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {!isCancelled && (
                    <>
                        {/* ── Section 1: Address ───────────────────────── */}
                        <section>
                            <h2 className="c-type-headline text-c-text-primary mb-c-3">
                                <span aria-hidden="true">📍 </span>Where are you leaving from?
                            </h2>
                            <PlacesInput
                                ref={addressInputRef}
                                containerRef={addressContainerRef}
                                value={startingAddress}
                                onChange={(v) => { setStartingAddress(v); setAddressError(null); }}
                                hasError={!!addressError}
                                placeholder="Enter your departure address"
                            />
                            {addressError && (
                                <p className="c-type-footnote text-c-urgency mt-c-2">{addressError}</p>
                            )}
                            <div className="mt-c-3 flex items-center gap-c-2">
                                <button
                                    type="button"
                                    onClick={handleUseCurrentLocation}
                                    disabled={geolocation.loading}
                                    className={cn(
                                        'inline-flex items-center gap-c-1 c-type-footnote font-medium text-c-brand-primary',
                                        'hover:text-c-brand-primary-hover transition-colors',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2 rounded-c-xs',
                                        geolocation.loading && 'opacity-60 cursor-wait'
                                    )}
                                >
                                    <NavigationArrow size={14} weight="fill" />
                                    {geolocation.loading ? 'Getting your location…' : 'Use my current location'}
                                </button>
                            </div>
                            {geolocation.denied && (
                                <p className="c-type-footnote text-c-text-secondary mt-c-2">
                                    Location access denied. Enter your address above.
                                </p>
                            )}
                            {geolocation.error && (
                                <p className="c-type-footnote text-c-urgency mt-c-2">{geolocation.error}</p>
                            )}
                        </section>

                        {/* ── Section 2: Transport ─────────────────────── */}
                        <section>
                            <h2 className="c-type-headline text-c-text-primary mb-c-3">
                                <span aria-hidden="true">🚗 </span>How are you getting there?
                            </h2>
                            <div className="grid grid-cols-2 gap-c-3">
                                {TRANSPORT_CARDS.map((card) => {
                                    const active = selectedCardId === card.id;
                                    const Icon = card.icon;
                                    return (
                                        <button
                                            key={card.id}
                                            type="button"
                                            onClick={() => handleCardTap(card.id)}
                                            aria-pressed={active}
                                            className={cn(
                                                'flex flex-col items-start gap-c-2 p-c-4 rounded-c-md border transition-colors text-left min-h-[88px]',
                                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2',
                                                active
                                                    ? 'bg-c-brand-primary-surface border-c-brand-primary'
                                                    : 'bg-c-ground-elevated border-c-border-hairline hover:border-c-border-strong'
                                            )}
                                        >
                                            <Icon
                                                size={22}
                                                weight={active ? 'fill' : 'regular'}
                                                className={active ? 'text-c-brand-primary' : 'text-c-text-secondary'}
                                            />
                                            <div className="min-w-0">
                                                <p className={cn(
                                                    'c-type-body font-semibold',
                                                    active ? 'text-c-brand-primary' : 'text-c-text-primary'
                                                )}>
                                                    {card.label}
                                                </p>
                                                <p className="c-type-footnote text-c-text-secondary truncate">
                                                    {card.subtitle}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── Section 3: Security ──────────────────────── */}
                        <section>
                            <h2 className="c-type-headline text-c-text-primary mb-c-3">
                                <span aria-hidden="true">🛡 </span>Security access
                            </h2>
                            <div className="space-y-c-3">
                                <SecurityOption
                                    active={security === 'precheck'}
                                    onClick={() => setSecurity('precheck')}
                                    title="TSA PreCheck"
                                    subtitle="Dedicated fast lane"
                                    badge="Saves ~15 min"
                                />
                                <SecurityOption
                                    active={security === 'none'}
                                    onClick={() => setSecurity('none')}
                                    title="None"
                                    subtitle="Standard security lane"
                                />
                            </div>
                        </section>

                        {/* ── Section 4: Bags toggle ───────────────────── */}
                        <section>
                            <ToggleRow
                                title="Checking bags?"
                                subtitle="Joining the check-in line · Wait time varies"
                                checked={bags}
                                onCheckedChange={setBags}
                            />
                        </section>

                        {/* ── Section 5: Children toggle ───────────────── */}
                        <section>
                            <ToggleRow
                                title="Traveling with children"
                                subtitle="Adjusts walking pace at airport"
                                checked={withChildren}
                                onCheckedChange={setWithChildren}
                            />
                        </section>

                        {/* ── Primary CTA ──────────────────────────────── */}
                        <div className="pt-c-2">
                            <Button
                                variant="primary"
                                full
                                disabled={!canSubmit}
                                onClick={onRecalculate}
                                leftIcon={<Rocket size={18} weight="fill" />}
                            >
                                {isSubmitting ? 'Planning your trip…' : currentTripId ? 'Update my trip' : 'Start my trip'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Security option card ─────────────────────────────────────────────── */
function SecurityOption({ active, onClick, title, subtitle, badge }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'w-full flex items-center gap-c-3 p-c-4 rounded-c-md border transition-colors text-left',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2',
                active
                    ? 'bg-c-brand-primary-surface border-c-brand-primary'
                    : 'bg-c-ground-elevated border-c-border-hairline hover:border-c-border-strong'
            )}
        >
            <Shield
                size={22}
                weight={active ? 'fill' : 'regular'}
                className={active ? 'text-c-brand-primary' : 'text-c-text-secondary'}
            />
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'c-type-body font-semibold',
                    active ? 'text-c-brand-primary' : 'text-c-text-primary'
                )}>{title}</p>
                <p className="c-type-footnote text-c-text-secondary truncate">{subtitle}</p>
            </div>
            {badge && (
                <span className="shrink-0 inline-flex items-center px-c-2 py-c-1 rounded-c-pill bg-c-confidence-surface text-c-confidence c-type-footnote font-semibold">
                    {badge}
                </span>
            )}
        </button>
    );
}

/* ── Generic labelled toggle row ──────────────────────────────────────── */
function ToggleRow({ title, subtitle, checked, onCheckedChange }) {
    return (
        <label className="flex items-center gap-c-4 p-c-4 rounded-c-md bg-c-ground-elevated border border-c-border-hairline cursor-pointer">
            <div className="flex-1 min-w-0">
                <p className="c-type-body font-semibold text-c-text-primary">{title}</p>
                <p className="c-type-footnote text-c-text-secondary mt-c-1">{subtitle}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    );
}

/* ── DS-styled Google Places autocomplete ─────────────────────────────── */
/* Sunken input shell + floating result list. The Places session/token +
   prediction logic is the same shape as AddressAutocomplete.jsx; only
   the surface is themed to Concourse tokens per brief §4.4. */
const PlacesInput = React.forwardRef(function PlacesInput(
    { value, onChange, placeholder, hasError, containerRef },
    ref
) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [highlightIdx, setHighlightIdx] = useState(0);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const serviceRef = useRef(null);
    const sessionTokenRef = useRef(null);
    const debounceRef = useRef(null);

    React.useImperativeHandle(ref, () => inputRef.current, []);
    // Let the parent keep its existing scrollIntoView target.
    React.useImperativeHandle(containerRef, () => wrapperRef.current, []);

    useEffect(() => {
        loadGoogleMaps()
            .then(() => {
                serviceRef.current = new window.google.maps.places.AutocompleteService();
                sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
            })
            .catch(() => { /* places unavailable — user can still type */ });
    }, []);

    useEffect(() => {
        function handleClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function fetchPredictions(input) {
        if (!serviceRef.current || !input.trim()) { setResults([]); return; }
        serviceRef.current.getPlacePredictions(
            {
                input,
                componentRestrictions: { country: 'us' },
                sessionToken: sessionTokenRef.current,
            },
            (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setResults(predictions.slice(0, 5));
                } else {
                    setResults([]);
                }
            }
        );
    }

    function handleInputChange(e) {
        const text = e.target.value;
        setQuery(text);
        setOpen(true);
        setHighlightIdx(0);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPredictions(text), 200);
    }

    function handleSelect(prediction) {
        onChange(prediction.description);
        setQuery('');
        setOpen(false);
        setResults([]);
        if (window.google?.maps?.places) {
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
    }

    function handleClear() {
        onChange('');
        setQuery('');
        setResults([]);
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
            <div
                className={cn(
                    'flex items-center gap-c-2 bg-c-ground-sunken rounded-c-md border border-c-border-hairline px-c-3 h-12',
                    'focus-within:border-c-border-strong transition-colors duration-c-fast',
                    hasError && 'border-c-urgency'
                )}
            >
                <MapPin size={18} weight="regular" className="shrink-0 text-c-text-tertiary" />
                {value ? (
                    <>
                        <span className="flex-1 c-type-body text-c-text-primary truncate">{value}</span>
                        <button
                            type="button"
                            onClick={handleClear}
                            aria-label="Clear address"
                            className="shrink-0 w-8 h-8 -mr-c-1 flex items-center justify-center rounded-c-pill text-c-text-tertiary hover:text-c-text-primary hover:bg-c-ground-elevated transition-colors"
                        >
                            ×
                        </button>
                    </>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => { if (query.trim() && results.length) setOpen(true); }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent outline-none c-type-body text-c-text-primary placeholder:text-c-text-tertiary"
                        autoComplete="off"
                    />
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-30 mt-c-2 w-full bg-c-ground-elevated border border-c-border-hairline rounded-c-md shadow-c-lg overflow-hidden">
                    {results.map((p, i) => {
                        const main = p.structured_formatting?.main_text || p.description;
                        const secondary = p.structured_formatting?.secondary_text || '';
                        return (
                            <button
                                key={p.place_id}
                                type="button"
                                onMouseDown={() => handleSelect(p)}
                                onMouseEnter={() => setHighlightIdx(i)}
                                className={cn(
                                    'w-full text-left px-c-4 py-c-3 c-type-body transition-colors',
                                    i === highlightIdx ? 'bg-c-brand-primary-surface' : 'hover:bg-c-ground-sunken'
                                )}
                            >
                                <span className="text-c-text-primary">{main}</span>
                                {secondary && <span className="text-c-text-secondary"> · {secondary}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
});
