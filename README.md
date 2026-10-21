# Worker Planner

**Worker Planner** is a personal task planner for organising work, tracking progress and reporting
on it. Register an account, plan tasks across **daily / weekly / monthly / yearly** views, watch your
**completion stats**, get **reminders** for due work, and write **daily work reports**.

Built with **Vue 3** (Composition API + `<script setup>`), **Vite**, **Pinia** and **Tailwind CSS**
on the front end; an **Express REST API** in the middle; and **Supabase** (PostgreSQL + Auth + Row
Level Security) as the data layer.

> Every request goes **browser → Express API → Supabase**. The API verifies the Supabase access
> token and runs each query as that user, so Row Level Security enforces per-user isolation.

---

## Features

- **Accounts** — register, log in, forgot / reset password (Supabase Auth), guarded routes.
- **Dashboard** — totals, completed / in-progress / overdue counts, overall completion %, a status
  doughnut, a priority bar chart, and upcoming & overdue lists.
- **Tasks CRUD** — title, description, notes, category, priority (low/medium/high), status,
  start date, deadline and progress. Search, filter (status, priority, category) and sort.
- **Progress** — 0–100% per task with an inline slider; marking complete records the completion
  date and whether it was on time.
- **Planning** — daily, weekly, monthly and yearly views with a calendar grid and a list. Click any
  day or month to drill in.
- **Daily work reports** — completed, ongoing, pending, blockers, achievements and tomorrow's plan.
  "Suggest from tasks" fills the first three from your data; export as Markdown or print.
- **Reminders** — browser notifications plus in-app alerts for overdue tasks and tasks due within
  24 hours (deduplicated per task per day).
- **Settings** — profile (name, timezone), theme (light/dark), notification toggle, category
  management and sign out.

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Vue 3, Vite, Vue Router, Pinia, Tailwind CSS, reka-ui, Chart.js, Lucide icons |
| Backend    | Node.js, Express.js (REST API), Zod validation |
| Database   | Supabase PostgreSQL, Row Level Security |
| Testing    | Vitest (unit), Playwright (e2e) |
| Deployment | Vercel (client + API), Supabase (db/auth) |

## Repository layout

```
personal-planer/
├─ client/                 # Vue 3 + Vite frontend
│  └─ src/
│     ├─ assets/           # Tailwind entry + design tokens
│     ├─ components/       # layout/, ui/, forms/, common/, dashboard/, tasks/, plan/
│     ├─ views/            # Dashboard, Tasks, Plan, Reports, Settings + auth pages
│     ├─ router/           # vue-router
│     ├─ stores/           # Pinia stores (auth, tasks, categories, reports, dashboard)
│     ├─ services/         # api.js — REST client (Bearer token + unwrap)
│     ├─ composables/      # useTheme, useToast, useReminders
│     ├─ schemas/          # zod validation schemas
│     └─ lib/              # supabase client + helpers
├─ server/                 # Express REST API
│  └─ src/
│     ├─ controllers/      # task, category, report, dashboard, auth
│     ├─ routes/           # mounted under /api
│     ├─ validators/       # zod request schemas
│     ├─ middleware/       # auth (JWT), validate, error handling, rate limit
│     ├─ config/           # env + Supabase clients
│     └─ utils/            # ApiError, asyncHandler, case, db
└─ supabase/
   └─ migrations/          # version-controlled SQL migrations
```

## Prerequisites

- Node.js 20+ (developed on Node 24)
- npm 10+
- A Supabase project (required).

## Setup

```bash
# 1. Install everything
npm run install:all

# 2. Create local env files from the examples
copy client\.env.example client\.env
copy server\.env.example server\.env

# 3. Run both apps (client :5173, server :4000)
npm run dev
```

If port 4000 or 5173 is already in use, a stale dev stack is still running. Stop it and re-run
`npm run dev` once.

## Connect Supabase

1. **Create the database schema.** In your Supabase project open the **SQL Editor** and run, in
   order:
   - `supabase/migrations/0001_init_schema.sql` — tables (`profiles`, `categories`,
     `tasks`, `reports`), enums, and triggers
   - `supabase/migrations/0002_row_level_security.sql` — owner-only RLS policies
   - `supabase/migrations/0003_admin_access.sql` — roles, payment verification and access gating
   - `supabase/migrations/0004_admin_delete_user.sql` — admin account-deletion helper
   - `supabase/migrations/0005_task_plan.sql` — adds the `tasks.plan` column to databases
     created before the plan feature (fixes "plan column not found" on older projects)
   - `supabase/migrations/0006_recurring_and_subtasks.sql` — recurring tasks + sub-tasks
     (Todoist-style) columns on `tasks`
   - `supabase/migrations/0007_report_periods.sql` — adds `period` to reports (daily/weekly/
     monthly/yearly)
   - `supabase/migrations/0008_personal_diary.sql` — personal diary / notes table

   > `0001` begins by dropping the app tables so it can be re-run. On an existing project this
   > **resets their data** — intended for the fresh Worker Planner schema.

2. **Add your API credentials.** Dashboard → **Project Settings → API**, then edit:
   - `client/.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`
   - `server/.env` → `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (and `CORS_ORIGINS`)

3. **Configure auth redirect URLs.** Dashboard → **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173` (and your production URL)
   - Redirect URLs: `http://localhost:5173/**` (and `https://<your-domain>/**`)

4. **Restart the dev servers** and visit `/register` to create the first account.

## API overview

All routes are mounted under `/api` and (except health) require
`Authorization: Bearer <supabase-access-token>`.

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/health` | Liveness probe |
| GET    | `/auth/me` | Current user echo |
| GET    | `/tasks` | List tasks (`search`, `status`, `priority`, `categoryId`, `from`, `to`, `sort`, `order`) |
| POST   | `/tasks` | Create a task |
| GET/PATCH/DELETE | `/tasks/:id` | Read / update / delete a task |
| GET/POST | `/categories` | List / create categories |
| PATCH/DELETE | `/categories/:id` | Update / delete a category |
| GET    | `/reports` | List reports (`from`, `to`) |
| GET    | `/reports/date/:date` | Report for a specific day (`YYYY-MM-DD`) |
| GET    | `/reports/suggest?date=` | Suggest report content from tasks |
| POST/GET/PATCH/DELETE | `/reports` & `/reports/:id` | Upsert / read / update / delete a report |
| GET    | `/dashboard/summary` | Aggregated stats, upcoming and overdue tasks |

## How tasks work

- **Dates** are `tasks.start_date` and `tasks.deadline` (`timestamptz`, sent as ISO strings). A
  database check plus the server and form schemas enforce `deadline >= start_date`.
- **Status** is one of `not_started | in_progress | completed`. **Overdue** is *derived* on the
  server (not stored): a task is overdue when it is not completed and its deadline is in the past.
- **Completion** — a database trigger keeps things consistent: `progress = 100` sets the status to
  `completed` and stamps `completed_at`; it also records `completed_late` (whether it finished after
  the deadline). Un-completing clears those fields.
- **Reminders** are handled by `useReminders` (`client/src/composables/useReminders.js`): it polls
  the dashboard summary every 5 minutes and raises a browser notification + toast for overdue and
  due-soon tasks, once per task per day.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install root + client + server dependencies |
| `npm run dev` | Run the client and server together |
| `npm run dev:client` / `dev:server` | Run one side only |
| `npm run build:client` | Production build of the client |
| `npm run test` | Run the client unit tests |

## Environment variables

See `client/.env.example` and `server/.env.example`. Never commit real credentials — only the
Supabase **publishable/anon** key belongs in the browser; the **service-role** key stays server-side.
