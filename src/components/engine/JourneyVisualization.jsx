import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Home, Plane, Car, Train, Bus, User, Shield, Luggage, ArrowRight, CheckCircle2, Zap, AlertCircle } from 'lucide-react';

const transportIcons = { uber: Car, driving: Car, train: Train, bus: Bus, other: User };

const stepConfig = [
    { id: 'home',     label: 'Leave Home',     icon: Home,         color: '#3b82f6', row: 0, col: 0 },
    { id: 'travel',   label: 'En Route',        icon: Car,          color: '#8b5cf6', row: 0, col: 1 },
    { id: 'airport',  label: 'Arrive Airport',  icon: Plane,        color: '#6366f1', row: 1, col: 1 },
    { id: 'baggage',  label: 'Baggage Drop',    icon: Luggage,      color: '#f97316', row: 1, col: 0 },
    { id: 'security', label: 'TSA Security',    icon: Shield,       color: '#06b6d4', row: 2, col: 0 },
    { id: 'walk',     label: 'Gate Walk',       icon: ArrowRight,   color: '#14b8a6', row: 2, col: 1 },
    { id: 'gate',     label: 'Boarding',        icon: CheckCircle2, color: '#22c55e', row: 3, col: 1 },
];

function NodeBubble({ step, active, done, time, dur, delay, transportIcon }) {
    const Icon = step.id === 'travel' ? (transportIcon || Car) : step.icon;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2"
        >
            <motion.div
                animate={active ? { boxShadow: [`0 0 0px ${step.color}00`, `0 0 20px ${step.color}88`, `0 0 0px ${step.color}00`] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="relative"
            >
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500"
                    style={{
                        background: done || active
                            ? `linear-gradient(135deg, ${step.color}33, ${step.color}66)`
                            : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${done || active ? step.color + '88' : 'rgba(255,255,255,0.08)'}`,
                    }}
                >
                    <Icon className="w-5 h-5" style={{ color: done || active ? step.color : '#4b5563' }} />
                    {active && (
                        <motion.div
                            className="absolute inset-0 rounded-2xl"
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            style={{ background: `radial-gradient(circle, ${step.color}44, transparent)` }}
                        />
                    )}
                </div>
                {done && (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                    >
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                )}
            </motion.div>
            <div className="text-center">
                <p className="text-[11px] font-semibold" style={{ color: done || active ? '#e5e7eb' : '#4b5563' }}>
                    {step.label}
                </p>
                {time && (done || active) && (
                    <motion.p
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.3 }}
                        className="text-[10px] font-bold mt-0.5" style={{ color: step.color }}
                    >
                        {time}
                    </motion.p>
                )}
                {dur && (done || active) && (
                    <p className="text-[9px] text-gray-600 mt-0.5">{dur}</p>
                )}
            </div>
        </motion.div>
    );
}

function ConnectorLine({ visible, horizontal, delay, color = '#3b82f6' }) {
    if (!visible) return null;
    return (
        <div className={`flex items-center justify-center ${horizontal ? 'flex-row' : 'flex-col'}`}
            style={{ [horizontal ? 'width' : 'height']: horizontal ? '40px' : '32px', [horizontal ? 'height' : 'width']: '2px' }}>
            <motion.div
                initial={{ [horizontal ? 'scaleX' : 'scaleY']: 0 }}
                animate={{ [horizontal ? 'scaleX' : 'scaleY']: 1 }}
                transition={{ delay, duration: 0.5, ease: 'easeInOut' }}
                style={{
                    width: horizontal ? '100%' : '2px',
                    height: horizontal ? '2px' : '100%',
                    background: `linear-gradient(${horizontal ? '90deg' : '180deg'}, ${color}88, ${color})`,
                    transformOrigin: horizontal ? 'left' : 'top',
                    borderRadius: '2px',
                }}
            />
        </div>
    );
}

export default function JourneyVisualization({ locked, steps, transport, profile, confidenceColorMap }) {
    const [activeStep, setActiveStep] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const prevLockedRef = useRef(false);
    const TransportIcon = transportIcons[transport] || Car;

    const visibleSteps = steps.filter(s => s.id !== 'baggage' || s.visible);

    useEffect(() => {
        if (locked && !prevLockedRef.current) {
            // Full animation on first lock
            setActiveStep(-1);
            setCompletedSteps(new Set());
            let i = 0;
            const run = () => {
                if (i < visibleSteps.length) {
                    setActiveStep(i);
                    setCompletedSteps(prev => { const n = new Set(prev); if (i > 0) n.add(i - 1); return n; });
                    i++;
                    setTimeout(run, 900);
                } else {
                    setCompletedSteps(prev => { const n = new Set(prev); n.add(i - 1); return n; });
                    setActiveStep(-1);
                }
            };
            setTimeout(run, 300);
        }
        prevLockedRef.current = locked;
    }, [locked]);

    // Reactive micro-update when inputs change after locked
    useEffect(() => {
        if (!locked) return;
        // subtle ripple on active segments
    }, [steps, transport, profile]);

    if (!locked) {
        return (
            <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center gap-6 max-w-sm mx-auto"
            >
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-3xl bg-white/4 border border-white/8 flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <Plane className="w-9 h-9 text-gray-500" />
                </motion.div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2 leading-snug">Your journey<br />starts here</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">Configure your trip on the left.<br />Your door-to-gate timeline will appear here.</p>
                </div>
                <div className="flex gap-2 mt-2">
                    {[0.3, 0.5, 0.7].map((o, i) => (
                        <motion.div key={i} animate={{ opacity: [o, o + 0.3, o] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                            className="w-2 h-2 rounded-full bg-blue-500/40" />
                    ))}
                </div>
            </motion.div>
        );
    }

    const leaveStep = steps.find(s => s.id === 'home');
    const boardStep = steps.find(s => s.id === 'gate');

    // Layout: zigzag left-right rows
    // Row 0: home → travel (L→R)
    // Row 1: airport ← baggage (R→L, reversed)
    // Row 2: security → walk (L→R)
    // Row 3: gate (centered)
    const row0 = visibleSteps.filter(s => ['home', 'travel'].includes(s.id));
    const row1 = visibleSteps.filter(s => ['airport', 'baggage'].includes(s.id)).reverse();
    const row2 = visibleSteps.filter(s => ['security', 'walk'].includes(s.id));
    const row3 = visibleSteps.filter(s => s.id === 'gate');

    const allStepIds = visibleSteps.map(s => s.id);
    const isActive = (id) => activeStep >= 0 && allStepIds[activeStep] === id;
    const isDone = (id) => completedSteps.has(allStepIds.indexOf(id));

    const renderRow = (rowSteps, connector = 'right') => rowSteps.map((s, i) => (
        <React.Fragment key={s.id}>
            <NodeBubble
                step={s}
                active={isActive(s.id)}
                done={isDone(s.id) || completedSteps.size === visibleSteps.length}
                time={s.time}
                dur={s.dur}
                delay={allStepIds.indexOf(s.id) * 0.15}
                transportIcon={TransportIcon}
            />
            {i < rowSteps.length - 1 && (
                <ConnectorLine
                    visible={true}
                    horizontal={true}
                    delay={allStepIds.indexOf(s.id) * 0.15 + 0.4}
                    color={s.color}
                />
            )}
        </React.Fragment>
    ));

    const allDone = completedSteps.size >= visibleSteps.length || (locked && activeStep === -1 && completedSteps.size > 0);

    return (
        <motion.div
            key="journey"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl mx-auto flex flex-col gap-4"
        >
            {/* Hero time card */}
            <motion.div
                layout
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-1">Leave Home At</p>
                    <motion.span
                        key={leaveStep?.time}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                    >
                        {leaveStep?.time}
                    </motion.span>
                    <p className="text-gray-500 text-xs mt-1.5">{steps[0]?.flightLabel} · {steps[0]?.total} min door-to-gate</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <motion.span
                        key={profile?.confidenceScore}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border ${confidenceColorMap[profile?.color]?.badge}`}
                    >
                        {profile?.confidenceScore}% Confident
                    </motion.span>
                    {allDone && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                            Live & Reactive
                        </motion.span>
                    )}
                </div>
            </motion.div>

            {/* Zigzag journey path */}
            <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold">Door-to-Gate Journey</p>

                {/* Row 0: L → R */}
                <div className="flex items-start gap-2 justify-start">
                    {renderRow(row0)}
                    {row1.length > 0 && (
                        <ConnectorLine visible={true} horizontal={true} delay={0.6} color="#6366f1" />
                    )}
                </div>

                {/* Row 1: R → L (airport then baggage or just airport) */}
                {row1.length > 0 && (
                    <>
                        {/* vertical connector on right */}
                        <div className="flex justify-end pr-[52px]">
                            <ConnectorLine visible={true} horizontal={false} delay={0.8} color="#6366f1" />
                        </div>
                        <div className="flex items-start gap-2 justify-end flex-row-reverse">
                            {renderRow([...row1].reverse())}
                        </div>
                        {/* vertical connector on left */}
                        <div className="flex justify-start pl-[52px]">
                            <ConnectorLine visible={true} horizontal={false} delay={1.2} color="#06b6d4" />
                        </div>
                    </>
                )}

                {/* No baggage path: vertical connector from row0 down on right side then down left */}
                {row1.length === 0 && (
                    <>
                        <div className="flex justify-end pr-[52px]">
                            <ConnectorLine visible={true} horizontal={false} delay={0.8} color="#06b6d4" />
                        </div>
                    </>
                )}

                {/* Row 2: L → R */}
                {row2.length > 0 && (
                    <div className="flex items-start gap-2 justify-start">
                        {renderRow(row2)}
                        {row3.length > 0 && (
                            <ConnectorLine visible={true} horizontal={true} delay={1.6} color="#14b8a6" />
                        )}
                    </div>
                )}

                {/* Row 3: gate — right aligned (end of row 2) */}
                {row3.length > 0 && (
                    <div className="flex justify-end">
                        {/* vertical connector on right from row2 end */}
                        <div className="flex flex-col items-center gap-3 mr-[26px]">
                            <ConnectorLine visible={true} horizontal={false} delay={1.8} color="#22c55e" />
                            <NodeBubble
                                step={row3[0]}
                                active={isActive('gate')}
                                done={isDone('gate') || allDone}
                                time={row3[0].time}
                                dur={row3[0].dur}
                                delay={1.9}
                                transportIcon={TransportIcon}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Seat ready end state */}
            <AnimatePresence>
                {allDone && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-center py-3 rounded-xl"
                        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                            className="inline-block"
                        >
                            <Plane className="w-5 h-5 text-green-400 mx-auto mb-1" />
                        </motion.div>
                        <p className="text-green-400 font-semibold text-sm">Seat Ready. Just Fly.</p>
                        <p className="text-gray-600 text-xs mt-0.5">Engine is live — adjust inputs to recalibrate</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}