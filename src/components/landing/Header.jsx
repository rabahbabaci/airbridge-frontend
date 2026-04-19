import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import AuthModal from '@/components/engine/AuthModal';

const SCROLL_THRESHOLD = 100;

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
        handleScroll(); // Sync once on mount in case the page was opened mid-scroll.
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'How It Works', href: '#how-it-works' },
    ];

    const scrollToAnchor = (href) => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleGetStarted = () => navigate('/search');
    const handleSignIn = () => setAuthOpen(true);

    // Shared motion settings for the flat ↔ pill crossfade.
    const swapTransition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] };

    return (
        <>
            {/* The outer <motion.header> owns the on-mount slide-in; the inner
                AnimatePresence crossfades the flat and pill variants in place
                when scroll crosses SCROLL_THRESHOLD. Content below the Header
                was already accounting for a fixed-top bar (Hero uses pt-28),
                so switching variants doesn't cause layout shift. */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {scrolled ? (
                        <motion.div
                            key="pill"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={swapTransition}
                            className="hidden md:flex w-fit mx-auto mt-4 pointer-events-auto c-glass border border-[color:var(--c-glass-border)] rounded-c-pill shadow-c-glass items-center gap-1 pl-2 pr-2 py-1.5"
                        >
                            {/* Icon-only logo in pill state */}
                            <a
                                href="#"
                                aria-label="AirBridge home"
                                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="w-8 h-8 rounded-c-sm bg-c-brand-primary flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2"
                            >
                                <Plane className="w-4 h-4 text-c-text-inverse" />
                            </a>

                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={(e) => { e.preventDefault(); scrollToAnchor(link.href); }}
                                    className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors font-medium px-3 h-9 inline-flex items-center rounded-c-pill focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2"
                                >
                                    {link.name}
                                </a>
                            ))}

                            {!isAuthenticated && (
                                <>
                                    <div className="w-px h-4 bg-c-border-hairline mx-1" />
                                    <button
                                        type="button"
                                        onClick={handleSignIn}
                                        className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors font-medium px-3 h-9 inline-flex items-center rounded-c-pill focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2"
                                    >
                                        Sign in
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={handleGetStarted}
                                className="text-sm bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse font-semibold px-4 h-9 inline-flex items-center rounded-c-pill transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2"
                            >
                                Get Started
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="flat"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={swapTransition}
                            className="pointer-events-auto"
                        >
                            <div className="max-w-7xl mx-auto px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <a href="#" className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-c-brand-primary flex items-center justify-center">
                                            <Plane className="w-4 h-4 text-c-text-inverse" />
                                        </div>
                                        <span className="font-bold text-lg text-c-text-primary">AirBridge</span>
                                    </a>

                                    <nav className="hidden md:flex items-center gap-1 bg-c-ground-sunken/80 backdrop-blur-sm rounded-full px-2 py-1.5">
                                        {navLinks.map((link) => (
                                            <a
                                                key={link.name}
                                                href={link.href}
                                                onClick={(e) => { e.preventDefault(); scrollToAnchor(link.href); }}
                                                className="text-sm text-c-text-secondary hover:text-c-text-primary hover:bg-c-ground-elevated transition-all font-medium px-4 py-1.5 rounded-full"
                                            >
                                                {link.name}
                                            </a>
                                        ))}

                                        {!isAuthenticated && (
                                            <>
                                                <div className="w-px h-4 bg-c-border-hairline mx-1" />
                                                <button
                                                    type="button"
                                                    onClick={handleSignIn}
                                                    className="text-sm text-c-text-secondary hover:text-c-text-primary hover:bg-c-ground-elevated transition-all font-medium px-4 py-1.5 rounded-full"
                                                >
                                                    Sign in
                                                </button>
                                            </>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleGetStarted}
                                            className="text-sm bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse font-semibold px-5 py-1.5 rounded-full transition-all"
                                        >
                                            Get Started
                                        </button>
                                    </nav>

                                    <button
                                        className="md:hidden p-2 pointer-events-auto"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                                    >
                                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile drawer — shared across flat/pill, rarely fires on the
                    landing (viewport ≥ 1024px gate) but kept for fallback. */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-c-ground-elevated border-t border-c-border-hairline pointer-events-auto"
                        >
                            <div className="px-6 py-4 space-y-4">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="block text-c-text-secondary hover:text-c-text-primary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setMobileMenuOpen(false);
                                            scrollToAnchor(link.href);
                                        }}
                                    >
                                        {link.name}
                                    </a>
                                ))}
                                <div className="pt-4 space-y-3">
                                    {!isAuthenticated && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => { setMobileMenuOpen(false); setAuthOpen(true); }}
                                        >
                                            Sign In
                                        </Button>
                                    )}
                                    <Button
                                        className="w-full bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            navigate('/search');
                                        }}
                                    >
                                        Get Started
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            <AuthModal open={authOpen} onOpenChange={setAuthOpen} onSuccess={(data) => login(data)} />
        </>
    );
}
