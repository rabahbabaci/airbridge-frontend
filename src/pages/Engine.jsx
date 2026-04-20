import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

import StepSelectFlight from '@/components/engine/StepSelectFlight';
import StepDepartureSetup from '@/components/engine/StepDepartureSetup';
import LoadingView from '@/components/engine/LoadingView';
import ResultsView from '@/components/engine/ResultsView';
import ActiveTripView from '@/components/engine/ActiveTripView';
import AuthModal from '@/components/engine/AuthModal';
import PushPrimingModal, { shouldShowPushPriming } from '@/components/engine/PushPrimingModal';
import PaywallModal from '@/components/PaywallModal';
import { useAuth } from '@/lib/AuthContext';
import { mapFlights } from '@/utils/mapFlight';

import { API_BASE } from '@/config';
import { isNative } from '@/utils/platform';
import { setupPushListeners, removePushListeners } from '@/utils/pushNotifications';
import { postEvent } from '@/utils/events';
import { clearSearchState } from '@/pages/Search';
import { clearSetupState } from '@/components/engine/StepDepartureSetup';
import { clearRideshareProvider } from '@/utils/rideshareLinks';
import { loadEngineStep, saveEngineStep, clearEngineStep } from '@/utils/engineStep';

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
    const { token, login, logout, updateTripCount, isAuthenticated, display_name, trip_count, isPro } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const location = useLocation();
    const navigate = useNavigate();

    // Step 2 is the new entry point for the in-Engine flow (Flight Selection).
    // Step 1 (flight-number entry form) is retired — canonical entry is the
    // Search screen at `/`, which hands off pre-fetched flights via state.
    const [step, setStep] = useState(2);
    const [dir, setDir] = useState(1);

    const [departureDate, setDepartureDate] = useState(todayStr);
    const [flightNumber, setFlightNumber] = useState('');

    // Flight selection (step 2)
    const [flightOptions, setFlightOptions] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);

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
    const pendingTrackAfterAuth = useRef(false);

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

    // Push priming
    const [pushPrimingOpen, setPushPrimingOpen] = useState(false);

    // Paywall — F6.1
    const [paywallOpen, setPaywallOpen] = useState(false);
    const paywallShownForResultsRef = useRef(false);

    // Edit mode — entered from Trips page when editing a draft or planning-phase active trip
    const [editMode, setEditMode] = useState(false);
    const [editTripId, setEditTripId] = useState(null);
    const [editTripStatus, setEditTripStatus] = useState(null);
    const [editError, setEditError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Latest token, kept in a ref so the push notification listener
    // (registered once on mount) can always read the current value.
    const tokenRef = useRef(token);
    useEffect(() => { tokenRef.current = token; }, [token]);

    const addressContainerRef = useRef(null);
    const addressInputRef = useRef(null);

    // ── Smart reset: clears trip state, keeps user preferences ──────────────
    const resetTripState = () => {
        setFlightNumber('');
        setDepartureDate(todayStr());
        setSelectedFlight(null);
        setFlightOptions([]);
        setCurrentTripId(null);
        setRecommendation(null);
        setLocked(false);
        setJourneyReady(false);
        setViewMode('setup');
        setApiError(null);
        setAddressError(null);
        setBagCount(0);
        setDir(-1);
        setStep(2);
        setLastSearchParams(null);
        setActiveTripData(null);
        setActiveTripRec(null);
        setIsTracked(false);
    };

    // Paywall trigger — show once per results view when the user is no
    // longer Pro (trial exhausted and no active subscription). isPro from
    // AuthContext is the canonical check (Sprint 6 F6.2).
    useEffect(() => {
        if (viewMode !== 'results') {
            paywallShownForResultsRef.current = false;
            return;
        }
        if (paywallShownForResultsRef.current) return;
        if (!isAuthenticated) return;
        if (trip_count == null) return; // wait for trip_count to load
        if (!isPro) {
            paywallShownForResultsRef.current = true;
            setPaywallOpen(true);
        }
    }, [viewMode, isPro, isAuthenticated, trip_count]);

    // Fresh state on page mount
    const mountedRef = useRef(false);
    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;
        resetTripState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Edit mode hydration from Trips page navigation ──────────────────────
    // Trips passes the list-response trip shape via router state. That shape
    // can be partial — notably, /v1/trips/active-list does not reliably
    // include preferences_json, so Setup fields like bag_count, transport,
    // security, etc. fall back to defaults. After the synchronous hydration
    // from router state, fetch GET /v1/trips/{id} to pull the full trip
    // (including the authoritative preferences_json) and re-hydrate.
    const editTripRef = useRef(location.state?.editTrip);
    const hydratePrefsJson = (source) => {
        if (!source) return;
        try {
            const prefs = typeof source === 'string' ? JSON.parse(source) : source;
            if (prefs.transport_mode) setTransport(prefs.transport_mode);
            if (prefs.bag_count != null) setBagCount(prefs.bag_count);
            if (prefs.traveling_with_children != null) setWithChildren(prefs.traveling_with_children);
            if (prefs.has_boarding_pass != null) setHasBoardingPass(prefs.has_boarding_pass);
            if (prefs.gate_time_minutes != null) setGateTime(prefs.gate_time_minutes);
            if (prefs.security_access) {
                setHasPrecheck(prefs.security_access === 'precheck' || prefs.security_access === 'clear_precheck');
                setHasClear(prefs.security_access === 'clear' || prefs.security_access === 'clear_precheck');
                setHasPriorityLane(prefs.security_access === 'priority_lane');
            }
        } catch (e) {
            console.error('Failed to parse edit trip preferences:', e);
        }
    };
    useEffect(() => {
        const trip = editTripRef.current;
        if (!trip) return;

        // Hydrate Step 1 fields
        if (trip.flight_number) setFlightNumber(trip.flight_number);
        if (trip.departure_date) setDepartureDate(trip.departure_date);

        // Hydrate Step 3 fields from router-state trip (may be partial)
        if (trip.home_address) setStartingAddress(trip.home_address);
        hydratePrefsJson(trip.preferences_json);

        setEditMode(true);
        setEditTripId(trip.trip_id);
        setEditTripStatus(trip.status);
        setCurrentTripId(trip.trip_id);
        setCheckingActiveTrip(false);
        // StepEntry was removed; edit mode lands directly on Setup (step 3).
        // Flight-number / date edits are temporarily unavailable until the
        // edit UX is re-built on top of Search.
        setStep(3);
        setDir(1);

        // Supplementary fetches. Two things happen here:
        //   1. GET /v1/trips/{id} → authoritative trip record (preferences).
        //   2. GET /v1/flights/{n}/{date} → live flight metadata so Results
        //      can render the pill cluster + Boarding/Departs cards. The
        //      trip record only stores flight_number + selected_departure_utc;
        //      terminal, gate, departure_time, delays are time-varying and
        //      live under /v1/flights. Same pattern the viewTrip flow uses.
        if (!token || !trip.trip_id) return;
        let cancelled = false;
        (async () => {
            let authoritative = trip;
            try {
                const res = await fetch(`${API_BASE}/v1/trips/${trip.trip_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok && !cancelled) {
                    authoritative = await res.json();
                    if (cancelled) return;
                    if (authoritative.home_address) setStartingAddress(authoritative.home_address);
                    if (authoritative.flight_number) setFlightNumber(authoritative.flight_number);
                    if (authoritative.departure_date) setDepartureDate(authoritative.departure_date);
                    hydratePrefsJson(authoritative.preferences_json);
                }
            } catch (err) {
                console.error('Failed to fetch full trip for edit:', err);
            }

            const fn = authoritative.flight_number;
            const dd = authoritative.departure_date;
            const selectedUtc = authoritative.selected_departure_utc;
            if (!fn || !dd || cancelled) return;
            try {
                const flightRes = await fetch(
                    `${API_BASE}/v1/flights/${encodeURIComponent(fn)}/${dd}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!flightRes.ok || cancelled) return;
                const flightData = await flightRes.json();
                const flights = mapFlights(flightData.flights || []);
                const matched = flights.find(f => f.departure_time_utc === selectedUtc) || flights[0];
                if (matched && !cancelled) setSelectedFlight(matched);
            } catch (err) {
                console.error('Failed to fetch flight metadata for edit:', err);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── View mode hydration from Trips page or app-open routing ─────────────
    const viewTripRef = useRef(location.state?.viewTrip);
    useEffect(() => {
        const trip = viewTripRef.current;
        if (!trip || editTripRef.current) return;

        // Render immediately from passed trip data
        setActiveTripData({
            trip_id: trip.trip_id,
            flight_number: trip.flight_number,
            departure_date: trip.departure_date,
            home_address: trip.home_address,
            status: trip.status,
            selected_departure_utc: trip.selected_departure_utc,
            preferences_json: trip.preferences_json,
        });
        setCurrentTripId(trip.trip_id);
        setIsTracked(true);
        setViewMode('active_trip');
        setCheckingActiveTrip(false);

        // Parse transport from preferences for ActionCards
        if (trip.preferences_json) {
            try {
                const prefs = typeof trip.preferences_json === 'string'
                    ? JSON.parse(trip.preferences_json)
                    : trip.preferences_json;
                if (prefs.transport_mode) setTransport(prefs.transport_mode);
            } catch { /* use default */ }
        }

        // Background: fetch recommendation and flight data
        if (token) {
            (async () => {
                // Fetch recommendation
                try {
                    const recRes = await fetch(`${API_BASE}/v1/recommendations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ trip_id: trip.trip_id }),
                    });
                    if (recRes.ok) {
                        const rec = await recRes.json();
                        setActiveTripRec(rec);
                        setRecommendation(rec);
                    }
                } catch {
                    console.error('Failed to fetch recommendation for viewTrip');
                }

                // Fetch flight details
                if (trip.flight_number && trip.departure_date) {
                    try {
                        const flightRes = await fetch(
                            `${API_BASE}/v1/flights/${encodeURIComponent(trip.flight_number)}/${trip.departure_date}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (flightRes.ok) {
                            const flightData = await flightRes.json();
                            const flights = mapFlights(flightData.flights || []);
                            const matchedFlight = flights.find(f =>
                                f.departure_time_utc === trip.selected_departure_utc
                            ) || flights[0];
                            if (matchedFlight) setSelectedFlight(matchedFlight);
                        }
                    } catch {
                        console.error('Failed to fetch flight data for viewTrip');
                    }
                }
            })();
        }
    }, [token]);

    // ── Prefill from /Search handoff ──────────────────────────────────────
    // Search performs the flight lookup itself and navigates here with
    // pre-fetched flight results. We pick them up and land directly on
    // step 2 (flight selection).
    const fromSearchRef = useRef(location.state?.fromSearch);
    useEffect(() => {
        const fs = fromSearchRef.current;
        if (!fs || editTripRef.current || viewTripRef.current) return;

        if (fs.departureDate) setDepartureDate(fs.departureDate);
        if (fs.mode === 'route') {
            setLastSearchParams({
                mode: 'route',
                origin: fs.routeOrigin,
                destination: fs.routeDestination,
                date: fs.departureDate,
                timeWindow: 'any',
            });
        } else {
            setFlightNumber(fs.flightNumber || '');
            setLastSearchParams({
                mode: 'flight_number',
                flightNumber: fs.flightNumber,
                departureDate: fs.departureDate,
            });
        }

        if (fs.flights?.length) {
            setFlightOptions(fs.flights);
            setCheckingActiveTrip(false);
            // Already on step 2 by default; no goTo needed.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Rehydrate mid-flow position across refresh ───────────────────────
    // If sessionStorage holds an airbridge_engine_step snapshot AND no
    // higher-priority entry context exists (edit/view/fresh-from-Search/
    // explicit-newTrip), revive the user at step 3 (Setup) or step 4
    // (Results). Masquerades as a fromSearch handoff so the active-trip
    // check and the /Engine-→-/ redirect effects treat this as a valid
    // entry context and stand down.
    useEffect(() => {
        if (editTripRef.current || viewTripRef.current || fromSearchRef.current) return;
        if (location.state?.newTrip) return;

        const saved = loadEngineStep();
        if (!saved) return;

        setSelectedFlight(saved.selectedFlight);
        if (saved.flightOptions?.length) setFlightOptions(saved.flightOptions);
        if (saved.flightNumber) setFlightNumber(saved.flightNumber);
        if (saved.departureDate) setDepartureDate(saved.departureDate);
        if (saved.currentTripId) setCurrentTripId(saved.currentTripId);
        if (saved.recommendation) {
            setRecommendation(saved.recommendation);
            setJourneyReady(true);
        }

        // Synthetic fromSearch marker — the useEffect pattern below
        // (active-trip check, /-redirect) treats any truthy value on
        // fromSearchRef as "user has context; don't redirect."
        fromSearchRef.current = { syntheticHydration: true };

        if (saved.step === 4 && saved.recommendation) {
            setStep(3);
            setViewMode('results');
        } else if (saved.step === 3) {
            setStep(3);
            setViewMode('setup');
        }
        setCheckingActiveTrip(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check for active trip on mount, then hydrate preferences from trip or profile
    useEffect(() => {
        // Skip active trip check when in edit, view, or explicit new-trip mode
        if (editTripRef.current || viewTripRef.current || fromSearchRef.current) return;
        if (location.state?.newTrip) {
            setCheckingActiveTrip(false);
            return;
        }

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

    // ── Redirect /Engine → / when the user has no valid entry context ─────
    // StepEntry (step 1) was retired; canonical entry is the Search screen.
    // If a user hits /Engine directly (URL bar, back-forward, etc.) without
    // any hand-off state and without an active trip to show, bounce them
    // to Search rather than render an empty Flight Selection list.
    useEffect(() => {
        if (fromSearchRef.current || editTripRef.current || viewTripRef.current) return;
        if (checkingActiveTrip) return; // wait for the active-trip check
        if (viewMode === 'active_trip') return; // active trip loaded
        navigate('/', { replace: true });
    }, [checkingActiveTrip, viewMode, navigate]);

    // ── Persist mid-flow position for refresh recovery ───────────────────
    // Writes an airbridge_engine_step snapshot whenever the user is in
    // the normal Search → Setup → Results flow. Skipped for edit and
    // view modes (those have their own router-state entry) and for the
    // active_trip / initial flight-selection views. Cleared in the
    // reset, track, and new-trip paths below.
    useEffect(() => {
        if (editMode || editTripRef.current || viewTripRef.current) return;
        if (checkingActiveTrip) return;

        const isSetup = viewMode === 'setup' && step === 3 && selectedFlight;
        const isResults = viewMode === 'results' && recommendation && selectedFlight;

        if (isResults) {
            saveEngineStep({
                step: 4,
                selectedFlight,
                flightOptions,
                flightNumber,
                departureDate,
                currentTripId,
                recommendation,
            });
        } else if (isSetup) {
            saveEngineStep({
                step: 3,
                selectedFlight,
                flightOptions,
                flightNumber,
                departureDate,
                currentTripId: null,
                recommendation: null,
            });
        }
    }, [
        viewMode, step, selectedFlight, flightOptions, flightNumber,
        departureDate, currentTripId, recommendation, editMode, checkingActiveTrip,
    ]);

    // Set up push notification listeners (native only)
    useEffect(() => {
        if (!isNative()) return;
        setupPushListeners(
            // Foreground notification — log for now
            (notification) => { console.log('Push received in foreground:', notification); },
            // User tapped notification — record interaction signals (Sprint 6 F6.6)
            (notification) => {
                console.log('Push notification tapped:', notification);
                // Backend tags the "Time to go!" push with type=time_to_go in
                // notification.data so we can attribute the tap.
                const data = notification?.data || {};
                const pushType = data.type || data.notification_type;
                const tripId = data.trip_id;
                if (pushType === 'time_to_go' && tripId) {
                    postEvent('timetogo_tap', tripId, tokenRef.current);
                }
            }
        );
        return () => { removePushListeners(); };
    }, []);

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
    // One-tap selection: set the flight and advance to Setup in a single
    // render pass. Avoids the stale-closure pattern where a separate
    // Continue handler read selectedFlight from state (null on the first
    // tap because setSelectedFlight hadn't flushed yet).
    // Cancelled / departed / boarding flights still advance — brief §4.3
    // expects them to be tappable and Setup surfaces the status.
    const handleFlightSelect = (flight) => {
        setSelectedFlight(flight);
        if (!editMode) {
            setCurrentTripId(null);
            setRecommendation(null);
            setLocked(false);
            setJourneyReady(false);
        }
        goTo(3);
    };

    const handleLockIn = async () => {
        if (isSubmitting) return;

        // Edit mode safety: currentTripId should never be null here with Fix A,
        // but guard against unknown state paths that could create a duplicate trip.
        if (editMode && !currentTripId) {
            console.error('[Engine] editMode=true but currentTripId is null — unexpected state path, aborting to prevent duplicate trip creation');
            setApiError('Could not update trip. Returning to your trips.');
            navigate(createPageUrl('Trips'), { replace: true });
            return;
        }

        // Draft already exists — just recompute with current preferences
        if (currentTripId) {
            setViewMode('loading');
            setJourneyReady(false);
            setApiError(null);
            setIsSubmitting(true);
            try {
                const lockInRecomputeBody = {
                    trip_id: currentTripId,
                    reason: 'preference_change',
                    preference_overrides: buildPreferences(),
                    home_address: startingAddress,
                };
                if (editMode) {
                    lockInRecomputeBody.flight_number = flightNumber.trim();
                    lockInRecomputeBody.departure_date = departureDate;
                    lockInRecomputeBody.selected_departure_utc = selectedFlight?.departure_time_utc || undefined;
                }
                const recRes = await fetch(`${API_BASE}/v1/recommendations/recompute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify(lockInRecomputeBody),
                });
                if (!recRes.ok) throw new Error(`Recompute failed (${recRes.status})`);
                const rec = await recRes.json();
                setRecommendation(rec);
                setJourneyReady(true);
                // Setup submit succeeded (recompute on an existing draft/trip).
                // Clear the Setup form's sessionStorage, and defensively the
                // Search state too — Task 7.3 only clears search on track.
                clearSetupState();
                clearSearchState();
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
            setJourneyReady(true);
            // Fresh trip created successfully — clear Setup form's
            // sessionStorage, plus Search state as a belt-and-braces.
            clearSetupState();
            clearSearchState();
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
        if (!currentTripId || isRecomputing) return null;
        setIsRecomputing(true);
        setApiError(null);

        try {
            const recomputeBody = {
                trip_id: currentTripId,
                reason: 'preference_change',
                preference_overrides: buildPreferences(),
                home_address: startingAddress,
            };
            // Edit mode: pass wizard state so recompute previews edited values
            if (editMode) {
                recomputeBody.flight_number = flightNumber.trim();
                recomputeBody.departure_date = departureDate;
                recomputeBody.selected_departure_utc = selectedFlight?.departure_time_utc || undefined;
            }
            const recRes = await fetch(`${API_BASE}/v1/recommendations/recompute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify(recomputeBody),
            });
            if (!recRes.ok) {
                const errBody = await recRes.text();
                throw new Error(`Recompute failed (${recRes.status}): ${errBody}`);
            }
            const rec = await recRes.json();
            setRecommendation(rec);
            return rec;
        } catch (err) {
            console.error('Recompute failed:', err);
            setApiError(err.message || 'Could not update your recommendation. Please try again.');
            return null;
        } finally {
            setIsRecomputing(false);
        }
    };

    const handleReset = () => {
        resetTripState();
        clearEngineStep();
        navigate('/', { replace: true });
    };

    const handleEditSetup = () => {
        setLocked(false);
        setJourneyReady(false);
        setViewMode('setup');
        setApiError(null);
    };

    const handleTrackTrip = async () => {
        if (!currentTripId) return;
        if (editMode) return; // Edit mode must never promote/track — only PUT updates
        if (!isAuthenticated) {
            pendingTrackAfterAuth.current = true;
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
                clearSearchState();
                clearRideshareProvider();
                clearEngineStep();
                if (data.trip_count != null) updateTripCount(data.trip_count);

                // Show push priming on native after tracking
                if (isNative() && shouldShowPushPriming(data.trip_count)) {
                    setPushPrimingOpen(true);
                }

                // Adaptive routing: fetch active-list to decide where to land
                try {
                    const listRes = await fetch(`${API_BASE}/v1/trips/active-list`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (listRes.ok) {
                        const listData = await listRes.json();
                        const activeTrips = (listData.trips || []).filter(
                            t => ['active', 'en_route', 'at_airport', 'at_gate'].includes(t.status)
                        );
                        if (activeTrips.length >= 2) {
                            navigate(createPageUrl('Trips'), { replace: true });
                            return;
                        }
                    }
                } catch {
                    // Fall through to single-trip view
                }

                // Single trip (or fetch failed): show Active Trip Screen
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
            const result = await handleRecompute();
            if (result) {
                setJourneyReady(true);

                // Edit mode is a two-tap commit that the user reads as one.
                // Setup's "Update my trip" used to only preview via recompute
                // and leave Results wearing an "Update my trip" label — so
                // the user reasonably tapped it again expecting Track. Here
                // we persist the edit via PUT alongside the preview recompute
                // and clear editMode so the Results CTA becomes "Track my
                // trip". If PUT fails, keep editMode=true so the user can
                // retry from Results.
                if (editMode && editTripId) {
                    try {
                        const putRes = await fetch(`${API_BASE}/v1/trips/${editTripId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', ...authHeaders },
                            body: JSON.stringify({
                                flight_number: flightNumber.trim() || undefined,
                                departure_date: departureDate || undefined,
                                home_address: startingAddress.trim() || undefined,
                                transport_mode: transport || undefined,
                                security_access: computeSecurityAccess() || undefined,
                                buffer_preference: gateTime,
                            }),
                        });
                        if (putRes.ok) {
                            setEditMode(false);
                        } else if (putRes.status === 409) {
                            const err = await putRes.json().catch(() => ({}));
                            setEditError(err.detail || 'This trip can no longer be edited because it is in progress.');
                        } else {
                            setEditError('Failed to save your changes. Please try again.');
                        }
                    } catch (err) {
                        console.error('PUT during edit recalculate failed:', err);
                        setEditError('Network error — could not save your changes.');
                    }
                }

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
                    setActiveTripRec(result);
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

    // ── Edit mode: Update Trip via PUT /v1/trips/{id} ─────────────────────
    // For drafts (created/draft): PUT to save edits, then POST track to promote.
    // For active trips: PUT only (already tracked).
    const editIsDraft = editTripStatus === 'draft' || editTripStatus === 'created';

    const handleUpdateTrip = async () => {
        if (!editTripId || isUpdating) return;
        setIsUpdating(true);
        setEditError(null);
        try {
            const res = await fetch(`${API_BASE}/v1/trips/${editTripId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    flight_number: flightNumber.trim() || undefined,
                    departure_date: departureDate || undefined,
                    home_address: startingAddress.trim() || undefined,
                    transport_mode: transport || undefined,
                    security_access: computeSecurityAccess() || undefined,
                    buffer_preference: gateTime,
                }),
            });
            if (!res.ok) {
                if (res.status === 409) {
                    const err = await res.json().catch(() => ({}));
                    setEditError(err.detail || 'This trip can no longer be edited because it is in progress.');
                } else {
                    setEditError('Failed to update trip. Please try again.');
                }
                return;
            }

            // Draft edit: promote to tracked after saving
            if (editIsDraft) {
                try {
                    const trackRes = await fetch(`${API_BASE}/v1/trips/${editTripId}/track`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                    });
                    if (trackRes.ok) {
                        const trackData = await trackRes.json();
                        clearSearchState();
                        clearRideshareProvider();
                        clearEngineStep();
                        if (trackData.trip_count != null) updateTripCount(trackData.trip_count);

                        if (isNative() && shouldShowPushPriming(trackData.trip_count)) {
                            setPushPrimingOpen(true);
                        }

                        // Adaptive routing
                        try {
                            const listRes = await fetch(`${API_BASE}/v1/trips/active-list`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (listRes.ok) {
                                const listData = await listRes.json();
                                const activeTrips = (listData.trips || []).filter(
                                    t => ['active', 'en_route', 'at_airport', 'at_gate'].includes(t.status)
                                );
                                if (activeTrips.length >= 2) {
                                    navigate(createPageUrl('Trips'), { replace: true });
                                    return;
                                }
                            }
                        } catch {
                            // Fall through to single-trip view
                        }

                        // Single trip: show Active Trip Screen
                        setEditMode(false);
                        setIsTracked(true);
                        setActiveTripData({
                            trip_id: editTripId,
                            flight_number: flightNumber,
                            departure_date: departureDate,
                            home_address: startingAddress,
                            status: 'active',
                            selected_departure_utc: selectedFlight?.departure_time_utc,
                            preferences_json: JSON.stringify(buildPreferences()),
                        });
                        setActiveTripRec(recommendation);
                        setViewMode('active_trip');
                        return;
                    }
                    // Track call failed — PUT succeeded, trip saved but not tracked
                    setEditError('Your changes were saved, but we couldn\u2019t track the trip. Tap again to retry.');
                } catch {
                    setEditError('Your changes were saved, but we couldn\u2019t track the trip. Tap again to retry.');
                }
                return;
            }

            // Active trip edit: just navigate back
            navigate(createPageUrl('Trips'), { replace: true });
        } catch (err) {
            console.error('PUT trip failed:', err);
            setEditError('Network error — could not reach the server.');
        } finally {
            setIsUpdating(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────
    // /Engine intentionally renders without the legacy app header. Each
    // sub-view owns its own top bar (StepSelectFlight uses the DS TopBar;
    // Setup/Results/ActiveTrip will follow in their own redesigns).
    return (
        <div className="min-h-screen bg-c-ground font-sans antialiased">

            {/* ── MAIN CONTENT ── */}
            {checkingActiveTrip && (
                <div className="min-h-screen flex items-center justify-center">
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

                            {step === 2 && (
                                <StepSelectFlight
                                    flightOptions={flightOptions}
                                    onSelect={handleFlightSelect}
                                    onBack={() => {
                                        // Back always returns to Search — StepEntry is
                                        // retired, so there's no in-Engine step 1.
                                        if (fromSearchRef.current) {
                                            navigate(-1);
                                        } else {
                                            navigate('/', { replace: true });
                                        }
                                    }}
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
                        isTracked={isTracked}
                        onTrack={handleTrackTrip}
                        securityLabel={
                            hasPriorityLane ? 'Priority Lane' :
                            hasPrecheck && hasClear ? 'CLEAR + PreCheck' :
                            hasPrecheck ? 'TSA PreCheck' :
                            hasClear ? 'CLEAR' : 'Standard TSA'
                        }
                        homeAddress={startingAddress}
                        editMode={editMode}
                        editIsDraft={editIsDraft}
                        editError={editError}
                        isUpdating={isUpdating}
                        onUpdateTrip={handleUpdateTrip}
                    />
                )}

            </AnimatePresence>
            )}

            <AuthModal open={authOpen} onOpenChange={(open) => { setAuthOpen(open); if (!open) pendingTrackAfterAuth.current = false; }} onSuccess={(data) => {
                login(data);
                // Auto-track only if auth was triggered by the Track button
                if (pendingTrackAfterAuth.current && currentTripId && !isTracked) {
                    pendingTrackAfterAuth.current = false;
                    setTimeout(async () => {
                        try {
                            const res = await fetch(`${API_BASE}/v1/trips/${currentTripId}/track`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
                            });
                            if (res.ok) {
                                const trackData = await res.json();
                                setIsTracked(true);
                                clearSearchState();
                                clearRideshareProvider();
                                clearEngineStep();
                                if (trackData.trip_count != null) updateTripCount(trackData.trip_count);

                                // Show push priming on native after first tracked trip
                                if (isNative() && shouldShowPushPriming(trackData.trip_count)) {
                                    setPushPrimingOpen(true);
                                }

                                // Adaptive routing: fetch active-list to decide where to land
                                try {
                                    const listRes = await fetch(`${API_BASE}/v1/trips/active-list`, {
                                        headers: { Authorization: `Bearer ${data.token}` },
                                    });
                                    if (listRes.ok) {
                                        const listData = await listRes.json();
                                        const activeTrips = (listData.trips || []).filter(
                                            t => ['active', 'en_route', 'at_airport', 'at_gate'].includes(t.status)
                                        );
                                        if (activeTrips.length >= 2) {
                                            navigate(createPageUrl('Trips'), { replace: true });
                                            return;
                                        }
                                    }
                                } catch {
                                    // Fall through to single-trip view
                                }

                                // Single trip (or fetch failed): show Active Trip Screen
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

            <PushPrimingModal
                open={pushPrimingOpen}
                onClose={() => setPushPrimingOpen(false)}
                authToken={token}
            />

            <PaywallModal
                open={paywallOpen}
                onOpenChange={setPaywallOpen}
                token={token}
            />
        </div>
    );
}
