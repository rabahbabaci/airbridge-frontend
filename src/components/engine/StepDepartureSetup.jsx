import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { shortCity, formatLocalTime } from '@/utils/format';
import {
    Car, Train, Bus, AlertCircle, CheckCircle2, ArrowLeft,
    ShieldCheck, Luggage, Baby, Smartphone, Minus, Plus, RefreshCw, MapPin,
} from 'lucide-react';

import AddressAutocomplete from './AddressAutocomplete';

// ── Constants ───────────────────────────────────────────────────────────────
const GATE_TIME_SNAPS = [0, 15, 30, 45, 60, 90, 120, 150, 180];
const GATE_TIME_LABELS = {
    0: '0 min · Board on arrival',
    15: '15 min · Quick settle-in',
    30: '30 min · Time to relax',
    45: '45 min · Grab a bite',
    60: '1 hour · Work or explore',
    90: '1h 30m · Plenty of time',
    120: '2 hours · Full airport experience',
    150: '2h 30m · Extended airport time',
    180: '3 hours · Maximum comfort',
};

function snapToNearest(val) {
    let closest = GATE_TIME_SNAPS[0];
    let minDist = Math.abs(val - closest);
    for (const snap of GATE_TIME_SNAPS) {
        const dist = Math.abs(val - snap);
        if (dist < minDist) { closest = snap; minDist = dist; }
    }
    return closest;
}

const TRANSPORT_OPTIONS = [
    { id: 'rideshare', label: 'Rideshare', icon: Car },
    { id: 'driving', label: 'Drive', icon: Car },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'bus', label: 'Bus', icon: Bus },
];

const BUFFER_PRESETS = [
    { label: 'Tight · 15 min', value: 15 },
    { label: 'Comfortable · 30 min', value: 30 },
    { label: 'Relaxed · 60 min', value: 60 },
];

const pageTransition = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

const stagger = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    }),
};

