import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plane, Car, Train, Bus, Shield, Clock, MapPin, Luggage,
    Building2, PersonStanding, Ticket, Home, Navigation, MapPinned
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

// ── Segment mapping ─────────────────────────────────────────────────────────
function getSegmentMeta(seg) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();

    if (id === 'transport' || label.includes('leave') || label.includes('depart') || label.includes('ride') || label.includes('drive') || label.includes('uber'))
        return { Icon: Car, shortLabel: 'En Route', color: 'indigo' };
    if (id === 'at_airport' || label.includes('check-in') || label.includes('terminal'))
        return { Icon: Building2, shortLabel: 'At Airport', color: 'indigo' };
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: Luggage, shortLabel: 'Bag Drop', color: 'amber' };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, shortLabel: 'TSA Security', color: 'red' };
    if (id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: MapPinned, shortLabel: 'Walk to Gate', color: 'emerald' };
    if (id === 'boarding_buffer')
        return { Icon: Clock, shortLabel: 'Buffer', color: 'indigo' };
    if (label.includes('gate'))
        return { Icon: Ticket, shortLabel: 'At Gate', color: 'emerald' };
    if (label.includes('board'))
        return { Icon: Plane, shortLabel: 'Board', color: 'emerald' };
    return { Icon: MapPin, shortLabel: seg.label || 'Step', color: 'gray' };
}

const colorStyles = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-200' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-200' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-200' },
    gray: { bg: 'bg-gray-100', icon: 'text-gray-600', ring: 'ring-gray-200' },
};

