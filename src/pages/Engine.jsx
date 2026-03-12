import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Plane, Car, Train, Bus, User, Shield, Zap, AlertCircle,
    ChevronDown, CheckCircle2, Lock, Calendar, Search, ArrowLeft, MapPin
} from 'lucide-react';
import JourneyVisualization from '@/components/engine/JourneyVisualization';

const API_BASE = 'https://airbridge-backend-production.up.railway.app';

// const API_BASE = 'http://localhost:8000';

// ── Data ────────────────────────────────────────────────────────────────────
const transportOffsets = { uber: 0, driving: -5, train: 10, bus: 15, other: 5 };
const trainWalkMins = 12; // walk from home to train station
const busWalkMins = 8;   // walk from home to bus stop

const confidenceProfiles = [
    { id: 'safety', name: 'Stress-Free',   desc: 'Arrive early, relax at the gate', icon: Shield,      bufferMultiplier: 1.5, confidenceScore: 97, color: 'green' },
    { id: 'sweet',  name: 'Just Right',    desc: 'Balanced time vs certainty',       icon: Zap,         bufferMultiplier: 1.0, confidenceScore: 91, color: 'blue'  },
    { id: 'risk',   name: 'Cut It Close',  desc: 'Minimal buffer, higher risk',      icon: AlertCircle, bufferMultiplier: 0.4, confidenceScore: 79, color: 'amber' },
];

const transportModes = [
    { id: 'uber',    label: 'Uber/Lyft', icon: Car   },
    { id: 'driving', label: 'Driving',   icon: Car   },
    { id: 'train',   label: 'Train',     icon: Train },
    { id: 'bus',     label: 'Bus',       icon: Bus   },
    { id: 'other',   label: 'Other',     icon: User  },
];

const confidenceColorMap = {
    green: { badge: 'bg-green-500/20 text-green-400 border-green-500/30', bar: 'from-green-500 to-emerald-400' },
    blue:  { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    bar: 'from-blue-500 to-purple-500'   },
    amber: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', bar: 'from-amber-500 to-orange-400'  },
};

function formatLocalTime(timeStr) {
    if (!timeStr) return '';
    // Parse "2026-03-07 10:09-08:00" format
    const match = timeStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return timeStr;
    const hours = parseInt(match[2]);
    const minutes = match[3];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${h12}:${minutes} ${ampm}`;
}

function parseTimeToDate(localTimeStr) {
    if (!localTimeStr) return null;
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
}

function fmt(date, offsetMins) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + offsetMins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
    return (
        <button onClick={onToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${on ? 'bg-blue-500' : 'bg-white/15'}`}>
            <motion.span
                animate={{ x: on ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow"
                style={{ position: 'absolute' }}
            />
        </button>
    );
}

// ── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ step }) {
    return (
        <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3].map(n => (
                <div key={n} className="flex items-center gap-2">
                    <motion.div
                        animate={{
                            background: step >= n ? '#60a5fa' : 'rgba(255,255,255,0.2)',
                            scale: step === n ? 1 : 0.85,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-2 h-2 rounded-full"
                    />
                    {n < 3 && (
                        <motion.div
                            animate={{ background: step > n ? '#60a5fa' : 'rgba(255,255,255,0.15)' }}
                            transition={{ duration: 0.4 }}
                            className="w-8 h-px"
                        />
                    )}
                </div>
            ))}
            <span className="text-[10px] text-blue-300/60 font-medium ml-1">Step {step} of 3</span>
        </div>
    );
}

