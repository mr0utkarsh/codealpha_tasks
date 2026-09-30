# FLOWBOARD — Plan. Collaborate. Deliver.
A calm, modern project-management workspace: projects, a four-column drag-and-drop task board, assignments, priorities, due dates, comments, member management, live dashboard stats, activity feeds and dark mode.

Built for the **CodeAlpha Full Stack Development Internship — Task 3 (Project Management Tool)**.

## Features

- **Auth** — register/login with validation, JWT sessions, bcrypt hashing, protected routes, logout.
- **Dashboard** — real aggregates from PostgreSQL (total/active/completed projects, pending tasks, assigned-to-me), completion bar, recent activity, recent projects.
- **Projects** — search, status filter, sort (recent/name/due), create/edit/delete with confirmation dialogs, progress bars, member avatars, task counts.
- **Task board** — TODO / In Progress / In Review / Done, drag-and-drop with optimistic updates, per-column quick-add, touch-friendly status buttons on task pages.
- **Tasks** — title, description, assignee (members only), priority (Low/Medium/High/Urgent), status, due date; detail page with edit/delete, history and comment counts.
- **Comments** — add/view on any task; delete your own comments.
- **Members** — invite via name/email search, roles (Owner/Admin/Member), remove members (owner/admin; owner is protected).
- **Team directory, global task search, toasts, skeletons, empty states, dark/light theme**, responsive sidebar → drawer → bottom-nav layout.

## Tech stack

Frontend: React 18 + Vite 5, Tailwind CSS 3, Lucide React, Framer Motion, React Router 6.
Backend: Node.js + Express 5, Prisma 6, PostgreSQL, JWT, bcrypt, Zod, Helmet, CORS, rate limiting.
Database: PostgreSQL (local via `embedded-postgres`, or any Postgres 14+).


## Project structure

```
CodeAlpha_Project_Management_Tool/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # User, Project, ProjectMember, Task, Comment, Activity
│   │   ├── seed.js            # 7 users · 3 projects · 23 tasks · 20 comments · activity
│   │   └── migrations/
│   ├── scripts/
│   │   ├── local-db.js        # embedded Postgres helper (start/stop/status)
│   │   └── test-api.ps1       # 53-check end-to-end API test suite
│   └── src/
│       ├── config/env.js
│       ├── lib/               # prisma client, jwt, password, access control
│       ├── middleware/        # auth, validation, errors, rate limiting
│       ├── validators/        # zod schemas (auth, project, task, comment)
│       ├── controllers/       # auth, dashboard, project, member, task, comment, user
│       ├── routes/
│       ├── app.js
│       └── server.js
└── frontend/
    ├── src/
    │   ├── lib/               # api client, formatting helpers
    │   ├── context/           # Auth, Theme, Toast
    │   ├── components/        # layout, cards, badges, modals, members, feedback
    │   ├── pages/             # Landing, Login, Register, Dashboard, Projects,
    │   │                      # ProjectDetail (board), TaskDetail, Team, Search, 404
    │   ├── routes.jsx
    │   ├── main.jsx
    │   └── index.css
    └── vite.config.js         # dev proxy /api to http://localhost:5001
```

## Environment variables

Backend (`backend/.env`):

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55433/flowboard"
JWT_SECRET="<long-random-secret>"
JWT_EXPIRES_IN="7d"
PORT="5001"
CLIENT_URL="http://localhost:5173"
```


## Backend and frontend setup

```powershell
cd backend
npm install
npm run db:local
npm run db:migrate
npm run db:seed
node src/server.js
```

API on http://localhost:5001 (health: `GET /api/health`).

```powershell
cd frontend
npm install
npm run dev
```

App on http://localhost:5173 (proxies `/api` to `:5001`). Production build: `npm run build` → `frontend/dist`.

## API overview

Base URL `http://localhost:5001/api`; all non-auth routes need `Authorization: Bearer <jwt>`.

- `POST /api/auth/register` — `{name, email, password}` → `{user, token}`
- `POST /api/auth/login` — `{email, password}` → `{user, token}`
- `GET /api/auth/me` — current user
- `GET /api/dashboard` — stats + recent activity (real aggregates)
- `GET /api/projects?q=&status=&sort=` — my projects with stats/progress
- `POST /api/projects` — create (creator becomes OWNER)
- `GET /api/projects/:id` — detail with stats + members
- `PUT /api/projects/:id` — update (owner/admin)
- `DELETE /api/projects/:id` — delete (owner only)
- `GET /api/projects/:id/members` — list members
- `POST /api/projects/:id/members` — add `{userId, role?}` (owner/admin)
- `DELETE /api/projects/:id/members/:userId` — remove (owner/admin)
- `GET /api/projects/:id/tasks?q=&status=&priority=&assignee=` — board tasks
- `POST /api/projects/:id/tasks` — create (assignee must be a member)
- `GET /api/tasks/:id` — detail + comments + activity
- `PUT /api/tasks/:id` — update incl. status/priority (any member)
- `DELETE /api/tasks/:id` — delete (owner/admin/assignee)
- `GET /api/tasks/:id/comments` — list; `POST` — add
- `DELETE /api/comments/:id` — delete own (or owner/admin)
- `GET /api/projects/:id/activities` — activity feed
- `GET /api/users?q=` — user search for invites

Errors return `{ success: false, error: { message, details? } }`. Password hashes are never serialized.

## Screenshots

Add screenshots after running the app: `docs/screenshots/landing.png`, `dashboard.png`, `board.png`, `task.png`.

## Future improvements

- Real-time board updates via WebSockets (presence + live card moves).
- Attachments, checklists/subtasks and labels.
- Email invitations and in-app notifications.
- Project templates, archiving and CSV export.
- Postgres full-text search, audit-log retention, Playwright E2E + CI.

See `backend/.env.example`. Never commit `.env`. Frontend optional `frontend/.env`: `VITE_API_URL` (leave empty in dev — Vite proxies `/api`).

## PostgreSQL setup

Option A — zero-install local database (recommended for review): `cd backend; npm install; npm run db:local`.
Option B — your own Postgres 14+: `createdb flowboard`, then set `DATABASE_URL` in `backend/.env`.

## Prisma setup and seed

```powershell
cd backend
npm install
npm run db:migrate
npm run db:seed
```

Seed creates 7 users, 3 projects, 23 tasks, 20 comments, memberships and activity. Sign in with any seeded account — password is `Password123!` (e.g. `aarav@flowboard.app`).