// ── Main Component ──────────────────────────────────────────────────────────
export default function JourneyVisualization({ locked, recommendation, selectedFlight, onReady }) {

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
    const departureDateObj = selectedFlight?.departure_time ? parseDepartureTime(selectedFlight.departure_time) : null;
    const boardingTimeObj = departureDateObj ? new Date(departureDateObj.getTime() - 30 * 60000) : null;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const segments = recommendation.segments || [];
    const comfortBuffer = segments.find(s => s.id === 'comfort_buffer');
    const displaySegments = segments.filter(s => s.id !== 'comfort_buffer');

    // Build timeline steps
    const allSteps = [];

    allSteps.push({
        Icon: Home, shortLabel: 'Leave Home', color: 'indigo',
        time: formatUTCToLocal(recommendation.leave_home_at),
        duration: '0 min', subtitle: 'Start your journey', isFirst: true,
    });

    displaySegments.forEach((seg, idx) => {
        const cumulativeBefore = displaySegments.slice(0, idx).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const meta = getSegmentMeta(seg);
        const isLast = idx === displaySegments.length - 1;

        let displayTime = isLast
            ? addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + seg.duration_minutes)
            : addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);

        let subtitle = '';
        let durationLabel = formatDuration(seg.duration_minutes);

        if (seg.id === 'transport') subtitle = seg.advice || '';
        if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const walkMatch = seg.advice?.match(/walk:(\d+)/);
            const periodMatch = seg.advice?.match(/\|([^|]+)$/);
            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
            const walkMin = walkMatch ? parseInt(walkMatch[1], 10) : 0;
            const period = periodMatch ? periodMatch[1].trim() : '';
            durationLabel = `${formatDuration(waitMin)} wait` + (walkMin ? ` + ${walkMin} min screening` : '');
            subtitle = selectedFlight?.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : '';
            if (period) subtitle += (subtitle ? ' · ' : '') + period;
        }
        if (seg.id === 'walk_to_gate') {
            meta.shortLabel = isLast ? 'At Gate' : 'Walk to Gate';
            if (comfortBuffer) durationLabel = `${formatDuration(comfortBuffer.duration_minutes)} buffer`;
            if (selectedFlight?.departure_gate) subtitle = `Gate ${selectedFlight.departure_gate}`;
            if (isLast && boarding) subtitle += (subtitle ? ' · ' : '') + `Boarding at ${boarding}`;
        }
        if (seg.id === 'at_airport') {
            subtitle = seg.advice?.replace(/walk_to_next:\d+/, '').replace(/\|/g, ' ').trim() || '';
        }

        allSteps.push({ ...meta, time: displayTime, duration: durationLabel, subtitle, seg });
    });

    const boardingInMinutes = boardingTimeObj && recommendation.leave_home_at
        ? Math.max(0, Math.round((boardingTimeObj - new Date(recommendation.leave_home_at)) / 60000))
        : totalMinutes;

    // Stats
    const stats = [];
    displaySegments.forEach(seg => {
        if (seg.id === 'transport') stats.push({ label: 'Transport', value: seg.duration_minutes, unit: 'min' });
        if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const walkMatch = seg.advice?.match(/walk:(\d+)/);
            stats.push({ label: 'TSA Wait', value: waitMatch ? parseInt(waitMatch[1]) : seg.duration_minutes, unit: 'min' });
            if (walkMatch) stats.push({ label: 'Screening', value: parseInt(walkMatch[1]), unit: 'min' });
        }
        if (seg.id === 'walk_to_gate') stats.push({ label: 'Gate Walk', value: seg.duration_minutes, unit: 'min' });
    });
    if (comfortBuffer) stats.push({ label: 'Buffer', value: comfortBuffer.duration_minutes, unit: 'min', isBuffer: true });
    stats.push({ label: 'Confidence', value: confidenceScore, unit: '%', highlight: true });

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">

            {/* ── HERO CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-indigo-600 rounded-3xl p-8 md:p-10 text-center"
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-indigo-200" />
                    <p className="text-indigo-200 font-semibold text-sm">Leave Now at</p>
                </div>
                <motion.p
                    key={formatUTCToLocal(recommendation.leave_home_at)}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4"
                >
                    {formatUTCToLocal(recommendation.leave_home_at)}
                </motion.p>
                <div className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2">
                    <span className="text-sm text-white">
                        Boarding in <span className="text-emerald-300 font-bold">{totalToHM(boardingInMinutes)}</span>
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-sm text-white font-medium">{confidenceScore}% Confidence</span>
                </div>
            </motion.div>

            {/* Late warning */}
            {recommendation.leave_home_at && new Date(recommendation.leave_home_at) < new Date() && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 flex items-center gap-3 bg-red-50 border border-red-200">
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
                transition={{ delay: 0.12 }}
                className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8"
            >
                {/* Desktop horizontal */}
                <div className="hidden md:block">
                    {/* Icons row */}
                    <div className="relative mb-4">
                        {/* Connecting line */}
                        <div className="absolute top-7 left-10 right-10 h-0.5 bg-gray-200" />
                        <div className="absolute top-7 left-10 h-0.5 bg-indigo-300"
                            style={{ width: `calc(100% - 80px)` }} />

                        <div className="relative flex justify-between">
                            {allSteps.map((step, idx) => {
                                const cs = colorStyles[step.color] || colorStyles.gray;
                                return (
                                    <motion.div key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.06 + 0.2 }}
                                        className="flex flex-col items-center relative"
                                        style={{ width: `${100 / allSteps.length}%` }}
                                    >
                                        {/* Numbered badge */}
                                        <div className={`absolute -top-1.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                                            idx === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-white'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl ${cs.bg} flex items-center justify-center ring-2 ${cs.ring} ${
                                            idx === 0 ? 'bg-indigo-600 ring-indigo-300' : ''
                                        }`}>
                                            <step.Icon className={`w-6 h-6 ${idx === 0 ? 'text-white' : cs.icon}`} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail cards row */}
                    <div className="flex gap-2">
                        {allSteps.map((step, idx) => (
                            <motion.div key={idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 + 0.35 }}
                                className={`flex-1 rounded-xl p-3 border ${
                                    idx === 0 ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-gray-50/50'
                                }`}
                            >
                                <p className={`text-xs font-semibold mb-0.5 ${idx === 0 ? 'text-indigo-600' : 'text-gray-500'}`}>
                                    {step.shortLabel}
                                </p>
                                <p className="text-gray-900 font-bold text-lg leading-tight">{step.time}</p>
                                <p className="text-gray-400 text-[11px] mt-0.5">{step.duration}</p>
                                {step.subtitle && (
                                    <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-2">{step.subtitle}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Mobile vertical */}
                <div className="md:hidden space-y-0">
                    {allSteps.map((step, idx) => {
                        const cs = colorStyles[step.color] || colorStyles.gray;
                        return (
                            <motion.div key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 + 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            idx === 0 ? 'bg-indigo-600' : cs.bg
                                        }`}>
                                            <step.Icon className={`w-4 h-4 ${idx === 0 ? 'text-white' : cs.icon}`} />
                                        </div>
                                        {idx < allSteps.length - 1 && <div className="w-0.5 h-8 bg-gray-200 my-1" />}
                                    </div>
                                    <div className="pb-4 pt-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`font-semibold text-sm ${idx === 0 ? 'text-indigo-600' : 'text-gray-900'}`}>{step.shortLabel}</p>
                                            <span className="text-sm font-bold text-gray-900">{step.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{step.duration}</p>
                                        {step.subtitle && <p className="text-xs text-gray-400 mt-0.5">{step.subtitle}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── BOARDING ROW ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Boarding</p>
                    <p className="text-2xl md:text-3xl font-black text-indigo-600">{boarding}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Flight Departs</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900">{departureTime}</p>
                </div>
            </div>

            {/* ── STATS BAR ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
                <div className="grid divide-x divide-gray-100" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
                    {stats.map(({ label, value, unit, highlight, isBuffer }) => (
                        <div key={label} className={`flex flex-col items-center gap-0.5 px-2 py-4 text-center ${highlight ? 'bg-indigo-50' : ''}`}>
                            <p className={`text-[9px] md:text-[10px] uppercase tracking-wider font-bold ${highlight ? 'text-indigo-500' : 'text-gray-400'}`}>{label}</p>
                            <p className={`text-xl md:text-2xl font-black ${
                                highlight ? 'text-indigo-600' : isBuffer ? 'text-emerald-600' : 'text-gray-900'
                            }`}>{value}</p>
                            <p className="text-[9px] text-gray-400">{unit}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── FLIGHT INFO ── */}
            {selectedFlight && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-sm text-gray-400 pb-4"
                >
                    {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} ·{' '}
                    {selectedFlight.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : 'Terminal TBD'} ·{' '}
                    {selectedFlight.departure_gate ? `Gate ${selectedFlight.departure_gate}` : 'Gate TBD'} ·{' '}
                    {totalToHM(totalMinutes)} door-to-gate
                </motion.div>
            )}
        </div>
    );
}
