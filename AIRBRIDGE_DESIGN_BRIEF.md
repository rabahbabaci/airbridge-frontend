# AirBridge Mobile Design Brief

**Version:** 1.0
**Date:** April 8, 2026
**Author:** Strategic planning chat (design synthesis)
**Consumed by:** Sprint 7 implementation (Claude Code) + the AirBridge team
**Supersedes:** Valerie's three ideation passes (v1, v2, v3). Those files remain as reference in `docs/design-ideations/` but this brief is authoritative where they conflict.
**Companion documents:**
- `REVISED_SPRINT_PLAN.md` — authoritative for scope and sequencing
- `CLAUDE.md` — authoritative for implementation patterns and workflow
- This brief — authoritative for design decisions

---

## How to use this document

This brief is the design source of truth for the AirBridge mobile redesign. It is **not** a prompt to paste into Claude Code; it is a reference document that implementation prompts cite by section number. Every section has a stable heading that can be referenced as "Section X.Y" from a sprint prompt.

The intended workflow is:

1. Commit this file to the frontend repo root alongside `CLAUDE.md`.
2. Commit all 14 ideation PNGs to `docs/design-ideations/` so Claude Code can `view` them on demand when a screen spec references them by filename.
3. Start Sprint 7 implementation with a **design system foundation PR** (see Section 3 and Section 8.1) before any screen work.
4. For each screen, write a focused sprint prompt that instructs Claude Code to read the relevant brief sections and ideation PNGs, then implement one screen at a time.
5. If the brief is wrong or incomplete mid-build, update this file and re-commit before resuming. Do not let Claude Code guess.

Every implementation prompt should follow the pattern in Section 8.3.

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

**First**, the user flow PDF is explicit that AirBridge has two emotional modes: *calm and trustworthy* in planning mode, *urgent and decisive* in "time to go" mode. A design that serves both without feeling like two different apps needs a tonal shift lever that is not color-alone (red-on-white is the cheap lever) and not mode-switching (forcing users to opt into dark mode). The Concourse direction uses **automatic light-to-dark progression as the trip advances** — the Home screen and planning-mode Results are paper-light, the Active Trip Screen is navy-dark by the time it's the urgent "Leave NOW" state. The user never chooses the mode; the product chooses it for them based on phase.

**Second**, Flighty's design lead Ryan Jones — whose app won the 2023 Apple Design Award and is the current category leader — has publicly cited airport departure boards as his guiding metaphor: *"Those airport boards have one line per flight, and that's a good guiding light — they've had 50 years of figuring out what's important."* AirBridge is the only app in the category that explicitly owns the *ground journey* rather than the flight. A signage-inspired aesthetic reinforces that positioning without copying Flighty's visual density. Think Singapore Changi terminal wayfinding, not 1970s JFK fluorescent board.

**Third**, iOS 26 shipped Liquid Glass as Apple's new universal design language in September 2025. Apple has stated that the option to retain pre-Liquid-Glass designs will be removed in iOS 27. AirBridge launches July 2026 on iOS 26, and the category leader (Flighty) already shipped a full Liquid Glass redesign in late 2025. The Concourse direction leans into Liquid Glass's core rule — *glass is for the navigation layer that floats above content; never for content itself* — and uses full-bleed content surfaces with translucent floating nav and toolbars.

## 1.3 What "Concourse" commits to

- **Typographic hierarchy over color hierarchy.** The hero moments (leave-by time, countdown, flight number, gate) are earned by weight and scale, not by color accents. Airport signage uses three weights and three sizes to say everything that matters.
- **One dominant accent, used sparingly.** Indigo is the brand; it is used for primary actions, active states, and nothing else. Secondary accents (teal for confidence, amber for live data, coral for urgency) each have a specific semantic meaning and appear only when that meaning applies.
- **Full-bleed content, floating chrome.** Tab bars, toolbars, and modal handles float above the content as translucent glass. Content surfaces (cards, lists, the map) extend edge-to-edge behind the glass. This is the iOS 26 pattern and it is non-negotiable.
- **Warm paper-light and concourse-navy as co-equal grounds.** The app is not "light mode with optional dark mode." It is a product that uses both grounds deliberately based on phase. Planning mode: warm paper. Active trip after the user is en route or closer: concourse navy. This is the single most distinctive move in the brief.
- **Restrained motion.** Transitions are fast and purposeful. The urgent state transition (from calm to "Leave NOW") is the one choreographed moment in the product.
- **No purple gradients on white.** Explicitly. This is the generic AI-slop trap and AirBridge will not fall into it even though the existing brand color is indigo. The brand indigo appears as solid fills on warm paper or as floating elements on concourse navy — never as a gradient bleed behind content.

## 1.4 What Concourse explicitly rejects

- Generic Tailwind default palettes (`#6366F1`, `#10B981`, `#F59E0B`, `#EF4444`). Every accent in Section 3.1 is offset from the defaults.
- Inter, SF Pro as the sole font, and any "Space Grotesk / DM Sans" choice. Typography is General Sans from Fontshare (Section 3.2).
- Skeuomorphic icons or 3D illustrations. Iconography is flat line work at two weights (Section 3.7).
- Fake map grids, placeholder tile backgrounds, or abstract "city map" visuals. The Active Trip Screen gets a real Google Maps embed, styled to match the palette (Section 7.3).
- "Hero confetti celebration" moments. AirBridge is a tool for busy travelers, not a habit-tracker. No celebration animations on trip completion.
- Colorful emoji-style icons in list rows (the red traffic light, the blue airplane, the alarm clock on v1 Settings). These read as toy, not tool. Settings uses monochrome line icons.

## 1.5 The preserve / evolve / introduce table

This is the shortest possible summary of what the brief does to Valerie's ideations.

| Element | Decision | Source |
|---|---|---|
| Indigo as primary brand color | **Preserve** | airbridge.live + all three ideations |
| Teal-green for confidence/done | **Preserve** | airbridge.live + v1/v3 |
| "LEAVE IN HH:MM:SS" as hero | **Preserve** | v1, v2, v3 My Trip |
| Progress bar with phase labels | **Preserve** | v1, v2, v3 My Trip |
| TSA Wait Live Data card | **Preserve** | v1 My Trip |
| Live Activity lock-screen preview | **Preserve** | v3 My Trip |
| Pro Trial gradient card in Settings | **Preserve** | v1 Settings |
| Recent Trips row on Home | **Preserve** | v1/v3 Home |
| Three-tab bottom nav | **Preserve** | all three |
| Translucent blurred header | **Preserve + extend** | v2, extend to tab bar |
| Indigo hue shifted warmer | **Evolve** | — |
| Warm paper background (not lavender-white) | **Evolve** | — |
| Typography: General Sans (not DM Sans) | **Evolve** | — |
| Colorful emoji-style list icons | **Evolve → monochrome** | v1/v3 Settings |
| Google Maps (real, styled) | **Evolve → real maps** | v1/v3 fake grid |
| "My Trip" (singular) → "Trips" (plural) | **Change** | all three |
| Manual "Tap to check in" pattern | **Cut** | v2 My Trip |
| Home as pure form | **Cut** | v2 Home |
| Dark mode / Concourse navy | **Introduce** | — |
| Urgency coral accent | **Introduce** | — |
| Amber live-data accent | **Introduce** | — |
| Onboarding / auth / paywall / feedback / share / trip-edit / disambig / results-planning / delete-account / empty-states / 6 Active Trip phase states | **Introduce** | 12 screens missing from all ideations |

---

# Section 2 — Navigation architecture

## 2.1 Three-tab bottom nav

The bottom tab bar has exactly three tabs in this order:

1. **Home** — dashboard + new trip entry
2. **Trips** — unified list of all non-completed trips (drafts + tracked in any phase), plus a History tab for completed trips
3. **Settings** — account, subscription, notification preferences, defaults, about

Settings absorbs account management. There is no separate profile tab. There is no top-bar gear icon *in addition to* the Settings tab — it would be redundant. The Home screen's top-right corner shows the user's avatar (initials in an indigo circle) which deep-links to the Settings tab; this is convenience, not navigation duplication.

The tab bar is a floating Liquid Glass surface: translucent background (see Section 3.8 for the CSS recipe), 0.5px hairline top border in `border-hairline` color, safe-area-inset-bottom padding. It sits above the content layer, not inside a rigid footer slot. Content scrolls *under* the tab bar. This is the iOS 26 pattern and it is mandatory.

## 2.2 The active-trip-takes-over rule

When the user has at least one trip with status `active` (any phase) or `en_route`/`at_airport`/`at_gate` within the next 24 hours, **opening the app lands them on the Trips tab with that trip's detail view already open** — not on Home. This is the Uber pattern: if there's a ride in progress, the app opens to the ride.

Specifically:

- **0 upcoming trips in next 24h:** Open to Home (dashboard).
- **1 upcoming trip in next 24h:** Open directly to that trip's Active Trip Screen (the Trips tab is selected in the tab bar; the trip detail is the primary surface).
- **2+ upcoming trips in next 24h:** Open to the Trips tab → Active list, sorted soonest-first. The user taps the one they care about.

The "+New Trip" affordance is always accessible from Home and from the Trips tab's Active list empty state. It is not a floating action button on the tab bar — that's Android's pattern, not iOS's.

## 2.3 Red-dot badging on the Trips tab

The Trips tab in the bottom nav shows a small red dot when:

- A tracked trip has had a plan-changing update the user has not yet seen (leave-by shifted 10+ min, delay, cancellation, gate change)
- A trip has entered the `time-to-go` urgent state and the user has not acknowledged it
- A completed trip is awaiting feedback (Section 6.4)

The red dot is the **only** red element in the tab bar. It uses urgency-coral `#FF4530`, not a generic red. It appears exactly 6px in diameter, positioned at the top-right corner of the Trips tab icon.

## 2.4 Top-bar rules

The top bar is screen-specific:

- **Home:** AirBridge logo + wordmark on the left, user avatar circle on the right. Translucent glass background.
- **Trips (list):** "Trips" title left, "+" icon right (opens new trip flow). Translucent glass background.
- **Trips (detail / Active Trip Screen):** "<" back chevron left, flight number center ("UA 300"), kebab/more icon right. On the Active Trip Screen in the urgent and en_route states, the top bar becomes near-invisible — translucent over the navy ground, just back chevron visible in white.
- **Settings:** "Settings" title left, no right icon. Translucent glass background.
- **All modals and sheets:** Drag-handle at top, "Cancel" or "<" on left, action button on right if applicable.

