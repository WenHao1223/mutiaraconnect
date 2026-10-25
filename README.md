# MutiaraConnect

Community Information and Incident Response Portal for the Penang LRT Mutiara Line.

A React + TypeScript single-page app where residents report incidents, businesses report road
access impact, and admins manage tickets, announcements, road closures, and construction schedules.

The repository is split into two top-level folders:

- `frontend/` — the React + Vite app (see [Getting started](#getting-started)).
- `backend/` — reserved for the API server (not yet implemented).

> **Heads up:** the frontend currently runs entirely in the browser with mock data. Accounts,
> tickets, announcements, and admin changes live in `localStorage` seeded from
> `frontend/src/data/*.json`. There is no backend yet — see the `@TODO: Replace with Supabase` notes
> in `frontend/src/lib`.

## Prerequisites

- **Node.js 20.19+** (or 22.12+) — required by Vite 8.
- **npm** (bundled with Node.js).

Check your version:

```bash
node -v
npm -v
```

## Getting started

1. Move into the frontend folder from the repository root:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your local environment file from the example:

   ```bash
   cp .env.example .env
   ```

   Then open `.env` and fill in the keys you need (see [Environment variables](#environment-variables)).
   All keys are optional: without `VITE_GOOGLE_MAPS_API_KEY` the map shows a "no API key" hint, and
   without `VITE_ORS_API_KEY` shop routes are unavailable. The `VITE_ANNOUNCEMENTS_*` variables
   already have working defaults, so you can leave them blank.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open the printed URL (default <http://localhost:5173>) in your browser.

The dev server hot-reloads on save. Press `Ctrl+C` to stop it.

## Available scripts

All app scripts run from inside `frontend/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Type-check (`tsc -b`) then build for production into `dist/`. |
| `npm run preview` | Serve the production build locally to test it. |
| `npm run lint` | Run ESLint over the project. |

To run the test runner (Vitest is installed) once a `test` script is added:

```bash
npx vitest
```

## Environment variables

Create `frontend/.env` (copied from `.env.example`). Vite only exposes variables prefixed with
`VITE_`.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | No | — | Google Maps JavaScript API key. Powers the map views and the shop location picker. Enable **Maps JavaScript API** and **Geocoding API** for the key at <https://console.cloud.google.com/google/maps-apis>. |
| `VITE_ANNOUNCEMENTS_STORAGE_KEY` | No | `mutiaraconnect.announcements.v2` | `localStorage` key holding the announcement list. |
| `VITE_ANNOUNCEMENTS_READ_STORAGE_KEY` | No | `mutiaraconnect.announcements.read` | `localStorage` key tracking which announcements the current user has read. |
| `VITE_ANNOUNCEMENTS_EVENT` | No | `mutiaraconnect:announcements-changed` | Name of the custom browser event fired when announcements change, so the navbar bell and announcements page refresh in real time. |
| `VITE_ORS_API_KEY` | No | — | OpenRouteService key (free, <https://openrouteservice.org/dev/#/signup>). Plans driving routes to shops on the map that avoid fully closed roads. Without it the map still works but shows no routes. |

The `VITE_ANNOUNCEMENTS_*` variables are optional overrides: leave them blank to use the defaults in
the table. Only change them if the existing keys in `localStorage` would otherwise clash.

`.env` is git-ignored — never commit real keys.

## Demo accounts

The seed data ships with one account per role in `frontend/src/data/users.json`. If you change the
seed passwords, update this table.

| Role | Email | IC |
| --- | --- | --- |
| Resident | `resident@example.com` | `900101-07-0001` |
| Business owner | `business@example.com` | `850505-07-0002` |
| Admin | `admin@example.com` | `880808-07-0003` |
| Super admin | `superadmin@example.com` | `800303-07-0004` |

Sign in with either the email or the IC number plus the account password. The password for the demo
accounts is stored as a bcrypt hash in `frontend/src/data/users.json`.

## Project structure

```text
.
├─ frontend/            React + Vite single-page app
│  ├─ public/           Static assets served as-is
│  ├─ src/
│  │  ├─ assets/        Imported images and styles
│  │  ├─ components/
│  │  │  ├─ admin/      Admin & super-admin dashboard widgets
│  │  │  ├─ auth/       Route guards (RequireRole) and auth layout
│  │  │  ├─ business/   Business-facing components
│  │  │  ├─ custom/     Shared app-specific components
│  │  │  ├─ navbar/     Navigation bar and profile menu
│  │  │  ├─ tickets/    Ticket reporting UI
│  │  │  └─ ui/         shadcn/ui primitives (button, input, ...)
│  │  ├─ data/          Seed JSON (users, tickets, closures, schedule, announcements)
│  │  ├─ hooks/         Reusable React hooks
│  │  ├─ lib/           Data + logic layer (auth, tickets, admin, maps, business, settings)
│  │  ├─ pages/         Route-level pages
│  │  ├─ types/         Shared TypeScript types
│  │  └─ routes.tsx     Single source of truth for URLs and navigation
│  ├─ .env.example      Template for local environment variables
│  ├─ components.json   shadcn/ui configuration
│  └─ vite.config.ts    Vite config (dev server, @ alias, plugins)
└─ backend/             Reserved for the API server (to be added)
```

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** for dev server and builds
- **React Router 7** for routing
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives) for styling
- **Recharts** for dashboard charts
- **@vis.gl/react-google-maps** for maps
- **react-hook-form** + **zod-style** validation for forms
- **Vitest** for tests

## Notes for contributors

- Import from the source root with the `@/` alias (e.g. `import { PATHS } from "@/routes"`), not
  long relative paths.
- Add or change URLs in `frontend/src/routes.tsx` only; use the exported `PATHS` everywhere else.
- Keep mock-data access inside `frontend/src/lib/*`; components should not read `localStorage`
  directly.

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching, commit, and pull request guidelines.
