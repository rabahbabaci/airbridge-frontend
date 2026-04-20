import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
    UberIcon, LyftIcon, AppleMapsIcon, GoogleMapsIcon, WazeIcon,
} from '@/components/BrandIcons';
import {
    House, Car, Train, Bus, MapPin, SuitcaseRolling, Shield,
    Clock, Timer, Rocket,
    WarningCircle, CheckCircle,
    Airplane as AirplanePhosphor, MagnifyingGlass, Gear,
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

// Row metadata consumed by TimelineRow / HorizontalTimelineRow:
//   subtitleTone 'neutral'    — plain fact (bag count, parking note).
//                               Renders --c-text-tertiary.
//   subtitleTone 'confidence' — good news (buffer cushion). --c-confidence.
//   subtitleTone 'warning'    — heads up (TSA wait over typical). --c-warning.
//   iconTone     'brand'      — default brand chip.
//   iconTone     'warning'    — TSA gets an urgency chip so it pops.
//   iconTone     'confidence' — gate phase reads as "you're set".
//   connectorPillAfter        — string shown as a pill on the outgoing
//                               connector line after this row, at the icon
//                               centreline between this row and the next.
//                               Reserved for in-transit durations (drive,
//                               airport walk, gate walk) — NOT in-phase
//                               service times (bag drop, TSA wait).
const TSA_WAIT_HEADS_UP_THRESHOLD_MIN = 30;

function buildTimelineRows(recommendation, selectedFlight, transport, homeAddress, bufferMinutes) {
    const segments = recommendation?.segments || [];
    const leaveAt = recommendation?.leave_home_at;
    if (!leaveAt) return [];

    const airportCode = selectedFlight?.origin_code || 'Airport';
    const verb = pickTransportVerb(transport);
    const TransportIcon = pickTransportIcon(transport);

    const transportSeg = segments.find((s) => s.id === 'transport');
    const parkingSeg = segments.find((s) => s.id === 'parking');
    const airportSeg = segments.find((s) => s.id === 'at_airport');
    const walkSeg = segments.find((s) => s.id === 'walk_to_gate');

    // Phase-level segments render as icons (rows). Transit / meta segments
    // (transport, walk_to_gate, parking, buffer) are either consumed into
    // the departure row or surfaced as pills on connector lines.
    const phaseSegs = segments.filter((s) =>
        s.id !== 'transport' &&
        s.id !== 'walk_to_gate' &&
        s.id !== 'at_airport' &&
        s.id !== 'parking' &&
        s.id !== 'comfort_buffer' &&
        s.id !== 'gate_buffer'
    );

    const rows = [];
    let cum = 0; // minutes since leaveAt

    // ── Row 1 — departure. When a transport segment exists we merge the
    // "leave home" moment with the transit verb (Ride to SFO / Drive to
    // SFO / etc.) so the first icon is the mode, not a House. That matches
    // the reference design where the journey is framed around the action.
    rows.push({
        key: 'depart',
        Icon: transportSeg ? TransportIcon : House,
        name: transportSeg ? `${verb} to ${airportCode}` : 'Leave home',
        subtitle: transportSeg ? null : (homeAddress ? shortAddress(homeAddress) : null),
        subtitleTone: 'neutral',
        iconTone: 'brand',
        time: formatUTCToLocal(leaveAt),
        connectorPillAfter: transportSeg?.duration_minutes
            ? formatDuration(transportSeg.duration_minutes)
            : null,
    });
    cum += transportSeg?.duration_minutes || 0;

    // ── Row 2 — At airport. The segment's own duration represents the
    // walk from drop-off / parking to the concourse, surfaced as the pill
    // on the outgoing connector.
    if (airportSeg) {
        rows.push({
            key: 'at_airport',
            Icon: MapPin,
            name: `At ${airportCode}`,
            subtitle: parkingSeg?.duration_minutes
                ? `+${formatDuration(parkingSeg.duration_minutes)} parking`
                : null,
            subtitleTone: 'neutral',
            iconTone: 'brand',
            time: addMinutesUTC(leaveAt, cum),
            connectorPillAfter: airportSeg.duration_minutes
                ? `${formatDuration(airportSeg.duration_minutes)} walk`
                : null,
        });
        cum += airportSeg.duration_minutes || 0;
        if (parkingSeg?.duration_minutes) cum += parkingSeg.duration_minutes;
    }

    // ── Middle rows — bag drop, check in, TSA. These are service phases;
    // their duration is time spent AT the phase, so sub-details sit under
    // the label (not on the connector).
    for (let i = 0; i < phaseSegs.length; i++) {
        const seg = phaseSegs[i];
        const arrivalTime = addMinutesUTC(leaveAt, cum);
        cum += seg.duration_minutes || 0;
        const isLastMiddle = i === phaseSegs.length - 1;

        // If this is the last service phase and there's a walk_to_gate
        // after it, the walk duration renders as the connector pill out
        // of this row — "TSA Security → 7 min walk → At gate".
        const pillAfter = isLastMiddle && walkSeg?.duration_minutes
            ? `${formatDuration(walkSeg.duration_minutes)} walk`
            : null;

        if (seg.id === 'bag_drop' || seg.id === 'checkin') {
            const adv = parseAdvice(seg.advice);
            const bagCount = adv.bags || parseInt(seg.advice?.match(/(\d+)\s*bag/)?.[1] || '', 10);
            const parts = [];
            if (!Number.isNaN(bagCount) && bagCount > 0) {
                parts.push(`${bagCount} bag${bagCount !== 1 ? 's' : ''}`);
            }
            if (seg.duration_minutes) parts.push(`${formatDuration(seg.duration_minutes)} drop`);
            rows.push({
                key: `bag-${i}`,
                Icon: SuitcaseRolling,
                name: seg.id === 'checkin' ? 'Check in' : 'Bag drop',
                subtitle: parts.length ? parts.join(' · ') : null,
                subtitleTone: 'neutral',
                iconTone: 'brand',
                time: arrivalTime,
                connectorPillAfter: pillAfter,
            });
            continue;
        }
        if (seg.id === 'tsa') {
            const adv = parseAdvice(seg.advice);
            const waitMin = adv.wait ? parseInt(adv.wait, 10) : seg.duration_minutes;
            const isHeadsUp = Number.isFinite(waitMin) && waitMin > TSA_WAIT_HEADS_UP_THRESHOLD_MIN;
            rows.push({
                key: `tsa-${i}`,
                Icon: Shield,
                name: 'TSA Security',
                subtitle: `${formatDuration(waitMin)} wait`,
                subtitleTone: isHeadsUp ? 'warning' : 'neutral',
                iconTone: 'warning',
                badge: tsaSecurityLabel(seg.advice),
                time: arrivalTime,
                connectorPillAfter: pillAfter,
            });
            continue;
        }
        // Generic fallback for an unknown phase id — treat as brand row.
        rows.push({
            key: `seg-${i}`,
            Icon: MapPin,
            name: seg.label || seg.id,
            subtitle: seg.duration_minutes ? formatDuration(seg.duration_minutes) : null,
            subtitleTone: 'neutral',
            iconTone: 'brand',
            time: arrivalTime,
            connectorPillAfter: pillAfter,
        });
    }

    // ── Final row — At gate. Synthesized (backend has no at_gate segment;
    // walk_to_gate's end time is the gate arrival). Buffer minutes surface
    // here as a confidence-green sub-detail: "you've landed with time to
    // spare".
    if (walkSeg?.duration_minutes) {
        cum += walkSeg.duration_minutes;
        const gateName = `At gate ${selectedFlight?.departure_gate || ''}`.trim() || 'At gate';
        rows.push({
            key: 'at_gate',
            Icon: Rocket,
            name: gateName,
            subtitle: bufferMinutes > 0 ? `+${formatDuration(bufferMinutes)} buffer` : null,
            subtitleTone: 'confidence',
            iconTone: 'confidence',
            time: addMinutesUTC(leaveAt, cum),
            connectorPillAfter: null,
        });
    }

    return rows;
}

// Returns Tailwind class pair for an icon chip given its tone.
function iconChipClasses(tone) {
    if (tone === 'warning') return { bg: 'bg-c-urgency-surface', text: 'text-c-urgency' };
    if (tone === 'confidence') return { bg: 'bg-c-confidence-surface', text: 'text-c-confidence' };
    return { bg: 'bg-c-brand-primary-surface', text: 'text-c-brand-primary' };
}

// Sub-detail color per tone.
function subtitleToneClasses(tone) {
    if (tone === 'confidence') return 'text-c-confidence';
    if (tone === 'warning') return 'text-c-warning';
    return 'text-c-text-tertiary';
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

    const timelineRows = useMemo(
        () => buildTimelineRows(recommendation, selectedFlight, transport, homeAddress, bufferMinutes),
        [recommendation, selectedFlight, transport, homeAddress, bufferMinutes]
    );

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

                        {/* ── Journey timeline ─────────────────────────── */}
                        <section>
                            <h2 className="c-type-headline text-c-text-primary mb-c-1">Your journey timeline</h2>
                            {homeAddress && (
                                <p className="c-type-footnote text-c-text-secondary mb-c-4 flex items-center gap-c-1">
                                    <MapPin size={12} weight="fill" className="text-c-text-tertiary" />
                                    <span className="truncate">{shortAddress(homeAddress)}</span>
                                </p>
                            )}
                            {/* Mobile — vertical list, the default experience on
                               phones. Each phase is its own row with a running
                               connector along the left edge. */}
                            <div className="md:hidden rounded-c-lg bg-c-ground-elevated border border-c-border-hairline overflow-hidden">
                                {timelineRows.map((row, i) => (
                                    <TimelineRow
                                        key={row.key}
                                        row={row}
                                        isFirst={i === 0}
                                        isLast={i === timelineRows.length - 1}
                                    />
                                ))}
                            </div>
                            {/* Tablet/desktop — horizontal track showing every
                               phase at a glance. Keeps the single-glance scan
                               the brief wants from Results on wider screens. */}
                            <div className="hidden md:flex rounded-c-lg bg-c-ground-elevated border border-c-border-hairline overflow-hidden">
                                {timelineRows.map((row, i) => (
                                    <HorizontalTimelineRow
                                        key={row.key}
                                        row={row}
                                        isFirst={i === 0}
                                        isLast={i === timelineRows.length - 1}
                                    />
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

    // Build the launcher list per transport mode. Transit omits Waze (driving
    // only) — Apple Maps transit coverage is spotty, but we still surface it
    // so users can pick; Google Maps is the primary transit provider.
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
            { href: buildAppleMapsUrl(navCoords), Icon: AppleMapsIcon, label: 'Open in Apple Maps' },
            { href: buildGoogleMapsUrl(navCoords), Icon: GoogleMapsIcon, label: 'Open in Google Maps' },
            { href: buildWazeUrl(navCoords), Icon: WazeIcon, label: 'Open in Waze' },
        ];
    } else if (isTransit) {
        launchers = [
            { href: buildAppleMapsUrl(navCoords), Icon: AppleMapsIcon, label: 'Open in Apple Maps' },
            { href: buildGoogleMapsUrl(navCoords), Icon: GoogleMapsIcon, label: 'Open in Google Maps' },
        ];
    }

    if (launchers.length === 0) return null;

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

/* ── Timeline row — vertical, mobile ────────────────────────────────── */
function TimelineRow({ row, isFirst, isLast }) {
    const { Icon, name, subtitle, subtitleTone, time, badge, iconTone, connectorPillAfter } = row;
    const chip = iconChipClasses(iconTone);
    return (
        <div className="relative flex items-start gap-c-3 px-c-4 py-c-3">
            {!isLast && (
                <span
                    aria-hidden="true"
                    className="absolute w-0.5 bg-c-brand-primary/20"
                    style={{ left: '31px', top: '44px', bottom: '0' }}
                />
            )}
            <span
                className={cn(
                    'relative z-10 shrink-0 w-10 h-10 rounded-c-md flex items-center justify-center',
                    chip.bg
                )}
            >
                <Icon
                    size={18}
                    weight={isFirst || isLast ? 'fill' : 'regular'}
                    className={chip.text}
                />
            </span>
            <div className="flex-1 min-w-0">
                <p className="c-type-body font-semibold text-c-text-primary">{name}</p>
                {connectorPillAfter && (
                    <span className="inline-flex items-center mt-c-1 px-c-2 py-0.5 rounded-c-pill bg-c-ground-elevated border border-c-brand-primary/30 c-type-caption text-c-text-primary font-medium whitespace-nowrap">
                        {connectorPillAfter}
                    </span>
                )}
                {subtitle && (
                    <p className={cn('c-type-footnote mt-c-1', subtitleToneClasses(subtitleTone))}>
                        {subtitle}
                        {badge && (
                            <span className="ml-c-2 inline-flex items-center px-c-1 rounded-c-xs bg-c-confidence-surface text-c-confidence font-semibold">
                                {badge}
                            </span>
                        )}
                    </p>
                )}
            </div>
            <span className="shrink-0 c-type-body font-semibold text-c-text-primary tabular-nums self-center">
                {time}
            </span>
        </div>
    );
}

// Horizontal layout for md:+ viewports. Per-column stack:
//   rounded-square icon chip → bold time → phase label → optional sub-detail.
// A continuous 2px brand-tinted connector threads horizontally through
// icon centres across columns. Rows carrying `connectorPillAfter` render
// a pill floating at the boundary between this column and the next,
// centred on the connector line — matching the reference design where
// transit durations (drive, airport walk, gate walk) live ON the line.
function HorizontalTimelineRow({ row, isFirst, isLast }) {
    const { Icon, name, subtitle, subtitleTone, time, badge, iconTone, connectorPillAfter } = row;
    const chip = iconChipClasses(iconTone);
    // Icon chip centres at 20px from its top within a w-10/h-10 box. Column
    // top padding is py-c-5; icon chip sits at the top, so its centre-y
    // relative to the column = py-c-5 + 20px. Using approximate absolute
    // px offsets for the connector + pill vertical placement.
    const ICON_CENTER_Y = 40; // py-c-5 (~20px) + h-10/2 (20px)
    return (
        <div className="relative flex-1 min-w-0 flex flex-col items-center px-c-2 py-c-5">
            {/* Continuous connector line to the next column — 2px brand
               tint, spanning from this icon's right edge (50%) to the next
               icon's left edge (-50% into next column). */}
            {!isLast && (
                <span
                    aria-hidden="true"
                    className="absolute bg-c-brand-primary/20"
                    style={{ top: `${ICON_CENTER_Y - 1}px`, height: '2px', left: 'calc(50% + 20px)', right: 'calc(-50% + 20px)' }}
                />
            )}
            <span
                className={cn(
                    'relative z-10 w-10 h-10 rounded-c-md flex items-center justify-center',
                    chip.bg
                )}
            >
                <Icon
                    size={18}
                    weight={isFirst || isLast ? 'fill' : 'regular'}
                    className={chip.text}
                />
            </span>
            {/* Pill riding the connector — centred horizontally on the
               column boundary, vertically on the connector line. */}
            {!isLast && connectorPillAfter && (
                <span
                    className="absolute z-20 inline-flex items-center px-c-3 py-c-1 rounded-c-pill bg-c-ground-elevated border border-c-brand-primary/30 shadow-c-sm c-type-caption text-c-text-primary font-medium whitespace-nowrap"
                    style={{ top: `${ICON_CENTER_Y}px`, left: '100%', transform: 'translate(-50%, -50%)' }}
                >
                    {connectorPillAfter}
                </span>
            )}
            <p className="mt-c-3 c-type-headline text-c-text-primary tabular-nums">
                {time}
            </p>
            <p className="c-type-footnote font-semibold text-c-text-primary text-center leading-tight mt-c-1">
                {name}
            </p>
            {subtitle && (
                <p className={cn('c-type-caption text-center leading-tight mt-c-1', subtitleToneClasses(subtitleTone))}>
                    {subtitle}
                </p>
            )}
            {badge && (
                <span className="mt-c-1 inline-flex items-center px-c-2 rounded-c-xs bg-c-confidence-surface text-c-confidence c-type-caption font-semibold">
                    {badge}
                </span>
            )}
        </div>
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
