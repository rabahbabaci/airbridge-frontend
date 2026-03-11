import React from 'react';
import { motion } from 'framer-motion';
import { Car, Building2, Shield, Luggage, Clock, SlidersHorizontal, Footprints, CheckCircle2 } from 'lucide-react';

const steps = [
    { icon: Car,              number: '01', title: 'Select Your Departure Mode',         desc: 'Uber, drive, or train — each mode has a precise timing profile. We account for pickup waits, parking, and transit schedules so your start time is always accurate.' },
    { icon: Building2,        number: '02', title: 'Seamless Airport Arrival',            desc: 'Drop-off zones, parking structures, terminal entry — every approach is modeled. You arrive knowing exactly how much time you have.' },
    { icon: Luggage,          number: '03', title: 'Smart Check-In & Baggage Handling',   desc: 'Carry-on or checked bags — we factor the difference. Bag drop queues are built into your timeline, not left as guesswork.' },
    { icon: Shield,           number: '04', title: 'Security & TSA Optimization',         desc: 'PreCheck, CLEAR, or standard lane — each is modeled accurately using live wait data and historical patterns by airport and time of day.' },
    { icon: SlidersHorizontal,number: '05', title: 'Personal Timing Confidence',          desc: 'Set your comfort level. Whether you want efficiency or extra cushion, your departure time adapts to the confidence profile you choose.' },
    { icon: Footprints,       number: '06', title: 'Gate Access & Walk Time',             desc: 'Terminal size and gate distance are calculated per airport. You\'ll know exactly how long the walk takes — no surprises.' },
    { icon: CheckCircle2,     number: '07', title: 'Confident Boarding',                  desc: 'Arrive at the gate ready — never rushed, never late. AirBridge gives you a departure time you can actually trust.' },
];

export default function JourneyFlow() {
    return (
        <section className="py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">How We Think</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-3">
                        The Full Door-to-Gate Journey
                    </h2>
                    <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                        Every leg of your trip, modeled intelligently.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.07 }}
                            className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-5"
                        >
                            <div className="absolute -top-3 left-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {step.number}
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-4 mt-2">
                                <step.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{step.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/25">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">One optimized door-to-gate departure time.</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}