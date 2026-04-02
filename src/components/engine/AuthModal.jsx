import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Smartphone, Loader2, Plane } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

import { API_BASE, GOOGLE_CLIENT_ID } from '@/config';
import { isNative } from '@/utils/platform';

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

    const native = isNative();

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

    // Google Sign In (web only — GIS library)
    useEffect(() => {
        if (!open || !GOOGLE_CLIENT_ID || native) return;

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
    }, [open, native]);

    // Native Apple Sign In
    async function handleAppleSignIn() {
        setError(null);
        setLoading(true);
        try {
            const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
            const result = await SignInWithApple.authorize({
                clientId: 'live.airbridge.app',
                redirectURI: '',
                scopes: 'email name',
            });
            const { identityToken, givenName, familyName } = result.response;
            const res = await fetch(`${API_BASE}/v1/auth/social`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'apple',
                    id_token: identityToken,
                    given_name: givenName,
                    family_name: familyName,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.detail || 'Sign in failed');
            }
            const data = await res.json();
            callbackRef.current?.({ ...data, auth_provider: 'apple' });
            setView('success');
        } catch (err) {
            // User cancelled — don't show error
            if (err?.message?.includes('cancel') || err?.code === 'ERR_CANCELED' || err?.code === 1001) return;
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Native Google Sign In
    async function handleNativeGoogleSignIn() {
        setError(null);
        setLoading(true);
        try {
            const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
            await GoogleAuth.initialize({
                clientId: GOOGLE_CLIENT_ID,
                scopes: ['profile', 'email'],
            });
            const user = await GoogleAuth.signIn({ scopes: ['profile', 'email'] });
            const idToken = user.authentication.idToken;
            const res = await fetch(`${API_BASE}/v1/auth/social`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'google', id_token: idToken }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.detail || 'Sign in failed');
            }
            const data = await res.json();
            callbackRef.current?.({ ...data, auth_provider: 'google' });
            setView('success');
        } catch (err) {
            if (err?.message?.includes('cancel') || err?.code === 'ERR_CANCELED' || err?.code === 12501) return;
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

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

                {/* Main view — auth options */}
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
                                {native ? (
                                    <>
                                        {/* Native Apple Sign In */}
                                        <button
                                            onClick={handleAppleSignIn}
                                            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-black text-white text-sm font-medium hover:bg-black/90 transition-colors"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                            </svg>
                                            Sign in with Apple
                                        </button>

                                        {/* Native Google Sign In */}
                                        <button
                                            onClick={handleNativeGoogleSignIn}
                                            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white text-gray-700 border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Sign in with Google
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Web Google Sign In (GIS) */}
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
                                    </>
                                )}

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
