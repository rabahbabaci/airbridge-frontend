import { API_BASE } from '@/config';

/**
 * Fire-and-forget POST to /v1/events for backend interaction signals.
 *
 * Sprint 6 ships three signal types: 'rideshare_tap', 'nav_tap',
 * 'timetogo_tap'. Failures are swallowed — these are best-effort,
 * never user-blocking.
 *
 * Backend contract (verified against production):
 *   POST /v1/events  body: { event_name, trip_id }  → { status, event_id }
 *
 * @param {string} eventName   Event name (e.g. 'rideshare_tap')
 * @param {string} trip_id     Trip UUID this event is associated with
 * @param {string} [token]     Bearer token (optional — endpoint accepts unauthenticated)
 */
export async function postEvent(eventName, trip_id, token) {
    if (!eventName) return;
    try {
        await fetch(`${API_BASE}/v1/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ event_name: eventName, trip_id }),
        });
    } catch (err) {
        // Best-effort — never block UI on event tracking failures.
        console.error('postEvent failed:', err);
    }
}
