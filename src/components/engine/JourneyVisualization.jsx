import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
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
    return `${minutes}m`;
}

// ── Segment metadata ────────────────────────────────────────────────────────
function getSegmentMeta(seg) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();

    if (id === 'transport' || label.includes('leave') || label.includes('ride') || label.includes('drive') || label.includes('uber'))
        return { Icon: Car, color: 'text-indigo-600', bg: 'bg-indigo-50', shortLabel: 'Leave Home' };
    if (id === 'at_airport' || label.includes('check-in') || label.includes('terminal'))
        return { Icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', shortLabel: 'At Airport' };
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: Luggage, color: 'text-amber-600', bg: 'bg-amber-50', shortLabel: 'Bag Drop' };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, color: 'text-red-500', bg: 'bg-red-50', shortLabel: 'TSA Security' };
    if (id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: PersonStanding, color: 'text-emerald-600', bg: 'bg-emerald-50', shortLabel: 'At Gate' };
    if (id === 'boarding_buffer')
        return { Icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', shortLabel: 'Buffer' };
    if (label.includes('gate'))
        return { Icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-50', shortLabel: 'At Gate' };
    if (label.includes('board'))
        return { Icon: Plane, color: 'text-emerald-600', bg: 'bg-emerald-50', shortLabel: 'Board' };
    return { Icon: MapPin, color: 'text-gray-500', bg: 'bg-gray-50', shortLabel: seg.label || 'Step' };
}

const stagger = {
    hidden: { opacity: 0, y: 12 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    }),
};

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
    const departureDateObj = selectedFlight?.departure_time ? parseDepartureTime(selectedFlight.departure_time) : null;
    const boardingTime = departureDateObj ? new Date(departureDateObj.getTime() - 30 * 60000) : null;
    const gateArrival = recommendation.gate_arrival_utc ? new Date(recommendation.gate_arrival_utc) : null;
    const gateCushionMinutes = (gateArrival && boardingTime) ? Math.max(0, Math.round((boardingTime - gateArrival) / 60000)) : 0;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const segments = recommendation.segments || [];
    const comfortBuffer = segments.find(s => s.id === 'comfort_buffer');
    const displaySegments = segments.filter(s => s.id !== 'comfort_buffer');

    // Build timeline steps
    const timelineSteps = displaySegments.map((seg, idx) => {
        const cumulativeBefore = displaySegments.slice(0, idx).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const startTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
        const endTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + seg.duration_minutes);
        const meta = getSegmentMeta(seg);

        let subtitle = '';
        let detail = '';
        if (seg.id === 'transport') {
            const distMatch = seg.advice?.match(/([\d.]+)\s*mi/i);
            const durMatch = seg.advice?.match(/(\d+)\s*min/i);
            const parts = [];
            if (durMatch) parts.push(`${durMatch[1]} mins`);
            if (distMatch) parts.push(`${distMatch[1]} mi`);
            subtitle = parts.length ? parts.join(' — ') : `${seg.duration_minutes} min`;
        }
        if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const periodMatch = seg.advice?.match(/\|([^|]+)$/);
            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
            const period = periodMatch ? periodMatch[1].trim() : '';
            subtitle = `${waitMin} min wait${period ? ' · ' + period : ''}`;
        }
        if (seg.id === 'walk_to_gate' && comfortBuffer) {
            subtitle = `+${formatDuration(comfortBuffer.duration_minutes)} buffer`;
        }
        if (seg.id === 'at_airport') {
            subtitle = seg.advice || '';
        }

        return { ...meta, startTime, endTime, duration: seg.duration_minutes, durationLabel: formatDuration(seg.duration_minutes), subtitle, detail, seg, isLast: idx === displaySegments.length - 1 };
    });

    const isPastDue = recommendation.leave_home_at && new Date(recommendation.leave_home_at) < new Date();

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {/* ── HERO: Leave Home By ── */}
            <motion.div
                custom={0} variants={stagger} initial="hidden" animate="visible"
                className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-5"
            >
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">Leave Home By</p>
                        <motion.p
                            key={formatUTCToLocal(recommendation.leave_home_at)}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl md:text-6xl font-black text-foreground tracking-tight"
                        >
                            {formatUTCToLocal(recommendation.leave_home_at)}
                        </motion.p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {confidenceScore}% Confident
                        </span>
                        {selectedFlight && (
                            <p className="text-sm text-muted-foreground">
                                {selectedFlight.flight_number} · {selectedFlight.origin_code} → {selectedFlight.destination_code} · {totalToHM(totalMinutes)} door-to-gate
                            </p>
                        )}
                        {selectedFlight && (
                            <p className="text-xs text-indigo-600 font-medium">
                                {selectedFlight.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : 'Terminal TBD'} · {selectedFlight.departure_gate ? `Gate ${selectedFlight.departure_gate}` : 'Gate not assigned yet'}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Late warning */}
            {isPastDue && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 mb-5 flex items-center gap-3 bg-red-50 border border-red-200">
                    <span className="text-lg">⚠️</span>
                    <p className="text-red-700 text-sm font-medium">
                        You needed to leave by {formatUTCToLocal(recommendation.leave_home_at)} — you may not make this flight on time.
                    </p>
                </motion.div>
            )}

            {/* ── HORIZONTAL TIMELINE (Desktop) ── */}
            <motion.div
                custom={1} variants={stagger} initial="hidden" animate="visible"
                className="hidden md:block rounded-2xl border border-gray-200 bg-white p-6 md:p-8 mb-5"
            >
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">Your Journey Timeline</h3>

                <div className="relative">
                    {/* Steps row */}
                    <div className="flex items-start">
                        {timelineSteps.map((step, idx) => (
                            <React.Fragment key={idx}>
                                {/* Step node */}
                                <motion.div
                                    custom={idx + 2} variants={stagger} initial="hidden" animate="visible"
                                    className="flex flex-col items-center text-center shrink-0"
                                    style={{ width: 80 }}
                                >
                                    <div className={`w-11 h-11 rounded-xl ${step.bg} flex items-center justify-center mb-2 ring-2 ring-white shadow-sm`}>
                                        <step.Icon className={`w-5 h-5 ${step.color}`} />
                                    </div>
                                    <p className="font-bold text-foreground text-xs leading-tight">{step.startTime}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-tight">{step.shortLabel}</p>
                                    {step.subtitle && <p className="text-[10px] text-indigo-600 font-medium mt-0.5 leading-tight">{step.subtitle}</p>}
                                </motion.div>

                                {/* Duration connector between steps */}
                                {!step.isLast && (
                                    <div className="flex-1 flex flex-col items-center justify-start pt-4 min-w-[60px]">
                                        <div className="w-full flex items-center">
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <span className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-gray-50 border border-gray-200 rounded-full whitespace-nowrap">
                                                {step.durationLabel}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200" />
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ── VERTICAL TIMELINE (Mobile) ── */}
            <motion.div
                custom={1} variants={stagger} initial="hidden" animate="visible"
                className="md:hidden rounded-2xl border border-gray-200 bg-white p-5 mb-5"
            >
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Your Journey</h3>

                <div className="space-y-0">
                    {timelineSteps.map((step, idx) => (
                        <div key={idx}>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}>
                                    <step.Icon className={`w-4 h-4 ${step.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-foreground text-sm">{step.shortLabel}</p>
                                        <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{step.startTime}</span>
                                    </div>
                                    {step.subtitle && <p className="text-xs text-indigo-600 font-medium">{step.subtitle}</p>}
                                </div>
                            </div>

                            {/* Duration connector */}
                            {!step.isLast && (
                                <div className="flex items-center gap-3 py-1.5">
                                    <div className="w-9 flex justify-center">
                                        <div className="w-px h-5 bg-gray-200" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-muted-foreground">{step.durationLabel}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── BOARDING + STATS FOOTER ── */}
            <motion.div
                custom={timelineSteps.length + 2} variants={stagger} initial="hidden" animate="visible"
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            >
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="p-5 md:p-6">
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">Boarding</p>
                        <p className="text-2xl md:text-3xl font-black text-foreground">{boarding}</p>
                    </div>
                    <div className="p-5 md:p-6">
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Flight Departs</p>
                        <p className="text-2xl md:text-3xl font-black text-foreground">{departureTime}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                    <div className="p-5 md:p-6">
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Journey</p>
                        <p className="text-xl md:text-2xl font-black text-foreground">{totalToHM(totalMinutes)}</p>
                    </div>
                    <div className="p-5 md:p-6">
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Gate Cushion</p>
                        <p className="text-xl md:text-2xl font-black text-emerald-600">{gateCushionMinutes > 0 ? `${gateCushionMinutes}m` : totalToHM(comfortBuffer?.duration_minutes || 0)}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
