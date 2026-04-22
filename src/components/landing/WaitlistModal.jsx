import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * WaitlistModal — landing-page-only "Join the Waitlist" form.
 *
 * Captures name + email + flights-per-year and POSTs JSON to Formspree
 * (https://formspree.io/f/xkokqpdo, configured to notify 4rabah@gmail.com).
 * The `email` field is intentionally named exactly "email" (lowercase)
 * so Formspree's auto-reply feature can detect it — auto-reply itself
 * is configured in the Formspree dashboard, not in code.
 *
 * States: idle → submitting → success (or error with form intact).
 * Error preserves typed data so the user can retry without re-entering.
 * Success replaces the form with a confirmation message; modal stays
 * open with a Close button (no auto-dismiss — the user reads the
 * confirmation then actively closes).
 *
 * No Capacitor/native guard needed: this component is imported only by
 * landing-page components (CTA, Footer) which don't render in the
 * mobile app shell (Home.jsx is the landing container; Capacitor
 * users land on Search directly via TripAwareHome).
 */

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xkokqpdo';

export default function WaitlistModal({ open, onOpenChange }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [flightsPerYear, setFlightsPerYear] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState(null);

    const resetForm = () => {
        setName('');
        setEmail('');
        setFlightsPerYear('');
        setStatus('idle');
        setErrorMessage(null);
    };

    const handleOpenChange = (nextOpen) => {
        if (!nextOpen) {
            // Reset on close so re-opens start clean (even after a success).
            resetForm();
        }
        onOpenChange?.(nextOpen);
    };

    const canSubmit =
        status !== 'submitting' &&
        name.trim().length > 0 &&
        email.trim().length > 0 &&
        flightsPerYear !== '' &&
        Number(flightsPerYear) >= 0 &&
        Number(flightsPerYear) <= 200;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setStatus('submitting');
        setErrorMessage(null);

        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    flights_per_year: Number(flightsPerYear),
                }),
            });

            if (!response.ok) {
                throw new Error(`Formspree returned ${response.status}`);
            }

            setStatus('success');
        } catch (err) {
            console.error('Waitlist submission failed:', err);
            setErrorMessage('Something went wrong. Please try again.');
            setStatus('error');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={
                    'max-w-[480px] p-8 gap-0 bg-c-ground-elevated rounded-c-lg ' +
                    'border border-c-border-hairline shadow-c-lg ' +
                    '[&>button]:focus:ring-c-brand-primary [&>button]:focus:ring-offset-2'
                }
            >
                {status === 'success' ? (
                    <>
                        <DialogTitle className="sr-only">Joined the waitlist</DialogTitle>
                        <DialogDescription className="sr-only">
                            You've been added to the AirBridge waitlist. We'll email you when we launch.
                        </DialogDescription>
                        <div className="flex flex-col items-center text-center py-c-4">
                            <div className="w-14 h-14 rounded-full bg-c-confidence-surface flex items-center justify-center mb-c-5">
                                <CheckCircle2 className="w-8 h-8 text-c-confidence" strokeWidth={2.25} />
                            </div>
                            <h2 className="c-type-title text-c-text-primary">You're on the list!</h2>
                            <p className="c-type-body text-c-text-secondary mt-c-3">
                                We'll email you the moment AirBridge goes live.
                            </p>
                            <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className="mt-c-8 h-12 w-full rounded-c-pill bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse c-type-body font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogTitle className="c-type-title text-c-text-primary">
                            Join the Waitlist
                        </DialogTitle>
                        <DialogDescription className="c-type-body text-c-text-secondary mt-c-2">
                            Be first to know when AirBridge launches. We'll email you the moment we go live.
                        </DialogDescription>

                        {status === 'error' && errorMessage && (
                            <div
                                role="alert"
                                className="mt-c-5 p-c-3 rounded-c-md bg-c-urgency-surface border border-c-urgency/20"
                            >
                                <p className="c-type-footnote text-c-urgency">{errorMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-c-6 space-y-c-5">
                            <div>
                                <label
                                    htmlFor="waitlist-name"
                                    className="c-type-caption text-c-text-secondary block mb-c-2"
                                >
                                    Name
                                </label>
                                <input
                                    id="waitlist-name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    disabled={status === 'submitting'}
                                    className="w-full h-12 px-c-4 bg-c-ground-sunken border border-c-border-hairline rounded-c-md c-type-body text-c-text-primary placeholder:text-c-text-tertiary focus:outline-none focus:border-c-border-strong disabled:opacity-50 transition-colors"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="waitlist-email"
                                    className="c-type-caption text-c-text-secondary block mb-c-2"
                                >
                                    Email
                                </label>
                                <input
                                    id="waitlist-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    disabled={status === 'submitting'}
                                    autoComplete="email"
                                    className="w-full h-12 px-c-4 bg-c-ground-sunken border border-c-border-hairline rounded-c-md c-type-body text-c-text-primary placeholder:text-c-text-tertiary focus:outline-none focus:border-c-border-strong disabled:opacity-50 transition-colors"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="waitlist-flights"
                                    className="c-type-caption text-c-text-secondary block mb-c-2"
                                >
                                    How many times a year do you fly?
                                </label>
                                <input
                                    id="waitlist-flights"
                                    type="number"
                                    required
                                    min={0}
                                    max={200}
                                    value={flightsPerYear}
                                    onChange={(e) => setFlightsPerYear(e.target.value)}
                                    placeholder="e.g. 8"
                                    disabled={status === 'submitting'}
                                    className="w-full h-12 px-c-4 bg-c-ground-sunken border border-c-border-hairline rounded-c-md c-type-body text-c-text-primary placeholder:text-c-text-tertiary focus:outline-none focus:border-c-border-strong disabled:opacity-50 transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full h-12 rounded-c-pill bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse c-type-body font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-c-2"
                            >
                                {status === 'submitting' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Joining…
                                    </>
                                ) : (
                                    'Join the Waitlist'
                                )}
                            </button>

                            <p className="c-type-caption text-c-text-tertiary text-center">
                                We'll never share your info.
                            </p>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
