import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, History, BarChart3, Plus, Clock } from 'lucide-react';
import { Airplane, MagnifyingGlass, Gear } from '@phosphor-icons/react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/config';
import { formatCountdownText, formatLocalTime } from '@/utils/format';
import PaywallModal from '@/components/PaywallModal';
import TabBar from '@/components/design-system/TabBar';
import AuthModal from '@/components/engine/AuthModal';
import useAuthGatedTabs from '@/hooks/useAuthGatedTabs';

const HISTORY_PAGE_SIZE = 10;
const FREE_TIER_HISTORY_LIMIT = 5;

function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = parseLocalDate(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatShortDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = parseLocalDate(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

const STATUS_LABELS = {
    draft: 'Draft',
    created: 'Draft',
    active: 'Tracked',
    en_route: 'En Route',
    at_airport: 'At Airport',
    at_gate: 'At Gate',
};

const STATUS_STYLES = {
    draft: 'bg-muted text-muted-foreground',
    created: 'bg-muted text-muted-foreground',
    active: 'bg-primary/10 text-primary',
    en_route: 'bg-amber-50 text-amber-700',
    at_airport: 'bg-blue-50 text-blue-700',
    at_gate: 'bg-emerald-50 text-emerald-700',
};

function StatusPill({ status }) {
    const label = STATUS_LABELS[status] || status;
    const style = STATUS_STYLES[status] || 'bg-muted text-muted-foreground';
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${style}`}>
            {label}
        </span>
    );
}

function ActiveTripCard({ trip }) {
    const navigate = useNavigate();
    const isDraft = trip.status === 'draft' || trip.status === 'created';
    const leaveHomeAt = trip.projected_timeline?.leave_home_at;
    const countdown = leaveHomeAt ? formatCountdownText(leaveHomeAt) : null;
    const leaveByTime = leaveHomeAt ? formatLocalTime(leaveHomeAt) : null;

    const route = trip.origin_iata && trip.destination_iata
        ? `${trip.origin_iata} → ${trip.destination_iata}`
        : null;

    const isInProgress = trip.status === 'en_route' || trip.status === 'at_airport' || trip.status === 'at_gate';
    const isComplete = trip.status === 'complete';

    const handleClick = () => {
        if (isDraft) {
            navigate(createPageUrl('Engine'), { state: { editTrip: trip } });
            return;
        }
        // All tracked trips (active, en_route, at_airport, at_gate) → Active Trip Screen
        navigate(createPageUrl('Engine'), { state: { viewTrip: trip } });
    };

    const CardTag = 'button';

    return (
        <CardTag
            onClick={handleClick}
            className={`w-full text-left rounded-2xl p-5 cursor-pointer transition-all ${
                isDraft
                    ? 'border border-border/50 bg-secondary'
                    : 'border border-border bg-card shadow-sm'
            }`}
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    {trip.airline && (
                        <span className="text-xs text-muted-foreground">{trip.airline}</span>
                    )}
                    <span className="text-sm font-bold text-foreground">{trip.flight_number}</span>
                </div>
                <StatusPill status={trip.status} />
            </div>

            {route && (
                <p className="text-base font-semibold text-foreground mb-1">{route}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatShortDate(trip.departure_date)}</span>
                {leaveByTime && !isDraft && (
                    <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Leave by {leaveByTime}
                        </span>
                    </>
                )}
            </div>

            {countdown && !isDraft && (
                <div className="mt-2 text-sm font-semibold text-primary">{countdown}</div>
            )}

            {isDraft && (
                <p className="mt-2 text-xs text-muted-foreground">Continue draft →</p>
            )}
            {trip.status === 'active' && (
                <p className="mt-2 text-xs text-muted-foreground">Tap to view trip</p>
            )}
            {isInProgress && (
                <p className="mt-2 text-xs text-muted-foreground">Live — tap for details</p>
            )}
            {isComplete && (
                <p className="mt-2 text-xs text-muted-foreground">Tap to view summary</p>
            )}
        </CardTag>
    );
}

function HistoryTripRow({ trip, isFirst }) {
    const route = trip.origin_iata && trip.destination_iata
        ? `${trip.origin_iata} → ${trip.destination_iata}`
        : null;

    return (
        <div className={`px-5 py-4 flex items-center gap-3 ${!isFirst ? 'border-t border-border' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Plane className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <p className="text-sm font-bold text-foreground truncate">
                        {trip.flight_number}
                    </p>
                    {route && (
                        <span className="text-xs text-muted-foreground shrink-0">{route}</span>
                    )}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                        {formatDate(trip.departure_date)}
                    </span>
                    {trip.airline && (
                        <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{trip.airline}</span>
                        </>
                    )}
                </div>
            </div>
            {trip.accuracy_delta_minutes != null && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                    ±{Math.round(trip.accuracy_delta_minutes)}min
                </span>
            )}
            {trip.accuracy_delta_minutes == null && trip.feedback && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                    Reviewed
                </span>
            )}
        </div>
    );
}

