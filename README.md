# AirBridge

**Never miss a flight. Never waste time at the gate.**

AirBridge is a departure decision engine that tells you exactly when to leave home for your flight. Enter your flight details, set your preferences, and get a confidence-scored, minute-by-minute journey plan — from your door to the gate.

[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## What it does

AirBridge replaces the mental math travelers do before every flight — _"What time should I leave? How long is TSA? Should I add buffer for bags?"_ — with a single, personalized recommendation.

**Three-step flow:**

1. **Find your flight** — Look up by flight number or search by route and time window
2. **Set your preferences** — Transport mode, TSA access, checked bags, children, risk tolerance
3. **Get your plan** — A visual door-to-gate timeline with departure time, segment breakdown, and confidence score

Currently in beta for Bay Area airports: **SFO**, **OAK**, and **SJC**.

---

## Tech stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Framework    | React 18 with React Router v6          |
| Build        | Vite 6                                  |
| Styling      | Tailwind CSS 3 + shadcn/ui (Radix)     |
| Animations   | Framer Motion                           |
| Auth         | Google OAuth                            |
| Analytics    | PostHog                                 |
| API          | Native fetch — typed contracts in TS    |
| State        | React Context + hooks                   |

---

## Project structure

```
src/
├── api/                        # TypeScript contract types (mirrors backend schemas)
├── components/
│   ├── engine/                 # App flow: flight input, selection, preferences, results
│   ├── landing/                # Marketing pages: hero, problem, solution, how-it-works
│   └── ui/                     # shadcn/ui component library
├── data/                       # Static data (airports)
├── hooks/                      # Custom hooks (responsive breakpoints)
├── integrations/               # Third-party service clients
├── lib/                        # Auth context, utilities
├── pages/                      # Route components (Home, Engine)
└── utils/                      # Formatting, analytics, flight data mapping
```

---

## Getting started

### Prerequisites

- Node.js 18+
- npm or bun

### Setup

```bash
git clone https://github.com/rabahbabaci/airbridge-frontend.git
cd airbridge-frontend
npm install
npm run dev
```

The app connects to the production API by default. To override, create a `.env.local`:

```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_POSTHOG_API_KEY=your_posthog_key
```

### Scripts

| Command          | Description                |
| ---------------- | -------------------------- |
| `npm run dev`    | Start dev server           |
| `npm run build`  | Production build           |
| `npm run lint`   | Run ESLint                 |
| `npm run typecheck` | TypeScript type check   |
| `npm run preview` | Preview production build  |

---

## Backend API

This frontend is paired with the [AirBridge Backend](https://github.com/rabahbabaci/airbridge-backend), a Python API hosted on Railway.

**Endpoints used:**

| Method | Path                              | Purpose                    |
| ------ | --------------------------------- | -------------------------- |
| GET    | `/v1/flights/{number}/{date}`     | Look up flights            |
| POST   | `/v1/trips`                       | Create a trip              |
| POST   | `/v1/recommendations`            | Generate departure plan    |
| POST   | `/v1/recommendations/recompute`  | Update with new preferences |

API contract types are maintained in [`src/api/airbridge.contracts.ts`](src/api/airbridge.contracts.ts) and kept in sync with the backend's Pydantic schemas.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Home (/)  │     │  Engine (/e) │     │  Backend API    │
│   Landing   │────▶│  4-step flow │────▶│  Railway        │
│   page      │     │  + results   │     │  (Python/Fast)  │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Google     │
                    │  Maps API   │
                    └─────────────┘
```

The Engine page manages the full user journey as a multi-step wizard with animated transitions. Each step is a self-contained component that passes data up to the parent via callbacks. Recommendations are fetched from the backend and rendered as a visual journey timeline with per-segment breakdown.

---

## Related repositories

- **Backend API:** [airbridge-backend](https://github.com/rabahbabaci/airbridge-backend)

---

## License

[MIT](LICENSE)
