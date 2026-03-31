import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCircle2, Circle, RefreshCw, Plus, Settings as SettingsIcon } from 'lucide-react';

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
    const diffMs = new Date(leaveAt) - Date.now();
    if (diffMs <= 0) return null; // past
    const totalMin = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0) return `Leave in ${h}h ${m}m`;
    return `Leave in ${m}m`;
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
    const [countdown, setCountdown] = useState('');
    const [urgency, setUrgency] = useState('calm');
    const [refreshing, setRefreshing] = useState(false);
    const [refreshed, setRefreshed] = useState(false);

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

    const currentPhase = statusToPhaseIndex(trip?.status);
    const isPast = urgency === 'critical';

    return (
        <motion.div key="active_trip" {...pageTransition} className="min-h-[calc(100vh-57px)] bg-secondary/50">

            {/* ── 1. HERO COUNTDOWN ── */}
            <div className={`border-b ${urgencyClasses(urgency)} transition-colors duration-500`}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
                    {recommendation ? (
                        <>
                            <motion.p
                                key={countdown || 'now'}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`font-black tracking-tight ${
                                    isPast
                                        ? 'text-4xl md:text-5xl text-red-600 animate-pulse'
                                        : urgency === 'urgent'
                                            ? 'text-4xl md:text-5xl text-red-600'
                                            : urgency === 'attention'
                                                ? 'text-4xl md:text-5xl text-amber-700'
                                                : 'text-4xl md:text-5xl text-foreground'
                                }`}
                            >
                                {isPast ? 'Leave NOW' : countdown || 'Calculating...'}
                            </motion.p>
                        </>
                    ) : (
                        <p className="text-3xl md:text-4xl font-black text-muted-foreground/50">Calculating...</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-3">
                        {trip?.flight_number || ''}
                        {trip?.departure_date ? ` \u00b7 ${trip.departure_date}` : ''}
                        {trip?.status ? ` \u00b7 ${trip.status === 'active' ? 'Tracking' : trip.status === 'en_route' ? 'En Route' : trip.status}` : ''}
                    </p>
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

            {/* ── 3. SEGMENT TIMELINE ── */}
            {recommendation ? (
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
            )}

            {/* ── 4. FLIGHT STATUS BAR ── */}
            {selectedFlight && (
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

            {/* ── 5. ACTION CARDS ── */}
            {isAuthenticated && (
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
