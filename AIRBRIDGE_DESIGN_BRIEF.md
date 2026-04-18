# AirBridge Mobile Design Brief

**Version:** 2.1
**Date:** April 17, 2026
**Author:** Strategic planning chat (design synthesis + team feedback integration)
**Consumed by:** Sprint 7 implementation (Claude Code) + the AirBridge team
**Supersedes:** v1.0 of this brief (April 8, 2026), Valerie's three ideation passes, the team's HTML prototype, and the team feedback PDF. All inputs were considered and synthesized; this brief is authoritative where they conflict.
**Companion documents:**
- `REVISED_SPRINT_PLAN.md` — authoritative for scope and sequencing
- `CLAUDE.md` — authoritative for implementation patterns and workflow
- This brief — authoritative for design decisions

---

## v2.1 Changelog (read this first)

**Scope cut — email notifications removed entirely from v1.**

Morning-of email briefing (previously listed as a Free+Pro notification channel in Settings and in the Pro gating table) is cut. Rationale: push notifications cover the actionable plan-change cases with lower latency and higher user attention; email briefing was the weakest link in the notification stack; removing it eliminates a provider dependency (SendGrid/Resend) with ongoing cost and DNS/verification overhead. See `REVISED_SPRINT_PLAN.md` "Cut from v1" section for full reasoning.

**What this changes in the brief:**
- Section 4.14 Settings → Notifications section: "Morning email briefing" row removed.
- Section 6 Pro gating table: "Morning-of email briefing" row removed.
- No other sections affected. Push and SMS notification flows unchanged.

**Implementation note:** Claude Code building Settings (Task 7.5 screen work) must use the v2.1 Settings notification list, not the v2.0 list. If a Claude Code prompt cites Section 4.14 and pulls the v2.0 copy by mistake, the brief authoritative answer is v2.1 — surface to Rab.

---

## v2.0 Changelog (read this first)

This version incorporates the team's HTML prototype and the feedback PDF. Where the team feedback was right, the brief was updated. Where the brief was right, it was preserved. The major changes from v1.0:

**Information architecture changed:**
- Home screen is now **search-first**, not dashboard-first. Dropping the "Good morning, Valerie" greeting + Recent Trips dashboard concept entirely. Most users open the app to plan a trip, not to check on AirBridge. Search-first home is more honest about that.
- Bottom nav labels changed from Home / Trips / Settings to **Search / My Trip / Settings**. "My Trip" singular adapts: shows trip detail when one trip is active, list when multiple are active.
- Default search mode flipped to **route search** (origin + destination + date), with flight-number search as a prominent secondary toggle. Most travelers think "I'm flying SFO to LAX tomorrow" before they think of a flight number.

**Feature scope changes (v1):**
- **Live Activities cut entirely from v1.** Apple Wallet covers boarding-pass-style live activities in iOS 26. AirBridge's journey-state Live Activity (the Uber-style countdown) requires a custom Capacitor plugin (8-15 hours of native Swift) that doesn't fit the remaining sprint budget. Deferred to v1.1+. The brief no longer includes Live Activity previews in Settings or anywhere else.
- **CLEAR support cut for v1.** Security simplified to two options: **TSA PreCheck** and **None** (renamed from "Standard" — the team is right that "Standard" sounds like a default rather than the absence of a fast lane). CLEAR returns in v1.1 if Pro user feedback demands it.
- **US-only scoping made explicit.** Marketing copy reflects this throughout. "🇺🇸 US domestic flights only" badge on Search screen and Settings. International flights deferred (visa/passport/customs complexity).
- **Geolocation added.** "📍 Use my current location" affordance below the address text input on Setup screen. Text input remains primary; geolocation is opt-in via tap, triggering iOS permission prompt the first time. Graceful fallback to text input if denied.

**Specific copy and component changes:**
- "Calculate Departure" wording fix throughout (Anne's feedback). The product computes a leave-by *time*, not a *departure* — but "Departure" is what users say. Default copy is "Find your leave-by time" / "Your leave-by time" / "Track my trip." Never "Calculate Departure."
- Transport picker: 2x2 card grid (Uber / Lyft / Public transit / Drive), not a segmented control. "Drive" includes "+~10 min parking" subtext for honest expectation-setting.
- **Conditional rideshare deep-link card:** the "Book your Uber" card only appears when Uber or Lyft is selected as transport mode. If the user is driving, no rideshare card. After tapping Open, a "← Back to AirBridge" return path is always visible.
- 3-stat summary card (Drive 28min / Clear+PreCheck 9min / Buffer 30min) **removed.** It duplicated info already in the timeline. Replaced with a clear "Track my trip" CTA.
- Bags input simplified: single toggle "Checking bags?" with subtext "Joining the check-in line · Wait time varies." No more "# of bags" stepper (false precision).
- "Saves you ~15 min" badge on PreCheck option for honest expectation-setting.
- TSA card subtitle clarifies "from checkpoint to gate" so users understand the 7-min walk reference.
- "Time of day" filter on flight search **removed.**

**What was kept from v1.0:**
- Multi-trip experience (My Trip tab adapts: one trip = detail view, multiple = list with next one prominent). Sprint 7 backend already shipped the endpoints.
- Auth flow (Apple/Google primary, phone OTP web fallback)
- Push permission priming modal
- Paywall modal at trip 4
- Post-trip feedback prompt
- Onboarding (anonymous-first, Duolingo-style delayed registration)
- Trip editing flow + untrack-to-edit pattern
- Delete account confirmation (App Store requirement)
- Share card (word-of-mouth growth vector)
- Active Trip Screen with 6 phase states (calm → urgent tonal shift via light → dark theme transition)
- Design system (General Sans, Phosphor icons, defined token palette, glass surfaces on nav layer only)
- Mobile-first; desktop inherits the design system without a separate redesign

**Scope explicitly deferred to v1.1+:**
- Live Activities (custom Capacitor plugin work)
- CLEAR / Priority Lane security options
- Multi-modal comparison (rideshare vs driving timelines side by side)
- Real airport indoor maps for `at_airport` phase
- Calendar event auto-creation
- Phone number collection UI for SMS

---

## How to use this document

This brief is the design source of truth for the AirBridge mobile redesign. It is **not** a prompt to paste into Claude Code; it is a reference document that implementation prompts cite by section number. Every section has a stable heading that can be referenced as "Section X.Y" from a sprint prompt.

The intended workflow is:

1. Commit this file to the frontend repo root alongside `CLAUDE.md`.
2. Commit the team's reference materials to `docs/design-ideations/`: Valerie's 14 ideation PNGs and the team HTML prototype (saved as `team-prototype.html`).
3. Start Sprint 7 redesign with the **design system foundation PR** (see Section 3 and Section 8.1) before any screen work.
4. For each screen, write a focused sprint prompt that instructs Claude Code to read the relevant brief sections and reference materials, then implement one screen at a time.
5. If the brief is wrong or incomplete mid-build, update this file and re-commit before resuming. Do not let Claude Code guess.

Every implementation prompt should follow the pattern in Section 8.3.

**Boundary on Claude Code's flexibility:** Section 8.4 documents what Claude Code decides versus what this brief settles. Claude Code has flexibility on implementation details (component structure, file organization, testing patterns, animation timing within the brief's motion tokens, accessibility implementation). Claude Code does **not** have flexibility on design decisions (screen layouts, IA, colors, typography, spacing tokens, component shape, state machine rules, copy). If Claude Code hits a genuine ambiguity mid-build, the rule is **surface it to Rab, don't guess.**

