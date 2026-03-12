import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, Eye, EyeOff } from 'lucide-react';

function SocialButton({ icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-border bg-background hover:bg-secondary transition-all text-sm font-medium text-foreground"
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

export default function AuthModal({ open, onClose }) {
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!open) return null;

    const isSignIn = mode === 'signin';

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
                    >
                        <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">

                            {/* Header */}
                            <div className="px-7 pt-7 pb-6 relative bg-primary">
                                <button
                                    onClick={onClose}
                                    className="absolute top-5 right-5 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Brand */}
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                                        <Plane className="w-3.5 h-3.5 text-primary-foreground" />
                                    </div>
                                    <span className="font-bold text-primary-foreground text-sm">AirBridge</span>
                                </div>

                                <h2 className="text-2xl font-black text-primary-foreground mb-1">
                                    {isSignIn ? 'Welcome back' : 'Create account'}
                                </h2>
                                <p className="text-primary-foreground/50 text-sm">
                                    {isSignIn ? 'Access your saved departures' : 'Start your door-to-gate journey'}
                                </p>
                            </div>

                            {/* Body */}
                            <div className="bg-background px-7 pt-6 pb-7 space-y-4">

                                {/* Social buttons */}
                                <div className="grid grid-cols-3 gap-2">
                                    <SocialButton
                                        label="Google"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                            </svg>
                                        }
                                    />
                                    <SocialButton
                                        label="Apple"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                            </svg>
                                        }
                                    />
                                    <SocialButton
                                        label="Facebook"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                            </svg>
                                        }
                                    />
                                </div>

                                {/* Divider */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground font-medium">or continue with email</span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-secondary text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(s => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {isSignIn && (
                                        <div className="text-right mt-1">
                                            <button className="text-xs text-primary hover:text-brand-accent font-medium">Forgot password?</button>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    className="w-full py-3 rounded-xl text-primary-foreground font-bold text-sm transition-all hover:scale-[1.02] active:scale-100 bg-primary hover:bg-brand-accent shadow-lg"
                                >
                                    {isSignIn ? 'Sign In' : 'Create Account'}
                                </button>

                                {/* Toggle mode */}
                                <p className="text-center text-sm text-muted-foreground">
                                    {isSignIn ? "Don't have an account? " : 'Already have an account? '}
                                    <button
                                        onClick={() => setMode(isSignIn ? 'signup' : 'signin')}
                                        className="text-primary font-semibold hover:text-brand-accent transition-colors"
                                    >
                                        {isSignIn ? 'Sign up' : 'Sign in'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
