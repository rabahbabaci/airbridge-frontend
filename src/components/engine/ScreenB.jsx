import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import {
    Plane, Car, Train, Bus, ArrowLeft, AlertCircle, CheckCircle2,
    ShieldCheck, Clock, Luggage, Baby, Smartphone, Minus, Plus,
    ChevronDown, Loader2,
} from 'lucide-react';

import JourneyVisualization from './JourneyVisualization';
import SocialAuthCard from './SocialAuthCard';
import AddressAutocomplete from './AddressAutocomplete';
import OTPModal from './OTPModal';
import { useAuth } from '@/lib/AuthContext';
import { shortCity, formatLocalTime } from '@/utils/format';
import { API_BASE } from '@/config';

// ── Animations ──────────────────────────────────────────────────────────────
const stagger = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    }),
};

// ── Constants ───────────────────────────────────────────────────────────────
const TRANSPORT_OPTIONS = [
    { id: 'rideshare', label: 'Rideshare', icon: Car },
    { id: 'driving', label: 'Drive', icon: Car },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'bus', label: 'Bus', icon: Bus },
];

const BUFFER_PRESETS = [
    { id: 'tight', label: 'Tight', sub: '15 min', minutes: 15 },
    { id: 'comfortable', label: 'Comfortable', sub: '30 min', minutes: 30 },
    { id: 'relaxed', label: 'Relaxed', sub: '60 min', minutes: 60 },
];

const LS_ADDRESS_KEY = 'airbridge_last_address';

