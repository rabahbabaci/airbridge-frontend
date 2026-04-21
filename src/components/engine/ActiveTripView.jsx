import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CaretLeft, DotsThree,
    House, Car, Train, Bus, Shield, SuitcaseRolling, Buildings,
    Airplane as AirplanePhosphor, MagnifyingGlass, Gear,
    Rocket, Check, Star, ArrowSquareOut,
} from '@phosphor-icons/react';
import { RefreshCw, Pencil, Settings as SettingsIcon } from 'lucide-react';

import { formatCountdownTextWithSeconds, formatLocalTime, formatDuration } from '@/utils/format';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE, GOOGLE_MAPS_API_KEY } from '@/config';
import { createPageUrl } from '@/utils';
import { loadGoogleMaps } from '@/utils/geocode';
import { cn } from '@/lib/utils';
import TabBar from '@/components/design-system/TabBar';
import AuthModal from '@/components/engine/AuthModal';
import useAuthGatedTabs from '@/hooks/useAuthGatedTabs';
import UntrackConfirmModal from './UntrackConfirmModal';
import airports from '@/data/airports.json';

/* ── Phase model ───────────────────────────────────────────────────────
   Active Trip has six screen states (brief §5). Backend state machine
   produces five of them as `trip.status`. The sixth — time-to-go — is
   a derived state: it's `active` plus "leave-by time is within 15 min."
   Demo override (?phase=…) bypasses both and forces any phase for
   stakeholder walk-throughs. */
const VALID_PHASES = ['active', 'time-to-go', 'en_route', 'at_airport', 'at_gate', 'complete'];

const PROGRESS_STEPS = [
    { key: 'at_home', label: 'At Home' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'at_airport', label: 'At Airport' },
    { key: 'at_gate', label: 'At Gate' },
];

function phaseToProgressIndex(phase) {
    switch (phase) {
        case 'en_route': return 1;
        case 'at_airport': return 2;
        case 'at_gate':
        case 'complete': return 3;
        default: return 0;
    }
}

function phaseTheme(phase) {
    return phase === 'active' ? 'light' : 'dark';
}

function airportCoords(iata) {
    if (!iata) return null;
    const a = airports.find(x => x.iata === iata);
    if (!a || a.lat == null || a.lng == null) return null;
    return { lat: a.lat, lng: a.lng };
}

function shortAddress(full) {
    if (!full) return '';
    const parts = full.split(',').map(s => s.trim());
    return parts.length > 1 ? parts[0] : full;
}

/* ── Light + dark Google Maps style. Hand-tuned to sit next to the
   Concourse warm-paper and navy grounds without fighting them. Kept
   minimal — we hide most POI + business layers so the polyline and
   markers are what the eye goes to. */
const LIGHT_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#F8F6F1' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6B7186' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#F8F6F1' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#EDE8DB' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#E5EDF5' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F0EDE6' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#D9D4C6' }] },
];

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#0B1220' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6B7186' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0B1220' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A2540' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A3550' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#070B14' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111A2E' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1F2940' }] },
];

/* ── Phase map — Google Maps JS SDK embed. Static (no gestures), styled
   per theme, draws a polyline from home to airport with pins at each.
   Re-renders when phase theme flips so the map style updates. */
// Module-level cache for Directions API responses. Keyed on
// origin + destination + travelMode. One route per trip is typical;
// theme flips and phase changes don't trigger a refetch.
const directionsCache = new Map();

function transportToTravelMode(transport, googleMaps) {
    const t = (transport || '').toLowerCase();
    if (!googleMaps) return null;
    if (t === 'train' || t === 'bus' || t === 'transit') return googleMaps.TravelMode.TRANSIT;
    // rideshare, driving, default
    return googleMaps.TravelMode.DRIVING;
}

function directionsCacheKey(homeCoords, airCoords, transport) {
    if (!homeCoords || !airCoords) return null;
    const t = (transport || '').toLowerCase();
    return `${homeCoords.lat.toFixed(5)},${homeCoords.lng.toFixed(5)}:${airCoords.lat.toFixed(5)},${airCoords.lng.toFixed(5)}:${t}`;
}

