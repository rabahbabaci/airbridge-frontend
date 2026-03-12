import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Car, Train, Bus, Shield, Clock, MapPin, Luggage, Building2, PersonStanding, Ticket, CheckCircle2 } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUTCToLocal(utcStr) {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function addMinutesAndFormat(utcStr, minutes) {
    const d = new Date(utcStr);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Parse flight departure time to get boarding time (30 min before departure)
function parseDepartureTime(localTimeStr) {
    if (!localTimeStr) return null;
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
}

function parseDepartureAndGetBoardingTime(localTimeStr) {
    if (!localTimeStr) return { boarding: '', departure: '' };
    const d = parseDepartureTime(localTimeStr);
    if (!d) return { boarding: localTimeStr, departure: localTimeStr };
    const boardingDate = new Date(d.getTime() - 30 * 60000);
    const fmt = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { boarding: fmt(boardingDate), departure: fmt(d) };
}

function totalToHM(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

function formatDuration(minutes) {
    if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes} min`;
}

// Parse TSA advice "walk:3|wait:45|peak" → { walkMin, waitMin, period }
function parseTsaAdvice(advice) {
    if (!advice) return null;
    const walkMatch = advice.match(/walk:(\d+)/);
    const waitMatch = advice.match(/wait:(\d+)/);
    const periodMatch = advice.match(/\|([^|]+)$/);
    return {
        walkMin: walkMatch ? parseInt(walkMatch[1], 10) : 0,
        waitMin: waitMatch ? parseInt(waitMatch[1], 10) : undefined,
        period: periodMatch ? periodMatch[1].trim() : '',
    };
}

// Maps segment type → { Icon, from, to }
function getSegmentIcon(seg) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: Luggage, from: '#f59e0b', to: '#d97706' };
    if (id === 'curb_to_checkin' || label.includes('check-in') || label.includes('check in') || label.includes('terminal'))
        return { Icon: Building2, from: '#6366f1', to: '#4f46e5' };
    if (id === 'walk_to_security' || id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: PersonStanding, from: '#22d3ee', to: '#0891b2' };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, from: '#f43f5e', to: '#be123c' };
    if (id === 'boarding_buffer')
        return { Icon: Clock, from: '#a78bfa', to: '#7c3aed' };
    if (id.includes('train') || label.includes('train'))
        return { Icon: Train, from: '#3b82f6', to: '#1d4ed8' };
    if (id.includes('bus') || label.includes('bus'))
        return { Icon: Bus, from: '#10b981', to: '#047857' };
    if (id.includes('drive') || label.includes('ride') || label.includes('drive') || label.includes('uber') || label.includes('lyft') || label.includes('leave home') || label.includes('depart'))
        return { Icon: Car, from: '#8b5cf6', to: '#6d28d9' };
    if (label.includes('gate'))
        return { Icon: Ticket, from: '#f97316', to: '#c2410c' };
    if (label.includes('board'))
        return { Icon: Plane, from: '#22c55e', to: '#15803d' };
    return { Icon: MapPin, from: '#6366f1', to: '#4f46e5' };
}

// Circular gradient icon using a div + Lucide icon (avoids SVG foreignObject cloning issues)
function SegIcon({ seg, size = 40 }) {
    const { Icon, from, to } = getSegmentIcon(seg);
    const iconSize = Math.round(size * 0.45);
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${from}, ${to})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <Icon style={{ width: iconSize, height: iconSize, color: 'white' }} />
        </div>
    );
}

// ── Hero time — pulses on change via key ──────────────────────────────────────
function AnimatedTime({ value }) {
    return (
        <motion.p
            key={value}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="font-extrabold leading-none mb-2"
            style={{
                fontSize: 'clamp(36px, 9vw, 64px)',
                letterSpacing: '-3px',
                background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
        >
            {value}
        </motion.p>
    );
}

// ── Vertical step and connector ───────────────────────────────────────────────
function VerticalStep({ seg, index, stepTime, delay, displayLabel, waitLabel, extraBadge, isLast, subtitle }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            transition={{ delay, duration: 0.35, ease: 'easeOut' }}
            layout
            className="w-full rounded-xl px-3 md:px-6 py-3 md:py-5 flex items-center gap-2 md:gap-4"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            {/* Left: number + icon side by side */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white"
                    style={{ background: isLast ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 0 2px rgba(99,102,241,0.2)' }}>
                    {isLast ? '✓' : index + 1}
                </div>
                <SegIcon seg={seg} size={42} />
            </div>

            {/* Center: label + details */}
            <div className="flex-1 min-w-0">
                <p className="text-[15px] md:text-base font-semibold text-white">{displayLabel}</p>
                {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
                {waitLabel && (
                    <p className="text-xs font-medium text-amber-400 mt-0.5">{waitLabel}</p>
                )}
                {extraBadge && (
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                        {extraBadge}
                    </span>
                )}
            </div>

            {/* Right: time */}
            <div className="shrink-0 text-right">
                <p className="font-mono text-[13px] md:text-sm font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg"
                    style={{
                        background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(139,92,246,0.14))',
                        border: '1px solid rgba(147,197,253,0.3)',
                        color: '#e0f2fe',
                        whiteSpace: 'nowrap',
                    }}>
                    {stepTime}
                </p>
            </div>
        </motion.div>
    );
}

function VerticalConnector({ label, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay, duration: 0.25 }}
            className="flex items-center justify-center py-0.5 md:py-1"
            style={{ transformOrigin: 'top' }}
        >
            <div className="flex flex-col items-center">
                <div className="w-px h-4" style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.5), rgba(139,92,246,0.3))' }} />
                <span className="text-[9px] md:text-[10px] font-semibold px-2 md:px-3 py-0.5 md:py-1 rounded-full my-0.5"
                    style={{
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        color: '#a5b4fc',
                        whiteSpace: 'nowrap',
                    }}>
                    ↓ {label}
                </span>
                <div className="w-px h-4" style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.3), rgba(99,102,241,0.5))' }} />
            </div>
        </motion.div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function JourneyVisualization({ locked, recommendation, selectedFlight, transport, profile, confidenceColorMap, onReady }) {

    useEffect(() => {
        if (locked && recommendation && onReady) {
            const t = setTimeout(onReady, 600);
            return () => clearTimeout(t);
        }
    }, [locked, recommendation]);

    const totalMinutes = recommendation?.segments
        ? recommendation.segments.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
        : 0;

    const confidenceScore = recommendation
        ? Math.round((recommendation.confidence_score || 0) * 100)
        : 0;

    // Calculate gate cushion from backend data
    const gateArrival = recommendation?.gate_arrival_utc ? new Date(recommendation.gate_arrival_utc) : null;
    const departureDateObj = selectedFlight?.departure_time ? parseDepartureTime(selectedFlight.departure_time) : null;
    const boardingTime = departureDateObj ? new Date(departureDateObj.getTime() - 30 * 60000) : null;
    const gateCushionMinutes = (gateArrival && boardingTime) ? Math.round((boardingTime - gateArrival) / 60000) : 0;
    const gateCushion = gateCushionMinutes > 0 ? gateCushionMinutes : 0;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const showResult = locked && recommendation;

    // Filter out comfort_buffer from timeline — it will be shown on the Gate step
    const segments = recommendation?.segments || [];
    const comfortBuffer = segments.find(s => s.id === 'comfort_buffer');
    const displaySegments = segments.filter(s => s.id !== 'comfort_buffer');

    return (
        <div className="w-full min-h-full px-3 md:px-6 pt-4 md:pt-5 flex flex-col items-center relative" style={{ paddingBottom: 20 }}>
            <div className="w-full mx-auto px-1 md:px-8 flex flex-col flex-1 relative z-10" style={{ maxWidth: 860 }}>
            <AnimatePresence mode="wait">

                    {/* ── LOADING ── */}
                    {locked && !recommendation && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col items-center justify-center text-center gap-6 flex-1 h-full"
                            style={{ minHeight: '60vh' }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                className="w-16 h-16 rounded-full"
                                style={{
                                    border: '3px solid rgba(99,102,241,0.15)',
                                    borderTop: '3px solid #6366f1',
                                }}
                            />
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Calculating your journey</h2>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Analyzing traffic, TSA wait times,<br />and airport conditions…
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── RESULT ── */}
                    {locked && recommendation && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full flex flex-col gap-3"
                        >
                            {/* ── HERO CARD ── */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
                                className="w-full rounded-2xl px-4 md:px-6 py-3 md:py-4"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                <p className="text-xs font-bold uppercase mb-0.5" style={{ color: '#60a5fa', letterSpacing: '0.22em' }}>
                                    Leave Home By
                                </p>
                                <div className="flex items-end justify-between gap-4">
                                    <AnimatedTime value={formatUTCToLocal(recommendation.leave_home_at)} />
                                    <div className="flex flex-col items-end gap-2 pb-3">
                                        <div
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-green-400 text-xs font-semibold">{confidenceScore}% Confident</span>
                                        </div>

                                        {selectedFlight && (
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-gray-500 text-[10px] md:text-xs font-medium">
                                                    {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} · {totalToHM(totalMinutes)} door-to-gate
                                                </p>
                                                <p className="text-[10px] md:text-xs font-semibold" style={{ color: '#60a5fa' }}>
                                                    {selectedFlight.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : 'Terminal TBD'}
                                                    {' · '}
                                                    {selectedFlight.departure_gate ? `Gate ${selectedFlight.departure_gate}` : 'Gate not assigned yet'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Late departure warning */}
                            {recommendation.leave_home_at && new Date(recommendation.leave_home_at) < new Date() && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
                                    style={{
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                    }}
                                >
                                    <span className="text-red-400 text-lg">⚠️</span>
                                    <p className="text-red-400 text-xs font-medium">
                                        You needed to leave by {formatUTCToLocal(recommendation.leave_home_at)} — you may not make this flight on time
                                    </p>
                                </motion.div>
                            )}

                            {/* ── VERTICAL STEPS ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="w-full py-2"
                            >
                                <AnimatePresence mode="sync">
                                    {displaySegments.map((seg, globalIdx) => {
                                        const cumulativeBefore = displaySegments
                                            .slice(0, globalIdx)
                                            .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                                        const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
                                        const delay = globalIdx * 0.06 + 0.15;

                                        let displayLabel = seg.label;
                                        if (seg.id === 'walk_to_gate') displayLabel = 'At Gate';

                                        // Last step shows arrival time (after walk)
                                        const isLastStep = globalIdx === displaySegments.length - 1;
                                        let displayStepTime = isLastStep
                                            ? addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + seg.duration_minutes)
                                            : stepTime;

                                        let waitLabel = undefined;

                                        // TSA: show time range and wait info
                                        if (seg.id === 'tsa') {
                                            const waitMatch = seg.advice?.match(/wait:(\d+)/);
                                            const periodMatch = seg.advice?.match(/\|([^|]+)$/);
                                            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
                                            const period = periodMatch ? periodMatch[1].trim() : '';
                                            waitLabel = `${formatDuration(waitMin)} wait${period ? ' · ' + period : ''}`;
                                            const tsaExitTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + seg.duration_minutes);
                                            displayStepTime = `${stepTime} → ${tsaExitTime}`;
                                        }

                                        // Bag Drop: show time range and drop time
                                        if (seg.id === 'bag_drop') {
                                            const dropMatch = seg.advice?.match(/drop:(\d+)/);
                                            const dropMin = dropMatch ? parseInt(dropMatch[1], 10) : seg.duration_minutes;
                                            waitLabel = `${formatDuration(dropMin)} drop`;
                                            const exitTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + dropMin);
                                            displayStepTime = `${stepTime} → ${exitTime}`;
                                        }

                                        // Gate: comfort buffer badge
                                        const isGateStep = seg.id === 'walk_to_gate';
                                        const extraBadge = (isGateStep && comfortBuffer)
                                            ? `+${formatDuration(comfortBuffer.duration_minutes)} buffer`
                                            : undefined;

                                        // Subtitle for transport / at_airport
                                        let subtitle = undefined;
                                        if (seg.id === 'transport') {
                                            subtitle = seg.advice; // e.g. "31 mins — 23.8 mi"
                                        }
                                        if (seg.id === 'at_airport') {
                                            subtitle = seg.advice?.replace(/walk_to_next:\d+/, '').replace(/\|/g, '').trim() || undefined;
                                        }

                                        // Connector label to NEXT step
                                        let connectorLabel = null;
                                        if (globalIdx < displaySegments.length - 1) {
                                            if (seg.id === 'at_airport' || seg.id === 'bag_drop') {
                                                const walkMatch = seg.advice?.match(/walk_to_next:(\d+)/);
                                                connectorLabel = walkMatch ? `${formatDuration(parseInt(walkMatch[1], 10))} walk` : null;
                                            } else if (seg.id === 'tsa') {
                                                const nextSeg = displaySegments[globalIdx + 1];
                                                connectorLabel = nextSeg ? `${formatDuration(nextSeg.duration_minutes)} walk to gate` : null;
                                            } else if (seg.id === 'transport') {
                                                connectorLabel = formatDuration(seg.duration_minutes);
                                            }
                                        }

                                        return (
                                            <React.Fragment key={seg.id || seg.label}>
                                                <VerticalStep
                                                    seg={seg}
                                                    index={globalIdx}
                                                    stepTime={displayStepTime}
                                                    delay={delay}
                                                    displayLabel={displayLabel}
                                                    waitLabel={waitLabel}
                                                    extraBadge={extraBadge}
                                                    isLast={isLastStep}
                                                    subtitle={subtitle}
                                                />
                                                {connectorLabel && globalIdx < displaySegments.length - 1 && (
                                                    <VerticalConnector label={connectorLabel} delay={delay + 0.03} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </AnimatePresence>
                            </motion.div>

                            {/* ── BOARDING + STATS CARD ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: displaySegments.length * 0.07 + 0.3, duration: 0.4 }}
                                className="w-full rounded-2xl overflow-hidden"
                                style={{ border: '1px solid rgba(34,197,94,0.25)' }}
                            >
                                {/* Boarding row */}
                                <div
                                    className="flex items-center justify-between px-6 py-4 gap-4"
                                    style={{ background: 'rgba(34,197,94,0.07)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                                            style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', boxShadow: '0 0 16px rgba(34,197,94,0.35)' }}
                                        >
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-0.5">Boarding</p>
                                            <p
                                                className="font-extrabold"
                                                style={{
                                                    fontSize: 'clamp(22px, 5vw, 30px)',
                                                    letterSpacing: '-0.5px',
                                                    background: 'linear-gradient(135deg, #ffffff, #86efac)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    backgroundClip: 'text',
                                                    textShadow: 'none',
                                                }}
                                            >{boarding}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">Flight Departs</p>
                                        <p
                                            className="font-extrabold"
                                            style={{
                                                fontSize: 'clamp(18px, 4vw, 24px)',
                                                letterSpacing: '-0.5px',
                                                background: 'linear-gradient(135deg, #e2e8f0, #93c5fd)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text',
                                            }}
                                        >{departureTime}</p>
                                    </div>
                                </div>

                                {/* Stats row — only Total Journey + Gate Cushion */}
                                <div
                                    className="grid grid-cols-2 divide-x"
                                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                                >
                                    {[
                                        { label: 'Total Journey', value: totalToHM(totalMinutes), color: '#ffffff' },
                                        { label: 'Gate Cushion', value: totalToHM(gateCushion), color: '#4ade80' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="flex flex-col items-center gap-0.5 px-5 py-3 text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{label}</p>
                                            <p className="text-lg md:text-2xl font-bold" style={{ color }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}