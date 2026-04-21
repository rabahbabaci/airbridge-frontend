import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';

const features = [
    { name: "Traffic Awareness", google: "basic", airline: false, airbridge: true },
    { name: "Airport Context", google: false, airline: "partial", airbridge: true },
    { name: "TSA Wait Times", google: false, airline: false, airbridge: true },
    { name: "Predictive leave-by timing", google: false, airline: false, airbridge: true },
    { name: "Real-Time Alerts", google: "basic", airline: "basic", airbridge: true },
];

const FeatureStatus = ({ value }) => {
    if (value === true) {
        return (
            <div className="w-8 h-8 rounded-full bg-c-confidence-surface flex items-center justify-center">
                <Check className="w-4 h-4 text-c-confidence" />
            </div>
        );
    }
    if (value === false) {
        return (
            <div className="w-8 h-8 rounded-full bg-c-ground-sunken flex items-center justify-center">
                <X className="w-4 h-4 text-c-text-secondary" />
            </div>
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-c-warning-surface flex items-center justify-center">
            <Minus className="w-4 h-4 text-c-warning" />
        </div>
    );
};

export default function Comparison() {
    return (
        <section id="compare" className="py-24 lg:py-32 bg-c-ground-sunken">
            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-c-text-primary">
                        Not Just Another Travel App
                    </h2>
                    <p className="text-c-text-secondary mt-4 text-base sm:text-lg">
                        See how AirBridge compares to what you're using today.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-c-ground-elevated rounded-3xl border border-c-border-hairline shadow-lg overflow-hidden"
                >
                    {/* Header — responsive: stacks on small screens */}
                    <div className="hidden sm:grid grid-cols-4 gap-4 p-6 bg-c-ground-sunken border-b border-c-border-hairline">
                        <div className="text-sm font-medium text-c-text-secondary">Feature</div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-c-text-primary">Google Maps</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-c-text-primary">Airline App</div>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-c-brand-primary">
                                <span className="text-sm font-semibold text-c-text-inverse">AirBridge</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile header */}
                    <div className="sm:hidden p-4 bg-c-ground-sunken border-b border-c-border-hairline">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-c-text-secondary">Feature comparison</span>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-c-brand-primary">
                                <span className="text-xs font-semibold text-c-text-inverse">AirBridge</span>
                            </div>
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-c-border-hairline">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.name}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                {/* Desktop row */}
                                <div className="hidden sm:grid grid-cols-4 gap-4 p-6 hover:bg-c-ground-sunken transition-colors">
                                    <div className="text-sm text-c-text-primary font-medium flex items-center">
                                        {feature.name}
                                    </div>
                                    <div className="flex justify-center">
                                        <FeatureStatus value={feature.google} />
                                    </div>
                                    <div className="flex justify-center">
                                        <FeatureStatus value={feature.airline} />
                                    </div>
                                    <div className="flex justify-center">
                                        <FeatureStatus value={feature.airbridge} />
                                    </div>
                                </div>

                                {/* Mobile row — card layout */}
                                <div className="sm:hidden px-4 py-4 hover:bg-c-ground-sunken transition-colors">
                                    <p className="text-sm font-medium text-c-text-primary mb-2.5">{feature.name}</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <FeatureStatus value={feature.google} />
                                            <span className="text-[10px] text-c-text-secondary">Maps</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FeatureStatus value={feature.airline} />
                                            <span className="text-[10px] text-c-text-secondary">Airline</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FeatureStatus value={feature.airbridge} />
                                            <span className="text-[10px] text-c-brand-primary font-semibold">AirBridge</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-8 text-sm text-c-text-secondary">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-c-confidence-surface flex items-center justify-center">
                            <Check className="w-3 h-3 text-c-confidence" />
                        </div>
                        Full support
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-c-warning-surface flex items-center justify-center">
                            <Minus className="w-3 h-3 text-c-warning" />
                        </div>
                        Limited
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-c-ground-sunken flex items-center justify-center">
                            <X className="w-3 h-3 text-c-text-secondary" />
                        </div>
                        Not available
                    </div>
                </div>
            </div>
        </section>
    );
}
