import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plane, Car, Train, Bus, Shield, Clock, MapPin, Luggage,
    Building2, PersonStanding, Ticket, CheckCircle2
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────
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

function fmtMin(minutes) {
    if (minutes == null) return '';
    const m = Math.round(minutes);
    if (m >= 60) {
        const h = Math.floor(m / 60);
        const r = m % 60;
        return r > 0 ? `${h}h${String(r).padStart(2, '0')}m` : `${h}h`;
    }
    return `${m} min`;
}

// alias used in hero / stats
const totalToHM = fmtMin;
const formatDuration = fmtMin;

// ── Transport label builder ─────────────────────────────────────────────────
function transportLabel(transport, airportCode) {
    const modeLabels = { rideshare: 'Ride', driving: 'Drive', train: 'Train', bus: 'Bus', other: 'Ride' };
    const mode = modeLabels[(transport || '').toLowerCase()] || 'Ride';
    return `${mode} to ${airportCode || 'Airport'}`;
}

// ── Segment Icon Mapping ────────────────────────────────────────────────────
function getSegmentMeta(seg, airportCode, transport) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();

    if (id === 'transport' || label.includes('leave') || label.includes('depart') || label.includes('ride') || label.includes('drive') || label.includes('uber'))
        return { Icon: Car, bg: 'bg-indigo-100', iconColor: 'text-indigo-600', shortLabel: transportLabel(transport, airportCode) };
    if (id === 'at_airport' || label.includes('check-in') || label.includes('terminal'))
        return { Icon: Building2, bg: 'bg-indigo-100', iconColor: 'text-indigo-600', shortLabel: `At ${airportCode || 'Airport'}` };
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: Luggage, bg: 'bg-amber-100', iconColor: 'text-amber-600', shortLabel: 'Bag Drop' };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, bg: 'bg-red-100', iconColor: 'text-red-600', shortLabel: 'TSA Security' };
    if (id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: PersonStanding, bg: 'bg-emerald-100', iconColor: 'text-emerald-600', shortLabel: 'At Gate' };
    if (id === 'boarding_buffer')
        return { Icon: Clock, bg: 'bg-indigo-100', iconColor: 'text-indigo-600', shortLabel: 'Buffer' };
    if (label.includes('gate'))
        return { Icon: Ticket, bg: 'bg-emerald-100', iconColor: 'text-emerald-600', shortLabel: 'At Gate' };
    if (label.includes('board'))
        return { Icon: Plane, bg: 'bg-emerald-100', iconColor: 'text-emerald-600', shortLabel: 'Board' };
    return { Icon: MapPin, bg: 'bg-gray-100', iconColor: 'text-gray-600', shortLabel: seg.label || 'Step' };
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function JourneyVisualization({ locked, recommendation, selectedFlight, transport, profile, confidenceColorMap, onReady }) {

    useEffect(() => {
        if (locked && recommendation && onReady) {
            const t = setTimeout(onReady, 500);
            return () => clearTimeout(t);
        }
    }, [locked, recommendation]);

    if (!locked || !recommendation) return null;

    const totalMinutes = recommendation.segments
        ? recommendation.segments.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
        : 0;

    const confidenceScore = Math.round((recommendation.confidence_score || 0) * 100);

    const gateArrival = recommendation.gate_arrival_utc ? new Date(recommendation.gate_arrival_utc) : null;
    const departureDateObj = selectedFlight?.departure_time ? parseDepartureTime(selectedFlight.departure_time) : null;
    const boardingTime = departureDateObj ? new Date(departureDateObj.getTime() - 30 * 60000) : null;
    const gateCushionMinutes = (gateArrival && boardingTime) ? Math.max(0, Math.round((boardingTime - gateArrival) / 60000)) : 0;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const segments = recommendation.segments || [];
    const comfortBuffer = segments.find(s => s.id === 'comfort_buffer');
    const displaySegments = segments.filter(s => s.id !== 'comfort_buffer');
    const airportCode = selectedFlight?.origin_code || '';

    // Build step data for timeline
    const timelineSteps = displaySegments.map((seg, idx) => {
        const cumulativeBefore = displaySegments.slice(0, idx).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
        const meta = getSegmentMeta(seg, airportCode, transport);
        const isLast = idx === displaySegments.length - 1;

        let displayTime = isLast
            ? addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + seg.duration_minutes)
            : stepTime;

        let subtitle = '';
        // Extra info to show on the connector line TO the next step (parsed from advice)
        let connectorExtra = '';
        if (seg.id === 'transport') {
            // Parse advice like "mode:rideshare|raw:101|buffer:35|distance_mi:23.7"
            const rawMatch = seg.advice?.match(/raw:(\d+)/);
            const distMatch = seg.advice?.match(/distance_mi:([\d.]+)/);
            const rawMin = rawMatch ? parseInt(rawMatch[1], 10) : null;
            const distMi = distMatch ? parseFloat(distMatch[1]) : null;
            const parts = [];
            if (rawMin != null) parts.push(fmtMin(rawMin));
            if (distMi != null) parts.push(`${distMi} mi`);
            subtitle = parts.length ? parts.join(' — ') : fmtMin(seg.duration_minutes);
        } else if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const periodMatch = seg.advice?.match(/\|([^|]+)$/);
            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
            const period = periodMatch ? periodMatch[1].trim() : '';
            subtitle = `${fmtMin(waitMin)} wait${period ? ' · ' + period : ''}`;
        } else if (seg.id === 'walk_to_gate') {
            if (comfortBuffer) subtitle = `+${fmtMin(comfortBuffer.duration_minutes)} buffer`;
        } else if (seg.id === 'at_airport') {
            // Parse advice like "walk_to_next:8" → show "Walking 8 min" on the connector
            const walkMatch = seg.advice?.match(/walk_to_next:(\d+)/);
            if (walkMatch) {
                connectorExtra = `${fmtMin(parseInt(walkMatch[1], 10))} walk`;
            }
            // Don't show raw advice as subtitle
            subtitle = '';
        } else if (seg.id === 'bag_drop') {
            // Parse advice like "1 bag(s)|drop:5|walk_to_next:3"
            const bagMatch = seg.advice?.match(/(\d+)\s*bag/);
            const dropMatch = seg.advice?.match(/drop:(\d+)/);
            const walkMatch = seg.advice?.match(/walk_to_next:(\d+)/);
            const bags = bagMatch ? parseInt(bagMatch[1], 10) : null;
            const dropMin = dropMatch ? parseInt(dropMatch[1], 10) : null;
            const parts = [];
            if (bags != null) parts.push(`${bags} bag${bags !== 1 ? 's' : ''}`);
            if (dropMin != null) parts.push(`${fmtMin(dropMin)} drop`);
            subtitle = parts.length ? parts.join(' · ') : 'Check bags';
            // Use walk_to_next for connector label
            if (walkMatch) connectorExtra = `Walking ${fmtMin(parseInt(walkMatch[1], 10))}`;
        } else if (seg.advice) {
            subtitle = seg.advice;
        }

        return { ...meta, time: displayTime, durationMinutes: seg.duration_minutes, duration: fmtMin(seg.duration_minutes), connectorExtra, subtitle, seg, isLast };
    });

    // Boarding step data
    const boardingInMinutes = boardingTime && recommendation.leave_home_at
        ? Math.max(0, Math.round((boardingTime - new Date(recommendation.leave_home_at)) / 60000))
        : totalMinutes;

    // Stats for the bottom bar
    const stats = [];
    displaySegments.forEach(seg => {
        if (seg.id === 'transport') stats.push({ label: 'Transport', value: seg.duration_minutes, unit: 'minutes' });
        if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            stats.push({ label: 'TSA Wait', value: waitMatch ? parseInt(waitMatch[1]) : seg.duration_minutes, unit: 'minutes' });
        }
        if (seg.id === 'walk_to_gate') stats.push({ label: 'Gate Walk', value: seg.duration_minutes, unit: 'minutes' });
    });
    if (comfortBuffer) stats.push({ label: 'Buffer', value: comfortBuffer.duration_minutes, unit: 'minutes' });
    stats.push({ label: 'Confidence', value: confidenceScore, unit: 'percent', highlight: true });

    // Confidence level label from backend
    const confidenceLevel = recommendation.confidence || '';
    const confidenceLevelLabel = confidenceLevel === 'high' ? 'High' : confidenceLevel === 'medium' ? 'Medium' : confidenceLevel === 'low' ? 'Low' : '';

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {/* ── HERO CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-3xl p-6 md:p-8 mb-6"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-white/80" />
                            <p className="text-sm font-semibold text-white/80">Leave Now at</p>
                        </div>
                        <motion.p
                            key={formatUTCToLocal(recommendation.leave_home_at)}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="text-5xl md:text-6xl font-black text-white tracking-tight"
                        >
                            {formatUTCToLocal(recommendation.leave_home_at)}
                        </motion.p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm">
                            Boarding in {totalToHM(boardingInMinutes)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            {confidenceScore}% {confidenceLevelLabel} Confidence
                        </span>
                    </div>
                </div>

                {/* Flight info */}
                {selectedFlight && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-white/80 text-sm">
                            {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} ·{' '}
                            {selectedFlight.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : 'Terminal TBD'} ·{' '}
                            {selectedFlight.departure_gate ? `Gate ${selectedFlight.departure_gate}` : 'Gate TBD'} ·{' '}
                            {totalToHM(totalMinutes)} door-to-gate
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Backend explanation */}
            {recommendation.explanation && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl px-5 py-4 mb-6 bg-indigo-50 border border-indigo-100">
                    <p className="text-indigo-700 text-sm font-medium leading-relaxed">{recommendation.explanation}</p>
                </motion.div>
            )}

            {/* Late departure warning */}
            {recommendation.leave_home_at && new Date(recommendation.leave_home_at) < new Date() && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3 bg-red-50 border border-red-200">
                    <span className="text-lg">⚠️</span>
                    <p className="text-red-700 text-sm font-medium">
                        You needed to leave by {formatUTCToLocal(recommendation.leave_home_at)} — you may not make this flight on time
                    </p>
                </motion.div>
            )}

            {/* ── TIMELINE ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 mb-6"
            >
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Your Journey Timeline</h3>

                {/* Desktop: Horizontal */}
                <div className="hidden md:block">
                    <div className="relative pt-8">
                        {/* Connecting line — vertically centered on icons */}
                        <div className="absolute top-14 left-8 right-8 h-0.5 bg-indigo-300 z-0" />

                        {/* Duration labels centered on the line between step pairs */}
                        {timelineSteps.length > 1 && (() => {
                            const stepWidth = 100 / timelineSteps.length;
                            return timelineSteps.slice(0, -1).map((step, idx) => {
                                const leftPercent = stepWidth * idx + stepWidth / 2 + stepWidth / 2;
                                const label = step.connectorExtra || step.duration;
                                return (
                                    <div key={`dur-${idx}`} className="absolute z-20"
                                        style={{ top: '3.15rem', left: `${leftPercent}%`, transform: 'translate(-50%, -50%)' }}>
                                        <div className="bg-white px-2.5 py-0.5 rounded-md border border-gray-100 shadow-sm">
                                            <span className="text-[10px] font-bold text-indigo-500 whitespace-nowrap">{label}</span>
                                        </div>
                                    </div>
                                );
                            });
                        })()}

                        {/* Step icons + labels */}
                        <div className="relative z-10 flex justify-between">
                            {timelineSteps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center"
                                    style={{ width: `${100 / timelineSteps.length}%` }}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.08 + 0.2 }}
                                        className="flex flex-col items-center text-center w-full"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${step.bg} flex items-center justify-center mb-3 shadow-sm`}>
                                            <step.Icon className={`w-5 h-5 ${step.iconColor}`} />
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm">{step.time}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">{step.shortLabel}</p>
                                        {step.subtitle && <p className="text-[10px] text-indigo-600 font-medium mt-1 max-w-[140px] leading-tight">{step.subtitle}</p>}
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile: Vertical */}
                <div className="md:hidden space-y-0">
                    {timelineSteps.map((step, idx) => (
                        <motion.div key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06 + 0.1 }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Timeline rail */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}>
                                        <step.Icon className={`w-4 h-4 ${step.iconColor}`} />
                                    </div>
                                    {idx < timelineSteps.length - 1 && (
                                        <div className="relative w-0.5 h-10 bg-gray-200 my-1">
                                            {/* Duration label on the connector */}
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-500 bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm whitespace-nowrap">
                                                {step.duration}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="pb-4 pt-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900 text-sm">{step.shortLabel}</p>
                                        <span className="text-xs font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{step.time}</span>
                                    </div>
                                    {step.subtitle && <p className="text-xs text-indigo-600 font-medium mt-0.5">{step.subtitle}</p>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── BOARDING + DEPARTURE ROW ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="grid grid-cols-2 gap-4 mb-6"
            >
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Boarding</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-600">{boarding}</p>
                    {gateCushionMinutes > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{gateCushionMinutes} min cushion at gate</p>
                    )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Flight Departs</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900">{departureTime}</p>
                    {selectedFlight?.departure_gate && (
                        <p className="text-xs text-gray-500 mt-1">Gate {selectedFlight.departure_gate}</p>
                    )}
                </div>
            </motion.div>

            {/* ── STATS BAR ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
                <div className={`grid divide-x divide-gray-100`}
                    style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
                    {stats.map(({ label, value, unit, highlight }) => (
                        <div key={label} className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                            <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-gray-400">{label}</p>
                            <p className={`text-xl md:text-2xl font-black ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
                                {value}
                            </p>
                            <p className="text-[10px] text-gray-400">{unit}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── COMPUTED AT (data freshness signal) ── */}
            {recommendation.computed_at && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-[11px] text-gray-400 mt-4"
                >
                    Computed {new Date(recommendation.computed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} · Powered by real-time data
                </motion.p>
            )}
        </div>
    );
}
