import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/config';

const DISMISS_PREFIX = 'airbridge_feedback_dismissed_';

function isDismissed(tripId) {
    if (!tripId) return false;
    try {
        return localStorage.getItem(DISMISS_PREFIX + tripId) === '1';
    } catch {
        return false;
    }
}

function markDismissed(tripId) {
    if (!tripId) return;
    try {
        localStorage.setItem(DISMISS_PREFIX + tripId, '1');
    } catch {}
}

/**
 * FeedbackPrompt — modal asking the user how the trip went after a tracked
 * trip auto-completes. Triggered globally on app mount by checking
 * /v1/trips/history for the first completed trip without feedback.
 *
 * Self-mounted: requires no props. Reads token + isAuthenticated from
 * AuthContext, finds the first eligible trip, and renders nothing if none
 * is pending.
 */
export default function FeedbackPrompt() {
    const { token, isAuthenticated } = useAuth();

    const [pendingTrip, setPendingTrip] = useState(null); // trip object or null
    const [open, setOpen] = useState(false);

    // Form state
    const [followed, setFollowed] = useState(null); // true | false | null
    const [minutesAtGate, setMinutesAtGate] = useState('');
    const [tsaWait, setTsaWait] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successStat, setSuccessStat] = useState(null); // avg_accuracy_minutes after submit

    // Find first eligible trip on mount
    useEffect(() => {
        if (!isAuthenticated || !token) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/v1/trips/history?limit=10&offset=0`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const trips = Array.isArray(data.trips) ? data.trips : [];
                const eligible = trips.find(t =>
                    t?.status === 'complete'
                    && t?.feedback_requested_at
                    && !t?.feedback_submitted_at // belt + braces in case backend exposes it
                    && !isDismissed(t.trip_id)
                );
                if (cancelled || !eligible) return;
                setPendingTrip(eligible);
                setOpen(true);
            } catch (err) {
                console.error('FeedbackPrompt history fetch failed:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, token]);

    const handleDismiss = useCallback(() => {
        markDismissed(pendingTrip?.trip_id);
        setOpen(false);
    }, [pendingTrip]);

    const handleSubmit = useCallback(async () => {
        if (submitting || !pendingTrip || !token) return;
        if (followed == null) {
            setError('Please answer whether you followed our recommendation.');
            return;
        }
        const gateMinutesNum = parseInt(minutesAtGate, 10);
        if (isNaN(gateMinutesNum) || gateMinutesNum < 0) {
            setError('Please enter how many minutes you were at the gate.');
            return;
        }
        const tsaWaitNum = tsaWait.trim() === '' ? null : parseInt(tsaWait, 10);
        if (tsaWait.trim() !== '' && (isNaN(tsaWaitNum) || tsaWaitNum < 0)) {
            setError('TSA wait must be a number of minutes (or leave blank).');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const body = {
                trip_id: pendingTrip.trip_id,
                followed_recommendation: followed,
                minutes_at_gate: gateMinutesNum,
            };
            if (tsaWaitNum != null) body.actual_tsa_wait_minutes = tsaWaitNum;

            const res = await fetch(`${API_BASE}/v1/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`Feedback failed (${res.status})`);
            const data = await res.json();
            // Mark dismissed so we don't re-prompt the same trip even if user
            // closes without seeing the success state.
            markDismissed(pendingTrip.trip_id);
            setSuccessStat(data?.avg_accuracy_minutes ?? null);
        } catch (err) {
            console.error('Feedback submit failed:', err);
            setError("We couldn't submit your feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }, [submitting, pendingTrip, token, followed, minutesAtGate, tsaWait]);

    const handleClose = () => {
        if (successStat != null) markDismissed(pendingTrip?.trip_id);
        setOpen(false);
    };

    if (!pendingTrip) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="relative w-full max-w-[400px] bg-card rounded-3xl border border-border shadow-2xl p-7 my-auto"
                    >
                        <button
                            onClick={successStat != null ? handleClose : handleDismiss}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Success state */}
                        {successStat != null ? (
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-7 h-7 text-emerald-600" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground mb-2">Thanks for the feedback</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                    AirBridge was within {Math.round(successStat)} min on average across your tracked trips.
                                </p>
                                <button
                                    onClick={handleClose}
                                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Form state */}
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground text-center mb-1">
                                    How did your trip go?
                                </h2>
                                <p className="text-xs text-muted-foreground text-center mb-6">
                                    {pendingTrip.flight_number ? `${pendingTrip.flight_number} · ` : ''}
                                    {pendingTrip.departure_date || ''}
                                </p>

                                {/* Q1: followed recommendation */}
                                <div className="mb-5">
                                    <p className="text-sm font-medium text-foreground mb-2">Did you follow our recommendation?</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setFollowed(true)}
                                            className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                followed === true
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                            }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => setFollowed(false)}
                                            className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                followed === false
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                            }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                {/* Q2: minutes at gate */}
                                <div className="mb-5">
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                        How many minutes were you at the gate before boarding?
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        value={minutesAtGate}
                                        onChange={e => setMinutesAtGate(e.target.value)}
                                        placeholder="e.g. 25"
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                {/* Q3: TSA wait (optional) */}
                                <div className="mb-5">
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                        How long did TSA actually take? <span className="text-muted-foreground font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        value={tsaWait}
                                        onChange={e => setTsaWait(e.target.value)}
                                        placeholder="Minutes"
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-foreground text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                {error && (
                                    <p className="text-xs text-destructive text-center mb-3">{error}</p>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                                >
                                    {submitting ? 'Submitting…' : 'Submit feedback'}
                                </button>

                                <button
                                    onClick={handleDismiss}
                                    className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Not now
                                </button>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