---

## Table of contents

- **Section 1** — Aesthetic direction: "Concourse"
- **Section 2** — Navigation architecture
- **Section 3** — Design system
- **Section 4** — Per-screen specifications
- **Section 5** — Active Trip Screen phase state matrix
- **Section 6** — Paywall, feedback, and Pro gating
- **Section 7** — Capacitor implementation notes
- **Section 8** — Handoff guidance for Claude Code
- **Section 9** — Open questions and deferred decisions

---

# Section 1 — Aesthetic direction: "Concourse"

## 1.1 The one-sentence direction

AirBridge's mobile app is **premium airport signage discipline expressed through iOS 26 Liquid Glass** — a content-forward, typographically confident departure copilot that feels calm and paper-like in planning mode and shifts into a dark, decisive concourse-navy mode as departure approaches.

## 1.2 Why this direction

Three constraints shape it.

**First**, the user flow is explicit that AirBridge has two emotional modes: *calm and trustworthy* in planning mode, *urgent and decisive* in "time to go" mode. A design that serves both without feeling like two different apps needs a tonal shift lever that is not color-alone (red-on-white is the cheap lever) and not mode-switching (forcing users to opt into dark mode). The Concourse direction uses **automatic light-to-dark progression as the trip advances** — the Search screen and planning-mode Results are paper-light, the Active Trip Screen is navy-dark by the time it's the urgent "Leave NOW" state. The user never chooses the mode; the product chooses it for them based on phase.

**Second**, Flighty's design lead Ryan Jones has publicly cited airport departure boards as his guiding metaphor: *"Those airport boards have one line per flight, and that's a good guiding light — they've had 50 years of figuring out what's important."* AirBridge is the only app in the category that explicitly owns the *ground journey* rather than the flight. A signage-inspired aesthetic reinforces that positioning without copying Flighty's visual density.

**Third**, iOS 26 shipped Liquid Glass as Apple's new universal design language in September 2025. Apple has stated that the option to retain pre-Liquid-Glass designs will be removed in iOS 27. AirBridge launches July 2026 on iOS 26. The Concourse direction leans into Liquid Glass's core rule — *glass is for the navigation layer that floats above content; never for content itself* — and uses full-bleed content surfaces with translucent floating nav and toolbars.

## 1.3 What "Concourse" commits to

- **Typographic hierarchy over color hierarchy.** The hero moments (leave-by time, countdown, flight number, gate) are earned by weight and scale, not by color accents.
- **One dominant accent, used sparingly.** Indigo is the brand; it is used for primary actions, active states, and nothing else. Secondary accents (teal for confidence, amber for live data, coral for urgency) each have a specific semantic meaning and appear only when that meaning applies.
- **Full-bleed content, floating chrome.** Tab bars, toolbars, and modal handles float above the content as translucent glass. Content surfaces (cards, lists, the map) extend edge-to-edge behind the glass. Cards are NOT glass.
- **Warm paper-light and concourse-navy as co-equal grounds.** The app uses both grounds deliberately based on phase. Planning mode: warm paper. Active trip after the user is en route or closer: concourse navy.
- **Restrained motion.** Transitions are fast and purposeful. The urgent state transition (calm to "Leave NOW") is the one choreographed moment in the product.
- **No purple gradients on white.** Explicitly. The brand indigo appears as solid fills on warm paper or as floating elements on concourse navy — never as a gradient bleed behind content.

## 1.4 What Concourse explicitly rejects

- Generic Tailwind default palettes. Every accent in Section 3.1 is offset from the defaults.
- Inter, SF Pro as the sole font, and any "Space Grotesk / DM Sans" choice. Typography is General Sans from Fontshare (Section 3.2).
- Skeuomorphic icons or 3D illustrations. Iconography is Phosphor Icons at two weights (Section 3.7).
- Fake map grids or placeholder tile backgrounds. The Active Trip Screen gets a real Google Maps embed, styled to match the palette (Section 7.3). The Search screen does NOT get a decorative map — the team prototype showed one and it was correctly identified as visual noise without real value.
- Hero confetti celebration moments. AirBridge is a tool for busy travelers, not a habit-tracker.
- Colorful emoji-style icons in list rows. Settings uses monochrome line icons.
- Live Activity previews in Settings. Cut from v1; do not advertise a feature we won't ship.

---

# Section 2 — Navigation architecture

## 2.1 Three-tab bottom nav

The bottom tab bar has exactly three tabs in this order:

1. **Search** — flight/route entry, the primary way to start a new trip
2. **My Trip** — adapts: shows trip detail when one trip is active, list when multiple are active. Includes History sub-view.
3. **Settings** — account, subscription, notification preferences, defaults, about

Settings absorbs account management. There is no separate profile tab. The Search screen's top-right corner shows the user's avatar (initials in an indigo circle) which deep-links to Settings; this is convenience, not navigation duplication.

The tab bar is a floating Liquid Glass surface (Section 3.8): translucent background, 0.5px hairline top border, safe-area-inset-bottom padding. Content scrolls *under* the tab bar.

**Why "Search" not "Home":** The team's prototype correctly identified that the primary action on the home tab is searching for a flight. "Home" implies a dashboard or landing page; "Search" tells the user what the tab does. This is honest naming.

