import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Car, Shield, Luggage, Footprints, CheckCircle2, Train, Search, SlidersHorizontal } from 'lucide-react';

const steps = [
    {
        icon: Search,
        number: '01',
        title: 'Enter Your Flight',
        desc: 'Type your flight number and date. We look up your departure time, terminal, and airport automatically.',
        color: 'from-blue-500 to-indigo-500',
        bg: 'from-blue-50 to-indigo-50',
        iconColor: 'text-blue-600',
    },
    {
        icon: Car,
        number: '02',
        title: 'Choose Your Transport',
        desc: 'Uber, Lyft, driving, train, or bus — each mode has a precise timing profile accounting for pickup waits, transit schedules, and parking.',
        color: 'from-violet-500 to-purple-500',
        bg: 'from-violet-50 to-purple-50',
        iconColor: 'text-violet-600',
    },
    {
        icon: SlidersHorizontal,
        number: '03',
        title: 'Set Your Comfort Level',
        desc: 'Stress-Free, Just Right, or Cut It Close — your departure time adapts to the confidence buffer you choose.',
        color: 'from-fuchsia-500 to-pink-500',
        bg: 'from-fuchsia-50 to-pink-50',
        iconColor: 'text-fuchsia-600',
    },
    {
        icon: Luggage,
        number: '04',
        title: 'Baggage & Check-In',
        desc: 'Traveling with checked bags? We add bag-drop time to your timeline. Carry-on only? We skip it and tighten your window.',
        color: 'from-orange-500 to-amber-500',
        bg: 'from-orange-50 to-amber-50',
        iconColor: 'text-orange-600',
    },
    {
        icon: Shield,
        number: '05',
        title: 'Live TSA Wait Times',
        desc: 'PreCheck, CLEAR, or standard lane — modeled with live wait data and historical patterns by airport and time of day.',
        color: 'from-purple-500 to-violet-500',
        bg: 'from-purple-50 to-violet-50',
        iconColor: 'text-purple-600',
    },
    {
        icon: CheckCircle2,
        number: '06',
        title: 'Arrive at the Gate, Relaxed',
        desc: 'Gate walk time calculated per airport. You see your exact gate arrival time and boarding time — side by side. Just board.',
        color: 'from-green-500 to-emerald-500',
        bg: 'from-green-50 to-emerald-50',
        iconColor: 'text-green-600',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 lg:py-32" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #f0f4ff 50%, #f8faff 100%)' }}>
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-4">
                        <span className="w-6 h-px bg-indigo-400 inline-block" />
                        Door-to-Gate, Step by Step
                        <span className="w-6 h-px bg-indigo-400 inline-block" />
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mt-2 mb-4">
                        How It Works
                    </h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
                        Six variables, one precise answer. Here's exactly how we calculate your perfect departure time.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08, duration: 0.5 }}
                            className="relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6 group"
                        >
                            {/* Step number badge */}
                            <div className={`absolute -top-3.5 left-6 bg-gradient-to-r ${step.color} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm`}>
                                Step {step.number}
                            </div>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.bg} flex items-center justify-center mb-5 mt-3 group-hover:scale-110 transition-transform duration-300`}>
                                <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                            </div>

                            <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>

                            {/* Subtle connector arrow for non-last items */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-sm`}>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M3 2l4 3-4 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* CTA row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-14 text-center"
                >
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-indigo-500/25">
                        <Plane className="w-5 h-5" />
                        <span className="font-semibold">One precise door-to-gate departure time. Every time.</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}