The top bar never contains tabs. Tab switching happens only at the bottom.

## 2.5 Trips tab internal structure

The Trips tab has two sub-tabs at the top of its content area: **Active** (default) and **History**. These are segmented-control-style tabs, not a new bottom nav. They appear as a pill segmented control in the top content area just below the main top bar.

- **Active tab:** shows all non-completed trips (drafts + tracked in any phase) sorted by departure date ascending. Empty state: large "+New Trip" CTA.
- **History tab:** shows all completed trips in reverse chronological order with accuracy stats. Free users see 5 most recent + a "See all with Pro" card; Pro users see unlimited. Empty state: "Your completed trips will appear here."

Drafts are visually distinguished from tracked trips (see Section 4.10.3).

## 2.6 Deep-link routing table

For implementation reference, these are the app's canonical routes:

| Route | Screen | Notes |
|---|---|---|
| `/` | Home (dashboard) | or auto-redirect per active-trip rule |
| `/home` | Home (dashboard) | explicit |
| `/trips` | Trips tab, Active sub-tab | |
| `/trips/history` | Trips tab, History sub-tab | |
| `/trips/:id` | Trip detail (Active Trip Screen) | phase-aware per Section 5 |
| `/trips/:id/edit` | Edit trip (draft or planning-phase active) | |
| `/trips/new` | New trip flow (flight entry) | |
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

This section defines the tokens. The first implementation task in Sprint 7 is a design system foundation PR that materializes all of these as Tailwind config values, CSS custom properties, and a `/design-system` preview route that renders a component gallery.

## 3.1 Color palette

All colors are defined in both light and dark mode. Light mode is the default for Home, Trips list, History, Settings, Flight Entry, Results (planning), Paywall, and Onboarding. Dark mode is the default for Active Trip Screen phases `time-to-go`, `en_route`, `at_airport`, `at_gate`, and `complete`. Planning-phase Active Trip stays in light mode. See Section 5 for the full phase-to-theme map.

### Brand

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--brand-primary` | `#4F3FD3` | `#6855E8` | Primary CTAs, active tab, active progress step, indigo logomark |
| `--brand-primary-hover` | `#3F31B8` | `#7A67F2` | Hover/tap down |
| `--brand-primary-pressed` | `#2E2391` | `#5341CD` | Active press |
| `--brand-primary-surface` | `#EEEBFA` | `#1F1A4A` | Tinted backgrounds (e.g., Pro Trial card base before gradient) |

The light indigo `#4F3FD3` is deliberately offset from Tailwind's `#6366F1` default. It has more red in the mix, slightly more saturation, and reads as *committed* rather than *default*. This is the single most important palette decision in the brief.

### Confidence

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--confidence` | `#0FB494` | `#2DD4B0` | "On Time" pills, Done checkmarks, accuracy stats, confidence percentage |
| `--confidence-surface` | `#E5FAF4` | `#0F3A30` | Tinted backgrounds for confidence rows |

Not Tailwind emerald, not generic green. A mineral teal that reads as "calibrated" rather than "positive."

### Urgency (new)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--urgency` | `#FF4530` | `#FF6B52` | "Leave NOW" hero state, time-to-go countdown inside the final 15 minutes, critical flight alerts, Trips tab red dot, Sign Out destructive action |
| `--urgency-surface` | `#FFEBE7` | `#3A0F0A` | Tinted backgrounds for urgency banners |

Warm coral-red, not emergency-red. This is the one color that exists purely to support the calm-to-urgent tonal shift. Never use `--urgency` for anything that isn't time-critical.

### Live data (new)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--live-data` | `#FFB347` | `#FFC266` | Live Activity indicators, "Updated X min ago" freshness markers, the pulse dot on live TSA data, amber pulse on the "LIVE" pill |
| `--live-data-surface` | `#FFF4E0` | `#3A2A0A` | Tinted backgrounds for live data cards |

Warm amber, reinterpreted from the signage-yellow of physical airport boards. Used exclusively to mark "this data is live and fresh right now."

### Warning (distinct from urgency)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--warning` | `#D4821A` | `#FFB347` | "Traffic added 8 min" banners, delay notices that are *not yet urgent*, Standard lane wait time when it's significantly longer than PreCheck |
| `--warning-surface` | `#FDF4E3` | `#3A2A0A` | Warning banner backgrounds |

Distinct from urgency. Warning = "heads up, plan shifted, still within buffer." Urgency = "act now." Never use warning for a state that requires immediate action.

### Grounds

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--ground` | `#F8F6F1` | `#0B1220` | The base background of the app |
| `--ground-elevated` | `#FFFFFF` | `#111A2E` | Cards, sheets, elevated surfaces |
| `--ground-raised` | `#FFFFFF` | `#1A2540` | Second-level elevation (card on top of card, modal over content) |
| `--ground-sunken` | `#F0EDE6` | `#070B14` | Inset surfaces (input fields, search bars) |

The light ground `#F8F6F1` is warm paper, not lavender-white. It reads as "premium stationery" rather than "tech SaaS." The dark ground `#0B1220` is Concourse navy — deep blue-black with enough warmth to not feel clinical.

### Text

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--text-primary` | `#0A0F1C` | `#F4F3EF` | Body text, hero numerals |
| `--text-secondary` | `#4A5166` | `#A8ADBE` | Supporting text, labels |
| `--text-tertiary` | `#8B91A3` | `#6B7186` | De-emphasized text, timestamps |
| `--text-inverse` | `#FFFFFF` | `#0A0F1C` | Text on brand-filled buttons |
| `--text-on-urgency` | `#FFFFFF` | `#FFFFFF` | Text on urgency-filled surfaces |

### Borders and dividers

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--border-hairline` | `#E8E4DA` | `#1F2940` | 0.5px borders, dividers |
| `--border-subtle` | `#D9D4C6` | `#2A3550` | 1px borders on inputs, cards |
| `--border-strong` | `#0A0F1C` | `#F4F3EF` | Focus rings, emphasized borders |

### Glass tints

See Section 3.8 for the glass recipe. The glass tint tokens are:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--glass-tint` | `rgba(248, 246, 241, 0.72)` | `rgba(11, 18, 32, 0.72)` | Floating nav/toolbar background |
| `--glass-border` | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.08)` | Hairline on glass edges |

## 3.2 Typography

**Font family:** General Sans, loaded from Fontshare (free, open-source, SIL Open Font License). Self-host the fonts in `public/fonts/` to avoid runtime CDN dependency. Download from fontshare.com/fonts/general-sans.

**Weights loaded:** 300 Light, 400 Regular, 500 Medium, 600 Semibold, 700 Bold, 800 Extra-Bold.

**Why General Sans:** It has a distinctive character that reads as intentional without being faddish, a full weight range including a genuine 800 for the urgent state, excellent legibility at both UI sizes (12–14px) and display sizes (48–120px), and a warm geometric personality that complements the "premium paper" light ground. It is not Inter, not SF Pro, not DM Sans, and not Space Grotesk — the four fonts Claude Code would otherwise default to.

**Fallback stack:** `'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Type scale

| Token | Size | Line | Weight | Usage |
|---|---|---|---|---|
| `--type-hero-xl` | 72px | 76px | 800 | "Leave NOW" urgent state, onboarding hero |
| `--type-hero` | 56px | 60px | 700 | Leave-by countdown ("4:40:53") |
| `--type-display` | 36px | 40px | 700 | Results screen leave-by time ("2:43 PM") |
| `--type-title-xl` | 28px | 34px | 700 | Page titles ("Good morning, Valerie") |
| `--type-title` | 22px | 28px | 600 | Section headers, modal titles |
| `--type-headline` | 17px | 22px | 600 | Card titles, list row primary text |
| `--type-body` | 15px | 21px | 400 | Body text, list row secondary |
| `--type-footnote` | 13px | 18px | 400 | Timestamps, labels, helper text |
| `--type-caption` | 11px | 14px | 500 | Uppercase labels ("ACCOUNT"), badges |
| `--type-tabular` | 15px | 21px | 500 | Tabular numerals for data ("9 min") |

**Tabular numerals:** enable `font-feature-settings: 'tnum' 1, 'ss01' 1;` globally on any element displaying time, wait minutes, or distances. Prevents numbers from shifting as countdowns tick. This is critical for the Active Trip Screen's hero countdown.

**Letter-spacing:** `--type-caption` uppercase labels use `letter-spacing: 0.08em`. Everything else uses the default. Never use negative letter-spacing on body text.

## 3.3 Spacing scale

Base unit is 4px. Tailwind's default scale works, but the design system foundation should alias the common values:

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

**Page horizontal padding is always 24px.** Cards inside the page are edge-to-edge relative to that 24px gutter. Do not use 16px horizontal padding — it reads as cramped on modern iPhone widths.

## 3.4 Radius scale

| Token | Value | Usage |
|---|---|---|
| `--radius-pill` | 999px | Pills, segmented controls, CTA buttons |
| `--radius-lg` | 20px | Cards, sheets, paywall modal |
| `--radius-md` | 14px | Input fields, small cards |
| `--radius-sm` | 10px | Icons, logomark, list row icons |
| `--radius-xs` | 6px | Tags, tight labels |

AirBridge's cards use `--radius-lg` (20px) — larger than the iOS 14px default. This is intentional and consistent with iOS 26's trend toward softer, more concentric geometry.

## 3.5 Shadows

Light mode shadows are soft and warm. Dark mode shadows are near-absent (depth comes from elevation differences in the ground tokens, not from cast shadows, because shadows disappear on dark backgrounds).

| Token | Light mode value | Dark mode value |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(10, 15, 28, 0.04), 0 1px 3px rgba(10, 15, 28, 0.06)` | `none` |
| `--shadow-md` | `0 4px 12px rgba(10, 15, 28, 0.06), 0 2px 4px rgba(10, 15, 28, 0.04)` | `none` |
| `--shadow-lg` | `0 16px 40px rgba(10, 15, 28, 0.08), 0 4px 12px rgba(10, 15, 28, 0.04)` | `0 0 0 1px rgba(255, 255, 255, 0.04)` |
| `--shadow-glass` | `0 8px 32px rgba(10, 15, 28, 0.08)` | `0 8px 32px rgba(0, 0, 0, 0.4)` |