**Why "My Trip" singular not "Trips" plural:** Most free-tier users have one trip at a time. Pro users with multiple trips will see the same tab show a list — they won't be confused by the singular label, and the singular form better matches the typical case.

## 2.2 The active-trip-takes-over rule

When the user has at least one trip with status `active` (any phase) or `en_route`/`at_airport`/`at_gate` within the next 24 hours, **opening the app lands them on the My Trip tab with that trip's detail view already open** — not on Search. This is the Uber pattern: if there's a ride in progress, the app opens to the ride.

Specifically:
- **0 upcoming trips in next 24h:** Open to Search (the primary planning surface).
- **1 upcoming trip in next 24h:** Open directly to that trip's Active Trip Screen.
- **2+ upcoming trips in next 24h:** Open to the My Trip tab → Active list, sorted soonest-first.

The "+New Trip" affordance is always accessible from Search and from the My Trip tab's Active list.

## 2.3 Red-dot badging on the My Trip tab

The My Trip tab in the bottom nav shows a small red dot when:
- A tracked trip has had a plan-changing update the user has not yet seen (leave-by shifted 10+ min, delay, cancellation, gate change)
- A trip has entered the `time-to-go` urgent state and the user has not acknowledged it
- A completed trip is awaiting feedback (Section 6.4)

The red dot is the **only** red element in the tab bar. It uses urgency-coral `#FF4530`, not a generic red. 6px in diameter, top-right corner of the My Trip tab icon.

## 2.4 Top-bar rules

- **Search:** AirBridge logomark + wordmark on the left, user avatar circle on the right, "🇺🇸 US domestic flights only" pill below the wordmark.
- **My Trip (single trip):** "<" back chevron left (when applicable), flight number center ("UA 300"), kebab/more icon right. In the urgent and en_route states, the top bar becomes near-invisible — translucent over the navy ground, just back chevron visible in white.
- **My Trip (list view):** "My Trips" title left, "+" icon right (opens Search).
- **Settings:** "Settings" title left, no right icon.
- **All modals and sheets:** Drag-handle at top, "Cancel" or "<" on left, action button on right if applicable.

The top bar never contains tabs. Tab switching happens only at the bottom.

## 2.5 My Trip tab internal structure

The My Trip tab adapts based on trip count:

- **0 trips:** Empty state with "+New Trip" CTA pointing to Search.
- **1 trip (any non-completed status):** Direct trip detail (Active Trip Screen per Section 5).
- **2+ trips (any non-completed status):** Top of screen shows two segmented-control sub-tabs: **Active** (default) and **History**. Active list is the entry point.

For users with multiple trips, the Active sub-tab shows all non-completed trips (drafts + tracked in any phase) sorted by departure date ascending. The History sub-tab shows completed trips in reverse chronological order with accuracy stats.

Drafts are visually distinguished from tracked trips (see Section 4.10.3). Free users see the 5 most recent History items + a "See all with Pro" card; Pro users see unlimited.

## 2.6 Deep-link routing table

| Route | Screen | Notes |
|---|---|---|
| `/` | Search (search-first home) | or auto-redirect per active-trip rule |
| `/search` | Search | explicit |
| `/trips` | My Trip tab | adapts per trip count (Section 2.5) |
| `/trips/history` | My Trip tab, History sub-tab (visible only when 2+ trips) | |
| `/trips/:id` | Trip detail (Active Trip Screen) | phase-aware per Section 5 |
| `/trips/:id/edit` | Edit trip (draft or planning-phase active) | |
| `/trips/new` | New trip flow (Search with flight entry expanded) | |
| `/trips/:id/setup` | Setup screen (departure address, transport, security, bags) | |
| `/trips/:id/results` | Results screen (planning mode) | the pre-track state |
| `/trips/:id/feedback` | Post-trip feedback prompt | |
| `/settings` | Settings tab | |
| `/settings/notifications` | Notification preferences detail | |
| `/settings/preferences` | Default preferences detail | |
| `/settings/delete` | Delete account confirmation | |
| `/paywall` | Paywall modal | presented as full-screen modal, not a route swap |
| `/onboarding` | First launch flow | |

---

# Section 3 — Design system

This section defines the tokens. The first implementation task in Sprint 7 redesign is a design system foundation PR that materializes all of these as Tailwind config values, CSS custom properties, and a `/design-system` preview route that renders a component gallery.

## 3.1 Color palette

All colors are defined in both light and dark mode. Light mode is the default for Search, My Trip list, History, Settings, Setup, Results (planning), Paywall, and Onboarding. Dark mode is the default for Active Trip Screen phases `time-to-go`, `en_route`, `at_airport`, `at_gate`, and `complete`. Planning-phase Active Trip stays in light mode. See Section 5 for the full phase-to-theme map.

### Brand

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--brand-primary` | `#4F3FD3` | `#6855E8` | Primary CTAs, active tab, active progress step, indigo logomark |
| `--brand-primary-hover` | `#3F31B8` | `#7A67F2` | Hover/tap down |
| `--brand-primary-pressed` | `#2E2391` | `#5341CD` | Active press |
| `--brand-primary-surface` | `#EEEBFA` | `#1F1A4A` | Tinted backgrounds (e.g., Pro Trial card base before gradient) |

The light indigo `#4F3FD3` is deliberately offset from Tailwind's `#6366F1` default. It has more red in the mix, slightly more saturation, and reads as *committed* rather than *default*. This is the single most important palette decision in the brief and matches the existing airbridge.live brand color.

### Confidence

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--confidence` | `#0FB494` | `#2DD4B0` | "On Time" pills, Done checkmarks, accuracy stats, confidence percentage, "Saves ~15 min" PreCheck badge |
| `--confidence-surface` | `#E5FAF4` | `#0F3A30` | Tinted backgrounds for confidence rows |

### Urgency

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--urgency` | `#FF4530` | `#FF6B52` | "Leave NOW" hero state, time-to-go countdown inside the final 15 minutes, critical flight alerts, My Trip tab red dot, Sign Out destructive action |
| `--urgency-surface` | `#FFEBE7` | `#3A0F0A` | Tinted backgrounds for urgency banners |

### Live data

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--live-data` | `#FFB347` | `#FFC266` | "Updated X min ago" freshness markers, the pulse dot on live TSA data, amber pulse on the "LIVE" pill |
| `--live-data-surface` | `#FFF4E0` | `#3A2A0A` | Tinted backgrounds for live data cards |

