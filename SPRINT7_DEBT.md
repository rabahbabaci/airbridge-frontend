# Sprint 7 — Verification Debt

Items discovered during integration testing. Logged here for future resolution.

---

### Backend: populate flight details on draft creation, not only on track

**Found during:** Task 4 (F7.2) integration testing
**Impact:** Draft trip cards on the Trips Active tab render without route or airline (e.g., "AS 20" with no "SFO → LAX" or airline name) because `origin_iata`, `destination_iata`, and `airline` are NULL in the database for drafts. The backend `POST /v1/trips` handler does not persist flight lookup data at draft creation — it only populates these columns in the `/track` handler.
**Scope:** Backend fix. Out of Sprint 7 frontend scope.

---

### Task 5 prereq: Engine must consume location.state.viewTrip.trip_id and route accordingly

**Found during:** Task 4 (F7.2) code review
**Impact:** When an in-progress trip (`en_route`/`at_airport`/`at_gate`) is tapped on the Trips page, Trips.jsx correctly passes `{ state: { viewTrip: trip } }`, but Engine.jsx ignores `viewTrip` entirely. It falls through to `GET /v1/trips/active`, which returns whichever active trip sorts first — not necessarily the one the user tapped. This works today because users have at most one active trip, but Task 5 (adaptive routing / multi-trip) breaks this assumption. Engine must read `location.state.viewTrip.trip_id` and use it to fetch/display the correct trip.
**Scope:** Must be resolved as part of Task 5 (F7.3 adaptive routing).
