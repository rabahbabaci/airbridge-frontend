# CLAUDE.md

## Project Overview

AirBridge is a React + Vite SPA with a Capacitor native wrapper for iOS and Android. It helps travelers plan their door-to-gate airport journey with real-time departure recommendations. Beta for Bay Area airports (SFO, OAK, SJC). Live at airbridge.live.

## Commands

```bash
npm run dev             # Vite dev server (web)
npm run build           # Production build (web)
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix lint issues
npm run cap:build       # Build web + sync to native (iOS/Android)
npm run cap:open:ios    # Open Xcode project
npm run cap:open:android # Open Android Studio
```

No test framework is configured.

## Tech Stack

React 18, React Router v6, Vite 6, Tailwind CSS 3 + shadcn/ui, Framer Motion, date-fns. Native `fetch()` for API calls. React Context + hooks for state. Capacitor 8 for native iOS/Android.

## Key Directories

- `src/pages/` — Home.jsx, Engine.jsx, Settings.jsx (routed via `src/pages.config.js`)
- `src/components/engine/` — Engine sub-components: StepEntry, StepSelectFlight, StepDepartureSetup, ResultsView, ActiveTripView, JourneyVisualization, AuthModal, PushPrimingModal, ActionCards, LoadingView
- `src/components/landing/` — Landing page sections (Header, Hero, HowItWorks, etc.)
- `src/components/ui/` — shadcn/ui components (do not hand-edit)
- `src/lib/` — AuthContext.jsx, utils.js (cn helper), PageNotFound
- `src/utils/` — platform.js, pushNotifications.js, analytics.js, format.js, mapFlight.js, nativeAuth.js
- `src/config.js` — API_BASE, GOOGLE_CLIENT_ID, GOOGLE_MAPS_API_KEY, POSTHOG_API_KEY
- `ios/App/App/Plugins/` — Custom Swift plugins (AppleSignInPlugin, GoogleSignInPlugin)

## Native (Capacitor 8)

- **iOS:** `ios/` directory. Bundle ID: `live.airbridge.app`. Scheme: AirBridge.
- **Android:** `android/` directory.
- **Custom Swift plugins:** `ios/App/App/Plugins/` — AppleSignInPlugin.swift, GoogleSignInPlugin.swift
- **AppDelegate:** `ios/App/App/AppDelegate.swift` — includes remote notification forwarding for FCM
- **Platform detection:** `src/utils/platform.js` — `isNative()` and `getPlatform()` gate all native-only code
- **TestFlight:** Xcode → Product → Archive → Distribute → TestFlight Internal Only

## Auth

- **Apple Sign In** — native iOS only (via custom AppleSignInPlugin)
- **Google Sign In** — web only via Google Identity Services (GIS library)
- **Phone OTP** — both web and native
- **AuthContext** stores: token, user_id, trip_count, tier, auth_provider, display_name. Persisted in localStorage under `airbridge_auth`.

## Push Notifications

- `@capacitor-firebase/messaging` for FCM tokens (not raw APNs)
- `src/utils/pushNotifications.js` — requestPermission(), registerTokenWithBackend(), setupPushListeners()
- `src/components/engine/PushPrimingModal.jsx` — shown after first tracked trip. "Not now" preserves iOS system prompt for next time (re-prompts on trip 2+).
- `GoogleService-Info.plist` in `ios/App/App/` (included in Xcode build)
- Web: all push functions are no-ops when `!isNative()`

## Backend API

Base URL: `https://airbridge-backend-production.up.railway.app` (configured in `src/config.js`)

| Endpoint | Auth | Method |
|---|---|---|
| /v1/auth/send-otp, /v1/auth/verify-otp, /v1/auth/social | none | POST |
| /v1/users/me, /v1/users/preferences | required | GET, PUT |
| /v1/trips, /v1/trips/active, /v1/trips/{id}, /v1/trips/{id}/track | opt/req | POST, GET |
| /v1/recommendations, /v1/recommendations/recompute | optional | POST |
| /v1/flights/{number}/{date}, /v1/flights/search | optional | GET |
| /v1/devices/register, /v1/devices/unregister | required | POST, DELETE |
| /v1/events | optional | POST |

Auth = `Authorization: Bearer <token>` from /v1/auth/social or /v1/auth/verify-otp.

## Build Notes

- `.env` has `VITE_API_URL` for local dev — comment it out for production builds
- Path alias: `@` → `src/`
- `npm run cap:build` = `npm run build && npx cap sync` (builds web then syncs to native)

## Conventions

- PascalCase components, camelCase utils, UPPER_SNAKE_CASE constants
- Utility-first Tailwind; use `cn()` from `@/lib/utils` for conditional class merging
- `isNative()` gates all native-only code — web must always work
- Build must pass before committing
- ESLint enforces React best practices + unused import removal

## Current State

Sprint 5 complete. Sprint 6 next.
