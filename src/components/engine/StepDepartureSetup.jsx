import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, SteeringWheel, Train, Shield, Rocket, MapPin, NavigationArrow,
    WarningCircle, Timer, SuitcaseRolling, Baby, QrCode,
} from '@phosphor-icons/react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import TopBar from '@/components/design-system/TopBar';
import Button from '@/components/design-system/Button';
import SegmentedControl from '@/components/design-system/SegmentedControl';
import { loadGoogleMaps, reverseGeocode, getCurrentPosition } from '@/utils/geocode';
import { formatLocalTime } from '@/utils/format';

/* ── Persisted Setup state (sessionStorage) ─────────────────────────────
   Mirrors Task 7.3's airbridge_search_state. Shape updated in brief v2.4:
   rideshareProvider is gone (provider selection moves to Results/Active
   Trip); gateBuffer + hasBoardingPass are back; security is a 4-valued
   enum now (none | precheck | clear | clear_precheck).
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

/* ── Transport cards (brief v2.4 §4.4) ──────────────────────────────────
   Three options, distinct icons. Rideshare consolidates Uber/Lyft;
   provider pick moves to Results/Active Trip where it matters for the
   deep link. Public transit still maps backend-side to 'train' (Bay
   Area BART/rail tilt).
*/
const TRANSPORT_CARDS = [
    { id: 'rideshare', icon: Car,           label: 'Rideshare',      subtitle: 'Uber, Lyft, etc.' },
    { id: 'drive',     icon: SteeringWheel, label: 'Drive',          subtitle: '+~10 min parking' },
    { id: 'transit',   icon: Train,         label: 'Public transit', subtitle: 'Bus, BART, rail' },
];

function cardIdFor(transport) {
    if (transport === 'rideshare') return 'rideshare';
    if (transport === 'driving') return 'drive';
    if (transport === 'train' || transport === 'bus') return 'transit';
    return null;
}

function transportFor(cardId) {
    switch (cardId) {
        case 'rideshare': return 'rideshare';
        case 'drive':     return 'driving';
        case 'transit':   return 'train';
        default:          return null;
    }
}

/* ── Security — 4 options per brief v2.4 (rule 17 updated) ──────────── */
const SECURITY_OPTIONS = [
    { id: 'none',          title: 'None',             subtitle: 'Standard security lane' },
    { id: 'precheck',      title: 'TSA PreCheck',     subtitle: 'Dedicated fast lane',      badge: 'Saves ~15 min' },
    { id: 'clear',         title: 'CLEAR',            subtitle: 'Biometric fast lane',      badge: 'Saves ~15 min' },
    { id: 'clear_precheck',title: 'PreCheck + CLEAR', subtitle: 'Fastest combined lane',    badge: 'Saves ~20 min' },
];

// Map UI value ↔ parent's 3-boolean security state. Aligns with
// Engine.computeSecurityAccess() which already emits the same strings
// to the backend (hasPriorityLane is always forced false — brief v2.4
// still excludes it).
function securityIdFrom(hasPrecheck, hasClear) {
    if (hasPrecheck && hasClear) return 'clear_precheck';
    if (hasPrecheck) return 'precheck';
    if (hasClear) return 'clear';
    return 'none';
}

/* ── Gate buffer (brief v2.4 §4.4) ──────────────────────────────────── */
const GATE_BUFFER_PRESETS = [
    { value: 15, label: 'Tight · 15 min' },
    { value: 30, label: 'Comfortable · 30 min' },
    { value: 60, label: 'Relaxed · 60 min' },
];
const DEFAULT_GATE_BUFFER = 30;

