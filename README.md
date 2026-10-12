# Planora

**Planora** is a professional, responsive personal planner web application. It helps users manage
daily tasks, weekly schedules, personal goals, projects, notes, reminders, and productivity reports.

Built with **Vue 3** (Composition API + `<script setup>`), **Express.js**, and **Supabase**
(PostgreSQL + Auth + Row Level Security).

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Vue 3, Vite, Vue Router, Pinia, Tailwind CSS, Lucide icons, shadcn-vue-style components |
| Backend    | Node.js, Express.js (REST API) |
| Database   | Supabase PostgreSQL, Row Level Security, Supabase Storage |
| Testing    | Vitest (unit), Playwright (e2e) |
| Deployment | Vercel (client), Node host (server), Supabase (db/auth) |

## Repository layout

```
planora/
├─ client/                 # Vue 3 + Vite frontend
│  └─ src/
│     ├─ assets/           # Tailwind entry + design tokens
│     ├─ components/       # layout/, ui/, tasks/, projects/, goals/, forms/
│     ├─ views/            # route pages
│     ├─ router/           # vue-router
│     ├─ stores/           # Pinia stores
│     ├─ services/         # API clients
│     ├─ composables/      # reusable composition functions
│     ├─ schemas/          # validation schemas
│     ├─ lib/              # cn() and helpers
│     ├─ App.vue
│     └─ main.js
├─ server/                 # Express REST API
│  └─ src/
│     ├─ routes/
│     ├─ controllers/
│     ├─ services/
│     ├─ middleware/
│     ├─ validators/
│     ├─ config/
│     ├─ utils/
│     ├─ app.js
│     └─ server.js
└─ supabase/
   └─ migrations/          # version-controlled SQL migrations
```

## Prerequisites

- Node.js 20+ (developed on Node 24)
- npm 10+
- A Supabase project (required from Phase 3 onward). Without keys the app runs in a
  read-only **demo mode** using in-memory seed data.

## Setup

```bash
# 1. Install everything
npm run install:all

# 2. Create local env files from the examples (already created with placeholders)
copy client\.env.example client\.env
copy server\.env.example server\.env

# 3. Run both apps (client :5173, server :4000)
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

## Connecting Supabase (Phase 3)

1. **Create the database schema.** In your Supabase project open the **SQL Editor** and run,
   in order, the contents of:
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_row_level_security.sql`

   (Or, with the Supabase CLI linked to your project: `supabase db push`.)

2. **Add your API credentials.** Dashboard → **Project Settings → API**, then edit:
   - `client/.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (anon/publishable key)
   - `server/.env` → `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
   - Optionally `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` (server-only; never in the client).

3. **Configure auth redirect URLs.** Dashboard → **Authentication → URL Configuration** and add:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`
   (Add your production URLs the same way when you deploy.)

4. **Restart the dev servers** (`npm run dev`). Visit `/register` to create the first account.

### Verify

- `GET http://localhost:4000/api/health` → `{ "data": { "status": "ok", ... } }`
- `GET http://localhost:4000/api/auth/me` with header `Authorization: Bearer <access_token>`
  → returns the signed-in user. Without a token it returns `401`.

> Auth is done with the Supabase JS SDK in the browser; the Express API re-verifies the
> access token (`server/src/middleware/auth.js`) and uses RLS for all data access.


## Current status

- **Phase 1 (setup + design system)** — complete. Vue 3 + Vite + Tailwind v4 tokens (light/dark),
  shadcn-vue-style `ui/` primitives (`Button`, `Card`, `Badge`, `Input`, `Label`, `Progress`,
  `DropdownMenu`, `Avatar`, `Dialog`, `Select`, …), `cn()` utility, Lucide icons, `vue-sonner` toasts.
- **Phase 2 (layout + dashboard)** — complete. Collapsible desktop sidebar, responsive mobile
  drawer, top header (search / theme toggle / notifications / profile), and a real dashboard whose
  every statistic is **derived from records** (no hardcoded numbers), with a Chart.js activity chart,
  upcoming deadlines, today's schedule, goal progress, and recent activity.
- **Phase 3 (Supabase schema + auth)** — code complete, **not yet verified against your cloud
  project**. Includes full SQL schema (`0001_init_schema.sql`), RLS policies
  (`0002_row_level_security.sql`), the browser Supabase client, a Pinia auth store, guarded routes
  with Login / Register / Forgot-password / Reset-password views, and a server `requireAuth`
  middleware with `GET /api/auth/me`. Dashboard/module CRUD still reads `client/src/services/seed.js`
  until Phase 4 wires the API. Non-dashboard views render `ModulePlaceholder`.

## Phase roadmap

- [x] **Phase 1** — Project setup and design system
- [x] Phase 2 — Responsive layout, sidebar, header, dashboard UI
- [x] Phase 3 — Supabase schema, migrations, RLS, authentication (code complete; run migrations + add keys)
- [ ] Phase 4 — Task CRUD with search, filters, validation
- [ ] Phase 5 — Categories, projects, goals, notes, events CRUD
- [ ] Phase 6 — Calendar, reminders, reports, charts
- [ ] Phase 7 — Testing, security review, bug fixing
- [ ] Phase 8 — GitHub integration and production deployment

## Environment variables

See `client/.env.example` and `server/.env.example`. Never commit real credentials — only the
Supabase **publishable/anon** key belongs in the browser; the **service-role** key stays server-side.
