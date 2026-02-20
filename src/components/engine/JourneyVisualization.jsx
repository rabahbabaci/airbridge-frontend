import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Car, Train, Bus, User, Shield, Luggage, Navigation, CheckCircle2 } from 'lucide-react';

const transportIcons = { uber: Car, driving: Car, train: Train, bus: Bus, other: User };

const stepIconMap = {
    home:     Home,
    travel:   Car,
    airport:  Plane,
    baggage:  Luggage,
    security: Shield,
    walk:     Navigation,
    gate:     CheckCircle2,
};

// ── Loading sequence ─────────────────────────────────────────────────────────
const loadingMessages = [
    'Scanning live traffic...',
    'Checking TSA wait times...',
    'Calculating gate walk...',
    'Applying confidence buffer...',
    'Locking your departure time...',
];

function LoadingSequence({ onDone }) {
    const [msgIndex, setMsgIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const total = loadingMessages.length;
        let current = 0;
        const interval = setInterval(() => {
            current++;
            setMsgIndex(Math.min(current, total - 1));
            setProgress(Math.min((current / total) * 100, 100));
            if (current >= total) {
                clearInterval(interval);
                setTimeout(onDone, 400);
            }
        }, 480);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-7 max-w-xs mx-auto text-center"
        >
            <div className="relative w-20 h-20">
                <motion.div
                    className="absolute inset-0 rounded-3xl"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent)', filter: 'blur(12px)' }}
                />
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0], y: [0, -3, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                        <Plane className="w-9 h-9 text-blue-400" />
                    </motion.div>
                </div>
            </div>

            <div className="h-6">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={msgIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="text-sm font-medium text-gray-300"
                    >
                        {loadingMessages[msgIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                />
            </div>

            <p className="text-xs text-gray-600">Building your door-to-gate plan...</p>
        </motion.div>
    );
}

// ── Timeline row ─────────────────────────────────────────────────────────────
function TimelineRow({ stepId, label, color, active, done, time, dur, delay, isLast, TransportIcon }) {
    const IconComponent = stepId === 'travel' ? TransportIcon : stepIconMap[stepId];
    if (!IconComponent) return null;

    const lit = done || active;

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.35, ease: 'easeOut' }}
            className="flex items-start gap-4"
        >
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center shrink-0" style={{ width: 44 }}>
                <motion.div
                    animate={active ? { boxShadow: [`0 0 0px ${color}00`, `0 0 16px ${color}99`, `0 0 0px ${color}00`] } : {}}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0"
                    style={{
                        background: lit ? `linear-gradient(135deg, ${color}30, ${color}60)` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${lit ? color + '99' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.4s ease',
                    }}
                >
                    <IconComponent className="w-5 h-5" style={{ color: lit ? color : '#374151' }} />
                    {active && (
                        <motion.div
                            className="absolute inset-0 rounded-2xl"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.4 }}
                            style={{ background: `radial-gradient(circle, ${color}44, transparent)` }}
                        />
                    )}
                    {done && (
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                        >
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </motion.div>
                    )}
                </motion.div>

                {/* Vertical connector */}
                {!isLast && (
                    <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: lit ? 1 : 0.3 }}
                        transition={{ delay: delay + 0.3, duration: 0.4 }}
                        className="mt-1 w-px flex-1 min-h-[20px]"
                        style={{
                            background: lit
                                ? `linear-gradient(180deg, ${color}88, ${color}22)`
                                : 'rgba(255,255,255,0.06)',
                            transformOrigin: 'top',
                        }}
                    />
                )}
            </div>

            {/* Text */}
            <div className="flex-1 flex items-start justify-between pb-5 min-w-0">
                <div>
                    <p className="text-sm font-semibold leading-tight"
                        style={{ color: lit ? '#f3f4f6' : '#374151' }}>
                        {label}
                    </p>
                    {dur && (
                        <p className="text-[11px] mt-0.5" style={{ color: lit ? color : '#4b5563' }}>{dur}</p>
                    )}
                </div>
                {time && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: lit ? 1 : 0.2 }}
                        transition={{ delay: delay + 0.2 }}
                        className="text-sm font-bold shrink-0 ml-3"
                        style={{ color: lit ? '#f9fafb' : '#374151' }}
                    >
                        {time}
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function JourneyVisualization({ locked, steps, transport, profile, confidenceColorMap }) {
    const [phase, setPhase] = useState('idle');
    const [activeStep, setActiveStep] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const prevLockedRef = useRef(false);

    const TransportIcon = transportIcons[transport] || Car;
    const visibleSteps = steps.filter(s => s.id !== 'baggage' || s.visible);

    useEffect(() => {
        if (locked && !prevLockedRef.current) {
            setPhase('loading');
            setActiveStep(-1);
            setCompletedSteps(new Set());
        }
        if (!locked && prevLockedRef.current) {
            setPhase('idle');
            setActiveStep(-1);
            setCompletedSteps(new Set());
        }
        prevLockedRef.current = locked;
    }, [locked]);

    const handleLoadingDone = () => {
        setPhase('journey');
        let i = 0;
        const run = () => {
            if (i < visibleSteps.length) {
                const idx = i;
                setActiveStep(idx);
                setCompletedSteps(prev => { const n = new Set(prev); if (idx > 0) n.add(idx - 1); return n; });
                i++;
                setTimeout(run, 700);
            } else {
                setCompletedSteps(prev => { const n = new Set(prev); n.add(i - 1); return n; });
                setActiveStep(-1);
            }
        };
        setTimeout(run, 150);
    };

    const isActive = (idx) => activeStep === idx;
    const isDone = (idx) => completedSteps.has(idx);
    const allDone = completedSteps.size >= visibleSteps.length && visibleSteps.length > 0;

    const leaveStep = steps.find(s => s.id === 'home');

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
            <AnimatePresence mode="wait">

                {/* ── Idle ── */}
                {phase === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center text-center gap-6 max-w-sm mx-auto py-8"
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <Plane className="w-9 h-9 text-gray-500" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 leading-snug">Your journey<br />starts here</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">Configure your trip on the left.<br />Your door-to-gate timeline will appear here.</p>
                        </div>
                        <div className="flex gap-2">
                            {[0.3, 0.5, 0.7].map((o, i) => (
                                <motion.div key={i} animate={{ opacity: [o, o + 0.3, o] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                                    className="w-2 h-2 rounded-full" style={{ background: 'rgba(59,130,246,0.4)' }} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Loading ── */}
                {phase === 'loading' && (
                    <LoadingSequence key="loading" onDone={handleLoadingDone} />
                )}

                {/* ── Journey ── */}
                {phase === 'journey' && (
                    <motion.div
                        key="journey"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex flex-col gap-4"
                    >
                        {/* Hero card */}
                        <div className="rounded-2xl p-5 flex items-center justify-between"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-1">Leave Home At</p>
                                <motion.span
                                    key={leaveStep?.time}
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent block"
                                >
                                    {leaveStep?.time}
                                </motion.span>
                                <p className="text-gray-500 text-xs mt-1.5">{steps[0]?.flightLabel} · {steps[0]?.total} min door-to-gate</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${confidenceColorMap[profile?.color]?.badge}`}>
                                    {profile?.confidenceScore}% Confident
                                </span>
                                {allDone && (
                                    <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                        Live & Reactive
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Vertical timeline */}
                        <div className="rounded-2xl px-5 pt-5 pb-2"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold mb-4">Door-to-Gate Journey</p>

                            {visibleSteps.map((s, i) => (
                                <TimelineRow
                                    key={s.id}
                                    stepId={s.id}
                                    label={s.label}
                                    color={s.color}
                                    active={isActive(i)}
                                    done={isDone(i) || allDone}
                                    time={s.time}
                                    dur={s.dur}
                                    delay={i * 0.08}
                                    isLast={i === visibleSteps.length - 1}
                                    TransportIcon={TransportIcon}
                                />
                            ))}
                        </div>

                        {/* End state */}
                        <AnimatePresence>
                            {allDone && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="text-center py-4 rounded-xl"
                                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                                >
                                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="inline-block">
                                        <Plane className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                    </motion.div>
                                    <p className="text-green-400 font-semibold text-sm">Seat Ready. Just Fly.</p>
                                    <p className="text-gray-600 text-xs mt-0.5">Engine is live — adjust inputs to recalibrate</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}