export default function StepDepartureSetup({
    selectedFlight, flightNumber,
    startingAddress, setStartingAddress,
    addressError, setAddressError,
    addressContainerRef, addressInputRef,
    transport, setTransport,
    hasPrecheck, setHasPrecheck,
    hasClear, setHasClear,
    setHasPriorityLane, // write-only — brief v2.4 still excludes Priority Lane
    bagCount, setBagCount,
    withChildren, setWithChildren,
    hasBoardingPass, setHasBoardingPass,
    gateTime, setGateTime,
    currentTripId, isSubmitting,
    apiError, setApiError,
    onRecalculate, onBack,
}) {
    const navigate = useNavigate();

    const hydratedOnceRef = useRef(false);
    const [geolocation, setGeolocation] = useState({
        loading: false,
        denied: false,
        error: null,
    });

    // Snap incoming gateTime to the closest preset on mount so the
    // segmented control never shows an unselected state.
    useEffect(() => {
        const presetValues = GATE_BUFFER_PRESETS.map((p) => p.value);
        if (!presetValues.includes(gateTime)) {
            setGateTime(DEFAULT_GATE_BUFFER);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        if (['none', 'precheck', 'clear', 'clear_precheck'].includes(saved.security)) {
            setHasPriorityLane(false);
            setHasPrecheck(saved.security === 'precheck' || saved.security === 'clear_precheck');
            setHasClear(saved.security === 'clear' || saved.security === 'clear_precheck');
        }
        if (typeof saved.bags === 'boolean') {
            setBagCount(saved.bags ? 1 : 0);
        }
        if (typeof saved.children === 'boolean') {
            setWithChildren(saved.children);
        }
        if (typeof saved.hasBoardingPass === 'boolean') {
            setHasBoardingPass(saved.hasBoardingPass);
        }
        if (typeof saved.gateBuffer === 'number' && GATE_BUFFER_PRESETS.some((p) => p.value === saved.gateBuffer)) {
            setGateTime(saved.gateBuffer);
        }
        if (saved.geolocationDenied) {
            setGeolocation((g) => ({ ...g, denied: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Security UI value derived from the parent's (hasPrecheck, hasClear) pair.
    const security = securityIdFrom(hasPrecheck, hasClear);
    const setSecurity = (id) => {
        setHasPriorityLane(false);
        setHasPrecheck(id === 'precheck' || id === 'clear_precheck');
        setHasClear(id === 'clear' || id === 'clear_precheck');
    };

    // Bags toggle mirrors bagCount>0 (rule 18: always a toggle).
    const bags = bagCount > 0;
    const setBags = (on) => setBagCount(on ? 1 : 0);

    useEffect(() => {
        if (!hydratedOnceRef.current) return;
        saveSetupState({
            address: startingAddress,
            transport,
            security,
            bags,
            children: withChildren,
            hasBoardingPass,
            gateBuffer: gateTime,
            geolocationDenied: geolocation.denied,
        });
    }, [startingAddress, transport, security, bags, withChildren, hasBoardingPass, gateTime, geolocation.denied]);

    const hasAddress = startingAddress.trim().length > 0;
    const isCancelled = !!selectedFlight?.canceled;
    const canSubmit = !isSubmitting && hasAddress && !isCancelled;

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

    const selectedCardId = cardIdFor(transport);

    const handleCardTap = (cardId) => {
        const next = transportFor(cardId);
        if (next) setTransport(next);
    };

    const handleUseCurrentLocation = async () => {
        if (geolocation.loading) return;
        setGeolocation({ loading: true, denied: false, error: null });
        try {
            loadGoogleMaps().catch(() => {});
            const pos = await getCurrentPosition();
            const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            setStartingAddress(address);
            setAddressError(null);
            setGeolocation({ loading: false, denied: false, error: null });
        } catch (err) {
            const denied = err?.code === 1 || /denied|permission/i.test(err?.message || '');
            setGeolocation({
                loading: false,
                denied,
                error: denied ? null : (err?.message || 'Could not get your location'),
            });
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto -mx-4">
            <TopBar title="Departure setup" onBack={onBack} />

            {flightSubtitle && (
                <div className="border-b border-c-border-hairline bg-c-ground px-c-4 py-c-2">
                    <p className="c-type-footnote text-c-text-secondary text-center">{flightSubtitle}</p>
                </div>
            )}

            <div className="px-c-6 pb-c-12 pt-c-6 space-y-c-8">

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
                            <SectionHeading icon={MapPin}>Where are you leaving from?</SectionHeading>
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

                        {/* ── Section 2: Transport (3-card row) ────────── */}
                        <section>
                            <SectionHeading icon={Car}>How are you getting there?</SectionHeading>
                            <div className="grid grid-cols-3 gap-c-3">
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
                                                'flex flex-col items-start gap-c-2 p-c-4 rounded-c-md border transition-colors text-left min-h-[104px]',
                                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2',
                                                active
                                                    ? 'bg-c-brand-primary-surface border-c-brand-primary'
                                                    : 'bg-c-ground-elevated border-c-border-hairline hover:border-c-border-strong'
                                            )}
                                        >
                                            <Icon
                                                size={24}
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
                                                <p className="c-type-footnote text-c-text-secondary">
                                                    {card.subtitle}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── Section 3: Security (4 options) ──────────── */}
                        <section>
                            <SectionHeading icon={Shield}>Security access</SectionHeading>
                            <div className="space-y-c-3">
                                {SECURITY_OPTIONS.map((opt) => (
                                    <SecurityOption
                                        key={opt.id}
                                        active={security === opt.id}
                                        onClick={() => setSecurity(opt.id)}
                                        title={opt.title}
                                        subtitle={opt.subtitle}
                                        badge={opt.badge}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* ── Section 4: Gate buffer ───────────────────── */}
                        <section>
                            <SectionHeading icon={Timer}>How early at your gate?</SectionHeading>
                            <SegmentedControl
                                segments={GATE_BUFFER_PRESETS.map((p) => ({ value: String(p.value), label: p.label }))}
                                value={String(gateTime)}
                                onChange={(v) => setGateTime(Number(v))}
                                className="w-full"
                            />
                            <p className="c-type-footnote text-c-text-secondary mt-c-2">
                                Extra time at your gate before boarding begins.
                            </p>
                        </section>

                        {/* ── Section 5: Bags ──────────────────────────── */}
                        <section>
                            <ToggleRow
                                icon={SuitcaseRolling}
                                title="Checking bags?"
                                subtitle="Joining the check-in line · Wait time varies"
                                checked={bags}
                                onCheckedChange={setBags}
                            />
                        </section>

                        {/* ── Section 6: Children ──────────────────────── */}
                        <section>
                            <ToggleRow
                                icon={Baby}
                                title="Traveling with children"
                                subtitle="Adjusts walking pace at airport"
                                checked={withChildren}
                                onCheckedChange={setWithChildren}
                            />
                        </section>

                        {/* ── Section 7: Boarding pass ─────────────────── */}
                        <section>
                            <ToggleRow
                                icon={QrCode}
                                title="Mobile boarding pass ready?"
                                subtitle="Skip the check-in line if you already have one"
                                checked={hasBoardingPass}
                                onCheckedChange={setHasBoardingPass}
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

/* ── Section heading with Phosphor glyph (replaces emoji) ─────────────── */
function SectionHeading({ icon: Icon, children }) {
    return (
        <h2 className="c-type-headline text-c-text-primary mb-c-3 flex items-center gap-c-2">
            <Icon size={18} weight="regular" className="text-c-text-secondary shrink-0" />
            <span>{children}</span>
        </h2>
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

/* ── Generic labelled toggle row (now with optional Phosphor icon) ────── */
function ToggleRow({ icon: Icon, title, subtitle, checked, onCheckedChange }) {
    return (
        <label className="flex items-center gap-c-3 p-c-4 rounded-c-md bg-c-ground-elevated border border-c-border-hairline cursor-pointer">
            {Icon && (
                <Icon size={20} weight="regular" className="text-c-text-secondary shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <p className="c-type-body font-semibold text-c-text-primary">{title}</p>
                <p className="c-type-footnote text-c-text-secondary mt-c-1">{subtitle}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    );
}

/* ── DS-styled Google Places autocomplete ─────────────────────────────── */
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
