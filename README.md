# CodeAlpha Full Stack Development Internship

**Developer:** Utkarsh Giri

A monorepo containing three full-stack production-ready web applications built during the CodeAlpha Full Stack Development Internship. Each project is a self-contained Node.js + Express + Prisma + PostgreSQL backend and React + Vite + Tailwind CSS frontend with JWT authentication.

---

## Projects Overview

| Project | Category | Tech Stack |
| --- | --- | --- |
| **NOVA MART** | E-commerce | React 19, Vite 8, Tailwind, Express 5, Prisma 6, PostgreSQL |
| **SYNCSPACE** | Real-time Communication | React 18, Vite 5, Tailwind, Socket.IO, WebRTC, Express 5, Prisma 6, PostgreSQL |
| **FLOWBOARD** | Project Management | React 18, Vite 5, Tailwind, Framer Motion, Express 5, Prisma 6, PostgreSQL |

---

## NOVA MART — E-Commerce Store

A production-style storefront with full-text search, filtering, sorting, persistent cart and wishlist, checkout with stock reservation, order history, and role-based admin features.

### Features
- **Storefront** — hero section, featured and trending products, product detail pages
- **Search & Filter** — full-text search across name/brand/category/description; filter by category, brand, price, stock, featured/trending
- **Sorting** — relevance, newest, price (asc/desc), rating, popularity, name
- **Cart & Wishlist** — persistent cart (merged for guest + signed-in users), wishlist with toggle
- **Checkout** — full validation, stock reservation, atomic order creation via transaction
- **Order History** — order detail, cancellation, order statistics
- **Profile** — manage account, change password
- **Admin Panel** — product CRUD, order status updates, view all orders (role-gated server-side)
- **AI Search Assist** — refines query against live catalog

### Tech
React 19, Vite 8, Tailwind CSS 3, React Router 7, Node.js, Express 5, Prisma 6, PostgreSQL, JWT, bcrypt, Zod validation

### Links
- **Source:** [`NOVA-MART/`](./NOVA-MART)

---

## SYNCSPACE — Real-Time Communication

Real-time rooms for group messaging, peer-to-peer audio/video calls (WebRTC), screen sharing, file sharing, and collaborative whiteboard.

### Features
- **Authentication** — email/password with JWT sessions
- **Rooms** — generated join codes, membership tracking, ownership
- **Chat** — real-time group messaging over Socket.IO, persisted to PostgreSQL
- **Audio & Video** — peer-to-peer over WebRTC in full mesh topology
- **Media Controls** — mute camera/microphone, broadcast to all participants
- **Screen Sharing** — getDisplayMedia, replace outgoing video, return to camera when done
- **Participants Panel** — show each user's name, audio/camera/screen state, live connection status
- **File Sharing** — upload with progress, MIME/extension filters, size caps
- **Collaborative Whiteboard** — broadcast strokes and clear events to room
- **AI Features** — chat summarization, message rewriting (5 tones), reply suggestions

### Tech
React 18, Vite 5, Tailwind CSS 3, React Router 6, Node.js, Express 5, Socket.IO 4, WebRTC, Multer, Prisma 6, PostgreSQL, JWT, bcrypt, Zod validation

### Known Limitations
- WebRTC uses public STUN servers only; no TURN relay (peers behind symmetric NAT may fail)
- Files stored on server disk, not object storage (uploads don't survive redeploy/scale-out)
- No renegotiation path for peer connections created before local media resolves

### Links
- **Source:** [`SYNCSPACE/`](./SYNCSPACE)

---

## FLOWBOARD — Project Management

A workspace for managing projects, teams, and tasks on a Kanban board with real-time dashboard stats and activity feeds.

### Features
- **Authentication** — email/password with JWT sessions
- **Dashboard** — aggregated project/task/activity statistics, completion bar, recent activity, recent projects
- **Projects** — status tracking (PLANNING, ACTIVE, ON_HOLD, COMPLETED), search, filter, sort
- **Team Directory** — cross-project user search
- **Membership** — per-project roles (OWNER, ADMIN, MEMBER), enforced on all operations
- **Kanban Board** — four columns (TODO, IN_PROGRESS, IN_REVIEW, DONE), drag-and-drop with optimistic updates and rollback
- **Tasks** — priorities (LOW, MEDIUM, HIGH, URGENT), due dates, assignees, per-task comments
- **Activity Feed** — records project, member, task, and comment events
- **Search & Filter** — across projects and tasks
- **Dark/Light Theme** — persistent theme preference
- **AI Assistance** — generate project descriptions, task descriptions, draft comments by intent, suggest tasks

### Tech
React 18, Vite 5, Tailwind CSS 3, React Router 6, Framer Motion, Node.js, Express 5, Prisma 6, PostgreSQL, JWT, bcrypt, Zod, Helmet, express-rate-limit

### Known Limitations
- Kanban drag-and-drop uses HTML5 drag-and-drop API (no touch support on mobile); tasks can be moved via task detail view
- No file storage in FLOWBOARD (shared files in SYNCSPACE only)

### Links
- **Source:** [`FLOWBOARD/`](./FLOWBOARD)

---

## Repository Layout

```
codealpha_tasks/
├── NOVA-MART/
│   ├── backend/            # Express + Prisma REST API
│   └── frontend/           # React + Vite storefront
├── SYNCSPACE/
│   ├── backend/            # Express + Socket.IO + WebRTC signaling
│   └── frontend/           # React + Vite client
├── FLOWBOARD/
│   ├── backend/            # Express + Prisma REST API
│   └── frontend/           # React + Vite workspace
└── README.md
```

---

## Getting Started

Each project follows the same setup pattern:

```bash
# 1. Install dependencies
cd NOVA-MART/backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp .env.example .env        # backend, fill in DATABASE_URL and JWT_SECRET
cp .env.example .env        # frontend, set VITE_API_URL if needed

# 3. Create database and seed
cd ../backend
npm run db:migrate
npm run db:seed

# 4. Start the backend (ports: NOVA MART 5000, SYNCSPACE 5004, FLOWBOARD 5001)
npm run dev

# 5. Start the frontend (in another terminal)
cd ../frontend && npm run dev
```

Each backend includes an embedded PostgreSQL for local development (zero-config):

```bash
cd backend && npm run db:local
```

**API Health Endpoint:** `GET /api/health`

---

## Security

- `.env` files excluded by `.gitignore` and never committed; only `.env.example` with placeholders tracked
- Passwords hashed with **bcrypt**; hashes excluded from API responses
- JWT signed with a secret that backend refuses to start without if shorter than 32 characters
- Request bodies validated with **Zod**
- CORS is an explicit origin allowlist configured with `CORS_ORIGIN`
- **Helmet** sets security headers; rate limiting applied to API and auth routes
- File uploads constrained by MIME type, extension, and size
- AI provider keys optional server-side only; never exposed through `VITE_*` variables

---

## Environment Variables

Every variable used is listed in each project's `.env.example`.

**Backend:** `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, plus project-specific vars

**Optional AI Providers:** `GEMINI_API_KEY`, `GROQ_API_KEY` (each backend tries Gemini first, falls back to Groq, degrades gracefully when neither configured)

**Frontend:** `VITE_API_URL` (public API origin; no secrets ever placed in `VITE_*` variables)

---

## License

Built for the **CodeAlpha Full Stack Development Internship**.

*Built with attention to security, real data, and thoughtful design.*
