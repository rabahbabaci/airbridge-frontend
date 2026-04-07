import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, Plane as PlaneIcon, History, BarChart3 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/config';
import PaywallModal from '@/components/PaywallModal';

const PAGE_SIZE = 10;
const FREE_TIER_LIMIT = 5;

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

export default function Trips() {
    const navigate = useNavigate();
    const { token, isAuthenticated, isPro } = useAuth();

    const [trips, setTrips] = useState([]);
    const [aggregate, setAggregate] = useState({ avg_accuracy_minutes: null, total_trips_with_feedback: 0, total: 0 });
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [paywallOpen, setPaywallOpen] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) navigate(createPageUrl('Home'), { replace: true });
    }, [isAuthenticated, navigate]);

    const fetchPage = useCallback(async (pageOffset, append) => {
        if (!token) return;
        if (append) setLoadingMore(true); else setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE}/v1/trips/history?limit=${PAGE_SIZE}&offset=${pageOffset}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(`History failed (${res.status})`);
            const data = await res.json();
            const incoming = Array.isArray(data.trips) ? data.trips : [];
            setTrips(prev => append ? [...prev, ...incoming] : incoming);
            setAggregate({
                avg_accuracy_minutes: data.avg_accuracy_minutes ?? null,
                total_trips_with_feedback: data.total_trips_with_feedback ?? 0,
                total: data.total ?? incoming.length,
            });
            setOffset(pageOffset + incoming.length);
        } catch (err) {
            console.error('Trip history fetch failed:', err);
            setError("Couldn't load your trip history. Please try again.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchPage(0, false);
    }, [token, fetchPage]);

    if (!isAuthenticated) return null;

    // Free tier: cap displayed trips at FREE_TIER_LIMIT.
    const visibleTrips = isPro ? trips : trips.slice(0, FREE_TIER_LIMIT);
    const moreAvailable = isPro ? offset < aggregate.total : aggregate.total > FREE_TIER_LIMIT;

    return (
        <div className="min-h-screen bg-secondary/50 font-sans antialiased">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Plane className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg text-foreground">AirBridge</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-1 text-sm">
                            <Link to={createPageUrl('Engine')} className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">Engine</Link>
                            <span className="text-foreground font-semibold px-3 py-1.5 bg-secondary rounded-lg">Trip History</span>
                            <Link to={createPageUrl('Settings')} className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">Settings</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Link to={createPageUrl('Settings')}
                        className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Trip History</h1>
                        <p className="text-sm text-muted-foreground">Your past AirBridge journeys</p>
                    </div>
                </div>

                {/* Aggregate stats card */}
                {!loading && aggregate.total_trips_with_feedback > 0 && aggregate.avg_accuracy_minutes != null && (
                    <div className="bg-card border border-border rounded-2xl p-5 mb-4 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                Within {Math.round(aggregate.avg_accuracy_minutes)} min on your last {aggregate.total_trips_with_feedback} trip{aggregate.total_trips_with_feedback === 1 ? '' : 's'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Personal accuracy average</p>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-4">
                        <p className="text-sm text-destructive">{error}</p>
                        <button
                            onClick={() => fetchPage(0, false)}
                            className="text-sm font-semibold text-destructive underline mt-1 hover:text-destructive/80"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && visibleTrips.length === 0 && (
                    <div className="bg-card border border-border rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                            <History className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">No completed trips yet</p>
                        <p className="text-xs text-muted-foreground">Track a trip to start building your history.</p>
                    </div>
                )}

                {/* Trip rows */}
                {!loading && visibleTrips.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        {visibleTrips.map((trip, idx) => (
                            <div
                                key={trip.trip_id}
                                className={`px-5 py-4 flex items-center gap-3 ${idx > 0 ? 'border-t border-border' : ''}`}
                            >
                                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                                    <PlaneIcon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {trip.flight_number}
                                        </p>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {formatDate(trip.departure_date)}
                                        </span>
                                    </div>
                                    {trip.home_address && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            From {trip.home_address}
                                        </p>
                                    )}
                                </div>
                                {trip.feedback && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                                        Reviewed
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Free tier upgrade CTA */}
                {!loading && !isPro && trips.length > 0 && aggregate.total > FREE_TIER_LIMIT && (
                    <button
                        onClick={() => setPaywallOpen(true)}
                        className="w-full mt-4 py-3 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        See all {aggregate.total} trips with Pro
                    </button>
                )}

                {/* Pro tier load more */}
                {!loading && isPro && moreAvailable && (
                    <button
                        onClick={() => fetchPage(offset, true)}
                        disabled={loadingMore}
                        className="w-full mt-4 py-3 rounded-2xl text-sm font-medium border border-border bg-card text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                        {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                )}
            </div>

            <PaywallModal
                open={paywallOpen}
                onOpenChange={setPaywallOpen}
                token={token}
            />
        </div>
    );
}
