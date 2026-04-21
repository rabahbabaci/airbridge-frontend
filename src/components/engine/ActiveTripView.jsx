import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CaretLeft, DotsThree,
    House, Car, Train, Bus, Shield, SuitcaseRolling, Buildings,
    Airplane as AirplanePhosphor, MagnifyingGlass, Gear,
    Rocket, Star, ArrowSquareOut,
} from '@phosphor-icons/react';
import { RefreshCw, Pencil, Settings as SettingsIcon } from 'lucide-react';

import { parseCountdown, formatLocalTime, formatDuration } from '@/utils/format';
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

// Timeline step key to animate for each phase. null = no step pulses
// (used on complete, where the trip is done).
function phaseToCurrentTimelineStep(phase) {
    switch (phase) {
        case 'active': return 'depart';
        case 'time-to-go': return 'depart';
        case 'en_route': return 'at_airport';
        case 'at_airport': return 'tsa';
        case 'at_gate': return 'gate';
        case 'complete': return null;
        default: return 'depart';
    }
}

// Caption under the current-phase timeline step. Reads as "this is
// where you are on the journey right now" in addition to the pulse.
function phaseToCurrentStepCaption(phase) {
    switch (phase) {
        case 'active': return 'Starting here';
        case 'time-to-go': return 'Leave now';
        case 'en_route': return 'In transit';
        case 'at_airport': return 'You\u2019re here';
        case 'at_gate': return 'You\u2019re here';
        case 'complete': return null;
        default: return null;
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

function cityForIata(iata) {
    if (!iata) return null;
    const a = airports.find(x => x.iata === iata);
    return a?.city || null;
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
// Light map style tuned toward "Apple Maps light" rather than
// Concourse-warm-paper. Previous pass ran the land in #EAE3D2 (warm
// beige), which read as brown/parchment next to the hero card. Shift
// to a neutral slate-grey-green so the map reads as "map" rather
// than "paper." Water cooler, parks a touch more vibrant, highways
// softer cream so road labels stay legible.
const LIGHT_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#E8E9E4' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#5E6272' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F6F2' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#C8DFB1' }] },
    { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#EDEEE8' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#E1E3DC' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FDFDFB' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6A6F7E' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FFE5A7' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#E8C67D' }] },
    { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#B5CFDE' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6B849A' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#CBD0C4' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#353844' }] },
];

// Dark map — Concourse navy family. Previously the land was the same
// navy as the page ground so the map read as a black rectangle on
// phone previews. Bump land to a slightly lighter navy so the roads
// and polyline can hover above it, and give water a deeper slate so
// the Bay / coastlines pop.
const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#16233F' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8892A8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0B1220' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1E3A2E' }] },
    { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#182742' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1A2A45' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A3A5C' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#A8ADBE' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#304266' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4A5D82' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#6A7DA3' }] },
    { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#04080F' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6B7186' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2A3550' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#D0D4E0' }] },
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
    // doesn't burn a fresh Directions call.
    //
    // Diagnostic logging — if the rendered polyline is a straight line
    // instead of a routed path, the console trail narrows the cause:
    //   "[ActiveTripMap] directions skipped: …" → coords missing.
    //   "[ActiveTripMap] directions status: REQUEST_DENIED" → Google
    //     Cloud project doesn't have the Directions API enabled.
    //   "[ActiveTripMap] directions status: OK, N points" → routed path
    //     was fetched; a straight line then means a downstream render
    //     bug. */
    useEffect(() => {
        if (hidden) return;
        if (!GOOGLE_MAPS_API_KEY) {
            console.info('[ActiveTripMap] directions skipped: no API key');
            return;
        }
        if (!homeCoords || !airCoords) {
            console.info('[ActiveTripMap] directions skipped: missing coords', { homeCoords, airCoords });
            return;
        }

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
                            console.info(`[ActiveTripMap] directions status: OK, ${path.length} points`);
                            if (cacheKey) directionsCache.set(cacheKey, path);
                            setRoutePath(path);
                        } else {
                            // Non-OK status is the signal most likely to
                            // hit production: REQUEST_DENIED means the
                            // Directions API is not enabled on the key's
                            // Google Cloud project. Enable it at:
                            // console.cloud.google.com/apis/library/directions-backend.googleapis.com
                            // Leaves routePath as null so the render falls
                            // back to the home→airport straight line.
                            console.warn('[ActiveTripMap] directions status:', status);
                        }
                    }
                );
            } catch (err) {
                console.error('[ActiveTripMap] directions init failed:', err);
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
                    mapRef.current.fitBounds(bounds, { top: 32, bottom: 72, left: 20, right: 20 });
                } else if (homeCoords && airCoords) {
                    const bounds = new g.LatLngBounds();
                    bounds.extend(homeCoords);
                    bounds.extend(airCoords);
                    mapRef.current.fitBounds(bounds, { top: 32, bottom: 72, left: 20, right: 20 });
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
    const originCode = selectedFlight?.origin_code || '';
    const destCode = selectedFlight?.destination_code || '';
    const hasCodes = Boolean(originCode && destCode);
    const hasCities = Boolean(originCity && destCity);

    const textClass = isDark ? 'text-white' : 'text-c-text-primary';
    const surfaceClass = isDim ? 'bg-transparent' : 'c-glass border-b border-[color:var(--c-glass-border)]';

    return (
        <div
            className={cn(
                'absolute top-0 inset-x-0 z-30 transition-colors duration-[600ms]',
                surfaceClass
            )}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            {/* Inner row capped at max-w-5xl and centred — on wide desktop
               the back chevron and kebab otherwise fly to the viewport
               edges. Mobile keeps the full-width flex layout via px-c-4.
               Title uses absolute positioning so it centres against the
               container, not the space between unequal-width side buttons. */}
            <div className="relative mx-auto w-full max-w-5xl h-14 px-c-4">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Back"
                    className={cn(
                        'absolute left-c-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-c-pill flex items-center justify-center transition-colors z-10',
                        textClass,
                        isDim ? 'hover:bg-white/10' : 'hover:bg-black/5'
                    )}
                >
                    <CaretLeft size={22} weight="bold" />
                </button>
                {/* Title — absolutely centred. Side buttons overlap the
                   title's padding area at z-10 (tap still lands on them).
                   px-14 reserves space for the side buttons so truncation
                   bounds inside the remaining middle column. */}
                <div className={cn(
                    'absolute inset-0 flex items-center justify-center px-14 c-type-body font-semibold pointer-events-none',
                    textClass
                )}>
                    <div className="flex items-center gap-c-1 min-w-0 max-w-full">
                        {flightNumber && (
                            <span className="shrink-0">{flightNumber}</span>
                        )}
                        {(flightNumber && (hasCodes || hasCities)) && (
                            <span className="shrink-0 opacity-60">·</span>
                        )}
                        {/* Mobile: compact codes only. */}
                        {hasCodes && (
                            <span className="md:hidden shrink-0">{originCode} → {destCode}</span>
                        )}
                        {/* md:+: code + city per endpoint. City truncates
                           with ellipsis on narrow widths; codes stay
                           full-strength. */}
                        {(hasCodes || hasCities) && (
                            <span className="hidden md:flex items-center gap-c-1 min-w-0">
                                {hasCodes && <span className="shrink-0 font-bold">{originCode}</span>}
                                {hasCities && <span className="truncate opacity-80">{originCity}</span>}
                                <span className="shrink-0 opacity-60">→</span>
                                {hasCodes && <span className="shrink-0 font-bold">{destCode}</span>}
                                {hasCities && <span className="truncate opacity-80">{destCity}</span>}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onMore}
                    aria-label="More options"
                    className={cn(
                        'absolute right-c-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-c-pill flex items-center justify-center transition-colors z-10',
                        textClass,
                        isDim ? 'hover:bg-white/10' : 'hover:bg-black/5',
                        isDim ? 'opacity-60' : ''
                    )}
                >
                    <DotsThree size={24} weight="bold" />
                </button>
            </div>
        </div>
    );
}

/* ── Hero countdown — "Leave in 11h 47m 52s" with per-digit locked
   slots. Each DIGIT sits in its own inline-block at `width: 1ch` with
   tabular-nums, so the glyph for "4 → 5" or "9 → 10" never moves
   subsequent character positions. Unit letters ("h", "m", "s") have
   fixed horizontal margins so the gap to the next numeric group
   doesn't jitter either. */
function CountdownSlots({ parsed }) {
    if (!parsed || parsed.isDate) {
        return parsed?.text || '—';
    }
    const { h, m, s } = parsed;
    const showH = h > 0;
    const showM = showH || m > 0;
    const pad2 = (n) => String(n).padStart(2, '0');

    const digitStyle = { display: 'inline-block', width: '1ch', textAlign: 'center' };
    const unitStyle = { display: 'inline-block', marginRight: '0.25em', marginLeft: '0.05em' };

    const renderDigits = (valStr) => valStr.split('').map((d, i) => (
        <span key={i} style={digitStyle} className="tabular-nums">{d}</span>
    ));

    return (
        <span className="whitespace-nowrap">
            {showH && (
                <>
                    {renderDigits(String(h))}
                    <span style={unitStyle}>h</span>
                </>
            )}
            {showM && (
                <>
                    {renderDigits(showH ? pad2(m) : String(m))}
                    <span style={unitStyle}>m</span>
                </>
            )}
            {renderDigits(showM ? pad2(s) : String(s))}
            <span style={{ display: 'inline-block', marginLeft: '0.05em' }}>s</span>
        </span>
    );
}

// Hero countdown sizing. Desktop uses the DS --c-type-hero (56px);
// the countdown can swell slightly on very-wide viewports via clamp
// without exceeding --c-type-hero-xl (72px). Mobile drops to
// --c-type-display (36px) so the ticking digits still dominate
// without wrapping.
const COUNTDOWN_FONT_STYLE = {
    fontSize: 'clamp(var(--c-type-display-size), 9vw, var(--c-type-hero-xl-size))',
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: '-0.02em',
};

// "Leave in" label. Desktop sits co-equal with the countdown — same
// hero-scale, differentiated by colour (text-primary vs brand). Mobile
// steps down to --c-type-title (22px) so the label reads as label-ish
// and leaves room for the countdown to read as the value.
const LABEL_DESKTOP_STYLE = {
    fontSize: 'clamp(var(--c-type-display-size), 9vw, var(--c-type-hero-xl-size))',
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: '-0.02em',
};

function LeaveInHero({ parsed, tone = 'brand' }) {
    // tone 'brand' → light-theme purple countdown. tone 'urgent' → red
    // in the time-to-go variant.
    const valueColor = tone === 'urgent' ? 'text-c-urgency' : 'text-c-brand-primary';
    return (
        <>
            {/* Mobile (<md): label left, countdown right-filling & centred
               visually in the remaining space. Label steps down to
               --c-type-title so hierarchy reads; countdown stays at the
               clamp'd hero size. */}
            <div className="md:hidden flex items-baseline gap-c-3">
                <span className="c-type-title text-c-text-primary shrink-0">Leave in</span>
                <span
                    className={cn('tabular-nums flex-1 text-center', valueColor)}
                    style={COUNTDOWN_FONT_STYLE}
                >
                    <CountdownSlots parsed={parsed} />
                </span>
            </div>
            {/* Desktop (md:+): both at hero scale, inline, comfortable
               c-8 gap between the label and the digits. Baseline-
               aligned so the descenders in "Leave in" line up with the
               digit baselines. */}
            <div className="hidden md:flex items-baseline gap-c-8">
                <span
                    className="text-c-text-primary shrink-0"
                    style={LABEL_DESKTOP_STYLE}
                >
                    Leave in
                </span>
                <span
                    className={cn('tabular-nums', valueColor)}
                    style={COUNTDOWN_FONT_STYLE}
                >
                    <CountdownSlots parsed={parsed} />
                </span>
            </div>
        </>
    );
}

/* ── Trip context strip — horizontal metadata row above the
   countdown. Pulls date + boarding + departure + gate out of the
   trip data and surfaces them at footnote weight.

   Affordance right-aligned varies by editState:
     'editable' — Edit link (Pencil, brand). Phases: active, time-to-go.
     'locked'   — "Untrack to edit" link (tertiary). Phases: en_route,
                  at_airport, at_gate. Tap opens UntrackConfirmModal.
     'none'     — no affordance (complete phase; trip is done). */
function TripContextStrip({ trip, selectedFlight, boardingTime, editState = 'none', onEdit, onUntrack }) {
    const departureDate = trip?.departure_date || '';
    const dateLabel = (() => {
        if (!departureDate) return null;
        const [y, m, d] = departureDate.split('-').map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
        });
    })();
    const departTimeLabel = selectedFlight?.departure_time
        ? formatLocalTime(selectedFlight.departure_time)
        : null;
    const gate = selectedFlight?.departure_gate || null;

    const segments = [
        dateLabel ? { label: dateLabel, strong: false } : null,
        boardingTime ? { label: 'Boarding ', strongLabel: boardingTime } : null,
        departTimeLabel ? { label: 'Departs ', strongLabel: departTimeLabel } : null,
        gate ? { label: 'Gate ', strongLabel: gate } : null,
    ].filter(Boolean);

    const showEditable = editState === 'editable' && !!onEdit;
    const showLocked = editState === 'locked' && !!onUntrack;
    if (segments.length === 0 && !showEditable && !showLocked) return null;

    return (
        <div className="flex items-center gap-c-3 c-type-footnote text-c-text-secondary">
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-c-2 gap-y-c-1">
                {segments.map((seg, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span className="text-c-text-tertiary">·</span>}
                        <span>
                            {seg.label}
                            {seg.strongLabel && (
                                <span className="font-semibold text-c-text-primary">{seg.strongLabel}</span>
                            )}
                        </span>
                    </React.Fragment>
                ))}
            </div>
            {showEditable && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="shrink-0 inline-flex items-center gap-c-1 text-c-brand-primary c-type-footnote font-semibold hover:text-c-brand-primary-hover transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>
            )}
            {showLocked && (
                <button
                    type="button"
                    onClick={onUntrack}
                    className="shrink-0 inline-flex items-center text-c-text-tertiary c-type-footnote font-medium underline underline-offset-2 hover:text-c-text-secondary transition-colors"
                >
                    Untrack to edit
                </button>
            )}
        </div>
    );
}

/* ── Phase content — per-phase hero + body. Kept as one component with
   a switch so the state-to-screen mapping is all visible in one place. */
function PhaseContent({
    phase, trip, recommendation, selectedFlight, transport, homeAddress,
    countdownParsed, bufferMinutes, boardingTime, destinationCity,
    onBook, onEditPrefs, onEditTrip, onUntrack, onOpenFeedback,
}) {
    const terminal = selectedFlight?.departure_terminal;
    const gate = selectedFlight?.departure_gate;
    const depTime = selectedFlight?.departure_time ? formatLocalTime(selectedFlight.departure_time) : '';
    const flightNumber = trip?.flight_number || '';

    // ── active (planning, light theme). Vertical rhythm: trip context
    // → c-6 → Leave-in hero → c-4 → "On your way to" → c-8 → timeline
    // → c-8 → primary CTA (now full-width). Uses the DS spacing scale
    // end-to-end.
    if (phase === 'active') {
        return (
            <>
                <TripContextStrip
                    trip={trip}
                    selectedFlight={selectedFlight}
                    boardingTime={boardingTime}
                    editState="editable"
                    onEdit={onEditTrip}
                />
                <div className="mt-c-6">
                    <LeaveInHero parsed={countdownParsed} tone="brand" />
                </div>
                {terminal && (
                    <p className="c-type-footnote text-c-text-secondary mt-c-4">
                        On your way to{' '}
                        <span className="font-semibold text-c-text-primary">Terminal {terminal}</span>
                    </p>
                )}
                <div className="mt-c-8">
                    <ActiveTimeline
                        phase={phase}
                        recommendation={recommendation}
                        selectedFlight={selectedFlight}
                        transport={transport}
                        homeAddress={homeAddress}
                        bufferMinutes={bufferMinutes}
                    />
                </div>
                <div className="mt-c-8">
                    <button
                        type="button"
                        onClick={onBook}
                        className="w-full h-12 rounded-c-md bg-c-brand-primary text-white c-type-footnote font-semibold hover:bg-c-brand-primary-hover transition-colors"
                    >
                        {transport === 'driving' ? 'Start navigation' : 'Book your ride'}
                    </button>
                </div>
            </>
        );
    }

    // ── time-to-go (dark, urgent). Still editable — strip shows the
    // Edit link. Split rendering on the 30-second threshold: above it
    // we still show a countdown (urgency tone); at or below, we
    // collapse to the single-line "LEAVE NOW" hero.
    if (phase === 'time-to-go') {
        const showCountdown = countdownParsed && countdownParsed.totalSec > 30 && !countdownParsed.isDate;
        return (
            <>
                <TripContextStrip
                    trip={trip}
                    selectedFlight={selectedFlight}
                    boardingTime={boardingTime}
                    editState="editable"
                    onEdit={onEditTrip}
                />
                <div className="mt-c-6">
                {showCountdown ? (
                    <LeaveInHero parsed={countdownParsed} tone="urgent" />
                ) : (
                    <p
                        className="font-extrabold text-c-urgency leading-none tabular-nums"
                        style={{ fontSize: 'clamp(40px, 11vw, 72px)', fontWeight: 800, letterSpacing: '-0.02em' }}
                    >
                        LEAVE NOW
                    </p>
                )}
                </div>
                {terminal && (
                    <p className="c-type-footnote text-white/70 mt-c-3">
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

    // ── en_route (dark, focused). Locked — the trip is in-flight, the
    // strip shows "Untrack to edit" so the user can fall back to
    // editing by un-tracking and re-planning.
    if (phase === 'en_route') {
        const driveMin = recommendation?.segments?.find(s => s.id === 'transport')?.duration_minutes;
        return (
            <>
                <TripContextStrip
                    trip={trip}
                    selectedFlight={selectedFlight}
                    boardingTime={boardingTime}
                    editState="locked"
                    onUntrack={onUntrack}
                />
                <div className="c-type-caption text-c-brand-primary font-semibold uppercase tracking-wider mb-c-2 mt-c-6">EN ROUTE</div>
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

    // ── at_airport (dark). Locked phase.
    if (phase === 'at_airport') {
        return (
            <>
                <TripContextStrip
                    trip={trip}
                    selectedFlight={selectedFlight}
                    boardingTime={boardingTime}
                    editState="locked"
                    onUntrack={onUntrack}
                />
                <div className="c-type-caption text-c-brand-primary font-semibold uppercase tracking-wider mb-c-2 mt-c-6">AT THE AIRPORT</div>
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

    // ── at_gate (dark, calm). Locked phase.
    if (phase === 'at_gate') {
        const isDelayed = selectedFlight?.is_delayed;
        return (
            <>
                <TripContextStrip
                    trip={trip}
                    selectedFlight={selectedFlight}
                    boardingTime={boardingTime}
                    editState="locked"
                    onUntrack={onUntrack}
                />
                <div className="c-type-caption text-c-confidence font-semibold uppercase tracking-wider mb-c-2 mt-c-6">AT THE GATE</div>
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
function ActiveTimeline({ phase, recommendation, selectedFlight, transport, homeAddress, bufferMinutes }) {
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
        const parkingSeg = segments.find(s => s.id === 'parking');
        const isDriving = (transport || '').toLowerCase() === 'driving';
        const TRANSPORT_ICONS = { rideshare: Car, driving: Car, train: Train, bus: Bus };
        const TransportIcon = TRANSPORT_ICONS[(transport || '').toLowerCase()] || Car;
        const verbMap = { rideshare: 'Ride', driving: 'Drive', train: 'Train', bus: 'Bus' };
        const verb = verbMap[(transport || '').toLowerCase()] || 'Ride';

        // Sub-detail rules (Fix 7):
        //   Ride to SFO → none (address was redundant context)
        //   At SFO      → "+X min parking" only when driving, else none
        //   Bag drop    → "X drop" stays (quantifier, useful)
        //   TSA         → live wait time in amber (Fix 4 / 6 inherited)
        //   Gate        → "+X min buffer" in confidence when > 0
        const list = [];

        list.push({
            key: 'depart',
            Icon: transportSeg ? TransportIcon : House,
            name: transportSeg ? `${verb} to ${airportCode}` : 'Leave home',
            subtitle: null,
            subtitleTone: 'neutral',
            connectorPillAfter: transportSeg?.duration_minutes ? formatDuration(transportSeg.duration_minutes) : null,
        });

        if (airportSeg) {
            const parkingSubtitle = isDriving && parkingSeg?.duration_minutes
                ? `+${formatDuration(parkingSeg.duration_minutes)} parking`
                : null;
            list.push({
                key: 'at_airport',
                Icon: Buildings,
                name: `At ${airportCode}`,
                subtitle: parkingSubtitle,
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
            const bufferSubtitle = bufferMinutes > 0 ? `+${formatDuration(bufferMinutes)} buffer` : null;
            list.push({
                key: 'gate',
                Icon: Rocket,
                name: `Gate ${selectedFlight?.departure_gate || ''}`.trim() || 'At gate',
                subtitle: bufferSubtitle,
                subtitleTone: 'confidence',
                connectorPillAfter: null,
            });
        }

        return list;
    }, [recommendation, selectedFlight, transport, homeAddress, bufferMinutes]);

    if (rows.length === 0) return null;

    const currentStepKey = phaseToCurrentTimelineStep(phase);
    const currentStepCaption = phaseToCurrentStepCaption(phase);
    const isUrgent = phase === 'time-to-go';

    const subtitleClass = (tone) => tone === 'warning' ? 'text-c-warning'
        : tone === 'confidence' ? 'text-c-confidence'
        : 'text-c-text-tertiary';

    // "You're here" caption colour: urgency red in time-to-go, brand
    // purple elsewhere. Kept tight at ~11px so it reads as a tag, not
    // a label peer to the phase name.
    const captionColor = isUrgent ? 'text-c-urgency' : 'text-c-brand-primary';

    // Icon chip bumped 32px → 52px (Fix 6). Vertical connector moves
    // to left: 25px (half of 52px) so the line threads through icon
    // centres. Horizontal connector y-coordinate moves to 26px.
    const CHIP_SIZE = 52;
    const CHIP_HALF = CHIP_SIZE / 2; // 26

    // Per-row chip styling — current phase gets a solid brand fill +
    // pulse animation; others stay tinted surface. time-to-go swaps
    // to urgency red on the active step.
    const chipClass = (row) => {
        const isCurrent = row.key === currentStepKey;
        if (!isCurrent) return 'bg-c-brand-primary-surface';
        if (isUrgent) return 'bg-c-urgency animate-phase-pulse';
        return 'bg-c-brand-primary animate-phase-pulse';
    };
    const chipIconClass = (row) => {
        const isCurrent = row.key === currentStepKey;
        return isCurrent ? 'text-white' : 'text-c-brand-primary';
    };

    // ── Vertical layout (mobile, < md).
    const vertical = (
        <div className="md:hidden">
            {rows.map((row, i) => (
                <div key={row.key} className="relative flex items-start gap-c-4 py-c-3">
                    {i < rows.length - 1 && (
                        <span
                            aria-hidden="true"
                            className="absolute w-0.5"
                            style={{
                                left: `${CHIP_HALF - 1}px`,
                                top: `${CHIP_SIZE + 8}px`,
                                bottom: '0',
                                backgroundColor: 'rgb(79 63 211 / 0.25)',
                            }}
                        />
                    )}
                    <span
                        className={cn(
                            'relative z-10 shrink-0 rounded-c-md flex items-center justify-center',
                            chipClass(row)
                        )}
                        style={{ width: `${CHIP_SIZE}px`, height: `${CHIP_SIZE}px` }}
                    >
                        <row.Icon size={24} weight="regular" className={chipIconClass(row)} />
                    </span>
                    <div className="flex-1 min-w-0 pt-c-2">
                        <p className="c-type-body font-semibold text-c-text-primary">{row.name}</p>
                        {row.subtitle && (
                            <p className={cn('c-type-caption mt-0.5 inline-flex items-center gap-c-1', subtitleClass(row.subtitleTone))}>
                                {row.isLiveData && <LivePulseDot />}
                                {row.subtitle}
                            </p>
                        )}
                        {row.key === currentStepKey && currentStepCaption && (
                            <p className={cn('mt-c-1 font-bold uppercase', captionColor)}
                                style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                                {currentStepCaption}
                            </p>
                        )}
                        {row.connectorPillAfter && (
                            <span className="inline-flex items-center mt-c-1 px-c-2 py-0.5 rounded-c-pill bg-c-ground-elevated border border-c-brand-primary/30 c-type-caption text-c-text-primary font-bold whitespace-nowrap">
                                {row.connectorPillAfter}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // ── Horizontal layout (md:+). Flex-segments, each column renders
    // its own connector halves, abutting to form a continuous line.
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
                                style={{ top: `${CHIP_HALF - 1}px`, left: '0', right: '50%', backgroundColor: 'rgb(79 63 211 / 0.25)' }}
                            />
                        )}
                        {!isLast && (
                            <span
                                aria-hidden="true"
                                className="absolute h-0.5"
                                style={{ top: `${CHIP_HALF - 1}px`, left: '50%', right: '0', backgroundColor: 'rgb(79 63 211 / 0.25)' }}
                            />
                        )}
                        <span
                            className={cn(
                                'relative z-10 shrink-0 rounded-c-md flex items-center justify-center',
                                chipClass(row)
                            )}
                            style={{ width: `${CHIP_SIZE}px`, height: `${CHIP_SIZE}px` }}
                        >
                            <row.Icon size={24} weight="regular" className={chipIconClass(row)} />
                        </span>
                        {!isLast && row.connectorPillAfter && (
                            <span
                                className="absolute z-20 inline-flex items-center px-c-2 py-0.5 rounded-c-pill bg-c-ground-elevated border border-c-brand-primary/30 c-type-caption text-c-text-primary font-bold whitespace-nowrap"
                                style={{ top: `${CHIP_HALF}px`, left: '100%', transform: 'translate(-50%, -50%)' }}
                            >
                                {row.connectorPillAfter}
                            </span>
                        )}
                        <p className="mt-c-3 c-type-footnote font-semibold text-c-text-primary leading-tight">
                            {row.name}
                        </p>
                        {row.subtitle && (
                            <p className={cn('c-type-caption mt-0.5 inline-flex items-center gap-c-1 leading-tight', subtitleClass(row.subtitleTone))}>
                                {row.isLiveData && <LivePulseDot />}
                                {row.subtitle}
                            </p>
                        )}
                        {/* Reserved caption row — keeps column bottoms
                           aligned even though only the current step
                           actually shows the caption. */}
                        <div className="mt-c-1" style={{ minHeight: '14px' }}>
                            {row.key === currentStepKey && currentStepCaption && (
                                <p className={cn('font-bold uppercase leading-none', captionColor)}
                                    style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                                    {currentStepCaption}
                                </p>
                            )}
                        </div>
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
    onRefresh, onEdit, onEnterEditMode,
}) {
    const { token, updateTripCount } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { handleTabChange, authOpen, setAuthOpen, handleAuthSuccess } = useAuthGatedTabs();

    const [countdownParsed, setCountdownParsed] = useState(null);
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
            // Structured countdown — H/M/S slot values rendered by
            // CountdownSlots downstream, so the unit letters don't
            // shift horizontally as the digits tick.
            setCountdownParsed(parseCountdown(recommendation.leave_home_at));
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

    // Engine owns the edit-mode hydration logic; we just hand it the
    // current trip and let it flip its own viewMode + populate fields.
    // Going via navigate('/Engine', { state: { editTrip } }) wouldn't
    // work here — we're already on /Engine, so the one-shot mount
    // useEffect that consumes location.state never re-runs. The
    // onEnterEditMode prop plumbs the extracted hydration function.
    const handleEditTrip = () => {
        if (onEnterEditMode) onEnterEditMode(trip);
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
                originCity={cityForIata(selectedFlight?.origin_code)}
                destCity={cityForIata(selectedFlight?.destination_code)}
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
                    {/* Edit trip removed — now lives on the visible
                       TripContextStrip. Kebab retains the less-visible
                       actions: refresh, view details (preferences),
                       untrack. */}
                    <button type="button" onClick={() => { setMenuOpen(false); handleRefresh(); }}
                        className="w-full text-left px-c-4 py-c-2 c-type-footnote text-c-text-primary hover:bg-c-ground-sunken flex items-center gap-c-2">
                        <RefreshCw className="w-4 h-4" />
                        {refreshing ? 'Refreshing…' : refreshed ? 'Refreshed' : 'Refresh trip'}
                    </button>
                    <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }}
                        className="w-full text-left px-c-4 py-c-2 c-type-footnote text-c-text-primary hover:bg-c-ground-sunken flex items-center gap-c-2">
                        <SettingsIcon className="w-4 h-4" /> View trip details
                    </button>
                    <button type="button" onClick={() => { setMenuOpen(false); setUntrackOpen(true); }}
                        className="w-full text-left px-c-4 py-c-2 c-type-footnote text-c-urgency hover:bg-c-ground-sunken">
                        Untrack trip
                    </button>
                </div>
            )}

            {/* Hero card — floating glass/elevated surface overlapping
               the map bottom. Mobile gets extra top padding so the
               centred "Leave in" / countdown stack doesn't sit flush
               against the card edge; desktop stays at the compact 24px
               padding all round. */}
            <section
                className={cn(
                    'relative z-10 mx-c-4 md:mx-auto md:max-w-5xl rounded-c-lg shadow-c-md transition-colors duration-[600ms]',
                    'px-c-6 pb-c-6 pt-c-8 md:p-c-6',
                    theme === 'dark' ? 'bg-c-ground-elevated border border-white/5' : 'bg-c-ground-elevated border border-c-border-hairline'
                )}
                style={{ marginTop: mapHidden ? 80 : `-${Math.round(mapHeight * 0.17)}px` }}
            >
                <PhaseContent
                    phase={phase}
                    trip={trip}
                    recommendation={recommendation}
                    selectedFlight={selectedFlight}
                    transport={transport}
                    homeAddress={trip?.home_address}
                    countdownParsed={countdownParsed}
                    bufferMinutes={bufferMinutes}
                    boardingTime={boardingTime}
                    destinationCity={destinationCity}
                    onBook={openMapsNavigation}
                    onEditPrefs={onEdit}
                    onEditTrip={handleEditTrip}
                    onUntrack={() => setUntrackOpen(true)}
                    onOpenFeedback={() => {
                        // FeedbackPrompt is mounted at app level and opens via its own
                        // trigger pattern; we just navigate to Trips where it'll fire.
                        navigate(createPageUrl('Trips'));
                    }}
                />
            </section>

            {/* 4-dot phase bar removed — it duplicated the journey
               steps the ActiveTimeline already renders. Current-phase
               indication moves into the timeline itself (see
               ActiveTimeline's currentStepKey pulse treatment). */}

            {/* Filler for scroll so the TabBar doesn't crowd the hero
               card's bottom. */}
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

            {/* Dev-only debug pill — fixed bottom-left, DS tokens for
               colour + type so it doesn't read as a foreign element.
               Pointer-events none so it never eats taps on TabBar. */}
            {import.meta.env.DEV && (
                <div
                    className="fixed bottom-c-4 left-c-4 z-40 px-c-2 py-c-1 rounded-c-pill bg-c-ground-sunken text-c-text-tertiary c-type-caption font-mono pointer-events-none uppercase"
                >
                    {phase}{overridePhase ? ' · override' : ''}
                </div>
            )}
        </motion.div>
    );
}
