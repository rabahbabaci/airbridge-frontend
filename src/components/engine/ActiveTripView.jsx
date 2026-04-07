import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCircle2, Circle, RefreshCw, Plus, Settings as SettingsIcon, PartyPopper } from 'lucide-react';

import { formatCountdownText, formatLocalTime } from '@/utils/format';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/config';
import JourneyVisualization from './JourneyVisualization';
import ActionCards from './ActionCards';

const pageTransition = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

const PHASES = [
    { key: 'at_home', label: 'At Home' },
    { key: 'en_route', label: 'En Route' },
    { key: 'at_airport', label: 'At Airport' },
    { key: 'at_gate', label: 'At Gate' },
];

function statusToPhaseIndex(status) {
    switch (status) {
        case 'en_route': return 1;
        case 'at_airport': return 2;
        case 'at_gate': return 3;
        default: return 0; // created, active
    }
}

function formatCountdown(leaveAt) {
    return formatCountdownText(leaveAt);
}

function getUrgencyLevel(leaveAt) {
    if (!leaveAt) return 'calm';
    const diffMin = (new Date(leaveAt) - Date.now()) / 60000;
    if (diffMin <= 0) return 'critical';
    if (diffMin < 60) return 'urgent';
    if (diffMin < 120) return 'attention';
    return 'calm';
}

function urgencyClasses(level) {
    switch (level) {
        case 'critical': return 'bg-red-50 border-red-200';
        case 'urgent': return 'bg-red-50 border-red-200';
        case 'attention': return 'bg-amber-50 border-amber-200';
        default: return 'bg-card border-border';
    }
}

