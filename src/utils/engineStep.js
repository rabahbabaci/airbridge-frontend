/**
 * Persists the user's current position in the Search → Setup → Results
 * Engine flow so a mid-flow refresh (or browser back/forward) lands
 * back at the same step instead of falling through to Search.
 *
 * Shape: {
 *   step: 3 | 4,
 *   selectedFlight,          // full mapped flight object (required)
 *   flightOptions,           // the Flight Selection candidate list (for back nav)
 *   flightNumber,
 *   departureDate,
 *   currentTripId: string | null,  // set once the trip is created (step 4)
 *   recommendation: object | null, // set once the recommendation is computed (step 4)
 * }
 *
 * Cleared by Engine on trip-track success, reset, and onNewTrip paths.
 * Step 2 (Flight Selection) is never persisted — it's the default when
 * sessionStorage is empty AND the user arrived from Search.
 */
const KEY = 'airbridge_engine_step';

export function loadEngineStep() {
    try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        if (parsed.step !== 3 && parsed.step !== 4) return null;
        if (!parsed.selectedFlight) return null;
        return parsed;
    } catch { return null; }
}

export function saveEngineStep(state) {
    try {
        if (!state || typeof state !== 'object') return;
        if (state.step !== 3 && state.step !== 4) return;
        sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch { /* quota / private mode — ignore */ }
}

export function clearEngineStep() {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
