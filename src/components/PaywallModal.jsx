import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bell, MessageSquare, History, BarChart3, Car } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { isNative } from '@/utils/platform';
import { API_BASE } from '@/config';

/**
 * PaywallModal — shown when a user tries to view results after exhausting their
 * 3-trip free trial without an active subscription.
 *
 * Self-contained: fetches subscription status on open and bails out if the user
 * is already 'active'. Fetches /v1/trips/history aggregate to personalize the
 * accuracy stat. Posts to /v1/subscriptions/checkout and opens the returned
 * Stripe URL via @capacitor/browser on native or window.open on web.
 */
export default function PaywallModal({ open, onOpenChange, token }) {
    const [priceType, setPriceType] = useState('annual'); // 'monthly' | 'annual'
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [error, setError] = useState(null);
    const [stat, setStat] = useState(null); // { avg_accuracy_minutes, total_trips_with_feedback }

    // Reset state on each open
    useEffect(() => {
        if (open) {
            setError(null);
            setLoadingCheckout(false);
        }
    }, [open]);

    // Fetch personalized accuracy stat from trip history (best effort)
    useEffect(() => {
        if (!open || !token) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/v1/trips/history?limit=10&offset=0`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                if (data.avg_accuracy_minutes != null && data.total_trips_with_feedback > 0) {
                    setStat({
                        avg: data.avg_accuracy_minutes,
                        count: data.total_trips_with_feedback,
                    });
                }
            } catch (err) {
                console.error('PaywallModal stat fetch failed:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [open, token]);

    const handleCheckout = useCallback(async () => {
        if (!token) {
            setError('Please sign in to subscribe.');
            return;
        }
        setLoadingCheckout(true);
        setError(null);
        try {
            const successUrl = `${window.location.origin}/Settings?subscription=success`;
            const cancelUrl = `${window.location.origin}/Settings?subscription=cancel`;
            const res = await fetch(`${API_BASE}/v1/subscriptions/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    price_type: priceType,
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                }),
            });
            if (!res.ok) {
                throw new Error(`Checkout failed (${res.status})`);
            }
            const data = await res.json();
            if (!data.checkout_url) {
                throw new Error('Missing checkout URL');
            }
            // Open Stripe Checkout
            if (isNative()) {
                await Browser.open({ url: data.checkout_url });
            } else {
                window.open(data.checkout_url, '_blank');
            }
            // Close modal so the user can interact with Stripe (and Settings polling
            // will pick up the active subscription on return).
            onOpenChange(false);
        } catch (err) {
            console.error('Checkout failed:', err);
            setError("We couldn't start checkout. Please try again in a moment.");
        } finally {
            setLoadingCheckout(false);
        }
    }, [token, priceType, onOpenChange]);

    const monthlyPrice = '$4.99';
    const annualPrice = '$39.99';
    const annualMonthly = '$3.33'; // 39.99 / 12

    const personalizedHook = stat
        ? `On your last ${stat.count} trip${stat.count === 1 ? '' : 's'}, AirBridge was within ${Math.round(stat.avg)} min of actual.`
        : 'AirBridge gets you door-to-gate without the guesswork.';

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
                        className="relative w-full max-w-[420px] bg-card rounded-3xl border border-border shadow-2xl p-8 my-auto"
                    >
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>

                        <h2 className="text-xl font-bold text-foreground text-center mb-2">
                            Keep the full copilot
                        </h2>

                        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
                            {personalizedHook}
                        </p>

                        {/* Feature list */}
                        <ul className="space-y-2.5 mb-6">
                            <li className="flex items-start gap-3">
                                <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm text-foreground/80">Gate change alerts</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm text-foreground/80">SMS escalation when it&apos;s time to leave</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <History className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm text-foreground/80">Full trip history</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <BarChart3 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm text-foreground/80">Personal accuracy stats</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Car className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm text-foreground/80">One-tap rideshare &amp; navigation</span>
                            </li>
                        </ul>

                        {/* Pricing toggle */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={() => setPriceType('monthly')}
                                className={`rounded-2xl border-2 p-3 text-left transition-all ${
                                    priceType === 'monthly'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border bg-secondary/40 hover:border-muted-foreground/30'
                                }`}
                            >
                                <p className="text-xs font-medium text-muted-foreground">Monthly</p>
                                <p className="text-lg font-bold text-foreground">{monthlyPrice}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                            </button>
                            <button
                                onClick={() => setPriceType('annual')}
                                className={`rounded-2xl border-2 p-3 text-left transition-all relative ${
                                    priceType === 'annual'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border bg-secondary/40 hover:border-muted-foreground/30'
                                }`}
                            >
                                <span className="absolute -top-2 right-2 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                    SAVE 33%
                                </span>
                                <p className="text-xs font-medium text-muted-foreground">Annual</p>
                                <p className="text-lg font-bold text-foreground">{annualMonthly}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                                <p className="text-[10px] text-muted-foreground">{annualPrice} billed yearly</p>
                            </button>
                        </div>

                        {error && (
                            <p className="text-xs text-destructive text-center mb-3">{error}</p>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={loadingCheckout}
                            className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                            {loadingCheckout ? 'Starting checkout…' : 'Keep the full copilot'}
                        </button>

                        <button
                            onClick={() => onOpenChange(false)}
                            className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Continue with free
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
