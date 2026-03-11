# ✈️ AirBridge — Frontend

**The door-to-gate departure decision engine.**

AirBridge eliminates the guesswork of airport timing. Enter your flight details, customize your preferences, and get a confidence-scored, minute-by-minute departure plan — from your door to the gate.

[![JavaScript](https://img.shields.io/badge/javascript-ES2022-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/vite-5.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.x-blue.svg)](https://tailwindcss.com/)

---

## Overview

This is the web frontend for AirBridge. It provides a guided, three-step flow for departure planning:

1. **Trip Input** — Enter flight number directly, or search by airline + route + time window
2. **Flight Selection** — Browse matching flights filtered by your criteria and pick your departure
3. **Departure Plan** — View your personalized door-to-gate timeline with confidence scoring

### Key Features

- **Dual input mode** — Flight number lookup or route-based search with time window filtering
- **Interactive preferences** — Transport mode, risk profile (Stress-Free / Just Right / Cut It Close), checked bags, children, extra buffer
- **Visual journey map** — Step-by-step timeline: Leave Home → Airport → Baggage → TSA → Gate
- **Segment breakdown** — Individual time cards for transport, TSA wait, gate walk, baggage, buffer, and confidence score
- **Live status indicators** — Engine Active / Live & Reactive badges
- **Responsive design** — Optimized for desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite |
| Language | JavaScript (ES2022) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Linting | ESLint |

---

## Project Structure

```
src/
├── api/
│   └── airbridge.contracts.ts    # TypeScript types mirroring backend schemas
├── components/                    # UI components
├── pages/                         # Route-level page components
├── styles/                        # Tailwind config + global styles
└── ...
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/rabahbabaci/airbridge-frontend.git
cd airbridge-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

Set the following in `.env.local`:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

```bash
# Start the development server
npm run dev
```

---

## Backend Integration

This frontend is designed to work with the [AirBridge Backend API](https://github.com/rabahbabaci/airbridge-backend).

API contract types are maintained in `src/api/airbridge.contracts.ts` and kept in sync with the backend's Pydantic schemas. Key contracts:

- `TripContext` — Response from `POST /v1/trips`
- `TripPreferences` — User preferences (transport, bags, security access, risk profile)
- `RecommendationResponse` — Leave-home time, confidence score, and journey segments
- `SegmentDetail` — Individual journey leg (id, label, duration, advice)

Backend connection is configured via `VITE_BASE44_APP_BASE_URL`. The frontend is integration-ready but currently operates independently.

---

## Beta Scope

- **Airports:** SFO, OAK, SJC (Bay Area)
- **Input modes:** Flight number and route search
- **Live beta:** [airbridgeberkeley.base44.app](https://airbridgeberkeley.base44.app)

---

## Roadmap

- [x] Landing page with product positioning
- [x] Departure Setup wizard (3-step flow)
- [x] Dual input mode (flight number / route search)
- [x] Flight selection from search results
- [x] Preference customization (transport, risk, bags, children, buffer)
- [x] Door-to-gate journey map visualization
- [x] Segment breakdown cards (transport, TSA, gate walk, baggage, confidence)
- [x] Backend contract types (`airbridge.contracts.ts`)
- [ ] Wire API calls to AirBridge backend
- [ ] Boarding pass toggle in UI
- [ ] Security access selector (PreCheck / CLEAR)
- [ ] Real-time recommendation updates
- [ ] Push notifications
- [ ] Mobile-optimized experience

---

## Related

- **Backend API:** [airbridge-backend](https://github.com/rabahbabaci/airbridge-backend)
- **Live beta:** [airbridgeberkeley.base44.app](https://airbridgeberkeley.base44.app)

---

## License

[MIT](LICENSE)