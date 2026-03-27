# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AirBridge is a React SPA that helps travelers plan their door-to-gate airport journey. It provides departure time recommendations based on flight details, transport preferences, and security options. Currently in beta for Bay Area airports (SFO, OAK, SJC).

## Commands

```bash
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run build:dev     # Development build
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix lint issues
npm run typecheck     # TypeScript type checking
npm run preview       # Preview production build
```

No test framework is configured.

## Tech Stack

- **React 18** with React Router v6, JavaScript (JSX) with some TypeScript for API contracts
- **Vite 6** for build tooling
- **Tailwind CSS 3** with shadcn/ui components (Radix UI primitives)
- **Framer Motion** for animations
- **date-fns** for date handling
- Native `fetch()` for API calls (no axios or react-query)
- React Context + hooks for state (no Redux/Zustand)

## Architecture

**Routing:** File-based via `src/pages.config.js` → two pages: `/` (Home landing) and `/Engine` (main app).

**Key application flow (Engine.jsx):**
1. Step 1: Flight input (number or route search)
2. Step 2: Flight selection from search results
3. Step 3: Preference customization (transport, TSA, bags, children, security)
4. Results: Journey timeline visualization with departure recommendation

**API integration:** Engine.jsx calls the backend at `https://airbridge-backend-production.up.railway.app`:
- `GET /v1/flights/{flightNumber}/{date}` — search flights
- `POST /v1/trips` — create trip
- `POST /v1/recommendations` — get departure recommendation
- `POST /v1/recommendations/recompute` — update recommendation

**API contract types** are defined in `src/api/airbridge.contracts.ts` mirroring the backend's Pydantic schemas.

## Key Directories

- `src/pages/` — Page components (Home.jsx, Engine.jsx)
- `src/components/engine/` — Engine sub-components (flight input, selection, preferences, results, journey visualization)
- `src/components/landing/` — Landing page sections (Header, Hero, Problem, Solution, HowItWorks, Comparison, Trust, CTA, Footer)
- `src/components/ui/` — shadcn/ui component library (40+ components, do not hand-edit)
- `src/lib/` — AuthContext (Google OAuth + localStorage persistence), utils (cn helper), PageNotFound
- `src/utils/` — Formatting helpers (format.js), PostHog analytics (analytics.js), flight data mapping (mapFlight.js), createPageUrl (index.ts)
- `src/hooks/` — Custom hooks (use-mobile.jsx)
- `src/data/` — Static data (airports.json)
- `src/integrations/supabase/` — Supabase client and types
- `src/config.js` — Runtime config (API base URL, Google client ID, Google Maps key, PostHog key)

## Conventions

- **Path alias:** `@` → `src/` (e.g., `@/components/ui/button`)
- **Naming:** PascalCase components, camelCase utils, UPPER_SNAKE_CASE constants
- **Styling:** Utility-first Tailwind; use `cn()` from `@/lib/utils` for conditional class merging
- **ESLint:** Enforces React best practices + unused import removal
