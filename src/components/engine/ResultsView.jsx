import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Bell, Smartphone, Share2, Check } from 'lucide-react';
import { formatLocalTime, shortCity } from '@/utils/format';
import { track } from '@/utils/analytics';

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
    securityLabel,
}) {
    const [copied, setCopied] = useState(false);

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
                        {isTracked ? (
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                                Tracking
                            </span>
                        ) : (
                            <button onClick={onTrack}
                                className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all">
                                <Bell className="w-3.5 h-3.5" />
                                Track this trip
                            </button>
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
            />

            {/* Track trip CTA */}
            {!isTracked && (
                <div className="max-w-md mx-auto px-4 pt-4">
                    <button onClick={onTrack}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:bg-primary/90 transition-all">
                        <Bell className="w-4 h-4" />
                        {isAuthenticated ? 'Track this trip' : 'Track this trip & get alerts'}
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Get notified when your leave-by time changes
                    </p>
                </div>
            )}

            {isTracked && (
                <div className="max-w-md mx-auto px-4 pt-4">
                    <div className="flex items-center justify-center gap-2 py-2.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Tracking — you'll be notified of changes</span>
                    </div>
                </div>
            )}

            {/* Action cards — rideshare / navigation deep links (post-auth feature) */}
            {isAuthenticated && (
                <ActionCards
                    recommendation={recommendation}
                    selectedFlight={selectedFlight}
                    transport={transport}
                />
            )}

            {/* App download upsell — only when tracking */}
            {isTracked && (
                <div className="max-w-md mx-auto px-4 pb-8">
                    <div className="bg-card rounded-2xl border border-border p-5 text-center">
                        <Smartphone className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground mb-1">Get live departure alerts on your phone</p>
                        <p className="text-xs text-muted-foreground">
                            Download AirBridge for real-time notifications, lock screen countdown, and more.
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <span className="text-xs text-muted-foreground/60 border border-border/50 rounded-lg px-3 py-1.5">App Store — coming soon</span>
                            <span className="text-xs text-muted-foreground/60 border border-border/50 rounded-lg px-3 py-1.5">Play Store — coming soon</span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
