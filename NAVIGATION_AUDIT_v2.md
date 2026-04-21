# Navigation & Flow Audit v2

**Scope:** `sprint-7-nav-tier1-6` tip (`2bfc51d`). Diagnostic, no code changes.

**Branch topology — why this matters:**

```
sprint-7-redesign (3328a9d)
├── sprint-7-nav-tier1-5 (ca65f46)
│   ├── 72cda36 Tier 1.5 Fix 1 — banner multi-trip
│   ├── 885ceb4 Tier 1.5 Fix 6 — useAuthGatedTabs hook
│   ├── 5440d55 Tier 1.5 Fix 2 — TabBar on Results
│   ├── 1bb7dbb Tier 1.5 Fix 3 — "+ New Trip" → /search
│   ├── 7e8c7f0 Tier 1.5 Fix 4 — post-auth auto-track
│   ├── eda7cdf Tier 1.5 Fix 5 — GET /v1/trips/{id} on edit
│   └── ca65f46 post-Tier 1.5 — GET /v1/flights on edit (selectedFlight fix)
└── sprint-7-nav-tier1-6 (2bfc51d) ← CURRENT BRANCH
    ├── e69adea Tier 1.6 Fix 1 — PUT during recompute, clear editMode
    └── 2bfc51d Tier 1.6 Fix 2 — "+" header always visible
```

`sprint-7-nav-tier1-6` was branched directly from `sprint-7-redesign` without
merging `sprint-7-nav-tier1-5` first. **All Tier 1, Tier 1.5, and post-1.5
fixes are absent from this branch.** Every Tier 1-era symptom is back.

---

## Section 1 — Engine edit-mode flow trace (sprint-7-nav-tier1-6 state)

### Data flow with timestamps

| T   | Event | What runs | State of `selectedFlight` |
|-----|-------|-----------|---------------------------|
| T0  | User taps a draft in Trips list | `ActiveTripCard.handleClick` fires `navigate(createPageUrl('Engine'), { state: { editTrip: trip } })` (Trips.jsx:84). `trip` is the row-response shape from `/v1/trips/active-list`. | `null` (not yet mounted) |
| T1  | Engine mounts | `editTripRef.current = location.state?.editTrip` captured. `useState(null)` initializer runs for `selectedFlight`. | `null` |
| T2a | First render of Engine | Effects registered. `checkingActiveTrip=true`, `viewMode='setup'`, `step=2`. | `null` |
| T2b | `editTripRef` useEffect fires (Engine.jsx:164-204) | Sets `flightNumber`, `departureDate`, `home_address`, preferences from `trip.preferences_json` if present. Sets `editMode=true`, `editTripId`, `editTripStatus`, `currentTripId=trip.trip_id`, `checkingActiveTrip=false`, `step=3`. **Does NOT call `setSelectedFlight`.** | `null` |
| T2c | Active-trip-check useEffect | Short-circuits: `editTripRef.current` is truthy, returns early. | `null` |
| T2d | Redirect-to-/ useEffect | Short-circuits: `editTripRef.current` is truthy, returns early. | `null` |
| T3  | Setup renders (`step=3`, `viewMode='setup'`) | `StepDepartureSetup` renders with `currentTripId` set, so button label = `'Update my trip'`. | `null` |
| T4  | User taps "Update my trip" | Button's `onClick={onRecalculate}` → Engine's `handleRecalculate` (Engine.jsx:876). | `null` |
| T5  | `handleRecalculate` runs | `currentTripId` truthy → calls `handleRecompute()` (POST /v1/recommendations/recompute with `preference_overrides`). Sets `viewMode='loading'`. After recompute returns, the new **Tier 1.6 Fix 1** branch fires: `PUT /v1/trips/{id}`, sets `editMode=false` on success. `isTracked` is still false. Sets `viewMode='results'`. **`selectedFlight` never touched.** | `null` |
| T6  | Results renders | `ResultsView` receives `selectedFlight={null}`. CTA label = `'Track my trip'` (editMode now false). But every pill reads `selectedFlight?.X` → all render as empty / `'—'`. | `null` |

### Functions that would set `selectedFlight` but don't run in this flow

