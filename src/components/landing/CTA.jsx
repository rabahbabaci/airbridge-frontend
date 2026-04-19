import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Smartphone } from 'lucide-react';

export default function CTA() {
    const navigate = useNavigate();

    return (
        <section id="cta" className="py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative bg-c-text-primary rounded-[2.5rem] overflow-hidden"
                >
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-c-brand-primary/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-c-brand-primary/15 rounded-full blur-3xl" />

                    <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-c-text-inverse max-w-3xl mx-auto leading-tight"
                        >
                            Your flight is scheduled.{' '}
                            <span className="text-c-brand-primary">
                                Your timing shouldn't be guesswork.
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-c-text-inverse/60 mt-6 text-lg max-w-lg mx-auto"
                        >
                            Know exactly when to leave. Every time.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="mt-10 flex flex-col items-center gap-4"
                        >
                            <button
                                type="button"
                                onClick={() => navigate('/search')}
                                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse font-semibold text-base shadow-lg transition-colors"
                            >
                                <Smartphone className="w-5 h-5" />
                                Get the iOS app
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-c-text-inverse/10 text-c-text-inverse/70 text-xs font-medium">
                                Coming summer 2026
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
