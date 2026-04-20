import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
    UberIcon, LyftIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon,
} from '@/components/BrandIcons';
import {
    Car, Train, Bus, MapPin, SuitcaseRolling, Shield,
    Clock, Timer, Rocket,
    WarningCircle, CheckCircle,
    Airplane as AirplanePhosphor, MagnifyingGlass, Gear,
    Buildings, Ticket, PersonSimpleWalk,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import TopBar from '@/components/design-system/TopBar';
import TabBar from '@/components/design-system/TabBar';
import Button from '@/components/design-system/Button';
import AuthModal from '@/components/engine/AuthModal';
import useAuthGatedTabs from '@/hooks/useAuthGatedTabs';
import { buildUberUrl, buildLyftUrl } from '@/utils/rideshareLinks';
import { formatLocalTime, formatDuration } from '@/utils/format';
import { isNative } from '@/utils/platform';
import airports from '@/data/airports.json';

/* ── Airport lookup (IATA → city name). Built once at module load. ──── */
const AIRPORT_BY_IATA = (() => {
    const m = new Map();
    for (const a of airports) m.set(a.iata, a);
    return m;
})();

function cityForIata(iata) {
    if (!iata) return null;
    return AIRPORT_BY_IATA.get(iata)?.city || null;
}

/* ── Time / date helpers ────────────────────────────────────────────── */
function formatUTCToLocal(utcStr) {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function addMinutesUTC(utcStr, minutes) {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    if (isNaN(d.getTime())) return '';
    d.setMinutes(d.getMinutes() + minutes);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function boardingTimeFrom(localDepartureStr) {
    if (!localDepartureStr) return '';
    let d;
    if (/[Zz]|[+-]\d{2}:\d{2}$/.test(localDepartureStr)) {
        d = new Date(localDepartureStr);
    } else {
        const m = localDepartureStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
        d = m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
    }
    if (!d || isNaN(d.getTime())) return '';
    d.setMinutes(d.getMinutes() - 30);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatTripDate(localIsoStr) {
    if (!localIsoStr) return '';
    const m = localIsoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function shortAddress(full) {
    if (!full) return '';
    const parts = full.split(',').map((s) => s.trim());
    return parts.length > 1 ? parts[0] : full;
}

function firstName(displayName) {
    if (!displayName) return null;
    return displayName.trim().split(/\s+/)[0] || null;
}

/* ── Segment → phase row mapping ────────────────────────────────────── */
const TRANSPORT_ICON = { rideshare: Car, driving: Car, train: Train, bus: Bus };
const TRANSPORT_VERB = { rideshare: 'Ride', driving: 'Drive', train: 'Train', bus: 'Bus' };

function pickTransportIcon(transport) {
    return TRANSPORT_ICON[(transport || '').toLowerCase()] || Car;
}

function pickTransportVerb(transport) {
    return TRANSPORT_VERB[(transport || '').toLowerCase()] || 'Ride';
}

function parseAdvice(advice) {
    if (!advice) return {};
    const out = {};
    for (const part of advice.split('|')) {
        const [k, v] = part.split(':').map((s) => s && s.trim());
        if (k && v !== undefined) out[k] = v;
    }
    return out;
}

function tsaSecurityLabel(adv) {
    if (!adv) return null;
    const tail = adv.split('|').pop()?.trim();
    if (tail === 'precheck') return 'PreCheck';
    if (tail === 'clear') return 'CLEAR';
    if (tail === 'clear_precheck') return 'PreCheck + CLEAR';
    if (tail === 'priority_lane') return 'Priority';
    return null;
}

/* ── Timeline data prep (restored from main branch JourneyVisualization) ─
   Builds a timelineSteps array and a connectorLabel(idx) closure that
   the desktop + mobile renderings share. Keeps main's segment-categorising
   logic (which phase renders which icon, which connector shows which
   duration) — only the visual classes are adapted to the current DS
   tokens + phosphor icons. */
const TRANSPORT_LABELS = {
    rideshare: 'Ride', driving: 'Drive', train: 'Train', bus: 'Bus', other: 'Ride',
};
function transportLabelFor(transport, airportCode) {
    const mode = TRANSPORT_LABELS[(transport || '').toLowerCase()] || 'Ride';
    return `${mode} to ${airportCode || 'Airport'}`;
}

// Phosphor equivalents of main's lucide icons + DS-token chip colours.
function getSegmentMeta(seg, airportCode, transport) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();
    const BRAND = { bg: 'bg-c-brand-primary-surface', iconColor: 'text-c-brand-primary' };
    const WARN  = { bg: 'bg-c-warning-surface', iconColor: 'text-c-warning' };
    const URG   = { bg: 'bg-c-urgency-surface', iconColor: 'text-c-urgency' };
    const CONF  = { bg: 'bg-c-confidence-surface', iconColor: 'text-c-confidence' };

    if (id === 'parking')
        return { Icon: Car, shortLabel: 'Parking', ...BRAND };
    if (id === 'transport' || label.includes('leave') || label.includes('depart') || label.includes('ride') || label.includes('drive') || label.includes('uber'))
        return { Icon: pickTransportIcon(transport), shortLabel: transportLabelFor(transport, airportCode), ...BRAND };
    if (id === 'at_airport' || label.includes('terminal'))
        return { Icon: Buildings, shortLabel: `At ${airportCode || 'Airport'}`, ...BRAND };
    if (id === 'checkin' || label.includes('check-in') || label.includes('counter'))
        return { Icon: Ticket, shortLabel: 'Check-in', ...BRAND };
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: SuitcaseRolling, shortLabel: 'Bag Drop', ...WARN };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, shortLabel: 'TSA Security', ...URG };
    if (id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: PersonSimpleWalk, shortLabel: 'At Gate', ...CONF };
    if (id === 'gate_buffer')
        return { Icon: Clock, shortLabel: 'Buffer', ...BRAND };
    if (label.includes('gate'))
        return { Icon: Ticket, shortLabel: 'At Gate', ...CONF };
    if (label.includes('board'))
        return { Icon: AirplanePhosphor, shortLabel: 'Board', ...CONF };
    return { Icon: MapPin, shortLabel: seg.label || 'Step', ...BRAND };
}

function buildTimelineSteps(recommendation, selectedFlight, transport) {
    const segments = recommendation?.segments || [];
    const leaveAt = recommendation?.leave_home_at;
    if (!leaveAt) return [];

    const airportCode = selectedFlight?.origin_code || '';
    const isDriving = (transport || '').toLowerCase() === 'driving';
    const parkingSeg = segments.find((s) => s.id === 'parking');
    const comfortBuffer = segments.find((s) => s.id === 'comfort_buffer' || s.id === 'gate_buffer');

    // allSegments drives time calculations (includes parking); displaySegments
    // drives rendering (omits parking — drivers see parking info as a
    // subtitle on the At-airport node instead of its own row).
    const allSegments = segments.filter((s) => s.id !== 'comfort_buffer' && s.id !== 'gate_buffer');
    const displaySegments = allSegments.filter((s) => s.id !== 'parking');

    return displaySegments.map((seg, idx) => {
        const fullIdx = allSegments.indexOf(seg);
        const cumulativeBefore = allSegments.slice(0, fullIdx).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const stepTime = addMinutesUTC(leaveAt, cumulativeBefore);
        const meta = getSegmentMeta(seg, airportCode, transport);
        const isLast = idx === displaySegments.length - 1;

        let displayTime;
        if (seg.id === 'at_airport' && isDriving && parkingSeg && parkingSeg.duration_minutes > 0) {
            // Pre-parking arrival at the airport surface
            displayTime = addMinutesUTC(leaveAt, cumulativeBefore - parkingSeg.duration_minutes);
        } else if (isLast) {
            displayTime = addMinutesUTC(leaveAt, cumulativeBefore + (seg.duration_minutes || 0));
        } else {
            displayTime = stepTime;
        }

        let subtitle = '';
        let connectorExtra = '';
        let securityBadge = '';

        if (seg.id === 'transport') {
            // Nothing below the node — duration lives on the outgoing connector.
        } else if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
            subtitle = `${formatDuration(waitMin)} wait`;
            const adviceParts = seg.advice?.split('|') || [];
            const secType = adviceParts[adviceParts.length - 1]?.trim();
            if (secType && secType !== 'none') {
                securityBadge =
                    secType === 'precheck' ? 'PreCheck' :
                    secType === 'clear' ? 'CLEAR' :
                    secType === 'clear_precheck' ? 'CLEAR + PreCheck' :
                    secType === 'priority_lane' ? 'Priority' : '';
            }
        } else if (seg.id === 'walk_to_gate') {
            if (comfortBuffer) subtitle = `+${formatDuration(comfortBuffer.duration_minutes)} buffer`;
        } else if (seg.id === 'at_airport') {
            const walkMatch = seg.advice?.match(/walk_to_next:(\d+)/);
            const walkMin = walkMatch ? parseInt(walkMatch[1], 10) : (seg.duration_minutes || 0);
            if (walkMin > 0) connectorExtra = `${formatDuration(walkMin)} walk`;
            if (isDriving && parkingSeg && parkingSeg.duration_minutes > 0) {
                subtitle = `${formatDuration(parkingSeg.duration_minutes)} parking`;
            }
        } else if (seg.id === 'bag_drop' || seg.id === 'checkin') {
            const bagMatch = seg.advice?.match(/(\d+)\s*bag/);
            const dropMatch = seg.advice?.match(/drop:(\d+)/);
            const counterMatch = seg.advice?.match(/counter:(\d+)/);
            const walkMatch = seg.advice?.match(/walk_to_next:(\d+)/);
            const bags = bagMatch ? parseInt(bagMatch[1], 10) : null;
            const dropMin = dropMatch ? parseInt(dropMatch[1], 10) : null;
            const counterMin = counterMatch ? parseInt(counterMatch[1], 10) : null;
            const parts = [];
            if (bags != null) parts.push(`${bags} bag${bags !== 1 ? 's' : ''}`);
            if (dropMin != null) parts.push(`${formatDuration(dropMin)} drop`);
            if (counterMin != null && !dropMin) parts.push(`${formatDuration(counterMin)} at counter`);
            subtitle = parts.length ? parts.join(' · ') : (seg.id === 'checkin' ? 'Get boarding pass' : 'Check bags');
            if (walkMatch) connectorExtra = `${formatDuration(parseInt(walkMatch[1], 10))} walk`;
        } else if (seg.advice) {
            subtitle = seg.advice;
        }

        return {
            ...meta,
            time: displayTime,
            durationMinutes: seg.duration_minutes,
            duration: formatDuration(seg.duration_minutes),
            connectorExtra,
            subtitle,
            securityBadge,
            seg,
            isLast,
        };
    });
}

function makeConnectorLabel(timelineSteps) {
    return function connectorLabel(idx) {
        const step = timelineSteps[idx];
        const nextStep = timelineSteps[idx + 1];
        if (!nextStep) return '';
        if (step.connectorExtra) return step.connectorExtra;
        if (step.seg.id === 'transport') return step.duration;
        if (step.seg.id === 'at_airport' && step.durationMinutes > 0) {
            return `${formatDuration(step.durationMinutes)} walk`;
        }
        if (nextStep.seg.id === 'walk_to_gate') return `${nextStep.duration} walk`;
        return nextStep.duration;
    };
}

/* ── Navigation deep links (drivers + transit) ──────────────────────── */
function buildAppleMapsUrl({ termLat, termLng, homeLat, homeLng, transit }) {
    const dirflg = transit ? 'r' : 'd';
    const saddr = homeLat != null && homeLng != null ? `saddr=${homeLat},${homeLng}&` : '';
    if (isNative()) return `maps://?${saddr}daddr=${termLat},${termLng}&dirflg=${dirflg}`;
    return `https://maps.apple.com/?${saddr}daddr=${termLat},${termLng}&dirflg=${dirflg}`;
}

function buildGoogleMapsUrl({ termLat, termLng, homeLat, homeLng, transit }) {
    const travelmode = transit ? 'transit' : 'driving';
    if (isNative()) {
        return `comgooglemaps://?daddr=${termLat},${termLng}&directionsmode=${travelmode}`;
    }
    const origin = homeLat != null && homeLng != null ? `&origin=${homeLat},${homeLng}` : '';
    return `https://www.google.com/maps/dir/?api=1${origin}&destination=${termLat},${termLng}&travelmode=${travelmode}`;
}

function buildWazeUrl({ termLat, termLng }) {
    if (isNative()) return `waze://?ll=${termLat},${termLng}&navigate=yes`;
    return `https://www.waze.com/ul?ll=${termLat},${termLng}&navigate=yes`;
}

/* ── Main Component ─────────────────────────────────────────────────── */
export default function ResultsView({
    recommendation, selectedFlight, transport,
    isAuthenticated, display_name,
    apiError, setApiError,
    onEditSetup, onReady,
    isTracked, onTrack,
    homeAddress,
    editMode, editIsDraft, editError, isUpdating, onUpdateTrip,
}) {
    const { isPro } = useAuth();
    const { handleTabChange, authOpen, setAuthOpen, handleAuthSuccess } = useAuthGatedTabs();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (recommendation && onReady) onReady();
    }, [recommendation, onReady]);

    const leaveAt = recommendation?.leave_home_at;
    const hasRecommendation = !!leaveAt;

    const segments = recommendation?.segments || [];
    const comfortBuffer = segments.find((s) => s.id === 'comfort_buffer' || s.id === 'gate_buffer');
    const bufferMinutes = comfortBuffer?.duration_minutes ?? recommendation?.gate_time_minutes ?? 0;

    const timelineSteps = useMemo(
        () => buildTimelineSteps(recommendation, selectedFlight, transport),
        [recommendation, selectedFlight, transport]
    );
    const connectorLabel = useMemo(() => makeConnectorLabel(timelineSteps), [timelineSteps]);

    const boardingTime = selectedFlight?.departure_time ? boardingTimeFrom(selectedFlight.departure_time) : '';
    const departureTime = selectedFlight?.departure_time ? formatLocalTime(selectedFlight.departure_time) : '';

    // City + date enrichment for the TopBar subtitle strip.
    const originCity = cityForIata(selectedFlight?.origin_code);
    const destCity = cityForIata(selectedFlight?.destination_code);
    const tripDate = formatTripDate(selectedFlight?.departure_time);

    const subtitleParts = [
        tripDate,
        selectedFlight?.flight_number,
        originCity && destCity
            ? `${originCity} → ${destCity}`
            : (selectedFlight?.origin_code && selectedFlight?.destination_code)
                ? `${selectedFlight.origin_code} → ${selectedFlight.destination_code}`
                : null,
        departureTime,
    ].filter(Boolean);

    // Only the Pro upsell banner uses this flag — the transport-mode-specific
    // standalone cards (Rideshare / Navigation) moved into HeroCard's
    // LauncherRow and compute their own mode locals.
    const isRideshareMode = (transport || '').toLowerCase() === 'rideshare';

    const handlePrimary = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            if (editMode && editIsDraft && onUpdateTrip) {
                await onUpdateTrip();
            } else if (editMode) {
                await onUpdateTrip?.();
            } else {
                // onTrack === Engine.handleTrackTrip — branches on
                // isAuthenticated internally. For unauth it sets
                // pendingTrackAfterAuth=true and opens the AuthModal so
                // AuthModal.onSuccess can auto-fire the POST /track.
                // Calling onSignIn here directly skipped that ref setup,
                // producing the "sign in → see paywall, not Active Trip"
                // regression from the Task 7.5 ResultsView rewrite.
                await onTrack?.();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const primaryLabel = editMode
        ? (isUpdating ? 'Updating…' : 'Update my trip')
        : isTracked
            ? 'Tracking your trip'
            : submitting
                ? 'Tracking…'
                : 'Track my trip';

    const primaryDisabled = editMode
        ? !!isUpdating
        : isTracked || submitting || !hasRecommendation;

    const signedInName = firstName(display_name);

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

    return (
        <div className="w-full max-w-[860px] mx-auto -mx-4 pb-28">
            <TopBar title="Results" onBack={onEditSetup} />

            {selectedFlight && subtitleParts.length > 0 && (
                <div className="border-b border-c-border-hairline bg-c-ground px-c-4 py-c-2">
                    <p className="c-type-footnote text-c-text-secondary text-center">
                        {subtitleParts.join(' · ')}
                    </p>
                </div>
            )}

            <div className="px-c-6 pb-c-12 pt-c-6 space-y-c-6">

                {apiError && (
                    <ErrorBanner message={apiError} onDismiss={() => setApiError?.(null)} />
                )}
                {editError && (
                    <ErrorBanner message={editError} />
                )}

                {!hasRecommendation && <HeroSkeleton />}

                {hasRecommendation && (
                    <>
                        <HeroCard
                            recommendation={recommendation}
                            selectedFlight={selectedFlight}
                            boardingTime={boardingTime}
                            bufferMinutes={bufferMinutes}
                            originCity={originCity}
                            destCity={destCity}
                            transport={transport}
                        />

                        {/* ── Journey timeline (restored from main) ───────
                           Shape ported from the main-branch JourneyVisualization
                           that the product team had already vetted: continuous
                           connector line through icon centres, duration pills
                           riding the line, vertical layout on mobile. Visual
                           classes adapted to the Concourse DS tokens +
                           phosphor icon set used across Sprint 7. */}
                        <section className="rounded-c-lg bg-c-ground-elevated border border-c-border-hairline px-c-6 py-c-5">
                            <h2 className="c-type-caption text-c-text-tertiary mb-c-4">YOUR JOURNEY TIMELINE</h2>
                            {homeAddress && (
                                <p className="c-type-footnote text-c-text-secondary mb-c-4 flex items-center gap-c-1">
                                    <MapPin size={14} weight="regular" className="text-c-text-tertiary shrink-0" />
                                    <span className="truncate">{shortAddress(homeAddress)}</span>
                                </p>
                            )}

                            {/* Desktop / tablet — horizontal timeline */}
                            <div className="hidden md:block">
                                <div className="relative pt-c-6">
                                    <div
                                        className="absolute left-8 right-8 h-0.5 bg-c-brand-primary/30 z-0"
                                        style={{ top: '3.5rem' }}
                                        aria-hidden="true"
                                    />
                                    {timelineSteps.length > 1 && (() => {
                                        const stepWidth = 100 / timelineSteps.length;
                                        return timelineSteps.slice(0, -1).map((_, idx) => {
                                            const leftPercent = stepWidth * idx + stepWidth;
                                            const label = connectorLabel(idx);
                                            if (!label) return null;
                                            return (
                                                <div
                                                    key={`dur-${idx}`}
                                                    className="absolute z-20"
                                                    style={{ top: '3.5rem', left: `${leftPercent}%`, transform: 'translate(-50%, -50%)' }}
                                                >
                                                    <div className="bg-c-ground px-c-3 py-c-1 rounded-c-sm border border-c-border-hairline shadow-c-sm flex items-center justify-center">
                                                        <span className="c-type-caption font-bold text-c-brand-primary whitespace-nowrap leading-none">{label}</span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                    <div className="relative z-10 flex justify-between">
                                        {timelineSteps.map((step, idx) => (
                                            <div key={idx} className="flex flex-col items-center text-center" style={{ width: `${100 / timelineSteps.length}%` }}>
                                                <div className={cn('w-12 h-12 rounded-c-md flex items-center justify-center mb-c-3 shadow-c-sm', step.bg)}>
                                                    <step.Icon size={22} weight="regular" className={step.iconColor} />
                                                </div>
                                                <p className="c-type-body font-bold text-c-text-primary tabular-nums">{step.time}</p>
                                                <p className="c-type-footnote text-c-text-secondary font-medium mt-c-1">{step.shortLabel}</p>
                                                {step.subtitle && (
                                                    <p className="c-type-caption text-c-brand-primary font-medium mt-c-1 max-w-[140px] leading-tight">
                                                        {step.subtitle}
                                                    </p>
                                                )}
                                                {step.securityBadge && (
                                                    <span className="c-type-caption font-medium text-c-confidence bg-c-confidence-surface px-c-2 py-0.5 rounded-c-xs mt-c-1 inline-block">
                                                        {step.securityBadge}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile — vertical timeline */}
                            <div className="md:hidden space-y-0">
                                {timelineSteps.map((step, idx) => (
                                    <div key={idx}>
                                        <div className="flex items-start gap-c-4">
                                            <div className="flex flex-col items-center">
                                                <div className={cn('w-10 h-10 rounded-c-md flex items-center justify-center shrink-0', step.bg)}>
                                                    <step.Icon size={18} weight="regular" className={step.iconColor} />
                                                </div>
                                                {idx < timelineSteps.length - 1 && (
                                                    <div className="relative w-0.5 h-10 bg-c-brand-primary/30 my-c-1">
                                                        {connectorLabel(idx) && (
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 c-type-caption font-bold text-c-brand-primary bg-c-ground px-c-2 py-0.5 rounded-c-xs border border-c-border-hairline shadow-c-sm whitespace-nowrap">
                                                                {connectorLabel(idx)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pb-c-4 pt-c-1">
                                                <div className="flex items-center gap-c-2">
                                                    <p className="c-type-body font-bold text-c-text-primary">{step.shortLabel}</p>
                                                    <span className="c-type-caption font-bold text-c-brand-primary bg-c-brand-primary-surface px-c-2 py-0.5 rounded-c-sm tabular-nums">
                                                        {step.time}
                                                    </span>
                                                </div>
                                                {step.subtitle && (
                                                    <p className="c-type-footnote text-c-brand-primary font-medium mt-c-1">{step.subtitle}</p>
                                                )}
                                                {step.securityBadge && (
                                                    <span className="c-type-caption font-medium text-c-confidence bg-c-confidence-surface px-c-2 py-0.5 rounded-c-xs mt-c-1 inline-block">
                                                        {step.securityBadge}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── Boarding + Flight row ────────────────────── */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-c-3">
                            <InfoCard
                                eyebrow="BOARDING"
                                value={boardingTime || '—'}
                                subtitle={bufferMinutes ? `${formatDuration(bufferMinutes)} cushion at gate` : 'Boards 30 min before departure'}
                            />
                            <InfoCard
                                eyebrow="FLIGHT DEPARTS"
                                value={departureTime || '—'}
                                subtitle={[
                                    selectedFlight?.flight_number,
                                    selectedFlight?.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : null,
                                ].filter(Boolean).join(' · ') || null}
                                urgency={selectedFlight?.is_delayed}
                                urgencyNote={selectedFlight?.is_delayed && selectedFlight?.revised_departure_local
                                    ? `Delayed · new time ${formatLocalTime(selectedFlight.revised_departure_local)}`
                                    : null}
                            />
                        </section>

                        {/* Launcher icons for Rideshare / Drive / Transit now
                           live inside the HeroCard above (LauncherRow) — the
                           standalone "BOOK YOUR RIDE" and "NAVIGATE TO …"
                           sections they replaced took too much vertical real
                           estate for a small set of brand-icon shortcuts. */}

                        {/* ── Primary CTA ──────────────────────────────── */}
                        <div className="pt-c-2">
                            <Button
                                variant="primary"
                                full
                                disabled={primaryDisabled}
                                onClick={handlePrimary}
                                leftIcon={isTracked && !editMode ? <CheckCircle size={18} weight="fill" /> : <Rocket size={18} weight="fill" />}
                            >
                                {primaryLabel}
                            </Button>
                            {!editMode && !isAuthenticated && (
                                <p className="c-type-footnote text-c-text-tertiary text-center mt-c-3">
                                    Sign in to save this trip and get live updates.
                                </p>
                            )}
                            {!editMode && isAuthenticated && !isTracked && (
                                <p className="c-type-footnote text-c-text-tertiary text-center mt-c-3 flex items-center justify-center gap-c-1">
                                    <CheckCircle size={12} weight="fill" className="text-c-confidence" />
                                    <span>
                                        {signedInName
                                            ? `Signed in as ${signedInName} — your trip will save automatically.`
                                            : 'Signed in — your trip will save automatically.'}
                                    </span>
                                </p>
                            )}
                        </div>

                        {isAuthenticated && !isPro && !isRideshareMode && !editMode && (
                            <div className="rounded-c-md bg-c-brand-primary-surface border border-c-brand-primary/20 p-c-4">
                                <p className="c-type-footnote text-c-text-primary">
                                    <span className="font-semibold">AirBridge Pro</span> adds one-tap turn-by-turn directions to your terminal.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <TabBar onChange={handleTabChange} tabs={tabs} />

            <AuthModal
                open={authOpen}
                onOpenChange={setAuthOpen}
                onSuccess={handleAuthSuccess}
            />
        </div>
    );
}

/* ── Hero card (brief §4.5) ──────────────────────────────────────────── */
function HeroCard({
    recommendation, selectedFlight, boardingTime, bufferMinutes,
    originCity, destCity, transport,
}) {
    const leaveTime = formatUTCToLocal(recommendation?.leave_home_at);
    const status = selectedFlight?.canceled
        ? 'Cancelled'
        : selectedFlight?.is_delayed
            ? 'Delayed'
            : 'On time';
    const statusTone = selectedFlight?.canceled
        ? 'bg-c-urgency-surface text-c-urgency'
        : selectedFlight?.is_delayed
            ? 'bg-c-warning-surface text-c-warning'
            : 'bg-c-confidence-surface text-c-confidence';

    return (
        <div className="rounded-c-lg bg-c-brand-primary-surface border border-c-brand-primary/15 p-c-8 shadow-c-sm">
            <div className="flex items-center gap-c-2 c-type-caption text-c-brand-primary mb-c-3">
                <Timer size={14} weight="fill" />
                <span>LEAVE AT</span>
            </div>
            <p className="c-type-hero text-c-brand-primary tracking-tight">{leaveTime}</p>

            {/* Flight identifier cluster — now with city names */}
            <div className="flex flex-wrap items-center gap-c-2 mt-c-4">
                <IdBadge>{selectedFlight?.flight_number}</IdBadge>
                {selectedFlight?.origin_code && selectedFlight?.destination_code && (
                    <span className="c-type-footnote text-c-text-secondary">
                        {selectedFlight.origin_code}{originCity ? ` · ${originCity}` : ''}
                        {' → '}
                        {selectedFlight.destination_code}{destCity ? ` · ${destCity}` : ''}
                    </span>
                )}
                {selectedFlight?.departure_terminal && (
                    <IdBadge variant="subtle">Terminal {selectedFlight.departure_terminal}</IdBadge>
                )}
                {selectedFlight?.departure_gate && (
                    <IdBadge variant="subtle">Gate {selectedFlight.departure_gate}</IdBadge>
                )}
                <span className={cn('inline-flex items-center px-c-2 py-c-1 rounded-c-pill c-type-footnote font-semibold', statusTone)}>
                    {status}
                </span>
            </div>

            {/* Pill row + inline launcher icons. Boarding + buffer sit on
               the left; the transport-mode brand shortcuts float on the
               right via ml-auto. Single row — no divider, no "Open in"
               label needed because the icons are self-explanatory in
               context. */}
            <div className="flex flex-wrap items-center gap-c-2 mt-c-5">
                {boardingTime && <HeroPill icon={Clock}>Boarding {boardingTime}</HeroPill>}
                {bufferMinutes > 0 && (
                    <HeroPill icon={Timer}>+{formatDuration(bufferMinutes)} buffer</HeroPill>
                )}
                <LauncherIcons
                    transport={transport}
                    recommendation={recommendation}
                    selectedFlight={selectedFlight}
                />
            </div>
        </div>
    );
}

/* ── Launcher icons — brand-icon shortcuts inside HeroCard pill row ─── */
function LauncherIcons({ transport, recommendation, selectedFlight }) {
    const t = (transport || '').toLowerCase();
    const isRideshare = t === 'rideshare';
    const isDriving = t === 'driving';
    const isTransit = t === 'train' || t === 'bus' || t === 'transit';

    const homeCoords = recommendation?.home_coordinates;
    const termCoords = recommendation?.terminal_coordinates;
    if (!termCoords) return null;

    const rideshareCoords = {
        homeLat: homeCoords?.lat,
        homeLng: homeCoords?.lng,
        termLat: termCoords.lat,
        termLng: termCoords.lng,
        airportCode: selectedFlight?.origin_code || '',
        terminal: selectedFlight?.departure_terminal || '',
    };
    const navCoords = {
        homeLat: homeCoords?.lat,
        homeLng: homeCoords?.lng,
        termLat: termCoords.lat,
        termLng: termCoords.lng,
        transit: isTransit,
    };

    // Build the launcher list per transport mode. Transit omits Waze
    // (driving only). Rideshare picker icons are themselves coloured brand
    // containers (Uber black square, Lyft pink square) so they render as
    // bare icons. Drive / transit map apps ship low-contrast marks that
    // fade into the hero's tinted background without visual containment —
    // those get wrapped in a branded chip with a short label.
    let launchers = [];
    if (isRideshare) {
        const uberHref = homeCoords ? buildUberUrl(rideshareCoords) : null;
        const lyftHref = homeCoords ? buildLyftUrl(rideshareCoords) : null;
        launchers = [
            uberHref && { href: uberHref, Icon: UberIcon, label: 'Open in Uber' },
            lyftHref && { href: lyftHref, Icon: LyftIcon, label: 'Open in Lyft' },
        ].filter(Boolean);
    } else if (isDriving) {
        launchers = [
            { href: buildAppleMapsUrl(navCoords), Icon: AppleMapsIcon, label: 'Open in Apple Maps', short: 'Maps' },
            { href: buildGoogleMapsUrl(navCoords), Icon: GoogleMapsIcon, label: 'Open in Google Maps', short: 'Google' },
            { href: buildWazeUrl(navCoords), Icon: WazeIcon, label: 'Open in Waze', short: 'Waze' },
        ];
    } else if (isTransit) {
        launchers = [
            { href: buildAppleMapsUrl(navCoords), Icon: AppleMapsIcon, label: 'Open in Apple Maps', short: 'Maps' },
            { href: buildGoogleMapsUrl(navCoords), Icon: GoogleMapsIcon, label: 'Open in Google Maps', short: 'Google' },
        ];
    }

    if (launchers.length === 0) return null;

    // Rideshare: bare icons — Uber/Lyft marks are already branded containers.
    if (isRideshare) {
        return (
            <div className="ml-auto flex items-center gap-c-2">
                {launchers.map(({ href, Icon, label }) => (
                    <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-c-sm hover:opacity-80 active:scale-95 transition-all"
                    >
                        <Icon size={28} />
                    </a>
                ))}
            </div>
        );
    }

    // Drive / transit: branded chips. The chip's white rounded container
    // provides the visual containment the bare map marks lack, and the
    // short brand label disambiguates between Apple Maps ("Maps") and
    // Google Maps ("Google") sitting next to each other.
    return (
        <div className="ml-auto flex items-center gap-c-2">
            {launchers.map(({ href, Icon, label, short }) => (
                <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="inline-flex items-center gap-c-1 h-11 px-c-3 rounded-c-md bg-c-ground-elevated border border-c-border-hairline shadow-c-sm hover:bg-c-ground-sunken active:scale-95 transition-all"
                >
                    <Icon size={20} />
                    <span className="c-type-caption text-c-text-secondary font-semibold">{short}</span>
                </a>
            ))}
        </div>
    );
}

function IdBadge({ children, variant = 'default' }) {
    if (!children) return null;
    return (
        <span className={cn(
            'inline-flex items-center px-c-2 py-c-1 rounded-c-xs c-type-footnote font-semibold',
            variant === 'subtle'
                ? 'bg-c-ground-elevated text-c-text-secondary border border-c-border-hairline'
                : 'bg-c-brand-primary text-c-text-inverse'
        )}>
            {children}
        </span>
    );
}

function HeroPill({ icon: Icon, children }) {
    return (
        <span className="inline-flex items-center gap-c-1 px-c-3 py-c-1 rounded-c-pill bg-c-ground-elevated c-type-footnote text-c-text-primary border border-c-border-hairline">
            <Icon size={12} weight="fill" className="text-c-brand-primary" />
            {children}
        </span>
    );
}

/* ── Info card (boarding / flight departs) ──────────────────────────── */
function InfoCard({ eyebrow, value, subtitle, urgency, urgencyNote }) {
    return (
        <div className={cn(
            'rounded-c-md p-c-5 border',
            urgency
                ? 'bg-c-warning-surface border-c-warning/20'
                : 'bg-c-ground-elevated border-c-border-hairline'
        )}>
            <p className={cn('c-type-caption mb-c-2', urgency ? 'text-c-warning' : 'text-c-text-tertiary')}>
                {eyebrow}
            </p>
            <p className={cn('c-type-display tracking-tight', urgency ? 'text-c-warning' : 'text-c-text-primary')}>
                {value}
            </p>
            {subtitle && !urgencyNote && (
                <p className="c-type-footnote text-c-text-secondary mt-c-2">{subtitle}</p>
            )}
            {urgencyNote && (
                <p className="c-type-footnote text-c-warning font-semibold mt-c-2">{urgencyNote}</p>
            )}
        </div>
    );
}

/* ── Error banner ───────────────────────────────────────────────────── */
function ErrorBanner({ message, onDismiss }) {
    return (
        <div className="rounded-c-md bg-c-urgency-surface border border-c-urgency/30 p-c-4 flex items-start gap-c-3">
            <WarningCircle size={20} weight="regular" className="text-c-urgency shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="c-type-footnote text-c-urgency">{message}</p>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="c-type-footnote text-c-urgency underline mt-c-1"
                    >
                        Dismiss
                    </button>
                )}
            </div>
        </div>
    );
}

function HeroSkeleton() {
    return (
        <div className="rounded-c-lg bg-c-brand-primary-surface p-c-8 animate-pulse">
            <div className="h-4 w-20 bg-c-brand-primary/20 rounded-c-xs mb-c-4" />
            <div className="h-16 w-48 bg-c-brand-primary/30 rounded-c-md" />
            <div className="h-4 w-3/4 bg-c-brand-primary/20 rounded-c-xs mt-c-6" />
        </div>
    );
}
