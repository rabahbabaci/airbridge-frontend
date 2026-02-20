import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import {
    Plane, Car, Train, Bus, User, Shield, Zap, AlertCircle,
    ChevronDown, CheckCircle2, Lock, Calendar, Search, ArrowLeft, Clock
} from 'lucide-react';
import JourneyVisualization from '@/components/engine/JourneyVisualization';
import { base44 } from '@/api/base44Client';

// ── Data ────────────────────────────────────────────────────────────────────
const transportOffsets = { uber: 0, driving: -5, train: 10, bus: 15, other: 5 };

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

const airportData = {
    SFO: { name: 'San Francisco Intl',      traffic: 63, tsa: 41, walking: 17, baseBuffer: 16 },
    LAX: { name: 'Los Angeles Intl',        traffic: 58, tsa: 48, walking: 22, baseBuffer: 16 },
    JFK: { name: 'John F. Kennedy Intl',    traffic: 72, tsa: 52, walking: 19, baseBuffer: 16 },
    ORD: { name: "O'Hare Intl",             traffic: 54, tsa: 38, walking: 15, baseBuffer: 16 },
    ATL: { name: 'Hartsfield-Jackson Intl', traffic: 48, tsa: 45, walking: 18, baseBuffer: 16 },
    DFW: { name: 'Dallas/Fort Worth Intl',  traffic: 51, tsa: 35, walking: 20, baseBuffer: 16 },
};

const confidenceColorMap = {
    green: { badge: 'bg-green-500/20 text-green-400 border-green-500/30', bar: 'from-green-500 to-emerald-400' },
    blue:  { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    bar: 'from-blue-500 to-purple-500'   },
    amber: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', bar: 'from-amber-500 to-orange-400'  },
};

