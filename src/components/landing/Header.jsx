import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Plane, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import AuthModal from '@/components/engine/AuthModal';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const navigate = useNavigate();
    const { login, logout, isAuthenticated, display_name } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isHome = window.location.pathname === '/' || window.location.pathname.toLowerCase().includes('home');

    const navLinks = [
        ...(!isHome ? [{ name: 'Home', href: createPageUrl('Home') }] : []),
        { name: 'How It Works', href: '#how-it-works' },
    ];

    return (
        <>
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-c-ground-elevated/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'
            }`}
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
                                href={link.href || '#'}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (link.action) link.action();
                                    else if (link.href && link.href.startsWith('#')) {
                                        document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                                    } else if (link.href) {
                                        navigate(link.href);
                                    }
                                }}
                                className="text-sm text-c-text-secondary hover:text-c-text-primary hover:bg-c-ground-elevated transition-all font-medium px-4 py-1.5 rounded-full"
                            >
                                {link.name}
                            </a>
                        ))}

                        <div className="w-px h-4 bg-c-border-hairline mx-1" />

                        {isAuthenticated ? (
                            <div className="flex items-center gap-2 px-3 py-1">
                                <div className="w-6 h-6 rounded-full bg-c-brand-primary flex items-center justify-center text-[10px] font-bold text-c-text-inverse">
                                    {(display_name || '').charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm font-medium text-c-text-primary">{display_name ? display_name.split(' ')[0] : 'Account'}</span>
                                <button onClick={() => navigate(createPageUrl('Settings'))} className="text-c-text-secondary hover:text-c-text-primary transition-colors ml-1" title="Settings">
                                    <Settings className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={logout} className="text-xs text-c-text-secondary hover:text-c-text-primary transition-colors ml-1">
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setAuthOpen(true); }}
                                className="text-sm text-c-text-secondary hover:text-c-text-primary hover:bg-c-ground-elevated transition-all font-medium px-4 py-1.5 rounded-full"
                            >
                                Sign in
                            </a>
                        )}

                        <button
                            onClick={() => navigate(createPageUrl('Engine'), { state: { newTrip: true } })}
                            className="text-sm bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse font-semibold px-5 py-1.5 rounded-full transition-all"
                        >
                            Get Started
                        </button>
                    </nav>

                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-c-ground-elevated border-t border-c-border-hairline"
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
                                        document.getElementById(link.href.substring(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                >
                                    {link.name}
                                </a>
                            ))}
                            <div className="pt-4 space-y-3">
                                {isAuthenticated ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-c-text-primary">{display_name ? display_name.split(' ')[0] : 'Account'}</span>
                                            <Button variant="outline" size="sm" onClick={() => { setMobileMenuOpen(false); logout(); }}>Sign out</Button>
                                        </div>
                                        <button onClick={() => { setMobileMenuOpen(false); navigate(createPageUrl('Settings')); }} className="block text-c-text-secondary hover:text-c-text-primary text-sm">Settings</button>
                                    </>
                                ) : (
                                    <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); setAuthOpen(true); }}>Sign In</Button>
                                )}
                                <Button
                                    className="w-full bg-c-brand-primary hover:bg-c-brand-primary-hover text-c-text-inverse"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        navigate(createPageUrl('Engine'), { state: { newTrip: true } });
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
