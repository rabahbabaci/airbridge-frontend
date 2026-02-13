import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plane, MapPin, Calendar, Shield, Zap, AlertCircle, ChevronDown, ArrowRight, Car, Users, Footprints, Timer } from 'lucide-react';

const confidenceProfiles = [
    { id: 'safety', name: 'Safety Net', desc: 'Zero stress. Maximum buffer.', range: '95-99%', icon: Shield, active: false },
    { id: 'sweet', name: 'Sweet Spot', desc: 'Balanced. The smart traveler.', range: '90-95%', icon: Zap, active: true },
    { id: 'risk', name: 'Risk Taker', desc: 'Maximize reclaimed time.', range: '70-88%', icon: AlertCircle, active: false }
];

const timeBreakdown = [
    { label: 'Traffic', time: '63 min', percent: 46, color: 'bg-amber-400' },
    { label: 'TSA Wait', time: '41 min', percent: 30, color: 'bg-cyan-400' },
    { label: 'Walking', time: '17 min', percent: 12, color: 'bg-slate-500' },
    { label: 'Buffer', time: '16 min', percent: 12, color: 'bg-purple-500' }
];

export default function DepartureEngineDemo() {
    const [selectedProfile, setSelectedProfile] = useState('sweet');

    return (
        <section className="py-24 lg:py-32 bg-[#0d1117]">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Live Preview</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3">
                        See the Engine in Action
                    </h2>
                    <p className="text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
                        This is what smart departure planning looks like.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto"
                >
                    {/* Left Panel - Departure Engine */}
                    <div className="bg-[#161b22] rounded-2xl border border-slate-700/50 p-6">
                        <div className="flex items-center gap-2 mb-8">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <span className="text-white font-semibold">Departure Engine</span>
                        </div>

                        {/* Flight Number Input */}
                        <div className="mb-6">
                            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Flight Number</label>
                            <div className="bg-[#0d1117] rounded-lg border border-slate-700/50 px-4 py-3 flex items-center gap-3">
                                <Plane className="w-4 h-4 text-slate-500" />
                                <span className="text-white">UA 452</span>
                            </div>
                        </div>

                        {/* Airport & Date */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Airport</label>
                                <div className="bg-[#0d1117] rounded-lg border border-slate-700/50 px-4 py-3 flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                    <span className="text-white">SFO</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                                <div className="bg-[#0d1117] rounded-lg border border-slate-700/50 px-4 py-3 flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-400">mm/dd/yyyy</span>
                                </div>
                            </div>
                        </div>

                        {/* Confidence Profile */}
                        <div className="mb-6">
                            <label className="text-xs text-slate-500 uppercase tracking-wider mb-3 block">Confidence Profile</label>
                            <div className="space-y-2">
                                {confidenceProfiles.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => setSelectedProfile(profile.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            selectedProfile === profile.id
                                                ? 'bg-cyan-500/10 border-cyan-500/50'
                                                : 'bg-[#0d1117] border-slate-700/50 hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                selectedProfile === profile.id ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                                            }`}>
                                                <profile.icon className={`w-4 h-4 ${
                                                    selectedProfile === profile.id ? 'text-cyan-400' : 'text-slate-500'
                                                }`} />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-medium ${
                                                    selectedProfile === profile.id ? 'text-cyan-400' : 'text-white'
                                                }`}>{profile.name}</p>
                                                <p className="text-xs text-slate-500">{profile.desc}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm ${
                                            selectedProfile === profile.id ? 'text-cyan-400' : 'text-slate-500'
                                        }`}>{profile.range}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                            Lock In My Departure Time
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Right Panel - Results */}
                    <div className="bg-[#161b22] rounded-2xl border border-slate-700/50 p-6">
                        {/* Leave Time */}
                        <div className="mb-8">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Leave Home At</p>
                            <h3 className="text-5xl font-bold text-white">6:03 PM</h3>
                            <p className="text-slate-400 mt-2">Balanced. Efficient but not rushed.</p>
                            <p className="text-sm text-slate-500 mt-1">Recommended window: 6:01-6:05 PM</p>
                        </div>

                        {/* Flight Info */}
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                            <span>UA 452</span>
                            <span>•</span>
                            <span>SFO</span>
                            <span>•</span>
                            <span>Mar 15</span>
                        </div>

                        {/* Time Breakdown */}
                        <div className="space-y-4 mb-8">
                            {timeBreakdown.map((item, index) => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            {index === 0 && <Car className="w-4 h-4 text-slate-500" />}
                                            {index === 1 && <Users className="w-4 h-4 text-slate-500" />}
                                            {index === 2 && <Footprints className="w-4 h-4 text-slate-500" />}
                                            {index === 3 && <Timer className="w-4 h-4 text-slate-500" />}
                                            {item.label}
                                        </div>
                                        <span className="text-sm text-white font-medium">{item.time}</span>
                                    </div>
                                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.percent}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.8, delay: index * 0.1 }}
                                            className={`h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Model Insight */}
                        <div className="mb-6">
                            <p className="text-sm text-slate-500 italic">Model insight: Traffic is the main driver today.</p>
                            <button className="text-sm text-slate-400 flex items-center gap-1 mt-1 hover:text-slate-300">
                                Why this time? <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Confidence Score */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Confidence Score</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 font-medium">Low risk</span>
                                <span className="text-2xl font-bold text-white">91%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}