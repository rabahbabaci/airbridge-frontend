import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Play, ArrowRight, Clock, Plane, MapPin, CheckCircle2 } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50" />
            <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-gray-600">Now accepting beta users</span>
                        </div>

                        <h1 className="leading-tight">
                            <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-4">
                                Perfect Timing.
                            </div>
                            <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-600 mb-6">
                                Seat Ready.
                            </div>
                            <div className="text-5xl sm:text-6xl lg:text-7xl font-bold flex items-center gap-4">
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Just Fly
                                </span>
                                <Plane className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-blue-600" />
                            </div>
                        </h1>

                        <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-lg">
                            AirBridge tells you exactly when to leave for the airport — and guarantees it.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <Button
                                size="lg"
                                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 h-14 text-base shadow-lg shadow-gray-900/20"
                                onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            >
                                Get Early Access
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full px-8 h-14 text-base border-gray-200 hover:bg-gray-50"
                                onClick={() => document.getElementById('engine-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            >
                                <Play className="mr-2 w-4 h-4" />
                                Live Preview
                            </Button>
                        </div>

                        <div className="mt-12 flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Free during beta
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                No credit card required
                            </div>
                        </div>
                    </motion.div>

                    {/* Right - App Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative mx-auto w-[280px] sm:w-[320px]">
                            {/* Phone frame */}
                            <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-gray-900/30">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl" />
                                
                                {/* Screen */}
                                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                                    <div className="p-6 pb-8">
                                        {/* Status bar */}
                                        <div className="flex justify-between items-center text-xs text-gray-500 mb-6">
                                            <span>9:41</span>
                                            <div className="flex gap-1">
                                                <div className="w-4 h-2 bg-gray-300 rounded-sm" />
                                                <div className="w-6 h-2 bg-green-500 rounded-sm" />
                                            </div>
                                        </div>

                                        {/* App content */}
                                        <div className="space-y-6">
                                            {/* Header */}
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Upcoming Flight</p>
                                                <h3 className="text-lg font-semibold text-gray-900 mt-1">SFO → JFK</h3>
                                            </div>

                                            {/* Flight card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Plane className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-medium">UA 1234</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">Terminal 3</span>
                                                </div>
                                                
                                                <div className="flex items-center justify-between text-sm">
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Departs</p>
                                                        <p className="font-semibold">2:30 PM</p>
                                                    </div>
                                                    <div className="flex-1 mx-4 border-t border-dashed border-gray-300 relative">
                                                        <div className="absolute left-1/2 -translate-x-1/2 -top-2 bg-gray-50 px-2">
                                                            <Plane className="w-3 h-3 text-gray-400 rotate-90" />
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-500 text-xs">Arrives</p>
                                                        <p className="font-semibold">11:15 PM</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Leave time */}
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs uppercase tracking-wider opacity-90">Leave by</span>
                                                </div>
                                                <p className="text-3xl font-bold">11:45 AM</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="text-xs opacity-90">From: Home</span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-sm font-medium text-green-700">On Track</span>
                                                </div>
                                                <span className="text-xs text-green-600">2h 45m until departure</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating badges */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-lg shadow-gray-200/50 p-3 border"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-xs">🚗</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">Traffic Clear</p>
                                        <p className="text-xs text-gray-500">32 min drive</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 }}
                                className="absolute -right-4 top-1/2 bg-white rounded-xl shadow-lg shadow-gray-200/50 p-3 border"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="text-xs">🛡️</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">TSA: 12 min</p>
                                        <p className="text-xs text-gray-500">PreCheck open</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}