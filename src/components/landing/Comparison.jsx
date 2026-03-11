import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';

const features = [
    {
        name: "Traffic Awareness",
        google: "basic",
        airline: false,
        airbridge: true
    },
    {
        name: "Airport Context",
        google: false,
        airline: "partial",
        airbridge: true
    },
    {
        name: "TSA Wait Times",
        google: false,
        airline: false,
        airbridge: true
    },
    {
        name: "Predictive Departure Timing",
        google: false,
        airline: false,
        airbridge: true
    },
    {
        name: "Real-Time Alerts",
        google: "basic",
        airline: "basic",
        airbridge: true
    },
    {
        name: "Missed Flight Protection",
        google: false,
        airline: false,
        airbridge: true
    }
];

const FeatureStatus = ({ value }) => {
    if (value === true) {
        return (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
            </div>
        );
    }
    if (value === false) {
        return (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-400" />
            </div>
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <Minus className="w-4 h-4 text-yellow-600" />
        </div>
    );
};

export default function Comparison() {
    return (
        <section id="compare" className="py-24 lg:py-32 bg-gray-50/50">
            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                        Not Just Another Travel App
                    </h2>
                    <p className="text-gray-600 mt-4 text-lg">
                        See how AirBridge compares to what you're using today.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden"
                >
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-500">Feature</div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">Google Maps</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">Airline App</div>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                                <span className="text-sm font-semibold text-white">AirBridge</span>
                            </div>
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-100">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.name}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="grid grid-cols-4 gap-4 p-6 hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="text-sm text-gray-700 font-medium flex items-center">
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
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Legend */}
                <div className="flex justify-center gap-8 mt-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-600" />
                        </div>
                        Full support
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Minus className="w-3 h-3 text-yellow-600" />
                        </div>
                        Limited
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                            <X className="w-3 h-3 text-gray-400" />
                        </div>
                        Not available
                    </div>
                </div>
            </div>
        </section>
    );
}