function PhaseMap({ theme, homeCoords, airportCoords: airCoords, transport, height, hidden }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const polylineRef = useRef(null);
    const markersRef = useRef([]);

    // Fetched driving / transit polyline from Google Directions API.
    // `null` while loading or after a failure — the render uses the
    // straight-line fallback in both cases.
    const [routePath, setRoutePath] = useState(null);

    // ── Fetch directions once per (origin, destination, transport).
    // Cached across mounts in the module-level directionsCache so
    // switching phases via URL param (which can remount the screen)
    // doesn't burn a fresh Directions call. */
    useEffect(() => {
        if (hidden) return;
        if (!GOOGLE_MAPS_API_KEY) return;
        if (!homeCoords || !airCoords) return;

        const cacheKey = directionsCacheKey(homeCoords, airCoords, transport);
        if (cacheKey && directionsCache.has(cacheKey)) {
            setRoutePath(directionsCache.get(cacheKey));
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                await loadGoogleMaps();
                if (cancelled) return;

                const g = window.google.maps;
                const travelMode = transportToTravelMode(transport, g);

                const service = new g.DirectionsService();
                service.route(
                    {
                        origin: homeCoords,
                        destination: airCoords,
                        travelMode,
                    },
                    (result, status) => {
                        if (cancelled) return;
                        if (status === 'OK' && result?.routes?.[0]?.overview_path) {
                            const path = result.routes[0].overview_path.map(p => ({
                                lat: p.lat(),
                                lng: p.lng(),
                            }));
                            if (cacheKey) directionsCache.set(cacheKey, path);
                            setRoutePath(path);
                        } else {
                            // Leaves routePath as null so the render falls back
                            // to the home→airport straight geodesic line.
                            console.warn('Directions lookup failed:', status);
                        }
                    }
                );
            } catch (err) {
                console.error('Directions init failed:', err);
            }
        })();

        return () => { cancelled = true; };
    }, [homeCoords, airCoords, transport, hidden]);

    useEffect(() => {
        if (hidden) return;
        if (!GOOGLE_MAPS_API_KEY) return;
        if (!containerRef.current) return;
        if (!homeCoords && !airCoords) return;

        let cancelled = false;
        (async () => {
            try {
                await loadGoogleMaps();
                if (cancelled) return;

                const g = window.google.maps;
                const isDark = theme === 'dark';
                const styles = isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

                if (!mapRef.current) {
                    mapRef.current = new g.Map(containerRef.current, {
                        center: homeCoords || airCoords,
                        zoom: 11,
                        disableDefaultUI: true,
                        gestureHandling: 'none',
                        keyboardShortcuts: false,
                        clickableIcons: false,
                        styles,
                    });
                } else {
                    mapRef.current.setOptions({ styles });
                }

                // Clear prior overlays
                if (polylineRef.current) {
                    polylineRef.current.setMap(null);
                    polylineRef.current = null;
                }
                markersRef.current.forEach(m => m.setMap(null));
                markersRef.current = [];

                const lineColor = isDark ? '#F4F3EF' : '#4F3FD3';

                // Prefer the real routed polyline from Directions; fall back
                // to a geodesic straight line when the API is unavailable or
                // still loading.
                const path = routePath && routePath.length > 0
                    ? routePath
                    : (homeCoords && airCoords ? [homeCoords, airCoords] : null);

                if (path) {
                    polylineRef.current = new g.Polyline({
                        path,
                        geodesic: !routePath,
                        strokeColor: lineColor,
                        strokeOpacity: 0.9,
                        strokeWeight: 5,
                        map: mapRef.current,
                    });
                }

                // Custom minimal markers — circle pins.
                const pin = (color) => ({
                    path: g.SymbolPath.CIRCLE,
                    fillColor: color,
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 3,
                    scale: 8,
                });

                if (homeCoords) {
                    markersRef.current.push(new g.Marker({
                        position: homeCoords,
                        map: mapRef.current,
                        icon: pin(isDark ? '#6855E8' : '#4F3FD3'),
                        title: 'Home',
                    }));
                }
                if (airCoords) {
                    markersRef.current.push(new g.Marker({
                        position: airCoords,
                        map: mapRef.current,
                        icon: pin(isDark ? '#2DD4B0' : '#0FB494'),
                        title: 'Airport',
                    }));
                }

                // Fit bounds to the route path when available so the zoom
                // level respects the actual drive, not just the endpoints.
                const boundsSource = routePath && routePath.length > 0 ? routePath : null;
                if (boundsSource) {
                    const bounds = new g.LatLngBounds();
                    boundsSource.forEach(pt => bounds.extend(pt));
                    mapRef.current.fitBounds(bounds, { top: 60, bottom: 100, left: 40, right: 40 });
                } else if (homeCoords && airCoords) {
                    const bounds = new g.LatLngBounds();
                    bounds.extend(homeCoords);
                    bounds.extend(airCoords);
                    mapRef.current.fitBounds(bounds, { top: 60, bottom: 100, left: 40, right: 40 });
                } else {
                    mapRef.current.setCenter(homeCoords || airCoords);
                }
            } catch (err) {
                console.error('Active Trip map failed to init:', err);
            }
        })();

        return () => { cancelled = true; };
    }, [theme, homeCoords, airCoords, hidden, routePath]);

    if (hidden) return null;

    const isDark = theme === 'dark';

    return (
        <div
            className="relative w-full overflow-hidden transition-colors duration-[600ms]"
            style={{ height: `${height}px`, backgroundColor: isDark ? '#0B1220' : '#F8F6F1' }}
        >
            {GOOGLE_MAPS_API_KEY && (homeCoords || airCoords) ? (
                <div ref={containerRef} className="absolute inset-0" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="c-type-caption text-c-text-tertiary">
                        {!GOOGLE_MAPS_API_KEY ? 'Map unavailable' : 'Locating route…'}
                    </span>
                </div>
            )}
            {/* Soft gradient at the bottom so the hero card lifts off the map cleanly. */}
            <div
                className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                style={{
                    background: isDark
                        ? 'linear-gradient(to bottom, rgba(11,18,32,0) 0%, rgba(11,18,32,0.85) 100%)'
                        : 'linear-gradient(to bottom, rgba(248,246,241,0) 0%, rgba(248,246,241,0.85) 100%)',
                }}
            />
        </div>
    );
}

/* ── Top bar — per brief §2.4. `dim` variant (time-to-go, en_route) has
   the background fade to transparent so just the chevron + flight id
   read on the navy ground. Other dark variants use a glass surface. */
