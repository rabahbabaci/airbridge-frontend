import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { shortCity, formatLocalTime, parseTimeToDate } from '@/utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Plane, Car, Train, Bus, User, AlertCircle,
    CheckCircle2, Calendar, Search, ArrowLeft, MapPin,
    Sparkles, Clock, Luggage, Baby, ShieldCheck, Smartphone,
    Minus, Plus, RefreshCw
} from 'lucide-react';

import JourneyVisualization from '@/components/engine/JourneyVisualization';

const API_BASE = 'https://airbridge-backend-production.up.railway.app';

// ── Data ────────────────────────────────────────────────────────────────────
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

const transportGroups = [
    { label: 'Rideshare', options: [{ id: 'rideshare', label: 'Rideshare', icon: Car }] },
    { label: 'Driving / Parking', sublabel: 'Includes parking time', options: [{ id: 'driving', label: 'Self-drive', icon: Car }] },
    { label: 'Public Transit', options: [{ id: 'train', label: 'Train', icon: Train }, { id: 'bus', label: 'Bus', icon: Bus }] },
    { label: 'Other / Custom', sublabel: 'AI estimates travel time', options: [{ id: 'other', label: 'Other', icon: User }] },
];


// ── Animations ──────────────────────────────────────────────────────────────
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

