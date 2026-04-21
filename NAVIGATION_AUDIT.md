# Navigation & Flow Audit

**Scope:** `sprint-7-redesign` tip (includes Tasks 7.3 Search, 7.4 Setup, landing redesign, auth-modal retheme). Does **not** include the unmerged Task 7.5 Results Concourse rewrite or its refinement pass — those are on `sprint-7-task-7.5-results-screen`.

**Method:** Read-only trace of `App.jsx`, `pages.config.js`, all routed pages, and the components they mount. No runtime testing — items marked **requires runtime verification** couldn't be settled from code alone.

---

## Executive Summary

1. **TripAwareHome hijacks every user-initiated navigation** (HIGH). Any entry into `/` or `/search` while the user has an upcoming (< 24h) tracked trip triggers a hard `navigate(..., { replace: true })` into Active Trip Screen. The user cannot plan a second trip, cannot reach Search deliberately, and cannot cancel out of the redirect. Rab flagged this as "change URL to / then click When Should I Leave? → gets routed back to Active Trip." Same root cause. Blocks core demo narrative.
2. **Inconsistent chrome across screens** (MEDIUM-HIGH). Search has DS TopBar + DS TabBar. Engine step screens (StepSelectFlight, StepDepartureSetup) have DS TopBar, no TabBar. Trips and Settings have a pre-redesign full-width `<header>` with Link-based nav that still references `Engine` as a user-facing label and points "Search" at `/Engine`. Active Trip has no bars at all. Result: users can reach Search but cannot navigate from Active Trip / Trips back to anywhere in a DS-consistent way.
3. **Active Trip has no exit path** (HIGH). `ActiveTripView` offers Edit prefs / Refresh / "New Trip". "New Trip" navigates to `/` which TripAwareHome immediately bounces back (gap #1). There is no link to Settings, Trips list (for multi-trip), or anywhere else. User is effectively captive until the trip completes.
4. **Refresh loses mid-flow position** (HIGH). On Setup (Engine step 3) or Results (Engine step 4), a browser refresh mounts a fresh `Engine` with no `location.state`. The `/-redirect` effect fires and bounces to `/`, losing all form state. (The unmerged Task 7.5 follow-up fixes this with `airbridge_engine_step`; not on this branch.)
5. **Stale pre-redesign nav labels** (MEDIUM). Settings desktop nav has a literal "Engine" link. Trips desktop nav has a "Search" link that points to `/Engine` (not `/search`). Both are carryovers from before Task 7.2 re-rooted `/` at Search.

---

## Route map

Routes are registered in two places: auto-registration from `pages.config.js` and explicit routes in `App.jsx`.

| Path | Handler | Notes |
|---|---|---|
| `/` | `RootRoute` → Landing (web, viewport ≥ 1024px) OR `TripAwareHome(Search)` (else) | Viewport-locked landing gate (`useShouldShowLanding`); TripAwareHome wraps the Search branch |
| `/search` | `TripAwareHome(Search)` | Explicit, bypasses landing gate. Landing CTAs and Search tab navigate here |
| `/Home` | `Search` (auto) | Auto-registered because `pages.config.Home = Search`. **No** TripAwareHome wrapper |
| `/Engine` | `Engine` (auto) | No auth gate at route level; Engine has its own redirect-to-`/` effect when no entry context |
| `/Settings` | `Settings` (auto) | No auth gate at route level; Settings redirects to `/Home` on mount if unauth |
| `/Trips` | `Trips` (auto) | Same pattern — redirects to `/Home` if unauth |
| `/privacy` | `PrivacyPolicy` (explicit) | No auth gate; back button uses `navigate(-1)` |
| `/design-system` | `DesignSystem` (explicit) | No auth gate; internal preview page |
| `*` | `PageNotFound` | Catch-all |

**TripAwareHome logic** (`App.jsx` lines 37–86): on mount, if authenticated, fetches `/v1/trips/active-list`, filters to `status ∈ {active, en_route, at_airport, at_gate}` AND departing < 24h, then:
- 1 trip → `navigate('/Engine', { state: { viewTrip } })` replace
- 2+ trips → `navigate('/Trips')` replace
- 0 trips (or fetch fails) → render children (Search)

---

## Screen-by-Screen

### Landing (`/`, web ≥ 1024px, unauthenticated or authenticated)

- **Entry:** Viewport-gated via `useShouldShowLanding` hook (locks decision on mount). Native Capacitor and mobile web (< 1024px) skip Landing and fall through to Search.
- **Chrome:** Landing `<Header>` (floating-glass-pill-on-scroll). Pre-Task 7.5 unmerged work, Header does **not** show an authenticated-state avatar — logged-in users see the same "Get Started" CTA as logged-out. The unmerged Task 7.5 follow-up adds the avatar.
- **Exits:**
  - "Get Started" nav pill → `navigate('/search')`
  - "How It Works" → anchor scroll within page
  - Hero CTA "When Should I Leave?" → `navigate('/search')`
  - CTA section "Get the iOS app" → `navigate('/search')`
  - Sign in (unauth only) → opens `AuthModal`
  - Footer "Privacy" → `<Link to="/privacy">`
  - Footer "How It Works" → anchor scroll
  - Footer `hello@airbridge.live` → `mailto:`
- **Auth handling:** Landing does not enforce auth. Everything above works in both states. The Sign in link hides when authenticated; everything else unchanged.
- **Back / refresh:** Refresh reloads Landing. Browser back depends on entry; typically exits the SPA.
- **sessionStorage:** None. Landing is stateless.

### Search (`/search`, `/`, `/Home`)

- **Entry:** Default home for authenticated mobile/native users; `/search` for anyone bypassing the landing gate. `TripAwareHome` wraps `/` and `/search` but NOT `/Home` (the auto-registered route), which means `/Home` is an escape hatch from the takeover rule — **undocumented and likely unintended**.
- **Chrome:** DS `TopBar` (translucent, logomark + wordmark on left, auth slot on right) + DS `TabBar` at bottom (Search / My Trip / Settings).
- **Exits:**
  - Search flights → `navigate('/Engine', { state: { newTrip: true, fromSearch: {...} } })`
  - TopBar avatar tap: authenticated → `navigate('/Settings')`; unauthenticated → opens `AuthModal`
  - TabBar "My Trip" → `navigate('/Trips')`
  - TabBar "Settings" → `navigate('/Settings')`
  - TabBar "Search" → no-op (no case in `handleTabChange`)
- **Auth handling:** Search works for both states. Submit hits `/v1/flights/search` or `/v1/flights/{n}/{date}` with optional `Authorization` header.
- **Back / refresh:** Refresh preserves form state via `airbridge_search_state` (Task 7.3).
- **sessionStorage:** reads/writes `airbridge_search_state` (set by the form, cleared by Engine on track success).

### Flight Selection (Engine step 2, viewMode `setup`)

- **Entry:** From Search submit via router state `{ newTrip: true, fromSearch: { flights } }`. Also the landing step for `/Engine` when valid entry context exists.
- **Chrome:** DS `TopBar` ("Select your flight" + back chevron). No TabBar, no tab nav.
- **Exits:**
  - Back chevron → if came from Search, `navigate(-1)`; else `navigate('/', { replace: true })`
  - Flight card tap → `handleFlightSelect(flight)` advances Engine to step 3
  - Sheet "I don't see my flight" → `mailto:hello@airbridge.live`
- **Auth handling:** Neutral. Flight selection is pre-auth.
- **Back / refresh:** Refresh without `fromSearch` state triggers the Engine `/-redirect` effect → bounces to `/`. User loses position.
- **sessionStorage:** None directly. (Search's `airbridge_search_state` is still present so browser-back to Search shows the same form.)

### Setup (Engine step 3, viewMode `setup`)

- **Entry:** From Flight Selection `handleFlightSelect`; from Trips `editTrip`/`viewTrip` via router state; from ActiveTrip `onEdit`.
- **Chrome:** DS `TopBar` ("Departure setup" + back chevron) + flight subtitle strip below. No TabBar.
- **Exits:**
  - Back chevron → `goTo(2)` (Engine step 2, Flight Selection) — stays in `/Engine`, no router transition
  - Primary CTA "Start my trip" / "Update my trip" → `onRecalculate` → `handleLockIn` → creates trip, sets viewMode `loading` then `results`
  - Cancelled-flight banner "Search for alternatives" → `navigate('/', { replace: true })`
- **Auth handling:** Setup does not enforce auth. The trip-creation call at CTA submit is anon-friendly (backend accepts anonymous-first per brief).
- **Back / refresh:** Refresh loses Engine step state and bounces to `/` (redirect effect); **Setup form fields DO persist** via `airbridge_setup_state` (Task 7.4), but because Engine bounces to `/` before Setup ever mounts, that persistence is wasted on refresh.
- **sessionStorage:** reads/writes `airbridge_setup_state`.

### Results (Engine step 4, viewMode `results`)

*This is the pre-redesign `ResultsView` on sprint-7-redesign tip. The Concourse rewrite is unmerged on sprint-7-task-7.5-results-screen.*

- **Entry:** From Setup's `handleLockIn` → viewMode `results`.
- **Chrome:** Custom full-width `<header>` (not DS TopBar). Contains back arrow (→ `onEditSetup`, stays in Engine), "Journey Blueprint" title, Upgrade-to-Pro badge, Share button, "Start Over" text link. No TabBar.
- **Exits:**
  - Back arrow → `onEditSetup` → sets viewMode `setup` (stays in Engine)
  - "Start Over" → `onReset` → `resetTripState()` + `navigate('/', { replace: true })`
  - Share → `navigator.share` or clipboard; no navigation
  - Inside `JourneyVisualization`: "Track my trip" CTA → `onTrack` → `handleTrackTrip`
  - Inside `ActionCards` (authenticated + Pro only): external deep links to Uber/Lyft/maps
- **Auth handling:** Unauthenticated users see "Sign in to save" prompt. `handleTrackTrip` opens AuthModal if unauth and queues a post-auth auto-track via `pendingTrackAfterAuth` ref.
- **Back / refresh:** Browser back from `/Engine` leaves the SPA (or returns to Search from whence it came). Refresh bounces to `/` (same `/-redirect` issue).
- **sessionStorage:** None written here. Reads none.

### Active Trip (`ActiveTripView`, Engine viewMode `active_trip`)

- **Entry:** Three paths:
  1. `TripAwareHome` auto-redirect (tripId via router `state.viewTrip`)
  2. Trips page trip-card tap for a tracked trip (router `state.viewTrip`)
  3. After successful `handleTrackTrip` → Engine sets viewMode `active_trip` directly
- **Chrome:** **None.** No TopBar, no TabBar, no nav links. The only in-screen buttons are:
  - "Edit preferences" → `onEdit` → Engine viewMode `setup` step 3 (stays in /Engine)
  - "Refresh" → refetches recommendation
  - "New Trip" → `onNewTrip` → `resetTripState()` + `navigate('/', { replace: true })`
  - "Untrack" (in-progress statuses only) → opens `UntrackConfirmModal`
- **Auth handling:** Always authenticated by the time you reach here.
- **Back / refresh:** Refresh at `/Engine` without router state → `/`-redirect bounces to `/` → TripAwareHome re-fetches active-list → **usually bounces right back to `/Engine` with viewTrip state if the trip is still < 24h**, producing a flicker but usually landing correctly. For a 2+ active-trip user the TripAwareHome path goes to `/Trips` instead, so refreshing from Active Trip while holding two active trips routes to Trips, which is arguably the right behavior but may surprise.
- **sessionStorage:** None.

### Trips (`/Trips`)

- **Entry:** From Search TabBar tap, from Settings desktop-nav link, from `TripAwareHome` for 2+ active trips, from Engine post-track adaptive routing for 2+ active trips.
- **Chrome:** Sticky custom `<header>` with logomark → `/Home` link, desktop-only nav links (Search → **`/Engine`** ← stale target, "My Trip" label-only, Settings → `/Settings`), plus a "+" icon button → `/Engine` with `state.newTrip: true`. No DS TopBar, no TabBar.
- **Exits:**
  - Logomark → `/Home` (Search)
  - "Search" nav → `/Engine` (**broken** — /Engine with no state bounces to /)
  - "Settings" nav → `/Settings`
  - "+" button → `/Engine` with `newTrip: true`
  - Trip card (draft) → `/Engine` with `state.editTrip`
  - Trip card (tracked) → `/Engine` with `state.viewTrip`
- **Auth handling:** `useEffect` redirects to `/Home` if `!isAuthenticated`. No AuthModal — just a silent redirect.
- **Back / refresh:** Refresh preserves auth (stored in localStorage `airbridge_auth`). Tab state (Active vs History) is component-local — resets to `active` on refresh.
- **sessionStorage:** None.

### Settings (`/Settings`)

- **Entry:** From Search TabBar, from Trips desktop-nav, from Search avatar tap (authenticated), from ActiveTrip no path (missing link), from Stripe checkout redirect back.
- **Chrome:** Same pre-redesign custom `<header>` as Trips. Desktop nav links: "Engine" → `/Engine` (**stale label — internal name leaked**), "Trip History" → `/Trips` (label drift — brief calls this "My Trip"), "Settings" label-only.
- **Exits:**
  - Logomark → `/Home`
  - Desktop nav "Engine" → `/Engine` (usually redirects to `/` since no entry context)
  - Desktop nav "Trip History" → `/Trips`
  - Page-title back arrow → `/Engine` (odd — `/Engine` is flow entry, not a "back" target; again usually redirects to `/`)
  - Mobile home icon → `/Home`
  - "Sign out" → `logout()` + `navigate('/Home')`
  - Stripe / Manage Subscription → external browser redirect
- **Auth handling:** Redirects to `/Home` if `!isAuthenticated`.
- **Back / refresh:** Refresh preserves. Profile data re-fetches.
- **sessionStorage:** None. Uses `localStorage` for `airbridge_preferred_nav`, `airbridge_preferred_rideshare`, `airbridge_notification_prefs`.

### Privacy (`/privacy`)

- **Entry:** Anywhere linking to `/privacy` — at present only the landing Footer.
- **Chrome:** Just a "Back" text-button (→ `navigate(-1)`).
- **Exits:** Back button + any inline `<a>` links.
- **Auth handling:** None. Public.
- **Back / refresh:** `navigate(-1)` falls back to browser history. Deep-link entry with no history → back is a no-op.
- **sessionStorage:** None.

### Design System preview (`/design-system`)

- **Entry:** Direct URL only.
- **Chrome:** In-page internal nav.
- **Exits:** Token / component playground; no app routing.
- **Auth handling:** None.

### Auth modal (`AuthModal.jsx`)

- **Entry:** Opened by Search avatar (unauth), Landing header "Sign in", Engine step 4 (Results) "Track my trip" when unauth.
- **Auth handling:** On `onSuccess`, calls parent `login(data)` to populate `AuthContext`. Auto-closes 1.8s after `view === 'success'`.
- **Post-auth destination:** Modal has NO knowledge of where the user was trying to go. The calling component owns post-auth behavior:
  - Search: closes modal, user stays on Search.
  - Landing: closes modal, stays on Landing.
  - Engine Results: Engine's `pendingTrackAfterAuth` ref triggers `handleTrackTrip` for the pending trip, then Engine's existing post-track logic takes over.
  - **No generic "redirect-to-original-destination after auth" mechanism exists anywhere.**

---

## Flow Gaps

### A. Auth-gated routes without redirects — MEDIUM

**Current behavior:**
- Tapping My Trip TabBar tile while unauthenticated → `navigate('/Trips')` → `Trips` mounts → its `useEffect` detects `!isAuthenticated` → `navigate('/Home', { replace: true })`. Silent bounce. No explanation, no AuthModal, no "sign in to continue" prompt.
- Tapping Settings TabBar tile while unauthenticated → identical pattern, silent bounce to `/Home`.
- AuthModal nowhere knows "user was trying to reach /Trips." After manual sign-in via the Search avatar, the user is on Search, not Trips.

**Expected behavior:** Either block the TabBar tap with an AuthModal prompt (current Search behavior for avatar tap), or bounce to Landing with a `returnTo=/Trips` param that the AuthModal honors on success.

**Fix approach:** Add a `returnTo` mechanism to `AuthContext` (or to a route-level wrapper), set by components that redirect on auth failure, consumed by `AuthModal.onSuccess` to `navigate(returnTo)`.

---

### B. No consistent nav chrome on in-app screens — MEDIUM

**Current behavior:**
- Search has DS `TopBar` + DS `TabBar`.
- Engine step 2/3 (StepSelectFlight, StepDepartureSetup) have DS `TopBar`, **no** TabBar.
- Engine Results has pre-redesign custom header, no TabBar.
- Engine Active Trip has **no** chrome at all.
- Trips and Settings have pre-redesign sticky `<header>` with broken link targets (see gap D).
- Landing has its own Header (fine, marketing page).

**Expected behavior (per brief §2.1, §2.4):** All app screens except marketing Landing and transient modals carry the three-tab bottom nav. TopBar conventions per §2.4 (back chevron on step screens, title on list/settings screens). Active Trip's §2.4 rule makes the top bar "near-invisible" in urgent states but the bottom tab bar stays.

**Fix approach:** Migrate Trips and Settings to DS `TopBar` + `TabBar`. Add DS `TabBar` to Engine step screens (Flight Selection, Setup, Results, Active Trip) with the understanding that tapping a tab from mid-Engine-flow should either prompt "discard your in-progress trip?" or just route out. Current state is "no way out."

---

### C. Post-track flow — MEDIUM

**Current behavior:** `handleTrackTrip` → POST `/v1/trips/{id}/track` → on success, calls `/v1/trips/active-list`. If 2+ active trips → `navigate('/Trips', { replace: true })`. If 1 → sets viewMode `active_trip` in-place (no route change; URL stays `/Engine`). No confirmation screen, no toast, no "view your trip" prompt. Push priming modal may show on native (separate concern).

**Expected behavior:** A brief acknowledgment ("We'll text you at 3:55 AM") before the takeover, or at minimum the URL should reflect the new state so refresh lands cleanly. Currently a refresh at `/Engine` after track goes through the TripAwareHome loop to land back at Active Trip — functional but messy.

**Fix approach:** Post-track, `navigate('/Trips/{id}')` or `navigate('/active-trip/{id}')` so the URL is shareable and refresh-safe. Requires a new route + trip-detail page. Cheaper alternative: push a toast "Trip tracked" and keep current behavior, then fix refresh via the airbridge_engine_step pattern from Task 7.5's unmerged work.

---

### D. Stale desktop nav labels — MEDIUM

**Current behavior:**
- `Trips.jsx` lines 368–370: `<Link to={createPageUrl('Engine')}>Search</Link>` — "Search" nav points to `/Engine`, not `/search`. `/Engine` with no entry context redirects to `/`. So tapping "Search" from Trips → `/Engine` → `/` → depending on viewport, Landing or Search. Functional but circuitous.
- `Settings.jsx` lines 327–328: `<Link to={createPageUrl('Engine')}>Engine</Link>` + `<Link to={createPageUrl('Trips')}>Trip History</Link>`. The "Engine" label is an internal name leak. "Trip History" should be "My Trip" per brief §2.1.
- `Settings.jsx` line 350: Page-title back arrow → `/Engine`. That's the flow entry, not a meaningful "back" target.

**Expected behavior:** These are pre-Task-7.2 carryovers (when `/` was Engine). Labels should say "Search" → `/search`, "My Trip" → `/Trips`, "Settings" → `/Settings`. Back arrow on Settings should go to wherever the user came from or to `/` — `navigate(-1)` is safer.

**Fix approach:** Trivial find/replace once Trips and Settings migrate to DS `TopBar`/`TabBar` (gap B) — the stale inline nav gets removed entirely.

---

### E. Browser back behavior — MIXED

**Current behavior:**
- Landing → "Get Started" → `/search` → browser back → Landing. ✓ Correct.
- `/search` → submit → `/Engine` (Flight Selection) → browser back → `/search` preserves form. ✓ Correct.
- Flight Selection → pick flight → Setup (viewMode `setup` step 3 inside `/Engine`) → browser back → `/search`, **not** Flight Selection. **Unexpected** — user would expect to back into Flight Selection, but because step transitions are viewMode flips inside `/Engine`, the browser history entry is still "just got to /Engine from /search."
- Setup → submit → Results (viewMode `results` inside `/Engine`) → browser back → `/search`, **not** Setup. Same issue, same cause.
- Results → Track → Active Trip (viewMode `active_trip`) → browser back → `/search`. Same.
- Active Trip → New Trip → `/` → browser back → Active Trip? Not quite — `navigate('/', { replace: true })` replaces history entry, so back goes wherever `/Engine`'s predecessor was.

**Expected behavior:** Browser back should step through the flow (Search → Flight Selection → Setup → Results → Active Trip). Currently it only steps through URL changes, and the whole Engine flow is one URL.

**Fix approach:** Give each step its own route (`/search`, `/select-flight`, `/setup`, `/results`, `/trip/:id`). Substantial refactor of `Engine.jsx` — probably not worth it for demo. Cheaper: accept the current limitation and document. The Results screen's in-page "back" chevron (which flips viewMode to `setup`) is already the right affordance; users tend to use that.

**Severity: MEDIUM** — unexpected but the in-screen back buttons work.

---

### F. Deep-link / URL entry — MIXED

**Tested in code, not runtime:**

- `/search` direct → renders Search (via explicit route, TripAwareHome-wrapped). ✓ Expected.
- `/Trips` direct while logged out → mounts Trips → `useEffect` `navigate('/Home', { replace: true })`. ✓ Redirect works, but silently (gap A).
- `/Engine` direct → Engine mounts → no `fromSearch/editTrip/viewTrip/newTrip` context → `/-redirect` effect fires → `navigate('/', { replace: true })`. ✓ Expected per the comment on line 481. Active-trip-check effect runs first; if authenticated with < 24h trip, TripAwareHome on `/` bounces to Active Trip.
- `/trips/:id` direct → no matching route → falls through to `<Route path="*" element={<PageNotFound />} />`. **Not implemented.**
- `/Home` direct → `pages.config` auto-registers this → renders Search **without** TripAwareHome wrapping. Means a user with an active trip < 24h can deep-link to `/Home` and escape the takeover, while `/search` would redirect. **Undocumented escape hatch.**

**Fix approach:** Add a `/Trips/:id` or `/trip/:id` route if we want shareable trip links (not required for demo). Either wrap `/Home` with TripAwareHome for consistency or delete the `/Home` auto-route and register Search only at `/` and `/search`.

**Severity: LOW** — nothing's broken, but `/Home` is an inconsistency.

---

### G. "When Should I Leave?" CTA routing — HIGH (Rab flagged)

**Current behavior:** Hero button onClick: `navigate('/search')`. `/search` is TripAwareHome-wrapped. For an authenticated user with an upcoming < 24h trip, TripAwareHome redirects to Active Trip. **Rab's observation: "Change URL to / then click When Should I Leave? → gets routed back to Active Trip."** Confirmed — that's exactly the flow.

**Expected behavior:**
- Unauthenticated user → Search (✓ works today).
- Authenticated, no active trip → Search (✓).
- Authenticated, active trip within 24h → **this is the gap.** Should the user be allowed to plan another trip? Brief §2.2 says "active trip takes over" for surfaces like `/`, but users clicking a "start a new search" CTA are explicitly asking to search. Current behavior contradicts the user's intent.

**Fix approach (options, not proposing all):**
1. Make the CTA intent-explicit: `navigate('/search?new=1')`, have Search detect the param and skip TripAwareHome.
2. Weaken TripAwareHome to only redirect from `/`, not `/search`. Users typing `/search` have clearly chosen the app's search entry.
3. Add an "override" gesture in the Active Trip screen ("plan another trip" → navigate to `/search?new=1`).

**Severity: HIGH** — kills the demo narrative "click the CTA to see how it works" for any returning user with an upcoming trip.

---

### H. Active-trip-takes-over rule — HIGH (Rab flagged core)

**Where it lives:** `TripAwareHome` in `App.jsx`. Fires on the wrapped routes (`/` and `/search`), not on `/Home`, `/Engine`, `/Trips`, `/Settings` directly.

**Current matrix:**
| User state | Entering `/` or `/search` | Observed |
|---|---|---|
| Unauth | Render Search | ✓ |
| Auth, 0 trips within 24h | Render Search | ✓ |
| Auth, 1 trip within 24h | `navigate('/Engine', viewTrip)` replace → Active Trip | Matches brief §2.2 |
| Auth, 2+ trips within 24h | `navigate('/Trips')` replace | Matches brief §2.5 |

**Interaction with user intent:** The takeover is unconditional. There is no escape valve for "I want to search despite having a trip." Rab's "When Should I Leave?" CTA observation is the user-facing symptom of this.

**Missing interactions:**
- No way to reach Search from Active Trip. "New Trip" button goes through `/` which bounces right back.
- No way to reach Search from Trips (the broken "Search" nav link → `/Engine` → `/` → same bounce).
- Typing `/search` manually is the ONLY reliable escape for an authenticated user with a < 24h trip — and even that depends on whether we consider `/search` a TripAwareHome-wrapped route or an escape hatch.

**Fix approach:** Decide the product rule. Brief says "active trip takes over" for *default app-open*. Does it also override explicit user intent (clicking a CTA, tapping Search tab)? Recommend: TripAwareHome fires only on `/` (the generic "open the app" entry). `/search` always renders Search regardless of active trip. The tab bar always works.

**Severity: HIGH.**

---

### I. Specific screens Rab flagged

1. **"Currently tracking a trip → lands on Active Trip → no links to navigate anywhere."**
   - Confirmed. `ActiveTripView` only has Edit / Refresh / New Trip / Untrack. No TabBar. No Settings link. No "Back to Trips" link (even when the user has 2+ trips). User is captive.
   - **Fix:** Add DS `TabBar` (Search / My Trip / Settings) to ActiveTripView. Per brief §2.4 the bar becomes "near-invisible translucent" in urgent states but still exists.

2. **"Change URL to / then click When Should I Leave? → gets routed back to Active Trip."**
   - Same as gap G. Root cause is TripAwareHome on `/search`.

3. **"On /search, clicking Search tab → routes to /search (same page)."**
   - Actually no — `handleTabChange` in `Search.jsx` has cases for `'trip'` and `'settings'` only. Tapping `'search'` updates local `tabValue` state (which is already `'search'`) and does nothing else. No re-navigate. **No-op.** Harmless but provides no visual confirmation of the tap. Low priority.

4. **"In Settings, clicking 'engine' tab → ..."**
   - Settings desktop nav has `<Link to={createPageUrl('Engine')}>Engine</Link>`. Clicking it navigates to `/Engine`. Engine mounts without `fromSearch/editTrip/viewTrip/newTrip` context. Engine's active-trip check runs (if authed); if the user has an active trip < 24h it sets viewMode `active_trip` and renders Active Trip, **not** flight selection. If the user has NO active trip, the `/-redirect` effect fires and bounces to `/`. So tapping "Engine" from Settings lands on Active Trip (if one exists) or `/` (if not). The label "Engine" is a bug on its own — user-facing internal naming — and the resulting destination is incoherent.

---

## Proposed fix order

Ranked by (1) demo impact, (2) user confusion, (3) cost.

### Tier 1 — Do before demo

1. **Relax TripAwareHome on `/search`** (gap G, H). Fire only on `/`. `/search` always renders Search. Users clicking "When Should I Leave?" get a search form; if they want their trip, they use the TabBar or a Trip-aware banner inside Search. ~10 lines in `App.jsx`.
2. **Add DS `TabBar` to `ActiveTripView`** (gap I.1, gap B partial). Users trapped in Active Trip can reach Search / Trips / Settings. ~30 lines.
3. **Fix Trips and Settings desktop nav** (gap D). Relabel "Engine" → "Search", point "Search" link at `/search` not `/Engine`, relabel "Trip History" → "My Trip". Trivial.
4. **Land the Task 7.5 step-persistence fix** (gap E adjacent, already built on `sprint-7-task-7.5-results-screen`). Refresh on Setup/Results preserves position. Merge-ready.

### Tier 2 — High-value after demo

5. **`returnTo` mechanism for auth-gated redirects** (gap A). When Trips/Settings redirect an unauth user, store the origin URL and have AuthModal honor it. Medium effort.
6. **Migrate Trips and Settings to DS TopBar + TabBar** (gap B). Consolidates the three remaining pre-redesign `<header>` blocks. Aesthetic + consistency win.

### Tier 3 — Lower priority

7. **Escape hatch on `/Home` route** (gap F). Either wrap with TripAwareHome or drop the route. Cosmetic.
8. **`/trips/:id` deep link** (gap F). Not on critical path.
9. **Remove `navigateToLogin` / `authError` dead code from `AuthContext`** (not a flow gap, just cleanup). `App.jsx` currently branches on conditions that never fire. One commit.
10. **Per-step routes for Engine flow** (gap E). Substantial refactor; skip for sprint 7.

---

## Items not investigated

These could not be determined from code reading alone; flag for Rab to verify at runtime:

1. **Exact behavior of TripAwareHome's 24h filter** when the user has a trip that's exactly at the boundary (e.g., 23h 59m, 24h 1m). The filter uses `projected_timeline.departure_utc` if present, else falls back to `departure_date === today | tomorrow`. The boundary behavior on "tomorrow at 11 PM" vs "tomorrow at midnight" needs a runtime check.
2. **AuthModal behavior on Landing** — whether the modal opens centered over the landing when a scrolled user clicks Sign in (Landing has a floating-pill Header). Should just work because Dialog is portaled, but requires runtime verification.
3. **Back-nav from AuthModal** — does closing the modal fire any `navigate(-1)` logic anywhere? Traced to no; AuthModal just calls `onOpenChange(false)`. Worth confirming that no consumer routes on close.
4. **`TripAwareHome` fires on both `/` and `/search`** — but when a user is already on `/search` and enters from inside the SPA (e.g., landing CTA), does the hook re-fetch `/v1/trips/active-list` on every mount? Yes per code (`useEffect([isAuthenticated, token])` only re-runs on auth change, but the component re-mounts each `/search` entry because `<Route>` renders fresh). Latency on every page load for authenticated users — runtime check recommended.
5. **Scroll restoration across Engine viewMode flips.** No `ScrollRestoration` wrapper in the router. In-page scroll position may persist across Setup → Results transitions — visual artifact worth verifying.
6. **iOS "Swipe to go back" gesture** in the Capacitor shell on Engine step transitions. Same browser-back issue as gap E but with native chrome. Runtime test on device.