function PhaseTopBar({ theme, phase, trip, selectedFlight, onBack, onMore, originCity, destCity }) {
    const isDim = phase === 'time-to-go' || phase === 'en_route';
    const isDark = theme === 'dark';

    const flightNumber = trip?.flight_number || selectedFlight?.flight_number || '';
    const route = selectedFlight?.origin_code && selectedFlight?.destination_code
        ? `${selectedFlight.origin_code} → ${selectedFlight.destination_code}`
        : (originCity && destCity ? `${originCity} → ${destCity}` : '');

    const textClass = isDark ? 'text-white' : 'text-c-text-primary';
    const surfaceClass = isDim
        ? 'bg-transparent'
        : isDark
            ? 'c-glass border-b border-[color:var(--c-glass-border)]'
            : 'c-glass border-b border-[color:var(--c-glass-border)]';

    return (
        <div
            className={cn(
                'absolute top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-c-4 transition-colors duration-[600ms]',
                surfaceClass
            )}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className={cn(
                    'w-10 h-10 rounded-c-pill flex items-center justify-center transition-colors',
                    textClass,
                    isDim ? 'hover:bg-white/10' : 'hover:bg-black/5'
                )}
            >
                <CaretLeft size={22} weight="bold" />
            </button>
            <div className={cn('flex-1 text-center px-c-2 min-w-0 truncate c-type-footnote font-semibold', textClass)}>
                {flightNumber}{route ? ` · ${route}` : ''}
            </div>
            <button
                type="button"
                onClick={onMore}
                aria-label="More options"
                className={cn(
                    'w-10 h-10 rounded-c-pill flex items-center justify-center transition-colors',
                    textClass,
                    isDim ? 'hover:bg-white/10' : 'hover:bg-black/5',
                    isDim ? 'opacity-60' : ''
                )}
            >
                <DotsThree size={24} weight="bold" />
            </button>
        </div>
    );
}

/* ── Progress bar — 4 connected dots mapping phase → step. Spec:
   - Completed phases render as solid filled brand-purple circles.
   - Current phase renders filled and pulses (brand purple on most
     phases, urgency red on time-to-go).
   - Future phases render as hollow outlined dots on a hairline
     stroke.
   - Connector hairline between every dot, filled brand-purple for the
     legs that are already behind the user.
   - Label under each dot: tertiary for future phases, primary +
     semibold for the current. */
