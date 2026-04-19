import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Car, Shield, Luggage, CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';

const steps = [
    {
        icon: Search,
        number: '01',
        title: 'Enter Your Flight',
        desc: 'Type your flight number and date. We look up your scheduled flight time, terminal, and airport automatically.',
    },
    {
        icon: Car,
        number: '02',
        title: 'Choose Your Transport',
        desc: 'Rideshare, driving, train, or bus — each mode has a precise timing profile accounting for pickup waits, transit schedules, and parking.',
    },
    {
        icon: SlidersHorizontal,
        number: '03',
        title: 'Set Your Comfort Level',
        desc: 'Tight, Comfortable, or Relaxed — your leave time adapts to the buffer you choose.',
    },
    {
        icon: Luggage,
        number: '04',
        title: 'Baggage & Check-In',
        desc: 'Traveling with checked bags? We add bag-drop time to your timeline. Carry-on only? We skip it and tighten your window.',
    },
    {
        icon: Shield,
        number: '05',
        title: 'Live TSA Wait Times',
        desc: 'PreCheck or standard lane — modeled with live wait data and historical patterns by airport and time of day.',
    },
    {
        icon: CheckCircle2,
        number: '06',
        title: 'Arrive at the Gate, Relaxed',
        desc: 'Gate walk time calculated per airport. You see your exact gate arrival time and boarding time — side by side. Just board.',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 lg:py-32 bg-c-brand-primary-surface">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-c-brand-primary uppercase tracking-widest mb-4">
                        <span className="w-6 h-px bg-c-brand-primary/40 inline-block" />
                        Door-to-Gate, Step by Step
                        <span className="w-6 h-px bg-c-brand-primary/40 inline-block" />
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-black text-c-text-primary mt-2 mb-4">
                        How It Works
                    </h2>
                    <p className="text-c-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
                        Six variables, one precise answer. Here's exactly how we calculate your leave time.
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
                            className="relative bg-c-ground-elevated rounded-3xl border border-c-border-hairline shadow-sm hover:shadow-lg transition-all duration-300 p-6 group"
                        >
                            {/* Step number badge */}
                            <div className="absolute -top-3.5 left-6 bg-c-brand-primary text-c-text-inverse text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                Step {step.number}
                            </div>

                            {/* Icon */}
                            <div className="w-12 h-12 rounded-2xl bg-c-brand-primary-surface flex items-center justify-center mb-5 mt-3 group-hover:scale-110 transition-transform duration-300">
                                <step.icon className="w-5 h-5 text-c-brand-primary" />
                            </div>

                            <h3 className="text-base font-bold text-c-text-primary mb-2">{step.title}</h3>
                            <p className="text-sm text-c-text-secondary leading-relaxed">{step.desc}</p>

                            {/* Connector arrow */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                    <div className="w-6 h-6 rounded-full bg-c-brand-primary flex items-center justify-center shadow-sm">
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
                    <div className="inline-flex items-center gap-3 bg-c-brand-primary text-c-text-inverse px-8 py-4 rounded-2xl shadow-lg">
                        <Plane className="w-5 h-5" />
                        <span className="font-semibold">One precise door-to-gate leave time. Every time.</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}