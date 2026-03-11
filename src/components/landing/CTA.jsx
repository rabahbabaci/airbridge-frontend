import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function CTA() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;
        
        setStatus('loading');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            setEmail('');
        }, 1500);
    };

    return (
        <section id="cta" className="py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-[2.5rem] overflow-hidden"
                >
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-full blur-3xl" />
                    
                    <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight"
                        >
                            Your Flight Is Scheduled.{' '}
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Your Departure Should Be Too.
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-400 mt-6 text-lg max-w-lg mx-auto"
                        >
                            Be the first to experience stress-free airport travel.
                        </motion.p>

                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            onSubmit={handleSubmit}
                            className="mt-10 max-w-md mx-auto"
                        >
                            {status === 'success' ? (
                                <div className="flex items-center justify-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    <span className="text-green-400 font-medium">You're on the list! We'll be in touch soon.</span>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 bg-white/10 border-white/10 text-white placeholder:text-gray-500 rounded-xl px-5 flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={status === 'loading'}
                                    />
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={status === 'loading' || !email}
                                        className="h-14 bg-white hover:bg-gray-100 text-gray-900 rounded-xl px-8 font-semibold shadow-lg shadow-white/10"
                                    >
                                        {status === 'loading' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Join the Beta
                                                <ArrowRight className="ml-2 w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </motion.form>

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-500 text-sm mt-6"
                        >
                            Free during beta · No credit card required · Built with feedback from frequent flyers
                        </motion.p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}