import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Sparkles, Quote } from 'lucide-react';

const testimonials = [
    {
        quote: "Finally — an app that thinks through the whole trip, not just 'leave 2 hours early.' The confidence score changed how I plan completely.",
        author: "Sarah M.",
        role: "Frequent Flyer · Business Travel",
        avatar: "SM"
    },
    {
        quote: "I used to Google 'how early to get to the airport' every single time. AirBridge replaced that entirely.",
        author: "Marcus L.",
        role: "Monthly Traveler",
        avatar: "ML"
    },
    {
        quote: "The TSA and walking time breakdown is something no other app does. This is the travel tool I didn't know I needed.",
        author: "Jennifer K.",
        role: "Tech Executive",
        avatar: "JK"
    }
];

const badges = [
    { icon: Users, label: "Built with frequent flyer feedback", sublabel: "Currently in beta iteration" },
    { icon: Shield, label: "Confidence-based departures", sublabel: "You choose your risk level" },
    { icon: Sparkles, label: "Door-to-gate intelligence", sublabel: "Not just a traffic app" }
];

export default function Trust() {
    return (
        <section className="py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Community</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-3">
                        Built for{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Stress-Free Travelers
                        </span>
                    </h2>
                </motion.div>

                {/* Testimonials */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.author}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 h-full border border-gray-100 relative">
                                <Quote className="absolute top-6 right-6 w-8 h-8 text-blue-100" />
                                <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                                    "{testimonial.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{testimonial.author}</p>
                                        <p className="text-gray-500 text-xs">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-6 lg:gap-12"
                >
                    {badges.map((badge) => (
                        <div key={badge.label} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                                <badge.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{badge.label}</p>
                                <p className="text-gray-500 text-xs">{badge.sublabel}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}