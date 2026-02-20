import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plane, MapPin, Calendar as CalendarIcon, Shield, Zap, AlertCircle, ArrowRight, Car, Train, Bus, User, Luggage } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

// Transport mode adds extra time on top of base traffic
const transportOffsets = {
    uber: 0,      // baseline
    driving: -5,  // slightly faster (no wait for pickup)
    train: 10,    // fixed schedule, add padding
    bus: 15,      // slowest, most variable
    other: 5,
};

const confidenceProfiles = [
    {
        id: 'safety',
        name: 'Safety Net',
        desc: 'Maximum buffer, lowest stress',
        range: '95–99%',
        icon: Shield,
        bufferMultiplier: 1.5,
        confidenceScore: 97,
        color: 'green'
    },
    {
        id: 'sweet',
        name: 'Sweet Spot',
        desc: 'Balanced time vs certainty',
        range: '90–95%',
        icon: Zap,
        bufferMultiplier: 1.0,
        confidenceScore: 91,
        color: 'blue'
    },
    {
        id: 'risk',
        name: 'Risk Taker',
        desc: 'More reclaimed time, higher risk',
        range: '70–88%',
        icon: AlertCircle,
        bufferMultiplier: 0.4,
        confidenceScore: 79,
        color: 'amber'
    }
];

const transportModes = [
    { id: 'uber', label: 'Uber/Lyft', icon: Car },
    { id: 'driving', label: 'Driving', icon: Car },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'bus', label: 'Bus', icon: Bus },
    { id: 'other', label: 'Other', icon: User },
];

const airportData = {
    'SFO': { traffic: 63, tsa: 41, walking: 17, baseBuffer: 16 },
    'LAX': { traffic: 58, tsa: 48, walking: 22, baseBuffer: 16 },
    'JFK': { traffic: 72, tsa: 52, walking: 19, baseBuffer: 16 },
    'ORD': { traffic: 54, tsa: 38, walking: 15, baseBuffer: 16 },
    'ATL': { traffic: 48, tsa: 45, walking: 18, baseBuffer: 16 },
    'DFW': { traffic: 51, tsa: 35, walking: 20, baseBuffer: 16 }
};

