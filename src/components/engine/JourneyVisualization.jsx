import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Car, Train, Bus, User, Shield, Luggage, DoorOpen, CheckCircle2 } from 'lucide-react';

const transportIcons = { uber: Car, driving: Car, train: Train, bus: Bus, other: User };

const stepMeta = {
    home:     { icon: Home,         label: 'Leave Home',    color: '#3b82f6', glow: 'rgba(59,130,246,0.6)'  },
    travel:   { icon: Car,          label: 'En Route',      color: '#f59e0b', glow: 'rgba(245,158,11,0.6)'  },
    airport:  { icon: Plane,        label: 'Arrive Airport',color: '#06b6d4', glow: 'rgba(6,182,212,0.6)'   },
    baggage:  { icon: Luggage,      label: 'Baggage Drop',  color: '#f97316', glow: 'rgba(249,115,22,0.6)'  },
    security: { icon: Shield,       label: 'TSA Security',  color: '#a855f7', glow: 'rgba(168,85,247,0.6)'  },
    walk:     { icon: DoorOpen,     label: 'At the Gate',   color: '#3b82f6', glow: 'rgba(59,130,246,0.6)'  },
    gate:     { icon: CheckCircle2, label: 'Boarding',      color: '#22c55e', glow: 'rgba(34,197,94,0.6)'   },
};

// Steps that intentionally show NO time (just a motion indicator)
const NO_TIME_STEPS = new Set(['travel']);

// ── Loading ───────────────────────────────────────────────────────────────────
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
                setTimeout(onDone, 500);
            }
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-8 max-w-xs mx-auto text-center py-8"
        >
            <div className="relative w-20 h-20">
                <motion.div className="absolute inset-0 rounded-3xl"
                    animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 2 }}
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent)', filter: 'blur(16px)' }} />
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <motion.div animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}>
                        <Plane className="w-9 h-9 text-blue-400" />
                    </motion.div>
                </div>
            </div>

            <div className="h-6">
                <AnimatePresence mode="wait">
                    <motion.p key={msgIndex}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }} className="text-sm font-medium text-gray-300">
                        {loadingMessages[msgIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="w-52 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} />
            </div>
            <p className="text-xs text-gray-600">Building your door-to-gate plan...</p>
        </motion.div>
    );
}