### Warning

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--warning` | `#D4821A` | `#FFB347` | "Traffic added 8 min" banners, delay notices that are *not yet urgent* |
| `--warning-surface` | `#FDF4E3` | `#3A2A0A` | Warning banner backgrounds |

### Grounds

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--ground` | `#F8F6F1` | `#0B1220` | The base background of the app |
| `--ground-elevated` | `#FFFFFF` | `#111A2E` | Cards, sheets, elevated surfaces |
| `--ground-raised` | `#FFFFFF` | `#1A2540` | Second-level elevation |
| `--ground-sunken` | `#F0EDE6` | `#070B14` | Inset surfaces (input fields, search bars) |

The light ground `#F8F6F1` is warm paper, not lavender-white. It reads as "premium stationery" rather than "tech SaaS." The dark ground `#0B1220` is Concourse navy.

### Text

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--text-primary` | `#0A0F1C` | `#F4F3EF` | Body text, hero numerals |
| `--text-secondary` | `#4A5166` | `#A8ADBE` | Supporting text, labels |
| `--text-tertiary` | `#8B91A3` | `#6B7186` | De-emphasized text, timestamps |
| `--text-inverse` | `#FFFFFF` | `#0A0F1C` | Text on brand-filled buttons |
| `--text-on-urgency` | `#FFFFFF` | `#FFFFFF` | Text on urgency-filled surfaces |

### Borders, glass, shadows — same as v1.0 (see prior sections of this brief)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--border-hairline` | `#E8E4DA` | `#1F2940` | 0.5px borders, dividers |
| `--border-subtle` | `#D9D4C6` | `#2A3550` | 1px borders on inputs, cards |
| `--border-strong` | `#0A0F1C` | `#F4F3EF` | Focus rings, emphasized borders |
| `--glass-tint` | `rgba(248, 246, 241, 0.72)` | `rgba(11, 18, 32, 0.72)` | Floating nav/toolbar background |
| `--glass-border` | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.08)` | Hairline on glass edges |

## 3.2 Typography

**Font family:** General Sans, loaded from Fontshare (free, open-source, SIL Open Font License). Self-host in `public/fonts/` to avoid runtime CDN dependency.

**Weights loaded:** 300 Light, 400 Regular, 500 Medium, 600 Semibold, 700 Bold, 800 Extra-Bold.

**Fallback stack:** `'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Type scale

| Token | Size | Line | Weight | Usage |
|---|---|---|---|---|
| `--type-hero-xl` | 72px | 76px | 800 | "Leave NOW" urgent state, onboarding hero |
| `--type-hero` | 56px | 60px | 700 | Leave-by countdown ("4:40:53") |
| `--type-display` | 36px | 40px | 700 | Results screen leave-by time ("2:43 PM") |
| `--type-title-xl` | 28px | 34px | 700 | Page titles |
| `--type-title` | 22px | 28px | 600 | Section headers, modal titles |
| `--type-headline` | 17px | 22px | 600 | Card titles, list row primary text |
| `--type-body` | 15px | 21px | 400 | Body text, list row secondary |
| `--type-footnote` | 13px | 18px | 400 | Timestamps, labels, helper text |
| `--type-caption` | 11px | 14px | 500 | Uppercase labels ("ACCOUNT"), badges |
| `--type-tabular` | 15px | 21px | 500 | Tabular numerals for data ("9 min") |

**Tabular numerals:** enable `font-feature-settings: 'tnum' 1, 'ss01' 1;` globally on any element displaying time, wait minutes, or distances. Critical for the Active Trip Screen's hero countdown.

**Letter-spacing:** `--type-caption` uppercase labels use `letter-spacing: 0.08em`. Default elsewhere.

## 3.3 Spacing scale

Base unit is 4px. Tailwind's default scale works.

| Token | Pixels | Usage |
|---|---|---|
| `--space-1` | 4px | Tight icon-text gaps |
| `--space-2` | 8px | List row internal spacing |
| `--space-3` | 12px | Card internal padding (small) |
| `--space-4` | 16px | Default gap, card padding |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Page horizontal padding, major section gap |
| `--space-8` | 32px | Large section gap |
| `--space-10` | 40px | Hero content padding |
| `--space-12` | 48px | Top-of-page breathing room |
| `--space-16` | 64px | Empty-state breathing room |

**Page horizontal padding is always 24px.**

## 3.4 Radius scale

| Token | Value | Usage |
|---|---|---|
| `--radius-pill` | 999px | Pills, segmented controls, CTA buttons |
| `--radius-lg` | 20px | Cards, sheets, paywall modal |
| `--radius-md` | 14px | Input fields, small cards |
| `--radius-sm` | 10px | Icons, logomark, list row icons |
| `--radius-xs` | 6px | Tags, tight labels |

## 3.5 Shadows, motion, iconography, glass — unchanged from v1.0

See v1.0 sections 3.5, 3.6, 3.7, 3.8, 3.9, 3.10. All preserved as written. Phosphor Icons at Regular and Bold weights. Glass surfaces only on the navigation layer. Theme determined by phase, not by user OS preference.

The one motion flourish in the app remains the calm-to-urgent 600ms choreographed transition on the Active Trip Screen.

---

# Section 4 — Per-screen specifications

Each screen has a purpose, layout, states, and content rules. The screens have been renumbered from v1.0 to reflect the search-first IA.

## 4.1 Onboarding / first launch

**Purpose:** Zero-friction anonymous trip calculation. Deliver the aha moment before any auth ask. Duolingo-style delayed registration.

**Layout:**
- Full-bleed light ground
- AirBridge logomark (48px) + wordmark centered
- `--type-display` "Know exactly when to leave."
- `--type-body` `--text-secondary` "Enter a flight, get your leave-by time. No account needed." 64px below
- "🇺🇸 US domestic flights only" pill in `--text-tertiary`
- Spacer
- Primary button "Find My Leave-By Time" full-width
- Tiny footer: "Free. No ads. No sign-up." in `--type-footnote` `--text-tertiary`

**Behavior:**
- First launch ever: this screen appears. Tapping CTA routes to `/search`.
- Subsequent launches: never appears again. App boots to Search or auto-redirects per active-trip rule.
- "First launch" flag is a `localStorage` boolean.

**What it is not:** an onboarding carousel. No feature tour, no swipe screens, no permission priming.

## 4.2 Search (primary entry point, replaces Home dashboard)

**Purpose:** The primary screen of the app. Form-forward, low friction, get to a calculated leave-by time in two taps.

