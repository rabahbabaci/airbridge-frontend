import React from 'react';
import { motion } from 'framer-motion';
import { Car, ShieldAlert, Brain } from 'lucide-react';

const problems = [
    {
        icon: Car,
        title: "Unpredictable Traffic",
        description: "You check Google Maps, but one accident changes everything.",
    },
    {
        icon: ShieldAlert,
        title: "TSA Guesswork",
        description: "Security wait times fluctuate and no one gives you certainty.",
    },
    {
        icon: Brain,
        title: "Mental Load",
        description: "You leave too early and waste hours. Or too late and panic.",
    }
];

export default function Problem() {
    return (
        <section id="problem" className="py-24 lg:py-32 bg-secondary/50">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                        Airport Travel Is{' '}
                        <span className="text-destructive">
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
                            <div className="bg-card rounded-3xl p-8 h-full border border-border shadow-sm hover:shadow-xl hover:border-border transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-brand-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <problem.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    {problem.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
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