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

---

### Deferred verification: 409 race condition during edit (Test F)

**Found during:** Task 4 (F7.2) integration testing
**Impact:** If a trip transitions to `en_route` server-side while the user is editing it in the wizard, `PUT /v1/trips/{id}` returns 409. The frontend shows an inline error (editError state), but the UX for this race is untested. Edge case requires seeding `en_route` status mid-edit.
**Scope:** Verify during C7.5 checkpoint.

---

### Deferred verification: complete trip shows no edit affordance (Test G)

**Found during:** Task 4 (F7.2) integration testing
**Impact:** Completed trips (`status = "complete"`) should show no Edit button and no untrack link in ActiveTripView. Implemented but not yet manually verified.
**Scope:** Verify during C7.5 checkpoint.

---

## Launch-blocking, not Sprint 7 scope

### Paywall gating is visual, not enforced

**Found during:** Task 4 (F7.2) integration testing
**Impact:** Free user at trip 4+ sees paywall modal on Results screen, but "Continue with free" lets them track the trip anyway. Sprint 6's F6.2 Pro gating enforcement didn't cover the track action itself — only downstream features (gate alerts, accuracy stats, history cap).
**Needs:** (a) Hard gate on `POST /v1/trips/{id}/track` for non-Pro users at trip 4+. (b) Frontend either disables Track button or replaces with "Upgrade to track" CTA. (c) Decide whether existing tracked trips remain editable for free users who hit their limit.
**Scope:** Must fix before App Store submission. Separate task, post-Task-10 or first pre-launch hardening pass.

---

## Task 5 — deferred coverage

### 2+-within-24h branch untested end-to-end

**Found during:** Task 5 (F7.3) integration testing
**Impact:** Test 5.4 verified the 1-within-24h branch (WN 4090 was beyond 24h, correctly filtered out). The 2+-within-24h branch (routes to `/Trips`) is untested end-to-end. To verify: seed two trips with `departure_date` both equal to tomorrow (or both `projected_timeline.departure_utc` within the next 24h), hard-refresh `/`, expect redirect to `/Trips` Active tab showing both.
**Scope:** Defer to C7.5 checkpoint or test during F7.5 when seeding multiple same-day trips is cheap.

---

## F7.5 design questions

### Trip card action affordance: buttons vs footer text vs chevron

**Found during:** Task 5 (F7.3) UX review
**Impact:** Trip cards tap to different destinations per state (drafts → edit wizard, tracked → Active Trip Screen, complete → summary). Current approach: footer text telegraphs destination ("Tap to edit", "Tap to view trip", "Live — tap for details"). No explicit buttons or chevrons. Works but may not be discoverable enough.
**Consider:** Explicit single-action button per card state, or iOS-style chevron affordance, based on user testing feedback. Current footer-text approach is a pre-redesign clarity fix; F7.5 with the Concourse design system is the right place to make the full card design decision.

---

## Post-launch optimizations

### Edit flow: cache flight data to skip redundant lookup in Step 2

**Found during:** Task 4 (F7.2) integration testing
**Impact:** Every edit flow re-fetches `GET /v1/flights/{number}/{date}` in Step 2 even when flight_number and departure_date are unchanged from the trip being edited. This adds latency and an unnecessary AeroDataBox API call.
**Proposed:** Cache the original flight data from trip hydration and reuse when flight_number + departure_date match. Requires handling stale-data edge cases (gate changes, cancellations between draft creation and edit). Consider short-lived cache (5-10 min) with manual refresh option.
**Scope:** Non-blocking for Sprint 7. Post-launch optimization.