// ── Component ───────────────────────────────────────────────────────────────
export default function ScreenB({ selectedFlight, departureDate, authHeaders, onBack, onReset }) {
    const { token, login, updateTripCount, isAuthenticated, display_name } = useAuth();

    // Address
    const [startingAddress, setStartingAddress] = useState(() => {
        try { return localStorage.getItem(LS_ADDRESS_KEY) || ''; } catch { return ''; }
    });
    const [addressError, setAddressError] = useState(null);
    const addressContainerRef = useRef(null);
    const addressInputRef = useRef(null);

    // Preferences
    const [transport, setTransport] = useState('rideshare');
    const [hasPrecheck, setHasPrecheck] = useState(false);
    const [hasClear, setHasClear] = useState(false);
    const [hasPriorityLane, setHasPriorityLane] = useState(false);
    const [hasBoardingPass, setHasBoardingPass] = useState(true);
    const [bagCount, setBagCount] = useState(0);
    const [withChildren, setWithChildren] = useState(false);
    const [bufferPreset, setBufferPreset] = useState('comfortable');
    const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

    // Trip / recommendation
    const [currentTripId, setCurrentTripId] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [apiError, setApiError] = useState(null);

    // OTP
    const [otpOpen, setOtpOpen] = useState(false);

    // ── Derived ─────────────────────────────────────────────────────────────
    const gateTimeMinutes = BUFFER_PRESETS.find(b => b.id === bufferPreset)?.minutes ?? 30;

    const computeSecurityAccess = useCallback(() => {
        if (hasPriorityLane) return 'priority_lane';
        if (hasPrecheck && hasClear) return 'clear_precheck';
        if (hasPrecheck) return 'precheck';
        if (hasClear) return 'clear';
        return 'none';
    }, [hasPrecheck, hasClear, hasPriorityLane]);

    const buildPreferences = useCallback(() => ({
        transport_mode: transport,
        confidence_profile: 'sweet',
        bag_count: bagCount,
        traveling_with_children: withChildren,
        extra_time_minutes: 0,
        has_boarding_pass: hasBoardingPass,
        security_access: computeSecurityAccess(),
        gate_time_minutes: gateTimeMinutes,
    }), [transport, bagCount, withChildren, hasBoardingPass, computeSecurityAccess, gateTimeMinutes]);

    // ── Trip creation ───────────────────────────────────────────────────────
    const createTrip = useCallback(async (address) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setApiError(null);

        try {
            const tripRes = await fetch(`${API_BASE}/v1/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    input_mode: 'flight_number',
                    flight_number: selectedFlight.flight_number,
                    departure_date: departureDate,
                    home_address: address,
                    selected_departure_utc: selectedFlight.departure_time_utc,
                    preferences: buildPreferences(),
                }),
            });
            if (!tripRes.ok) {
                const errBody = await tripRes.text();
                throw new Error(`Trip creation failed (${tripRes.status}): ${errBody}`);
            }
            const trip = await tripRes.json();
            setCurrentTripId(trip.trip_id);

            const recRes = await fetch(`${API_BASE}/v1/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ trip_id: trip.trip_id }),
            });
            if (!recRes.ok) {
                const errBody = await recRes.text();
                throw new Error(`Recommendation failed (${recRes.status}): ${errBody}`);
            }
            const rec = await recRes.json();
            setRecommendation(rec);
            if (rec.remaining_pro_trips != null) updateTripCount(rec.remaining_pro_trips);

            // Save address on success
            try { localStorage.setItem(LS_ADDRESS_KEY, address); } catch {}
        } catch (err) {
            console.error('Trip creation failed:', err);
            setApiError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, authHeaders, selectedFlight, departureDate, buildPreferences, updateTripCount]);

    // ── Recompute ───────────────────────────────────────────────────────────
    const recompute = useCallback(async () => {
        if (!currentTripId || isRecomputing) return;
        setIsRecomputing(true);
        setApiError(null);

        try {
            const recRes = await fetch(`${API_BASE}/v1/recommendations/recompute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    trip_id: currentTripId,
                    reason: 'preference_change',
                    preference_overrides: buildPreferences(),
                }),
            });
            if (!recRes.ok) {
                const errBody = await recRes.text();
                throw new Error(`Recompute failed (${recRes.status}): ${errBody}`);
            }
            const rec = await recRes.json();
            setRecommendation(rec);
            if (rec.remaining_pro_trips != null) updateTripCount(rec.remaining_pro_trips);
        } catch (err) {
            console.error('Recompute failed:', err);
            setApiError(err.message || 'Could not update your recommendation. Please try again.');
        } finally {
            setIsRecomputing(false);
        }
    }, [currentTripId, isRecomputing, authHeaders, buildPreferences, updateTripCount]);

    // ── Auto-compute when address is selected ───────────────────────────────
    const handleAddressChange = useCallback((addr) => {
        setStartingAddress(addr);
        setAddressError(null);

        // If address cleared, reset trip
        if (!addr.trim()) {
            if (currentTripId) {
                setCurrentTripId(null);
                setRecommendation(null);
            }
            return;
        }

        // Auto-compute: create trip when address is selected
        // (addr is truthy only when a place is picked from autocomplete)
        // We need to defer to avoid stale closure on buildPreferences
        // Use a small timeout so React state settles
        setTimeout(() => {
            // Don't create if already submitting
            setIsSubmitting(prev => {
                if (prev) return prev;
                return prev; // just checking; actual creation below
            });
        }, 0);
    }, [currentTripId]);

    // Effect to trigger trip creation when address becomes valid and no trip exists
    const prevAddressRef = useRef(startingAddress);
    useEffect(() => {
        const addressChanged = prevAddressRef.current !== startingAddress;
        prevAddressRef.current = startingAddress;

        if (!addressChanged || !startingAddress.trim()) return;

        // If trip exists, reset and re-create
        if (currentTripId) {
            setCurrentTripId(null);
            setRecommendation(null);
        }

        // Auto-create trip
        createTrip(startingAddress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startingAddress]);

    // ── Auto-recompute on preference change (debounced) ─────────────────────
    const debounceRef = useRef(null);
    const prefsKey = `${transport}|${hasPrecheck}|${hasClear}|${hasPriorityLane}|${hasBoardingPass}|${bagCount}|${withChildren}|${bufferPreset}`;
    const initialPrefsRef = useRef(prefsKey);

    useEffect(() => {
        // Skip the initial render
        if (initialPrefsRef.current === prefsKey) return;
        if (!currentTripId) return;

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            recompute();
        }, 500);

        return () => clearTimeout(debounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefsKey, currentTripId]);

    // ── Render helpers ──────────────────────────────────────────────────────
    const flightIsDelayed = selectedFlight?.is_delayed && selectedFlight?.revised_departure_local;

    return (
        <div className="w-full max-w-2xl mx-auto">

            {/* ── 1. Flight Confirmation Strip ── */}
            <motion.div custom={0} variants={stagger} initial="hidden" animate="visible"
                className="flex items-center gap-3 mb-6">
                <button onClick={onBack}
                    className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-foreground">{selectedFlight.flight_number}</span>
                        {selectedFlight.airline_name && <span className="text-xs text-muted-foreground">{selectedFlight.airline_name}</span>}
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-sm font-semibold text-primary">
                            {shortCity(selectedFlight.origin_name) || selectedFlight.origin_code}{' '}
                            <span className="font-mono font-bold bg-accent text-primary px-1 py-0.5 rounded text-[10px]">{selectedFlight.origin_code}</span>
                            {' → '}
                            {shortCity(selectedFlight.destination_name) || selectedFlight.destination_code}{' '}
                            <span className="font-mono font-bold bg-accent text-primary px-1 py-0.5 rounded text-[10px]">{selectedFlight.destination_code}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium">{formatLocalTime(selectedFlight.departure_time)}</span>
                        <span>·</span>
                        <span>{selectedFlight.terminal}</span>
                        {selectedFlight.departure_gate && <><span>·</span><span>Gate {selectedFlight.departure_gate}</span></>}
                        {flightIsDelayed && (
                            <span className="text-amber-600 font-medium">
                                · Delayed — now {formatLocalTime(selectedFlight.revised_departure_local)}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── 2. Address Input ── */}
            <motion.div ref={addressContainerRef} custom={1} variants={stagger} initial="hidden" animate="visible" className="mb-6">
                <label className="text-sm font-semibold text-foreground/70 mb-2 block">Where are you leaving from?</label>
                <AddressAutocomplete
                    ref={addressInputRef}
                    value={startingAddress}
                    onChange={handleAddressChange}
                    hasError={!!addressError}
                />
                {addressError && <p className="text-sm text-destructive mt-1.5">{addressError}</p>}
            </motion.div>

            {/* ── 3. Recommendation Hero ── */}
            <motion.div custom={2} variants={stagger} initial="hidden" animate="visible" className="mb-6">
                <AnimatePresence mode="wait">
                    {/* Before calculation — prompt */}
                    {!recommendation && !isSubmitting && (
                        <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center">
                            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm font-medium">
                                {startingAddress.trim()
                                    ? 'Select your address above to get your leave-by time'
                                    : 'Enter your address above to get your leave-by time'}
                            </p>
                        </motion.div>
                    )}

                    {/* During calculation — inline loading */}
                    {isSubmitting && !recommendation && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                className="w-10 h-10 rounded-full border-[3px] border-border border-t-primary mx-auto mb-4"
                            />
                            <p className="text-foreground font-semibold mb-1">Calculating your journey...</p>
                            <p className="text-muted-foreground text-sm">Analyzing traffic, TSA wait times, and airport conditions</p>
                        </motion.div>
                    )}

                    {/* After calculation — JourneyVisualization */}
                    {recommendation && (
                        <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {/* Updating indicator */}
                            {isRecomputing && (
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                    <span className="text-xs font-medium text-primary">Updating...</span>
                                </div>
                            )}

                            {/* Error banner */}
                            {apiError && (
                                <div className="rounded-2xl px-5 py-4 mb-4 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-destructive text-sm font-medium">{apiError}</p>
                                        <button onClick={() => setApiError(null)}
                                            className="text-sm text-destructive font-semibold underline mt-1 hover:text-destructive/80">
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            )}

                            <JourneyVisualization
                                locked={true}
                                recommendation={recommendation}
                                selectedFlight={selectedFlight}
                                transport={transport}
                                onReady={() => {}}
                                onNotifyClick={() => setOtpOpen(true)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ── 4. Inline Preferences ── */}
            <motion.div custom={3} variants={stagger} initial="hidden" animate="visible"
                className="rounded-2xl border border-border bg-card overflow-hidden mb-6">

                {/* Transport pills */}
                <div className="px-5 py-4 border-b border-border">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Getting there</label>
                    <div className="flex gap-2 flex-wrap">
                        {TRANSPORT_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setTransport(opt.id)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                                    transport === opt.id
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                }`}>
                                <opt.icon className="w-3.5 h-3.5" />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Security toggles */}
                <div className="px-5 py-4 border-b border-border">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Security</label>
                    <div className="flex flex-wrap gap-3">
                        <SecurityPill label="PreCheck" active={hasPrecheck} onClick={() => setHasPrecheck(v => !v)} />
                        <SecurityPill label="CLEAR" active={hasClear} onClick={() => setHasClear(v => !v)} />
                        <SecurityPill label="Priority Lane" active={hasPriorityLane} onClick={() => setHasPriorityLane(v => !v)} />
                    </div>
                </div>

                {/* Buffer segmented control */}
                <div className="px-5 py-4 border-b border-border">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Buffer at gate</label>
                    <div className="grid grid-cols-3 gap-0 rounded-xl border border-border overflow-hidden">
                        {BUFFER_PRESETS.map(preset => (
                            <button key={preset.id} onClick={() => setBufferPreset(preset.id)}
                                className={`py-2.5 text-center text-sm font-medium transition-all ${
                                    bufferPreset === preset.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card text-foreground hover:bg-secondary'
                                }`}>
                                <span className="block">{preset.label}</span>
                                <span className={`text-[10px] ${bufferPreset === preset.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {preset.sub}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* More options collapsible */}
                <div className="px-5">
                    <button onClick={() => setMoreOptionsOpen(v => !v)}
                        className="w-full flex items-center justify-between py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        More options
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreOptionsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {moreOptionsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-4 pb-4">
                                    {/* Bags */}
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
                                                <p className="text-xs text-muted-foreground">Adjusts walking pace</p>
                                            </div>
                                        </div>
                                        <Switch checked={withChildren} onCheckedChange={setWithChildren} />
                                    </div>

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
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ── 5. Auth Prompt ── */}
            {recommendation && (
                <motion.div custom={4} variants={stagger} initial="hidden" animate="visible" className="mb-6">
                    {isAuthenticated ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                                Tracking this trip{display_name ? ` for ${display_name}` : ''}
                            </span>
                        </div>
                    ) : (
                        <SocialAuthCard
                            onSuccess={(data) => login(data)}
                            onPhoneClick={() => setOtpOpen(true)}
                            className="px-0"
                        />
                    )}
                </motion.div>
            )}

            {/* ── 6. Pro Badge ── */}
            {recommendation?.tier === 'pro' && recommendation.remaining_pro_trips != null && (
                <motion.div custom={5} variants={stagger} initial="hidden" animate="visible" className="mb-6">
                    <p className="text-xs text-muted-foreground text-center">
                        Pro · {recommendation.remaining_pro_trips} free trips remaining
                    </p>
                </motion.div>
            )}

            {/* ── Footer actions ── */}
            <motion.div custom={6} variants={stagger} initial="hidden" animate="visible" className="mb-8">
                <button onClick={onReset}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Start over
                </button>
            </motion.div>

            {/* ── OTP Modal ── */}
            <OTPModal open={otpOpen} onOpenChange={setOtpOpen} onSuccess={(data) => login(data)} />
        </div>
    );
}

// ── Security Pill Sub-component ─────────────────────────────────────────────
function SecurityPill({ label, active, onClick }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-muted-foreground/30'
            }`}>
            <ShieldCheck className="w-3 h-3" />
            {label}
        </button>
    );
}
