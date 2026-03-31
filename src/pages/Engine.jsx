import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Settings } from 'lucide-react';

import StepEntry from '@/components/engine/StepEntry';
import StepSelectFlight from '@/components/engine/StepSelectFlight';
import StepDepartureSetup from '@/components/engine/StepDepartureSetup';
import LoadingView from '@/components/engine/LoadingView';
import ResultsView from '@/components/engine/ResultsView';
import ActiveTripView from '@/components/engine/ActiveTripView';
import AuthModal from '@/components/engine/AuthModal';
import { useAuth } from '@/lib/AuthContext';
import { mapFlights } from '@/utils/mapFlight';

import { API_BASE } from '@/config';
import { track } from '@/utils/analytics';

// ── Animations ──────────────────────────────────────────────────────────────
const pageTransition = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Engine() {
    const { token, login, logout, updateTripCount, isAuthenticated, display_name } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);

    // Step 1 — trip-specific
    const [inputMode, setInputMode] = useState('flight_number');
    const [departureDate, setDepartureDate] = useState(todayStr);
    const [flightNumber, setFlightNumber] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Route search — lifted state
    const [routeOrigin, setRouteOrigin] = useState('');
    const [routeDestination, setRouteDestination] = useState('');
    const [routeTimeWindow, setRouteTimeWindow] = useState('any');

    // Step 2 — trip-specific
    const [searching, setSearching] = useState(false);
    const [flightOptions, setFlightOptions] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [searchError, setSearchError] = useState(null);

    // Step 3 — user preferences (kept across trips)
    const [startingAddress, setStartingAddress] = useState('');
    const [transport, setTransport] = useState('rideshare');
    const [hasPrecheck, setHasPrecheck] = useState(false);
    const [hasClear, setHasClear] = useState(false);
    const [hasPriorityLane, setHasPriorityLane] = useState(false);
    const [hasBoardingPass, setHasBoardingPass] = useState(true);
    const [bagCount, setBagCount] = useState(0);
    const [withChildren, setWithChildren] = useState(false);
    const [gateTime, setGateTime] = useState(15);

    // OTP modal
    const [authOpen, setAuthOpen] = useState(false);

    // Results — trip-specific
    const [locked, setLocked] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [journeyReady, setJourneyReady] = useState(false);
    const [viewMode, setViewMode] = useState('setup');
    const [apiError, setApiError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTripId, setCurrentTripId] = useState(null);
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [addressError, setAddressError] = useState(null);
    const [lastSearchParams, setLastSearchParams] = useState(null);

    // Active trip
    const [activeTripData, setActiveTripData] = useState(null);
    const [activeTripRec, setActiveTripRec] = useState(null);
    const [checkingActiveTrip, setCheckingActiveTrip] = useState(true);

    // Track flow
    const [isTracked, setIsTracked] = useState(false);

    const addressContainerRef = useRef(null);
    const addressInputRef = useRef(null);

    // ── Smart reset: clears trip state, keeps user preferences ──────────────
    const resetTripState = () => {
        setFlightNumber('');
        setDepartureDate(todayStr());
        setSelectedFlight(null);
        setFlightOptions([]);
        setSearchError(null);
        setInputMode('flight_number');
        setCurrentTripId(null);
        setRecommendation(null);
        setLocked(false);
        setJourneyReady(false);
        setViewMode('setup');
        setApiError(null);
        setAddressError(null);
        setBagCount(0);
        setDir(-1);
        setStep(1);
        setLastSearchParams(null);
        setActiveTripData(null);
        setActiveTripRec(null);
        setIsTracked(false);
        // Route search fields are trip-specific too
        setRouteOrigin('');
        setRouteDestination('');
        setRouteTimeWindow('any');
    };

    // Fresh state on page mount
    const mountedRef = useRef(false);
    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;
        resetTripState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check for active trip on mount, then hydrate preferences from trip or profile
    useEffect(() => {
        if (!token) {
            setCheckingActiveTrip(false);
            return;
        }

        (async () => {
            try {
                // 1. Check for active trip first
                const res = await fetch(`${API_BASE}/v1/trips/active`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data?.trip) {
                        // ACTIVE TRIP EXISTS — hydrate from trip data
                        const tripData = data.trip;
                        setActiveTripData(tripData);

                        // Hydrate preferences from trip's preferences_json
                        if (tripData.preferences_json) {
                            try {
                                const prefs = typeof tripData.preferences_json === 'string'
                                    ? JSON.parse(tripData.preferences_json)
                                    : tripData.preferences_json;
                                if (prefs.transport_mode) setTransport(prefs.transport_mode);
                                if (prefs.bag_count != null) setBagCount(prefs.bag_count);
                                if (prefs.traveling_with_children != null) setWithChildren(prefs.traveling_with_children);
                                if (prefs.has_boarding_pass != null) setHasBoardingPass(prefs.has_boarding_pass);
                                if (prefs.gate_time_minutes != null) setGateTime(prefs.gate_time_minutes);
                                if (prefs.security_access) {
                                    setHasPrecheck(prefs.security_access === 'precheck' || prefs.security_access === 'clear_precheck');
                                    setHasClear(prefs.security_access === 'clear' || prefs.security_access === 'clear_precheck');
                                    setHasPriorityLane(prefs.security_access === 'priority_lane');
                                } else {
                                    setHasPrecheck(false);
                                    setHasClear(false);
                                    setHasPriorityLane(false);
                                }
                            } catch (e) {
                                console.error('Failed to parse trip preferences:', e);
                            }
                        }
                        if (tripData.home_address) setStartingAddress(tripData.home_address);
                        if (tripData.flight_number) setFlightNumber(tripData.flight_number);
                        if (tripData.departure_date) setDepartureDate(tripData.departure_date);
                        setCurrentTripId(tripData.trip_id);

                        // Fetch recommendation
                        try {
                            const recRes = await fetch(`${API_BASE}/v1/recommendations`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ trip_id: tripData.trip_id }),
                            });
                            if (recRes.ok) {
                                const rec = await recRes.json();
                                setActiveTripRec(rec);
                                setRecommendation(rec);
                                setIsTracked(true);

                                // Fetch full flight data for display
                                let flightSet = false;
                                try {
                                    const flightRes = await fetch(
                                        `${API_BASE}/v1/flights/${encodeURIComponent(tripData.flight_number)}/${tripData.departure_date}`,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    if (flightRes.ok) {
                                        const flightData = await flightRes.json();
                                        const flights = mapFlights(flightData.flights || []);
                                        const matchedFlight = flights.find(f =>
                                            f.departure_time_utc === tripData.selected_departure_utc
                                        ) || flights[0];
                                        if (matchedFlight) {
                                            setSelectedFlight(matchedFlight);
                                            flightSet = true;
                                        }
                                    }
                                } catch {
                                    // Fall through to reconstructed flight
                                }

                                // Fallback: reconstruct flight if fetch failed
                                if (!flightSet) {
                                    const reconstructedFlight = {
                                        flight_number: tripData.flight_number,
                                        departure_date: tripData.departure_date,
                                        departure_time_utc: tripData.selected_departure_utc,
                                        departure_time: tripData.selected_departure_utc,
                                        origin_code: '', destination_code: '', destination_name: '', origin_name: '',
                                        departure_terminal: '', departure_gate: '', status: 'scheduled',
                                    };
                                    const transportSeg = rec.segments?.[0];
                                    if (transportSeg?.label) {
                                        const match = transportSeg.label.match(/to (\w{3})/);
                                        if (match) reconstructedFlight.origin_code = match[1];
                                    }
                                    const gateSeg = rec.segments?.find(s => s.id === 'walk_to_gate');
                                    if (gateSeg?.advice) {
                                        const gateMatch = gateSeg.advice.match(/Gate\s+(\S+)/);
                                        const termMatch = gateSeg.advice.match(/Terminal\s+(\S+)/);
                                        if (gateMatch) reconstructedFlight.departure_gate = gateMatch[1];
                                        if (termMatch) reconstructedFlight.departure_terminal = termMatch[1];
                                    }
                                    setSelectedFlight(reconstructedFlight);
                                }

                                setViewMode('active_trip');
                            }
                        } catch {
                            // Fall through to normal flow
                        }

                        setCheckingActiveTrip(false);
                        return; // Done — skip profile hydration
                    }
                }

                // 2. NO ACTIVE TRIP — hydrate preferences from user profile
                try {
                    const profileRes = await fetch(`${API_BASE}/v1/users/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        const prefs = profileData.preferences;
                        if (prefs) {
                            if (prefs.transport_mode) setTransport(prefs.transport_mode);
                            if (prefs.has_boarding_pass != null) setHasBoardingPass(prefs.has_boarding_pass);
                            if (prefs.traveling_with_children != null) setWithChildren(prefs.traveling_with_children);
                            if (prefs.gate_time_minutes != null) setGateTime(prefs.gate_time_minutes);
                            if (prefs.bag_count != null) setBagCount(prefs.bag_count);
                            const sec = prefs.security_access;
                            if (sec === 'priority_lane') {
                                setHasPriorityLane(true);
                            } else if (sec === 'clear_precheck') {
                                setHasPrecheck(true); setHasClear(true);
                            } else if (sec === 'precheck') {
                                setHasPrecheck(true);
                            } else if (sec === 'clear') {
                                setHasClear(true);
                            }
                        }
                    }
                } catch {
                    // Silently fall back to defaults
                }

            } catch {
                // Fall through to normal flow
            } finally {
                setCheckingActiveTrip(false);
            }
        })();
    }, [token]);

    const goTo = (next) => { setDir(next > step ? 1 : -1); setStep(next); };

    const computeSecurityAccess = () => {
        if (hasPriorityLane) return 'priority_lane';
        if (hasPrecheck && hasClear) return 'clear_precheck';
        if (hasPrecheck) return 'precheck';
        if (hasClear) return 'clear';
        return 'none';
    };

    const buildPreferences = () => ({
        transport_mode: transport,
        confidence_profile: 'sweet',
        bag_count: bagCount,
        traveling_with_children: withChildren,
        extra_time_minutes: 0,
        has_boarding_pass: hasBoardingPass,
        security_access: computeSecurityAccess(),
        gate_time_minutes: gateTime,
    });

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleFindFlight = async () => {
        if (!flightNumber.trim() || !departureDate) return;
        track('flight_entry_submitted', { flight_number: flightNumber.trim(), departure_date: departureDate, input_mode: 'flight_number' });

        // Skip re-fetch if inputs haven't changed and we have results
        if (
            lastSearchParams &&
            lastSearchParams.mode === 'flight_number' &&
            lastSearchParams.flightNumber === flightNumber.trim() &&
            lastSearchParams.departureDate === departureDate &&
            flightOptions.length > 0
        ) {
            goTo(2);
            return;
        }

        setSearching(true);
        setSelectedFlight(null);
        setSearchError(null);
        setFlightOptions([]);
        goTo(2);
        try {
            const addrParam = startingAddress.trim() ? `?home_address=${encodeURIComponent(startingAddress.trim())}` : '';
            const res = await fetch(`${API_BASE}/v1/flights/${encodeURIComponent(flightNumber.trim())}/${departureDate}${addrParam}`, {
                headers: { ...authHeaders },
            });
            if (!res.ok) {
                setFlightOptions([]);
                setSearchError('Could not look up flights. Please check the flight number and try again.');
                setSearching(false);
                return;
            }
            const data = await res.json();
            const flights = mapFlights(data.flights);
            setFlightOptions(flights);
            setLastSearchParams({ mode: 'flight_number', flightNumber: flightNumber.trim(), departureDate });
        } catch (err) {
            console.error('Flight lookup failed:', err);
            setFlightOptions([]);
            setSearchError('Network error — could not reach the server. Please check your connection and try again.');
        }
        setSearching(false);
    };

    const handleFlightClick = (f) => {
        if (f.departed || f.canceled || f.is_boarding) return;
        track('flight_selected', { flight_number: f.flight_number, origin: f.origin_code, destination: f.destination_code });
        setSelectedFlight(f);
        if (locked) { setLocked(false); setRecommendation(null); setJourneyReady(false); setCurrentTripId(null); }
    };

    const handleContinueToSetup = () => { if (selectedFlight) goTo(3); };

    const handleLockIn = async () => {
        if (isSubmitting) return;

        // Draft already exists — just recompute with current preferences
        if (currentTripId) {
            setViewMode('loading');
            setJourneyReady(false);
            setApiError(null);
            setIsSubmitting(true);
            try {
                const recRes = await fetch(`${API_BASE}/v1/recommendations/recompute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify({
                        trip_id: currentTripId,
                        reason: 'preference_change',
                        preference_overrides: buildPreferences(),
                        home_address: startingAddress,
                    }),
                });
                if (!recRes.ok) throw new Error(`Recompute failed (${recRes.status})`);
                const rec = await recRes.json();
                setRecommendation(rec);
                setJourneyReady(true);
                if (isTracked) {
                    setActiveTripData({
                        trip_id: currentTripId,
                        flight_number: flightNumber,
                        departure_date: departureDate,
                        home_address: startingAddress,
                        status: 'active',
                        selected_departure_utc: selectedFlight?.departure_time_utc,
                        preferences_json: JSON.stringify(buildPreferences()),
                    });
                    setActiveTripRec(rec);
                    setTimeout(() => setViewMode('active_trip'), 500);
                } else {
                    setTimeout(() => setViewMode('results'), 500);
                }
            } catch (err) {
                console.error('Recompute failed:', err);
                setApiError(err.message || 'Something went wrong.');
                setViewMode('results');
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        if (!selectedFlight) {
            setApiError('No flight selected. Please start over.');
            setViewMode('setup');
            return;
        }

        setIsSubmitting(true);
        setLocked(true);
        setJourneyReady(false);
        setApiError(null);
        setViewMode('loading');

        try {
            const tripRes = await fetch(`${API_BASE}/v1/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    input_mode: 'flight_number',
                    flight_number: selectedFlight.flight_number,
                    departure_date: departureDate,
                    home_address: startingAddress,
                    selected_departure_utc: selectedFlight.departure_time_utc,
                    preferences: buildPreferences(),
                })
            });
            if (!tripRes.ok) {
                const errBody = await tripRes.text();
                throw new Error(`Trip creation failed (${tripRes.status}): ${errBody}`);
            }
            const trip = await tripRes.json();
            setCurrentTripId(trip.trip_id);

            const recRes = await fetch(`${API_BASE}/v1/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ trip_id: trip.trip_id })
            });
            if (!recRes.ok) {
                const errBody = await recRes.text();
                throw new Error(`Recommendation failed (${recRes.status}): ${errBody}`);
            }
            const rec = await recRes.json();
            setRecommendation(rec);
            track('recommendation_viewed', { leave_by_time: rec.leave_home_at, total_minutes: rec.segments?.reduce((s, seg) => s + (seg.duration_minutes || 0), 0), transport_mode: transport });
            setJourneyReady(true);
            setTimeout(() => setViewMode('results'), 500);
        } catch (err) {
            console.error('Recommendation failed:', err);
            setApiError(err.message || 'Something went wrong. Please try again.');
            setLocked(false);
            setJourneyReady(false);
            setViewMode('setup');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecompute = async () => {
        if (!currentTripId || isRecomputing) return false;
        setIsRecomputing(true);
        setApiError(null);

        try {
            const recRes = await fetch(`${API_BASE}/v1/recommendations/recompute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    trip_id: currentTripId,
                    reason: 'preference_change',
                    preference_overrides: buildPreferences(),
                    home_address: startingAddress,
                })
            });
            if (!recRes.ok) {
                const errBody = await recRes.text();
                throw new Error(`Recompute failed (${recRes.status}): ${errBody}`);
            }
            const rec = await recRes.json();
            setRecommendation(rec);
            return true;
        } catch (err) {
            console.error('Recompute failed:', err);
            setApiError(err.message || 'Could not update your recommendation. Please try again.');
            return false;
        } finally {
            setIsRecomputing(false);
        }
    };

    const handleRouteFlightsFound = (flights, meta) => {
        track('route_search_submitted', { origin: meta?.origin, destination: meta?.destination, date: meta?.date, time_window: meta?.timeWindow });
        if (meta?.date) setDepartureDate(meta.date);
        setFlightOptions(flights);
        setSearching(false);
        setLastSearchParams({
            mode: 'route',
            origin: meta?.origin || routeOrigin,
            destination: meta?.destination || routeDestination,
            date: meta?.date || departureDate,
            timeWindow: meta?.timeWindow || routeTimeWindow,
        });
        goTo(2);
    };

    const handleReset = () => {
        track('start_over_clicked');
        resetTripState();
    };

    const handleEditSetup = () => {
        setLocked(false);
        setJourneyReady(false);
        setViewMode('setup');
        setApiError(null);
    };

    const handleTrackTrip = async () => {
        if (!currentTripId) return;
        if (!isAuthenticated) {
            track('auth_modal_opened', { trigger: 'track_trip' });
            setAuthOpen(true);
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/v1/trips/${currentTripId}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
            });
            if (res.ok) {
                const data = await res.json();
                setIsTracked(true);
                if (data.trip_count != null) updateTripCount(data.trip_count);
                track('trip_tracked', { trip_id: currentTripId });
                // Switch to active trip view
                setActiveTripData({
                    trip_id: currentTripId,
                    flight_number: flightNumber,
                    departure_date: departureDate,
                    home_address: startingAddress,
                    status: 'active',
                    selected_departure_utc: selectedFlight?.departure_time_utc,
                    preferences_json: JSON.stringify(buildPreferences()),
                });
                setActiveTripRec(recommendation);
                setViewMode('active_trip');
            }
        } catch (err) {
            console.error('Failed to track trip:', err);
        }
    };

    const handleRecalculate = async () => {
        if (!startingAddress.trim()) {
            setAddressError('Please enter your starting address');
            addressContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            addressInputRef.current?.focus();
            return;
        }
        if (currentTripId) {
            if (isRecomputing) return;
            setLocked(true);
            setJourneyReady(false);
            setViewMode('loading');
            setApiError(null);
            const success = await handleRecompute();
            if (success) {
                setJourneyReady(true);
                if (isTracked) {
                    setActiveTripData({
                        trip_id: currentTripId,
                        flight_number: flightNumber,
                        departure_date: departureDate,
                        home_address: startingAddress,
                        status: 'active',
                        selected_departure_utc: selectedFlight?.departure_time_utc,
                        preferences_json: JSON.stringify(buildPreferences()),
                    });
                    setActiveTripRec(recommendation);
                    setViewMode('active_trip');
                } else {
                    setViewMode('results');
                }
            } else {
                setViewMode('results');
            }
        } else {
            await handleLockIn();
        }
    };

    const canSearch = flightNumber.trim().length > 0 && departureDate.length > 0;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-secondary/50 font-sans antialiased">

            {/* ── HEADER ── */}
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
                            <Link to={createPageUrl('Home')} className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">Home</Link>
                            <span className="text-foreground font-semibold px-3 py-1.5 bg-secondary rounded-lg">Departure Engine</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <AnimatePresence mode="wait">
                            {locked && recommendation ? (
                                <motion.div key="live" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs text-emerald-700 font-medium">Live</span>
                                </motion.div>
                            ) : (
                                <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent border border-primary/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-xs text-primary font-medium">Engine Active</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                                    {(display_name || '').charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {display_name ? display_name.split(' ')[0] : 'Account'}
                                </span>
                                <Link to={createPageUrl('Settings')} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all ml-1" title="Settings">
                                    <Settings className="w-4 h-4" />
                                </Link>
                                <button onClick={logout} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">Sign out</button>
                            </div>
                        ) : (
                            <button onClick={() => { track('auth_modal_opened', { trigger: 'navbar' }); setAuthOpen(true); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block">Sign In</button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            {checkingActiveTrip && (
                <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                </div>
            )}

            {!checkingActiveTrip && (
            <AnimatePresence mode="wait">

                {/* ════════════════ ACTIVE TRIP VIEW ════════════════ */}
                {viewMode === 'active_trip' && activeTripData && (
                    <ActiveTripView
                        trip={activeTripData}
                        recommendation={activeTripRec}
                        selectedFlight={selectedFlight}
                        transport={transport}
                        isAuthenticated={isAuthenticated}
                        display_name={display_name}
                        onNewTrip={() => {
                            setActiveTripData(null);
                            setActiveTripRec(null);
                            resetTripState();
                        }}
                        onEdit={() => {
                            // State is already hydrated from active trip load
                            setActiveTripData(null);
                            setActiveTripRec(null);
                            setViewMode('setup');
                            setStep(3);
                            setDir(1);
                            setLocked(false);
                        }}
                        onRefresh={async () => {
                            if (!activeTripData) return;
                            try {
                                const res = await fetch(`${API_BASE}/v1/recommendations`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                                    body: JSON.stringify({ trip_id: activeTripData.trip_id }),
                                });
                                if (res.ok) {
                                    const rec = await res.json();
                                    setActiveTripRec(rec);
                                }
                            } catch (err) {
                                console.error('Failed to refresh active trip:', err);
                            }
                        }}
                    />
                )}

                {/* ════════════════ SETUP VIEW ════════════════ */}
                {viewMode === 'setup' && (
                    <motion.div key="setup" {...pageTransition} className="min-h-[calc(100vh-57px)] flex items-start justify-center py-8 md:py-12 px-4">
                        <AnimatePresence mode="wait" custom={dir}>

                            {step === 1 && (
                                <StepEntry
                                    flightNumber={flightNumber} setFlightNumber={setFlightNumber}
                                    departureDate={departureDate} setDepartureDate={setDepartureDate}
                                    calendarOpen={calendarOpen} setCalendarOpen={setCalendarOpen}
                                    inputMode={inputMode} setInputMode={setInputMode}
                                    canSearch={canSearch}
                                    onFindFlight={handleFindFlight}
                                    onRouteFlightsFound={handleRouteFlightsFound}
                                    authHeaders={authHeaders}
                                    routeOrigin={routeOrigin} setRouteOrigin={setRouteOrigin}
                                    routeDestination={routeDestination} setRouteDestination={setRouteDestination}
                                    routeTimeWindow={routeTimeWindow} setRouteTimeWindow={setRouteTimeWindow}
                                    lastSearchParams={lastSearchParams} flightOptions={flightOptions}
                                />
                            )}

                            {step === 2 && (
                                <StepSelectFlight
                                    flightOptions={flightOptions}
                                    selectedFlight={selectedFlight}
                                    searching={searching}
                                    searchError={searchError}
                                    inputMode={inputMode}
                                    flightNumber={flightNumber}
                                    departureDate={departureDate}
                                    onFlightClick={handleFlightClick}
                                    onContinue={handleContinueToSetup}
                                    onBack={() => goTo(1)}
                                    onRetry={handleFindFlight}
                                />
                            )}

                            {step === 3 && (
                                <StepDepartureSetup
                                    selectedFlight={selectedFlight}
                                    flightNumber={flightNumber}
                                    startingAddress={startingAddress} setStartingAddress={setStartingAddress}
                                    addressError={addressError} setAddressError={setAddressError}
                                    addressContainerRef={addressContainerRef} addressInputRef={addressInputRef}
                                    transport={transport} setTransport={setTransport}
                                    hasPrecheck={hasPrecheck} setHasPrecheck={setHasPrecheck}
                                    hasClear={hasClear} setHasClear={setHasClear}
                                    hasPriorityLane={hasPriorityLane} setHasPriorityLane={setHasPriorityLane}
                                    hasBoardingPass={hasBoardingPass} setHasBoardingPass={setHasBoardingPass}
                                    bagCount={bagCount} setBagCount={setBagCount}
                                    withChildren={withChildren} setWithChildren={setWithChildren}
                                    gateTime={gateTime} setGateTime={setGateTime}
                                    currentTripId={currentTripId}
                                    isSubmitting={isSubmitting} isRecomputing={isRecomputing}
                                    apiError={apiError} setApiError={setApiError}
                                    onRecalculate={handleRecalculate}
                                    onBack={() => goTo(2)}
                                    onReset={handleReset}
                                />
                            )}

                        </AnimatePresence>
                    </motion.div>
                )}

                {/* ════════════════ LOADING VIEW ════════════════ */}
                {viewMode === 'loading' && (
                    <LoadingView currentTripId={currentTripId} />
                )}

                {/* ════════════════ RESULTS VIEW ════════════════ */}
                {viewMode === 'results' && (
                    <ResultsView
                        recommendation={recommendation}
                        selectedFlight={selectedFlight}
                        transport={transport}
                        isAuthenticated={isAuthenticated}
                        display_name={display_name}
                        apiError={apiError} setApiError={setApiError}
                        onEditSetup={handleEditSetup}
                        onReset={handleReset}
                        onReady={() => setJourneyReady(true)}
                        onSignIn={() => { track('auth_modal_opened', { trigger: 'save_trip' }); setAuthOpen(true); }}
                        isTracked={isTracked}
                        onTrack={handleTrackTrip}
                        securityLabel={
                            hasPriorityLane ? 'Priority Lane' :
                            hasPrecheck && hasClear ? 'CLEAR + PreCheck' :
                            hasPrecheck ? 'TSA PreCheck' :
                            hasClear ? 'CLEAR' : 'Standard TSA'
                        }
                        homeAddress={startingAddress}
                    />
                )}

            </AnimatePresence>
            )}

            <AuthModal open={authOpen} onOpenChange={setAuthOpen} onSuccess={(data) => {
                track('auth_completed', { provider: data.auth_provider || 'phone' });
                login(data);
                // Auto-track if there's a pending trip
                if (currentTripId && !isTracked) {
                    setTimeout(async () => {
                        try {
                            const res = await fetch(`${API_BASE}/v1/trips/${currentTripId}/track`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
                            });
                            if (res.ok) {
                                const trackData = await res.json();
                                setIsTracked(true);
                                if (trackData.trip_count != null) updateTripCount(trackData.trip_count);
                                track('trip_tracked', { trip_id: currentTripId, trigger: 'post_auth' });
                                // Switch to active trip view
                                setActiveTripData({
                                    trip_id: currentTripId,
                                    flight_number: flightNumber,
                                    departure_date: departureDate,
                                    home_address: startingAddress,
                                    status: 'active',
                                    selected_departure_utc: selectedFlight?.departure_time_utc,
                                    preferences_json: JSON.stringify(buildPreferences()),
                                });
                                setActiveTripRec(recommendation);
                                setViewMode('active_trip');
                            }
                        } catch (err) {
                            console.error('Failed to auto-track after auth:', err);
                        }
                    }, 500);
                }
            }} />
        </div>
    );
}