export default function ActiveTripView({
    trip, recommendation, selectedFlight, transport,
    isAuthenticated, display_name,
    onNewTrip, onRefresh, onEdit,
}) {
    const { token } = useAuth();
    const [countdown, setCountdown] = useState('');
    const [urgency, setUrgency] = useState('calm');
    const [refreshing, setRefreshing] = useState(false);
    const [refreshed, setRefreshed] = useState(false);
    // Sprint 6 F6.6 — backend-driven trip_status, polled every 30s.
    const [polledStatus, setPolledStatus] = useState(null);

    const handleRefresh = async () => {
        setRefreshing(true);
        setRefreshed(false);
        await onRefresh();
        setRefreshing(false);
        setRefreshed(true);
        setTimeout(() => setRefreshed(false), 2000);
    };

    useEffect(() => {
        if (!recommendation?.leave_home_at) return;
        function tick() {
            const text = formatCountdown(recommendation.leave_home_at);
            setCountdown(text);
            setUrgency(getUrgencyLevel(recommendation.leave_home_at));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [recommendation?.leave_home_at]);

    // Poll /v1/trips/active for the latest backend trip_status. Backend
    // ticks the state machine through active -> en_route -> at_airport ->
    // at_gate -> complete based on push acknowledgements and timing.
    useEffect(() => {
        if (!token || !trip?.trip_id) return;
        let cancelled = false;

        async function poll() {
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
        }

        poll();
        const id = setInterval(poll, 30000);
        return () => { cancelled = true; clearInterval(id); };
    }, [token, trip?.trip_id]);

    // Backend status takes precedence; fall back to whatever the parent
    // passed in (which itself may be a stale prop snapshot).
    const effectiveStatus = polledStatus || trip?.status || 'active';
    const currentPhase = statusToPhaseIndex(effectiveStatus);
    const isPast = urgency === 'critical';

    // Phase-specific hero content. Returns { label, sub, urgencyOverride? }.
    const phaseHero = (() => {
        const flightNumber = trip?.flight_number || '';
        const dateStr = trip?.departure_date || '';
        const terminal = selectedFlight?.departure_terminal;
        const gate = selectedFlight?.departure_gate;
        const depTime = selectedFlight?.departure_time
            ? formatLocalTime(selectedFlight.departure_time)
            : '';

        switch (effectiveStatus) {
            case 'en_route':
                return {
                    label: `On your way to ${terminal ? `Terminal ${terminal}` : 'the airport'}`,
                    sub: `${flightNumber}${dateStr ? ` · ${dateStr}` : ''}`,
                };
            case 'at_airport':
                return {
                    label: gate ? `Head to TSA → Gate ${gate}` : 'Head to TSA',
                    sub: `${flightNumber}${terminal ? ` · Terminal ${terminal}` : ''}`,
                };
            case 'at_gate':
                return {
                    label: depTime ? `Boarding around ${depTime}` : "You're set",
                    sub: `${flightNumber}${gate ? ` · Gate ${gate}` : ''}`,
                };
            case 'complete':
                return {
                    label: 'Trip complete',
                    sub: `${flightNumber}${dateStr ? ` · ${dateStr}` : ''}`,
                };
            default: // 'active' / 'created' / unknown
                return {
                    label: isPast ? 'Leave NOW' : countdown || 'Calculating...',
                    sub: `${flightNumber}${dateStr ? ` · ${dateStr}` : ''}`,
                };
        }
    })();

    // Section visibility per phase.
    const showActionCards = isAuthenticated && (effectiveStatus === 'active' || effectiveStatus === 'en_route');
    const showFullTimeline = effectiveStatus === 'active';
    const showFlightStatus = effectiveStatus !== 'complete';
    const showCompleteCard = effectiveStatus === 'complete';

    return (
        <motion.div key="active_trip" {...pageTransition} className="min-h-[calc(100vh-57px)] bg-secondary/50">

            {/* ── 1. HERO COUNTDOWN ── */}
            <div className={`border-b ${urgencyClasses(effectiveStatus === 'active' ? urgency : 'calm')} transition-colors duration-500`}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={`${effectiveStatus}-${phaseHero.label}`}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`font-black tracking-tight ${
                                effectiveStatus === 'active' && isPast
                                    ? 'text-4xl md:text-5xl text-red-600 animate-pulse'
                                    : effectiveStatus === 'active' && urgency === 'urgent'
                                        ? 'text-4xl md:text-5xl text-red-600'
                                        : effectiveStatus === 'active' && urgency === 'attention'
                                            ? 'text-4xl md:text-5xl text-amber-700'
                                            : 'text-3xl md:text-4xl text-foreground'
                            }`}
                        >
                            {phaseHero.label}
                        </motion.p>
                    </AnimatePresence>
                    <p className="text-sm text-muted-foreground mt-3">{phaseHero.sub}</p>
                </div>
            </div>

            {/* ── 2. PHASE INDICATOR ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center justify-between">
                    {PHASES.map((phase, idx) => {
                        const isCompleted = idx < currentPhase;
                        const isCurrent = idx === currentPhase;
                        return (
                            <React.Fragment key={phase.key}>
                                {idx > 0 && (
                                    <div className={`flex-1 h-0.5 mx-1 ${isCompleted ? 'bg-emerald-500' : 'bg-border'}`} />
                                )}
                                <div className="flex flex-col items-center gap-1.5">
                                    {isCompleted ? (
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                                            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                                            <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                                        </div>
                                    )}
                                    <span className={`text-xs font-medium ${
                                        isCompleted ? 'text-emerald-600' :
                                        isCurrent ? 'text-foreground font-bold' :
                                        'text-muted-foreground/50'
                                    }`}>
                                        {phase.label}
                                    </span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* ── 3. SEGMENT TIMELINE ── (only while planning the trip) */}
            {showFullTimeline && (
                recommendation ? (
                    <JourneyVisualization
                        locked={true}
                        recommendation={recommendation}
                        selectedFlight={selectedFlight}
                        transport={transport}
                        homeAddress={trip?.home_address}
                    />
                ) : (
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                        <div className="bg-card rounded-3xl border border-border p-8 space-y-4 animate-pulse">
                            <div className="h-4 bg-secondary rounded w-1/3" />
                            <div className="h-12 bg-secondary rounded" />
                            <div className="h-12 bg-secondary rounded" />
                        </div>
                    </div>
                )
            )}

            {/* ── 3b. TRIP COMPLETE CARD ── */}
            {showCompleteCard && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                    <div className="bg-card rounded-3xl border border-border p-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                            <PartyPopper className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">You made it</h3>
                        <p className="text-sm text-muted-foreground">
                            Tell us how it went next time you open AirBridge so we can keep getting smarter.
                        </p>
                    </div>
                </div>
            )}

            {/* ── 4. FLIGHT STATUS BAR ── */}
            {showFlightStatus && selectedFlight && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-center">
                    {selectedFlight.is_delayed ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                            Delayed
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                            On Time
                        </span>
                    )}
                </div>
            )}

            {/* ── 5. ACTION CARDS ── (active + en_route only) */}
            {showActionCards && (
                <ActionCards
                    recommendation={recommendation}
                    selectedFlight={selectedFlight}
                    transport={transport}
                />
            )}

            {/* ── 6. BOTTOM ACTIONS ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center gap-4">
                <button onClick={onEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-all">
                    <SettingsIcon className="w-3.5 h-3.5" />
                    Edit preferences
                </button>
                <button onClick={handleRefresh} disabled={refreshing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50">
                    {refreshing ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                            Updating...
                        </>
                    ) : refreshed ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Updated</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                        </>
                    )}
                </button>
                <button
                    onClick={onNewTrip}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Trip
                </button>
            </div>
        </motion.div>
    );
}