// ── Main Component ──────────────────────────────────────────────────────────
export default function Engine() {
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);

    // Step 1
    const [departureDate, setDepartureDate] = useState('');
    const [flightNumber, setFlightNumber] = useState('');
    const [startingAddress, setStartingAddress] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Step 2
    const [searching, setSearching] = useState(false);
    const [flightOptions, setFlightOptions] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [searchError, setSearchError] = useState(null);

    // Step 3
    const [transport, setTransport] = useState('rideshare');
    const [hasPrecheck, setHasPrecheck] = useState(false);
    const [hasClear, setHasClear] = useState(false);
    const [hasPriorityLane, setHasPriorityLane] = useState(false);
    const [hasBoardingPass, setHasBoardingPass] = useState(true);
    const [bagCount, setBagCount] = useState(0);
    const [withChildren, setWithChildren] = useState(false);
    const [gateTime, setGateTime] = useState(15);
    

    // Results
    const [locked, setLocked] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [journeyReady, setJourneyReady] = useState(false);
    const [viewMode, setViewMode] = useState('setup');
    const [apiError, setApiError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTripId, setCurrentTripId] = useState(null);
    const [isRecomputing, setIsRecomputing] = useState(false);

    const goTo = (next) => { setDir(next > step ? 1 : -1); setStep(next); };

    const computeSecurityAccess = () => {
        if (hasPriorityLane) return 'priority_lane';
        if (hasPrecheck && hasClear) return 'clear_precheck';
        if (hasPrecheck) return 'precheck';
        if (hasClear) return 'clear';
        return 'none';
    };

    const buildPreferences = () => ({
        transport_mode: transport,
        confidence_profile: 'sweet',
        bag_count: bagCount,
        traveling_with_children: withChildren,
        extra_time_minutes: 0,
        has_boarding_pass: hasBoardingPass,
        security_access: computeSecurityAccess(),
        gate_time_minutes: gateTime,
    });

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleFindFlight = async () => {
        if (!flightNumber.trim() || !departureDate) return;
        setSearching(true);
        setSelectedFlight(null);
        setSearchError(null);
        goTo(2);
        try {
            const addrParam = startingAddress.trim() ? `?home_address=${encodeURIComponent(startingAddress.trim())}` : '';
            const res = await fetch(`${API_BASE}/v1/flights/${encodeURIComponent(flightNumber.trim())}/${departureDate}${addrParam}`);
            if (!res.ok) {
                setFlightOptions([]);
                setSearchError('Could not look up flights. Please check the flight number and try again.');
                setSearching(false);
                return;
            }
            const data = await res.json();
            const mapped = (data.flights || []).map(f => ({
                flight_number: f.flight_number,
                departure_time: f.departure_time_local,
                arrival_time: f.arrival_time_local,
                origin_code: f.origin_iata,
                origin_name: f.origin_name,
                destination_code: f.destination_iata,
                destination_name: f.destination_name,
                departure_terminal: f.departure_terminal,
                departure_gate: f.departure_gate,
                arrival_terminal: f.arrival_terminal,
                status: f.status,
                aircraft_model: f.aircraft_model,
                departure_time_utc: f.departure_time_utc,
                departed: f.departed ?? false,
                canceled: f.canceled ?? false,
                catchable: f.catchable ?? true,
                time_warning: f.time_warning ?? null,
                is_boarding: f.is_boarding ?? false,
                revised_departure_local: f.revised_departure_local,
                is_delayed: f.is_delayed ?? false,
                scheduled_departure_local: f.scheduled_departure_local,
                terminal: f.departure_terminal ? `Terminal ${f.departure_terminal}` : 'Terminal TBD',
                airline_name: f.airline_name || '',
            }));
            setFlightOptions(mapped);
        } catch (err) {
            console.error('Flight lookup failed:', err);
            setFlightOptions([]);
            setSearchError('Network error — could not reach the server. Please check your connection and try again.');
        }
        setSearching(false);
    };

    const handleFlightClick = (f) => {
        if (f.departed || f.canceled || f.is_boarding) return;
        setSelectedFlight(f);
        if (locked) { setLocked(false); setRecommendation(null); setJourneyReady(false); setCurrentTripId(null); }
    };

    const handleContinueToSetup = () => { if (selectedFlight) goTo(3); };

    const handleLockIn = async () => {
        if (isSubmitting) return;
        if (!startingAddress.trim()) {
            setApiError('Please enter your starting address so we can calculate travel time.');
            return;
        }
        setIsSubmitting(true);
        setLocked(true);
        setJourneyReady(false);
        setApiError(null);
        setViewMode('loading');

        try {
            const tripRes = await fetch(`${API_BASE}/v1/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input_mode: 'flight_number',
                    flight_number: selectedFlight.flight_number,
                    departure_date: departureDate,
                    home_address: startingAddress,
                    selected_departure_utc: selectedFlight.departure_time_utc,
                    preferences: buildPreferences(),
                })
            });
            if (!tripRes.ok) {
                const errBody = await tripRes.text();
                throw new Error(`Trip creation failed (${tripRes.status}): ${errBody}`);
            }
            const trip = await tripRes.json();
            setCurrentTripId(trip.trip_id);

            const recRes = await fetch(`${API_BASE}/v1/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trip_id: trip.trip_id })
            });
            if (!recRes.ok) {
                const errBody = await recRes.text();
                throw new Error(`Recommendation failed (${recRes.status}): ${errBody}`);
            }
            const rec = await recRes.json();
            setRecommendation(rec);
            setJourneyReady(true);
            setTimeout(() => setViewMode('results'), 500);
        } catch (err) {
            console.error('Recommendation failed:', err);
            setApiError(err.message || 'Something went wrong. Please try again.');
            setLocked(false);
            setJourneyReady(false);
            setViewMode('setup');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecompute = async () => {
        if (!currentTripId || isRecomputing) return false;
        setIsRecomputing(true);
        setApiError(null);

        try {
            const recRes = await fetch(`${API_BASE}/v1/recommendations/recompute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trip_id: currentTripId,
                    reason: 'preference_change',
                    preference_overrides: buildPreferences(),
                })
            });
            if (!recRes.ok) {
                const errBody = await recRes.text();
                throw new Error(`Recompute failed (${recRes.status}): ${errBody}`);
            }
            const rec = await recRes.json();
            setRecommendation(rec);
            return true;
        } catch (err) {
            console.error('Recompute failed:', err);
            setApiError(err.message || 'Could not update your recommendation. Please try again.');
            return false;
        } finally {
            setIsRecomputing(false);
        }
    };

    const handleReset = () => {
        setLocked(false); setJourneyReady(false); setRecommendation(null);
        setSelectedFlight(null); setFlightOptions([]); setDir(-1); setStep(1);
        setViewMode('setup'); setApiError(null); setCurrentTripId(null);
        setSearchError(null);
    };

    const handleEditSetup = () => {
        setLocked(false);
        setJourneyReady(false);
        setViewMode('setup');
        setApiError(null);
    };

    const handleRecalculate = async () => {
        if (currentTripId) {
            if (isRecomputing) return;
            setLocked(true);
            setJourneyReady(false);
            setViewMode('loading');
            setApiError(null);
            const success = await handleRecompute();
            if (success) {
                setJourneyReady(true);
                setViewMode('results');
            } else {
                setViewMode('results');
            }
        } else {
            await handleLockIn();
        }
    };

    const canSearch = flightNumber.trim().length > 0 && departureDate.length > 0;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-secondary/50 font-sans antialiased">

            {/* ── HEADER ── */}
            <header className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Plane className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg text-foreground">AirBridge</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-1 text-sm">
                            <Link to={createPageUrl('Home')} className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">Home</Link>
                            <span className="text-foreground font-semibold px-3 py-1.5 bg-secondary rounded-lg">Departure Engine</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <AnimatePresence mode="wait">
                            {locked && recommendation ? (
                                <motion.div key="live" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs text-emerald-700 font-medium">Live</span>
                                </motion.div>
                            ) : (
                                <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent border border-primary/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-xs text-primary font-medium">Engine Active</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block">Sign In</button>
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <AnimatePresence mode="wait">

                {/* ════════════════ SETUP VIEW ════════════════ */}
                {viewMode === 'setup' && (
                    <motion.div key="setup" {...pageTransition} className="min-h-[calc(100vh-57px)] flex items-start justify-center py-8 md:py-12 px-4">
                        <AnimatePresence mode="wait" custom={dir}>

                            {/* ── STEP 1: Start Your Journey ── */}
                            {step === 1 && (
                                <motion.div key="s1" {...pageTransition} className="w-full max-w-md mx-auto">
                                    <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="text-center mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
                                            <Sparkles className="w-7 h-7 text-primary-foreground" />
                                        </div>
                                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Start Your Journey</h1>
                                        <p className="text-muted-foreground">Never miss a flight again</p>
                                    </motion.div>

                                    <div className="space-y-4">
                                        <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
                                            <label className="text-sm font-semibold text-foreground/70 mb-2 block">Where are you starting from?</label>
                                            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <Input value={startingAddress} onChange={e => setStartingAddress(e.target.value)}
                                                    placeholder="Enter your departure address"
                                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-foreground placeholder:text-muted-foreground" />
                                            </div>
                                        </motion.div>

                                        <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
                                            <label className="text-sm font-semibold text-foreground/70 mb-2 block">Flight Number</label>
                                            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                                <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <Input value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                                                    placeholder="e.g. UA 452"
                                                    onKeyDown={e => e.key === 'Enter' && canSearch && handleFindFlight()}
                                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-foreground placeholder:text-muted-foreground" />
                                            </div>
                                        </motion.div>

                                        <motion.div custom={3} variants={stagger} initial="hidden" animate="visible">
                                            <label className="text-sm font-semibold text-foreground/70 mb-2 block">When are you traveling?</label>
                                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                                <PopoverTrigger asChild>
                                                    <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 cursor-pointer hover:border-muted-foreground/30 transition-all">
                                                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                                        <span className={`flex-1 text-sm ${departureDate ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                            {departureDate ? new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date'}
                                                        </span>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent mode="single"
                                                        selected={departureDate ? new Date(departureDate + 'T00:00:00') : undefined}
                                                        onSelect={(date) => { if (date) { setDepartureDate(date.toISOString().split('T')[0]); setCalendarOpen(false); } }}
                                                        disabled={(date) => { const today = new Date(); today.setHours(0, 0, 0, 0); return new Date(date).setHours(0, 0, 0, 0) < today; }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </motion.div>
                                    </div>

                                    <motion.div custom={4} variants={stagger} initial="hidden" animate="visible" className="mt-8">
                                        <button onClick={handleFindFlight} disabled={!canSearch}
                                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                                                canSearch
                                                    ? 'bg-primary hover:bg-brand-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/20'
                                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                                            }`}>
                                            <Search className="w-4 h-4" />
                                            Select Flight
                                        </button>
                                        <p className="text-center text-xs text-muted-foreground mt-4">Powered by real-time data and AI predictions</p>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* ── STEP 2: Select Your Flight ── */}
                            {step === 2 && (
                                <motion.div key="s2" {...pageTransition} className="w-full max-w-xl mx-auto">
                                    <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="flex items-center gap-3 mb-6">
                                        <button onClick={() => goTo(1)} className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all">
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div>
                                            <h1 className="text-2xl font-black text-foreground tracking-tight">Select Your Flight</h1>
                                            <p className="text-sm text-muted-foreground">Choose from available flights</p>
                                        </div>
                                    </motion.div>

                                    {/* Search context badge */}
                                    <motion.div custom={1} variants={stagger} initial="hidden" animate="visible"
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent border border-primary/10 mb-5">
                                        <Plane className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span className="text-sm font-semibold text-primary">{flightNumber.toUpperCase()}</span>
                                        <span className="text-xs text-primary/70 ml-1">
                                            {new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </motion.div>

                                    {/* Error state */}
                                    {searchError && !searching && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="rounded-2xl px-5 py-4 mb-5 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                                            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-destructive text-sm font-medium">{searchError}</p>
                                                <button onClick={handleFindFlight}
                                                    className="text-sm text-destructive font-semibold underline mt-1 hover:text-destructive/80">
                                                    Try again
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Flight list */}
                                    {searching ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }}
                                                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.15 }}
                                                    className="h-24 rounded-2xl bg-card border border-border" />
                                            ))}
                                            <p className="text-sm text-muted-foreground text-center mt-2">Searching flights...</p>
                                        </div>
                                    ) : !searchError && flightOptions.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-muted-foreground font-medium">No flights found</p>
                                            <p className="text-sm text-muted-foreground/70 mt-1">Check the flight number and date</p>
                                        </div>
                                    ) : (
                                        <motion.div initial="hidden" animate="visible" className="space-y-3">
                                            {flightOptions.map((f, i) => {
                                                const isDisabled = f.departed || f.canceled || f.is_boarding;
                                                const flightKey = `${f.flight_number}|${f.departure_time_utc || ''}|${f.origin_code || ''}`;
                                                const selectedKey = selectedFlight ? `${selectedFlight.flight_number}|${selectedFlight.departure_time_utc || ''}|${selectedFlight.origin_code || ''}` : null;
                                                const isSelected = selectedKey === flightKey;
                                                return (
                                                    <motion.button key={i} custom={i + 2} variants={stagger}
                                                        onClick={() => handleFlightClick(f)} disabled={isDisabled}
                                                        className={`w-full text-left rounded-2xl border-2 bg-card px-5 py-4 transition-all duration-200 ${
                                                            isDisabled ? 'opacity-50 cursor-not-allowed border-border' :
                                                            isSelected ? 'border-primary bg-accent/50 shadow-md shadow-primary/10' :
                                                            'border-border hover:border-muted-foreground/30 hover:shadow-sm'
                                                        }`}
                                                        style={{ borderLeftWidth: '4px', borderLeftColor: isDisabled ? 'hsl(var(--border))' : 'hsl(var(--primary))' }}>
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-foreground">{f.flight_number}</span>
                                                                    {f.airline_name && <span className="text-xs text-muted-foreground">{f.airline_name}</span>}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                                                                    <span>Arrival: {formatLocalTime(f.arrival_time)}</span>
                                                                    <span>·</span>
                                                                    <span className="text-primary font-medium">
                                                                        {shortCity(f.origin_name) || f.origin_code}{' '}
                                                                        <span className="font-mono font-bold bg-accent text-primary px-1 py-0.5 rounded text-[10px]">{f.origin_code}</span>
                                                                        {' → '}
                                                                        {shortCity(f.destination_name) || f.destination_code}{' '}
                                                                        <span className="font-mono font-bold bg-accent text-primary px-1 py-0.5 rounded text-[10px]">{f.destination_code}</span>
                                                                        {' · '}{f.terminal}
                                                                        {f.departure_gate ? ` · Gate ${f.departure_gate}` : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-lg font-black text-foreground">{formatLocalTime(f.departure_time)}</p>
                                                                <p className="text-[11px] text-muted-foreground font-medium">Departure</p>
                                                            </div>
                                                        </div>

                                                        {/* Status badges */}
                                                        {f.departed && <span className="inline-block mt-2 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20">Departed</span>}
                                                        {f.is_boarding && <span className="inline-block mt-2 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Boarding Now</span>}
                                                        {f.canceled && <span className="inline-block mt-2 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20">Canceled</span>}
                                                        {f.is_delayed && f.revised_departure_local && (() => {
                                                            const scheduled = parseTimeToDate(f.departure_time);
                                                            const revised = parseTimeToDate(f.revised_departure_local);
                                                            if (scheduled && revised && revised > scheduled)
                                                                return <p className="text-xs text-amber-600 font-medium mt-2">Delayed — now {formatLocalTime(f.revised_departure_local)}</p>;
                                                            return null;
                                                        })()}
                                                        {f.time_warning && !isDisabled && <p className="text-xs text-amber-600 font-medium mt-2">{f.time_warning}</p>}

                                                        {isSelected && !isDisabled && (
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                                                <span className="text-xs font-semibold text-primary">Selected</span>
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </motion.div>
                                    )}

                                    {/* Continue button */}
                                    {flightOptions.length > 0 && !searching && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
                                            <button onClick={handleContinueToSetup} disabled={!selectedFlight}
                                                className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                                                    selectedFlight
                                                        ? 'bg-primary hover:bg-brand-accent text-primary-foreground shadow-lg shadow-primary/20'
                                                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                                                }`}>
                                                Continue to Setup
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── STEP 3: Departure Setup ── */}
                            {step === 3 && (
                                <motion.div key="s3" {...pageTransition} className="w-full max-w-4xl mx-auto">
                                    <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="flex items-center gap-3 mb-6">
                                        <button onClick={() => goTo(2)} className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all">
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

                                    {/* Selected flight badge */}
                                    {selectedFlight && (
                                        <motion.div custom={1} variants={stagger} initial="hidden" animate="visible"
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

                                    {/* Row 1: Two cards side by side */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                        {/* Left: Transport Mode */}
                                        <motion.div custom={2} variants={stagger} initial="hidden" animate="visible"
                                            className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                                            <div className="px-5 py-4 border-b border-border">
                                                <h3 className="font-bold text-foreground">How are you getting there?</h3>
                                            </div>
                                            <div className="px-5 py-4 space-y-4 flex-1">
                                                {transportGroups.map(group => (
                                                    <div key={group.label}>
                                                        <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
                                                        {group.sublabel && <p className="text-[10px] text-muted-foreground/70 -mt-1.5 mb-2">{group.sublabel}</p>}
                                                        <div className="flex gap-2 flex-wrap">
                                                            {group.options.map(opt => {
                                                                const isActive = transport === opt.id;
                                                                return (
                                                                    <button key={opt.id} onClick={() => setTransport(opt.id)}
                                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
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
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* Right: Security & Check-in */}
                                        <motion.div custom={3} variants={stagger} initial="hidden" animate="visible"
                                            className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                                            <div className="px-5 py-4 border-b border-border">
                                                <h3 className="font-bold text-foreground">Security & Check-in</h3>
                                            </div>
                                            <div className="px-5 py-4 space-y-4 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">TSA PreCheck</p>
                                                            <p className="text-xs text-muted-foreground">Dedicated screening lane</p>
                                                        </div>
                                                    </div>
                                                    <Switch checked={hasPrecheck} onCheckedChange={setHasPrecheck} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">CLEAR</p>
                                                            <p className="text-xs text-muted-foreground">Skip the ID check line</p>
                                                        </div>
                                                    </div>
                                                    <Switch checked={hasClear} onCheckedChange={setHasClear} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">Priority Lane</p>
                                                            <p className="text-xs text-muted-foreground">Airline status or business class</p>
                                                        </div>
                                                    </div>
                                                    <Switch checked={hasPriorityLane} onCheckedChange={setHasPriorityLane} />
                                                </div>
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
                                    </div>

                                    {/* Row 2: Gate Time Slider (full width) */}
                                    <div className="mb-6">
                                        <motion.div custom={4} variants={stagger} initial="hidden" animate="visible"
                                            className="bg-card border border-border rounded-2xl overflow-hidden">
                                            <div className="px-5 py-4 border-b border-border">
                                                <h3 className="font-bold text-foreground">How early at your gate?</h3>
                                            </div>
                                            <div className="px-5 py-5">
                                                <div className="relative h-8">
                                                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-primary/20" />
                                                    <div
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-primary"
                                                        style={{ width: `${(gateTime / 180) * 100}%` }}
                                                    />

                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={180}
                                                        step={1}
                                                        value={gateTime}
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
                                                                className={`absolute w-0.5 h-2 rounded-full transition-colors ${
                                                                    snap === gateTime ? 'bg-primary' : 'bg-border'
                                                                }`}
                                                                style={{ left: `${(snap / 180) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-center">
                                                    <p className="text-lg font-bold text-foreground">{GATE_TIME_LABELS[gateTime]}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* CTA */}
                                    <motion.div custom={5} variants={stagger} initial="hidden" animate="visible">
                                        <button onClick={handleRecalculate} disabled={isSubmitting}
                                            className={`w-full py-4 rounded-2xl text-base font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                                                isSubmitting
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
                                        <button onClick={handleReset}
                                            className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors">
                                            Start over
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* ════════════════ LOADING VIEW ════════════════ */}
                {viewMode === 'loading' && (
                    <motion.div key="loading" {...pageTransition}
                        className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center text-center gap-6 px-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                            className="w-14 h-14 rounded-full border-[3px] border-border border-t-primary"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                {currentTripId ? 'Updating your journey' : 'Calculating your journey'}
                            </h2>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Analyzing traffic, TSA wait times,<br />and airport conditions…
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {[0, 1, 2].map(i => (
                                <motion.div key={i}
                                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.25 }}
                                    className="w-2 h-2 rounded-full bg-primary/60"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ════════════════ RESULTS VIEW ════════════════ */}
                {viewMode === 'results' && (
                    <motion.div key="results" {...pageTransition} className="min-h-[calc(100vh-57px)] bg-secondary/50">
                        {/* Results Header */}
                        <div className="bg-card border-b border-border">
                            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={handleEditSetup}
                                        className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all">
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <div>
                                        <h1 className="font-bold text-foreground">Journey Blueprint</h1>
                                        <p className="text-sm text-muted-foreground">Your optimized travel timeline</p>
                                    </div>
                                </div>
                                <button onClick={handleReset}
                                    className="text-sm text-muted-foreground hover:text-foreground border border-border px-4 py-2 rounded-xl transition-all hover:border-muted-foreground/30">
                                    Start Over
                                </button>
                            </div>
                        </div>

                        {/* Error banner for recompute failures */}
                        {apiError && (
                            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="rounded-2xl px-5 py-4 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-destructive text-sm font-medium">{apiError}</p>
                                        <button onClick={() => setApiError(null)}
                                            className="text-sm text-destructive font-semibold underline mt-1 hover:text-destructive/80">
                                            Dismiss
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Journey Visualization */}
                        <JourneyVisualization
                            locked={true}
                            recommendation={recommendation}
                            selectedFlight={selectedFlight}
                            transport={transport}
                            onReady={() => setJourneyReady(true)}
                            onNotifyClick={() => {}}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
