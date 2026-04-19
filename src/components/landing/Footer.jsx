import React from 'react';
import { Twitter, Linkedin, Instagram, Plane } from 'lucide-react';

const footerLinks = {
    product: [
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Features', href: '#solution' },
        { name: 'Pricing', href: '#' },
        { name: 'FAQ', href: '#' }
    ],
    company: [
        { name: 'About', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Contact', href: '#' }
    ],
    legal: [
        { name: 'Privacy', href: '#' },
        { name: 'Terms', href: '#' },
        { name: 'Cookie Policy', href: '#' }
    ]
};

export default function Footer() {
    return (
        <footer className="bg-c-ground-sunken border-t border-c-border-hairline">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-c-brand-primary flex items-center justify-center">
                                <Plane className="w-4 h-4 text-c-text-inverse" />
                            </div>
                            <span className="font-semibold text-lg text-c-text-primary">AirBridge</span>
                        </div>
                        <p className="text-c-text-secondary text-sm leading-relaxed max-w-xs">
                            Smart airport departure assistant that guarantees you won't miss your flight.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <a href="#" className="w-9 h-9 rounded-full bg-c-ground-sunken hover:bg-c-border-hairline flex items-center justify-center transition-colors">
                                <Twitter className="w-4 h-4 text-c-text-secondary" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-c-ground-sunken hover:bg-c-border-hairline flex items-center justify-center transition-colors">
                                <Linkedin className="w-4 h-4 text-c-text-secondary" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-c-ground-sunken hover:bg-c-border-hairline flex items-center justify-center transition-colors">
                                <Instagram className="w-4 h-4 text-c-text-secondary" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold text-c-text-primary mb-4">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-c-text-primary mb-4">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-c-text-primary mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-c-border-hairline mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-c-text-secondary">
                        © 2026 AirBridge. All rights reserved.
                    </p>
                    <p className="text-sm text-c-text-secondary">
                        Made with ✈️ in San Francisco
                    </p>
                </div>
            </div>
        </footer>
    );
}