function addMinutes(base, mins) {
    const d = new Date(base);
    d.setMinutes(d.getMinutes() + mins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function DepartureEngineDemo() {
    const [selectedProfile, setSelectedProfile] = useState('sweet');
    const [airport, setAirport] = useState('SFO');
    const [flightNumber, setFlightNumber] = useState('UA 452');
    const [date, setDate] = useState(new Date(2026, 2, 15));
    const [transport, setTransport] = useState('uber');
    const [hasBaggage, setHasBaggage] = useState(false);
    const [baggageCount, setBaggageCount] = useState(1);
    const [withChildren, setWithChildren] = useState(false);
    const [extraTime, setExtraTime] = useState('none');

    const profile = confidenceProfiles.find(p => p.id === selectedProfile);
    const base = airportData[airport] || airportData['SFO'];

    // Transport adds time on top of base traffic
    const transportExtra = transportOffsets[transport] ?? 0;
    const trafficTime = base.traffic + transportExtra;

    // Buffer from profile + preferences
    const buffer = Math.round(base.baseBuffer * profile.bufferMultiplier)
        + (withChildren ? 10 : 0)
        + (extraTime === '+15' ? 15 : extraTime === '+30' ? 30 : 0)
        + (hasBaggage ? baggageCount * 5 : 0);

    // Total minutes needed before gate arrival
    const total = trafficTime + base.tsa + base.walking + buffer;

    // Fixed gate arrival at 10:00 AM; leave time = gate arrival - total
    const gateArrival = new Date();
    gateArrival.setHours(10, 0, 0, 0);

    const leaveTime = addMinutes(gateArrival, -total);
    const arriveAirport = addMinutes(gateArrival, -(base.tsa + base.walking + buffer));
    const tsaClear = addMinutes(gateArrival, -(base.walking + buffer));
    const arriveGate = addMinutes(gateArrival, -buffer);
    const boarding = addMinutes(gateArrival, 0);

    const timelineSteps = [
        { label: 'Leave Home', time: leaveTime, color: 'from-blue-500 to-blue-600', dot: 'bg-blue-500' },
        { label: 'Arrive Airport', time: arriveAirport, color: 'from-purple-500 to-purple-600', dot: 'bg-purple-500' },
        { label: 'TSA Clear', time: tsaClear, color: 'from-indigo-500 to-indigo-600', dot: 'bg-indigo-500' },
        { label: 'Arrive Gate', time: arriveGate, color: 'from-teal-500 to-teal-600', dot: 'bg-teal-500' },
        { label: 'At Gate', time: boarding, color: 'from-green-500 to-green-600', dot: 'bg-green-500' },
    ];

    const confidenceColorMap = {
        green: { badge: 'bg-green-500/20 text-green-400', bar: 'bg-green-500' },
        blue: { badge: 'bg-blue-500/20 text-blue-400', bar: 'bg-blue-500' },
        amber: { badge: 'bg-amber-500/20 text-amber-400', bar: 'bg-amber-500' },
    };

    return (
        <section id="engine-demo" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Live Preview</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-3">
                        See the Engine in Action
                    </h2>
                    <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
                        Adjust your inputs and watch your door-to-gate timeline update instantly.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto"
                >
                    {/* LEFT: Inputs */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-gray-900 font-semibold text-base">Departure Engine</span>
                        </div>

                        {/* Flight + Airport + Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block font-medium">Flight</label>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2">
                                    <Plane className="w-4 h-4 text-gray-400 shrink-0" />
                                    <Input
                                        value={flightNumber}
                                        onChange={(e) => setFlightNumber(e.target.value)}
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
                                        onChange={(e) => setAirport(e.target.value)}
                                        className="border-0 bg-transparent w-full text-gray-900 font-medium focus:outline-none text-sm"
                                    >
                                        {Object.keys(airportData).map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block font-medium">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2 hover:bg-gray-100 transition-colors text-sm text-gray-900 font-medium">
                                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                                        {date ? format(date, 'MMM d, yyyy') : 'Pick a date'}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Transport Mode */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block font-medium">Transport Mode</label>
                            <div className="flex flex-wrap gap-2">
                                {transportModes.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setTransport(m.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                            transport === m.id
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        <m.icon className="w-3.5 h-3.5" />
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Baggage */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Checked Baggage</label>
                                {hasBaggage && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-xs text-gray-500">Bags:</span>
                                        {[1, 2, 3].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setBaggageCount(n)}
                                                className={`w-7 h-7 rounded-lg text-xs font-semibold border transition-all ${
                                                    baggageCount === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600'
                                                }`}
                                            >{n}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setHasBaggage(!hasBaggage)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasBaggage ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasBaggage ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Optional prefs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5">
                                <span className="text-xs text-gray-600 font-medium">With children</span>
                                <button
                                    onClick={() => setWithChildren(!withChildren)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${withChildren ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${withChildren ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-1.5">
                                <p className="text-xs text-gray-500 mb-1">Extra time</p>
                                <div className="flex gap-1">
                                    {['none', '+15', '+30'].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setExtraTime(v)}
                                            className={`flex-1 text-xs py-0.5 rounded font-medium transition-all ${
                                                extraTime === v ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >{v === 'none' ? 'None' : v}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Confidence Profile */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-medium">Confidence Profile</label>
                            <div className="space-y-2">
                                {confidenceProfiles.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProfile(p.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            selectedProfile === p.id
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                                selectedProfile === p.id ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-200'
                                            }`}>
                                                <p.icon className={`w-3.5 h-3.5 ${selectedProfile === p.id ? 'text-white' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-semibold ${selectedProfile === p.id ? 'text-blue-700' : 'text-gray-900'}`}>{p.name}</p>
                                                <p className="text-xs text-gray-500">{p.desc}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold ${selectedProfile === p.id ? 'text-purple-600' : 'text-gray-400'}`}>{p.range}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 text-sm mt-auto">
                            Lock In My Departure Time
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* RIGHT: Output */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative flex flex-col h-full gap-5">
                            {/* Recommended leave time */}
                            <motion.div
                                key={`${selectedProfile}-${airport}-${withChildren}-${extraTime}-${hasBaggage}-${baggageCount}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Leave Home At</p>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{leaveTime}</h3>
                                    <span className={`mb-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${confidenceColorMap[profile.color].badge}`}>
                                        {profile.confidenceScore}% confident
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                                    <span className="px-2 py-0.5 bg-gray-800 rounded">{flightNumber}</span>
                                    <span>•</span><span>{airport}</span>
                                    <span>•</span><span>{date ? format(date, 'MMM d') : ''}</span>
                                    <span>•</span><span>{total} min total</span>
                                </div>
                            </motion.div>

                            {/* Timeline */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Door-to-Gate Timeline</p>
                                <div className="space-y-0">
                                    {timelineSteps.map((step, i) => (
                                        <div key={step.label} className="flex items-stretch gap-3">
                                            {/* Left: dot + line */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${step.dot}`} />
                                                {i < timelineSteps.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-gray-700/60 my-1" />
                                                )}
                                            </div>
                                            {/* Right: label + time */}
                                            <div className={`pb-${i < timelineSteps.length - 1 ? '3' : '0'} flex items-start justify-between w-full`}>
                                                <span className="text-sm text-gray-300">{step.label}</span>
                                                <span className="text-sm font-semibold text-white">{step.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Buffer */}
                            <div className="bg-gray-800/60 rounded-2xl px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400">Buffer included</p>
                                    <p className="text-lg font-bold text-white">{buffer} min</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Profile</p>
                                    <p className="text-sm font-semibold text-white">{profile.name}</p>
                                </div>
                            </div>

                            {/* Confidence bar */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Confidence Score</span>
                                    <span className="text-2xl font-bold">{profile.confidenceScore}%</span>
                                </div>
                                <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                    <motion.div
                                        key={selectedProfile}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${profile.confidenceScore}%` }}
                                        transition={{ duration: 0.5 }}
                                        className={`h-full rounded-full ${confidenceColorMap[profile.color].bar}`}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">{profile.desc}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Intelligence strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto mt-10"
                >
                    <div className="flex flex-wrap justify-center gap-3 mb-5">
                        {[
                            'Live traffic + transport mode',
                            'TSA + terminal/gate walking time',
                            'Dynamic buffer + confidence model'
                        ].map(chip => (
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