| Function | Runs during edit flow? | Would set `selectedFlight`? |
|----------|------------------------|------------------------------|
| `handleFlightSelect` (Engine.jsx:621) | ❌ No (user doesn't go through Flight Selection in edit) | ✓ Yes, from Search handoff |
| Active-trip-check useEffect (Engine.jsx:354-518) | ❌ No (short-circuited by `editTripRef.current`) | ✓ Yes, fetches `/v1/flights/{n}/{date}` |
| `viewTripRef` useEffect (Engine.jsx:208-277) | ❌ No (editTripRef takes precedence at line 210) | ✓ Yes, fetches `/v1/flights/{n}/{date}` |
| **`editTripRef` useEffect (Engine.jsx:164-204)** | ✓ Yes — this IS the edit path | ❌ **No — never calls setSelectedFlight** |

### State of `selectedFlight` at Results render

`null`. Every consumer reads `selectedFlight?.flight_number`, `selectedFlight?.origin_code`, `selectedFlight?.destination_code`, `selectedFlight?.departure_terminal`, `selectedFlight?.departure_gate`, `selectedFlight?.departure_time`, `selectedFlight?.is_delayed`, `selectedFlight?.canceled`. All evaluate to `undefined`.

### Fields populated at Results render in edit flow

- `recommendation` ✓ (leave-by time, journey timeline segments — these come from the recompute response)
- `flightNumber` ✓ (top-level state, set at T2b from `trip.flight_number`)
- `startingAddress` ✓
- `transport`, `gateTime`, etc. ✓
- `selectedFlight` ✗ **null**

Results displays only what `recommendation` drives (leave-by + timeline). The
pill cluster (flight number pill, route pill, terminal, on-time status) and
the Boarding/Departs cards all read exclusively from `selectedFlight` and
render empty.

### Why ca65f46 "fixed" this on tier1-5 but not tier1-6

`ca65f46` added a second supplementary async fetch to the `editTripRef`
useEffect: after pulling the full trip via `GET /v1/trips/{id}`, it called
`GET /v1/flights/{flight_number}/{departure_date}` and matched the result
against `selected_departure_utc` to populate `selectedFlight` — mirroring
the pattern already in the `viewTripRef` path.

`ca65f46` lives on `sprint-7-nav-tier1-5`. `sprint-7-nav-tier1-6` was branched
from `sprint-7-redesign`, not from `sprint-7-nav-tier1-5`, so the fix is not
in the tree being tested.

---

## Section 2 — Trips.jsx navigation surface

| # | Source (line) | Trigger | Target URL | Ultimate screen | Visibility | Pre/post-redesign |
|---|---------------|---------|-----------|-----------------|------------|-------------------|
| 1 | `Trips.jsx:84` `ActiveTripCard.handleClick` | Tap any draft card | `/Engine` + `{ editTrip: trip }` router state | Engine edit mode → Setup step 3 | Draft trips in Active list | post-redesign (Sprint 7 F7.2 edit flow) |
| 2 | `Trips.jsx:88` `ActiveTripCard.handleClick` | Tap any tracked card (active/en_route/at_airport/at_gate) | `/Engine` + `{ viewTrip: trip }` router state | Engine → Active Trip Screen | Non-draft trips | post-redesign |
| 3 | `Trips.jsx:224` `useEffect` | Component mount when `!isAuthenticated` | `/Home` (replace) | `/Home` route → Search (mobile) | Unauth only, automatic | pre-redesign silent-bounce pattern |
| 4 | `Trips.jsx:361` Logomark `Link` | Tap logo | `/Home` | Search via `/Home` route | Always | pre-redesign desktop header |
| 5 | `Trips.jsx:368` "Search" text link | Tap "Search" in desktop nav | **`/Engine`** | Engine → redirect effect bounces to `/` | Desktop only (`md:flex`) | pre-redesign — **stale target**, Tier 1 Fix 3 was supposed to retarget to `/search` but it's not on this branch |
| 6 | `Trips.jsx:370` "Settings" text link | Tap "Settings" in desktop nav | `/Settings` | Settings | Desktop only | pre-redesign |
| 7 | `Trips.jsx:374` "+" header icon | Tap "+" button in header | `/search` | Search | Always (Tier 1.6 Fix 2 lifted the `showTabs &&` gate) | post-Tier 1.6 |
| 8 | `Trips.jsx:432` empty-state "+ New Trip" | Tap primary CTA in "No trips yet" panel | **`/Engine` + `{ newTrip: true }`** | `/Engine` bounces to `/` (see below) | `totalActiveTrips === 0 && !hasHistory` | pre-Tier-1.5 — **stale target**, Tier 1.5 Fix 3 was supposed to point at `/search` but it's not on this branch |
| 9 | `Trips.jsx:498` secondary empty-state "+ New Trip" | Tap CTA in "No active trips" panel inside tabbed view | **`/Engine`** (no router state) | `/Engine` bounces to `/` | Active tab selected with zero active trips but history exists | pre-Tier-1.5 — **stale target** |

**Note on `/Engine` with `{ newTrip: true }`:** Engine's mount sequence reads `location.state?.newTrip` in the active-trip-check useEffect and short-circuits (`setCheckingActiveTrip(false); return;` at Engine.jsx:358-361). Then the redirect-to-/ useEffect (Engine.jsx:525-530) runs — none of `fromSearchRef/editTripRef/viewTripRef` is set and `viewMode !== 'active_trip'`, so it calls `navigate('/', { replace: true })`. The user's URL ends at `/`, not `/Home`. On desktop `/` renders Landing; on mobile/native it renders Search via `RootRoute → MainPage`.

**TabBar tab audit — Trips.jsx does NOT render the DS TabBar.** Only Search renders it on this branch (5440d55 "TabBar on Results" and da8da75 "TabBar on Active Trip" are tier1 commits not present here). So there is no DS TabBar Search/My Trip/Settings triplet to audit on Trips.jsx. The only persistent nav bar on Trips is the pre-redesign sticky `<header>` with the desktop text links.

---

## Section 3 — Settings.jsx navigation surface

| # | Source (line) | Trigger | Target URL | Ultimate screen | Visibility | Pre/post-redesign |
|---|---------------|---------|-----------|-----------------|------------|-------------------|
| 1 | `Settings.jsx:83` `useEffect` | Mount when `!isAuthenticated` | `/Home` (replace) | Search via /Home route | Unauth only, automatic | pre-redesign |
| 2 | `Settings.jsx:309` `handleSignOut` | Tap "Sign out" | `/Home` | Search via /Home route | Always | pre-redesign |
| 3 | `Settings.jsx:320` Logomark `Link` | Tap logo | `/Home` | Search via /Home route | Always | pre-redesign |
| 4 | `Settings.jsx:327` **"Engine"** text link | Tap "Engine" in desktop nav | **`/Engine`** | `/Engine` redirect bounces to `/` | Desktop only | pre-redesign — **stale label + stale target**, Tier 1 Fix 3 was supposed to change to "Search" → /search |
| 5 | `Settings.jsx:328` **"Trip History"** text link | Tap "Trip History" in desktop nav | `/Trips` | Trips | Desktop only | pre-redesign — **stale label**, Tier 1 Fix 3 was supposed to change to "My Trip" |
| 6 | `Settings.jsx:350` Back arrow | Tap back icon on mobile | **`/Engine`** | `/Engine` redirect bounces to `/` | Always | pre-redesign — **wrong semantics**, Tier 1 Fix 3 was supposed to use `navigate(-1)` with `/` fallback |
| 7 | `Settings.jsx:358` Home icon | Tap plane icon on mobile | `/Home` | Search via /Home route | Mobile only (`md:hidden`) | pre-redesign |
| 8 | `Settings.jsx:401` "Trip history" row | Tap inside Account card | `/Trips` | Trips | Always | pre-redesign |

---

## Section 4 — Bug confirmations

### Q1: Is "Update my trip" missing flight details a regression of `ca65f46`?

**Yes.** But not a regression of the commit itself — `ca65f46` is correct and still lives on `sprint-7-nav-tier1-5`. The regression is architectural: `sprint-7-nav-tier1-6` was branched from `sprint-7-redesign` rather than from `sprint-7-nav-tier1-5`, so `ca65f46` never made it into this tree.

On `sprint-7-nav-tier1-6`, the `editTripRef` useEffect (Engine.jsx:164-204) is the pre-Tier-1.5 version — 41 lines, no supplementary fetches, no `setSelectedFlight`. `selectedFlight` stays `null` for the entire edit flow, and Results reads `null?.flight_number`, `null?.departure_terminal`, etc.

`e69adea` (Tier 1.6 Fix 1) did not touch `selectedFlight` — it modified `handleRecalculate` only. The interaction with `ca65f46` is: if both commits were on the same branch, `ca65f46` would populate `selectedFlight` at T2b (async fetch after initial editTrip hydration), and by T4 the user would see Results with full pills intact. Without `ca65f46`, the pills are empty regardless of what `handleRecalculate` does.

**Fix direction:** merge `sprint-7-nav-tier1-5` into `sprint-7-nav-tier1-6` (or rebase tier1-6 onto tier1-5), then ship. `e69adea` and `2bfc51d` are additive on top of tier1-5; no logical conflict expected.

### Q2: Is the empty-state "+ New Trip" routing to `/Home`?

**No — it routes to `/Engine` with `newTrip: true` router state, which Engine bounces to `/`.** Rab's diagnosis of "routes to /Home" is imprecise. The actual observable URL after the bounce is `/`. On mobile/native `/` renders Search via `RootRoute → MainPage`, which makes it *look like* Search/Home to the user. On desktop `/` renders the marketing Landing page — so the user arrives at a completely different screen.

The bug is at `Trips.jsx:432`: `to={createPageUrl('Engine')} state={{ newTrip: true }}`. Should be `to="/search"`. Same issue at `Trips.jsx:498` (secondary empty state).

Tier 1.5 Fix 3 (`1bb7dbb`) already fixed both of these, but the commit is not on this branch.

### Q3: Is the Trips header "Search" link routing to `/Engine`?

**Yes.** `Trips.jsx:368`: `<Link to={createPageUrl('Engine')}>Search</Link>`. Engine's redirect effect bounces the user to `/` (Landing on desktop, Search on mobile) — so the text link reads "Search" but the user lands on Landing on desktop, which is jarring.

Tier 1 Fix 3 (`1408545` "stale desktop header labels in Trips and Settings") already retargeted this to `/search`, but that commit is not on this branch.

### Summary of missing fixes on `sprint-7-nav-tier1-6`

| Tier 1-era commit | What it fixes | On tier1-6? | Symptom visible |
|-------------------|---------------|-------------|-----------------|
| `b7f143a` | NAVIGATION_AUDIT.md | No (file exists untracked at root but not committed) | audit doc missing from branch |
| `1e50f23` | `/search` bypasses TripAwareHome | No | Users with <24h active trip bounced away from Search |
| `da8da75` | DS TabBar on Active Trip | No | Active Trip captive state |
| `1408545` | Settings/Trips desktop header labels + targets | No | "Engine" label, /Engine targets, wrong back arrow |
| `72cda36` | Banner multi-trip handling | No (banner itself absent) | No active-trip banner on Search |
| `885ceb4` | `useAuthGatedTabs` hook | No | Unauth TabBar taps silently bounce |
| `5440d55` | DS TabBar on Results | No | Results is a dead-end |
| `1bb7dbb` | "+ New Trip" → /search | No | Empty-state CTAs route to /Engine |
| `7e8c7f0` | Post-auth auto-track on Results | No | Sign in → paywall + not-tracked |
| `eda7cdf` | Supplementary GET /v1/trips/{id} on edit | No | Partial hydration (bag_count etc.) |
| `ca65f46` | Supplementary GET /v1/flights on edit | No | **Current reported bug — missing flight pills on edit Results** |

The single architectural fix (merge tier1-5 into tier1-6, or rebase) resolves **all eleven** regressions simultaneously. No per-bug patches required.

---

## Recommendation

1. Stop patching on `sprint-7-nav-tier1-6` as a standalone branch.
2. Either (a) rebase `sprint-7-nav-tier1-6` onto `sprint-7-nav-tier1-5` to pick up all eleven missing commits, or (b) merge tier1-5 into tier1-6. The two post-tier1-5 commits on tier1-6 (`e69adea`, `2bfc51d`) are additive — no logical conflict is expected.
3. After the reconciliation, re-verify the specific bug Rab reported (edit draft → Update → Results pills). With `ca65f46` back in the tree plus `e69adea`'s PUT-during-recompute, the flow should be: edit hydration → supplementary flight fetch populates `selectedFlight` → Setup renders → Update tap → PUT + recompute + clear editMode → Results with full pill cluster AND CTA = "Track my trip".