function fmt(date, offsetMins) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + offsetMins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
    return (
        <button onClick={onToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${on ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow ${on ? 'translate-x-4' : 'translate-x-0.5'}`}
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
                            background: step >= n ? '#3b82f6' : '#e5e7eb',
                            scale: step === n ? 1 : 0.85,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-2 h-2 rounded-full"
                    />
                    {n < 3 && (
                        <motion.div
                            animate={{ background: step > n ? '#3b82f6' : '#e5e7eb' }}
                            transition={{ duration: 0.4 }}
                            className="w-8 h-px"
                        />
                    )}
                </div>
            ))}
            <span className="text-[10px] text-gray-400 font-medium ml-1">Step {step} of 3</span>
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
    // Step flow
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);

    // Step 1
    const [flightNumber, setFlightNumber] = useState('');
    const [flightDate, setFlightDate] = useState('');

    // Step 2 — search results
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

    const goTo = (next) => {
        setDir(next > step ? 1 : -1);
        setStep(next);
    };

    const handleFindFlight = async () => {
        if (!flightNumber.trim() || !flightDate) return;
        setSearching(true);
        goTo(2);
        const dateStr = new Date(flightDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a flight data API. For flight number "${flightNumber.trim()}" on ${dateStr}, return realistic scheduled departure trips for that day. A single flight number typically operates 1-3 trips per day. Each trip goes from one fixed origin to one fixed destination (same route always). Return between 1 and 3 trip objects with realistic times and airport codes.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    flights: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                departure_time: { type: 'string', description: 'e.g. 7:30 AM' },
                                arrival_time: { type: 'string', description: 'e.g. 10:45 AM' },
                                origin_code: { type: 'string', description: 'IATA airport code e.g. JFK' },
                                origin_name: { type: 'string', description: 'e.g. New York JFK' },
                                destination_code: { type: 'string', description: 'IATA airport code e.g. LAX' },
                                destination_name: { type: 'string', description: 'e.g. Los Angeles LAX' },
                                duration: { type: 'string', description: 'e.g. 5h 30m' },
                                terminal: { type: 'string', description: 'e.g. Terminal 2' },
                            }
                        }
                    }
                }
            }
        });
        setFlightOptions(result.flights || []);
        setSearching(false);
    };

    const handleSelectFlight = (flight) => {
        setSelectedFlight(flight);
        goTo(3);
    };

    const handleReset = () => {
        setLocked(false);
        setSelectedFlight(null);
        setFlightOptions([]);
        goTo(1);
    };

    // Compute journey from selected flight's airport or fallback
    const airportCode = selectedFlight?.origin_code && airportData[selectedFlight.origin_code]
        ? selectedFlight.origin_code : 'SFO';
    const profile = confidenceProfiles.find(p => p.id === selectedProfile);
    const base = airportData[airportCode];
    const trafficTime = base.traffic + (transportOffsets[transport] ?? 0);
    const baggageTime = hasBaggage ? baggageCount * 7 : 0;
    const buffer = Math.round(base.baseBuffer * profile.bufferMultiplier)
        + (withChildren ? 10 : 0)
        + (extraTime === '+15' ? 15 : extraTime === '+30' ? 30 : 0);
    const total = trafficTime + baggageTime + base.tsa + base.walking + buffer;

    const gate = useMemo(() => {
        if (selectedFlight?.departure_time) {
            const [time, ampm] = selectedFlight.departure_time.split(' ');
            const [h, m] = time.split(':').map(Number);
            const d = new Date();
            d.setHours(ampm === 'PM' && h !== 12 ? h + 12 : ampm === 'AM' && h === 12 ? 0 : h, m, 0, 0);
            return d;
        }
        const d = new Date(); d.setHours(10, 0, 0, 0); return d;
    }, [selectedFlight]);

    const leaveTime = fmt(gate, -total);
    const arriveAirport = fmt(gate, -(baggageTime + base.tsa + base.walking + buffer));
    const dropBaggage = fmt(gate, -(base.tsa + base.walking + buffer));
    const tsaClear = fmt(gate, -(base.walking + buffer));
    const arriveGate = fmt(gate, -buffer);
    const boarding = fmt(gate, 0);

    const journeySteps = [
        { id: 'home', label: 'Leave Home', color: '#3b82f6', time: leaveTime, dur: `${trafficTime} min`, flightLabel: `${flightNumber || 'Your flight'} · ${airportCode}`, total },
        { id: 'travel', label: 'En Route', color: '#8b5cf6', time: arriveAirport, dur: `${trafficTime} min` },
        { id: 'airport', label: 'Arrive Airport', color: '#6366f1', time: arriveAirport, dur: `at terminal` },
        ...(hasBaggage ? [{ id: 'baggage', label: 'Baggage Drop', color: '#f97316', time: dropBaggage, dur: `${baggageTime} min`, visible: true }] : [{ id: 'baggage', label: 'Baggage Drop', color: '#f97316', visible: false }]),
        { id: 'security', label: 'TSA Security', color: '#06b6d4', time: tsaClear, dur: `${base.tsa} min` },
        { id: 'walk', label: 'Gate Walk', color: '#14b8a6', time: arriveGate, dur: `${base.walking} min` },
        { id: 'gate', label: 'Boarding', color: '#22c55e', time: boarding, dur: `on time` },
    ];

    const canSearch = flightNumber.trim().length > 0 && flightDate.length > 0;

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-950 font-sans antialiased">

            {/* ── Topbar ── */}
            <header className="flex items-center justify-between px-6 py-3 shrink-0 z-10"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-6">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Plane className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-white text-sm">AirBridge</span>
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
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-green-400 font-medium">Live · Reactive</span>
                            </motion.div>
                        ) : (
                            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-xs text-blue-400 font-medium">Engine Active</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button className="text-sm text-gray-500 hover:text-white transition-colors">Sign In</button>
                    <button className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full font-medium">
                        Get Started
                    </button>
                </div>
            </header>

            {/* ── Main Split ── */}
            <div className="flex flex-1 min-h-0">

                {/* LEFT — Input Panel */}
                <div className="w-[380px] shrink-0 flex flex-col overflow-hidden"
                    style={{ background: '#ffffff', borderRight: '1px solid #f1f5f9' }}>

                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Fixed header */}
                        <div className="px-6 pt-6 pb-2 shrink-0">
                            <h1 className="text-lg font-bold text-gray-900">Departure Setup</h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {step === 1 && 'Enter your flight details'}
                                {step === 2 && 'Select your departure'}
                                {step === 3 && 'Customize your journey'}
                            </p>
                        </div>

                        {/* Animated step content */}
                        <div className="flex-1 overflow-hidden relative">
                            <AnimatePresence mode="wait" custom={dir}>
                                {/* ── STEP 1 ── */}
                                {step === 1 && (
                                    <motion.div key="step1" custom={dir}
                                        variants={slideVariants} initial="enter" animate="center" exit="exit"
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        className="absolute inset-0 overflow-y-auto px-6 pt-4 pb-4 flex flex-col gap-4"
                                    >
                                        <StepDots step={1} />

                                        <div>
                                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Flight Number</label>
                                            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                                style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                                <Plane className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <Input value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                                                    placeholder="e.g. UA 452"
                                                    onKeyDown={e => e.key === 'Enter' && canSearch && handleFindFlight()}
                                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-gray-900 font-medium" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Flight Date</label>
                                            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                                style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <input type="date" value={flightDate} onChange={e => setFlightDate(e.target.value)}
                                                    className="flex-1 bg-transparent text-sm text-gray-900 font-medium focus:outline-none" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 2 ── */}
                                {step === 2 && (
                                    <motion.div key="step2" custom={dir}
                                        variants={slideVariants} initial="enter" animate="center" exit="exit"
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        className="absolute inset-0 overflow-y-auto px-6 pt-4 pb-4 flex flex-col gap-4"
                                    >
                                        <StepDots step={2} />

                                        {/* Selected flight recap */}
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                            style={{ background: '#f0f5ff', border: '1px solid #c7d7fd' }}>
                                            <Plane className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                            <span className="text-xs font-bold text-blue-700">{flightNumber.toUpperCase()}</span>
                                            <span className="text-[10px] text-blue-400 ml-1">
                                                {new Date(flightDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                            <button onClick={() => goTo(1)}
                                                className="ml-auto text-[10px] text-blue-400 hover:text-blue-600 flex items-center gap-0.5 font-medium">
                                                <ArrowLeft className="w-3 h-3" /> Edit
                                            </button>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Select your departure</p>

                                            {searching ? (
                                                <div className="flex flex-col gap-2">
                                                    {[1, 2].map(i => (
                                                        <motion.div key={i}
                                                            animate={{ opacity: [0.4, 0.9, 0.4] }}
                                                            transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                                                            className="h-20 rounded-xl"
                                                            style={{ background: '#f3f4f6' }} />
                                                    ))}
                                                    <p className="text-[11px] text-gray-400 text-center mt-1">Searching flights...</p>
                                                </div>
                                            ) : flightOptions.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-gray-400">No flights found. Try again.</p>
                                                    <button onClick={() => goTo(1)} className="text-xs text-blue-500 mt-2 font-medium">← Go back</button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    {flightOptions.map((f, i) => (
                                                        <motion.button key={i}
                                                            initial={{ opacity: 0, y: 12 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.08, duration: 0.3 }}
                                                            onClick={() => handleSelectFlight(f)}
                                                            className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-200 hover:scale-[1.01]"
                                                            style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}
                                                            whileHover={{ borderColor: '#93c5fd', background: '#eff6ff' }}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xl font-black text-gray-900">{f.departure_time}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="w-8 h-px bg-gray-300" />
                                                                        <Plane className="w-3 h-3 text-gray-400" />
                                                                        <div className="w-8 h-px bg-gray-300" />
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-gray-500">{f.arrival_time}</span>
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 font-medium">{f.duration}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[11px] font-semibold text-gray-600">{f.origin_code}</span>
                                                                <span className="text-[10px] text-gray-400">→</span>
                                                                <span className="text-[11px] font-semibold text-gray-600">{f.destination_code}</span>
                                                                <span className="text-[10px] text-gray-400 ml-2">· {f.terminal}</span>
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 3 ── */}
                                {step === 3 && (
                                    <motion.div key="step3" custom={dir}
                                        variants={slideVariants} initial="enter" animate="center" exit="exit"
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        className="absolute inset-0 overflow-y-auto px-6 pt-4 pb-4 flex flex-col gap-4"
                                    >
                                        <StepDots step={3} />

                                        {/* Selected flight recap */}
                                        {selectedFlight && (
                                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-green-800">
                                                        {flightNumber.toUpperCase()} · {selectedFlight.departure_time}
                                                    </p>
                                                    <p className="text-[10px] text-green-600">{selectedFlight.origin_code} → {selectedFlight.destination_code}</p>
                                                </div>
                                                <button onClick={() => goTo(2)}
                                                    className="text-[10px] text-green-500 hover:text-green-700 flex items-center gap-0.5 font-medium shrink-0">
                                                    <ArrowLeft className="w-3 h-3" /> Change
                                                </button>
                                            </div>
                                        )}

                                        {/* Transport Mode */}
                                        <div>
                                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Transportation Mode</label>
                                            <div className="flex gap-1.5">
                                                {transportModes.map(m => (
                                                    <button key={m.id} onClick={() => setTransport(m.id)}
                                                        className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200"
                                                        style={{
                                                            border: transport === m.id ? '1.5px solid #3b82f6' : '1px solid #e5e7eb',
                                                            background: transport === m.id ? '#eff6ff' : '#f9fafb',
                                                            color: transport === m.id ? '#1d4ed8' : '#9ca3af',
                                                        }}>
                                                        <m.icon className="w-4 h-4" />
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Confidence Profile */}
                                        <div>
                                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">How Much Time Do You Want?</label>
                                            <div className="flex gap-2">
                                                {confidenceProfiles.map(p => (
                                                    <button key={p.id} onClick={() => setSelectedProfile(p.id)}
                                                        className="flex-1 flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all duration-200"
                                                        style={{
                                                            border: selectedProfile === p.id ? '1.5px solid #93c5fd' : '1px solid #e5e7eb',
                                                            background: selectedProfile === p.id ? '#eff6ff' : '#f9fafb',
                                                        }}>
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                            style={{ background: selectedProfile === p.id ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : '#e5e7eb' }}>
                                                            <p.icon className="w-3.5 h-3.5" style={{ color: selectedProfile === p.id ? '#fff' : '#9ca3af' }} />
                                                        </div>
                                                        <p className="text-[11px] font-semibold leading-tight" style={{ color: selectedProfile === p.id ? '#1d4ed8' : '#111827' }}>{p.name}</p>
                                                        <p className="text-[9px] text-gray-400 leading-tight">{p.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Advanced Options */}
                                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                                            <button onClick={() => setAdvancedOpen(o => !o)}
                                                className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-50 transition-colors">
                                                Advanced Options
                                                <motion.span animate={{ rotate: advancedOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </motion.span>
                                            </button>
                                            <motion.div initial={false}
                                                animate={{ height: advancedOpen ? 'auto' : 0 }}
                                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                                style={{ overflow: 'hidden' }}>
                                                <motion.div initial={false}
                                                    animate={{ opacity: advancedOpen ? 1 : 0 }}
                                                    transition={{ duration: 0.25, delay: advancedOpen ? 0.1 : 0 }}
                                                    className="px-4 pb-4 space-y-4 pt-3"
                                                    style={{ borderTop: '1px solid #f1f5f9' }}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-700 font-medium">Checked baggage</p>
                                                            <AnimatePresence>
                                                                {hasBaggage && (
                                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                                        className="flex items-center gap-1.5 mt-1 overflow-hidden">
                                                                        <span className="text-[10px] text-gray-400">Bags:</span>
                                                                        {[1, 2, 3].map(n => (
                                                                            <button key={n} onClick={() => setBaggageCount(n)}
                                                                                className="w-6 h-6 rounded text-[10px] font-semibold border transition-all"
                                                                                style={{ background: baggageCount === n ? '#2563eb' : '#f9fafb', color: baggageCount === n ? '#fff' : '#6b7280', borderColor: baggageCount === n ? '#2563eb' : '#e5e7eb' }}>
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
                                                        <p className="text-xs text-gray-700 font-medium">Traveling with children</p>
                                                        <Toggle on={withChildren} onToggle={() => setWithChildren(c => !c)} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-700 font-medium mb-2">Extra airport time</p>
                                                        <div className="flex gap-2">
                                                            {['none', '+15', '+30'].map(v => (
                                                                <button key={v} onClick={() => setExtraTime(v)}
                                                                    className="flex-1 text-[10px] py-1.5 rounded-lg font-semibold border transition-all"
                                                                    style={{ background: extraTime === v ? '#2563eb' : '#f9fafb', color: extraTime === v ? '#fff' : '#6b7280', borderColor: extraTime === v ? '#2563eb' : '#e5e7eb' }}>
                                                                    {v === 'none' ? 'None' : v + ' min'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* CTA — pinned */}
                        <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid #f1f5f9' }}>
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.button key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={handleFindFlight}
                                        disabled={!canSearch}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
                                        style={{
                                            background: canSearch ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#f3f4f6',
                                            boxShadow: canSearch ? '0 4px 24px rgba(37,99,235,0.3)' : 'none',
                                            color: canSearch ? '#fff' : '#9ca3af',
                                            cursor: canSearch ? 'pointer' : 'not-allowed',
                                        }}>
                                        <Search className="w-4 h-4" />
                                        {canSearch ? 'Find My Flight' : 'Enter flight details'}
                                    </motion.button>
                                )}

                                {step === 2 && !searching && flightOptions.length === 0 && (
                                    <motion.button key="back2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => goTo(1)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                        <ArrowLeft className="w-4 h-4" /> Go back
                                    </motion.button>
                                )}

                                {step === 3 && (
                                    locked ? (
                                        <motion.div key="locked" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                                            style={{ background: 'linear-gradient(135deg,#16a34a22,#16a34a11)', border: '1px solid rgba(34,197,94,0.3)', color: '#16a34a' }}>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Departure Time Locked ✓
                                        </motion.div>
                                    ) : (
                                        <motion.button key="lock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            onClick={() => setLocked(true)}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
                                            style={{
                                                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                                boxShadow: '0 4px 24px rgba(37,99,235,0.3)',
                                            }}>
                                            <Lock className="w-4 h-4" />
                                            Lock In My Departure Time
                                        </motion.button>
                                    )
                                )}
                            </AnimatePresence>

                            {(step === 3 || locked) && (
                                <button onClick={handleReset}
                                    className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 mt-2 transition-colors">
                                    ← Start over
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT — Visualization Panel */}
                <div className="flex-1 flex items-center justify-center px-8 py-6 relative overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(59,130,246,0.07) 0%, rgba(9,9,11,1) 60%)' }}>
                    <div className="absolute top-10 right-10 w-80 h-80 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent)', filter: 'blur(60px)' }} />
                    <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent)', filter: 'blur(40px)' }} />

                    <AnimatePresence mode="wait">
                        <JourneyVisualization
                            key={locked ? 'journey' : 'idle'}
                            locked={locked}
                            steps={journeySteps}
                            transport={transport}
                            profile={profile}
                            confidenceColorMap={confidenceColorMap}
                        />
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}