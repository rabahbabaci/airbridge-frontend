import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Smartphone, Share2, Check, Sparkles } from 'lucide-react';
import { formatLocalTime, shortCity } from '@/utils/format';
import { track } from '@/utils/analytics';
import { useAuth } from '@/lib/AuthContext';

import JourneyVisualization from './JourneyVisualization';
import ActionCards from './ActionCards';

const pageTransition = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

function formatUTCToLocal(utcStr) {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ResultsView({
    recommendation, selectedFlight, transport,
    isAuthenticated, display_name,
    apiError, setApiError,
    onEditSetup, onReset, onReady,
    onSignIn,
    isTracked, onTrack,
    securityLabel, homeAddress,
}) {
    const [copied, setCopied] = useState(false);
    const { isPro } = useAuth();

    const handleShare = async () => {
        const leaveTime = formatUTCToLocal(recommendation?.leave_home_at);
        const depTime = selectedFlight?.departure_time ? formatLocalTime(selectedFlight.departure_time) : '';
        const flightNum = selectedFlight?.flight_number || '';
        const dest = shortCity(selectedFlight?.destination_name) || selectedFlight?.destination_code || '';

        const message = `I need to leave by ${leaveTime} to catch my ${depTime} ${flightNum} flight to ${dest} ✈️ — powered by AirBridge https://airbridge.live`;

        if (navigator.share) {
            try {
                await navigator.share({ text: message });
                track('share_tapped', { method: 'native_share' });
            } catch {}
        } else {
            try {
                await navigator.clipboard.writeText(message);
                track('share_tapped', { method: 'clipboard' });
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {}
        }
    };

    return (
        <motion.div key="results" {...pageTransition} className="min-h-[calc(100vh-57px)] bg-secondary/50">
            {/* Results Header */}
            <div className="bg-card border-b border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onEditSetup}
                            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="font-bold text-foreground">Journey Blueprint</h1>
                            <p className="text-sm text-muted-foreground">Your optimized travel timeline</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isPro && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
                                <Sparkles className="w-3 h-3" />
                                Upgrade to Pro
                            </span>
                        )}
                        <button onClick={handleShare}
                            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all"
                            title="Share">
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                        </button>
                        <button onClick={onReset}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Start Over
                        </button>
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {apiError && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-2xl px-5 py-4 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                            <p className="text-destructive text-sm font-medium">{apiError}</p>
                            <button onClick={() => setApiError(null)}
                                className="text-sm text-destructive font-semibold underline mt-1 hover:text-destructive/80">
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Journey Visualization */}
            <JourneyVisualization
                locked={true}
                recommendation={recommendation}
                selectedFlight={selectedFlight}
                transport={transport}
                onReady={onReady}
                securityLabel={securityLabel}
                isTracked={isTracked}
                onTrack={onTrack}
                isAuthenticated={isAuthenticated}
                homeAddress={homeAddress}
            />

            {/* Action cards — rideshare / navigation deep links (post-auth feature) */}
            {isAuthenticated && (
                <ActionCards
                    recommendation={recommendation}
                    selectedFlight={selectedFlight}
                    transport={transport}
                />
            )}

            {/* App download upsell — compact banner */}
            {isTracked && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
                    <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                Get lock screen countdown & spoken alerts with the AirBridge app
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground/60 whitespace-nowrap">Coming soon</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