export default function StepDepartureSetup({
    selectedFlight, flightNumber,
    startingAddress, setStartingAddress,
    addressError, setAddressError,
    addressContainerRef, addressInputRef,
    transport, setTransport,
    hasPrecheck, setHasPrecheck,
    hasClear, setHasClear,
    hasPriorityLane, setHasPriorityLane,
    hasBoardingPass, setHasBoardingPass,
    bagCount, setBagCount,
    withChildren, setWithChildren,
    gateTime, setGateTime,
    currentTripId, isSubmitting, isRecomputing,
    apiError, setApiError,
    onRecalculate, onBack, onReset,
}) {
    const hasAddress = startingAddress.trim().length > 0;
    const isPresetGateTime = BUFFER_PRESETS.some(p => p.value === gateTime);
    const [customSliderOpen, setCustomSliderOpen] = useState(!isPresetGateTime);
    // Determine if current gateTime matches a preset
    const activePreset = BUFFER_PRESETS.find(p => p.value === gateTime);

    // Auto-expand custom slider when gateTime is set to a non-preset value (e.g., from active trip)
    useEffect(() => {
        const isPreset = BUFFER_PRESETS.some(p => p.value === gateTime);
        if (!isPreset && !customSliderOpen) {
            setCustomSliderOpen(true);
        }
    }, [gateTime]);

    // Security chip helpers
    const isNoneSecurity = !hasPrecheck && !hasClear && !hasPriorityLane;

    function handleSecurityChip(chip) {
        if (chip === 'none') {
            setHasPrecheck(false);
            setHasClear(false);
            setHasPriorityLane(false);
        } else if (chip === 'precheck') {
            setHasPrecheck(v => !v);
            setHasPriorityLane(false);
        } else if (chip === 'clear') {
            setHasClear(v => !v);
            setHasPriorityLane(false);
        } else if (chip === 'priority') {
            setHasPriorityLane(v => !v);
            if (!hasPriorityLane) { setHasPrecheck(false); setHasClear(false); }
        }
    }

    return (
        <motion.div key="s3" {...pageTransition} className="w-full max-w-2xl mx-auto">
            <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Departure Setup</h1>
                    <p className="text-sm text-muted-foreground">
                        {currentTripId ? 'Adjust preferences — your trip will be recomputed' : 'Customize your travel preferences'}
                    </p>
                </div>
            </motion.div>

            {/* Error banner */}
            {apiError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 mb-5 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <p className="text-destructive text-sm font-medium">{apiError}</p>
                        <button onClick={() => setApiError(null)}
                            className="text-sm text-destructive font-semibold underline mt-1 hover:text-destructive/80">
                            Dismiss
                        </button>
                    </div>
                </motion.div>
            )}

            {/* 1. Address input — always full opacity */}
            <motion.div ref={addressContainerRef} custom={1} variants={stagger} initial="hidden" animate="visible" className="mb-5">
                <label className="text-sm font-semibold text-foreground/70 mb-2 block">Where are you leaving from?</label>
                <AddressAutocomplete
                    ref={addressInputRef}
                    value={startingAddress}
                    onChange={(v) => { setStartingAddress(v); setAddressError(null); }}
                    hasError={!!addressError}
                    className={!hasAddress && !addressError ? '[&>div]:border-primary [&>div]:ring-2 [&>div]:ring-primary/20' : ''}
                />
                {addressError && <p className="text-sm text-destructive mt-1.5">{addressError}</p>}
                {!hasAddress && !addressError && (
                    <div className="flex items-center gap-2 mt-2.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">Enter your departure location to calculate your journey</p>
                    </div>
                )}
            </motion.div>

            {/* 2. Flight badge */}
            {selectedFlight && (
                <motion.div custom={2} variants={stagger} initial="hidden" animate="visible"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-6">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 flex-wrap">
                        {flightNumber.toUpperCase()} · {formatLocalTime(selectedFlight.departure_time)} ·{' '}
                        {shortCity(selectedFlight.origin_name) || selectedFlight.origin_code}{' '}
                        <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{selectedFlight.origin_code}</span>
                        {' → '}
                        {shortCity(selectedFlight.destination_name) || selectedFlight.destination_code}{' '}
                        <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{selectedFlight.destination_code}</span>
                    </span>
                </motion.div>
            )}

            {/* Dimmed wrapper — only preferences + CTA */}
            <div className={`transition-opacity duration-300 ${hasAddress ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>

                {/* 3. Transport pills */}
                <motion.div custom={3} variants={stagger} initial="hidden" animate="visible"
                    className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
                    <div className="px-5 py-3.5 border-b border-border">
                        <h3 className="font-bold text-foreground text-sm">How are you getting there?</h3>
                    </div>
                    <div className="px-5 py-4">
                        <div className="grid grid-cols-4 gap-2">
                            {TRANSPORT_OPTIONS.map(opt => {
                                const isActive = transport === opt.id;
                                return (
                                    <button key={opt.id} onClick={() => setTransport(opt.id)}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                        }`}>
                                        <opt.icon className="w-4 h-4" />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                        {transport === 'driving' && (
                            <p className="text-xs text-muted-foreground mt-2">Includes parking time at airport</p>
                        )}
                    </div>
                </motion.div>

                {/* 4. Security & Travel Details */}
                <motion.div custom={4} variants={stagger} initial="hidden" animate="visible"
                    className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
                    <div className="px-5 py-3.5 border-b border-border">
                        <h3 className="font-bold text-foreground text-sm">Security & Travel Details</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                        {/* Security chips */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">Security access</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'none', label: 'None', active: isNoneSecurity },
                                    { id: 'precheck', label: 'PreCheck', active: hasPrecheck },
                                    { id: 'clear', label: 'CLEAR', active: hasClear },
                                    { id: 'priority', label: 'Priority', active: hasPriorityLane },
                                ].map(chip => (
                                    <button key={chip.id} onClick={() => handleSecurityChip(chip.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                            chip.active
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                        }`}>
                                        <ShieldCheck className="w-3 h-3" />
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-border" />

                        {/* Boarding pass */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Boarding Pass</p>
                                    <p className="text-xs text-muted-foreground">Already have your boarding pass?</p>
                                </div>
                            </div>
                            <Switch checked={hasBoardingPass} onCheckedChange={setHasBoardingPass} />
                        </div>
                        {/* Checked bags */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Luggage className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Checked Bags</p>
                                    <p className="text-xs text-muted-foreground">Number of bags to check</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setBagCount(Math.max(0, bagCount - 1))} disabled={bagCount === 0}
                                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                                        bagCount === 0
                                            ? 'bg-secondary text-muted-foreground/40 border-border cursor-not-allowed'
                                            : 'bg-secondary text-foreground border-border hover:border-muted-foreground/30'
                                    }`}>
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-8 text-center text-sm font-bold text-foreground">{bagCount}</span>
                                <button onClick={() => setBagCount(Math.min(10, bagCount + 1))}
                                    className="w-8 h-8 rounded-lg border bg-secondary text-foreground border-border hover:border-muted-foreground/30 flex items-center justify-center transition-all">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        {/* Children */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Baby className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Traveling with children?</p>
                                    <p className="text-xs text-muted-foreground">Adjusts walking pace at the airport</p>
                                </div>
                            </div>
                            <Switch checked={withChildren} onCheckedChange={setWithChildren} />
                        </div>
                    </div>
                </motion.div>

                {/* 5. Gate buffer — presets + expandable slider */}
                <motion.div custom={5} variants={stagger} initial="hidden" animate="visible"
                    className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
                    <div className="px-5 py-3.5 border-b border-border">
                        <h3 className="font-bold text-foreground text-sm">How early at your gate?</h3>
                    </div>
                    <div className="px-5 py-4">
                        <div className="grid grid-cols-3 gap-2">
                            {BUFFER_PRESETS.map(preset => {
                                const isActive = gateTime === preset.value && !customSliderOpen;
                                return (
                                    <button key={preset.value} onClick={() => { setGateTime(preset.value); setCustomSliderOpen(false); }}
                                        className={`py-2.5 px-2 rounded-xl text-sm font-medium border transition-all text-center ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                        }`}>
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>

                        <button onClick={() => setCustomSliderOpen(v => !v)}
                            className="text-xs text-primary font-medium mt-3 hover:text-primary/80 transition-colors">
                            {customSliderOpen ? 'Hide custom time' : 'Custom time'}
                        </button>

                        <AnimatePresence>
                            {customSliderOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4">
                                        <div className="relative h-8">
                                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-primary/20" />
                                            <div
                                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-primary"
                                                style={{ width: `${(gateTime / 180) * 100}%` }}
                                            />
                                            <input
                                                type="range" min={0} max={180} step={1} value={gateTime}
                                                onChange={(e) => setGateTime(snapToNearest(Number(e.target.value)))}
                                                className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-pointer"
                                                aria-label="Gate arrival buffer minutes"
                                            />
                                            <div
                                                className="absolute z-10 w-5 h-5 rounded-full border-2 border-primary bg-background shadow-md pointer-events-none"
                                                style={{ left: `${(gateTime / 180) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                                            />
                                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                                                {GATE_TIME_SNAPS.map(snap => (
                                                    <div key={snap}
                                                        className={`absolute w-0.5 h-2 rounded-full transition-colors ${snap === gateTime ? 'bg-primary' : 'bg-border'}`}
                                                        style={{ left: `${(snap / 180) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-3 text-center">
                                            <p className="text-sm font-bold text-foreground">{GATE_TIME_LABELS[gateTime]}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* 6. CTA */}
                <motion.div custom={7} variants={stagger} initial="hidden" animate="visible">
                    <button onClick={onRecalculate} disabled={isSubmitting || !hasAddress}
                        className={`w-full py-4 rounded-2xl text-base font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                            isSubmitting || !hasAddress
                                ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                                : 'bg-foreground hover:bg-foreground/90 text-background shadow-foreground/10'
                        }`}>
                        {isSubmitting ? (
                            <>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full" />
                                Calculating...
                            </>
                        ) : currentTripId ? (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Update My Departure
                            </>
                        ) : (
                            'Calculate My Departure'
                        )}
                    </button>
                    {/* 8. Start over */}
                    <button onClick={onReset}
                        className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors">
                        Start over
                    </button>
                </motion.div>

            </div>
        </motion.div>
    );
}
