import React, { useState } from 'react';
import { Plane, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import WaitlistModal from './WaitlistModal';

export default function Footer() {
    const [waitlistOpen, setWaitlistOpen] = useState(false);

    return (
        <footer className="bg-c-ground-sunken border-t border-c-border-hairline">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-c-brand-primary flex items-center justify-center">
                                <Plane className="w-4 h-4 text-c-text-inverse" />
                            </div>
                            <span className="font-semibold text-lg text-c-text-primary">AirBridge</span>
                        </div>
                        <p className="text-c-text-secondary text-sm leading-relaxed max-w-xs">
                            Door-to-gate timing for travelers who'd rather board than wait.
                        </p>
                        <a
                            href="mailto:hello@airbridge.live"
                            className="inline-flex items-center gap-2 mt-6 text-sm text-c-text-secondary hover:text-c-text-primary transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            hello@airbridge.live
                        </a>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold text-c-text-primary mb-4">Product</h4>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="#how-it-works"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors"
                                >
                                    How It Works
                                </a>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => setWaitlistOpen(true)}
                                    className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors"
                                >
                                    Join the Waitlist
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-c-text-primary mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    to="/privacy"
                                    className="text-sm text-c-text-secondary hover:text-c-text-primary transition-colors"
                                >
                                    Privacy
                                </Link>
                            </li>
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

            <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
        </footer>
    );
}