const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Engine() {
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);

    // Step 1
    const [departureDate, setDepartureDate] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [flightNumber, setFlightNumber] = useState('');
    const [startingAddress, setStartingAddress] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Step 2
    const [searching, setSearching] = useState(false);
    const [flightOptions, setFlightOptions] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);

    // Step 3
    const [selectedProfile, setSelectedProfile] = useState('sweet');
    const [transport, setTransport] = useState('uber');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [hasBaggage, setHasBaggage] = useState(false);
    const [baggageCount, setBaggageCount] = useState(1);
    const [withChildren, setWithChildren] = useState(false);
    const [extraTime, setExtraTime] = useState('none');
    const [locked, setLocked] = useState(false);
    const [showMobileResults, setShowMobileResults] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [settingsChanged, setSettingsChanged] = useState(false);

    // View mode: 'setup' | 'loading' | 'results'
    const [viewMode, setViewMode] = useState('setup');

    const goTo = (next) => {
        setDir(next > step ? 1 : -1);
        setStep(next);
    };

    const handleFindFlight = async () => {
        if (!flightNumber.trim() || !departureDate) return;
        setSearching(true);
        goTo(2);
        try {
            const addrParam = startingAddress.trim() ? `?home_address=${encodeURIComponent(startingAddress.trim())}` : '';
            const res = await fetch(`${API_BASE}/v1/flights/${encodeURIComponent(flightNumber.trim())}/${departureDate}${addrParam}`);
            if (!res.ok) {
                setFlightOptions([]);
                setSearching(false);
                return;
            }
            const data = await res.json();
            // Map backend response to the shape the UI expects
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
                // Format display strings
                duration: '', // We can calculate this later
                terminal: f.departure_terminal ? `Terminal ${f.departure_terminal}` : 'Terminal TBD',
            }));
            setFlightOptions(mapped);
        } catch (err) {
            console.error('Flight lookup failed:', err);
            setFlightOptions([]);
        }
        setSearching(false);
    };

    const handleSelectFlight = (flight) => {
        setSelectedFlight(flight);
        if (locked) {
            setLocked(false);
            setRecommendation(null);
            setJourneyReady(false);
        }
        goTo(3);
    };

    const [journeyReady, setJourneyReady] = useState(false);

    useEffect(() => {
        if (!locked) {
            setSettingsChanged(true);
        }
    }, [transport, selectedProfile, hasBaggage, baggageCount, withChildren, extraTime]);

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
                    transport_mode: transport === 'uber' ? 'rideshare' : transport,
                    confidence_profile: selectedProfile,
                    bag_count: hasBaggage ? baggageCount : 0,
                    traveling_with_children: withChildren,
                    extra_time_minutes: extraTime === '+15' ? 15 : extraTime === '+30' ? 30 : 0,
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
            setSettingsChanged(false);
            // Small delay for loading animation to feel smooth
            setTimeout(() => setViewMode('results'), 600);
        } catch (err) {
            console.error('Recommendation failed:', err);
            setJourneyReady(true);
            setViewMode('setup');
        }
    };


    const handleReset = () => {
        setLocked(false);
        setJourneyReady(false);
        setRecommendation(null);
        setSelectedFlight(null);
        setFlightOptions([]);
        setDir(-1);
        setStep(1);
        setShowMobileResults(false);
        setSettingsChanged(false);
        setViewMode('setup');
    };

    const handleEditSetup = () => {
        setLocked(false);
        setJourneyReady(false);
        setViewMode('setup');
    };

    const profile = confidenceProfiles.find(p => p.id === selectedProfile);

    const getTodayStr = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const canSearch = flightNumber.trim().length > 0 && departureDate.length > 0;

    // Shared input field style
    const inputBoxStyle = { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' };
    const inputBoxActiveStyle = { border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)' };

    // Individual field animation with stagger
    const fieldVariants = {
        hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
        visible: (i) => ({
            opacity: 1, y: 0, filter: 'blur(0px)',
            transition: { delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }
        }),
        exit: (i) => ({
            opacity: 0, y: -15, filter: 'blur(4px)',
            transition: { delay: i * 0.04, duration: 0.25, ease: [0.4, 0, 1, 1] }
        }),
    };

    return (
        <div className="w-screen flex flex-col overflow-hidden font-sans antialiased relative" style={{ height: '100dvh' }}>
            {/* Full-page cinematic airport background */}
            <div className="absolute inset-0 z-0" style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
            }} />
            <div className="absolute inset-0 z-0" style={{
                background: 'linear-gradient(170deg, rgba(2,6,23,0.88) 0%, rgba(15,23,42,0.82) 35%, rgba(2,6,23,0.92) 100%)',
            }} />

            {/* ── Topbar ── */}
            <header className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-3 shrink-0 z-10 relative"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-6">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Plane className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-white text-sm md:text-sm">AirBridge</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-5">
                        <Link to={createPageUrl('Home')} className="text-sm text-gray-500 hover:text-white transition-colors">Home</Link>
                        <span className="text-sm text-white font-medium" style={{ borderBottom: '1px solid #3b82f6', paddingBottom: '2px' }}>Departure Engine</span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {locked ? (
                            <motion.div key="live" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full"
                                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[11px] md:text-xs text-green-400 font-medium">Live · Reactive</span>
                            </motion.div>
                        ) : (
                            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full"
                                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-[11px] md:text-xs text-blue-400 font-medium">Engine Active</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button className="text-xs md:text-sm text-gray-500 hover:text-white transition-colors">Sign In</button>
                    <button className="text-xs md:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full font-medium">
                        Get Started
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <div className="flex flex-1 min-h-0 items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">

                    {/* ── SETUP VIEW ── */}
                    {viewMode === 'setup' && (
                        <motion.div
                            key="setup-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full max-w-[480px] mx-auto flex flex-col overflow-hidden px-4"
                            style={{ maxHeight: 'calc(100dvh - 80px)' }}
                        >
                            <div className="flex flex-col flex-1 overflow-hidden">
                                {/* Header — always visible, animates subtitle */}
                                <div className="pt-4 pb-3 shrink-0">
                                    <motion.h1
                                        layout
                                        className="text-xl font-bold text-white"
                                    >
                                        Departure Setup
                                    </motion.h1>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={`subtitle-${step}`}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-xs text-gray-500 mt-1"
                                        >
                                            {step === 1 && 'Enter your flight details'}
                                            {step === 2 && 'Select your departure'}
                                            {step === 3 && 'Customize your journey'}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>

                                {/* Step dots */}
                                <div className="shrink-0 pb-2">
                                    <StepDots step={step} />
                                </div>

                                {/* Animated step content — no card, fields animate individually */}
                                <div className="flex-1 min-h-0 overflow-y-auto relative">
                                    <AnimatePresence mode="wait" custom={dir}>

                                        {/* ── STEP 1 ── */}
                                        {step === 1 && (
                                            <motion.div key="step1"
                                                initial="hidden" animate="visible" exit="exit"
                                                className="pt-2 pb-4 flex flex-col gap-5">

                                                <motion.div custom={0} variants={fieldVariants}>
                                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-2">Flight Number</label>
                                                    <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 transition-all duration-200"
                                                        style={inputBoxStyle}>
                                                        <Plane className="w-4 h-4 text-gray-500 shrink-0" />
                                                        <Input value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                                                            placeholder="e.g. UA 452"
                                                            onKeyDown={e => e.key === 'Enter' && canSearch && handleFindFlight()}
                                                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-white font-medium placeholder:text-gray-600" />
                                                    </div>
                                                </motion.div>

                                                <motion.div custom={1} variants={fieldVariants}>
                                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-2">Starting Address</label>
                                                    <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 transition-all duration-200"
                                                        style={inputBoxStyle}>
                                                        <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                                                        <Input value={startingAddress} onChange={e => setStartingAddress(e.target.value)}
                                                            placeholder="e.g. 123 Main St, San Francisco"
                                                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-white font-medium placeholder:text-gray-600" />
                                                    </div>
                                                </motion.div>

                                                <motion.div custom={2} variants={fieldVariants}>
                                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-2">Departure Date</label>
                                                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                                        <PopoverTrigger asChild>
                                                            <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 cursor-pointer hover:opacity-80 transition-all duration-200"
                                                                style={inputBoxStyle}>
                                                                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                                                <span className="flex-1 text-sm font-medium" style={{ color: departureDate ? '#fff' : '#4b5563' }}>
                                                                    {departureDate ? new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                                                                </span>
                                                            </div>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <CalendarComponent
                                                                mode="single"
                                                                selected={departureDate ? new Date(departureDate + 'T00:00:00') : undefined}
                                                                onSelect={(date) => {
                                                                    if (date) {
                                                                        setDepartureDate(date.toISOString().split('T')[0]);
                                                                        setCalendarOpen(false);
                                                                    }
                                                                }}
                                                                disabled={(date) => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const compareDate = new Date(date);
                                                                    compareDate.setHours(0, 0, 0, 0);
                                                                    return compareDate < today;
                                                                }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </motion.div>
                                            </motion.div>
                                        )}

                                        {/* ── STEP 2 ── */}
                                        {step === 2 && (
                                            <motion.div key="step2"
                                                initial="hidden" animate="visible" exit="exit"
                                                className="pt-2 pb-4 flex flex-col gap-4">

                                                <motion.div custom={0} variants={fieldVariants}
                                                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                    <Plane className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                    <span className="text-xs font-bold text-blue-300">
                                                        {flightNumber.toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-blue-500 ml-1">
                                                        {new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <button onClick={() => goTo(1)}
                                                        className="ml-auto text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 font-medium">
                                                        <ArrowLeft className="w-3 h-3" /> Edit
                                                    </button>
                                                </motion.div>

                                                <motion.div custom={1} variants={fieldVariants}>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Select your departure</p>

                                                    {searching ? (
                                                        <div className="flex flex-col gap-2">
                                                            {[1, 2].map(i => (
                                                                <motion.div key={i}
                                                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                                                                    className="h-20 rounded-xl"
                                                                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                                                            ))}
                                                            <p className="text-[11px] text-gray-500 text-center mt-1">Searching flights...</p>
                                                        </div>
                                                    ) : flightOptions.length === 0 ? (
                                                        <div className="text-center py-8">
                                                            <p className="text-sm text-gray-500">No flights found.</p>
                                                            <button onClick={() => goTo(1)} className="text-xs text-blue-400 mt-2 font-medium">← Go back</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                        {flightOptions.map((f, i) => {
                                                            const isDisabled = f.departed || f.canceled || f.is_boarding;
                                                            return (
                                                                <motion.button key={i}
                                                                    custom={i + 2}
                                                                    variants={fieldVariants}
                                                                    onClick={() => !isDisabled && handleSelectFlight(f)}
                                                                    disabled={isDisabled}
                                                                    className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-200"
                                                                    style={{
                                                                        border: (f.departed || f.is_boarding) ? '1px solid rgba(252,165,165,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                                                        background: (f.departed || f.is_boarding) ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                                                                        opacity: (f.departed || f.canceled || f.is_boarding) ? 0.5 : 1,
                                                                        cursor: (f.departed || f.canceled || f.is_boarding) ? 'not-allowed' : 'pointer',
                                                                    }}
                                                                    whileHover={!isDisabled ? { borderColor: 'rgba(147,197,253,0.4)', background: 'rgba(59,130,246,0.08)', transition: { duration: 0.15 } } : {}}>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`text-xl font-black ${(f.departed || f.canceled || f.is_boarding) ? 'text-gray-600 line-through' : 'text-white'}`}>
                                                                                {formatLocalTime(f.departure_time)}
                                                                            </span>
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
                                                                                <Plane className="w-3 h-3 text-gray-500" />
                                                                                <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-gray-400">{formatLocalTime(f.arrival_time)}</span>
                                                                        </div>
                                                                        {f.departed && (
                                                                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                                                                Departed
                                                                            </span>
                                                                        )}
                                                                        {f.is_boarding && (
                                                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                                                Boarding Now
                                                                            </span>
                                                                        )}
                                                                        {f.canceled && (
                                                                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                                                                Canceled
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[11px] font-semibold text-gray-400">{f.flight_number}</span>
                                                                        <span className="text-[10px] text-gray-600 ml-1">·</span>
                                                                        <span className="text-[11px] font-semibold text-gray-400 ml-1">{f.origin_code}</span>
                                                                        <span className="text-[10px] text-gray-600">→</span>
                                                                        <span className="text-[11px] font-semibold text-gray-400">{f.destination_code}</span>
                                                                        <span className="text-[10px] text-gray-600 ml-2">· {f.terminal}</span>
                                                                    </div>
                                                                    {f.is_delayed && f.revised_departure_local && f.departure_time && (() => {
                                                                        const scheduled = parseTimeToDate(f.departure_time);
                                                                        const revised = parseTimeToDate(f.revised_departure_local);
                                                                        if (scheduled && revised && revised > scheduled) {
                                                                            return <p className="text-[10px] text-orange-400 font-medium mt-1">⚠️ Delayed — now expected {formatLocalTime(f.revised_departure_local)}</p>;
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                    {f.time_warning && !isDisabled && (
                                                                        <p className="text-[10px] text-amber-400 font-medium mt-1.5">⚠️ {f.time_warning}</p>
                                                                    )}
                                                                </motion.button>
                                                            );
                                                        })}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </motion.div>
                                        )}

                                        {/* ── STEP 3 ── */}
                                        {step === 3 && (
                                            <motion.div key="step3"
                                                initial="hidden" animate="visible" exit="exit"
                                                className="pt-2 pb-10 flex flex-col gap-5">

                                                {selectedFlight && (
                                                    <motion.div custom={0} variants={fieldVariants}
                                                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                                                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-green-300">
                                                                {flightNumber.toUpperCase()} · {formatLocalTime(selectedFlight.departure_time)}
                                                            </p>
                                                            <p className="text-[10px] text-green-500">{selectedFlight.origin_code} → {selectedFlight.destination_code}</p>
                                                        </div>
                                                        <button onClick={() => goTo(2)}
                                                            className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-0.5 font-medium shrink-0">
                                                            <ArrowLeft className="w-3 h-3" /> Change
                                                        </button>
                                                    </motion.div>
                                                )}

                                                {/* Transport Mode */}
                                                <motion.div custom={1} variants={fieldVariants}>
                                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-2">Transportation Mode</label>
                                                    <div className="flex gap-1.5">
                                                        {transportModes.map(m => (
                                                            <button key={m.id} onClick={() => setTransport(m.id)}
                                                                className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200"
                                                                style={{
                                                                    border: transport === m.id ? '1.5px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                                                    background: transport === m.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                                                                    color: transport === m.id ? '#93c5fd' : '#6b7280',
                                                                }}>
                                                                <m.icon className="w-4 h-4" />
                                                                {m.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>

                                                {/* Confidence Profile */}
                                                <motion.div custom={2} variants={fieldVariants}>
                                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-2">How Much Time Do You Want?</label>
                                                    <div className="flex gap-2">
                                                        {confidenceProfiles.map(p => (
                                                            <button key={p.id} onClick={() => setSelectedProfile(p.id)}
                                                                className="flex-1 flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all duration-200"
                                                                style={{
                                                                    border: selectedProfile === p.id ? '1.5px solid rgba(147,197,253,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                                                    background: selectedProfile === p.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                                                                }}>
                                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                                    style={{ background: selectedProfile === p.id ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.08)' }}>
                                                                    <p.icon className="w-3.5 h-3.5" style={{ color: selectedProfile === p.id ? '#fff' : '#6b7280' }} />
                                                                </div>
                                                                <p className="text-[11px] font-semibold leading-tight" style={{ color: selectedProfile === p.id ? '#93c5fd' : '#d1d5db' }}>{p.name}</p>
                                                                <p className="text-[9px] leading-tight" style={{ color: '#6b7280' }}>{p.desc}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>

                                                {/* Advanced Options */}
                                                <motion.div custom={3} variants={fieldVariants}
                                                    className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <div className="px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                        Advanced Options
                                                    </div>
                                                    <div className="px-4 pb-4 space-y-4 pt-3">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs text-gray-300 font-medium">Checked baggage</p>
                                                                <AnimatePresence>
                                                                    {hasBaggage && (
                                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                                            className="flex items-center gap-1.5 mt-1 overflow-hidden">
                                                                            <span className="text-[10px] text-gray-500">Bags:</span>
                                                                            {[1, 2, 3].map(n => (
                                                                                <button key={n} onClick={() => setBaggageCount(n)}
                                                                                    className="w-6 h-6 rounded text-[10px] font-semibold border transition-all"
                                                                                    style={{ background: baggageCount === n ? '#2563eb' : 'rgba(255,255,255,0.05)', color: baggageCount === n ? '#fff' : '#9ca3af', borderColor: baggageCount === n ? '#2563eb' : 'rgba(255,255,255,0.1)' }}>
                                                                                    {n}
                                                                                </button>
                                                                            ))}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                            <Toggle on={hasBaggage} onToggle={() => setHasBaggage(b => !b)} />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-gray-300 font-medium">Traveling with children</p>
                                                            <Toggle on={withChildren} onToggle={() => setWithChildren(prev => !prev)} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-300 font-medium mb-2">Extra airport time</p>
                                                            <div className="flex gap-2">
                                                                {['none', '+15', '+30'].map(v => (
                                                                    <button key={v} onClick={() => setExtraTime(v)}
                                                                        className="flex-1 text-[10px] py-1.5 rounded-lg font-semibold border transition-all"
                                                                        style={{ background: extraTime === v ? '#2563eb' : 'rgba(255,255,255,0.05)', color: extraTime === v ? '#fff' : '#9ca3af', borderColor: extraTime === v ? '#2563eb' : 'rgba(255,255,255,0.1)' }}>
                                                                        {v === 'none' ? 'None' : v + ' min'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* CTA — pinned */}
                                <div className="py-4 pb-6 md:pb-4 shrink-0">
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.button key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.25 }}
                                                onClick={handleFindFlight}
                                                disabled={!canSearch}
                                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all"
                                                style={{
                                                    background: canSearch ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)',
                                                    boxShadow: canSearch ? '0 4px 24px rgba(37,99,235,0.3)' : 'none',
                                                    color: canSearch ? '#fff' : '#4b5563',
                                                    cursor: canSearch ? 'pointer' : 'not-allowed',
                                                }}>
                                                <Search className="w-4 h-4" />
                                                {canSearch ? 'Find My Flight' : 'Enter flight details'}
                                            </motion.button>
                                        )}

                                        {step === 2 && !searching && flightOptions.length === 0 && (
                                            <motion.button key="back2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                onClick={() => goTo(1)}
                                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all"
                                                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                                                <ArrowLeft className="w-4 h-4" /> Go back
                                            </motion.button>
                                        )}

                                        {step === 3 && (
                                            <motion.button key="lock" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.25 }}
                                                onClick={handleLockIn}
                                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
                                                style={{
                                                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                                    boxShadow: '0 4px 24px rgba(37,99,235,0.3)',
                                                }}>
                                                <Lock className="w-4 h-4" />
                                                Lock In My Departure Time
                                            </motion.button>
                                        )}
                                    </AnimatePresence>

                                    {step === 3 && (
                                        <button onClick={handleReset}
                                            className="w-full text-center text-[11px] text-gray-600 hover:text-gray-400 mt-2 transition-colors">
                                            ← Start over
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── LOADING VIEW ── */}
                    {viewMode === 'loading' && (
                        <motion.div
                            key="loading-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="flex flex-col items-center justify-center text-center gap-6"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                className="w-16 h-16 rounded-full"
                                style={{
                                    border: '3px solid rgba(99,102,241,0.15)',
                                    borderTop: '3px solid #6366f1',
                                }}
                            />
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Calculating your journey</h2>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Analyzing traffic, TSA wait times,<br />and airport conditions…
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.25 }}
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: 'rgba(99,102,241,0.7)' }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── RESULTS VIEW ── */}
                    {viewMode === 'results' && (
                        <motion.div
                            key="results-view"
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 0.97 }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full h-full flex flex-col relative"
                        >
                            {/* Edit button */}
                            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
                                <motion.button
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                    onClick={handleEditSetup}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        color: '#e0e7ff',
                                        backdropFilter: 'blur(12px)',
                                    }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Edit Departure
                                </motion.button>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <JourneyVisualization
                                    locked={true}
                                    recommendation={recommendation}
                                    selectedFlight={selectedFlight}
                                    transport={transport}
                                    profile={profile}
                                    confidenceColorMap={confidenceColorMap}
                                    onReady={() => setJourneyReady(true)}
                                />
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}