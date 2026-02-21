import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Car, Train, Bus, User, Shield, Luggage, DoorOpen, CheckCircle2 } from 'lucide-react';

const transportIcons = { uber: Car, driving: Car, train: Train, bus: Bus, other: User };

const stepMeta = {
    home:      { icon: Home,         label: 'Leave Home',     color: '#3b82f6', glow: 'rgba(59,130,246,0.6)'  },
    trainwalk: { icon: Train,        label: 'Walk to Train',  color: '#8b5cf6', glow: 'rgba(139,92,246,0.6)'  },
    airport:   { icon: Plane,        label: 'Arrive Airport', color: '#06b6d4', glow: 'rgba(6,182,212,0.6)'   },
    baggage:   { icon: Luggage,      label: 'Baggage Drop',   color: '#f97316', glow: 'rgba(249,115,22,0.6)'  },
    security:  { icon: Shield,       label: 'TSA Security',   color: '#a855f7', glow: 'rgba(168,85,247,0.6)'  },
    walk:      { icon: DoorOpen,     label: 'Gate Walk',      color: '#3b82f6', glow: 'rgba(59,130,246,0.6)'  },
    gate:      { icon: CheckCircle2, label: 'Gate',           color: '#22c55e', glow: 'rgba(34,197,94,0.6)'   },
};

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
function StepNode({ stepId, time, dur, terminal, mode, revealed, TransportIcon, stepNumber }) {
    // trainwalk can be bus or train mode
    const effectiveMeta = stepId === 'trainwalk' && mode === 'bus'
        ? { ...stepMeta.trainwalk, icon: Bus, label: 'Walk to Bus' }
        : stepMeta[stepId];
    const meta = effectiveMeta;
    const Icon = meta.icon;

    const primaryLabel = time;

    // Sub-label (context info)
    const subLabel = (() => {
        if (stepId === 'home') return null;
        if (stepId === 'airport') return terminal || null;
        if (stepId === 'gate') return null; // boarding time shown in card below
        if (stepId === 'walk') return null; // duration shown on bar
        if (stepId === 'trainwalk') return null; // duration shown on bar
        if (stepId === 'security') return dur;
        if (stepId === 'baggage') return dur;
        return null;
    })();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 10 }}
            animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.3, y: revealed ? 0 : 10 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
            className="flex flex-col items-center gap-1 select-none"
            style={{ minWidth: 72 }}
        >
            <motion.div
                animate={revealed ? {
                    boxShadow: [`0 0 0px ${meta.glow}`, `0 0 22px ${meta.glow}`, `0 0 0px ${meta.glow}`]
                } : {}}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${meta.color}1a, ${meta.color}40)`, border: `2px solid ${meta.color}77`, overflow: 'visible' }}
            >
                {stepNumber && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: revealed ? 1 : 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.2 }}
                        className="absolute w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg ring-2 ring-white"
                        style={{ 
                            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}ee)`, 
                            color: '#fff',
                            top: '-8px',
                            right: '-8px',
                            zIndex: 50
                        }}>
                        {stepNumber}
                    </motion.div>
                )}
                {stepId === 'travel' && revealed && (
                    <motion.div className="absolute inset-0"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut', repeatDelay: 0.6 }}
                        style={{ background: `linear-gradient(90deg, transparent, ${meta.color}33, transparent)` }}
                    />
                )}
                <Icon className="w-6 h-6 relative z-10" style={{ color: meta.color }} />
            </motion.div>

            {/* Step label */}
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 text-center leading-tight mt-0.5">
                {meta.label}
            </p>

            {/* Primary value */}
            {primaryLabel && (
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: revealed ? 1 : 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-xs font-bold text-white leading-none">
                    {primaryLabel}
                </motion.p>
            )}

            {/* Sub-label */}
            {subLabel && (
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: revealed ? 1 : 0 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="text-[10px] font-semibold leading-none text-center" style={{ color: `${meta.color}cc` }}>
                    {subLabel}
                </motion.p>
            )}
        </motion.div>
    );
}

