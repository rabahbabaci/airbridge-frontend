import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const API_BASE = 'https://airbridge-backend-production.up.railway.app';

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

    // Strip the +1 prefix for display in the input
    const phoneDigits = phone.startsWith('+1') ? phone.slice(2) : phone;

    function handlePhoneChange(e) {
        const digits = e.target.value.replace(/[^0-9]/g, '');
        setPhone('+1' + digits);
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-3">
                {/* Drag handle */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-6" />

                <AnimatePresence mode="wait">
                    {step === 'phone' && (
                        <motion.div
                            key="phone"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-foreground tracking-tight">
                                    Get notified if your departure changes
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    We'll text you when your flight timing updates
                                </p>
                            </div>

                            {/* Phone input */}
                            <div className="flex items-center rounded-full border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all duration-200">
                                <span className="flex items-center px-4 py-3 bg-muted border-r border-input text-sm font-medium text-muted-foreground select-none">
                                    +1
                                </span>
                                <input
                                    type="tel"
                                    value={phoneDigits}
                                    onChange={handlePhoneChange}
                                    placeholder="555 123 4567"
                                    className="flex-1 px-4 py-3 text-lg bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
                                    inputMode="numeric"
                                />
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    onClick={handleSendOTP}
                                    disabled={loading || phone.length < 4}
                                    className="w-full rounded-xl py-3 h-auto text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
                                >
                                    {loading ? 'Sending...' : 'Send code'}
                                </Button>
                            </motion.div>

                            <button
                                onClick={() => onOpenChange(false)}
                                className="w-full text-sm text-muted-foreground hover:opacity-70 transition-opacity duration-200 py-1"
                            >
                                Not now
                            </button>
                        </motion.div>
                    )}

                    {step === 'code' && (
                        <motion.div
                            key="code"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="space-y-5"
                        >
                            <div className="space-y-2 text-center">
                                <h2 className="text-xl font-bold text-foreground tracking-tight">
                                    Enter your code
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Sent to {phone}
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <InputOTP maxLength={6} value={code} onChange={setCode}>
                                    <InputOTPGroup className="gap-2">
                                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                            <InputOTPSlot
                                                key={i}
                                                index={i}
                                                className="w-12 h-14 rounded-lg border-2 border-input text-lg font-semibold transition-colors duration-200 focus-within:border-primary first:rounded-l-lg last:rounded-r-lg"
                                            />
                                        ))}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            {error && <p className="text-sm text-destructive text-center">{error}</p>}

                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    onClick={handleVerifyOTP}
                                    disabled={loading || code.length < 6}
                                    className="w-full rounded-xl py-3 h-auto text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
                                >
                                    {loading ? 'Verifying...' : 'Verify'}
                                </Button>
                            </motion.div>

                            <button
                                onClick={() => onOpenChange(false)}
                                className="w-full text-sm text-muted-foreground hover:opacity-70 transition-opacity duration-200 py-1"
                            >
                                Not now
                            </button>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="flex flex-col items-center gap-4 py-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'hsl(var(--success))' }}
                            >
                                <Check className="w-8 h-8 text-white" strokeWidth={3} />
                            </motion.div>
                            <div className="text-center space-y-1">
                                <p className="text-lg font-bold text-foreground">You're all set!</p>
                                <p className="text-sm text-muted-foreground">
                                    We'll notify you of any changes to your departure
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    );
}