function ProgressDots({ phase }) {
    const idx = phaseToProgressIndex(phase);
    const isComplete = phase === 'complete';
    const isTimeToGo = phase === 'time-to-go';

    return (
        <div className="flex items-start justify-between gap-c-2">
            {PROGRESS_STEPS.map((step, i) => {
                const isFilled = isComplete || i < idx;
                const isCurrent = !isComplete && i === idx;
                const showUrgent = isTimeToGo && isCurrent;
                const isGateFinal = isComplete && i === PROGRESS_STEPS.length - 1;

                return (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-c-1 shrink-0">
                            {/* Dot */}
                            <div
                                className={cn(
                                    'relative w-5 h-5 rounded-c-pill flex items-center justify-center transition-colors duration-[600ms]',
                                    isGateFinal
                                        ? 'bg-c-confidence'
                                        : isFilled
                                            ? 'bg-c-brand-primary'
                                            : isCurrent && showUrgent
                                                ? 'bg-c-urgency animate-phase-pulse'
                                                : isCurrent
                                                    ? 'bg-c-brand-primary animate-phase-pulse'
                                                    : 'bg-transparent border-2 border-c-border-hairline'
                                )}
                            >
                                {isGateFinal && (
                                    <Check size={12} weight="bold" className="text-white" />
                                )}
                            </div>
                            {/* Label */}
                            <span
                                className={cn(
                                    'c-type-caption transition-colors duration-[600ms] whitespace-nowrap',
                                    isCurrent
                                        ? 'text-c-text-primary font-semibold'
                                        : isFilled
                                            ? 'text-c-text-secondary font-medium'
                                            : 'text-c-text-tertiary font-medium'
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                        {/* Connector between dots — filled if the preceding
                           leg is complete, hairline if upcoming. Aligned
                           with the dot centre-y (dot is w-5 h-5 = 20px,
                           centre at 10px; mt-[9px] places the 2px line on
                           the centreline).*/}
                        {i < PROGRESS_STEPS.length - 1 && (
                            <div
                                className={cn(
                                    'flex-1 h-0.5 mt-[9px] transition-colors duration-[600ms]',
                                    i < idx || isComplete
                                        ? 'bg-c-brand-primary'
                                        : 'bg-c-border-hairline'
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

/* ── Phase content — per-phase hero + body. Kept as one component with
   a switch so the state-to-screen mapping is all visible in one place. */
function PhaseContent({
    phase, trip, recommendation, selectedFlight, transport, homeAddress,
    countdownText, bufferMinutes, boardingTime, destinationCity,
    onBook, onEditPrefs, onUntrack, onOpenFeedback,
}) {
    const terminal = selectedFlight?.departure_terminal;
    const gate = selectedFlight?.departure_gate;
    const depTime = selectedFlight?.departure_time ? formatLocalTime(selectedFlight.departure_time) : '';
    const flightNumber = trip?.flight_number || '';

    // ── active (planning, light theme)
    if (phase === 'active') {
        return (
            <>
                <div className="c-type-caption text-c-brand-primary font-semibold uppercase tracking-wider mb-c-2">LEAVE AT</div>
                <p className="c-type-hero text-c-brand-primary tabular-nums leading-none">
                    {countdownText || '—'}
                </p>
                {terminal && (
                    <p className="c-type-footnote text-c-text-secondary mt-c-3">
                        On your way to{' '}
                        <span className="font-semibold text-c-text-primary">Terminal {terminal}</span>
                    </p>
                )}
                <div className="mt-c-5">
                    <ActiveTimeline
                        recommendation={recommendation}
                        selectedFlight={selectedFlight}
                        transport={transport}
                        homeAddress={homeAddress}
                    />
                </div>
                <div className="mt-c-5 flex flex-wrap gap-c-2">
                    <button
                        type="button"
                        onClick={onBook}
                        className="flex-1 min-w-[180px] h-12 rounded-c-md bg-c-brand-primary text-white c-type-footnote font-semibold hover:bg-c-brand-primary-hover transition-colors"
                    >
                        {transport === 'driving' ? 'Start navigation' : 'Book your ride'}
                    </button>
                    <button
                        type="button"
                        onClick={onEditPrefs}
                        className="h-12 px-c-4 rounded-c-md bg-c-ground-elevated border border-c-border-hairline c-type-footnote font-medium text-c-text-primary hover:bg-c-ground-sunken transition-colors"
                    >
                        <Pencil className="w-4 h-4 inline-block mr-c-1" />
                        Edit
                    </button>
                </div>
            </>
        );
    }

    // ── time-to-go (dark, urgent)
    if (phase === 'time-to-go') {
        return (
            <>
                <div className="c-type-caption text-c-urgency font-semibold uppercase tracking-wider mb-c-2">TIME TO GO</div>
                <p className="font-extrabold text-c-urgency leading-none tabular-nums" style={{ fontSize: '72px' }}>
                    LEAVE NOW
                </p>
                {countdownText && (
                    <p className="c-type-headline text-white mt-c-3">
                        {countdownText}
                    </p>
                )}
                {terminal && (
                    <p className="c-type-footnote text-white/70 mt-c-2">
                        Head to Terminal {terminal}{gate ? ` · Gate ${gate}` : ''}
                    </p>
                )}
                <div className="mt-c-5 flex flex-wrap gap-c-2">
                    <button
                        type="button"
                        onClick={onBook}
                        className="flex-1 min-w-[180px] h-12 rounded-c-md bg-c-urgency text-white c-type-footnote font-semibold hover:opacity-90 active:scale-95 transition-all"
                    >
                        {transport === 'driving' ? 'Start navigation' : 'Book your ride'}
                    </button>
                </div>
            </>
        );
    }

    // ── en_route (dark, focused)
    if (phase === 'en_route') {
        const driveMin = recommendation?.segments?.find(s => s.id === 'transport')?.duration_minutes;
        return (
            <>
                <div className="c-type-caption text-c-brand-primary font-semibold uppercase tracking-wider mb-c-2">EN ROUTE</div>
                <p className="c-type-hero text-white tabular-nums leading-none">
                    {driveMin ? formatDuration(driveMin) : '—'}
                </p>
                <p className="c-type-footnote text-white/70 mt-c-3">
                    {terminal ? `To Terminal ${terminal}` : 'To the airport'}
                    {gate ? ` · Gate ${gate}` : ''}
                </p>
                <div className="mt-c-5 rounded-c-md bg-white/5 border border-white/10 p-c-4">
                    <h3 className="c-type-caption text-white/60 font-semibold uppercase tracking-wider mb-c-3">What's next</h3>
                    <RemainingSteps phase="en_route" selectedFlight={selectedFlight} bufferMinutes={bufferMinutes} />
                </div>
                <div className="mt-c-5">
                    <button
                        type="button"
                        onClick={onBook}
                        className="w-full h-14 rounded-c-md bg-c-brand-primary text-white c-type-headline font-semibold hover:bg-c-brand-primary-hover transition-colors inline-flex items-center justify-center gap-c-2"
                    >
                        <ArrowSquareOut size={20} weight="bold" />
                        Open in Maps
                    </button>
                </div>
            </>
        );
    }

    // ── at_airport (dark)
    if (phase === 'at_airport') {
        return (
            <>
                <div className="c-type-caption text-c-brand-primary font-semibold uppercase tracking-wider mb-c-2">AT THE AIRPORT</div>
                <p className="c-type-title-xl text-white font-bold leading-tight">
                    Head to TSA{gate ? ` → Gate ${gate}` : ''}
                </p>
                {terminal && (
                    <p className="c-type-footnote text-white/70 mt-c-2">
                        Terminal {terminal}{flightNumber ? ` · ${flightNumber}` : ''}
                    </p>
                )}
                <div className="mt-c-5 grid grid-cols-2 gap-c-3">
                    <div className="rounded-c-md bg-white/5 border border-white/10 p-c-4">
                        <p className="c-type-caption text-c-live-data font-semibold uppercase tracking-wider">TSA WAIT</p>
                        <p className="c-type-display text-white tabular-nums mt-c-1">~18 min</p>
                        <p className="c-type-caption text-white/60 mt-c-1">Live · updated 2 min ago</p>
                    </div>
                    <div className="rounded-c-md bg-white/5 border border-white/10 p-c-4">
                        <p className="c-type-caption text-white/60 font-semibold uppercase tracking-wider">GATE WALK</p>
                        <p className="c-type-display text-white tabular-nums mt-c-1">~7 min</p>
                        <p className="c-type-caption text-white/60 mt-c-1">From security to {gate ? `Gate ${gate}` : 'your gate'}</p>
                    </div>
                </div>
            </>
        );
    }

    // ── at_gate (dark, calm)
    if (phase === 'at_gate') {
        const isDelayed = selectedFlight?.is_delayed;
        return (
            <>
                <div className="c-type-caption text-c-confidence font-semibold uppercase tracking-wider mb-c-2">AT THE GATE</div>
                <p className="c-type-title-xl text-white font-bold leading-tight">
                    You're set.
                </p>
                <p className="c-type-headline text-white/90 mt-c-2">
                    Boarding {depTime ? `at ${depTime}` : 'soon'}{boardingTime ? ` · Door at ${boardingTime}` : ''}
                </p>
                <div className="mt-c-5 flex flex-wrap gap-c-2">
                    {terminal && (
                        <span className="inline-flex items-center gap-c-1 px-c-3 py-c-1 rounded-c-pill bg-white/10 border border-white/15 c-type-footnote font-medium text-white">
                            Terminal {terminal}
                        </span>
                    )}
                    {gate && (
                        <span className="inline-flex items-center gap-c-1 px-c-3 py-c-1 rounded-c-pill bg-white/10 border border-white/15 c-type-footnote font-medium text-white">
                            Gate {gate}
                        </span>
                    )}
                    <span className={cn(
                        'inline-flex items-center gap-c-1 px-c-3 py-c-1 rounded-c-pill c-type-footnote font-semibold',
                        isDelayed
                            ? 'bg-c-warning-surface text-c-warning'
                            : 'bg-c-confidence-surface text-c-confidence'
                    )}>
                        {isDelayed ? 'Delayed' : 'On time'}
                    </span>
                </div>
            </>
        );
    }

    // ── complete (dark, feedback)
    if (phase === 'complete') {
        return (
            <>
                <div className="c-type-caption text-c-confidence font-semibold uppercase tracking-wider mb-c-2">TRIP COMPLETE</div>
                <p className="c-type-title-xl text-white font-bold leading-tight">
                    How was your trip{destinationCity ? ` to ${destinationCity}` : ''}?
                </p>
                <p className="c-type-footnote text-white/70 mt-c-3">
                    AirBridge was within ~8 min of your actual experience.
                </p>
                <div className="mt-c-5">
                    <button
                        type="button"
                        onClick={onOpenFeedback}
                        className="w-full h-12 rounded-c-md bg-c-brand-primary text-white c-type-footnote font-semibold hover:bg-c-brand-primary-hover transition-colors inline-flex items-center justify-center gap-c-2"
                    >
                        <Star size={18} weight="fill" />
                        Rate this trip
                    </button>
                </div>
            </>
        );
    }

    return null;
}

/* ── Active-phase timeline. Compact segment list shown inside the hero
   card during planning. Reuses the same segment shapes buildTimelineRows
   would — kept local for simpler DS-token styling in light mode. */
function ActiveTimeline({ recommendation, selectedFlight, transport, homeAddress }) {
    const rows = useMemo(() => {
        const segments = recommendation?.segments || [];
        const leaveAt = recommendation?.leave_home_at;
        if (!leaveAt) return [];

        const airportCode = selectedFlight?.origin_code || 'Airport';
        const transportSeg = segments.find(s => s.id === 'transport');
        const walkSeg = segments.find(s => s.id === 'walk_to_gate');
        const airportSeg = segments.find(s => s.id === 'at_airport');
        const bagSeg = segments.find(s => s.id === 'bag_drop' || s.id === 'checkin');
        const tsaSeg = segments.find(s => s.id === 'tsa');
        const TRANSPORT_ICONS = { rideshare: Car, driving: Car, train: Train, bus: Bus };
        const TransportIcon = TRANSPORT_ICONS[(transport || '').toLowerCase()] || Car;
        const verbMap = { rideshare: 'Ride', driving: 'Drive', train: 'Train', bus: 'Bus' };
        const verb = verbMap[(transport || '').toLowerCase()] || 'Ride';

        // `connectorPillAfter` — duration riding the horizontal connector
        // line between this row's icon and the next. Only for meaningful
        // in-transit time (drive, airport walk, gate walk). Skip for
        // service phases (bag drop, TSA) — their duration is time AT the
        // phase, not between phases.
        const list = [];

        list.push({
            key: 'depart',
            Icon: transportSeg ? TransportIcon : House,
            name: transportSeg ? `${verb} to ${airportCode}` : 'Leave home',
            subtitle: homeAddress ? shortAddress(homeAddress) : null,
            subtitleTone: 'neutral',
            connectorPillAfter: transportSeg?.duration_minutes ? formatDuration(transportSeg.duration_minutes) : null,
        });

        if (airportSeg) {
            list.push({
                key: 'at_airport',
                Icon: Buildings,
                name: `At ${airportCode}`,
                subtitle: null,
                subtitleTone: 'neutral',
                // at_airport's duration is walking-to-concourse time —
                // surface on the outgoing connector instead of as a row
                // sub-detail.
                connectorPillAfter: airportSeg.duration_minutes ? `${formatDuration(airportSeg.duration_minutes)} walk` : null,
            });
        }

        if (bagSeg) {
            list.push({
                key: 'bag',
                Icon: SuitcaseRolling,
                name: bagSeg.id === 'checkin' ? 'Check in' : 'Bag drop',
                subtitle: bagSeg.duration_minutes ? `${formatDuration(bagSeg.duration_minutes)} drop` : null,
                subtitleTone: 'neutral',
                connectorPillAfter: null,
            });
        }

        if (tsaSeg) {
            const waitMatch = tsaSeg.advice?.match(/wait:(\d+)/);
            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : tsaSeg.duration_minutes;
            list.push({
                key: 'tsa',
                Icon: Shield,
                name: 'TSA Security',
                subtitle: waitMin ? `${formatDuration(waitMin)} wait` : null,
                subtitleTone: 'warning',
                isLiveData: true, // TSA wait gets the live-data pulsing amber dot
                connectorPillAfter: walkSeg?.duration_minutes ? `${formatDuration(walkSeg.duration_minutes)} walk` : null,
            });
        }

        if (walkSeg) {
            list.push({
                key: 'gate',
                Icon: Rocket,
                name: `Gate ${selectedFlight?.departure_gate || ''}`.trim() || 'At gate',
                subtitle: null,
                subtitleTone: 'neutral',
                connectorPillAfter: null,
            });
        }

        return list;
    }, [recommendation, selectedFlight, transport, homeAddress]);

    if (rows.length === 0) return null;

    const subtitleClass = (tone) => tone === 'warning' ? 'text-c-warning'
        : tone === 'confidence' ? 'text-c-confidence'
        : 'text-c-text-tertiary';

    // ── Vertical layout (mobile, < md). Same as before. */
    const vertical = (
        <div className="md:hidden">
            {rows.map((row, i) => (
                <div key={row.key} className="relative flex items-start gap-c-3 py-c-3">
                    {i < rows.length - 1 && (
                        <span
                            aria-hidden="true"
                            className="absolute w-0.5"
                            style={{
                                left: '15px',
                                top: '44px',
                                bottom: '0',
                                backgroundColor: 'rgb(79 63 211 / 0.25)',
                            }}
                        />
                    )}
                    <span className="relative z-10 shrink-0 w-8 h-8 rounded-c-md bg-c-brand-primary-surface flex items-center justify-center">
                        <row.Icon size={16} weight="regular" className="text-c-brand-primary" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="c-type-footnote font-semibold text-c-text-primary">{row.name}</p>
                        {row.subtitle && (
                            <p className={cn('c-type-caption mt-0.5 inline-flex items-center gap-c-1', subtitleClass(row.subtitleTone))}>
                                {row.isLiveData && <LivePulseDot />}
                                {row.subtitle}
                            </p>
                        )}
                        {row.connectorPillAfter && (
                            <span className="inline-flex items-center mt-c-1 px-c-2 py-0.5 rounded-c-pill bg-c-ground-elevated border border-c-brand-primary/30 c-type-caption text-c-text-primary font-medium whitespace-nowrap">
                                {row.connectorPillAfter}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // ── Horizontal layout (tablet / desktop, md:+). Flex-segments
    // approach mirroring the Results timeline: each column renders its
    // own left + right connector halves, adjacent halves abut at the
    // column boundary to form one continuous line. Transit pills ride
    // the column boundaries at the icon centre-y. */
    const horizontal = (
        <div className="hidden md:flex items-start">
            {rows.map((row, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === rows.length - 1;
                return (
                    <div key={row.key} className="relative flex-1 min-w-0 flex flex-col items-center text-center px-c-1">
                        {!isFirst && (
                            <span
                                aria-hidden="true"
                                className="absolute h-0.5"
                                style={{ top: '15px', left: '0', right: '50%', backgroundColor: 'rgb(79 63 211 / 0.25)' }}
                            />
                        )}
                        {!isLast && (
                            <span
                                aria-hidden="true"
                                className="absolute h-0.5"
                                style={{ top: '15px', left: '50%', right: '0', backgroundColor: 'rgb(79 63 211 / 0.25)' }}
                            />
                        )}
                        <span className="relative z-10 shrink-0 w-8 h-8 rounded-c-md bg-c-brand-primary-surface flex items-center justify-center">
                            <row.Icon size={16} weight="regular" className="text-c-brand-primary" />
                        </span>
                        {!isLast && row.connectorPillAfter && (
                            <span
                                className="absolute z-20 inline-flex items-center px-c-2 py-0.5 rounded-c-pill bg-c-ground-elevated border border-c-brand-primary/30 c-type-caption text-c-text-primary font-medium whitespace-nowrap"
                                style={{ top: '16px', left: '100%', transform: 'translate(-50%, -50%)' }}
                            >
                                {row.connectorPillAfter}
                            </span>
                        )}
                        <p className="mt-c-2 c-type-caption font-semibold text-c-text-primary leading-tight">
                            {row.name}
                        </p>
                        {row.subtitle && (
                            <p className={cn('c-type-caption mt-0.5 inline-flex items-center gap-c-1 leading-tight', subtitleClass(row.subtitleTone))}>
                                {row.isLiveData && <LivePulseDot />}
                                {row.subtitle}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            {vertical}
            {horizontal}
        </>
    );
}

/* ── Small pulsing amber dot — rendered next to values the backend
   reports as live-updating (TSA wait times, traffic-adjusted leave-by).
   2s breathing cycle at 0.5→1→0.5 opacity with a slight scale bump. */
function LivePulseDot() {
    return (
        <span
            aria-hidden="true"
            className="inline-block w-1.5 h-1.5 rounded-c-pill animate-live-pulse"
            style={{ backgroundColor: 'var(--c-live-data)' }}
        />
    );
}

/* ── Remaining steps — used on en_route to show what's still ahead. */
function RemainingSteps({ selectedFlight, bufferMinutes }) {
    const gate = selectedFlight?.departure_gate;
    const steps = [
        { Icon: Buildings, label: `Arrive at ${selectedFlight?.origin_code || 'airport'}` },
        { Icon: Shield, label: 'TSA Security · ~18 min' },
        { Icon: Rocket, label: gate ? `Gate ${gate}` : 'At gate', note: bufferMinutes > 0 ? `+${formatDuration(bufferMinutes)} buffer` : null },
    ];
    return (
        <div className="space-y-c-3">
            {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-c-3">
                    <span className="shrink-0 w-8 h-8 rounded-c-md bg-white/10 flex items-center justify-center">
                        <s.Icon size={16} weight="regular" className="text-white" />
                    </span>
                    <div className="flex-1">
                        <p className="c-type-footnote font-medium text-white">{s.label}</p>
                        {s.note && <p className="c-type-caption text-c-confidence mt-0.5">{s.note}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Main component ────────────────────────────────────────────────── */
export default function ActiveTripView({
    trip, recommendation, selectedFlight, transport,
    isAuthenticated, display_name,
    onRefresh, onEdit,
}) {
    const { token, updateTripCount } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { handleTabChange, authOpen, setAuthOpen, handleAuthSuccess } = useAuthGatedTabs();

    const [countdownText, setCountdownText] = useState('');
    const [urgencyLevel, setUrgencyLevel] = useState('calm');
    const [polledStatus, setPolledStatus] = useState(null);
    const [untrackOpen, setUntrackOpen] = useState(false);
    const [untracking, setUntracking] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshed, setRefreshed] = useState(false);

    // ── Phase derivation ────────────────────────────────────────────
    const phaseParam = searchParams.get('phase');
    const overridePhase = phaseParam && VALID_PHASES.includes(phaseParam) ? phaseParam : null;

    const backendStatus = polledStatus || trip?.status || 'active';
    // time-to-go is a screen state, not a backend status: `active` + within 15 min of leaveAt.
    const derivedPhase = backendStatus === 'active' && urgencyLevel === 'critical'
        ? 'time-to-go'
        : backendStatus;
    const phase = overridePhase || derivedPhase;
    const theme = phaseTheme(phase);

    const comfortBuffer = recommendation?.segments?.find(s => s.id === 'comfort_buffer' || s.id === 'gate_buffer');
    const bufferMinutes = comfortBuffer?.duration_minutes ?? recommendation?.gate_time_minutes ?? 0;
    const boardingTime = selectedFlight?.departure_time
        ? (() => {
            const d = new Date(selectedFlight.departure_time);
            if (isNaN(d.getTime())) return '';
            d.setMinutes(d.getMinutes() - 30);
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        })()
        : '';

    const homeCoords = recommendation?.home_coordinates || null;
    const airCoordsFromRec = recommendation?.terminal_coordinates || null;
    const airCoordsFromIATA = airportCoords(selectedFlight?.origin_code);
    const airCoords = airCoordsFromRec || airCoordsFromIATA;
    const destinationCity = selectedFlight?.destination_name?.split(',')[0];

    // ── Countdown tick ─────────────────────────────────────────────
    useEffect(() => {
        if (!recommendation?.leave_home_at) return;
        const tick = () => {
            // Seconds-resolution countdown — when < 1 hour remains, the
            // ticking "Xm Ys" readout is the visual urgency signal. Above
            // that, it falls back to "Xh Ym" which updates at minute
            // granularity naturally.
            setCountdownText(formatCountdownTextWithSeconds(recommendation.leave_home_at));
            const diffMin = (new Date(recommendation.leave_home_at) - Date.now()) / 60000;
            if (diffMin <= 0) setUrgencyLevel('critical');
            else if (diffMin < 15) setUrgencyLevel('critical');
            else if (diffMin < 60) setUrgencyLevel('urgent');
            else setUrgencyLevel('calm');
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [recommendation?.leave_home_at]);

    // ── Poll backend for phase advancement ─────────────────────────
    useEffect(() => {
        if (!token || !trip?.trip_id) return;
        let cancelled = false;
        const poll = async () => {
            try {
                const res = await fetch(`${API_BASE}/v1/trips/active`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                if (data?.trip?.trip_id === trip.trip_id && data.trip.status) {
                    setPolledStatus(data.trip.status);
                }
            } catch (err) {
                console.error('Active trip poll failed:', err);
            }
        };
        poll();
        const id = setInterval(poll, 30000);
        return () => { cancelled = true; clearInterval(id); };
    }, [token, trip?.trip_id]);

    // ── Theme swap — set data-theme on a ref so CSS vars flip. The
    // brief wants a 600ms transition on the active → time-to-go edge
    // specifically; CSS transition on background-color and color does
    // that naturally when tokens flip. */
    const rootRef = useRef(null);
    useEffect(() => {
        if (!rootRef.current) return;
        rootRef.current.setAttribute('data-theme', theme);
    }, [theme]);

    // ── Handlers ───────────────────────────────────────────────────
    const handleBack = () => {
        navigate(createPageUrl('Trips'));
    };

    const handleEditTrip = () => {
        navigate(createPageUrl('Engine'), { state: { editTrip: trip } });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setRefreshed(false);
        await onRefresh();
        setRefreshing(false);
        setRefreshed(true);
        setTimeout(() => setRefreshed(false), 2000);
    };

    const handleUntrack = async () => {
        if (!trip?.trip_id || untracking) return;
        setUntracking(true);
        try {
            const res = await fetch(`${API_BASE}/v1/trips/${trip.trip_id}/untrack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.trip_count != null) updateTripCount(data.trip_count);
                navigate(createPageUrl('Trips'), { replace: true });
            } else {
                const err = await res.json().catch(() => ({}));
                console.error('Untrack failed:', err.detail || res.status);
            }
        } catch (err) {
            console.error('Untrack request failed:', err);
        } finally {
            setUntracking(false);
            setUntrackOpen(false);
        }
    };

    // Placeholder "Open in Maps" / "Book your ride" — deep-linking out
    // of Active Trip uses the same utilities the Results screen uses,
    // but for phase 7.6 the minimum is: reveal a chip row elsewhere.
    // For now, the book/navigate button opens Google Maps directions.
    const openMapsNavigation = () => {
        if (!airCoords) return;
        const home = homeCoords ? `${homeCoords.lat},${homeCoords.lng}` : '';
        const dest = `${airCoords.lat},${airCoords.lng}`;
        const url = `https://www.google.com/maps/dir/?api=1${home ? `&origin=${home}` : ''}&destination=${dest}&travelmode=driving`;
        window.open(url, '_blank');
    };

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
            icon: <AirplanePhosphor size={22} weight="regular" />,
            iconActive: <AirplanePhosphor size={22} weight="bold" />,
        },
        {
            value: 'settings',
            label: 'Settings',
            icon: <Gear size={22} weight="regular" />,
            iconActive: <Gear size={22} weight="bold" />,
        },
    ];

    // ── Layout ─────────────────────────────────────────────────────
    const mapHidden = phase === 'complete';
    const mapHeight = 280;

    return (
        <motion.div
            ref={rootRef}
            key="active_trip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            data-theme={theme}
            className="relative min-h-screen pb-28 transition-colors duration-[600ms]"
            style={{ backgroundColor: 'var(--c-ground)' }}
        >
            {/* Map region (hidden on complete). Top-of-screen, full-bleed. */}
            {!mapHidden && (
                <PhaseMap
                    theme={theme}
                    homeCoords={homeCoords}
                    airportCoords={airCoords}
                    transport={transport}
                    height={mapHeight}
                    hidden={mapHidden}
                />
            )}

            {/* Floating top bar, overlaps the map. */}
            <PhaseTopBar
                theme={theme}
                phase={phase}
                trip={trip}
                selectedFlight={selectedFlight}
                originCity={null}
                destCity={null}
                onBack={handleBack}
                onMore={() => setMenuOpen((v) => !v)}
            />

            {/* Kebab menu — simple inline dropdown for Edit / Refresh / Untrack. */}
            {menuOpen && (
                <div
                    className={cn(
                        'absolute right-c-4 top-14 z-40 rounded-c-md border shadow-c-md py-c-1 min-w-[180px]',
                        theme === 'dark'
                            ? 'bg-c-ground-elevated border-white/10'
                            : 'bg-c-ground-elevated border-c-border-hairline'
                    )}
                    style={{ marginTop: 'env(safe-area-inset-top)' }}
                    onMouseLeave={() => setMenuOpen(false)}
                >
                    {(phase === 'active' || phase === 'time-to-go') && (
                        <button type="button" onClick={() => { setMenuOpen(false); handleEditTrip(); }}
                            className="w-full text-left px-c-4 py-c-2 c-type-footnote text-c-text-primary hover:bg-c-ground-sunken flex items-center gap-c-2">
                            <Pencil className="w-4 h-4" /> Edit trip
                        </button>
                    )}
                    <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }}
                        className="w-full text-left px-c-4 py-c-2 c-type-footnote text-c-text-primary hover:bg-c-ground-sunken flex items-center gap-c-2">
                        <SettingsIcon className="w-4 h-4" /> Edit preferences
                    </button>
                    <button type="button" onClick={() => { setMenuOpen(false); handleRefresh(); }}
                        className="w-full text-left px-c-4 py-c-2 c-type-footnote text-c-text-primary hover:bg-c-ground-sunken flex items-center gap-c-2">
                        <RefreshCw className="w-4 h-4" />
                        {refreshing ? 'Refreshing…' : refreshed ? 'Refreshed' : 'Refresh'}
                    </button>
                    <button type="button" onClick={() => { setMenuOpen(false); setUntrackOpen(true); }}
                        className="w-full text-left px-c-4 py-c-2 c-type-footnote text-c-urgency hover:bg-c-ground-sunken">
                        Untrack trip
                    </button>
                </div>
            )}

            {/* Hero card — floating glass/elevated surface overlapping the map bottom. */}
            <section
                className={cn(
                    'relative z-10 mx-c-4 rounded-c-lg shadow-c-md transition-colors duration-[600ms]',
                    theme === 'dark' ? 'bg-c-ground-elevated border border-white/5' : 'bg-c-ground-elevated border border-c-border-hairline'
                )}
                style={{ marginTop: mapHidden ? 80 : `-${Math.round(mapHeight * 0.17)}px`, padding: '24px' }}
            >
                <PhaseContent
                    phase={phase}
                    trip={trip}
                    recommendation={recommendation}
                    selectedFlight={selectedFlight}
                    transport={transport}
                    homeAddress={trip?.home_address}
                    countdownText={countdownText}
                    bufferMinutes={bufferMinutes}
                    boardingTime={boardingTime}
                    destinationCity={destinationCity}
                    onBook={openMapsNavigation}
                    onEditPrefs={onEdit}
                    onUntrack={() => setUntrackOpen(true)}
                    onOpenFeedback={() => {
                        // FeedbackPrompt is mounted at app level and opens via its own
                        // trigger pattern; we just navigate to Trips where it'll fire.
                        navigate(createPageUrl('Trips'));
                    }}
                />
            </section>

            {/* Progress bar — below the hero card. */}
            <div className="px-c-6 mt-c-6">
                <ProgressDots phase={phase} />
            </div>

            {/* Filler for scroll — content region is phase-content inside the hero;
                extra breathing room below the progress so TabBar doesn't crowd it. */}
            <div className="h-c-12" />

            <UntrackConfirmModal
                open={untrackOpen}
                onOpenChange={setUntrackOpen}
                onConfirm={handleUntrack}
                loading={untracking}
            />

            <TabBar value="trip" onChange={handleTabChange} tabs={tabs} />

            <AuthModal
                open={authOpen}
                onOpenChange={setAuthOpen}
                onSuccess={handleAuthSuccess}
            />

            {/* Dev-only debug pill — lets Rab see which phase is rendering at a
               glance when demoing via URL override. */}
            {import.meta.env.DEV && (
                <div className="fixed bottom-24 left-c-4 z-40 px-c-3 py-c-1 rounded-c-pill bg-black/80 text-white c-type-caption font-mono pointer-events-none">
                    phase: {phase}{overridePhase ? ' (override)' : ''}
                </div>
            )}
        </motion.div>
    );
}
