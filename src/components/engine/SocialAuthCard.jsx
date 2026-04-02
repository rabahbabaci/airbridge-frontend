import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { API_BASE, GOOGLE_CLIENT_ID } from '@/config';
import { isNative } from '@/utils/platform';
import { AppleSignIn, GoogleSignIn } from '@/utils/nativeAuth';

export default function SocialAuthCard({ onSuccess, onPhoneClick, className }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [googleReady, setGoogleReady] = useState(false);
    const googleBtnRef = useRef(null);
    const initializedRef = useRef(false);
    const callbackRef = useRef(onSuccess);

    const native = isNative();

    // Keep callback ref current without re-running the google init effect
    useEffect(() => {
        callbackRef.current = onSuccess;
    }, [onSuccess]);

    // Web Google Sign In (GIS) — only on web
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || native) return;

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

        if (tryInit()) return;

        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (tryInit() || attempts >= 25) clearInterval(interval);
        }, 200);
        return () => clearInterval(interval);
    }, [native]);

    // Native Apple Sign In
    async function handleAppleSignIn() {
        setError(null);
        setLoading(true);
        try {
            const result = await AppleSignIn.signIn();
            const { identityToken, givenName, familyName } = result;
            const res = await fetch(`${API_BASE}/v1/auth/social`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'apple',
                    id_token: identityToken,
                    given_name: givenName || '',
                    family_name: familyName || '',
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.detail || 'Sign in failed');
            }
            const data = await res.json();
            callbackRef.current?.({ ...data, auth_provider: 'apple' });
        } catch (err) {
            if (err?.message?.includes('USER_CANCELED') || err?.code === '1001') return;
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
            const result = await GoogleSignIn.signIn();
            const idToken = result.idToken;
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
        } catch (err) {
            if (err?.message?.includes('NOT_CONFIGURED') || err?.message?.includes('cancel') || err?.code === 'ERR_CANCELED') return;
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={cn('max-w-md mx-auto px-4 py-6', className)}>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 text-center">
                <div>
                    <h3 className="font-semibold text-foreground">Sign in to track this trip</h3>
                    <p className="text-sm text-muted-foreground mt-1">Get notified when your departure time changes</p>
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
                                    <div className="flex justify-center" style={{ minHeight: 44 }}>
                                        <div ref={googleBtnRef} className={googleReady ? '' : 'hidden'} />
                                        {!googleReady && (
                                            <div className="flex items-center justify-center gap-2 py-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Loading...</span>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">or</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <button
                            onClick={onPhoneClick}
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                        >
                            <Smartphone className="w-4 h-4" />
                            Continue with phone number
                        </button>
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        </div>
    );
}
