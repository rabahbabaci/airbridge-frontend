import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

import { API_BASE } from '@/config';

export default function OTPModal({ open, onOpenChange, onSuccess }) {
    const [step, setStep] = useState('phone');
    const [phone, setPhone] = useState('+1');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setStep('phone');
            setPhone('+1');
            setCode('');
            setLoading(false);
            setError(null);
        }
    }, [open]);

    // Auto-close after success
    useEffect(() => {
        if (step === 'success') {
            const t = setTimeout(() => onOpenChange(false), 2000);
            return () => clearTimeout(t);
        }
    }, [step, onOpenChange]);

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
            setStep('code');
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
            onSuccess?.(data);
            setStep('success');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-2xl">
                {step === 'phone' && (
                    <div className="space-y-4 pb-4">
                        <SheetHeader>
                            <SheetTitle>Get notified if your departure changes</SheetTitle>
                            <SheetDescription>We'll text you if your flight or timing updates.</SheetDescription>
                        </SheetHeader>
                        <div className="flex items-center gap-2">
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 555 123 4567"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button onClick={handleSendOTP} disabled={loading || phone.length < 4} className="w-full">
                            {loading ? 'Sending...' : 'Send code'}
                        </Button>
                        <button onClick={() => onOpenChange(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Not now
                        </button>
                    </div>
                )}

                {step === 'code' && (
                    <div className="space-y-4 pb-4">
                        <SheetHeader>
                            <SheetTitle>Enter verification code</SheetTitle>
                            <SheetDescription>Sent to {phone}</SheetDescription>
                        </SheetHeader>
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
                        <Button onClick={handleVerifyOTP} disabled={loading || code.length < 6} className="w-full">
                            {loading ? 'Verifying...' : 'Verify'}
                        </Button>
                        <button onClick={() => onOpenChange(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Not now
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        <p className="text-sm font-medium text-foreground">You're all set! We'll notify you of any changes.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
