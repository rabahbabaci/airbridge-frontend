import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { API_BASE } from '@/config';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function SocialAuthCard({ onSuccess, onPhoneClick, className }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [googleReady, setGoogleReady] = useState(false);
    const googleBtnRef = useRef(null);

    const handleCredentialResponse = useCallback(async (response) => {
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
            onSuccess?.({ ...data, auth_provider: 'google' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [onSuccess]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google Sign In disabled');
            return;
        }

        function initGoogle() {
            if (!window.google?.accounts?.id) return false;
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
            });
            if (googleBtnRef.current) {
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    type: 'standard',
                    shape: 'rectangular',
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    width: 280,
                });
            }
            setGoogleReady(true);
            return true;
        }

        if (initGoogle()) return;

        // Poll for script load (up to 5s)
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (initGoogle() || attempts >= 25) clearInterval(interval);
        }, 200);
        return () => clearInterval(interval);
    }, [handleCredentialResponse]);

    const showGoogleButton = GOOGLE_CLIENT_ID && googleReady;

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
                        {GOOGLE_CLIENT_ID ? (
                            <div className="flex justify-center">
                                {showGoogleButton ? (
                                    <div ref={googleBtnRef} />
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Loading...</span>
                                    </div>
                                )}
                            </div>
                        ) : null}

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
