import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plane, MapPin, Shield, Zap, AlertCircle, ArrowRight, Car, Train, Bus, User, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";

// Transport mode adjusts traffic time
const transportOffsets = {
    uber: 0,
    driving: -5,
    train: 10,
    bus: 15,
    other: 5,
};

const confidenceProfiles = [
    { id: 'safety', name: 'Safety Net', desc: 'Maximum buffer, lowest stress', range: '95–99%', icon: Shield, bufferMultiplier: 1.5, confidenceScore: 97, color: 'green' },
    { id: 'sweet',  name: 'Sweet Spot',  desc: 'Balanced time vs certainty',   range: '90–95%', icon: Zap,         bufferMultiplier: 1.0, confidenceScore: 91, color: 'blue'  },
    { id: 'risk',   name: 'Risk Taker',  desc: 'More reclaimed time, higher risk', range: '70–88%', icon: AlertCircle, bufferMultiplier: 0.4, confidenceScore: 79, color: 'amber' },
];

const transportModes = [
    { id: 'uber',    label: 'Uber/Lyft', icon: Car   },
    { id: 'driving', label: 'Driving',   icon: Car   },
    { id: 'train',   label: 'Train',     icon: Train },
    { id: 'bus',     label: 'Bus',       icon: Bus   },
    { id: 'other',   label: 'Other',     icon: User  },
];

const airportData = {
    SFO: { traffic: 63, tsa: 41, walking: 17, baseBuffer: 16 },
    LAX: { traffic: 58, tsa: 48, walking: 22, baseBuffer: 16 },
    JFK: { traffic: 72, tsa: 52, walking: 19, baseBuffer: 16 },
    ORD: { traffic: 54, tsa: 38, walking: 15, baseBuffer: 16 },
    ATL: { traffic: 48, tsa: 45, walking: 18, baseBuffer: 16 },
    DFW: { traffic: 51, tsa: 35, walking: 20, baseBuffer: 16 },
};

const confidenceColorMap = {
    green: { badge: 'bg-green-500/20 text-green-400', score: 'text-green-400' },
    blue:  { badge: 'bg-blue-500/20 text-blue-400',   score: 'text-blue-400'  },
    amber: { badge: 'bg-amber-500/20 text-amber-400', score: 'text-amber-400' },
};

