import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AuthModal from '@/components/landing/AuthModal';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const navigate = useNavigate();

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
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <a href="#" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Plane className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">AirBridge</span>
                    </a>

                    <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 backdrop-blur-sm rounded-full px-2 py-1.5">
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
                                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white transition-all font-medium px-4 py-1.5 rounded-full"
                            >
                                {link.name}
                            </a>
                        ))}

                        {/* Divider */}
                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-white transition-all font-medium px-4 py-1.5 rounded-full"
                        >
                            Sign in
                        </a>

                        <button
                            onClick={() => navigate(createPageUrl('Engine'))}
                            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-1.5 rounded-full transition-all"
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
                        className="md:hidden bg-white border-t"
                    >
                        <div className="px-6 py-4 space-y-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="block text-gray-600 hover:text-gray-900"
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
                                <Button variant="outline" className="w-full">Sign In</Button>
                                <Button 
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                >
                                    Get Early Access
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}