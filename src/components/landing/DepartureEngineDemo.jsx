import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plane, MapPin, Calendar, Shield, Zap, AlertCircle, ChevronDown, ArrowRight, Car, Users, Footprints, Timer } from 'lucide-react';

const confidenceProfiles = [
    { id: 'safety', name: 'Safety Net', desc: 'Zero stress. Maximum buffer.', range: '95-99%', icon: Shield, active: false },
    { id: 'sweet', name: 'Sweet Spot', desc: 'Balanced. The smart traveler.', range: '90-95%', icon: Zap, active: true },
    { id: 'risk', name: 'Risk Taker', desc: 'Maximize reclaimed time.', range: '70-88%', icon: AlertCircle, active: false }
];

const timeBreakdown = [
    { label: 'Traffic', time: '63 min', percent: 46, color: 'bg-gradient-to-r from-blue-500 to-blue-400' },
    { label: 'TSA Wait', time: '41 min', percent: 30, color: 'bg-gradient-to-r from-purple-500 to-purple-400' },
    { label: 'Walking', time: '17 min', percent: 12, color: 'bg-gradient-to-r from-gray-400 to-gray-300' },
    { label: 'Buffer', time: '16 min', percent: 12, color: 'bg-gradient-to-r from-green-500 to-green-400' }
];

export default function DepartureEngineDemo() {
    const [selectedProfile, setSelectedProfile] = useState('sweet');

    return (
        <section className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
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
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 lg:p-8">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-gray-900 font-semibold">Departure Engine</span>
                        </div>

                        {/* Flight Number Input */}
                        <div className="mb-6">
                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-medium">Flight Number</label>
                            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3.5 flex items-center gap-3">
                                <Plane className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900 font-medium">UA 452</span>
                            </div>
                        </div>

                        {/* Airport & Date */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-medium">Airport</label>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3.5 flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900 font-medium">SFO</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-medium">Date</label>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3.5 flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-400">Mar 15, 2026</span>
                                </div>
                            </div>
                        </div>

                        {/* Confidence Profile */}
                        <div className="mb-6">
                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-3 block font-medium">Confidence Profile</label>
                            <div className="space-y-2">
                                {confidenceProfiles.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => setSelectedProfile(profile.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            selectedProfile === profile.id
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                selectedProfile === profile.id ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-200'
                                            }`}>
                                                <profile.icon className={`w-4 h-4 ${
                                                    selectedProfile === profile.id ? 'text-white' : 'text-gray-500'
                                                }`} />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-medium ${
                                                    selectedProfile === profile.id ? 'text-blue-600' : 'text-gray-900'
                                                }`}>{profile.name}</p>
                                                <p className="text-xs text-gray-500">{profile.desc}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            selectedProfile === profile.id ? 'text-purple-600' : 'text-gray-400'
                                        }`}>{profile.range}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25">
                            Lock In My Departure Time
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Right Panel - Results */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                        
                        <div className="relative">
                            {/* Leave Time */}
                            <div className="mb-8">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Leave Home At</p>
                                <h3 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">6:03 PM</h3>
                                <p className="text-gray-400 mt-2">Balanced. Efficient but not rushed.</p>
                                <p className="text-sm text-gray-500 mt-1">Recommended window: 6:01-6:05 PM</p>
                            </div>

                            {/* Flight Info */}
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                                <span className="px-2 py-1 bg-gray-800 rounded">UA 452</span>
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
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                {index === 0 && <Car className="w-4 h-4 text-gray-500" />}
                                                {index === 1 && <Users className="w-4 h-4 text-gray-500" />}
                                                {index === 2 && <Footprints className="w-4 h-4 text-gray-500" />}
                                                {index === 3 && <Timer className="w-4 h-4 text-gray-500" />}
                                                {item.label}
                                            </div>
                                            <span className="text-sm text-white font-medium">{item.time}</span>
                                        </div>
                                        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
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
                                <p className="text-sm text-gray-500 italic">Model insight: Traffic is the main driver today.</p>
                                <button className="text-sm text-blue-400 flex items-center gap-1 mt-1 hover:text-blue-300 transition-colors">
                                    Why this time? <ChevronDown className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Confidence Score */}
                            <div className="flex items-center justify-between pt-6 border-t border-gray-700/50">
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Confidence Score</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">Low risk</span>
                                    <span className="text-3xl font-bold">91%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}