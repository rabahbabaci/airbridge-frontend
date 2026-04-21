import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Cpu, Bell } from 'lucide-react';

const features = [
    {
        icon: Radio,
        title: "Live Traffic + Airport Data Sync",
        description: "Real-time integration with traffic APIs, TSA feeds, and airport systems."
    },
    {
        icon: Cpu,
        title: "Predictive AI Buffer Modeling",
        description: "Machine learning analyzes historical patterns to optimize your buffer time."
    },
    {
        icon: Bell,
        title: "Real-Time Alerts",
        description: "Get notified instantly when conditions change and your leave time adjusts."
    }
];

export default function Solution() {
    return (
        <section id="solution" className="py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <h2 className="text-4xl lg:text-5xl font-bold text-c-text-primary">
                        Smart timing.{' '}
                        <span className="text-c-brand-primary">
                            Every time.
                        </span>
                    </h2>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center text-lg text-c-text-secondary max-w-2xl mx-auto mb-16"
                >
                    AirBridge combines real-time traffic, TSA wait times, airport congestion patterns, 
                    and predictive AI modeling to calculate your exact leave time.
                </motion.p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="relative bg-c-ground-elevated rounded-3xl p-6 h-full border border-c-border-hairline hover:border-c-brand-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                <div className="w-12 h-12 rounded-xl bg-c-brand-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-5 h-5 text-c-text-inverse" />
                                </div>
                                <h3 className="text-lg font-semibold text-c-text-primary mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-c-text-secondary leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}