Shadows are used on elevated cards and the floating tab bar. Never use shadows on input fields or on the map hero card (the map already provides contrast).

## 3.6 Motion tokens

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | 80ms | Button tap-down, immediate feedback |
| `--duration-fast` | 160ms | Tab switch, modal dismiss |
| `--duration-base` | 240ms | Page transitions, card reveal |
| `--duration-slow` | 400ms | Phase state transitions (urgent state entry) |
| `--duration-hero` | 600ms | The one big moment: calm → urgent choreographed transition |
| `--ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default ease, iOS-like |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |

**The one choreographed moment:** when the Active Trip Screen transitions from `active` (planning, calm) to `time-to-go` (urgent), the full screen performs a 600ms orchestrated shift: the ground crossfades from paper to navy, the hero countdown scales up 1.15x then settles, the urgency-coral urgency color fades in on the CTA, and the tab bar glass tint inverts. This is the single motion flourish in the app. Everywhere else, motion is fast and functional.

## 3.7 Iconography

**Library:** Phosphor Icons (`@phosphor-icons/react`). Free, open-source, has a full set including travel-specific icons (airplane-takeoff, airplane-landing, seat, map-pin, clock, etc.), and has two weights we use: Regular and Bold.

**Do NOT use:** Heroicons (too generic, too Tailwind-default), Lucide (overused in the AI-slop zone), Font Awesome (dated), colorful emoji-style icons (the red traffic light, blue airplane, alarm clock in v1/v3 Settings).

**Weights:** Phosphor Regular for inline icons (list rows, buttons, tab bar). Phosphor Bold for emphasized icons (the empty-state illustrations, the Active Trip Screen phase dot icons).

**Size scale:**

| Token | Size | Usage |
|---|---|---|
| `--icon-xs` | 14px | Inline with text |
| `--icon-sm` | 16px | List row icons, tab bar |
| `--icon-md` | 20px | Buttons, toolbar icons |
| `--icon-lg` | 24px | Section headers, hero icons |
| `--icon-xl` | 32px | Empty-state icons |
| `--icon-hero` | 48px | Onboarding, celebration moments (if any) |

**Color rule:** icons inherit `currentColor` from text. Never hardcode icon colors. The one exception is semantic status icons (confidence check = `--confidence`, urgency exclamation = `--urgency`).

## 3.8 The Capacitor Liquid Glass CSS recipe

AirBridge is a Capacitor webview, not a SwiftUI native app. We cannot use Apple's `.glassEffect()` API. Instead, we simulate Liquid Glass in CSS. This recipe is the one used across all floating chrome surfaces (tab bar, top bar, modal handles, sticky headers).

```css
.glass-surface {
  /* The tinted base color */
  background-color: var(--glass-tint);

  /* The blur: enough to be clearly glass, not so much that content becomes mush */
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);

  /* Hairline border to separate glass from content */
  border-top: 0.5px solid var(--glass-border);

  /* Shadow for elevation cue */
  box-shadow: var(--shadow-glass);
}
```

**Critical rules:**

1. **Glass is only for the navigation layer that floats above content.** Never for content itself. This is Apple's rule and it applies even in our CSS simulation. Tab bar = glass. Top bar = glass. Modal drag handle area = glass. Cards = NOT glass. Lists = NOT glass.
2. **`backdrop-filter` has CSS support issues on some Android webviews.** Since iOS is our primary target and the frontend is Capacitor, this is fine, but the fallback for Android is a solid background with 90% opacity instead of the 72% glass tint. Use `@supports` to gate the backdrop-filter.
3. **Glass surfaces need content to blur.** If the tab bar floats over an empty screen with solid color, the glass effect is invisible. This is why every screen must have full-bleed content that extends *behind* the tab bar. Do not add bottom padding on the page that matches the tab bar height — let the content scroll under. Add bottom padding on the last scrollable element of `tab-bar-height + safe-area-inset-bottom + 16px` so the last item is reachable above the glass.

```css
@supports (backdrop-filter: blur(24px)) {
  .glass-surface {
    background-color: var(--glass-tint);
    backdrop-filter: blur(24px) saturate(180%);
  }
}

@supports not (backdrop-filter: blur(24px)) {
  .glass-surface {
    background-color: var(--ground-elevated);
    /* 90% opacity fallback */
  }
}
```

## 3.9 Light vs dark mode strategy

AirBridge does not respect the OS-level dark mode preference. Theme is **determined by phase**, not by user preference. This is a deliberate choice: the calm-to-urgent tonal shift is the defining interaction of the product, and letting users override it would break the copilot feeling.

Theme application is per-screen, not global. Most screens are always light. The Active Trip Screen changes theme per phase (see Section 5.2). The theme switch happens via a CSS class on the root element of the Active Trip Screen, not via `prefers-color-scheme`.

```css
.active-trip-screen[data-phase="active"],
.active-trip-screen[data-phase="active-planning"] {
  /* light mode tokens */
}

.active-trip-screen[data-phase="time-to-go"],
.active-trip-screen[data-phase="en_route"],
.active-trip-screen[data-phase="at_airport"],
.active-trip-screen[data-phase="at_gate"],
.active-trip-screen[data-phase="complete"] {
  /* dark mode tokens */
}
```

**Future consideration:** if user research post-launch reveals strong demand for an OS-level dark mode for Home/Settings/Trips list, that can be added as a Settings preference. For v1, do not build it.

## 3.10 Tailwind config sketch

The design system foundation PR should produce a `tailwind.config.js` that extends the default theme with the tokens above. A sketch:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          pressed: 'var(--brand-primary-pressed)',
          surface: 'var(--brand-primary-surface)',
        },
        confidence: {
          DEFAULT: 'var(--confidence)',
          surface: 'var(--confidence-surface)',
        },
        urgency: {
          DEFAULT: 'var(--urgency)',
          surface: 'var(--urgency-surface)',
        },
        live: {
          DEFAULT: 'var(--live-data)',
          surface: 'var(--live-data-surface)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          surface: 'var(--warning-surface)',
        },
        ground: {
          DEFAULT: 'var(--ground)',
          elevated: 'var(--ground-elevated)',
          raised: 'var(--ground-raised)',
          sunken: 'var(--ground-sunken)',
        },
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          inverse: 'var(--text-inverse)',
        },
      },
      fontFamily: {
        sans: ['General Sans', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero-xl': ['72px', { lineHeight: '76px', fontWeight: '800' }],
        'hero': ['56px', { lineHeight: '60px', fontWeight: '700' }],
        'display': ['36px', { lineHeight: '40px', fontWeight: '700' }],
        'title-xl': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'title': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '21px', fontWeight: '400' }],
        'footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      borderRadius: {
        'sm': '10px',
        'md': '14px',
        'lg': '20px',
        'xs': '6px',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glass': 'var(--shadow-glass)',
      },
    },
  },
};
```

The foundation PR should also create a `/design-system` route that renders a component gallery for visual regression: palette swatches, type scale, buttons in all states, list rows, cards, the tab bar, the glass surfaces over sample content, light and dark mode toggles for the Active Trip Screen's phase-specific tokens.

---

# Section 4 — Per-screen specifications

Each screen has a purpose statement, layout regions, states, content rules, and explicit references to Valerie's ideations. Seventeen screens total. Five are extensions of Valerie's work; twelve are new.

## 4.1 Onboarding / first launch

**Purpose:** Zero-friction anonymous trip calculation. Deliver the aha moment before any auth ask. Duolingo-style delayed registration.

**Layout:**

- Full-bleed light ground
- Top: 80px safe-area spacing
- Hero region: 240px tall, centered, containing the AirBridge logomark (48px) and the wordmark
- Tagline: `--type-display` "Know exactly when to leave." one-line centered
- Subhead: `--type-body` "Enter a flight, get your leave-by time. No account needed." 64px below
- Spacer: flex-grow
- CTA region: primary button "Get My Leave-By Time" full-width with 24px horizontal page padding. Below it, a tiny footer row: "Free. No ads. No sign-up." in `--type-footnote` `--text-tertiary`.
- Bottom: 48px safe-area spacing

**Behavior:**

- First launch ever: this screen appears. Tapping the CTA routes to `/trips/new` (flight entry).
- Subsequent launches: this screen never appears again. The app boots to Home or auto-redirects per the active-trip rule.
- The "first launch" flag is a simple `localStorage` boolean. Clearing app data resets it.

**What it is not:** an onboarding carousel. No feature tour, no 4-screen swipe, no permission priming. Those come later at their right moments (push permission priming after first recommendation + auth, per Section 4.8).

**Claude Code source reference:** none — this screen is new. Build from this spec.

## 4.2 Flight entry (new trip)

**Purpose:** Collect flight number + date with minimum friction. Home address is asked later, on the Results screen, if not saved.

**Layout:**

- Top bar: "<" cancel left, "New Trip" title center, nothing right
- Content region with 24px horizontal padding
- Header: `--type-title-xl` "Find your leave-by time"
- Subhead: `--type-body` `--text-secondary` "Just a flight number and a date."
- 32px gap
- Flight number input: large (`--type-display` 36px), sunken background, placeholder "UA 300", airplane icon on left, auto-capitalize characters, keyboard=default, autocomplete=off
- 16px gap
- Date segmented control: three pills — "Today", "Tomorrow", "Pick a date". Selected pill = brand filled, unselected = ground-sunken background with border-hairline. Tapping "Pick a date" expands an inline iOS native date picker.
- 32px gap
- "Search Flights" primary button full-width
- Below the button: small text link "Search by route instead" (`--type-footnote` `--text-secondary`) — opens route-mode variant (origin/destination/date) as an alternate entry path for users who don't know the flight number. This is v2's contribution and worth keeping as a secondary path, not as the default.
- Bottom: safe-area padding + tab bar clearance

**Behavior:**

- Smart default: on first load, "Today" is selected. If today has a matching flight for the entered number, auto-proceed. If tomorrow has a match and today doesn't, surface a subtle "Did you mean tomorrow?" helper under the input.
- The search button is disabled until there's a valid flight number (format `[A-Z]{2,3}\s?\d{1,4}`).
- On success: route to Flight Selection screen (Section 4.3) if multiple matches, or directly to Results (Section 4.5) if exactly one.