**Layout:**
- Top bar: AirBridge logomark + wordmark left, avatar circle right (24px, initials)
- Below top bar: small "🇺🇸 US domestic flights only" pill in `--ground-sunken` background
- Content region with 24px horizontal padding
- 32px gap
- **Search card:** ground-elevated surface with `--radius-lg`, 24px internal padding
  - Header: `--type-title` "Start your journey"
  - Subhead: `--type-body` `--text-secondary` "Never miss a flight again"
  - 24px gap
  - **Default mode: Route search**
    - Field label: "From"
    - Input: airport autocomplete with placeholder "Origin airport (e.g. SFO)", airplane icon left
    - Field label: "To"
    - Input: airport autocomplete with placeholder "Destination airport (e.g. LAX)", airplane icon left
  - **Alternate mode: Flight number search** (toggle to switch)
    - Field label: "Flight number"
    - Input: large, placeholder "UA 300", airplane icon left, auto-capitalize
  - 16px gap
  - Date row: three pills "Today" / "Tomorrow" / "Pick a date"
  - 24px gap
  - Primary CTA: "🔍 Search flights" full-width
  - Below CTA: prominent text link toggle "Have a flight number? Enter it directly →" in `--brand-primary` (NOT gray — the team's PDF feedback specifically called out that the gray version was hard to see)
- Bottom: tab bar clearance

**Behavior:**
- On first load: route mode active by default
- Toggling to flight-number mode swaps the field above the date row, preserves date selection
- Search button disabled until valid input (route: both airports filled; flight number: matches `[A-Z]{2,3}\s?\d{1,4}`)
- On success: route to Flight Selection screen if multiple matches, or directly to Setup if exactly one

**What is NOT on Search:**
- ❌ "Good morning, Valerie" greeting (cut from v1.0 brief)
- ❌ Recent Trips row (cut)
- ❌ Accuracy moment card (cut — moves to My Trip tab as part of trip history view)
- ❌ Decorative map (team prototype had a faint grid; cut as visual noise)
- ❌ "Time of day" filter (cut)

**Source reference:** The team's HTML prototype's Screen 1 is the closest match to what this screen should be. Use it as the structural reference. The brief preserves the visual design system (General Sans, indigo brand color, etc.) but the IA is the prototype's.

## 4.3 Flight selection / disambiguation

**Purpose:** When a search yields multiple matches, let the user pick. Auto-skip when only one match.

**Layout:**
- Top bar: "<" back, "Select your flight" title
- Content 24px padding
- Header: `--type-title` "Multiple flights match"
- Subhead: `--type-body` `--text-secondary` "Which one is yours?"
- Scrollable list of flight cards:
  - Airline name + flight number (left), departure time (right)
  - Route + terminal subtitle
  - Status pill: "On time" (confidence), "+12 min" (warning/red), "Cancelled" (urgency, greyed but tappable)
- Footer link: "I don't see my flight" → opens help modal

**States:**
- Empty: "No flights match" with Retry CTA back to Search
- Cancelled flight: tappable but opens "Your flight has been cancelled" screen instead of Setup

## 4.4 Setup (departure preferences)

**Purpose:** Collect the variables that affect the leave-by calculation. Address, transport, security, bags. This screen is shown after flight selection.

**Layout:**
- Top bar: "<" back, "Departure setup" title, flight subtitle ("UA 300 · SFO → LAX · 8:49 AM")
- Content 24px padding, scrollable
- **Section 1: Where are you leaving from?**
  - Field label: "📍 Where are you leaving from?"
  - Sunken input with pin icon, placeholder "Enter your departure address"
  - Below input: small text button "📡 Use my current location" in `--brand-primary`
- **Section 2: How are you getting there?**
  - Field label: "🚗 How are you getting there?"
  - 2x2 card grid (NOT a segmented control):
    - **Uber** — "Rideshare"
    - **Lyft** — "Rideshare"
    - **Public transit** — "Bus, BART, rail"
    - **Drive** — "+~10 min parking" (selected by default)
  - Each card has icon, name, subtext
  - Selected card: brand-tinted background, brand-colored border
- **Section 3: Security access**
  - Field label: "🛡 Security access"
  - Two stacked option cards (NOT five):
    - **TSA PreCheck** — "Dedicated fast lane" + "Saves ~15 min" badge in confidence color
    - **None** — "Standard security lane" (renamed from "Standard")
- **Section 4: Bags** (simplified from v1.0)
  - Single toggle row:
    - Label: "Checking bags?"
    - Subtext: "Joining the check-in line · Wait time varies"
    - Toggle switch on right
  - NOT a stepper. The number of bags doesn't materially change the time impact.
- **Section 5: Traveling with children?**
  - Single toggle row:
    - Label: "Traveling with children"
    - Subtext: "Adjusts walking pace at airport"
- 24px gap
- Primary CTA: "🚀 Start my trip" full-width
- Bottom: safe area + tab bar clearance

**Geolocation behavior:**
- Tapping "Use my current location" triggers `navigator.geolocation.getCurrentPosition()`
- iOS shows native permission prompt the first time
- If granted: reverse-geocode coordinates via Google Geocoding API (backend already has the key) to a street address, populate the input
- If denied: show small `--text-secondary` helper text below input "Location access denied. Enter your address above." Do not re-prompt.
- Cache resolved location in `sessionStorage` so we don't re-prompt within a session

**What was cut from v1.0 Setup:**
- ❌ CLEAR option
- ❌ PreCheck+CLEAR combo
- ❌ Priority Lane
- ❌ "# of bags" stepper

## 4.5 Results (planning mode)

**Purpose:** The aha moment. Show the user their leave-by time with full segment timeline.

**Layout:**
- Top bar: "<" back to Setup, "Results" title
- Content 24px padding, scrollable
- **Hero card:** brand-tinted background `--brand-primary-surface`, 28px padding, `--radius-lg`
  - Top row: `--type-caption` "⏱ LEAVE IN" countdown + flight number badge cluster ("UA 300", "SFO", "→ LAX", "Terminal 1", "Gate TBD", "On time")
  - Hero: `--type-hero` leave-by time ("3:55 AM") in white on brand-filled background OR `--brand-primary` on tinted background
  - Pills row: "🔔 Track & get alerts", "🕐 Boarding 5:30 AM", "+30 min buffer"
- 16px gap
- **Journey timeline section:**
  - Section header: `--type-headline` "Your journey timeline"
  - Subtext: `--type-footnote` "📍 [departure address]"
  - Vertical timeline list, each row:
    - Left: phase icon (home, car, bag, shield, walking) in 32px circle with confidence-tinted background
    - Middle: phase name + sub-label ("28 min drive", "+7 min parking", "9 min wait", "PreCheck", "7 min walk", "+30 min buffer")
    - Right: time of phase (`3:55 AM`, `4:23 AM`, etc.)
  - Phases: Leave home → At [airport] → Bag drop (if checking bags) → TSA Security → At gate
- 16px gap
- **Boarding + Departure card row** (2 cards side by side):
  - "BOARDING" 5:30 AM "30 min cushion at gate"
  - "FLIGHT DEPARTS" 6:00 AM "UA 300 · Terminal 1"
- 16px gap
- **Conditional rideshare card** (only if Uber or Lyft selected in Setup):
  - Black background, white text, `--radius-lg`
  - "Book your Uber" / "Book your Lyft" + "Schedule a pickup for [leave-by time]"
  - Right side: "Open →" button
  - Below card: small text link "← Back to AirBridge" in `--brand-primary` (only relevant after user opens external app)
- 16px gap
- Primary CTA: "📍 Track my trip →" full-width brand button
- Bottom safe area

**What was cut from v1.0 Results:**
- ❌ The 3-stat summary card (Drive 28min / Clear+PreCheck 9min / Buffer 30min) — confused users per team feedback
- ❌ Inline preference editing (Transport / Security / Buffer segmented controls inside Results) — these are set in Setup screen now, not edited inline on Results. If user wants to change, they tap back to Setup.
- ❌ Confidence percentage pill ("97% confident") — keep it simpler for v1, add back if testing shows users want it

**Behavior:**
- "Track my trip" CTA: opens auth modal if not signed in, else creates tracked trip and routes to Active Trip Screen
- "Open →" rideshare button: opens deep link to Uber/Lyft app with pre-filled origin/destination

## 4.6 Auth modal

**Purpose:** One-tap sign-in triggered after the user's first Results screen. Modal, not a full-screen route.

**Layout:**
- Bottom sheet, `--radius-lg` top corners, ~80% screen height
- Drag handle at top
- Header: `--type-title` "Save your plan"
- Subhead: `--type-body` `--text-secondary` "Sign in to track this trip and get notified if your leave-by time changes."
- 32px gap
- **Apple Sign In button:** mandatory black/white style, full-width pill, 52px tall
- 12px gap
- **Google Sign In button:** mandatory white-with-border style, full-width pill, 52px tall
- 12px gap
- Divider with "OR"
- 12px gap
- Phone OTP text link: hidden on iOS, shown on web only
- 24px gap
- Skip link: `--type-footnote` `--text-tertiary` "Skip for now — save later"

## 4.7 Push permission priming modal

**Purpose:** Pre-permission priming per the user flow PDF. Appears after auth, before iOS native prompt.

**Layout:**
- Bottom sheet, same shape as auth modal
- Illustration: simple line illustration of a phone with notification bubble (custom SVG, monochrome `--brand-primary`)
- Header: `--type-title` "Never miss your leave-by time"
- Body: `--type-body` `--text-secondary`
  - "AirBridge notifies you only when your plan changes."
  - "Traffic spike? Flight delay? Gate change? You'll know."
  - "No spam. We promise."
- Primary button: "Turn on notifications" (triggers native iOS prompt)
- Secondary text link: `--type-footnote` `--text-tertiary` "Not now"

**Critical:** "Not now" must NOT fire the iOS native prompt. Preserve the one-shot system prompt for a second chance on trip 2.

## 4.8 Active Trip Screen (all six phase states)

The single largest spec in the brief. See **Section 5** for the full phase state matrix. The shared scaffold is defined here; phase-specific layouts in Section 5.

**Shared scaffold:**
- Top bar: "<" back, flight number + route center, "…" more icon right
- Map region: 280px tall, full-bleed, real Google Maps embed (Section 7.3) — NOT a fake grid
- Hero card floating over bottom edge of map: `--radius-lg`, glass surface
- Progress bar: horizontal, four dots ("At Home" → "In Transit" → "At Airport" → "At Gate"), connected by line
- Content region (scrollable): phase-specific, 24px padding
- Bottom action row: phase-specific buttons

**Theme rule:** phases `active` and `active-planning` use light mode. Phases `time-to-go`, `en_route`, `at_airport`, `at_gate`, `complete` use dark mode (Concourse navy).

**TSA Wait card content** (per team feedback PDF):
- Header: `--type-caption` "TSA WAIT — LIVE DATA"
- PreCheck row: "9 min" hero + "Shorter than usual · Typical: 7-18 min · Updated 2 min ago"
- Standard lane row: "34 min" in warning color + "Longer than usual"
- Visual bars showing relative wait
- Divider
- Gate walk subsection: "🚶 Gate B8 — 7 min walk" + clarifying subtitle "**From security checkpoint to gate** · Turn right after PreCheck · Follow Terminal 1 signs"

The "from security checkpoint to gate" clarification is critical — team feedback called out that without it, users assumed the 7-min walk was airport-entrance-to-gate.

**What was removed from v1.0:**
- ❌ Live Activity preview anywhere on this screen or in Settings
- ❌ Manual "Tap to check in" pattern (state advancement is backend-driven per Sprint 6 B6.8)

## 4.9 My Trip tab (adapts to trip count)

**Purpose:** The single tab for all trip-related views. Adapts based on trip count per Section 2.5.

**Single trip:** Direct Active Trip Screen (Section 5).

**Multiple trips:**
- Top bar: "My Trips" title left, "+" icon right (opens Search)
- Segmented control: "Active" / "History" pills
- **Active sub-tab:**
  - Empty state: BoldAirplane icon, "No trips yet", "Your tracked trips will appear here", "+ New Trip" CTA
  - With trips: vertical list of trip cards sorted by departure ascending
- **History sub-tab:**
  - Empty state: "Your completed trips will appear here"
  - With trips: reverse-chronological list, free users see 5 + Pro upgrade card

## 4.10 Trip card variants

### 4.10.1 Tracked trip card (planning phase)
- Ground-elevated card, 20px padding, `--radius-lg`, `--shadow-sm`
- Top: airline + flight number + status pill ("Tracked")
- Middle: route in `--type-headline`
- Bottom: date + leave-by time + duration in `--type-footnote`

### 4.10.2 Tracked trip card (en_route or later)
- Same shape
- Status pill: "In Transit" / "At Airport" / "At Gate"
- Bottom: mini countdown ("Boarding in 42 min")
- Pulsing brand dot on left edge

### 4.10.3 Draft trip card
- Same shape but visually deprioritized: hairline border, no shadow, `--ground` (not `--ground-elevated`)
- Status pill: "Draft" in `--text-tertiary`
- Bottom: "Not yet tracked — tap to continue"
- Tap: opens Search/Setup pre-filled with draft values

## 4.11 Trip editing flow

**Purpose:** Allow editing of draft and planning-phase tracked trips. Tracked trips in `en_route` or later are locked.

**Layout:**
- Reuses Search → Setup → Results flow
- Top bar title: "Edit Trip"
- Primary CTA on Results: "Update Trip" instead of "Track my trip"
- For locked tracked trips: Active Trip Screen "…" menu shows "Untrack to edit"
- Tapping "Untrack to edit": confirmation modal "This returns your trip to draft so you can edit it. You won't lose a trial trip." → "Untrack" (urgency) / "Cancel"
- On confirm: POST `/v1/trips/{id}/untrack`, route back to My Trip with the now-draft trip highlighted

## 4.12 Paywall modal

**Purpose:** Appears on trip 4+ for non-subscribed users, on Results screen specifically.

**Layout:**
- Full-screen modal over dimmed Results
- "Cancel" text button top left
- Illustration: 120px tall Phosphor BoldAirplane with motion lines
- Header: `--type-title-xl` "Your 3 free Pro trips are up"
- Personal stat card (if available): "AirBridge was within X min on your last 3 trips"
- "What you'll lose" section with X-icon list:
  - Gate change alerts
  - SMS "Time to go!" escalation
  - One-tap rideshare deep links
  - Unlimited trip history
  - Personal accuracy stats
- Pricing toggle: Monthly $4.99 / Annual $39.99 (with "SAVE 33%" badge)
- Annual selected by default
- Primary: "Keep the full copilot" → opens Stripe Checkout in Safari
- Secondary text link: "Continue with free"

**Post-subscription aftercare:** Confirmation screen after Stripe return with "Welcome to Pro" + 3 unlocked feature cards + "Back to my trip" CTA.

## 4.13 Post-trip feedback

**Purpose:** Collect accuracy data after trip completes. Feeds the data flywheel.

**Layout:**
- Full-screen modal
- "×" dismiss top left
- Header: "How was your trip to HNL?"
- Subhead: "Three quick questions. We use your answers to get more accurate."
- Q1: "Did you follow our leave-by time?" — two large buttons "Yes" / "No"
- Q2: "How many minutes before boarding did you arrive at your gate?" — stepper, default 30
- Q3 (optional): "How long was the TSA line?" — stepper, default 15, "Skip" link
- Submit button
- Thank-you screen with personal accuracy stat

## 4.14 Settings

**Purpose:** Account, subscription, notification preferences, defaults, about.

**Layout:**
- Top bar: "Settings" title
- "🇺🇸 US domestic flights only" pill below title
- Content 24px padding, scrollable
- **Account section:**
  - Avatar + name + email + auth provider + chevron
  - "Sign Out" in urgency color
- **Subscription section:**
  - Free user: Pro Trial gradient card with "X of 3 free trips used" + progress bar + "Trial ends in N days"
  - Pro user: "Manage Subscription" row showing plan + renewal date + "Manage" chevron (opens Stripe Customer Portal)
- **Default preferences section** (default order, no Live Activity preview):
  - Default transport — "Drive"
  - Security access — "TSA PreCheck" (note: only PreCheck or None, no CLEAR)
  - Buffer time — "30 min"
  - Traveling with children — toggle
  - Preferred rideshare — "Uber" / "Lyft"
  - Preferred nav app — "Apple Maps" / "Google Maps" / "Waze"
- **Notifications section** (push notifications shown, NO Live Activity section, NO email — cut from v1):
  - Leave-by reminders — "Alerted when it's time to leave, and if traffic changes your departure time"
  - Flight status updates — "Instant alerts for delays, cancellations, and gate changes"
  - TSA wait spikes — "Notified if security lines grow beyond your buffer"
  - SMS escalation (Pro) — "Text if you miss the Time to go push" (Pro-gated, lock icon if free)
- **About section:**
  - Send Feedback (mail composer)
  - Privacy Policy (in-app browser)
  - Terms (in-app browser)
  - Version footer
- **Danger zone:**
  - Delete Account in urgency color

**What was removed from v1.0 Settings:**
- ❌ "Live activity & lock screen" section with mockup preview — Live Activities cut from v1, do not advertise

## 4.15 Delete account confirmation

Same as v1.0. Full-screen route with type-DELETE confirmation, calls `DELETE /v1/users/me`.

## 4.16 Share card

Same as v1.0. 1080×1920 portrait canvas, brand colors, leave-by time, flight info, "airbridge.live" footer.

## 4.17 Empty states inventory

| Screen | Empty state text | CTA |
|---|---|---|
| Search (always populated) | N/A | N/A |
| My Trip Active | "No trips yet. Your tracked trips will appear here." | "+ New Trip" |
| My Trip History | "Your completed trips will appear here." | (none) |
| Settings (new user) | (Pro Trial card with 0/3 used) | (none) |
| Active Trip Screen | No empty state — only exists when trip exists | N/A |

---

# Section 5 — Active Trip Screen phase state matrix

Unchanged from v1.0. Six phase states (`active`, `time-to-go`, `en_route`, `at_airport`, `at_gate`, `complete`), light mode for active/planning, dark mode for everything else. The 600ms choreographed calm-to-urgent transition remains the one motion flourish.

**Removed from v1.0:** Live Activity references in any phase state. Push notifications cover the alert use case for v1.

See v1.0 Section 5 for full state-by-state layout matrix; preserved verbatim.

---

# Section 6 — Paywall, feedback, and Pro gating

Unchanged from v1.0 except:
- Pro feature list updated to remove "Live Activities lock screen countdown" — was never a real Pro feature, removed from "what you'll lose" list in paywall

The Pro feature gating table is now:

| Feature | Free | Pro |
|---|---|---|
| Core recommendation | ✓ | ✓ |
| Leave-by shift push notifications | ✓ | ✓ |
| Flight delay/cancellation push | ✓ | ✓ |
| "Time to go!" push | ✓ | ✓ |
| **Gate change push alerts** | ✗ | ✓ |
| **SMS "Time to go!" escalation** | ✗ | ✓ |
| **One-tap rideshare deep links** | ✗ | ✓ |
| **Personal accuracy stats** | ✗ | ✓ |
| **Unlimited trip history** | 5 most recent | ✓ |
| **Post-trip accuracy receipt** | ✗ | ✓ |

---

# Section 7 — Capacitor implementation notes

Unchanged from v1.0. CSS Liquid Glass simulation, fonts self-hosted, safe areas respected, scroll performance considerations, Google Maps Tier 1 integration (real maps, styled, non-interactive on Active Trip Screen). Dark mode applied per-screen via `data-theme` attribute, not via OS preference.

**One addition:** Geolocation via `navigator.geolocation.getCurrentPosition()` works in Capacitor's WKWebView without a custom plugin. Triggers iOS native permission prompt the first time. Use the `@capacitor/geolocation` plugin if more reliable cross-platform behavior is needed (it's already in the Capacitor ecosystem).

