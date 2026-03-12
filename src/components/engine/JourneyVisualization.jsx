import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plane, Car, Train, Bus, Shield, Clock, MapPin, Luggage,
    Building2, PersonStanding, Ticket, CheckCircle2, Home, Navigation, MapPinned
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

// ── Segment Icon Mapping ────────────────────────────────────────────────────
function getSegmentMeta(seg) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();

    if (id === 'transport' || label.includes('leave') || label.includes('depart') || label.includes('ride') || label.includes('drive') || label.includes('uber'))
        return { Icon: Car, shortLabel: 'En Route' };
    if (id === 'at_airport' || label.includes('check-in') || label.includes('terminal'))
        return { Icon: Building2, shortLabel: 'At Airport' };
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: Luggage, shortLabel: 'Bag Drop' };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, shortLabel: 'TSA Security' };
    if (id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: MapPinned, shortLabel: 'Walk to Gate' };
    if (id === 'boarding_buffer')
        return { Icon: Clock, shortLabel: 'Buffer' };
    if (label.includes('gate'))
        return { Icon: Ticket, shortLabel: 'At Gate' };
    if (label.includes('board'))
        return { Icon: Plane, shortLabel: 'Board' };
    return { Icon: MapPin, shortLabel: seg.label || 'Step' };
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
    const boardingTimeObj = departureDateObj ? new Date(departureDateObj.getTime() - 30 * 60000) : null;
    const gateCushionMinutes = (gateArrival && boardingTimeObj) ? Math.max(0, Math.round((boardingTimeObj - gateArrival) / 60000)) : 0;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const segments = recommendation.segments || [];
    const comfortBuffer = segments.find(s => s.id === 'comfort_buffer');
    const displaySegments = segments.filter(s => s.id !== 'comfort_buffer');

    // Build timeline steps — first step is always "Leave Home"
    const allSteps = [];

    // Add "Leave Home" as the first step
    allSteps.push({
        Icon: Home,
        shortLabel: 'Leave Home',
        time: formatUTCToLocal(recommendation.leave_home_at),
        duration: '0 min',
        subtitle: 'Start your journey',
        isFirst: true,
    });

    // Map segments to steps
    displaySegments.forEach((seg, idx) => {
        const cumulativeBefore = displaySegments.slice(0, idx).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const meta = getSegmentMeta(seg);
        const isLast = idx === displaySegments.length - 1;

        let displayTime = isLast
            ? addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + seg.duration_minutes)
            : addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);

        let subtitle = '';
        let durationLabel = formatDuration(seg.duration_minutes);

        if (seg.id === 'transport') {
            subtitle = seg.advice || '';
        }
        if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const periodMatch = seg.advice?.match(/\|([^|]+)$/);
            const walkMatch = seg.advice?.match(/walk:(\d+)/);
            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
            const walkMin = walkMatch ? parseInt(walkMatch[1], 10) : 0;
            const period = periodMatch ? periodMatch[1].trim() : '';
            durationLabel = `${formatDuration(waitMin)} wait` + (walkMin ? ` + ${walkMin} min screening` : '');
            subtitle = period || '';
            if (selectedFlight?.departure_terminal) subtitle = `Terminal ${selectedFlight.departure_terminal}` + (subtitle ? ` · ${subtitle}` : '');
        }
        if (seg.id === 'walk_to_gate') {
            meta.shortLabel = isLast ? 'At Gate' : 'Walk to Gate';
            if (comfortBuffer) {
                durationLabel = `${formatDuration(comfortBuffer.duration_minutes)} buffer`;
            }
            if (selectedFlight?.departure_gate) {
                subtitle = `${selectedFlight.origin_code || ''} Gate ${selectedFlight.departure_gate}: Direct Path`;
            }
            if (isLast && boarding) subtitle = `Boarding at ${boarding}`;
        }
        if (seg.id === 'at_airport') {
            subtitle = seg.advice?.replace(/walk_to_next:\d+/, '').replace(/\|/g, ' ').trim() || '';
        }

        allSteps.push({ ...meta, time: displayTime, duration: durationLabel, subtitle, seg });
    });

    // Boarding time from recommendation
    const boardingInMinutes = boardingTimeObj && recommendation.leave_home_at
        ? Math.max(0, Math.round((boardingTimeObj - new Date(recommendation.leave_home_at)) / 60000))
        : totalMinutes;

    // Stats for bottom bar
    const stats = [];
    displaySegments.forEach(seg => {
        if (seg.id === 'transport') stats.push({ label: 'Transport', value: seg.duration_minutes, unit: 'minutes' });
        if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const walkMatch = seg.advice?.match(/walk:(\d+)/);
            stats.push({ label: 'TSA Wait', value: waitMatch ? parseInt(waitMatch[1]) : seg.duration_minutes, unit: 'minutes' });
            if (walkMatch) stats.push({ label: 'Screening', value: parseInt(walkMatch[1]), unit: 'minutes' });
        }
        if (seg.id === 'walk_to_gate') stats.push({ label: 'Gate Walk', value: seg.duration_minutes, unit: 'minutes' });
    });
    if (comfortBuffer) stats.push({ label: 'Buffer', value: comfortBuffer.duration_minutes, unit: 'minutes', isBuffer: true });
    stats.push({ label: 'Confidence', value: confidenceScore, unit: 'percent', highlight: true });

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {/* ── HERO CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-3xl p-8 md:p-10 mb-6 text-center"
                style={{ background: 'linear-gradient(135deg, #3b5bdb 0%, #5b8def 40%, #748ffc 100%)' }}
            >
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-white/80" />
                    <p className="text-base font-semibold text-white/80">Leave Now at</p>
                </div>
                <motion.p
                    key={formatUTCToLocal(recommendation.leave_home_at)}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="text-5xl md:text-7xl font-black text-white tracking-tight mb-5"
                >
                    {formatUTCToLocal(recommendation.leave_home_at)}
                </motion.p>
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                    <span className="text-sm text-white">
                        Boarding in <span className="text-emerald-300 font-bold">{totalToHM(boardingInMinutes)}</span>
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-sm text-white">{confidenceScore}% Confidence</span>
                </div>
            </motion.div>

            {/* Late departure warning */}
            {recommendation.leave_home_at && new Date(recommendation.leave_home_at) < new Date() && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <span className="text-lg">⚠️</span>
                    <p className="text-red-400 text-sm font-medium">
                        You needed to leave by {formatUTCToLocal(recommendation.leave_home_at)} — you may not make this flight on time
                    </p>
                </motion.div>
            )}

            {/* ── ENABLE LOCATION TRACKING BANNER ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', border: '1px solid rgba(59,130,246,0.3)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <Navigation className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">Enable Location Tracking</p>
                        <p className="text-blue-300 text-xs">Get real-time updates as you travel</p>
                    </div>
                </div>
                <button className="px-5 py-2 rounded-full bg-white text-indigo-700 text-sm font-bold hover:bg-blue-50 transition-colors">
                    Enable
                </button>
            </motion.div>

            {/* ── HORIZONTAL TIMELINE ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mb-6"
            >
                {/* Icon row with numbered badges */}
                <div className="flex gap-2 md:gap-3 mb-3 overflow-x-auto pb-2">
                    {allSteps.map((step, idx) => (
                        <motion.div key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.07 + 0.2 }}
                            className="flex-1 min-w-[100px] relative"
                        >
                            {/* Number badge */}
                            <div className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{
                                    background: idx === 0 ? '#3b82f6' : 'rgba(107,114,128,0.6)',
                                    color: '#fff',
                                    border: '2px solid #141e33',
                                }}>
                                {idx + 1}
                            </div>
                            {/* Icon card */}
                            <div className={`w-full aspect-square max-h-[100px] rounded-2xl flex items-center justify-center transition-all ${
                                idx === 0 ? '' : ''
                            }`}
                                style={{
                                    background: idx === 0
                                        ? 'linear-gradient(135deg, #1e40af 0%, #60a5fa 100%)'
                                        : 'rgba(255,255,255,0.06)',
                                    border: idx === 0
                                        ? '2px solid rgba(96,165,250,0.5)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                }}>
                                <step.Icon className={`w-7 h-7 ${idx === 0 ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Detail cards below icons */}
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
                    {allSteps.map((step, idx) => (
                        <motion.div key={idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07 + 0.35 }}
                            className="flex-1 min-w-[100px] rounded-2xl p-3 md:p-4"
                            style={{
                                background: idx === 0 ? 'rgba(30,64,175,0.15)' : 'rgba(255,255,255,0.03)',
                                border: idx === 0 ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <p className={`text-xs font-semibold mb-1 ${idx === 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                                {step.shortLabel}
                            </p>
                            <p className="text-white font-bold text-base md:text-lg">{step.time}</p>
                            <p className="text-gray-500 text-[10px] md:text-xs mt-0.5">{step.duration}</p>
                            {step.subtitle && (
                                <p className="text-gray-600 text-[10px] mt-0.5 line-clamp-2">{step.subtitle}</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── STATS BAR ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex gap-2 md:gap-3"
            >
                {stats.map(({ label, value, unit, highlight, isBuffer }) => (
                    <div key={label}
                        className="flex-1 rounded-2xl p-3 md:p-4 text-center"
                        style={{
                            background: highlight
                                ? 'linear-gradient(135deg, #1e40af 0%, #06b6d4 100%)'
                                : 'rgba(255,255,255,0.04)',
                            border: highlight
                                ? '1px solid rgba(6,182,212,0.4)'
                                : '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <p className={`text-[9px] md:text-[10px] uppercase tracking-wider font-bold mb-1 ${
                            highlight ? 'text-cyan-300' : 'text-gray-500'
                        }`}>{label}</p>
                        <p className={`text-2xl md:text-3xl font-black ${
                            highlight ? 'text-white' :
                            isBuffer ? 'text-emerald-400' :
                            'text-white'
                        }`}>{value}</p>
                        <p className={`text-[9px] md:text-[10px] mt-0.5 ${highlight ? 'text-cyan-300/70' : 'text-gray-600'}`}>{unit}</p>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
