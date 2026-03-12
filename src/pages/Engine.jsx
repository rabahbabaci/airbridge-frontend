import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Plane, Car, Train, Bus, User, Shield, Zap, AlertCircle,
    CheckCircle2, Calendar, Search, ArrowLeft, MapPin,
    Sparkles, Clock, Luggage, Baby, Timer, ShieldCheck, BadgeCheck, Smartphone
} from 'lucide-react';
import JourneyVisualization from '@/components/engine/JourneyVisualization';

const API_BASE = 'https://airbridge-backend-production.up.railway.app';

// ── Data ────────────────────────────────────────────────────────────────────
const confidenceProfiles = [
    { id: 'safety', name: 'Stress-Free',  desc: 'Arrive extra early, lots of buffer at the gate', icon: Shield,      bufferMultiplier: 1.5, confidenceScore: 99, color: 'green' },
    { id: 'sweet',  name: 'Just Right',   desc: 'Balanced time to security',                      icon: Zap,         bufferMultiplier: 1.0, confidenceScore: 92, color: 'blue'  },
    { id: 'risk',   name: 'Cut It Close', desc: 'Minimal buffer, tighter ride',                   icon: AlertCircle, bufferMultiplier: 0.4, confidenceScore: 75, color: 'amber' },
];

const transportGroups = [
    {
        label: 'Rideshare',
        options: [{ id: 'rideshare', label: 'Rideshare', icon: Car }],
    },
    {
        label: 'Driving / Parking',
        sublabel: 'Includes parking time',
        options: [{ id: 'driving', label: 'Self-drive', icon: Car }],
    },
    {
        label: 'Public Transit',
        options: [{ id: 'train', label: 'Train', icon: Train }, { id: 'bus', label: 'Bus', icon: Bus }],
    },
    {
        label: 'Other / Custom',
        sublabel: 'AI estimates travel time',
        options: [{ id: 'other', label: 'Other', icon: User }],
    },
];

const confidenceColorMap = {
    green: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'from-emerald-500 to-emerald-400' },
    blue:  { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',    bar: 'from-indigo-500 to-indigo-400'   },
    amber: { badge: 'bg-amber-50 text-amber-700 border-amber-200',      bar: 'from-amber-500 to-amber-400'     },
};