---

# Section 8 — Handoff guidance for Claude Code

## 8.1 Sprint 7 redesign implementation order

Same as v1.0:
1. Design system foundation PR (tokens, fonts, components, `/design-system` preview route)
2. Shared layout components
3. Navigation scaffolding
4. Screens in order (updated for v2.0 IA):
   1. Search (Section 4.2) — most frequently seen, search-first home
   2. Flight selection (Section 4.3)
   3. Setup (Section 4.4) — replaces "Departure Setup" terminology
   4. Results (Section 4.5)
   5. Auth modal (Section 4.6)
   6. Push permission priming (Section 4.7)
   7. Active Trip Screen `active` state (Section 5.3.1)
   8. Active Trip Screen `time-to-go` state (Section 5.3.2)
   9. Active Trip remaining dark states
   10. My Trip tab (single + multi variants)
   11. Trip card variants
   12. Paywall modal
   13. Post-trip feedback
   14. Settings (note: NO Live Activity section)
   15. Onboarding
   16. Delete account
   17. Share card

## 8.2 The cite-by-section prompt template

Same as v1.0. Every implementation prompt cites brief sections by number, references reference materials in `docs/design-ideations/` (now including the team's HTML prototype as `team-prototype.html`).

## 8.3 Implementation rules Claude Code must follow

Same as v1.0. The 14 non-negotiable rules. Plus this v2.0 addition:

**Rule 15:** Do not implement Live Activities, lock-screen countdowns, or any feature requiring custom Capacitor plugins for native iOS APIs. Cut from v1. If a screen spec in this brief mentions Live Activities anywhere (it shouldn't), surface the contradiction to Rab — do not implement.

**Rule 16:** Geolocation uses `navigator.geolocation` or `@capacitor/geolocation`. No custom native code. Address text input is always primary; geolocation is opt-in via tap.

**Rule 17:** Security access has TWO options for v1: PreCheck or None. Do not add CLEAR, PreCheck+CLEAR, or Priority Lane.

**Rule 18:** Bags input is a single toggle ("Checking bags?"), never a stepper.

**Rule 19:** "Calculate Departure" wording is forbidden. Use "Find your leave-by time" / "Your leave-by time" / "Track my trip."

## 8.4 What the brief intentionally leaves for Claude Code to decide

Same as v1.0:
- React component structure (composition vs props, hooks vs classes)
- State management pattern (Context vs Zustand vs React Query)
- File organization within `src/`
- Test strategy
- CSS methodology
- PostHog event naming
- Git commit message style
- Error boundary strategy
- Loading state implementation details
- Animation timing within the brief's motion tokens
- Accessibility implementation details (44×44pt min tap targets specified, the how is Claude Code's call)
- Responsive breakpoint behavior between mobile and desktop within the design system

**What Claude Code does NOT decide:**
- Screen layouts and IA
- Color choices, typography, spacing tokens
- Whether a feature exists or not
- Component shape or visual treatment
- State machine rules
- Copy and microcopy

If Claude Code hits genuine ambiguity (the brief is silent or contradictory), the rule is **surface to Rab, don't guess.** Rab updates the brief and re-commits before Claude Code resumes.

**Quality engineering exception:** If Claude Code is implementing a screen and notices a real usability bug the brief didn't catch (e.g., "this CTA is below the fold on small phones"), it should flag the issue and propose a fix. Not "be creative" — but "this specific thing won't work, here's why, can I adjust it." That's quality engineering judgment, not design freelancing.

---

# Section 9 — Open questions and deferred decisions

## 9.1 Resolved in v2.0

These were open in v1.0 and are now decided:

- ✅ **Live Activities:** Cut from v1, deferred to v1.1+
- ✅ **Home screen IA:** Search-first, not dashboard-first
- ✅ **Bottom nav labels:** Search / My Trip / Settings
- ✅ **Default search mode:** Route, not flight number
- ✅ **Security access options:** PreCheck or None only
- ✅ **Bags input:** Toggle, not stepper
- ✅ **CLEAR support:** Cut to v1.1+
- ✅ **US-only scoping:** Confirmed for v1
- ✅ **Geolocation:** Included as opt-in option, text input remains primary

## 9.2 Still open for v1

- **Airport indoor maps for `at_airport` phase:** Defer to v1.1. Use stylized terminal diagram or text-first hero for v1.
- **Gate-level wayfinding content source:** Static content files per airport, top 10 US airports, post-launch.
- **Share card aesthetics:** Final visual design pass after main screens are built.
- **Accessibility:** Critical path for v1 (Onboarding → Search → Setup → Results → Active Trip → History), full audit post-launch.
- **Tab bar visibility in `time-to-go` urgent state:** Keep visible with inverted glass tint to match dark ground.
- **Trip dedup logic:** Same flight + date + user → opens existing draft for editing rather than creating duplicate.

## 9.3 Localization

English-only for v1. Use flex-based layouts so v2 localization doesn't require redesign. Never hardcode pixel widths on text-containing elements.

---

# End of brief v2.0

This document evolves. Version it in the repo, update it when reality disagrees with it, keep it in sync with the codebase the same way `REVISED_SPRINT_PLAN.md` stays in sync with sprint work.

The v1.0 brief was a synthesis without team validation. The v2.0 brief incorporates real team feedback, working prototype validation, and explicit scope decisions for the July launch. Sprint 7 redesign begins with the design system foundation PR and proceeds in the order documented in Section 8.1.
