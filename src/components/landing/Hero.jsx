import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plane, Car, Shield, CheckCircle, Clock, Train, Luggage, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Animated phone mockup
function PhoneMockup() {
    const [leaveTime] = useState('11:45 AM');
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const iv = setInterval(() => setPulse(p => !p), 2000);
        return () => clearInterval(iv);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
            style={{ filter: 'drop-shadow(0 40px 80px rgba(99,102,241,0.25))' }}
        >
            {/* Floating glow */}
            <div className="absolute inset-0 rounded-[44px] blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, #6366f1, #a855f7)', transform: 'scale(0.85) translateY(20px)' }} />

            {/* Phone shell */}
            <div className="relative w-[300px] bg-gray-900 rounded-[44px] p-3 shadow-2xl"
                style={{ border: '3px solid #1f2937' }}>
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full z-10" />

                {/* Screen */}
                <div className="bg-white rounded-[36px] overflow-hidden" style={{ minHeight: 560 }}>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-4 pb-2">
                        <span className="text-[11px] font-semibold text-gray-900">9:41</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-3 h-2 border border-gray-400 rounded-sm relative">
                                <div className="absolute inset-0.5 bg-gray-900 rounded-sm" style={{ width: '70%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pb-6 space-y-3">
                        {/* Flight header */}
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Upcoming Flight</p>
                            <p className="text-2xl font-bold text-gray-900 mt-0.5">SFO → JFK</p>
                        </div>

                        {/* Traffic card */}
                        <motion.div
                            animate={{ scale: [1, 1.01, 1] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3"
                        >
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Car className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Traffic Clear</p>
                                <p className="text-[11px] text-gray-500">32 min drive</p>
                            </div>
                        </motion.div>

                        {/* Flight details */}
                        <div className="bg-gray-50 rounded-2xl px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400">Departs</p>
                                    <p className="text-lg font-bold text-gray-900">2:30 PM</p>
                                </div>
                                <Plane className="w-5 h-5 text-indigo-400" />
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400">Arrives</p>
                                    <p className="text-lg font-bold text-gray-900">11:15 PM</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Terminal 3</p>
                        </div>

                        {/* TSA card */}
                        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <Shield className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">TSA: 12 min</p>
                                <p className="text-[11px] text-gray-500">PreCheck open</p>
                            </div>
                        </div>

                        {/* LEAVE BY hero */}
                        <motion.div
                            animate={{ boxShadow: pulse ? '0 0 0 4px rgba(99,102,241,0.2)' : '0 0 0 0px rgba(99,102,241,0)' }}
                            transition={{ duration: 1 }}
                            className="rounded-2xl px-4 py-4"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-3 h-3 rounded-full border-2 border-white/60 flex items-center justify-center">
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                </div>
                                <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Leave By</p>
                            </div>
                            <motion.p
                                key={leaveTime}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl font-black text-white tracking-tight"
                            >
                                {leaveTime}
                            </motion.p>
                            <p className="text-[11px] text-white/60 mt-1">📍 From Home</p>
                        </motion.div>

                        {/* On Track */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-semibold text-gray-900">On Track</span>
                            </div>
                            <span className="text-[11px] text-gray-500">2h 45m until departure</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function Hero() {
    const navigate = useNavigate();

    const stats = [
        { value: '97%', label: 'Max Confidence' },
        { value: '5 sec', label: 'To Your Answer' },
        { value: '6 vars', label: 'In Every Prediction' },
    ];

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f0f0ff 0%, #e8e8ff 40%, #f5f0ff 100%)' }}>

            {/* Subtle background circles */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', filter: 'blur(80px)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #c084fc, transparent)', filter: 'blur(60px)' }} />

            <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-16 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* LEFT */}
                    <div>
                        {/* Eyebrow */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(99,102,241,0.2)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Door-to-Gate Precision Engine</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <h1 className="text-6xl lg:text-7xl font-black text-gray-900 leading-[1.0] mb-4 tracking-tight">
                                Never Wait.<br />
                                Never Rush.<br />
                                <span className="text-indigo-600">Just Board.</span>
                                {' '}
                                <motion.span
                                    animate={{ x: [0, 8, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                    className="inline-block"
                                >
                                    <Plane className="inline w-12 h-12 text-indigo-600" />
                                </motion.span>
                            </h1>
                        </motion.div>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            className="text-gray-500 text-lg leading-relaxed max-w-md mb-10"
                        >
                            Real-time door-to-gate departure timing powered by live traffic, TSA wait data, and airport intelligence. One precise answer.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                            className="flex flex-wrap gap-3 mb-14"
                        >
                            <button
                                onClick={() => navigate(createPageUrl('Engine'))}
                                className="flex items-center gap-2 px-6 py-3.5 rounded-full text-white font-semibold text-sm transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}
                            >
                                Test My Departure Time
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => navigate(createPageUrl('Engine'))}
                                className="flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm text-gray-800 transition-all hover:bg-white"
                                style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(0,0,0,0.12)', backdropFilter: 'blur(8px)' }}
                            >
                                View Live Preview
                            </button>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex gap-10"
                            style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 24 }}
                        >
                            {stats.map((s, i) => (
                                <div key={i}>
                                    <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* RIGHT — Phone mockup */}
                    <div className="flex justify-center lg:justify-end">
                        <PhoneMockup />
                    </div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Scroll</p>
                    <motion.div
                        animate={{ scaleY: [1, 0.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-px h-8 bg-gray-400"
                    />
                </motion.div>
            </div>
        </section>
    );
}