**Claude Code source reference:**
- Reference shape and spacing: `home-v1.png` (the FIND YOUR LEAVE-BY TIME card) + `Home_screen-v2.png` (the form structure, though v2 conflates Home and Entry)
- Do not copy: the map-card header from v1 (we're not showing a map here) and the whole-screen form structure from v2 (Home should not be a pure form)

## 4.3 Flight selection / disambiguation

**Purpose:** When a flight number + date yields multiple matches (common for codeshares, multi-leg itineraries, or repeating routes), let the user pick. When there's exactly one match, this screen is skipped.

**Layout:**

- Top bar: "<" back left, "Select your flight" title center
- Content 24px padding
- Header: `--type-title` "Multiple flights match"
- Subhead: `--type-body` `--text-secondary` "Which one is yours?"
- 24px gap
- List of flight cards, each card:
  - Airline logo (24px) + airline name + flight number row
  - Route: `ORIGIN → DESTINATION` in `--type-headline`
  - Departure time + terminal
  - Status pill: "On Time" (confidence) or "Delayed" (warning) or "Cancelled" (urgency). Cancelled flights are greyed out but still visible (so users understand why their flight isn't working), not hidden.
  - Tap target: full card, tap opens Results
- Card separator: 12px gap between cards
- Edge: tap "I don't see my flight" footer link opens a help modal

**States:**

- Empty: "No flights match" with a Retry CTA that returns to Flight Entry
- Cancelled: a cancelled card is tappable but opens a dedicated "Your flight has been cancelled" screen instead of Results (Section 4.5)

**Claude Code source reference:** none — new screen. Build from spec.

## 4.4 Home (dashboard)

**Purpose:** For returning users with no active trip in the next 24 hours. A landing surface that combines "start a new trip" and "recent trips at a glance."

**Layout:**

- Top bar (glass): logo mark + wordmark left, avatar circle right (24px, initials)
- Content region with 24px horizontal padding and scrollable
- Greeting: `--type-body` `--text-secondary` "Good morning,"
- Name: `--type-title-xl` "Valerie ✈" (the ✈ emoji is acceptable here, one-off personality moment)
- 24px gap
- **Quick action card:** ground-elevated surface with `--radius-lg`, 24px internal padding
  - Label: `--type-caption` `--text-tertiary` "NEW TRIP"
  - Flight input: same pattern as Flight Entry (Section 4.2), but collapsed — single row showing "Enter flight number" placeholder with airplane icon and a right-chevron
  - Tapping the input routes to `/trips/new` full-screen Flight Entry
- 32px gap
- **Recent Trips section:**
  - Section header: `--type-caption` `--text-tertiary` "RECENT" + "See all" link right-aligned (routes to Trips/History)
  - 12px gap
  - Up to 3 most recent completed trips, each as a compact card
  - Card content per trip: airline+flight left, route center, accuracy stat right ("within 4 min" in confidence)
  - Empty state if no history: "Your completed trips will show here" (soft, one line)
- 32px gap
- **Accuracy moment (Pro only, when ≥3 completed trips):**
  - Ground-elevated card
  - Label: "AIRBRIDGE WAS WITHIN"
  - Hero number: `--type-hero` "4 min" in confidence color
  - Subtext: "on average over your last 8 trips"
  - This is the share-able moment. It is the justification for the subscription.
- Content extends fully under the tab bar; last element has `padding-bottom: calc(env(safe-area-inset-bottom) + 96px + 16px)` to clear the tab bar

**Behavior:**

- The quick action input is not a real input — tapping it routes to Flight Entry. Keeping it visually inputtable (with cursor affordance) gives a lower perceived friction.
- If the user becomes a first-time Pro user mid-session, the accuracy moment card animates in.

**Claude Code source reference:**
- Keep from `home-v1.png`: the greeting, the quick input card, the Recent Trips row, the layout rhythm
- Cut from `home-v1.png`: the fake map with location pin (that belonged on an older version, not Home; Home doesn't need a map)
- Do not use `Home_screen-v2.png`: v2 is a pure form and cannot host Recent Trips or the accuracy moment

## 4.5 Results screen (planning mode)

**Purpose:** The aha moment of the product. Immediately after flight selection, show the user their leave-by time with full segment breakdown, inline editable preferences, and a Track This Trip CTA. **This screen does not exist in any of Valerie's ideations and is the highest-priority new screen in the brief.**

**Layout (pre-address, first-time users):**

- Top bar: "<" back + "Results" title
- Content 24px padding, scrollable
- Flight header card: ground-elevated, 24px padding
  - Airline logo + "UA 300" left, `--type-caption` "TUE APR 7" right
  - Route row: `--type-display` "SFO → LAX"
  - Meta row: `--type-footnote` "Departs 5:50 PM · Terminal 2 · Gate B22"
  - On Time pill (confidence)
- 16px gap
- **Address prompt card (first time only):**
  - Label: `--type-caption` "WHERE ARE YOU LEAVING FROM?"
  - Sunken input field with pin icon, placeholder "Home address or current location"
  - Helper text: "Used to calculate drive time. Saved for next time."
  - Below: a small "Use current location" text button
  - This card disappears once an address is entered and replaces it with an editable "Home · 1600 Shattuck Ave" row
- 24px gap

**Layout (after address):**

- Flight header card (same as above)
- 16px gap
- **Hero leave-by card:** ground-elevated with brand `--brand-primary-surface` tint, 28px padding, `--radius-lg`
  - Label: `--type-caption` `--brand-primary` "LEAVE HOME BY"
  - Hero: `--type-hero` "2:43 PM" in `--brand-primary`, tabular numerals
  - Meta row: `--type-footnote` "Tue Apr 7 · 1h 03m door-to-gate"
  - Confidence pill right-aligned: "97% confident" in confidence color
- 12px gap
- **Segment timeline:** a vertical list of segments, each row showing:
  - Left: segment icon (car, bag, shield, person-walking, seat) in a 32px circle with confidence-tinted background
  - Middle: segment name + sub-label ("Drive to SFO", "42 min · Traffic clear")
  - Right: duration + end-time (`9 min · 2:52 PM`)
  - Divider line between rows
  - Segments: Leave home → Drive → Park/rideshare arrival → Terminal entry → TSA → Walk to gate → Buffer at gate
- 24px gap
- **Inline preferences row:**
  - Three compact segmented controls stacked with 12px gaps:
    - **Transport:** Drive / Rideshare / Drop-off (current = brand-filled pill)
    - **Security:** Standard / PreCheck / CLEAR / PreCheck+CLEAR / Priority
    - **Buffer:** Tight / Comfortable / Relaxed
  - Changing any preference triggers a recompute (loading state on the hero card: "Updating...")
- 24px gap
- **Action row:**
  - Primary: "Track this trip" full-width button — opens auth modal if not signed in, else creates tracked trip and routes to Active Trip Screen
  - Secondary (text link below button): "Share this plan" — opens share sheet with the share card (Section 4.16)
- Bottom padding for tab bar clearance

**Behavior:**

- Recompute on preference change is debounced 300ms
- If user is not signed in, "Track this trip" opens the auth modal (Section 4.7) inline; on successful auth, tracking completes automatically
- The confidence percentage is computed backend-side based on data freshness and should be wired from the recommendation response

**Claude Code source reference:**
- Reference the phone mockup inside `Screenshot_2026-04-08_at_16_36_22.png` (the airbridge.live hero image) — that mockup is the closest thing to a planning-mode Results screen in any of our reference material, and its general composition (flight header → hero leave-by card with segment breakdown → confidence) is the right direction
- Do not copy it literally: the "DOOR-TO-GATE" pipeline graphic is a gimmick and should be replaced with the vertical segment timeline described above

## 4.6 Auth modal (Apple + Google + phone fallback)

**Purpose:** One-tap sign-in triggered after the user's first Results screen. Modal, not a full-screen route.

**Layout:**

- Presented as a bottom sheet with `--radius-lg` top corners, pulled up 80% of screen height
- Drag handle at top (4px tall, 40px wide, center, `--border-subtle`)
- Content 32px padding
- Header: `--type-title` "Save your plan"
- Subhead: `--type-body` `--text-secondary` "Sign in to track this trip and get notified if your leave-by time changes."
- 32px gap
- **Apple Sign In button:** Apple's mandatory style — black background, white text + icon, full-width, `--radius-pill`, 52px height
- 12px gap
- **Google Sign In button:** Google's mandatory style — white background with border, black text + color Google icon, full-width, `--radius-pill`, 52px height
- 12px gap
- Divider: `--type-caption` `--text-tertiary` "OR" centered between hairlines
- 12px gap
- **Phone OTP text link:** `--type-body` `--brand-primary` "Use phone number instead" (web fallback; on iOS, this link is hidden)
- 24px gap
- Skip link: `--type-footnote` `--text-tertiary` "Skip for now — save later" (tappable, dismisses modal)
- Bottom safe-area padding

**Behavior:**

- On iOS, Apple Sign In is always the first button. Required by Apple's review guidelines.
- Successful auth closes modal, completes the tracked trip creation, and routes to the Active Trip Screen.
- Skip closes modal without saving; the trip remains in a session-local draft state.

**Claude Code source reference:** none — new screen. Apple and Google provide official button assets; use them.

## 4.7 Push permission priming modal

**Purpose:** Pre-permission priming per the user flow PDF. Appears immediately after successful auth, before the native iOS permission prompt fires.

**Layout:**

- Presented as a bottom sheet, same shape as auth modal
- 32px padding
- Illustration region: 120px tall, showing a simple line illustration of a phone with a notification bubble (custom SVG, monochrome `--brand-primary`)
- Header: `--type-title` "Never miss your leave-by time"
- Body: `--type-body` `--text-secondary` (3 lines max)
  - "AirBridge notifies you only when your plan changes."
  - "Traffic spike? Flight delay? Gate change? You'll know."
  - "No spam. We promise."
- 24px gap
- Primary button: "Turn on notifications" (triggers native iOS prompt on tap)
- 12px gap
- Secondary text link: `--type-footnote` `--text-tertiary` "Not now" (dismisses without firing native prompt; can re-ask on trip 2)

**Critical:** tapping "Not now" must **not** fire the iOS native prompt. iOS's prompt is one-shot per install — we preserve it for a second chance. Tapping "Turn on notifications" is the only trigger.

**Claude Code source reference:** none — new screen. Build from spec.

## 4.8 Active Trip Screen (all six phase states)

This is the single largest spec in the brief. See **Section 5** for the full phase state matrix. The shared scaffold is defined here; the phase-specific layouts are in Section 5.

**Shared scaffold:**

- Top bar: "<" back left, flight number + route center ("UA 300 · SFO → LAX"), "…" more icon right
- Map region: 280px tall, full-bleed (no horizontal padding), real Google Maps embed (see Section 7.3)
- Hero card: floats over the bottom edge of the map region, `--radius-lg`, glass surface
  - Left: `--type-caption` phase label ("LEAVE IN" or "IN TRANSIT" etc.) + `--type-hero` countdown or status in `--brand-primary`
  - Right: flight number + route + status pill
- Progress bar: horizontal, four dots connected by a line, labels below each dot
  - Dots: "At Home" → "In Transit" → "At Airport" → "At Gate"
  - Completed dots: confidence filled with check icon
  - Current dot: brand filled, larger, pulsing animation
  - Future dots: hairline outline, empty
- Content region (scrollable): phase-specific content, 24px padding
- Bottom action row: phase-specific primary buttons (Book Uber, Navigate, Refresh; or phase-specific actions like "Add to Calendar")
- Tab bar: floating glass (same as all screens)

**The theme rule:** phases `active` and `active-planning` use light mode. Phases `time-to-go`, `en_route`, `at_airport`, `at_gate`, `complete` use dark mode (Concourse navy). The transition happens when the phase state changes. See Section 5.2.

**Claude Code source reference:**
- Reference shapes and composition: `my_trip_screen-v1.png`, `my_trip_screenn-v1.png`, `my_trip_screen-v3.png`, `my_trip_screenn-v3.png` — the hero card, progress bar, and segment list patterns
- Do not use: `my_trip_screen-v2.png` and `my_trip_screenn-v2.png` (the "Tap to check in" pattern is explicitly cut per Sprint 6 B6.8)

## 4.9 Trips tab (unified Active + History)

**Purpose:** The unified list page for all trips, with Active and History sub-tabs.

**Layout:**

- Top bar: "Trips" title left, "+" icon right (routes to `/trips/new`). Glass surface.
- 16px gap
- Segmented control: "Active" / "History" pills, centered, horizontally padded. 12px gap below.
- **Active sub-tab content:**
  - Empty state: illustration (Phosphor BoldAirplane 48px), `--type-title` "No trips yet", `--type-body` `--text-secondary` "Your tracked trips will appear here. Let's plan one.", full-width primary button "+ New Trip"
  - With trips: vertical list of trip cards, sorted by departure ascending
  - Each trip card (see Section 4.10.3 for draft vs tracked distinction)
- **History sub-tab content:**
  - Empty state: "Your completed trips will appear here"
  - With trips: reverse-chronological list, each trip compact card with date, route, accuracy stat
  - Free users: 5 most recent + "See all with Pro" upgrade card
- Bottom padding for tab bar clearance

## 4.10 Trip card (Active list)

**Purpose:** The card representation of a single trip in the Trips tab Active list.

### 4.10.1 Tracked trip card (in planning phase)

- Ground-elevated card, 20px padding, `--radius-lg`, `--shadow-sm`
- Top row: airline + flight number left, status pill right ("Tracked" in brand)
- Middle row: `--type-headline` route "SFO → LAX"
- Bottom row: `--type-footnote` "Tue Apr 7 · Leave by 2:43 PM · 1h 23m"
- Right side: chevron indicating tap target
- Tap: opens Active Trip Screen for that trip

### 4.10.2 Tracked trip card (in en_route or later phase)

- Same card shape
- Status pill: "In Transit" or "At Airport" or "At Gate" in brand
- Bottom row replaced with a mini countdown: "Boarding in 42 min" or similar
- Pulsing brand dot on the left edge to indicate live

### 4.10.3 Draft trip card

- Same card shape but visually **deprioritized**: border-hairline outline instead of shadow, ground (not ground-elevated) background
- Status pill: "Draft" in `--text-tertiary`, unfilled
- Bottom row: "Not yet tracked — tap to continue" in `--text-secondary`
- Tap: opens the Flight Entry flow in edit mode pre-filled with the draft values

The visual difference between drafts and tracked trips must be immediate. A user scanning their Active list should be able to tell at a glance which trips are "live" and which are "unfinished."

## 4.11 Trip editing flow

**Purpose:** Allow editing of draft trips and planning-phase tracked trips. Tracked trips in `en_route` or later phases are locked per Sprint 7 F7.2 (the "untrack to edit" pattern).

**Layout:**

- Reuses the Flight Entry → Results flow, with two differences:
  - Top bar title: "Edit Trip"
  - Primary CTA on Results screen: "Update Trip" instead of "Track this trip"
- For locked tracked trips (en_route+), the Active Trip Screen's "…" more menu shows an "Untrack to edit" option
- Tapping "Untrack to edit" shows a confirmation modal: "This returns your trip to draft so you can edit it. You won't lose a trial trip." → "Untrack" (destructive, urgency color) / "Cancel"
- On confirm, POST `/v1/trips/{id}/untrack`, route back to `/trips` with the now-draft trip highlighted

**Claude Code source reference:** none — new flow. Build from spec.

## 4.12 Paywall modal

**Purpose:** Appears on trip 4+ for non-subscribed users, on the Results screen specifically (not on Home, not on Settings). Never blocks the recommendation.

**Layout:**

- Presented as a full-screen modal over the dimmed Results screen
- Background: ground-raised with radial gradient tint in `--brand-primary-surface`
- Top: "Cancel" text button left, 24px from safe area
- Content 32px padding
- Illustration: 120px tall, Phosphor BoldAirplane with motion lines (custom)
- Header: `--type-title-xl` "Your 3 free Pro trips are up"
- Personal stat card (if available): ground-elevated `--radius-lg`, 20px padding
  - Label: `--type-caption` "YOUR ACCURACY SO FAR"
  - Hero: `--type-hero` "within 4 min" in confidence
  - Subtext: "on your last 3 trips"
- 24px gap
- **What you'll lose** section: `--type-caption` "WHAT YOU'LL LOSE"
  - List of 5 feature rows, each with X icon on left (in `--text-tertiary`):
    - Gate change alerts
    - SMS "Time to go!" escalation
    - One-tap rideshare deep links
    - Unlimited trip history
    - Personal accuracy stats
- 24px gap
- **Pricing toggle:** two large radio cards in a row:
  - Monthly: "$4.99/mo"
  - Annual: "$39.99/yr" with "SAVE 33%" pill in confidence color
  - Selected card has brand border + brand tint background
  - Annual selected by default
- 24px gap
- Primary button: "Keep the full copilot" — opens Stripe Checkout in Safari (`Browser.open()`)
- 12px gap
- Secondary text link: `--type-footnote` "Continue with free" (dismisses modal, user sees Results with free-tier features only)

**Post-subscription aftercare (separate screen):**

- After successful Stripe Checkout return, the user lands on a confirmation screen (not the modal)
- Header: `--type-title-xl` "Welcome to Pro"
- Body: 3 cards showing what they just unlocked (Gate change alerts, SMS escalation, Rideshare deep links)
- Primary button: "Back to my trip"
- This is the aftercare moment the Strava research called out — it re-anchors value and measurably reduces churn

**Claude Code source reference:** none — new screen. Build from spec.

## 4.13 Post-trip feedback

**Purpose:** Collect accuracy data from the user after a trip completes. Feeds the data flywheel. Appears on app open when there's a completed trip without feedback.

**Layout:**

- Presented as a full-screen modal
- Top: "×" dismiss left
- Content 32px padding
- Header: `--type-title` "How was your trip to HNL?"
- Subhead: `--type-body` `--text-secondary` "Three quick questions. We use your answers to get more accurate."
- 32px gap
- **Question 1:** "Did you follow our leave-by time?"
  - Two large buttons: "Yes, left on time" / "No, left earlier/later"
- 24px gap
- **Question 2:** "How many minutes before boarding did you arrive at your gate?"
  - Horizontal stepper: − [30 min] +
  - Default to 30
- 24px gap
- **Question 3 (optional):** "How long was the TSA line?"
  - Horizontal stepper: − [15 min] +
  - "Skip" text link below
- 32px gap
- Primary button: "Submit"

**On submit:**

- Thank-you screen: `--type-title-xl` "Thanks, Valerie"
- Personal stat update: "You've helped AirBridge get more accurate for everyone who flies through SFO Terminal 2."
- Secondary stat: "AirBridge was within 4 min of your actual arrival."
- CTA: "Back to app"

**Claude Code source reference:** none — new screen.

## 4.14 Settings

**Purpose:** Account management, subscription status, notification preferences, default preferences, about.

**Layout:**

- Top bar: logomark + "Settings" title left
- Content 24px padding, scrollable
- **Account section:**
  - Section header: `--type-caption` "ACCOUNT"
  - Row 1: Avatar (40px indigo circle with initials) + "Valerie Braids" + "valerie@berkeley.edu · Apple ID" + chevron
  - Row 2: "Sign Out" in `--urgency` color (destructive)
- **Subscription section:**
  - Pro Trial gradient card (keep from v1 Settings): ground-elevated with brand gradient overlay
    - Label: `--type-caption` "AIRBRIDGE PRO TRIAL"
    - Hero: `--type-title-xl` "2 of 3 free trips used"
    - Subtext: "Unlock unlimited after your trial"
    - Progress bar (filled 2/3 in white on brand ground)
    - Meta: "1 trip remaining · Trial ends in 4 days"
  - For Pro subscribers, replace this card with a "Manage Subscription" row showing plan + renewal date + "Manage" chevron that opens Stripe Customer Portal
- **Notifications section:**
  - Section header: `--type-caption` "NOTIFICATIONS"
  - 5 toggle rows, monochrome icons (not colorful):
    1. **Leave-by time changes** — "Alert when your window shifts" — always on for Pro, on by default for Free
    2. **Flight delays & gate changes** — "Live flight status updates"
    3. **"Time to go!" reminder** — "Push at your leave-by time"
    4. **Morning email briefing** — "6 hours before departure"
    5. **SMS escalation (Pro)** — "Text if you miss the Time to go push" — Pro-gated, shows lock icon if free user
  - Pro-gated rows show a "Pro" pill next to the label; tapping the row when user is free opens a mini paywall
- **Default preferences section:**
  - Section header: `--type-caption` "DEFAULTS"
  - 4 row cards with monochrome icons and chevrons:
    1. Transport — "Rideshare" (navigation detail)
    2. Security Access — "CLEAR + PreCheck" (navigation detail)
    3. Buffer Preference — "Comfortable (30 min)"
    4. Navigation App — "Apple Maps"
    5. Preferred Rideshare — "Uber"
- **About section:**
  - Send Feedback — opens mail composer
  - Privacy Policy — opens in-app browser to airbridge.live/privacy
  - Terms — opens in-app browser
  - Version footer: "AirBridge v1.0.0 · airbridge.live"
- **Danger zone:**
  - Delete Account — `--urgency` text link, opens confirmation (Section 4.15)
- Bottom tab-bar clearance

**What changes from Valerie's ideations:**

- All colorful emoji-style icons (red traffic light, blue airplane crossed, alarm clock) → **monochrome line icons in Phosphor Regular**, `--text-secondary` color
- Add the morning email briefing row (missing from all versions)
- Add the SMS escalation row with Pro gating (missing from all versions)
- Split Settings into clear sections with `--type-caption` headers, not just visual cards

**Claude Code source reference:**
- Keep the structure from `Settings_screen-v1.png` and `Settings_screenn-v1.png`: the Account block, Pro Trial card, Notifications block, Default Preferences block, About block
- Replace icons per monochrome rule above
- Use the minimal-chrome feel of `Settings_screen-v2.png` for the About and Preferences blocks (less visual weight per row)

## 4.15 Delete account confirmation

**Purpose:** Required for App Store compliance. Must be reachable from Settings and must actually delete.

**Layout:**

- Presented as a full-screen confirmation, not a modal (serious enough to warrant its own route)
- Top bar: "<" back + "Delete Account" title
- Content 32px padding
- Warning icon: 48px Phosphor WarningBold in `--urgency`
- Header: `--type-title-xl` "This can't be undone"
- Body: `--type-body`
  - "Deleting your account will permanently remove:"
  - Bulleted list: "Your trip history", "Your saved preferences and home address", "Your subscription (you'll need to cancel billing separately)", "All AirBridge data associated with your account"
- 24px gap
- Text confirmation: "Type DELETE to confirm" input field
- 24px gap
- Primary button (destructive): "Delete my account permanently" — disabled until input matches
- 12px gap
- Secondary text link: "Cancel"

**On confirm:** call `DELETE /v1/users/me`, sign out, route to Onboarding.

## 4.16 Share card

**Purpose:** The word-of-mouth vector. A shareable image of the leave-by recommendation that users text to the person driving them or coordinating their schedule.

**Layout (the image, not a screen):**

- 1080 × 1920 portrait canvas (Instagram Story aspect, works for iMessage and SMS)
- Ground: warm paper light, full-bleed
- Top padding: 160px
- AirBridge logomark + wordmark centered, 64px tall
- 80px gap
- `--type-caption` "LEAVE HOME BY"
- 12px gap
- `--type-hero-xl` "2:43 PM" in `--brand-primary`
- 24px gap
- `--type-display` "to catch UA 300 to HNL"
- 48px gap
- Route visualization: SFO → HNL with airplane icon
- 80px gap
- Confidence stat if available: "AirBridge is within 4 min on average"
- Bottom padding: 160px
- Footer: "airbridge.live" in `--type-footnote`

**Generation:** Use the native share sheet. Render the card as an SVG or canvas element, convert to PNG, pass to `navigator.share()` or Capacitor's Share plugin.

## 4.17 Empty states inventory

Each screen's empty state matters for the first-week user experience. Centralized here for Claude Code's reference:

| Screen | Empty state text | CTA |
|---|---|---|
| Home Recent Trips | "Your completed trips will show here" | (none) |
| Trips Active | "No trips yet. Your tracked trips will appear here." | "+ New Trip" |
| Trips History | "Your completed trips will appear here." | (none) |
| Settings (new user, no subscription) | (shows Pro Trial card with 0/3 used) | (none) |
| Active Trip Screen (first tracked trip) | No empty state — screen only exists when trip exists | (none) |

---

# Section 5 — Active Trip Screen phase state matrix

This is the single most complex screen in the app. It has six states. The backend polling agent owns the state (see REVISED_SPRINT_PLAN.md B6.8). The frontend renders the current state and transitions smoothly between them.

## 5.1 The six states

| Phase | Triggered when | Theme |
|---|---|---|
| `active` | Trip is tracked but user hasn't hit time-to-go yet | Light |
| `time-to-go` | Current time is within 15 min of leave-by time OR past it | **Dark** |
| `en_route` | Polling agent advances state (user tapped rideshare, or estimated_depart time has passed) | Dark |
| `at_airport` | Polling agent advances state (`arrive_airport_at` time has passed) | Dark |
| `at_gate` | Polling agent advances state (`clear_security_at` time has passed) | Dark |
| `complete` | Polling agent advances state (30 min past departure OR cancellation) | Dark |

## 5.2 Theme transitions

The transition from `active` to `time-to-go` is the one choreographed motion moment in the app. It happens once per trip, right when urgency matters most. Section 3.6 defines the timing (`--duration-hero` 600ms).

Transitions between later states (`en_route` → `at_airport` → `at_gate` → `complete`) are simpler: 240ms crossfade of content, no theme change (all dark).

## 5.3 State-by-state layout matrix

### 5.3.1 `active` (planning phase, light)

- **Theme:** light
- **Top bar:** glass, flight number center
- **Map hero:** full-bleed Google Maps showing home → airport route, dashed indigo polyline, two pins
- **Hero card (floating over map):** `--type-caption` "LEAVE IN" + `--type-hero` countdown ("2h 14m" — note: for states >24h away, show date instead). Flight number/route/On Time pill on right.
- **Progress bar:** At Home (current, pulsing) → In Transit → At Airport → At Gate
- **Content section:**
  - Segment timeline (same as Results screen)
  - TSA Wait Live Data card (from v1 My Trip)
    - Header: `--type-caption` "TSA WAIT · LIVE"
    - Primary stat: "9 min PreCheck lane" in `--confidence`, "Shorter than usual"
    - Secondary stat: "34 min Standard lane" in `--warning`
    - Footer: "Typical range today: 7–18 min · Updated 2 min ago"
    - Small amber `--live-data` pulse dot next to "LIVE"
  - Live Activity lock-screen preview (from v3 My Trip, **one-time only for Pro Trip 1–3**):
    - Header: `--type-caption` "LIVE ACTIVITY · LOCK SCREEN"
    - Mock card showing how the lock screen will look during the trip
    - Dismiss "×" in corner — once dismissed, never shown again for this trip
- **Action row:**
  - Primary: "Book Uber to Terminal 2" (or Lyft per user preference) — opens rideshare deep link with pre-filled origin/destination
  - Secondary: "Start Navigation" — opens Apple Maps / Google Maps / Waze per preference
  - Tertiary text link: "Refresh" — forces recompute

### 5.3.2 `time-to-go` (urgent, dark)

This is the one screen in the app where the full calm-to-urgent transition fires.

- **Theme:** dark (Concourse navy `#0B1220`)
- **Top bar:** near-invisible, just back chevron in white
- **Map hero:** same map, but overlaid with a 40% black tint to push it into the background
- **Hero card:** elevated, much larger
  - `--type-caption` `--urgency` "TIME TO GO" (pulsing)
  - `--type-hero-xl` "LEAVE NOW" in `--urgency` (`#FF4530`)
  - Subtext: `--type-body` `--text-primary` (now inverse on dark) "Your window closes in 3 min"
- **Progress bar:** still visible, At Home dot now urgency-colored instead of brand
- **Content section (minimal):**
  - Single reassurance card: "Traffic: clear · Drive time unchanged from plan"
  - No TSA card in this state — the decision is already made, the user needs to move
- **Action row:**
  - Primary: "Book Uber NOW" — urgency-colored button, full-width, 56px tall (larger than standard)
  - Secondary: "Start Navigation"
- **SMS escalation (Pro):** if user hasn't acknowledged the screen within 5 min, backend fires SMS (per REVISED_SPRINT_PLAN.md B6.4)

**The CSS glass simulation concern:** the calm-to-dark transition is exactly where CSS `backdrop-filter` will feel most compromised compared to real SwiftUI Liquid Glass. The navy ground + glass tab bar + map tint + hero card is a lot of layered translucency, and Capacitor's webview blur is not as performant as native. Flagging this now so Claude Code doesn't over-engineer: accept the compromise for v1, ship it, and revisit with a SwiftUI native implementation of just this one state in a post-launch sprint if the visual quality bugs you.

### 5.3.3 `en_route` (dark)

- **Theme:** dark
- **Top bar:** translucent glass over map
- **Map hero:** Google Maps tracking live (Tier 1 for v1 — static route, no live dot)
- **Hero card:**
  - `--type-caption` "IN TRANSIT"
  - `--type-hero` "Drive: ~34 min to Terminal 2"
  - Flight info on right
- **Progress bar:** At Home complete (check), In Transit current (pulsing brand), At Airport + At Gate future
- **Content section:**
  - Upcoming segments only (no past ones): TSA → Walk to Gate → Board
  - Warning banner if traffic has shifted: "Traffic added 8 min. New leave-by was 2:43 PM. Still within your buffer." (`--warning` tinted)
- **Action row:**
  - Primary: "Open Maps" (navigation)
  - Secondary: "Flight status"

### 5.3.4 `at_airport` (dark)

- **Theme:** dark
- **Top bar:** same glass
- **Map hero:** replaced with a terminal-level airport map OR a simple stylized terminal diagram (defer the real airport map to v1.1 — for v1, show the Google Maps terminal area with a pin on Terminal 2)
- **Hero card:**
  - `--type-caption` "AT AIRPORT"
  - `--type-headline` "Head to TSA → Gate B22"
- **Progress bar:** At Home ✓, In Transit ✓, At Airport current, At Gate future
- **Content section:**
  - TSA estimate (live): "PreCheck lane: 9 min · Shorter than usual"
  - Gate walk time: "Gate B22 is 7 min walk · Turn right after security, follow Terminal 2 signs"
  - (The v3 running-icon callout is kept here)
- **Action row:**
  - Primary: "Navigate in terminal" (deep link to Apple Maps indoor maps if available for this airport) — or hidden for airports without indoor maps
  - Secondary: "Flight status"

### 5.3.5 `at_gate` (dark)

- **Theme:** dark
- **Top bar:** same glass
- **Map hero:** replaced with a flight info card (airline logo, seat, boarding group, flight duration)
- **Hero card:**
  - `--type-caption` "YOU'RE SET"
  - `--type-hero` "Boarding at 5:20 PM"
  - Time until boarding countdown
- **Progress bar:** At Home ✓, In Transit ✓, At Airport ✓, At Gate current
- **Content section:**
  - Flight info card: gate, seat, boarding group
  - Flight status updates only
  - No action recommendations
- **Action row:**
  - Tertiary: "Flight status refresh"
  - No primary — user is done being guided

### 5.3.6 `complete` (dark → feedback)

- **Theme:** dark
- **Hero card:** "YOU ARRIVED" + personal accuracy stat "AirBridge was within 4 min"
- **Progress bar:** all 4 dots complete
- **Content section:**
  - Feedback prompt card: "How was your trip?" with "Rate this trip" CTA
  - This leads to the feedback flow (Section 4.13)
- **Action row:**
  - Primary: "Rate this trip"
  - Secondary: "Back to Home"

## 5.4 Transition rules between states

| From | To | Trigger | Animation |
|---|---|---|---|
| `active` | `time-to-go` | `now >= leave_by - 15min` | The choreographed 600ms transition (ground crossfade + hero scale + color shift) |
| `time-to-go` | `en_route` | User tapped rideshare deep link OR 3 min after "Time to go" push tap OR `now >= estimated_depart` | 240ms content crossfade, no theme change (both dark) |
| `en_route` | `at_airport` | `now >= arrive_airport_at` | 240ms content crossfade |
| `at_airport` | `at_gate` | `now >= clear_security_at` | 240ms content crossfade |
| `at_gate` | `complete` | `now >= departure_at + 30min` OR flight cancelled | 240ms content crossfade + feedback card reveal |
| any | `complete` | Flight cancelled | 240ms fade to completion screen with cancellation messaging |

**State ownership:** the backend polling agent is authoritative (per REVISED_SPRINT_PLAN.md B6.8). The frontend polls `/v1/trips/{id}` every 60 seconds while the Active Trip Screen is visible and re-renders based on the returned `trip_status` field. The frontend never changes state locally — it only reflects what the backend says.

---

# Section 6 — Paywall, feedback, and Pro gating

## 6.1 The paywall fires exactly once per user per trip

The paywall modal (Section 4.12) appears only when:

- User is signed in
- User has completed 3 Pro trips
- User is not currently subscribed
- User is on the Results screen of trip 4+

It does not appear on Home, Settings, or the Active Trip Screen. This is deliberate — the paywall respects user context and doesn't interrupt active navigation.

Once dismissed ("Continue with free"), the paywall does not re-fire for the same session. It re-fires on the next trip (trip 5, 6, etc.) in the same way.

## 6.2 Pro feature gating rules

For free users (after trial is exhausted):

| Feature | Free | Pro |
|---|---|---|
| Core recommendation | ✓ | ✓ |
| Leave-by shift push notifications | ✓ | ✓ |
| Flight delay/cancellation push | ✓ | ✓ |
| Morning-of email briefing | ✓ | ✓ |
| "Time to go!" push | ✓ | ✓ |
| **Gate change push alerts** | ✗ | ✓ |
| **SMS "Time to go!" escalation** | ✗ | ✓ |
| **One-tap rideshare deep links** | ✗ | ✓ |
| **Personal accuracy stats** | ✗ | ✓ |
| **Unlimited trip history** | 5 most recent | ✓ |
| **Post-trip accuracy receipt** | ✗ | ✓ |

## 6.3 Visual gating patterns

- **Disabled Pro features in the UI:** visible but grayed out, with a small "Pro" pill. Tapping opens a mini paywall specific to that feature ("Unlock gate change alerts for $4.99/mo").
- **Hidden Pro features:** none. Everything is visible. Transparency builds trust.
- **Rideshare deep link button on Results / Active Trip:** for free users, shows "Book Uber" button in `--text-tertiary` with a lock icon. Tap → mini paywall.

## 6.4 Post-conversion aftercare

Immediately after successful Stripe Checkout return:

1. User lands on the confirmation screen (Section 4.12 "Post-subscription aftercare")
2. A celebratory but restrained moment (no confetti) — the welcome screen with 3 unlocked features
3. The Active Trip Screen they were on previously is now showing all Pro affordances
4. Over the next 48 hours, small contextual tooltips appear on the first use of each Pro feature ("Gate change alerts are now on — we'll notify you instantly")

The aftercare loop is what converts first-trial subscribers into long-term retention. Per the RevenueCat research, Strava measurably increased LTV by re-showing value post-subscription. Do not skip this.

---

# Section 7 — Capacitor implementation notes

## 7.1 Webview constraints

AirBridge is a React + Vite web app wrapped in Capacitor 8. The webview is WKWebView on iOS and Chrome on Android. This has practical implications the brief assumes Claude Code understands:

- **No SwiftUI APIs.** We cannot use `.glassEffect()`, Live Activities (handled separately via the Capacitor plugin Rab has already built), SF Symbols, or native haptics. We simulate Liquid Glass in CSS (Section 3.8), use Phosphor Icons for iconography (Section 3.7), and use `@capacitor/haptics` for tap feedback.
- **Fonts must be self-hosted.** General Sans loaded from a CDN at runtime will cause a FOUT. Bundle the woff2 files in `public/fonts/` and load with `font-display: block` (not swap) since the hero countdown depends on a specific font for tabular numerals.
- **Safe areas.** Use `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` throughout. The top bar respects `top` inset; the tab bar respects `bottom` inset; the content respects both.
- **Scroll performance.** Do not use `overflow-x: auto` on horizontally scrolling segments unless absolutely necessary. Fixed lists with CSS `contain: content` perform better in WKWebView.
- **`position: fixed`.** Works in WKWebView but has edge cases with keyboard open states. The tab bar should use `position: sticky; bottom: 0` on its scroll container, not `position: fixed`, to avoid keyboard overlap bugs.

## 7.2 Where CSS glass simulation will feel compromised

Honest self-assessment of where the CSS Liquid Glass recipe will feel second-class compared to real native:

1. **The `time-to-go` urgent state (Section 5.3.2)** — this is the biggest one. The layered translucency (dark ground → tinted map → glass hero card → glass tab bar) is exactly where native refractive light and motion-responsive highlights would shine. CSS can't do those. The recipe still looks good — 24px blur + saturation pump + hairline borders — but it reads as "glassy" rather than "alive."
2. **The hero card float on the Active Trip Screen** — real Liquid Glass would let the card subtly lens and warp the map beneath it. CSS blur just softens. The composition still works but it's flatter.
3. **The modal sheet drag handles** — native sheets have a physicality that CSS sheets can't match.

For all three, the brief's recommendation is: **accept the compromise for v1 launch, ship, and revisit as a post-launch sprint** if the visual quality is the thing holding back user perception. The Flighty team shipped a Capacitor-like approach in their early years and the product still won Apple Design Awards. Concept > execution, at least for v1.

**Where CSS glass will feel fine:**

- The tab bar (glass over moving content is exactly what CSS does well)
- The top bars on Home, Trips, Settings (static content underneath)
- Modal sheets over static content (Paywall, Auth, Permission)
- The Active Trip Screen in the `active` (light) planning phase (no urgency required)

## 7.3 Google Maps Tier 1 integration

Per the previous conversation, we're shipping Tier 1 (static map with styled route polyline, no live location dot) for v1. Live user tracking is a v1.1 Pro feature.

**Implementation:**

- Package: `@vis.gl/react-google-maps` (the modern React wrapper for Google Maps JS SDK)
- API key: browser-restricted, stored in Vite env var `VITE_GOOGLE_MAPS_API_KEY`, domain-locked to airbridge.live + capacitor://localhost
- Style: custom JSON map style override that mutes POIs, softens labels, hides transit icons, and tints water and roads to match the palette. Use the [Google Maps Styling Wizard](https://mapstyle.withgoogle.com/) and save the JSON to `src/lib/mapStyle.json`
- Marker 1: home address, teal `--confidence` pin
- Marker 2: airport terminal, filled `--brand-primary` pin
- Route polyline: dashed, `--brand-primary`, 4px width
- Camera: auto-fit to bounds containing both markers with 60px padding
- On the Active Trip Screen, the map is non-interactive (drag/zoom disabled) — it's a hero, not a tool

**Cost estimate:** Google Maps JS SDK is $7 per 1000 map loads. Google's $200/month free credit covers 28,571 loads/month. At ~3 map loads per tracked trip per user, that's ~9,500 trips/month free. Non-issue for v1.

**What to do in the `at_airport` and `at_gate` phases:** the Google Maps terminal-level view isn't useful (gate-level detail isn't provided). Replace the map hero with a different hero — for `at_airport`, a stylized terminal diagram (or just no map, replaced with the hero card expanded); for `at_gate`, a flight info card with seat/boarding group/etc.

## 7.4 Dark mode application

Dark mode is applied per-screen, not globally, and is tied to Active Trip Screen phase state (Section 3.9, Section 5.2). The implementation pattern:

```tsx
// In ActiveTripScreen.tsx
const theme = ['active', 'active-planning'].includes(phase) ? 'light' : 'dark';

return (
  <div data-theme={theme} className="active-trip-screen">
    {/* content */}
  </div>
);
```

```css
/* In design-system.css */
[data-theme="light"] {
  --ground: #F8F6F1;
  --text-primary: #0A0F1C;
  /* ... all light tokens */
}

[data-theme="dark"] {
  --ground: #0B1220;
  --text-primary: #F4F3EF;
  /* ... all dark tokens */
}
```

The transition from light to dark on phase change uses CSS transitions on the custom properties themselves (supported in modern WKWebView) with `transition: background-color var(--duration-hero) var(--ease-standard)`.

## 7.5 Haptic feedback

Use `@capacitor/haptics` for the following moments:

- Light impact on tab switch
- Light impact on segmented control change
- Medium impact on "Track this trip" success
- Heavy impact on the `active` → `time-to-go` transition (the one choreographed moment)
- Light impact on push notification tap (if opening app from notification)

Do not overuse haptics. One rule: if the user wouldn't physically react to feeling the haptic, don't send it.

---

# Section 8 — Handoff guidance for Claude Code

## 8.1 Sprint 7 implementation order

Do not start with screen work. Start with the foundation. Recommended order:

1. **Design system foundation PR** — Tailwind config, CSS custom properties, font loading, glass utility classes, icon library install, `/design-system` preview route. No screens yet. Verification: `/design-system` renders a component gallery showing palette swatches, type scale, glass surfaces, and the theme toggle.
2. **Shared layout components** — Top bar, Tab bar, Card, ListRow, Button variants, SegmentedControl, Sheet (modal base), Input, StatusPill. Each component goes in `src/components/` and is rendered in `/design-system`.
3. **Navigation scaffolding** — React Router routes per Section 2.6. Empty shells for all 17 screens that just render the top bar + tab bar + screen name. This gets the nav architecture working before any content is built.
4. **Screen builds in this order** (priority and dependency-ordered):
   1. Home (Section 4.4) — most frequently seen
   2. Flight Entry (Section 4.2) — required for onboarding
   3. Results, planning mode (Section 4.5) — the aha moment
   4. Auth modal (Section 4.6) — required to complete the first flow
   5. Push permission priming (Section 4.7) — required immediately after auth
   6. Active Trip Screen, `active` state (Section 5.3.1) — most complex screen, start with the light planning state
   7. Active Trip Screen, `time-to-go` state (Section 5.3.2) — the choreographed state
   8. Active Trip Screen, remaining dark states (5.3.3, 5.3.4, 5.3.5, 5.3.6)
   9. Trips tab Active list (Section 4.9, 4.10)
   10. Trips tab History list (Section 4.9)
   11. Trip card variants (Section 4.10.1–3)
   12. Paywall modal (Section 4.12)
   13. Post-trip feedback (Section 4.13)
   14. Settings (Section 4.14)
   15. Flight selection / disambiguation (Section 4.3)
   16. Onboarding (Section 4.1)
   17. Delete account (Section 4.15)
   18. Share card generator (Section 4.16)

This order lets Rab see working screens early (1–6 ship the "anonymous first trip → sign in → track → active" happy path, which is the most tested flow), then fills in adjacent screens, then polishes edge cases.

## 8.2 The cite-by-section prompt template

Every Sprint 7 implementation prompt should follow this structure:

```
Task: Implement the Home screen.

Read these files first:
- AIRBRIDGE_DESIGN_BRIEF.md, Sections 2 (Navigation), 3 (Design System), 4.4 (Home dashboard), 4.17 (Empty states), 8.3 (Implementation rules)
- docs/design-ideations/home-v1.png (visual reference)
- docs/design-ideations/home_screen-v3.png (visual reference)
- CLAUDE.md (existing patterns)

Implement: src/pages/Home.tsx using the design system components from src/components/. Do not modify other pages.

Constraints per the brief:
- Use the three-tab nav already built in Section 2
- Home is the dashboard variant (not the "takeover" variant — that comes when Active Trip exists)
- Quick action card routes to /trips/new, does not contain a real input
- Monochrome icons only (no colored emoji-style icons)
- Recent Trips row uses ListRow component with accuracy stat on right

Verification:
- Run dev server, navigate to /, confirm greeting + quick card + recent trips render
- Confirm tab bar glass shows through when scrolling
- Confirm empty state when no recent trips
- Lighthouse performance check
- Commit when green

Do not re-derive: palette colors, type scale, spacing, card shape, tab bar location. The brief settles all of these.
```

## 8.3 Implementation rules Claude Code must follow

These are non-negotiable rules for any screen implementation:

1. **Always read the brief first.** Before writing any code for a screen, Claude Code reads the relevant brief section and the referenced ideation PNGs. Never improvise layout decisions.
2. **Use design system components, not custom ones.** If a screen needs a button, use `<Button>` from the design system. Do not re-style a button inline.
3. **Use design tokens, not hex values.** `text-ink-primary` not `text-[#0A0F1C]`. `bg-brand` not `bg-[#4F3FD3]`.
4. **Never use `Inter`, `Roboto`, `SF Pro`, `DM Sans`, or `Space Grotesk`.** General Sans only. If the font fails to load, the fallback stack handles it.
5. **Never use colorful emoji icons in list rows.** Monochrome Phosphor Icons only, inheriting `currentColor`.
6. **Never use Tailwind default colors for accent.** Use the brand tokens.
7. **Always respect safe-area insets.** Top bar, tab bar, modal bottoms, onboarding hero.
8. **Glass surfaces only for the nav layer.** Never apply `backdrop-filter` to content cards, list rows, or the hero card on the Active Trip Screen. Cards use solid `ground-elevated` with shadow.
9. **Tabular numerals for all time/data displays.** `font-feature-settings: 'tnum' 1;` on every number that can change.
10. **Real Google Maps, not fake grids.** The Active Trip Screen map must be a real `<Map>` component styled per Section 7.3. Never ship the fake grid placeholder from the ideations.
11. **Do not implement the manual "Tap to check in" pattern from v2.** State advancement is backend-driven per B6.8. The frontend reflects state, never changes it.
12. **Commit after each screen is verified.** One commit per screen.
13. **Do not touch the backend.** The design brief is frontend-only. Any backend questions go through the sprint plan, not the brief.
14. **Ask when unsure.** If the brief contradicts the sprint plan or is silent on a decision, surface it to Rab. Do not guess. The brief is a living document and will be updated.

## 8.4 What the brief intentionally leaves for Claude Code to decide

The brief stays in its lane. It does not dictate:

- React component structure (composition vs props, hooks vs classes)
- State management pattern (Context vs Zustand vs React Query)
- File organization within `src/`
- Test strategy (unit vs integration vs e2e)
- CSS methodology (Tailwind classes inline vs `@apply` in CSS Modules)
- PostHog event naming conventions
- Git commit message style
- Error boundary strategy
- Loading state conventions (though every screen should have one)

Those are Claude Code's domain. Use existing patterns from the frontend repo (which CLAUDE.md captures) and stay consistent.

---

# Section 9 — Open questions and deferred decisions

The following are genuinely open questions where the brief cannot settle the answer without more information or team input. Surface these during Sprint 7 implementation, not mid-build.

## 9.1 Airport indoor maps

The `at_airport` phase currently falls back to a Google Maps terminal-level view, which isn't that useful. Apple Maps has real indoor maps for ~50 airports worldwide (SFO included). The ideal experience is a terminal-level indoor map showing the user's path from TSA to their gate.

**Decision needed:** Do we invest in Apple Maps indoor maps integration for v1, or do we ship a stylized terminal diagram (no data, just visual reassurance), or do we replace the map with a text-first hero card for `at_airport`?

**My recommendation:** text-first hero card for v1. Indoor maps are a v1.1 feature.

## 9.2 Gate-level Airport Wayfinding data source

v3 My Trip shows an "Airport Wayfinding" card with a photo thumbnail and "Enter Terminal 2 · Departures level" / "TSA PreCheck Security · Left of main entrance" step-by-step guidance. This implies airport-specific content (photos, text, layout).

**Decision needed:** Where does this content come from? Static per-airport content files in the repo? A `/v1/airports/{iata}/wayfinding` endpoint? A scraping/curation system?

**My recommendation:** static content files per airport, starting with the top 10 US airports. Sprint 8 or post-launch.

## 9.3 Share card aesthetics

Section 4.16 specs the share card, but the exact visual design of the airplane route illustration and the logomark treatment needs a design pass when the rest of the system is built. **Defer to after the main screens are built.**

## 9.4 Accessibility

The brief doesn't address accessibility comprehensively. Minimum for v1 launch:

- All interactive elements have min 44×44pt tap targets (Apple HIG)
- All text meets WCAG AA contrast ratios on both light and dark grounds (the palette tokens should be verified)
- VoiceOver labels on all icon-only buttons
- Dynamic Type support for text sizes (test at max accessibility size)
- Reduce Motion respects the 600ms choreographed transition (fall back to 240ms fade)

**Decision needed:** Full accessibility audit before launch, or target WCAG AA for the critical path only (Onboarding → Results → Active Trip → Trip History)?

**My recommendation:** critical path for v1, full audit as a post-launch sprint.

## 9.5 Tab bar during Active Trip urgent state

In the `time-to-go` urgent state (Section 5.3.2), should the tab bar still be visible? It's navigational chrome, and the urgent state is supposed to be focused. Hiding it would reinforce the moment.

**My recommendation:** keep it visible but invert its glass tint to match the dark ground. Hiding navigation during urgency feels manipulative and removes the user's ability to back out. The aesthetic consistency is the right call.

## 9.6 The "New Trip" affordance when an active trip exists

If a user is mid-trip (phase = `en_route`) and wants to plan a different trip (outbound + return flight scenario), how do they get to "new trip"?

- Option A: The "+" icon in the Trips tab top bar is always visible
- Option B: The Home tab always shows the quick action card regardless of active trips

**My recommendation:** both. The "+" icon in Trips top bar and the Home quick action card are both always accessible. The active-trip-takes-over rule only determines the *landing screen*, not the *available navigation*.

## 9.7 What counts as a "trip" for the trial counter

Does re-entering the same flight number create a new trip? Does editing a tracked trip count as a new trip for the trial counter?

- Per REVISED_SPRINT_PLAN.md B6.8, only tracked trips count, and untracking returns the trial credit. This is already decided.
- **But:** if the user enters the same flight number twice in Flight Entry, does the second entry create a duplicate draft, or does it deduplicate?

**My recommendation:** deduplicate by `(flight_number, departure_date, user_id)`. The second entry opens the existing draft for editing.

## 9.8 Localization

AirBridge v1 is English-only. The brief doesn't account for longer string lengths in German/French/Spanish. Non-English support is post-launch, but the design system should use flex-based layouts (not fixed widths on text-containing elements) so that v2 localization doesn't require redesign.

**Action item for Claude Code:** never hardcode pixel widths on elements that contain user-facing text.

---

# End of brief

This document will evolve. Version it in the repo, update it when reality disagrees with it, and keep `AIRBRIDGE_DESIGN_BRIEF.md` and the codebase in sync the same way `REVISED_SPRINT_PLAN.md` and the sprint work stay in sync.

Sprint 7 begins with the design system foundation PR. Everything else follows from there.
