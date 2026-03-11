import React from 'react';
import { motion } from 'framer-motion';
import { Car, ShieldAlert, Brain } from 'lucide-react';

const problems = [
    {
        icon: Car,
        title: "Unpredictable Traffic",
        description: "You check Google Maps, but one accident changes everything.",
        color: "from-orange-500 to-red-500"
    },
    {
        icon: ShieldAlert,
        title: "TSA Guesswork",
        description: "Security wait times fluctuate and no one gives you certainty.",
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: Brain,
        title: "Mental Load",
        description: "You leave too early and waste hours. Or too late and panic.",
        color: "from-purple-500 to-pink-500"
    }
];

export default function Problem() {
    return (
        <section id="problem" className="py-24 lg:py-32 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                        Airport Travel Is{' '}
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                            Broken
                        </span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={problem.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="bg-white rounded-3xl p-8 h-full border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${problem.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <problem.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {problem.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {problem.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}