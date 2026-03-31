import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { shortCity, formatLocalTime, formatDuration } from '@/utils/format';
import {
    Plane, Car, Train, Bus, Shield, Clock, MapPin, Luggage,
    Building2, PersonStanding, Ticket, AlertTriangle, CircleParking,
    Bell, CheckCircle2,
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
    // If the string contains a timezone offset (e.g., +00:00, Z), parse as UTC via Date constructor
    if (/[Zz]|[+-]\d{2}:\d{2}$/.test(localTimeStr)) {
        const d = new Date(localTimeStr);
        return isNaN(d.getTime()) ? null : d;
    }
    // Otherwise treat as local time (no timezone info)
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
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

// ── Transport helpers ───────────────────────────────────────────────────────
const TRANSPORT_ICONS = { rideshare: Car, driving: Car, train: Train, bus: Bus, other: Car };
const TRANSPORT_LABELS = { rideshare: 'Ride', driving: 'Drive', train: 'Train', bus: 'Bus', other: 'Ride' };
const TRANSPORT_STAT_LABELS = { rideshare: 'Rideshare', driving: 'Drive', train: 'Train', bus: 'Bus', other: 'Transport' };

function transportLabel(transport, airportCode) {
    const mode = TRANSPORT_LABELS[(transport || '').toLowerCase()] || 'Ride';
    return `${mode} to ${airportCode || 'Airport'}`;
}

function getTransportIcon(transport) {
    return TRANSPORT_ICONS[(transport || '').toLowerCase()] || Car;
}

// ── Segment Icon Mapping ────────────────────────────────────────────────────
function getSegmentMeta(seg, airportCode, transport) {
    const id = (seg.id || '').toLowerCase();
    const label = (seg.label || '').toLowerCase();

    if (id === 'parking')
        return { Icon: CircleParking, bg: 'bg-accent', iconColor: 'text-primary', shortLabel: 'Parking' };
    if (id === 'transport' || label.includes('leave') || label.includes('depart') || label.includes('ride') || label.includes('drive') || label.includes('uber'))
        return { Icon: getTransportIcon(transport), bg: 'bg-accent', iconColor: 'text-primary', shortLabel: transportLabel(transport, airportCode) };
    if (id === 'at_airport' || label.includes('terminal'))
        return { Icon: Building2, bg: 'bg-accent', iconColor: 'text-primary', shortLabel: `At ${airportCode || 'Airport'}` };
    if (id === 'checkin' || label.includes('check-in') || label.includes('counter'))
        return { Icon: Ticket, bg: 'bg-accent', iconColor: 'text-primary', shortLabel: 'Check-in' };
    if (id === 'bag_drop' || label.includes('bag') || label.includes('luggage'))
        return { Icon: Luggage, bg: 'bg-amber-100', iconColor: 'text-amber-600', shortLabel: 'Bag Drop' };
    if (id === 'tsa' || label.includes('security') || label.includes('tsa'))
        return { Icon: Shield, bg: 'bg-red-100', iconColor: 'text-red-600', shortLabel: 'TSA Security' };
    if (id === 'walk_to_gate' || label.includes('walk'))
        return { Icon: PersonStanding, bg: 'bg-emerald-100', iconColor: 'text-emerald-600', shortLabel: 'At Gate' };
    if (id === 'gate_buffer')
        return { Icon: Clock, bg: 'bg-accent', iconColor: 'text-primary', shortLabel: 'Buffer' };
    if (label.includes('gate'))
        return { Icon: Ticket, bg: 'bg-emerald-100', iconColor: 'text-emerald-600', shortLabel: 'At Gate' };
    if (label.includes('board'))
        return { Icon: Plane, bg: 'bg-emerald-100', iconColor: 'text-emerald-600', shortLabel: 'Board' };
    return { Icon: MapPin, bg: 'bg-secondary', iconColor: 'text-muted-foreground', shortLabel: seg.label || 'Step' };
}

// ── Smart leave text + urgency ──────────────────────────────────────────────
function getLeaveUrgency(leaveHomeAt) {
    if (!leaveHomeAt) return { label: 'Leave by', urgency: 'calm' };
    const diffMs = new Date(leaveHomeAt) - Date.now();
    const diffMin = diffMs / 60000;

    if (diffMin <= 0) return { label: 'Leave now!', urgency: 'critical' };
    if (diffMin < 5) return { label: 'Leave now!', urgency: 'critical' };
    if (diffMin < 30) return { label: `Time to go — leave in ${Math.round(diffMin)} min`, urgency: 'urgent' };
    if (diffMin < 120) {
        const h = Math.floor(diffMin / 60);
        const m = Math.round(diffMin % 60);
        return { label: `Leave in ${h > 0 ? `${h}h ${m}m` : `${m}m`}`, urgency: 'aware' };
    }
    return { label: 'Leave by', urgency: 'calm' };
}

function urgencyClasses(urgency) {
    switch (urgency) {
        case 'critical': return 'bg-destructive';
        case 'urgent': return 'bg-amber-500';
        default: return 'bg-primary';
    }
}

// ── Smart boarding countdown ────────────────────────────────────────────────
function smartBoardingLabel(boardingTime) {
    if (!boardingTime) return 'Boarding time TBD';
    const diffMin = (boardingTime.getTime() - Date.now()) / 60000;

    if (diffMin <= 0) return 'Boarding now';
    if (diffMin < 120) return `Boarding in ${formatDuration(Math.round(diffMin))}`;
    if (diffMin < 720) return `Boarding in ${formatDuration(Math.round(diffMin))}`;
    const fmt = boardingTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (boardingTime.toDateString() === today.toDateString()) return `Boarding at ${fmt}`;
    if (boardingTime.toDateString() === tomorrow.toDateString()) return `Boarding tomorrow at ${fmt}`;
    const day = boardingTime.toLocaleDateString('en-US', { weekday: 'short' });
    return `Boarding ${day} at ${fmt}`;
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function JourneyVisualization({
    locked, recommendation, selectedFlight, transport, onReady,
    securityLabel,
    isTracked, onTrack, isAuthenticated,
}) {
    const [leaveInfo, setLeaveInfo] = useState({ label: 'Leave by', urgency: 'calm' });
    const [boardingLabel, setBoardingLabel] = useState('');

    useEffect(() => {
        if (!recommendation?.leave_home_at) return;
        const bt = selectedFlight?.departure_time ? (() => {
            const d = parseDepartureTime(selectedFlight.departure_time);
            return d ? new Date(d.getTime() - 30 * 60000) : null;
        })() : null;

        function update() {
            setLeaveInfo(getLeaveUrgency(recommendation.leave_home_at));
            setBoardingLabel(smartBoardingLabel(bt));
        }
        update();
        const id = setInterval(update, 30000);
        return () => clearInterval(id);
    }, [recommendation?.leave_home_at, selectedFlight?.departure_time]);

    useEffect(() => {
        if (locked && recommendation && onReady) {
            const t = setTimeout(onReady, 500);
            return () => clearTimeout(t);
        }
    }, [locked, recommendation]);

    if (!locked || !recommendation) return null;

    const gateArrival = recommendation.gate_arrival_utc ? new Date(recommendation.gate_arrival_utc) : null;
    const departureDateObj = selectedFlight?.departure_time ? parseDepartureTime(selectedFlight.departure_time) : null;
    const boardingTime = departureDateObj ? new Date(departureDateObj.getTime() - 30 * 60000) : null;
    const bufferKnown = !!(gateArrival && boardingTime);
    const gateCushionMinutes = bufferKnown ? Math.max(0, Math.round((boardingTime - gateArrival) / 60000)) : null;

    const { boarding, departure: departureTime } = selectedFlight
        ? parseDepartureAndGetBoardingTime(selectedFlight.departure_time)
        : { boarding: '', departure: '' };

    const segments = recommendation.segments || [];
    const comfortBuffer = segments.find(s => s.id === 'comfort_buffer');
    const parkingSeg = segments.find(s => s.id === 'parking');
    const airportCode = selectedFlight?.origin_code || '';
    const isDriving = (transport || '').toLowerCase() === 'driving';

    // allSegments: used for TIME calculations (includes parking, excludes comfort_buffer/gate_buffer)
    const allSegments = segments.filter(s => s.id !== 'comfort_buffer' && s.id !== 'gate_buffer');
    // displaySegments: used for RENDERING nodes (also excludes parking)
    const displaySegments = allSegments.filter(s => s.id !== 'parking');

    // Total door-to-gate uses allSegments
    const totalMinutesFromSegments = allSegments.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Build step data for timeline
    const timelineSteps = displaySegments.map((seg, idx) => {
        // Find this segment in the full allSegments array for correct time calculation
        const fullIdx = allSegments.indexOf(seg);
        const cumulativeBefore = allSegments.slice(0, fullIdx).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const stepTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore);
        const meta = getSegmentMeta(seg, airportCode, transport);
        const isLast = idx === displaySegments.length - 1;

        // Display time: show arrival time at each node
        let displayTime;
        if (seg.id === 'at_airport' && isDriving && parkingSeg && parkingSeg.duration_minutes > 0) {
            // Show arrival at airport (before parking)
            displayTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore - parkingSeg.duration_minutes);
        } else if (isLast) {
            displayTime = addMinutesAndFormat(recommendation.leave_home_at, cumulativeBefore + seg.duration_minutes);
        } else {
            displayTime = stepTime;
        }

        let subtitle = '';
        let connectorExtra = '';
        if (seg.id === 'transport') {
            subtitle = '';
        } else if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            const waitMin = waitMatch ? parseInt(waitMatch[1], 10) : seg.duration_minutes;
            subtitle = `${formatDuration(waitMin)} wait`;
        } else if (seg.id === 'walk_to_gate') {
            if (comfortBuffer) subtitle = `+${formatDuration(comfortBuffer.duration_minutes)} buffer`;
        } else if (seg.id === 'at_airport') {
            // Walk time from at_airport to next segment
            const walkMatch = seg.advice?.match(/walk_to_next:(\d+)/);
            const walkMin = walkMatch ? parseInt(walkMatch[1], 10) : (seg.duration_minutes || 0);
            if (walkMin > 0) {
                connectorExtra = `${formatDuration(walkMin)} walk`;
            }
            // Parking subtitle for drivers
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

        return { ...meta, time: displayTime, durationMinutes: seg.duration_minutes, duration: formatDuration(seg.duration_minutes), connectorExtra, subtitle, seg, isLast };
    });

    function connectorLabel(idx) {
        const step = timelineSteps[idx];
        const nextStep = timelineSteps[idx + 1];
        if (step.connectorExtra) return step.connectorExtra;
        if (step.seg.id === 'transport') return step.duration;
        if (step.seg.id === 'at_airport' && step.durationMinutes > 0) {
            return `${formatDuration(step.durationMinutes)} walk`;
        }
        if (nextStep.seg.id === 'walk_to_gate') return `${nextStep.duration} walk`;
        return nextStep.duration;
    }

    // Stats — show user preferences in labels
    const transportStatLabel = (TRANSPORT_STAT_LABELS[(transport || '').toLowerCase()] || 'Transport').toUpperCase();
    const securityStatLabel = (securityLabel || 'Standard TSA').toUpperCase();

    const stats = [];
    displaySegments.forEach(seg => {
        if (seg.id === 'transport') stats.push({ label: transportStatLabel, value: formatDuration(seg.duration_minutes) });
        if (seg.id === 'tsa') {
            const waitMatch = seg.advice?.match(/wait:(\d+)/);
            stats.push({ label: securityStatLabel, value: formatDuration(waitMatch ? parseInt(waitMatch[1]) : seg.duration_minutes) });
        }
        if (seg.id === 'walk_to_gate') stats.push({ label: 'Gate Walk', value: formatDuration(seg.duration_minutes) });
    });
    if (comfortBuffer) stats.push({ label: 'Buffer', value: formatDuration(comfortBuffer.duration_minutes) });

    const isDelayed = selectedFlight?.is_delayed && selectedFlight?.revised_departure_local;
    const revisedDepartureTime = isDelayed ? formatLocalTime(selectedFlight.revised_departure_local) : null;
    const heroBg = urgencyClasses(leaveInfo.urgency);
    const showTimeAfterLabel = leaveInfo.urgency === 'calm';

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

            {/* ── HERO CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`rounded-3xl p-6 md:p-8 mb-6 ${heroBg}`}
            >
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-primary-foreground/80" />
                            <p className="text-sm font-semibold text-primary-foreground/80">{leaveInfo.label}</p>
                        </div>
                        <motion.p
                            key={formatUTCToLocal(recommendation.leave_home_at)}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className={`font-black text-primary-foreground tracking-tight ${showTimeAfterLabel ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'}`}
                        >
                            {formatUTCToLocal(recommendation.leave_home_at)}
                        </motion.p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {onTrack && (isTracked ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/90 text-white text-xs font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Tracking
                            </span>
                        ) : (
                            <button onClick={onTrack}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-primary text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all">
                                <Bell className="w-3 h-3" />
                                {isAuthenticated ? 'Track' : 'Track & get alerts'}
                            </button>
                        ))}
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-semibold backdrop-blur-sm">
                            <Clock className="w-3.5 h-3.5" />
                            {boardingLabel}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm ${
                            gateCushionMinutes == null ? 'bg-primary-foreground/20 text-primary-foreground' :
                            gateCushionMinutes === 0 ? 'bg-red-100 text-red-600' :
                            gateCushionMinutes <= 30 ? 'bg-orange-400/30 text-orange-100' :
                            'bg-emerald-400/30 text-emerald-100'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${
                                gateCushionMinutes == null ? 'bg-primary-foreground/50' :
                                gateCushionMinutes === 0 ? 'bg-red-500' :
                                gateCushionMinutes <= 30 ? 'bg-orange-300' :
                                'bg-emerald-300'
                            }`} />
                            {gateCushionMinutes == null ? 'Buffer unknown' : gateCushionMinutes === 0 ? 'No buffer' : `${formatDuration(gateCushionMinutes)} buffer`}
                        </span>
                    </div>
                </div>

                {/* Flight info */}
                {selectedFlight && (
                    <div className="mt-4 pt-4 border-t border-primary-foreground/20 flex flex-wrap items-center gap-2">
                        <span className="text-primary-foreground/70 text-sm">{selectedFlight.flight_number}</span>
                        <span className="text-primary-foreground/40">·</span>
                        <span className="text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 flex-wrap">
                            {shortCity(selectedFlight.origin_name) || selectedFlight.origin_code}{' '}
                            <span className="font-mono font-bold bg-primary-foreground/25 px-1.5 py-0.5 rounded text-[11px] tracking-wider">{selectedFlight.origin_code}</span>
                            <span className="mx-0.5">→</span>
                            {shortCity(selectedFlight.destination_name) || selectedFlight.destination_code}{' '}
                            <span className="font-mono font-bold bg-primary-foreground/25 px-1.5 py-0.5 rounded text-[11px] tracking-wider">{selectedFlight.destination_code}</span>
                        </span>
                        <span className="text-primary-foreground/40">·</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                            {selectedFlight.departure_terminal ? `Terminal ${selectedFlight.departure_terminal}` : 'Terminal TBD'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
                            {selectedFlight.departure_gate ? `Gate ${selectedFlight.departure_gate}` : 'Gate TBD'}
                        </span>
                        <span className="text-primary-foreground/40">·</span>
                        <span className="text-primary-foreground/70 text-sm">{formatDuration(totalMinutesFromSegments)} door-to-gate</span>
                    </div>
                )}

                {/* Pro tier badge */}
                {recommendation.tier === 'pro' && recommendation.remaining_pro_trips != null && (
                    <div className="mt-3 pt-3 border-t border-primary-foreground/10">
                        <span className="text-xs font-medium text-primary-foreground/60">Pro · {recommendation.remaining_pro_trips} free trips remaining</span>
                    </div>
                )}

            </motion.div>

            {/* Late departure warning */}
            {recommendation.leave_home_in_past && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <p className="text-destructive text-sm font-medium">
                        You needed to leave by {formatUTCToLocal(recommendation.leave_home_at)} — you may not make this flight on time
                    </p>
                </motion.div>
            )}

            {/* Delay warning */}
            {isDelayed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                        <p className="text-amber-800 text-sm font-semibold">Flight Delayed</p>
                        <p className="text-amber-700 text-xs mt-0.5">
                            Originally {formatLocalTime(selectedFlight.departure_time)} — now departing at {revisedDepartureTime}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── TIMELINE ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="bg-card rounded-3xl border border-border px-6 py-4 md:px-8 md:py-5 mb-6"
            >
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Your Journey Timeline</h3>

                {/* Desktop: Horizontal */}
                <div className="hidden md:block">
                    <div className="relative pt-8">
                        <div className="absolute top-14 left-8 right-8 h-0.5 bg-primary/30 z-0" />
                        {timelineSteps.length > 1 && (() => {
                            const stepWidth = 100 / timelineSteps.length;
                            return timelineSteps.slice(0, -1).map((step, idx) => {
                                const leftPercent = stepWidth * idx + stepWidth / 2 + stepWidth / 2;
                                const label = connectorLabel(idx);
                                return (
                                    <div key={`dur-${idx}`} className="absolute z-20"
                                        style={{ top: '3.5rem', left: `${leftPercent}%`, transform: 'translate(-50%, -50%)' }}>
                                        <div className="bg-card px-2.5 py-2 rounded-md border border-border shadow-sm flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-primary whitespace-nowrap leading-none">{label}</span>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
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
                                        <p className="font-bold text-foreground text-sm">{step.time}</p>
                                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{step.shortLabel}</p>
                                        {step.subtitle && <p className="text-[10px] text-primary font-medium mt-1 max-w-[140px] leading-tight">{step.subtitle}</p>}
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
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}>
                                        <step.Icon className={`w-4 h-4 ${step.iconColor}`} />
                                    </div>
                                    {idx < timelineSteps.length - 1 && (
                                        <div className="relative w-0.5 h-10 bg-border my-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary bg-card px-1.5 py-0.5 rounded border border-border shadow-sm whitespace-nowrap">
                                                {connectorLabel(idx)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="pb-4 pt-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-foreground text-sm">{step.shortLabel}</p>
                                        <span className="text-xs font-mono text-primary font-bold bg-accent px-2 py-0.5 rounded-md">{step.time}</span>
                                    </div>
                                    {step.subtitle && <p className="text-xs text-primary font-medium mt-0.5">{step.subtitle}</p>}
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
                <div className="bg-card rounded-2xl border border-border p-5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Boarding</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-600">{boarding}</p>
                    {gateCushionMinutes != null && gateCushionMinutes > 0 && (
                        <p className="text-xs font-semibold text-emerald-600 mt-1">{formatDuration(gateCushionMinutes)} cushion at gate</p>
                    )}
                </div>
                <div className="bg-card rounded-2xl border border-border p-5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Flight Departs</p>
                    <p className={`text-2xl md:text-3xl font-black ${isDelayed ? 'text-amber-600' : 'text-foreground'}`}>{departureTime}</p>
                    {isDelayed && (
                        <p className="text-xs font-semibold text-amber-600 mt-1">Delayed — now {revisedDepartureTime}</p>
                    )}
                    {selectedFlight?.departure_gate && (
                        <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md bg-accent text-primary text-xs font-bold">
                            Gate {selectedFlight.departure_gate}
                        </span>
                    )}
                </div>
            </motion.div>

            {/* ── STATS BAR ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
            >
                <div className={`grid divide-x divide-border`}
                    style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
                    {stats.map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                            <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
                            <p className="text-xl md:text-2xl font-black text-foreground">{value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── COMPUTED AT ── */}
            {recommendation.computed_at && (
                <p className="text-center text-xs text-muted-foreground/40 mt-4">
                    Computed {new Date(recommendation.computed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} · Powered by real-time data
                </p>
            )}
        </div>
    );
}
