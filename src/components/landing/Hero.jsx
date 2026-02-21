import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plane, Car, Shield, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Animated phone mockup
function PhoneMockup() {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const iv = setInterval(() => setPulse(p => !p), 2500);
        return () => clearInterval(iv);
    }, []);

    const inputs = [
        { icon: Car,    label: 'Uber/Lyft',  value: '42 min',  sub: 'En route',     color: 'bg-blue-50',   iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'   },
        { icon: Shield, label: 'TSA Wait',   value: '12 min',  sub: 'PreCheck lane', color: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    ];

    const flow = [
        { emoji: '🏠', label: 'Home',    color: 'bg-blue-100 text-blue-700'    },
        { emoji: '✈️', label: 'Airport', color: 'bg-cyan-100 text-cyan-700'    },
        { emoji: '🛂', label: 'TSA',     color: 'bg-violet-100 text-violet-700' },
        { emoji: '🎯', label: 'Gate',    color: 'bg-green-100 text-green-700'  },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
            style={{ filter: 'drop-shadow(0 40px 80px rgba(99,102,241,0.25))' }}
        >
            {/* Glow */}
            <div className="absolute inset-0 rounded-[44px] blur-3xl opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #6366f1, #a855f7)', transform: 'scale(0.85) translateY(20px)' }} />

            {/* Phone shell */}
            <div className="relative w-[300px] bg-gray-900 rounded-[44px] p-3 shadow-2xl"
                style={{ border: '3px solid #1f2937' }}>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full z-10" />

                <div className="bg-white rounded-[36px] overflow-hidden" style={{ minHeight: 540 }}>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-4 pb-2">
                        <span className="text-[11px] font-semibold text-gray-900">9:41</span>
                        <div className="w-3 h-2 border border-gray-400 rounded-sm relative">
                            <div className="absolute inset-0.5 bg-gray-900 rounded-sm" style={{ width: '70%' }} />
                        </div>
                    </div>

                    <div className="px-5 pb-6 space-y-3">
                        {/* Flight header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">UA 452 · Today</p>
                                <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight">SFO → JFK</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Departs 2:30 PM · Terminal 3</p>
                            </div>
                            <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full mt-1">91% Confidence</span>
                        </div>

                        {/* Inputs row */}
                        <div className="flex gap-2">
                            {inputs.map(({ icon: Icon, label, value, sub, color, iconBg, iconColor }) => (
                                <div key={label} className={`flex-1 flex items-center gap-2 ${color} rounded-xl px-2.5 py-2`}>
                                    <div className={`w-6 h-6 ${iconBg} rounded-full flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-3 h-3 ${iconColor}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-800 leading-tight">{value}</p>
                                        <p className="text-[9px] text-gray-500 leading-tight">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Door-to-gate flow */}
                        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Door-to-Gate</p>
                            <div className="flex items-center justify-between">
                                {flow.map((step, i) => (
                                    <React.Fragment key={step.label}>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${step.color}`}>
                                                {step.emoji}
                                            </span>
                                            <span className="text-[8px] text-gray-500 font-medium">{step.label}</span>
                                        </div>
                                        {i < flow.length - 1 && (
                                            <div className="flex-1 h-px bg-gray-200 mx-1 mb-3" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* LEAVE HOME AT — hero card */}
                        <motion.div
                            animate={{ boxShadow: pulse ? '0 0 0 4px rgba(99,102,241,0.18)' : '0 0 0 0px rgba(99,102,241,0)' }}
                            transition={{ duration: 1.2 }}
                            className="rounded-2xl px-4 py-4"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                        >
                            <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wider mb-1">Leave Home At</p>
                            <p className="text-4xl font-black text-white tracking-tight leading-none">11:45 AM</p>
                            <p className="text-[10px] text-white/50 mt-2">Buffer included: 18 min</p>
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

    // Floating travel icons config — only left half, subtle
    const floatingIcons = [
        { Icon: Plane,   top: '10%',  left: '4%',   size: 18, delay: 0,    opacity: 0.09 },
        { Icon: Car,     top: '60%',  left: '5%',   size: 15, delay: 1.2,  opacity: 0.07 },
        { Icon: Shield,  top: '38%',  left: '2%',   size: 14, delay: 1.6,  opacity: 0.07 },
        { Icon: MapPin,  top: '80%',  left: '22%',  size: 13, delay: 2.0,  opacity: 0.06 },
        { Icon: Clock,   top: '20%',  left: '30%',  size: 12, delay: 0.6,  opacity: 0.06 },
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