export default function Trips() {
    const navigate = useNavigate();
    const { token, isAuthenticated, isPro } = useAuth();
    const { handleTabChange, authOpen, setAuthOpen, handleAuthSuccess } = useAuthGatedTabs('trip');

    const tabs = [
        {
            value: 'search',
            label: 'Search',
            icon: <MagnifyingGlass size={22} weight="regular" />,
            iconActive: <MagnifyingGlass size={22} weight="bold" />,
        },
        {
            value: 'trip',
            label: 'My Trip',
            icon: <Airplane size={22} weight="regular" />,
            iconActive: <Airplane size={22} weight="bold" />,
        },
        {
            value: 'settings',
            label: 'Settings',
            icon: <Gear size={22} weight="regular" />,
            iconActive: <Gear size={22} weight="bold" />,
        },
    ];

    // Active tab state
    const [activeTrips, setActiveTrips] = useState([]);
    const [activeLoading, setActiveLoading] = useState(true);
    const [activeError, setActiveError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // History tab state
    const [historyTrips, setHistoryTrips] = useState([]);
    const [historyAggregate, setHistoryAggregate] = useState({ avg_accuracy_minutes: null, total_trips_with_feedback: 0, total: 0 });
    const [historyOffset, setHistoryOffset] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('active');
    const [paywallOpen, setPaywallOpen] = useState(false);
    const historyFetchedRef = useRef(false);

    // Pull-to-refresh state
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartY = useRef(0);
    const scrollContainerRef = useRef(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) navigate(createPageUrl('Home'), { replace: true });
    }, [isAuthenticated, navigate]);

    // Fetch active trips
    const fetchActiveTrips = useCallback(async () => {
        if (!token) return;
        setActiveError(null);
        try {
            const res = await fetch(`${API_BASE}/v1/trips/active-list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Active list failed (${res.status})`);
            const data = await res.json();
            setActiveTrips(Array.isArray(data.trips) ? data.trips : []);
        } catch (err) {
            console.error('Active trips fetch failed:', err);
            setActiveError("Couldn't load your trips. Please try again.");
        } finally {
            setActiveLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    // Fetch history page
    const fetchHistoryPage = useCallback(async (pageOffset, append) => {
        if (!token) return;
        if (append) setHistoryLoadingMore(true); else setHistoryLoading(true);
        setHistoryError(null);
        try {
            const res = await fetch(
                `${API_BASE}/v1/trips/history?limit=${HISTORY_PAGE_SIZE}&offset=${pageOffset}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(`History failed (${res.status})`);
            const data = await res.json();
            const incoming = Array.isArray(data.trips) ? data.trips : [];
            setHistoryTrips(prev => append ? [...prev, ...incoming] : incoming);
            setHistoryAggregate({
                avg_accuracy_minutes: data.avg_accuracy_minutes ?? null,
                total_trips_with_feedback: data.total_trips_with_feedback ?? 0,
                total: data.total ?? incoming.length,
            });
            setHistoryOffset(pageOffset + incoming.length);
        } catch (err) {
            console.error('Trip history fetch failed:', err);
            setHistoryError("Couldn't load your trip history. Please try again.");
        } finally {
            setHistoryLoading(false);
            setHistoryLoadingMore(false);
        }
    }, [token]);

    // Eager history count — fetch total on mount so tab visibility is correct
    // even when active-list has only 1 trip but history has completed trips.
    const [historyTotal, setHistoryTotal] = useState(null);
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/v1/trips/history?limit=1&offset=0`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const data = await res.json();
                    setHistoryTotal(data.total ?? 0);
                }
            } catch {
                // Non-blocking — tabs just won't show for edge case
            }
        })();
    }, [token]);

    // Load active trips on mount
    useEffect(() => {
        if (token) fetchActiveTrips();
    }, [token, fetchActiveTrips]);

    // Lazy-load full history when History tab is first selected
    useEffect(() => {
        if (activeTab === 'history' && !historyFetchedRef.current && token) {
            historyFetchedRef.current = true;
            fetchHistoryPage(0, false);
        }
    }, [activeTab, token, fetchHistoryPage]);

    // Pull-to-refresh handlers
    const handleTouchStart = useCallback((e) => {
        const container = scrollContainerRef.current;
        if (container && container.scrollTop === 0) {
            touchStartY.current = e.touches[0].clientY;
        } else {
            touchStartY.current = 0;
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!touchStartY.current) return;
        const diff = e.touches[0].clientY - touchStartY.current;
        if (diff > 0) {
            setPullDistance(Math.min(diff * 0.5, 80));
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (pullDistance > 50) {
            setRefreshing(true);
            fetchActiveTrips();
        }
        setPullDistance(0);
        touchStartY.current = 0;
    }, [pullDistance, fetchActiveTrips]);

    if (!isAuthenticated) return null;

    // Tab visibility: show tabs when active-list >= 2 OR history has at least 1 entry.
    // This ensures users with 1 active + completed trips can reach History tab.
    const totalActiveTrips = activeTrips.length;
    const hasLoaded = !activeLoading;
    const hasHistory = historyTotal != null && historyTotal >= 1;

    const showTabs = hasLoaded && !activeError && (totalActiveTrips >= 2 || hasHistory);
    const showSingleTrip = hasLoaded && !activeError && totalActiveTrips === 1 && !hasHistory;
    const showEmpty = hasLoaded && !activeError && totalActiveTrips === 0 && !hasHistory;

    // History tab data
    const visibleHistory = isPro ? historyTrips : historyTrips.slice(0, FREE_TIER_HISTORY_LIMIT);
    const historyMoreAvailable = isPro
        ? historyOffset < historyAggregate.total
        : historyAggregate.total > FREE_TIER_HISTORY_LIMIT;

    return (
        <div className="min-h-screen bg-secondary/50 font-sans antialiased pb-28">
            {/* Header — logomark only. Tab switching lives in the DS TabBar
               at the bottom; empty state surfaces "+ New Trip" directly. */}
            <header className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
                    <Link to="/search" className="inline-flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Plane className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg text-foreground">AirBridge</span>
                    </Link>
                </div>
            </header>

            <div
                className="max-w-2xl mx-auto px-4 py-6"
                ref={scrollContainerRef}
                onTouchStart={activeTab === 'active' ? handleTouchStart : undefined}
                onTouchMove={activeTab === 'active' ? handleTouchMove : undefined}
                onTouchEnd={activeTab === 'active' ? handleTouchEnd : undefined}
            >
                {/* Pull-to-refresh indicator */}
                {(pullDistance > 0 || refreshing) && activeTab === 'active' && (
                    <div
                        className="flex items-center justify-center transition-all overflow-hidden"
                        style={{ height: pullDistance > 0 ? pullDistance : 40 }}
                    >
                        <div className={`w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full ${
                            refreshing ? 'animate-spin' : ''
                        }`} />
                    </div>
                )}

                {/* Loading state */}
                {activeLoading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    </div>
                )}

                {/* Error state (top-level, outside tabs) */}
                {hasLoaded && activeError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 text-center">
                        <p className="text-sm text-destructive font-medium mb-2">{activeError}</p>
                        <button
                            onClick={fetchActiveTrips}
                            className="text-sm font-semibold text-destructive underline hover:text-destructive/80"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Empty state: 0 trips */}
                {showEmpty && (
                    <div className="bg-card border border-border rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                            <Plane className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">No trips yet</p>
                        <p className="text-xs text-muted-foreground mb-4">Your tracked trips will appear here.</p>
                        <Link
                            to="/search"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New Trip
                        </Link>
                    </div>
                )}

                {/* Single trip: direct to detail */}
                {showSingleTrip && (
                    <div>
                        <ActiveTripCard trip={activeTrips[0]} />
                    </div>
                )}

                {/* Multiple trips: tabbed view */}
                {showTabs && (
                    <>
                        {/* Segmented control */}
                        <div className="flex bg-secondary rounded-xl p-1 mb-5">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                                    activeTab === 'active'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                                    activeTab === 'history'
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                History
                            </button>
                        </div>

                        {/* Active tab content */}
                        {activeTab === 'active' && (
                            <div className="space-y-3">
                                {activeError && (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
                                        <p className="text-sm text-destructive">{activeError}</p>
                                        <button
                                            onClick={fetchActiveTrips}
                                            className="text-sm font-semibold text-destructive underline mt-1 hover:text-destructive/80"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                )}
                                {activeTrips.length === 0 && !activeError && (
                                    <div className="bg-card border border-border rounded-2xl p-8 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                                            <Plane className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground mb-1">No active trips</p>
                                        <p className="text-xs text-muted-foreground mb-4">Your tracked trips will appear here.</p>
                                        <Link
                                            to="/search"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            New Trip
                                        </Link>
                                    </div>
                                )}
                                {activeTrips.map(trip => (
                                    <ActiveTripCard key={trip.trip_id} trip={trip} />
                                ))}
                            </div>
                        )}

                        {/* History tab content */}
                        {activeTab === 'history' && (
                            <div>
                                {/* Aggregate stats card */}
                                {!historyLoading && historyAggregate.total_trips_with_feedback > 0 && historyAggregate.avg_accuracy_minutes != null && (
                                    <div className="bg-card border border-border rounded-2xl p-5 mb-4 flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <BarChart3 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                Within {Math.round(historyAggregate.avg_accuracy_minutes)} min on your last {historyAggregate.total_trips_with_feedback} trip{historyAggregate.total_trips_with_feedback === 1 ? '' : 's'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Personal accuracy average</p>
                                        </div>
                                    </div>
                                )}

                                {/* History loading */}
                                {historyLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                                    </div>
                                )}

                                {/* History error */}
                                {historyError && !historyLoading && (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-4">
                                        <p className="text-sm text-destructive">{historyError}</p>
                                        <button
                                            onClick={() => {
                                                historyFetchedRef.current = false;
                                                fetchHistoryPage(0, false);
                                            }}
                                            className="text-sm font-semibold text-destructive underline mt-1 hover:text-destructive/80"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                )}

                                {/* History empty state */}
                                {!historyLoading && !historyError && visibleHistory.length === 0 && (
                                    <div className="bg-card border border-border rounded-2xl p-8 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                                            <History className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground mb-1">No completed trips yet</p>
                                        <p className="text-xs text-muted-foreground">Your completed trips will appear here.</p>
                                    </div>
                                )}

                                {/* History trip rows */}
                                {!historyLoading && visibleHistory.length > 0 && (
                                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                        {visibleHistory.map((trip, idx) => (
                                            <HistoryTripRow key={trip.trip_id} trip={trip} isFirst={idx === 0} />
                                        ))}
                                    </div>
                                )}

                                {/* Free tier upgrade CTA */}
                                {!historyLoading && !isPro && historyTrips.length > 0 && historyAggregate.total > FREE_TIER_HISTORY_LIMIT && (
                                    <button
                                        onClick={() => setPaywallOpen(true)}
                                        className="w-full mt-4 py-3 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        See all {historyAggregate.total} trips with Pro
                                    </button>
                                )}

                                {/* Pro tier load more */}
                                {!historyLoading && isPro && historyMoreAvailable && (
                                    <button
                                        onClick={() => fetchHistoryPage(historyOffset, true)}
                                        disabled={historyLoadingMore}
                                        className="w-full mt-4 py-3 rounded-2xl text-sm font-medium border border-border bg-card text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                                    >
                                        {historyLoadingMore ? 'Loading…' : 'Load more'}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <PaywallModal
                open={paywallOpen}
                onOpenChange={setPaywallOpen}
                token={token}
            />

            <TabBar value="trip" onChange={handleTabChange} tabs={tabs} />

            <AuthModal
                open={authOpen}
                onOpenChange={setAuthOpen}
                onSuccess={handleAuthSuccess}
            />
        </div>
    );
}