function fmt(date, offsetMins) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + offsetMins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function DepartureEngineDemo() {
    const [selectedProfile, setSelectedProfile] = useState('sweet');
    const [airport, setAirport]     = useState('SFO');
    const [flightNumber, setFlightNumber] = useState('UA 452');
    const [transport, setTransport] = useState('uber');
    const [advancedOpen, setAdvancedOpen] = useState(false);

    // Advanced options
    const [hasBaggage, setHasBaggage]   = useState(false);
    const [baggageCount, setBaggageCount] = useState(1);
    const [withChildren, setWithChildren] = useState(false);
    const [extraTime, setExtraTime]     = useState('none');

    const profile = confidenceProfiles.find(p => p.id === selectedProfile);
    const base    = airportData[airport] || airportData['SFO'];

    const trafficTime = base.traffic + (transportOffsets[transport] ?? 0);
    const baggageTime = hasBaggage ? baggageCount * 7 : 0; // baggage drop adds time before security
    const buffer = Math.round(base.baseBuffer * profile.bufferMultiplier)
        + (withChildren ? 10 : 0)
        + (extraTime === '+15' ? 15 : extraTime === '+30' ? 30 : 0);
    const total = trafficTime + baggageTime + base.tsa + base.walking + buffer;

    // Fixed gate arrival at 10:00 AM; work backwards
    const gate = new Date(); gate.setHours(10, 0, 0, 0);

    const leaveTime     = fmt(gate, -total);
    const arriveAirport = fmt(gate, -(baggageTime + base.tsa + base.walking + buffer));
    const dropBaggage   = hasBaggage ? fmt(gate, -(base.tsa + base.walking + buffer)) : null;
    const tsaClear      = fmt(gate, -(base.walking + buffer));
    const arriveGate    = fmt(gate, -buffer);
    const boarding      = fmt(gate, 0);

    const timelineSteps = [
        { label: 'Leave Home',     time: leaveTime,     dot: 'bg-blue-500'   },
        { label: 'Arrive Airport', time: arriveAirport, dot: 'bg-purple-500' },
        ...(hasBaggage ? [{ label: 'Drop Baggage', time: dropBaggage, dot: 'bg-orange-400' }] : []),
        { label: 'Clear Security', time: tsaClear,      dot: 'bg-indigo-500' },
        { label: 'Arrive Gate',    time: arriveGate,    dot: 'bg-teal-500'   },
        { label: 'Boarding',       time: boarding,      dot: 'bg-green-500'  },
    ];

    const animKey = `${selectedProfile}-${airport}-${transport}-${withChildren}-${extraTime}-${hasBaggage}-${baggageCount}`;

    return (
        <section id="engine-demo" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Live Preview</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-3">See the Engine in Action</h2>
                    <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                        Adjust your inputs and watch your door-to-gate timeline update instantly.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col gap-6"
                >
                    {/* ── TOP: Inputs ── */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-gray-900 font-semibold text-base">Your Trip</span>
                        </div>

                        {/* Flight + Airport + Transport in a responsive row */}
                        <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block font-medium">Flight</label>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2">
                                    <Plane className="w-4 h-4 text-gray-400 shrink-0" />
                                    <Input
                                        value={flightNumber}
                                        onChange={e => setFlightNumber(e.target.value)}
                                        className="border-0 bg-transparent p-0 h-auto text-gray-900 font-medium focus-visible:ring-0 text-sm"
                                        placeholder="UA 452"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block font-medium">Airport</label>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                    <select
                                        value={airport}
                                        onChange={e => setAirport(e.target.value)}
                                        className="border-0 bg-transparent w-full text-gray-900 font-medium focus:outline-none text-sm"
                                    >
                                        {Object.keys(airportData).map(a => <option key={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block font-medium">Transport Mode</label>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2">
                                    <select
                                        value={transport}
                                        onChange={e => setTransport(e.target.value)}
                                        className="border-0 bg-transparent w-full text-gray-900 font-medium focus:outline-none text-sm"
                                    >
                                        {transportModes.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Confidence Profile — horizontal on wide screens */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-medium">Confidence Profile</label>
                            <div className="grid sm:grid-cols-3 gap-2">
                                {confidenceProfiles.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProfile(p.id)}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                                            selectedProfile === p.id
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${selectedProfile === p.id ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-200'}`}>
                                            <p.icon className={`w-3.5 h-3.5 ${selectedProfile === p.id ? 'text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${selectedProfile === p.id ? 'text-blue-700' : 'text-gray-900'}`}>{p.name}</p>
                                            <p className="text-xs text-gray-400">{p.range}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced options accordion */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setAdvancedOpen(o => !o)}
                                className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Advanced options
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {advancedOpen && (
                                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
                                    {/* Baggage */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 font-medium">Checked baggage</p>
                                            {hasBaggage && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-xs text-gray-400">Bags:</span>
                                                    {[1,2,3].map(n => (
                                                        <button key={n} onClick={() => setBaggageCount(n)}
                                                            className={`w-6 h-6 rounded text-xs font-semibold border transition-all ${baggageCount === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => setHasBaggage(b => !b)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hasBaggage ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${hasBaggage ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    {/* Children */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-600 font-medium">Traveling with children</p>
                                        <button onClick={() => setWithChildren(c => !c)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${withChildren ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${withChildren ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    {/* Extra time */}
                                    <div>
                                        <p className="text-xs text-gray-600 font-medium mb-2">Extra airport time</p>
                                        <div className="flex gap-2">
                                            {['none', '+15', '+30'].map(v => (
                                                <button key={v} onClick={() => setExtraTime(v)}
                                                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-all ${extraTime === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                                    {v === 'none' ? 'None' : v + ' min'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 text-sm">
                            Test My Departure Time
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ── BOTTOM: Results ── */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl p-7 text-white relative overflow-hidden flex flex-col gap-6">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative flex flex-col sm:flex-row gap-6 h-full">
                            {/* ① Recommended leave time + chip — left col */}
                            <motion.div
                                key={animKey}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35 }}
                                className="sm:w-64 flex flex-col gap-4"
                            >
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">Leave Home At</p>
                                    <span className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-none block mb-2">{leaveTime}</span>
                                    <span className={`inline-block text-sm font-bold px-3 py-1 rounded-full ${confidenceColorMap[profile.color].badge}`}>
                                        {profile.confidenceScore}% Confidence
                                    </span>
                                    <p className="text-gray-400 text-xs mt-3">
                                        {flightNumber} · {airport}<br/>{total} min door-to-gate
                                    </p>
                                </div>
                                {/* Personalization chip */}
                                <div className="bg-gray-800/70 rounded-xl px-4 py-3 border border-gray-700/50">
                                    <p className="text-xs text-gray-400 mb-1">Buffer included</p>
                                    <p className="text-white font-semibold text-lg">{buffer} min</p>
                                    <p className="text-xs text-gray-400 mt-1">Profile: <span className="text-gray-200">{profile.name}</span></p>
                                </div>
                            </motion.div>

                            {/* ② Timeline — right col */}
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">Door-to-Gate Timeline</p>
                                <div className="space-y-1">
                                    {timelineSteps.map((step, i) => (
                                        <div key={step.label} className="flex items-stretch gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${step.dot}`} />
                                                {i < timelineSteps.length - 1 && (
                                                    <div className="w-px flex-1 bg-gray-700 my-1" />
                                                )}
                                            </div>
                                            <div className={`flex items-start justify-between w-full ${i < timelineSteps.length - 1 ? 'pb-4' : ''}`}>
                                                <span className={`text-sm ${i === 0 ? 'text-white font-semibold' : 'text-gray-300'}`}>{step.label}</span>
                                                <span className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-gray-200'}`}>{step.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Intelligence strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-6xl mx-auto mt-10"
                >
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                        {['Live traffic + transport mode', 'TSA + terminal/gate walking time', 'Dynamic buffer + confidence model'].map(chip => (
                            <span key={chip} className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                {chip}
                            </span>
                        ))}
                    </div>
                    <p className="text-center text-gray-500 text-sm max-w-xl mx-auto">
                        Most tools optimize one leg of the trip. AirBridge predicts the full door-to-gate journey.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}