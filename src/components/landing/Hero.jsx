import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Plane, Car, Shield, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Animated phone mockup — crisp rendering
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
            style={{
                filter: 'drop-shadow(0 40px 80px var(--c-brand-primary-surface))',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'antialiased',
            }}
        >
            {/* Floating glow */}
            <div className="absolute inset-0 rounded-[44px] blur-3xl opacity-25 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--c-brand-primary), transparent)', transform: 'scale(0.85) translateY(20px)' }} />

            {/* Phone shell */}
            <div className="relative w-[280px] sm:w-[300px] bg-c-text-primary rounded-[44px] p-3 shadow-2xl border-[3px] border-c-text-primary">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-c-text-primary rounded-full z-10" />

                {/* Screen — explicit pixel rendering for crispness */}
                <div className="bg-c-ground-elevated rounded-[36px] overflow-hidden" style={{ minHeight: 520, imageRendering: 'auto' }}>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-4 pb-2">
                        <span className="text-[11px] font-semibold text-c-text-primary">9:41</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-3 h-2 border border-c-text-tertiary rounded-sm relative">
                                <div className="absolute inset-0.5 bg-c-text-primary rounded-sm" style={{ width: '70%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pb-6 space-y-2.5">
                        {/* Flight header */}
                        <div>
                            <p className="text-[10px] font-semibold text-c-text-secondary uppercase tracking-widest">UA 452 · Today</p>
                            <p className="text-xl font-black text-c-text-primary mt-0.5">
                                SFO <span className="text-c-text-secondary font-medium text-base">→</span> JFK
                            </p>
                            <p className="text-[10px] text-c-text-secondary">Departs 2:30 PM · Terminal 3</p>
                        </div>

                        {/* Transport & TSA row */}
                        <div className="flex gap-2">
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                className="flex-1 flex items-center gap-2 bg-c-confidence-surface rounded-xl px-3 py-2.5"
                            >
                                <div className="w-7 h-7 bg-c-confidence-surface rounded-full flex items-center justify-center shrink-0">
                                    <Car className="w-3.5 h-3.5 text-c-confidence" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-c-text-primary">Ride · 42 min</p>
                                    <p className="text-[9px] text-c-text-secondary">Traffic clear</p>
                                </div>
                            </motion.div>
                            <div className="flex-1 flex items-center gap-2 bg-c-brand-primary-surface rounded-xl px-3 py-2.5">
                                <div className="w-7 h-7 bg-c-brand-primary-surface rounded-full flex items-center justify-center shrink-0">
                                    <Shield className="w-3.5 h-3.5 text-c-brand-primary" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-c-text-primary">TSA · 12 min</p>
                                    <p className="text-[9px] text-c-text-secondary">Standard lane</p>
                                </div>
                            </div>
                        </div>

                        {/* Journey steps mini */}
                        <div className="bg-c-ground-sunken rounded-xl px-3 py-2.5">
                            <p className="text-[9px] text-c-text-secondary font-semibold uppercase tracking-wider mb-2">Door-to-Gate</p>
                            <div className="flex items-center gap-1 text-[9px] text-c-text-secondary font-medium">
                                <span className="bg-c-brand-primary-surface text-c-brand-primary px-1.5 py-0.5 rounded-full">🏠 Home</span>
                                <span>→</span>
                                <span className="bg-c-brand-primary-surface text-c-brand-primary px-1.5 py-0.5 rounded-full">✈️ Airport</span>
                                <span>→</span>
                                <span className="bg-c-brand-primary-surface text-c-brand-primary px-1.5 py-0.5 rounded-full">🛡️ TSA</span>
                                <span>→</span>
                                <span className="bg-c-confidence-surface text-c-confidence px-1.5 py-0.5 rounded-full">🚪 Gate</span>
                            </div>
                        </div>

                        {/* Arrive at gate + boarding */}
                        <div className="flex gap-2">
                            <div className="flex-1 bg-c-confidence-surface rounded-xl px-3 py-2.5 border border-c-confidence-surface">
                                <p className="text-[9px] text-c-text-secondary uppercase tracking-wider mb-0.5">Gate Arrival</p>
                                <p className="text-sm font-black text-c-confidence">12:48 PM</p>
                            </div>
                            <div className="flex-1 bg-c-ground-sunken rounded-xl px-3 py-2.5 border border-c-border-hairline">
                                <p className="text-[9px] text-c-text-secondary uppercase tracking-wider mb-0.5">Boarding</p>
                                <p className="text-sm font-black text-c-text-primary">1:15 PM</p>
                            </div>
                        </div>

                        {/* LEAVE BY hero */}
                        <motion.div
                            animate={{ boxShadow: pulse ? '0 0 0 4px var(--c-brand-primary-surface)' : '0 0 0 0px transparent' }}
                            transition={{ duration: 1 }}
                            className="rounded-2xl px-4 py-3.5 bg-c-brand-primary"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[9px] text-c-text-inverse/70 font-semibold uppercase tracking-wider">Leave Home By</p>
                                <span className="text-[9px] bg-c-ground-elevated/20 text-c-text-inverse px-1.5 py-0.5 rounded-full font-medium">97% Confident</span>
                            </div>
                            <motion.p
                                key={leaveTime}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl font-black text-c-text-inverse tracking-tight"
                            >
                                {leaveTime}
                            </motion.p>
                            <p className="text-[10px] text-c-text-inverse/60 mt-1">📍 Home · Stress-Free · 1h03m door-to-gate</p>
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
        { Icon: Plane,   top: '10%',  left: '4%',   size: 32, delay: 0,    opacity: 0.08 },
        { Icon: Clock,   top: '18%',  left: '87%',  size: 28, delay: 0.8,  opacity: 0.07 },
        { Icon: Car,     top: '68%',  left: '5%',   size: 26, delay: 1.2,  opacity: 0.07 },
        { Icon: Shield,  top: '72%',  left: '89%',  size: 28, delay: 0.4,  opacity: 0.07 },
        { Icon: MapPin,  top: '42%',  left: '2%',   size: 24, delay: 1.6,  opacity: 0.06 },
        { Icon: Plane,   top: '50%',  left: '92%',  size: 26, delay: 2.0,  opacity: 0.07 },
    ];

    return (
        <section className="relative min-h-screen flex items-center bg-c-brand-primary-surface overflow-hidden">

            {/* Floating travel icons — subtle, hidden on mobile for cleanliness */}
            <div className="hidden md:block">
                {floatingIcons.map(({ Icon, top, left, size, delay, opacity }, i) => (
                    <motion.div key={i}
                        className="absolute pointer-events-none"
                        style={{ top, left, opacity }}
                        animate={{ y: [0, -10, 0], rotate: [0, 6, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 5 + i * 0.7, delay, ease: 'easeInOut' }}
                    >
                        <Icon style={{ width: size, height: size }} className="text-c-brand-primary" />
                    </motion.div>
                ))}
            </div>

            {/* Soft glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--c-brand-primary-surface), transparent)', filter: 'blur(90px)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--c-brand-primary-surface), transparent)', filter: 'blur(70px)' }} />

            <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-24 w-full">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">

                    {/* LEFT */}
                    <div className="text-center lg:text-left">
                        {/* Beta pill */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 bg-c-ground-elevated border border-c-border-hairline"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-c-confidence" />
                            <span className="text-xs font-medium text-c-text-primary">Now accepting beta users</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-c-text-primary mb-4 tracking-tight" style={{ lineHeight: 1.08 }}>
                                <span className="block">Never Wait.</span>
                                <span className="block">Never Rush.</span>
                                <span className="block text-c-brand-primary">
                                    Just Board.{' '}
                                    <motion.span
                                        animate={{ x: [0, 8, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                        className="inline-block"
                                    >
                                        <Plane className="inline w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-c-brand-primary" />
                                    </motion.span>
                                </span>
                            </h1>
                        </motion.div>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            className="text-c-text-secondary text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 mb-10"
                        >
                            Door-to-gate departure timing. No guesswork.<br className="hidden sm:block" />
                            Powered by real-time airport intelligence.
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10 sm:mb-14"
                        >
                            <motion.button
                                onClick={() => navigate(createPageUrl('Engine'), { state: { newTrip: true } })}
                                className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-c-text-inverse font-bold text-base transition-all hover:scale-105 active:scale-100 bg-c-brand-primary shadow-lg"
                                animate={{ boxShadow: ['0 10px 40px var(--c-brand-primary-surface)', '0 10px 60px var(--c-brand-primary-surface)', '0 10px 40px var(--c-brand-primary-surface)'] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                            >
                                <Plane className="w-5 h-5" />
                                See My Departure Time
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </motion.div>

                        {/* Trust micro-copy */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex items-center gap-5 justify-center lg:justify-start"
                        >
                            <span className="flex items-center gap-1.5 text-xs text-c-text-secondary">
                                <CheckCircle className="w-3.5 h-3.5 text-c-confidence" />
                                Free during beta
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-c-text-secondary">
                                <CheckCircle className="w-3.5 h-3.5 text-c-confidence" />
                                No credit card required
                            </span>
                        </motion.div>
                    </div>

                    {/* RIGHT — Phone mockup */}
                    <div className="flex justify-center lg:justify-end">
                        <PhoneMockup />
                    </div>
                </div>

                {/* Scroll indicator — hidden on mobile */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="hidden md:flex absolute bottom-[-28px] left-1/2 -translate-x-1/2 flex-col items-center gap-2"
                >
                    <p className="text-[10px] text-c-text-secondary uppercase tracking-widest font-semibold">Scroll</p>
                    <motion.div
                        animate={{ scaleY: [1, 0.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-px h-8 bg-c-text-tertiary"
                    />
                </motion.div>
            </div>
        </section>
    );
}
