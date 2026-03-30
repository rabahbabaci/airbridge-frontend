import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Smartphone, Loader2, Plane } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

import { API_BASE, GOOGLE_CLIENT_ID } from '@/config';

export default function AuthModal({ open, onOpenChange, onSuccess }) {
    const [view, setView] = useState('main'); // 'main' | 'phone' | 'code' | 'success'
    const [phone, setPhone] = useState('+1');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [googleReady, setGoogleReady] = useState(false);

    const googleBtnRef = useRef(null);
    const initializedRef = useRef(false);
    const callbackRef = useRef(onSuccess);

    useEffect(() => { callbackRef.current = onSuccess; }, [onSuccess]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setView('main');
            setPhone('+1');
            setCode('');
            setLoading(false);
            setError(null);
        }
    }, [open]);

    // Auto-close after success
    useEffect(() => {
        if (view === 'success') {
            const t = setTimeout(() => onOpenChange(false), 1800);
            return () => clearTimeout(t);
        }
    }, [view, onOpenChange]);

    // Google Sign In
    useEffect(() => {
        if (!open || !GOOGLE_CLIENT_ID) return;

        function tryInit() {
            if (!window.google?.accounts?.id || !googleBtnRef.current) return false;

            if (!initializedRef.current) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: async (response) => {
                        setError(null);
                        setLoading(true);
                        try {
                            const res = await fetch(`${API_BASE}/v1/auth/social`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ provider: 'google', id_token: response.credential }),
                            });
                            if (!res.ok) {
                                const data = await res.json().catch(() => null);
                                throw new Error(data?.detail || 'Sign in failed');
                            }
                            const data = await res.json();
                            callbackRef.current?.({ ...data, auth_provider: 'google' });
                            setView('success');
                        } catch (err) {
                            setError(err.message);
                        } finally {
                            setLoading(false);
                        }
                    },
                });
                initializedRef.current = true;
            }

            window.google.accounts.id.renderButton(googleBtnRef.current, {
                type: 'standard',
                shape: 'rectangular',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                width: 280,
            });
            setGoogleReady(true);
            return true;
        }

        // Delay init to ensure DOM is ready after sheet opens
        const initTimeout = setTimeout(() => {
            if (tryInit()) return;
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (tryInit() || attempts >= 25) clearInterval(interval);
            }, 200);
            // Store interval for cleanup
            initTimeout._interval = interval;
        }, 100);

        return () => {
            clearTimeout(initTimeout);
            if (initTimeout._interval) clearInterval(initTimeout._interval);
        };
    }, [open]);

    // OTP handlers
    async function handleSendOTP() {
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/v1/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phone }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.detail || 'Failed to send code');
            }
            setView('code');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOTP() {
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/v1/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phone, code }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.detail || 'Invalid code');
            }
            const data = await res.json();
            callbackRef.current?.(data);
            setView('success');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[380px] rounded-2xl p-8 border-border/50 shadow-2xl gap-0">
                <DialogTitle className="sr-only">Sign in to AirBridge</DialogTitle>
                <DialogDescription className="sr-only">Sign in to save trips and get departure updates</DialogDescription>

                {/* Main view — Google + Phone */}
                {view === 'main' && (
                    <div className="space-y-5 text-center">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                                <Plane className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Sign in to AirBridge</h3>
                            <p className="text-sm text-muted-foreground mt-1.5 mb-6">Track your trips and get live departure updates</p>
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Signing in...</span>
                            </div>
                        )}

                        {!loading && (
                            <div className="space-y-4">
                                {GOOGLE_CLIENT_ID ? (
                                    <div className="flex justify-center" style={{ minHeight: 48 }}>
                                        <div ref={googleBtnRef} className={googleReady ? '' : 'hidden'} />
                                        {!googleReady && (
                                            <div className="flex items-center justify-center gap-2 py-3">
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Loading...</span>
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-border/50" />
                                    <span className="text-xs text-muted-foreground">or</span>
                                    <div className="h-px flex-1 bg-border/50" />
                                </div>

                                <button
                                    onClick={() => setView('phone')}
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-secondary text-foreground border border-border text-sm font-medium hover:bg-accent hover:border-muted-foreground/30 transition-all"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    Continue with phone number
                                </button>
                            </div>
                        )}

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <button onClick={() => onOpenChange(false)}
                            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
                            Not now
                        </button>
                    </div>
                )}

                {/* Phone entry */}
                {view === 'phone' && (
                    <div className="space-y-5 text-center">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Enter your phone number</h3>
                            <p className="text-sm text-muted-foreground mt-1.5">We'll send you a verification code</p>
                        </div>
                        <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 555 123 4567"
                            className="text-center"
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button onClick={handleSendOTP} disabled={loading || phone.length < 4} className="w-full py-3 rounded-xl">
                            {loading ? 'Sending...' : 'Send code'}
                        </Button>
                        <button onClick={() => { setView('main'); setError(null); }}
                            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Back
                        </button>
                    </div>
                )}

                {/* Code verification */}
                {view === 'code' && (
                    <div className="space-y-5 text-center">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Enter verification code</h3>
                            <p className="text-sm text-muted-foreground mt-1.5">Sent to {phone}</p>
                        </div>
                        <div className="flex justify-center">
                            <InputOTP maxLength={6} value={code} onChange={setCode}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button onClick={handleVerifyOTP} disabled={loading || code.length < 6} className="w-full py-3 rounded-xl">
                            {loading ? 'Verifying...' : 'Verify'}
                        </Button>
                        <button onClick={() => { setView('phone'); setError(null); setCode(''); }}
                            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Back
                        </button>
                    </div>
                )}

                {/* Success */}
                {view === 'success' && (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        <p className="text-base font-semibold text-foreground">Welcome!</p>
                        <p className="text-sm text-muted-foreground">You're signed in.</p>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
