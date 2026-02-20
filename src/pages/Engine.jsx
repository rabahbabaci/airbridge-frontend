import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import {
    Plane, Car, Train, Bus, User, Shield, Zap, AlertCircle,
    ChevronDown, CheckCircle2, MapPin, Lock, Calendar, Clock
} from 'lucide-react';
import JourneyVisualization from '@/components/engine/JourneyVisualization';

// ── Data ────────────────────────────────────────────────────────────────────
const transportOffsets = { uber: 0, driving: -5, train: 10, bus: 15, other: 5 };

const confidenceProfiles = [
    { id: 'safety', name: 'Stress-Free',   desc: 'Lots of extra time — arrive early, relax at the gate', icon: Shield,      bufferMultiplier: 1.5, confidenceScore: 97, color: 'green' },
    { id: 'sweet',  name: 'Just Right',    desc: 'Enough time without wasting your day',                  icon: Zap,         bufferMultiplier: 1.0, confidenceScore: 91, color: 'blue'  },
    { id: 'risk',   name: 'Cut It Close',  desc: 'Minimal buffer — only if you know the airport well',    icon: AlertCircle, bufferMultiplier: 0.4, confidenceScore: 79, color: 'amber' },
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

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Engine() {
    const [selectedProfile, setSelectedProfile] = useState('sweet');
    const [airport, setAirport]         = useState('SFO');
    const [flightNumber, setFlightNumber] = useState('');
    const [flightDate, setFlightDate]   = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [transport, setTransport]     = useState('uber');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [hasBaggage, setHasBaggage]   = useState(false);
    const [baggageCount, setBaggageCount] = useState(1);
    const [withChildren, setWithChildren] = useState(false);
    const [extraTime, setExtraTime]     = useState('none');
    const [locked, setLocked]           = useState(false);

    const profile  = confidenceProfiles.find(p => p.id === selectedProfile);
    const base     = airportData[airport];
    const trafficTime  = base.traffic + (transportOffsets[transport] ?? 0);
    const baggageTime  = hasBaggage ? baggageCount * 7 : 0;
    const buffer       = Math.round(base.baseBuffer * profile.bufferMultiplier)
        + (withChildren ? 10 : 0)
        + (extraTime === '+15' ? 15 : extraTime === '+30' ? 30 : 0);
    const total        = trafficTime + baggageTime + base.tsa + base.walking + buffer;

    const gate = useMemo(() => { const d = new Date(); d.setHours(10, 0, 0, 0); return d; }, []);
    const leaveTime     = fmt(gate, -total);
    const arriveAirport = fmt(gate, -(baggageTime + base.tsa + base.walking + buffer));
    const dropBaggage   = fmt(gate, -(base.tsa + base.walking + buffer));
    const tsaClear      = fmt(gate, -(base.walking + buffer));
    const arriveGate    = fmt(gate, -buffer);
    const boarding      = fmt(gate, 0);

    const journeySteps = [
        { id: 'home',     label: 'Leave Home',     color: '#3b82f6', time: leaveTime,     dur: `${trafficTime} min`, flightLabel: `${flightNumber || 'Your flight'} · ${airport}`, total },
        { id: 'travel',   label: 'En Route',        color: '#8b5cf6', time: arriveAirport, dur: `${trafficTime} min` },
        { id: 'airport',  label: 'Arrive Airport',  color: '#6366f1', time: arriveAirport, dur: `at terminal` },
        ...(hasBaggage ? [{ id: 'baggage', label: 'Baggage Drop', color: '#f97316', time: dropBaggage, dur: `${baggageTime} min`, visible: true }] : [{ id: 'baggage', label: 'Baggage Drop', color: '#f97316', visible: false }]),
        { id: 'security', label: 'TSA Security',    color: '#06b6d4', time: tsaClear,      dur: `${base.tsa} min` },
        { id: 'walk',     label: 'Gate Walk',       color: '#14b8a6', time: arriveGate,    dur: `${base.walking} min` },
        { id: 'gate',     label: 'Boarding',        color: '#22c55e', time: boarding,      dur: `on time` },
    ];

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

                    <div className="flex flex-col flex-1 overflow-y-auto px-6 pt-6 pb-2 gap-4 scrollbar-hide">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Departure Setup</h1>
                            <p className="text-xs text-gray-400 mt-0.5">Configure your trip below</p>
                        </div>

                        {/* Flight Number */}
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Flight Number</label>
                            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
                                style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                <Plane className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <Input value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                                    placeholder="e.g. UA 452"
                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-xs text-gray-900 font-medium" />
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                                <select value={airport} onChange={e => setAirport(e.target.value)}
                                    className="bg-transparent text-xs text-gray-900 font-medium focus:outline-none">
                                    {Object.entries(airportData).map(([code]) => (
                                        <option key={code} value={code}>{code}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date + Time row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Flight Date</label>
                                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
                                    style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <input type="date" value={flightDate} onChange={e => setFlightDate(e.target.value)}
                                        className="flex-1 bg-transparent text-xs text-gray-900 font-medium focus:outline-none min-w-0" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Departure Time</label>
                                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
                                    style={{ border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)}
                                        className="flex-1 bg-transparent text-xs text-gray-900 font-medium focus:outline-none min-w-0" />
                                </div>
                            </div>
                        </div>

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
                            <div className="flex flex-col gap-1.5">
                                {confidenceProfiles.map(p => (
                                    <button key={p.id} onClick={() => setSelectedProfile(p.id)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                                        style={{
                                            border: selectedProfile === p.id ? '1.5px solid #93c5fd' : '1px solid #e5e7eb',
                                            background: selectedProfile === p.id ? '#eff6ff' : '#f9fafb',
                                        }}>
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: selectedProfile === p.id ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : '#e5e7eb' }}>
                                            <p.icon className="w-3.5 h-3.5" style={{ color: selectedProfile === p.id ? '#fff' : '#9ca3af' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold" style={{ color: selectedProfile === p.id ? '#1d4ed8' : '#111827' }}>{p.name}</p>
                                            <p className="text-[10px] text-gray-400">{p.desc}</p>
                                        </div>
                                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                                            style={{ borderColor: selectedProfile === p.id ? '#3b82f6' : '#d1d5db' }}>
                                            {selectedProfile === p.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Options — smooth slide */}
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                            <button onClick={() => setAdvancedOpen(o => !o)}
                                className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-50 transition-colors">
                                Advanced Options
                                <motion.span animate={{ rotate: advancedOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </motion.span>
                            </button>
                            <motion.div
                                initial={false}
                                animate={{ height: advancedOpen ? 'auto' : 0 }}
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                style={{ overflow: 'hidden' }}
                            >
                                <motion.div
                                    initial={false}
                                    animate={{ opacity: advancedOpen ? 1 : 0 }}
                                    transition={{ duration: 0.25, delay: advancedOpen ? 0.1 : 0 }}
                                    className="px-4 pb-4 space-y-4 pt-3"
                                    style={{ borderTop: '1px solid #f1f5f9' }}
                                >
                                    {/* Baggage */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-700 font-medium">Checked baggage</p>
                                            <AnimatePresence>
                                                {hasBaggage && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                        className="flex items-center gap-1.5 mt-1 overflow-hidden">
                                                        <span className="text-[10px] text-gray-400">Bags:</span>
                                                        {[1,2,3].map(n => (
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
                                    {/* Children */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-700 font-medium">Traveling with children</p>
                                        <Toggle on={withChildren} onToggle={() => setWithChildren(c => !c)} />
                                    </div>
                                    {/* Extra time */}
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
                    </div>

                    {/* CTA — pinned */}
                    <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <AnimatePresence mode="wait">
                            {locked ? (
                                <motion.div key="locked" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                                    style={{ background: 'linear-gradient(135deg,#16a34a22,#16a34a11)', border: '1px solid rgba(34,197,94,0.3)', color: '#16a34a' }}>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Departure Time Locked ✓
                                </motion.div>
                            ) : (
                                <motion.button key="lock" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    onClick={() => flightNumber.trim() && airport ? setLocked(true) : null}
                                    disabled={!flightNumber.trim() || !airport}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
                                    style={{
                                        background: flightNumber.trim() && airport
                                            ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                                            : 'rgba(255,255,255,0.06)',
                                        boxShadow: flightNumber.trim() && airport ? '0 4px 24px rgba(37,99,235,0.3)' : 'none',
                                        color: flightNumber.trim() && airport ? '#fff' : '#4b5563',
                                        cursor: flightNumber.trim() && airport ? 'pointer' : 'not-allowed',
                                        border: flightNumber.trim() && airport ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                    }}>
                                    <Lock className="w-4 h-4" />
                                    {flightNumber.trim() && airport ? 'Lock In My Departure Time' : 'Enter flight info to continue'}
                                </motion.button>
                            )}
                        </AnimatePresence>
                        {locked && (
                            <button onClick={() => setLocked(false)}
                                className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 mt-2 transition-colors">
                                ← Reset &amp; reconfigure
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT — Visualization Panel */}
                <div className="flex-1 flex items-center justify-center px-8 py-6 relative overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(59,130,246,0.07) 0%, rgba(9,9,11,1) 60%)' }}>
                    {/* Ambient glows */}
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