function formatLocalTime(timeStr) {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return timeStr;
    const hours = parseInt(match[2]);
    const minutes = match[3];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${h12}:${minutes} ${ampm}`;
}

function shortCity(name) {
    if (!name) return '';
    return name.split(/[\s-]+/).slice(0, 2).join(' ');
}

function parseTimeToDate(localTimeStr) {
    if (!localTimeStr) return null;
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
}

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

    // Step 3
    const [selectedProfile, setSelectedProfile] = useState('sweet');
    const [transport, setTransport] = useState('rideshare');
    const [hasBaggage, setHasBaggage] = useState(false);
    const [baggageCount, setBaggageCount] = useState(1);
    const [withChildren, setWithChildren] = useState(false);
    const [extraTime, setExtraTime] = useState('none');
    const [hasTsaPreCheck, setHasTsaPreCheck] = useState(false);
    const [hasClear, setHasClear] = useState(false);
    const [hasBoardingPass, setHasBoardingPass] = useState(false);

    // Results
    const [locked, setLocked] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [journeyReady, setJourneyReady] = useState(false);
    const [viewMode, setViewMode] = useState('setup');

    const goTo = (next) => { setDir(next > step ? 1 : -1); setStep(next); };

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleFindFlight = async () => {
        if (!flightNumber.trim() || !departureDate) return;
        setSearching(true);
        setSelectedFlight(null);
        goTo(2);
        try {
            const addrParam = startingAddress.trim() ? `?home_address=${encodeURIComponent(startingAddress.trim())}` : '';
            const res = await fetch(`${API_BASE}/v1/flights/${encodeURIComponent(flightNumber.trim())}/${departureDate}${addrParam}`);
            if (!res.ok) { setFlightOptions([]); setSearching(false); return; }
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
        }
        setSearching(false);
    };

    const handleFlightClick = (f) => {
        if (f.departed || f.canceled || f.is_boarding) return;
        setSelectedFlight(f);
        if (locked) { setLocked(false); setRecommendation(null); setJourneyReady(false); }
    };

    const handleContinueToSetup = () => { if (selectedFlight) goTo(3); };

    const handleLockIn = async () => {
        setLocked(true);
        setJourneyReady(false);
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
                    preferences: {
                        transport_mode: (transport === 'uber' || transport === 'lyft') ? 'rideshare' : transport,
                        confidence_profile: selectedProfile,
                        bag_count: hasBaggage ? baggageCount : 0,
                        traveling_with_children: withChildren,
                        extra_time_minutes: extraTime === '+15' ? 15 : extraTime === '+30' ? 30 : 0,
                        tsa_precheck: hasTsaPreCheck,
                        clear_member: hasClear,
                        boarding_pass_ready: hasBoardingPass,
                    }
                })
            });
            const trip = await tripRes.json();
            const recRes = await fetch(`${API_BASE}/v1/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trip_id: trip.trip_id })
            });
            const rec = await recRes.json();
            setRecommendation(rec);
            setJourneyReady(true);
            setTimeout(() => setViewMode('results'), 500);
        } catch (err) {
            console.error('Recommendation failed:', err);
            setJourneyReady(true);
            setViewMode('setup');
        }
    };

    const handleReset = () => {
        setLocked(false); setJourneyReady(false); setRecommendation(null);
        setSelectedFlight(null); setFlightOptions([]); setDir(-1); setStep(1); setViewMode('setup');
    };

    const handleEditSetup = () => { setLocked(false); setJourneyReady(false); setViewMode('setup'); };

    const profile = confidenceProfiles.find(p => p.id === selectedProfile);
    const canSearch = flightNumber.trim().length > 0 && departureDate.length > 0;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased">

            {/* ── HEADER ── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Plane className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg text-gray-900">AirBridge</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-1 text-sm">
                            <Link to={createPageUrl('Home')} className="text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-colors">Home</Link>
                            <span className="text-gray-900 font-semibold px-3 py-1.5 bg-gray-100 rounded-lg">Departure Engine</span>
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-xs text-indigo-700 font-medium">Engine Active</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block">Sign In</button>
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
                                    {/* Hero section — anchors purpose immediately (cognitive fluency) */}
                                    <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="text-center mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
                                            <Sparkles className="w-7 h-7 text-primary-foreground" />
                                        </div>
                                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">Start Your Journey</h1>
                                        <p className="text-gray-500">Never miss a flight again</p>
                                    </motion.div>

                                    {/* Form fields — progressive disclosure, one field at a time */}
                                    <div className="space-y-4">
                                        <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Where are you starting from?</label>
                                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                <Input value={startingAddress} onChange={e => setStartingAddress(e.target.value)}
                                                    placeholder="Enter your departure address"
                                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-gray-900 placeholder:text-gray-400" />
                                            </div>
                                        </motion.div>

                                        <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Flight Number</label>
                                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                                <Plane className="w-4 h-4 text-gray-400 shrink-0" />
                                                <Input value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                                                    placeholder="e.g. UA 452"
                                                    onKeyDown={e => e.key === 'Enter' && canSearch && handleFindFlight()}
                                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-gray-900 placeholder:text-gray-400" />
                                            </div>
                                        </motion.div>

                                        <motion.div custom={3} variants={stagger} initial="hidden" animate="visible">
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">When are you traveling?</label>
                                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                                <PopoverTrigger asChild>
                                                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 cursor-pointer hover:border-gray-300 transition-all">
                                                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <span className={`flex-1 text-sm ${departureDate ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
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

                                    {/* CTA — commitment escalation: clear action after investment */}
                                    <motion.div custom={4} variants={stagger} initial="hidden" animate="visible" className="mt-8">
                                        <button onClick={handleFindFlight} disabled={!canSearch}
                                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                                                canSearch
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}>
                                            <Search className="w-4 h-4" />
                                            Select Flight
                                        </button>
                                        <p className="text-center text-xs text-gray-400 mt-4">Powered by real-time data and AI predictions</p>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* ── STEP 2: Select Your Flight ── */}
                            {step === 2 && (
                                <motion.div key="s2" {...pageTransition} className="w-full max-w-xl mx-auto">
                                    <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="flex items-center gap-3 mb-6">
                                        <button onClick={() => goTo(1)} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all">
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div>
                                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Select Your Flight</h1>
                                            <p className="text-sm text-gray-500">Choose from available flights</p>
                                        </div>
                                    </motion.div>

                                    {/* Search context badge */}
                                    <motion.div custom={1} variants={stagger} initial="hidden" animate="visible"
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 mb-5">
                                        <Plane className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                        <span className="text-sm font-semibold text-indigo-700">{flightNumber.toUpperCase()}</span>
                                        <span className="text-xs text-indigo-500 ml-1">
                                            {new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </motion.div>

                                    {/* Flight list */}
                                    {searching ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }}
                                                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.15 }}
                                                    className="h-24 rounded-2xl bg-white border border-gray-100" />
                                            ))}
                                            <p className="text-sm text-gray-400 text-center mt-2">Searching flights...</p>
                                        </div>
                                    ) : flightOptions.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No flights found</p>
                                            <p className="text-sm text-gray-400 mt-1">Check the flight number and date</p>
                                        </div>
                                    ) : (
                                        <motion.div initial="hidden" animate="visible" className="space-y-3">
                                            {flightOptions.map((f, i) => {
                                                const isDisabled = f.departed || f.canceled || f.is_boarding;
                                                const isSelected = selectedFlight?.departure_time_utc === f.departure_time_utc;
                                                return (
                                                    <motion.button key={i} custom={i + 2} variants={stagger}
                                                        onClick={() => handleFlightClick(f)} disabled={isDisabled}
                                                        className={`w-full text-left rounded-2xl border-2 bg-white px-5 py-4 transition-all duration-200 ${
                                                            isDisabled ? 'opacity-50 cursor-not-allowed border-gray-100' :
                                                            isSelected ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100' :
                                                            'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                                        }`}
                                                        style={{ borderLeftWidth: '4px', borderLeftColor: isDisabled ? '#e5e7eb' : isSelected ? '#6366f1' : '#6366f1' }}>
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-gray-900">{f.flight_number}</span>
                                                                    {f.airline_name && <span className="text-xs text-gray-500">{f.airline_name}</span>}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                                                    <span>Arrival: {formatLocalTime(f.arrival_time)}</span>
                                                                    <span>·</span>
                                                                    <span className="text-indigo-600 font-medium">
                                                                        {shortCity(f.origin_name) || f.origin_code}{' '}
                                                                        <span className="font-mono font-bold bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-[10px]">{f.origin_code}</span>
                                                                        {' → '}
                                                                        {shortCity(f.destination_name) || f.destination_code}{' '}
                                                                        <span className="font-mono font-bold bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-[10px]">{f.destination_code}</span>
                                                                        {' · '}{f.terminal}
                                                                        {f.departure_gate ? ` · Gate ${f.departure_gate}` : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-lg font-black text-gray-900">{formatLocalTime(f.departure_time)}</p>
                                                                <p className="text-[11px] text-gray-400 font-medium">Departure</p>
                                                            </div>
                                                        </div>

                                                        {/* Status badges */}
                                                        {f.departed && <span className="inline-block mt-2 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Departed</span>}
                                                        {f.is_boarding && <span className="inline-block mt-2 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Boarding Now</span>}
                                                        {f.canceled && <span className="inline-block mt-2 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Canceled</span>}
                                                        {f.is_delayed && f.revised_departure_local && (() => {
                                                            const scheduled = parseTimeToDate(f.departure_time);
                                                            const revised = parseTimeToDate(f.revised_departure_local);
                                                            if (scheduled && revised && revised > scheduled)
                                                                return <p className="text-xs text-amber-600 font-medium mt-2">⚠ Delayed — now {formatLocalTime(f.revised_departure_local)}</p>;
                                                            return null;
                                                        })()}
                                                        {f.time_warning && !isDisabled && <p className="text-xs text-amber-600 font-medium mt-2">⚠ {f.time_warning}</p>}

                                                        {isSelected && !isDisabled && (
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                                                <span className="text-xs font-semibold text-indigo-600">Selected</span>
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </motion.div>
                                    )}

                                    {/* Continue button — only active when flight selected (commitment) */}
                                    {flightOptions.length > 0 && !searching && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
                                            <button onClick={handleContinueToSetup} disabled={!selectedFlight}
                                                className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                                                    selectedFlight
                                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}>
                                                Continue to Setup
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── STEP 3: Departure Setup ── */}
                            {step === 3 && (
                                <motion.div key="s3" {...pageTransition} className="w-full max-w-3xl mx-auto">
                                    <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="flex items-center gap-3 mb-6">
                                        <button onClick={() => goTo(2)} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all">
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div>
                                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Departure Setup</h1>
                                            <p className="text-sm text-gray-500">Customize your travel preferences</p>
                                        </div>
                                    </motion.div>

                                    {/* Selected flight badge — endowment effect: seeing your choice reinforces commitment */}
                                    {selectedFlight && (
                                        <motion.div custom={1} variants={stagger} initial="hidden" animate="visible"
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-6">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 flex-wrap">
                                                {flightNumber.toUpperCase()} · {formatLocalTime(selectedFlight.departure_time)} ·{' '}
                                                {shortCity(selectedFlight.origin_name) || selectedFlight.origin_code}{' '}
                                                <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{selectedFlight.origin_code}</span>
                                                {' → '}
                                                {selectedFlight.destination_name || selectedFlight.destination_code}{' '}
                                                <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{selectedFlight.destination_code}</span>
                                            </span>
                                        </motion.div>
                                    )}

                                    {/* Two-column grid — reduces cognitive load by categorizing options */}
                                    <div className="grid md:grid-cols-2 gap-5 mb-6">
                                        {/* LEFT COLUMN: Transport Mode */}
                                        <motion.div custom={2} variants={stagger} initial="hidden" animate="visible"
                                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                            <div className="px-5 py-4 border-b border-gray-100">
                                                <h3 className="font-bold text-gray-900">Transportation Mode</h3>
                                            </div>
                                            <div className="px-5 py-4 space-y-4">
                                                {transportGroups.map(group => (
                                                    <div key={group.label}>
                                                        <p className="text-xs font-semibold text-gray-500 mb-2">{group.label}</p>
                                                        {group.sublabel && <p className="text-[10px] text-gray-400 -mt-1.5 mb-2">{group.sublabel}</p>}
                                                        <div className="flex gap-2">
                                                            {group.options.map(opt => {
                                                                const isActive = transport === opt.id || (opt.id === 'lyft' && transport === 'lyft');
                                                                const effectiveId = opt.id === 'lyft' ? 'lyft' : opt.id;
                                                                return (
                                                                    <button key={opt.id} onClick={() => setTransport(effectiveId)}
                                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                                                            isActive
                                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
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

                                        {/* RIGHT COLUMN: Advanced Options + Security */}
                                        <div className="space-y-5">
                                            <motion.div custom={3} variants={stagger} initial="hidden" animate="visible"
                                                className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                                <div className="px-5 py-4 border-b border-gray-100">
                                                    <h3 className="font-bold text-gray-900">Advanced Options</h3>
                                                </div>
                                                <div className="px-5 py-4 space-y-4">
                                                    {/* Checked Baggage */}
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <Luggage className="w-4 h-4 text-gray-400 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Checked Baggage</p>
                                                                <p className="text-xs text-gray-400">Adds check-in time</p>
                                                                <AnimatePresence>
                                                                    {hasBaggage && (
                                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                                            className="flex items-center gap-1.5 mt-2 overflow-hidden">
                                                                            {[1, 2, 3].map(n => (
                                                                                <button key={n} onClick={() => setBaggageCount(n)}
                                                                                    className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${
                                                                                        baggageCount === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-200'
                                                                                    }`}>{n}</button>
                                                                            ))}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                        <Switch checked={hasBaggage} onCheckedChange={setHasBaggage} />
                                                    </div>

                                                    {/* Traveling with Children */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Baby className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Traveling with Children</p>
                                                                <p className="text-xs text-gray-400">Extra buffer time</p>
                                                            </div>
                                                        </div>
                                                        <Switch checked={withChildren} onCheckedChange={setWithChildren} />
                                                    </div>

                                                    {/* Extra Airport Time */}
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Timer className="w-4 h-4 text-gray-400" />
                                                            <p className="text-sm font-medium text-gray-900">Extra Airport Time</p>
                                                        </div>
                                                        <div className="flex gap-2 ml-7">
                                                            {['none', '+15', '+30'].map(v => (
                                                                <button key={v} onClick={() => setExtraTime(v)}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                                        extraTime === v
                                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                                                    }`}>
                                                                    {v === 'none' ? 'None' : v + 'm'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Security & Check-in */}
                                            <motion.div custom={4} variants={stagger} initial="hidden" animate="visible"
                                                className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                                <div className="px-5 py-4 border-b border-gray-100">
                                                    <h3 className="font-bold text-gray-900">Security & Check-in</h3>
                                                </div>
                                                <div className="px-5 py-4 space-y-3">
                                                    <div className="flex items-center justify-between opacity-50">
                                                        <div className="flex items-center gap-3">
                                                            <ShieldCheck className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">TSA PreCheck</p>
                                                                <p className="text-xs text-gray-400">Coming soon</p>
                                                            </div>
                                                        </div>
                                                        <Switch checked={false} disabled />
                                                    </div>
                                                    <div className="flex items-center justify-between opacity-50">
                                                        <div className="flex items-center gap-3">
                                                            <Sparkles className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Clear</p>
                                                                <p className="text-xs text-gray-400">Coming soon</p>
                                                            </div>
                                                        </div>
                                                        <Switch checked={false} disabled />
                                                    </div>
                                                    <div className="flex items-center justify-between opacity-50">
                                                        <div className="flex items-center gap-3">
                                                            <Smartphone className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Boarding Pass Ready</p>
                                                                <p className="text-xs text-gray-400">Coming soon</p>
                                                            </div>
                                                        </div>
                                                        <Switch checked={false} disabled />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Confidence Profile — full-width, choice architecture (default = Just Right, anchoring) */}
                                    <motion.div custom={5} variants={stagger} initial="hidden" animate="visible"
                                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
                                        <div className="px-5 py-4 border-b border-gray-100">
                                            <h3 className="font-bold text-gray-900">How Much Time Do You Want?</h3>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {confidenceProfiles.map(p => {
                                                const isActive = selectedProfile === p.id;
                                                const colorClass = p.color === 'green' ? 'text-emerald-600 bg-emerald-50' :
                                                                   p.color === 'blue'  ? 'text-indigo-600 bg-indigo-50' :
                                                                                         'text-amber-600 bg-amber-50';
                                                return (
                                                    <button key={p.id} onClick={() => setSelectedProfile(p.id)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                                                            isActive
                                                                ? 'border-indigo-500 bg-indigo-50/50'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{p.name}</p>
                                                            <p className="text-sm text-gray-500">{p.desc}</p>
                                                        </div>
                                                        <span className={`text-sm font-bold px-3 py-1 rounded-full shrink-0 ml-4 ${colorClass}`}>
                                                            {p.confidenceScore}% Confidence
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>

                                    {/* CTA — dark button signals authority and finality (certainty effect) */}
                                    <motion.div custom={6} variants={stagger} initial="hidden" animate="visible">
                                        <button onClick={handleLockIn}
                                            className="w-full py-4 rounded-2xl text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white transition-all shadow-lg shadow-gray-300 hover:shadow-xl">
                                            Calculate My Departure
                                        </button>
                                        <button onClick={handleReset}
                                            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 transition-colors">
                                            ← Start over
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
                            className="w-14 h-14 rounded-full border-[3px] border-gray-200 border-t-indigo-600"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Calculating your journey</h2>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                Analyzing traffic, TSA wait times,<br />and airport conditions…
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {[0, 1, 2].map(i => (
                                <motion.div key={i}
                                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.25 }}
                                    className="w-2 h-2 rounded-full bg-indigo-400"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ════════════════ RESULTS VIEW ════════════════ */}
                {viewMode === 'results' && (
                    <motion.div key="results" {...pageTransition} className="min-h-[calc(100vh-57px)] bg-gray-50">
                        {/* Results Header */}
                        <div className="bg-white border-b border-gray-100">
                            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={handleEditSetup}
                                        className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all">
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <div>
                                        <h1 className="font-bold text-gray-900">Journey Blueprint</h1>
                                        <p className="text-sm text-gray-500">Your optimized travel timeline</p>
                                    </div>
                                </div>
                                <button onClick={handleReset}
                                    className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-xl transition-all hover:border-gray-300">
                                    Start Over
                                </button>
                            </div>
                        </div>

                        {/* Journey Visualization */}
                        <JourneyVisualization
                            locked={true}
                            recommendation={recommendation}
                            selectedFlight={selectedFlight}
                            transport={transport}
                            profile={profile}
                            confidenceColorMap={confidenceColorMap}
                            onReady={() => setJourneyReady(true)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
