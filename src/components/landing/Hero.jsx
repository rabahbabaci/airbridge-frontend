import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Hero() {
    const navigate = useNavigate();
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-purple-50/40" />
            <div className="absolute top-20 right-0 w-[700px] h-[700px] bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full blur-3xl" />

            <div className="relative max-w-4xl mx-auto px-6 py-24 lg:py-36 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">AI Door-to-Gate Departure Engine</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-5">
                        Know exactly when to<br />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            leave home.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-gray-500 leading-relaxed max-w-xl mx-auto mb-10">
                        Door-to-gate departure timing powered by live traffic, TSA, and airport data.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                        <Button
                            size="lg"
                            className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-10 py-4 h-14 text-base shadow-lg shadow-gray-900/20 w-full sm:w-auto"
                            onClick={() => document.getElementById('engine-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        >
                            Test My Departure Time
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-full px-10 py-4 h-14 text-base border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
                            onClick={() => document.getElementById('engine-demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        >
                            <Play className="mr-2 w-4 h-4" />
                            View Live Preview
                        </Button>
                    </div>

                    {/* Positioning line */}
                    <p className="text-sm text-gray-400">
                        Not a traffic app —{' '}
                        <span className="text-blue-600 font-semibold">a door-to-gate engine.</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}