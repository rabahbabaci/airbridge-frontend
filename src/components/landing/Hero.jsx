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

                    <div className="px-5 pb-6 space-y-2.5">
                        {/* Flight header */}
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">UA 452 · Today</p>
                            <p className="text-xl font-black text-gray-900 mt-0.5">SFO → JFK</p>
                            <p className="text-[10px] text-gray-400">Departs 2:30 PM · Terminal 3</p>
                        </div>

                        {/* Transport & TSA row */}
                        <div className="flex gap-2">
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                className="flex-1 flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5"
                            >
                                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                    <Car className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-900">Uber · 42 min</p>
                                    <p className="text-[9px] text-gray-500">Traffic clear</p>
                                </div>
                            </motion.div>
                            <div className="flex-1 flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2.5">
                                <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-900">TSA · 12 min</p>
                                    <p className="text-[9px] text-gray-500">PreCheck open</p>
                                </div>
                            </div>
                        </div>

                        {/* Journey steps mini */}
                        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Door-to-Gate</p>
                            <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">🏠 Home</span>
                                <span>→</span>
                                <span className="bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full">✈️ Airport</span>
                                <span>→</span>
                                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">🛡️ TSA</span>
                                <span>→</span>
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🚪 Gate</span>
                            </div>
                        </div>

                        {/* Arrive at gate + boarding */}
                        <div className="flex gap-2">
                            <div className="flex-1 bg-green-50 rounded-xl px-3 py-2.5 border border-green-100">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Gate Arrival</p>
                                <p className="text-sm font-black text-green-600">12:48 PM</p>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Boarding</p>
                                <p className="text-sm font-black text-gray-700">2:30 PM</p>
                            </div>
                        </div>

                        {/* LEAVE BY hero */}
                        <motion.div
                            animate={{ boxShadow: pulse ? '0 0 0 4px rgba(99,102,241,0.2)' : '0 0 0 0px rgba(99,102,241,0)' }}
                            transition={{ duration: 1 }}
                            className="rounded-2xl px-4 py-3.5"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[9px] text-white/70 font-semibold uppercase tracking-wider">Leave Home By</p>
                                <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium">97% Confident</span>
                            </div>
                            <motion.p
                                key={leaveTime}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl font-black text-white tracking-tight"
                            >
                                {leaveTime}
                            </motion.p>
                            <p className="text-[10px] text-white/60 mt-1">📍 Home · Stress-Free · 1h 38m door-to-gate</p>
                        </motion.div>
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

    // Floating travel icons config
    const floatingIcons = [
        { Icon: Plane,   top: '12%',  left: '5%',   size: 22, delay: 0,    opacity: 0.12 },
        { Icon: Train,   top: '20%',  left: '88%',  size: 18, delay: 0.8,  opacity: 0.10 },
        { Icon: Car,     top: '70%',  left: '6%',   size: 16, delay: 1.2,  opacity: 0.09 },
        { Icon: Luggage, top: '75%',  left: '90%',  size: 18, delay: 0.4,  opacity: 0.10 },
        { Icon: Shield,  top: '45%',  left: '3%',   size: 15, delay: 1.6,  opacity: 0.08 },
        { Icon: MapPin,  top: '55%',  left: '93%',  size: 16, delay: 2.0,  opacity: 0.09 },
        { Icon: Clock,   top: '88%',  left: '30%',  size: 14, delay: 0.6,  opacity: 0.07 },
        { Icon: Plane,   top: '85%',  left: '65%',  size: 12, delay: 1.4,  opacity: 0.07 },
        { Icon: Luggage, top: '8%',   left: '50%',  size: 13, delay: 2.2,  opacity: 0.07 },
    ];

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #fafbff 0%, #f3f4ff 35%, #faf5ff 70%, #f8faff 100%)' }}>

            {/* Floating travel icons */}
            {floatingIcons.map(({ Icon, top, left, size, delay, opacity }, i) => (
                <motion.div key={i}
                    className="absolute pointer-events-none"
                    style={{ top, left, opacity }}
                    animate={{ y: [0, -10, 0], rotate: [0, 6, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 5 + i * 0.7, delay, ease: 'easeInOut' }}
                >
                    <Icon style={{ width: size, height: size, color: '#6366f1' }} />
                </motion.div>
            ))}

            {/* Soft glow blobs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-25 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', filter: 'blur(90px)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #c084fc, transparent)', filter: 'blur(70px)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, #818cf8, transparent)', filter: 'blur(80px)' }} />

            <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-16 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* LEFT */}
                    <div>
                        {/* Beta pill */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.10)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-gray-700">Now accepting beta users</span>
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
                            Door-to-gate departure timing. No guesswork.<br />
                            Powered by real-time airport intelligence.
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                            className="flex flex-wrap gap-3 mb-14"
                        >
                            <button
                                onClick={() => navigate(createPageUrl('Engine'))}
                                className="flex items-center gap-2 px-7 py-4 rounded-full text-white font-bold text-sm transition-all hover:scale-105 active:scale-100"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}
                            >
                                <Plane className="w-4 h-4" />
                                Calculate My Departure Time
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            </motion.div>

                            {/* Trust micro-copy */}
                            <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex items-center gap-5"
                            >
                            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                Free during beta
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                No credit card required
                            </span>
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
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
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