// ── Step node ─────────────────────────────────────────────────────────────────
function StepNode({ stepId, time, dur, revealed, TransportIcon, stepNumber }) {
    const meta = stepMeta[stepId];
    const Icon = stepId === 'travel' ? TransportIcon : meta.icon;
    const showTime = !NO_TIME_STEPS.has(stepId);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 10 }}
            animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.3, y: revealed ? 0 : 10 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
            className="flex flex-col items-center gap-1.5 select-none"
            style={{ minWidth: 76 }}
        >
            {/* Bubble */}
            <motion.div
                animate={revealed ? {
                    boxShadow: [
                        `0 0 0px ${meta.glow}`,
                        `0 0 22px ${meta.glow}`,
                        `0 0 0px ${meta.glow}`,
                    ]
                } : {}}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${meta.color}1a, ${meta.color}40)`,
                    border: `2px solid ${meta.color}77`,
                }}
            >
                {/* Step number badge */}
                {stepNumber && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-20"
                        style={{ background: meta.color, color: '#000' }}>
                        {stepNumber}
                    </div>
                )}
                {/* Subtle inner shimmer for travel node */}
                {stepId === 'travel' && revealed && (
                    <motion.div
                        className="absolute inset-0"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut', repeatDelay: 0.6 }}
                        style={{ background: `linear-gradient(90deg, transparent, ${meta.color}33, transparent)` }}
                    />
                )}
                <Icon className="w-7 h-7 relative z-10" style={{ color: meta.color }} />
            </motion.div>

            {/* Label */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-center leading-tight mt-0.5">
                {meta.label}
            </p>

            {/* Time or motion badge */}
            {showTime && time ? (
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: revealed ? 1 : 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-sm font-bold text-white leading-none">
                    {time}
                </motion.p>
            ) : stepId === 'travel' && revealed ? (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="flex items-center gap-0.5 mt-0.5">
                    {[0, 1, 2].map(i => (
                        <motion.span key={i}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
                            className="block w-1 h-1 rounded-full"
                            style={{ background: meta.color }} />
                    ))}
                </motion.div>
            ) : null}

            {/* Duration */}
            {dur && !NO_TIME_STEPS.has(stepId) && (
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: revealed ? 1 : 0 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="text-[11px] font-semibold leading-none" style={{ color: meta.color }}>
                    {dur}
                </motion.p>
            )}

            {/* En Route: show dur as subtle label */}
            {stepId === 'travel' && dur && revealed && (
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="text-[10px]" style={{ color: `${meta.color}99` }}>
                    {dur}
                </motion.p>
            )}
        </motion.div>
    );
}

// ── Horizontal connector ──────────────────────────────────────────────────────
function HBar({ revealed, color, reverse, duration = 0.9 }) {
    return (
        <div className="flex items-center self-center flex-1 px-2" style={{ minWidth: 24 }}>
            <div className="w-full overflow-hidden rounded" style={{ height: 2 }}>
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: revealed ? 1 : 0 }}
                    transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{
                        height: 2,
                        width: '100%',
                        background: `linear-gradient(${reverse ? '270deg' : '90deg'}, ${color}00 0%, ${color} 100%)`,
                        transformOrigin: reverse ? 'right' : 'left',
                        borderRadius: 2,
                    }}
                />
            </div>
        </div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, barColor, barPct, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            className="rounded-xl p-3.5 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
            <p className="text-[9px] uppercase tracking-widest font-semibold text-gray-500">{label}</p>
            <p className="text-lg font-bold text-white leading-none">
                {value}<span className="text-xs font-semibold text-gray-500 ml-0.5">{unit}</span>
            </p>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (barPct || 0) / 100 }}
                    transition={{ delay: delay + 0.35, duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: barColor, transformOrigin: 'left', borderRadius: 2 }}
                />
            </div>
        </motion.div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function JourneyVisualization({ locked, steps, transport, profile, confidenceColorMap }) {
    const [phase, setPhase] = useState('idle');
    // revealedCount: how many steps have been revealed in sequence
    const [revealedCount, setRevealedCount] = useState(0);
    const prevLockedRef = useRef(false);
    const timerRefs = useRef([]);

    const TransportIcon = transportIcons[transport] || Car;
    const visibleSteps = steps.filter(s => s.id !== 'baggage' || s.visible);

    // Clear all pending timers
    const clearTimers = () => {
        timerRefs.current.forEach(t => clearTimeout(t));
        timerRefs.current = [];
    };

    useEffect(() => {
        if (locked && !prevLockedRef.current) {
            clearTimers();
            setPhase('loading');
            setRevealedCount(0);
        }
        if (!locked && prevLockedRef.current) {
            clearTimers();
            setPhase('idle');
            setRevealedCount(0);
        }
        prevLockedRef.current = locked;
        return clearTimers;
    }, [locked]);

    // Step interval: each node appears 900ms apart (slow & dramatic)
    const STEP_INTERVAL = 900;

    const handleLoadingDone = () => {
        setPhase('journey');
        setRevealedCount(0);
        visibleSteps.forEach((_, i) => {
            const t = setTimeout(() => {
                setRevealedCount(prev => prev + 1);
            }, i * STEP_INTERVAL + 300);
            timerRefs.current.push(t);
        });
    };

    const leaveStep = steps.find(s => s.id === 'home');
    const allRevealed = revealedCount >= visibleSteps.length && visibleSteps.length > 0;

    const isRevealed = (id) => {
        const idx = visibleSteps.findIndex(s => s.id === id);
        return idx !== -1 && revealedCount > idx;
    };

    // Bar between two steps: show when the LATER step is revealed
    const barRevealed = (laterStepId) => isRevealed(laterStepId);

    const row1ids = ['home', 'travel', 'airport'];
    const row2ids = ['baggage', 'security', 'walk', 'gate'];
    const row1 = visibleSteps.filter(s => row1ids.includes(s.id));
    const row2 = visibleSteps.filter(s => row2ids.includes(s.id));

    const homeStep     = steps.find(s => s.id === 'home');
    const securityStep = steps.find(s => s.id === 'security');
    const walkStep     = steps.find(s => s.id === 'walk');
    const baggageStep  = steps.find(s => s.id === 'baggage');

    const trafficVal = parseInt(homeStep?.dur) || 0;
    const tsaVal     = parseInt(securityStep?.dur) || 0;
    const walkVal    = parseInt(walkStep?.dur) || 0;
    const baggageVal = baggageStep?.visible ? (parseInt(baggageStep?.dur) || 0) : 0;
    const total      = steps[0]?.total || 0;
    const bufferVal  = total - trafficVal - tsaVal - walkVal - baggageVal;

    const confColor = profile?.color === 'green' ? '#22c55e' : profile?.color === 'amber' ? '#f59e0b' : '#3b82f6';

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
            <AnimatePresence mode="wait">

                {/* Idle */}
                {phase === 'idle' && (
                    <motion.div key="idle"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center text-center gap-6 max-w-sm mx-auto py-14"
                    >
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Plane className="w-9 h-9 text-gray-500" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 leading-snug">Your journey<br />starts here</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">Configure your trip on the left.<br />Your door-to-gate map will appear here.</p>
                        </div>
                        <div className="flex gap-2.5">
                            {[0, 1, 2].map(i => (
                                <motion.div key={i} animate={{ opacity: [0.2, 0.7, 0.2] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.35 }}
                                    className="w-2 h-2 rounded-full" style={{ background: 'rgba(59,130,246,0.5)' }} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Loading */}
                {phase === 'loading' && (
                    <LoadingSequence key="loading" onDone={handleLoadingDone} />
                )}

                {/* Journey */}
                {phase === 'journey' && (
                    <motion.div key="journey"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                        className="w-full flex flex-col gap-4"
                    >
                        {/* Top bar */}
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Door-to-Gate Journey</p>
                            <AnimatePresence>
                                {allRevealed && (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="text-[10px] text-green-400 font-medium flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                        Live & Reactive
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Hero card */}
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                            className="rounded-2xl px-5 py-4 flex items-center justify-between"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Leave Home At</p>
                                <span className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    {leaveStep?.time}
                                </span>
                                <p className="text-gray-500 text-[11px] mt-1">{steps[0]?.flightLabel} · {steps[0]?.total} min door-to-gate</p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ml-4 ${confidenceColorMap[profile?.color]?.badge}`}>
                                {profile?.confidenceScore}% Confident
                            </span>
                        </motion.div>

                        {/* Map */}
                        <div className="rounded-2xl px-5 pt-5 pb-6 overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

                            {/* ── Row 1: L → R ── */}
                            <div className="flex items-center">
                                {row1.map((s, i) => (
                                    <React.Fragment key={s.id}>
                                        <StepNode
                                            stepId={s.id} time={s.time} dur={s.dur}
                                            revealed={isRevealed(s.id)} TransportIcon={TransportIcon}
                                            stepNumber={visibleSteps.findIndex(vs => vs.id === s.id) + 1}
                                        />
                                        {i < row1.length - 1 && (
                                            <HBar
                                                revealed={barRevealed(row1[i + 1]?.id)}
                                                color={stepMeta[row1[i + 1]?.id]?.color || '#fff'}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* spacer between rows */}
                            <div style={{ height: 24 }} />

                            {/* ── Row 2: L → R (normal order, bars draw left-to-right) ── */}
                            <div className="flex items-center">
                                {row2.map((s, i) => {
                                    const nextS = row2[i + 1];
                                    return (
                                        <React.Fragment key={s.id}>
                                            <StepNode
                                                stepId={s.id} time={s.time} dur={s.dur}
                                                revealed={isRevealed(s.id)} TransportIcon={TransportIcon}
                                            />
                                            {nextS && (
                                                <HBar
                                                    revealed={isRevealed(s.id) && isRevealed(nextS.id)}
                                                    color={stepMeta[nextS.id]?.color || '#fff'}
                                                    reverse={false}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Seat ready pill */}
                        <AnimatePresence>
                            {allRevealed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.2 }}
                                    className="flex justify-center">
                                    <div className="flex items-center gap-2 px-7 py-2.5 rounded-full font-semibold text-sm"
                                        style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.14),rgba(34,197,94,0.06))', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                                        <motion.span animate={{ rotate: [0, 14, -14, 0] }} transition={{ repeat: Infinity, duration: 3.5 }}>
                                            <Plane className="w-4 h-4" />
                                        </motion.span>
                                        Seat Ready. Just Fly.
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Stat cards */}
                        <AnimatePresence>
                            {allRevealed && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="grid grid-cols-3 gap-2">
                                    <StatCard label="Transport" value={trafficVal} unit="m" barColor="#f59e0b" barPct={Math.min(trafficVal, 100)} delay={0.05} />
                                    <StatCard label="TSA Wait"  value={tsaVal}     unit="m" barColor="#a855f7" barPct={Math.min(tsaVal, 100)}     delay={0.15} />
                                    <StatCard label="Gate Walk" value={walkVal}    unit="m" barColor="#06b6d4" barPct={Math.min(walkVal * 3, 100)} delay={0.25} />
                                    <StatCard label="Baggage"   value={baggageVal} unit="m" barColor="#f97316" barPct={baggageVal === 0 ? 0 : Math.min(baggageVal * 5, 100)} delay={0.35} />
                                    <StatCard label="Buffer"    value={Math.max(bufferVal, 0)} unit="m" barColor="#22c55e" barPct={Math.min(bufferVal, 100)} delay={0.45} />
                                    <StatCard label="Confidence" value={profile?.confidenceScore} unit="%" barColor={confColor} barPct={profile?.confidenceScore} delay={0.55} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}