// ── Horizontal connector with duration label on top ───────────────────────────
function HBar({ revealed, color, label, reverse, duration = 0.9 }) {
    return (
        <div className="flex flex-col flex-1 px-1 self-start" style={{ minWidth: 20, marginTop: 22 }}>
            {/* Label above bar */}
            <div className="h-4 flex items-center justify-center mb-1">
                <AnimatePresence>
                    {revealed && label && (
                        <motion.span
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="text-[9px] font-semibold whitespace-nowrap"
                            style={{ color }}>
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
            {/* Bar with arrow */}
            <div className="w-full flex items-center overflow-hidden rounded relative" style={{ height: 6 }}>
                {/* Main line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: revealed ? 1 : 0 }}
                    transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{
                        height: 2, width: '100%',
                        background: `linear-gradient(${reverse ? '270deg' : '90deg'}, ${color}00 0%, ${color} 100%)`,
                        transformOrigin: reverse ? 'right' : 'left',
                        borderRadius: 2,
                    }}
                />
                {/* Arrow head */}
                <AnimatePresence>
                    {revealed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: duration * 0.6, duration: 0.4 }}
                            className="absolute right-0 translate-x-1"
                            style={{ top: '50%', transform: `translateY(-50%) ${reverse ? 'scaleX(-1)' : ''}` }}
                        >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 4h6M4 2l2 2-2 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
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
export default function JourneyVisualization({ locked, steps, transport, profile, confidenceColorMap, onReady, boardingTime }) {
    const [phase, setPhase] = useState('idle');
    const [revealedCount, setRevealedCount] = useState(0);
    const prevLockedRef = useRef(false);
    const timerRefs = useRef([]);

    const TransportIcon = transportIcons[transport] || Car;
    // Remove travel (shown as bar label) and walk (shown as bar label between security→gate)
    const visibleSteps = steps.filter(s => {
        if (s.id === 'travel') return false;
        if (s.id === 'walk') return false;
        if (s.id === 'baggage') return s.visible;
        if (s.id === 'trainwalk') return s.visible;
        return true;
    });

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

    // When already in journey phase and transport/steps change, instantly reveal all steps
    const prevTransportRef = useRef(transport);
    useEffect(() => {
        if (phase === 'journey' && transport !== prevTransportRef.current) {
            clearTimers();
            setRevealedCount(visibleSteps.length);
            if (onReady) onReady();
        }
        prevTransportRef.current = transport;
    }, [transport, phase, visibleSteps.length]);

    const STEP_INTERVAL = 900;

    const handleLoadingDone = () => {
        setPhase('journey');
        setRevealedCount(0);
        visibleSteps.forEach((_, i) => {
            const t = setTimeout(() => {
                setRevealedCount(prev => prev + 1);
                if (i === visibleSteps.length - 1 && onReady) {
                    setTimeout(onReady, 400);
                }
            }, i * STEP_INTERVAL + 300);
            timerRefs.current.push(t);
        });
    };

    const leaveStep = steps.find(s => s.id === 'home');
    const allRevealed = revealedCount >= visibleSteps.length && visibleSteps.length > 0;

    // Format total minutes as "Xh Ym" if >= 60, else "Xm"
    const formatTotal = (mins) => {
        if (!mins) return '0m';
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const isRevealed = (id) => {
        const idx = visibleSteps.findIndex(s => s.id === id);
        return idx !== -1 && revealedCount > idx;
    };

    const getStepDur = (id) => steps.find(s => s.id === id)?.dur || null;

    const row1ids = ['home', 'trainwalk', 'airport'];
    const row2ids = ['baggage', 'security', 'gate'];
    const row1 = visibleSteps.filter(s => row1ids.includes(s.id));
    const row2 = visibleSteps.filter(s => row2ids.includes(s.id));

    const travelStep    = steps.find(s => s.id === 'travel');
    const securityStep  = steps.find(s => s.id === 'security');
    const walkStep      = steps.find(s => s.id === 'walk');
    const baggageStep   = steps.find(s => s.id === 'baggage');
    const trainwalkStep = steps.find(s => s.id === 'trainwalk');

    const trafficVal   = parseInt(travelStep?.dur) || 0;
    const tsaVal       = parseInt(securityStep?.dur) || 0;
    const walkVal      = parseInt(walkStep?.dur) || 0;
    const baggageVal   = baggageStep?.visible ? (parseInt(baggageStep?.dur) || 0) : 0;
    const trainwalkVal = trainwalkStep?.visible ? (parseInt(trainwalkStep?.dur) || 0) : 0;
    const total        = steps[0]?.total || 0;
    const bufferVal    = total - trafficVal - tsaVal - walkVal - baggageVal - trainwalkVal;

    const confColor = profile?.color === 'green' ? '#22c55e' : profile?.color === 'amber' ? '#f59e0b' : '#3b82f6';

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
            <AnimatePresence mode="wait">

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

                {phase === 'loading' && (
                    <LoadingSequence key="loading" onDone={handleLoadingDone} />
                )}

                {phase === 'journey' && (
                    <motion.div key="journey"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                        className="w-full flex flex-col gap-4"
                    >
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
                                <p className="text-gray-500 text-[11px] mt-1">{steps[0]?.flightLabel} · {formatTotal(steps[0]?.total)} door-to-gate</p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ml-4 ${confidenceColorMap[profile?.color]?.badge}`}>
                                {profile?.confidenceScore}% Confident
                            </span>
                        </motion.div>

                        {/* Map */}
                        <div className="rounded-2xl px-4 pt-5 pb-6 overflow-hidden relative"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            
                            {/* Road Background SVG */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 300">
                                <defs>
                                    <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.15" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
                                    </linearGradient>
                                </defs>
                                {/* Road path: starts left, curves right, U-turn, comes back narrow, continues for row 2 */}
                                <path d="M 50 50 L 650 50 Q 750 50 750 120 Q 750 190 300 190 Q 100 190 100 130 L 100 280" 
                                    fill="none" stroke="url(#roadGradient)" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Narrower center section for visual flow */}
                                <path d="M 150 190 Q 100 190 100 140 Q 100 120 150 120" 
                                    fill="none" stroke="url(#roadGradient)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>

                            {/* Row 1 */}
                            <div className="flex items-start">
                                {row1.map((s, i) => {
                                    const nextS = row1[i + 1];
                                    let barLabel = null;
                                    if (nextS?.id === 'trainwalk') {
                                        // Home → Walk to Train/Bus: show walk duration on bar
                                        barLabel = trainwalkStep?.dur || null;
                                    } else if (nextS?.id === 'airport') {
                                        // (Walk to Train/Bus or Home) → Airport: En Route label
                                        barLabel = `En Route · ${travelStep?.dur || ''}`;
                                    }
                                    return (
                                        <React.Fragment key={s.id}>
                                            <StepNode
                                                stepId={s.id} time={s.time} dur={s.dur} terminal={s.terminal}
                                                mode={s.mode}
                                                revealed={isRevealed(s.id)} TransportIcon={TransportIcon}
                                                stepNumber={visibleSteps.findIndex(vs => vs.id === s.id) + 1}
                                            />
                                            {nextS && (
                                                <HBar
                                                    revealed={isRevealed(s.id) && isRevealed(nextS.id)}
                                                    color={stepMeta[nextS.id]?.color || '#fff'}
                                                    label={barLabel}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            <div style={{ height: 20 }} />

                            {/* Row 2 */}
                            <div className="flex items-start">
                                {row2.map((s, i) => {
                                    const nextS = row2[i + 1];
                                    // security→gate: show gate walk time on bar
                                    let barLabel = null;
                                    if (s.id === 'security' && nextS?.id === 'gate') {
                                        barLabel = walkStep?.dur ? `${walkStep.dur} walking` : null;
                                    }
                                    return (
                                        <React.Fragment key={s.id}>
                                            <StepNode
                                                stepId={s.id} time={s.time} dur={s.dur}
                                                revealed={isRevealed(s.id)} TransportIcon={TransportIcon}
                                                stepNumber={visibleSteps.findIndex(vs => vs.id === s.id) + 1}
                                            />
                                            {nextS && (
                                                <HBar
                                                    revealed={isRevealed(s.id) && isRevealed(nextS.id)}
                                                    color={stepMeta[nextS.id]?.color || '#fff'}
                                                    label={barLabel}
                                                    reverse={false}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Gate arrival card */}
                        <AnimatePresence>
                            {allRevealed && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                                    style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)' }}>
                                    {/* Arrive at Gate */}
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Arrive at Gate</p>
                                        <span className="text-3xl font-bold" style={{ background: 'linear-gradient(90deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            {steps.find(s => s.id === 'gate')?.time}
                                        </span>
                                        <p className="text-gray-500 text-[10px] mt-1">Gate arrival</p>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px self-stretch" style={{ background: 'rgba(34,197,94,0.2)' }} />
                                    {/* Boarding time */}
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Boarding</p>
                                        <span className="text-3xl font-bold text-white">
                                            {boardingTime}
                                        </span>
                                        <p className="text-gray-500 text-[10px] mt-1">Flight departs</p>
                                    </div>
                                    <motion.div animate={{ rotate: [0, 14, -14, 0] }} transition={{ repeat: Infinity, duration: 3.5 }}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                                    <StatCard label="Transport"  value={trafficVal}  unit="m" barColor="#f59e0b" barPct={Math.min(trafficVal, 100)}  delay={0.05} />
                                    <StatCard label="TSA Wait"   value={tsaVal}      unit="m" barColor="#a855f7" barPct={Math.min(tsaVal, 100)}       delay={0.15} />
                                    <StatCard label="Gate Walk"  value={walkVal}     unit="m" barColor="#06b6d4" barPct={Math.min(walkVal * 3, 100)}  delay={0.25} />
                                    <StatCard label="Baggage"    value={baggageVal}  unit="m" barColor="#f97316" barPct={baggageVal === 0 ? 0 : Math.min(baggageVal * 5, 100)} delay={0.35} />
                                    <StatCard label="Buffer"     value={Math.max(bufferVal, 0)} unit="m" barColor="#22c55e" barPct={Math.min(bufferVal, 100)} delay={0.45} />
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