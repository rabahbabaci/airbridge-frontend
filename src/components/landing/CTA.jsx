import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Smartphone } from 'lucide-react';
import WaitlistModal from './WaitlistModal';

export default function CTA() {
    const navigate = useNavigate();
    const [waitlistOpen, setWaitlistOpen] = useState(false);

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
                            className="text-white/85 mt-6 text-lg max-w-lg mx-auto"
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
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium">
                                Coming summer 2026
                            </span>
                            {/* Secondary path: users who aren't ready to commit to install
                               can drop their info and get an email at launch. Subordinate
                               text-link treatment — less visual weight than the primary. */}
                            <button
                                type="button"
                                onClick={() => setWaitlistOpen(true)}
                                className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white underline-offset-4 hover:underline transition-colors"
                            >
                                Not ready? Join the waitlist
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
        </section>
    );
}
