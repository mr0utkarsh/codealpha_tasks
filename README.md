# CodeAlpha Full Stack Development Internship

**Developer:** Utkarsh Giri

A monorepo containing three full-stack web applications built during the CodeAlpha
Full Stack Development Internship. Each project is a self-contained
`backend/` (Node.js + Express + Prisma + PostgreSQL) and `frontend/`
(React + Vite + Tailwind CSS) application with JWT authentication.

---

## Projects

| Project | Category | Stack |
| --- | --- | --- |
| [NOVA MART](#nova-mart) | E-commerce store | React 19, Vite 8, Tailwind, Express 5, Prisma, PostgreSQL |
| [SYNCSPACE](#syncspace) | Real-time communication | React 18, Vite, Tailwind, Express 5, Socket.IO, WebRTC, Prisma, PostgreSQL |
| [FLOWBOARD](#flowboard) | Project management | React 18, Vite, Tailwind, Express 5, Prisma, PostgreSQL, Zod |

---

## NOVA MART

A storefront for a general-merchandise catalog, with search, filtering, sorting, a
persistent cart and wishlist, and a full checkout and order-history flow.

### Features

- Storefront homepage with hero, featured and trending sections
- Product listing with full-text search across name, brand, category and description
- Filtering by category, brand, price range, stock, featured and trending
- Sorting by relevance, newest, price (ascending/descending), rating, popularity and name
- Product detail pages addressed by id or slug, with related products
- Persistent cart with quantity control, merged for guest and signed-in shoppers
- Wishlist with add, add-many, toggle and remove
- Checkout with stock reservation and atomic order creation inside a transaction
- Order history with order detail, cancellation and order statistics
- Profile management including password change
- Role-based access control: a `USER` and an `ADMIN` role enforced server-side, where
  only admins can create, update or delete products, update order status, or read all
  orders via `?scope=all`
- AI search assist that refines a query against the live catalog

### Technologies

React 19, Vite 8, Tailwind CSS 3, React Router 7, Node.js, Express 5, Prisma 6,
PostgreSQL, JSON Web Tokens, bcrypt, Zod

### Repository

- Source: [`NOVA-MART/`](./NOVA-MART)

### Links

- GitHub: _pending_
- Live: _pending_

---

## SYNCSPACE

Real-time rooms for messaging, audio and video calls, screen sharing, file sharing
and a shared whiteboard.

### Features

- Email/password authentication with JWT sessions
- Rooms with generated join codes, membership tracking and ownership
- Real-time group chat over Socket.IO, persisted to PostgreSQL
- Peer-to-peer audio and video over WebRTC in a full mesh topology
- Camera and microphone mute toggles, broadcast live to every participant
- Screen sharing through `getDisplayMedia`, replacing the outgoing video track and
  returning to the camera when sharing stops
- Participant panel showing each user's name, audio, camera and screen state
- Live connection status indicator for the Socket.IO link
- File sharing with upload progress, enforced MIME and extension filters, and a size cap
- Collaborative whiteboard broadcasting strokes and clear events to the room
- AI chat summarise, message rewriting across five tones, and reply suggestions

### Technologies

React 18, Vite 5, Tailwind CSS 3, React Router 6, Node.js, Express 5, Socket.IO 4,
WebRTC, Multer, Prisma 6, PostgreSQL, JSON Web Tokens, bcrypt, Zod

### Known limitations

- WebRTC uses public STUN servers only. There is no TURN relay, so peers behind
  symmetric NAT or restrictive firewalls may fail to connect.
- Shared files are stored on the server's local disk rather than in object storage, so
  uploads do not survive a redeploy or scale-out.
- There is no renegotiation path, so a peer connection created before local media
  resolves may not carry media.

### Repository

- Source: [`SYNCSPACE/`](./SYNCSPACE)

### Links

- GitHub: _pending_
- Live: _pending_

---

## FLOWBOARD

A workspace for managing projects, teams and tasks on a Kanban board.

### Features

- Email/password authentication with JWT sessions
- Dashboard with aggregated project, task and activity statistics
- Projects with status tracking (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`)
- Team directory with cross-project user search
- Per-project membership with `OWNER`, `ADMIN` and `MEMBER` roles, enforced on every
  project, task and comment operation
- Kanban board with four columns - `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` - and
  drag and drop between them, persisted with optimistic updates and rollback
- Tasks with priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due dates and assignees
- Comments on tasks, with author-only deletion
- Activity feed recording project, member, task and comment events
- Search and filtering across projects and tasks
- Dark and light themes
- AI assistance for project descriptions, task descriptions, comment drafting by intent,
  and task suggestions

### Technologies

React 18, Vite 5, Tailwind CSS 3, React Router 6, Framer Motion, Node.js, Express 5,
Prisma 6, PostgreSQL, JSON Web Tokens, bcrypt, Zod, Helmet, express-rate-limit

### Known limitations

- Kanban drag and drop uses the native HTML5 drag-and-drop API, so it does not work
  with touch input on mobile browsers. Tasks can still be moved by status from the task
  detail view.
- Shared files in SYNCSPACE, not FLOWBOARD: FLOWBOARD has no file storage.

### Repository

- Source: [`FLOWBOARD/`](./FLOWBOARD)

### Links

- GitHub: _pending_
- Live: _pending_

---

## Repository layout

```
codealpha_tasks/
├── NOVA-MART/
│   ├── backend/       Express + Prisma REST API
│   └── frontend/      React + Vite storefront
├── SYNCSPACE/
│   ├── backend/       Express + Socket.IO + WebRTC signaling API
│   └── frontend/      React + Vite client
├── FLOWBOARD/
│   ├── backend/       Express + Prisma REST API
│   └── frontend/      React + Vite workspace
└── README.md
```

---

## Running a project locally

Each project follows the same shape.

```bash
# 1. Install dependencies
cd NOVA-MART/backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp .env.example .env      # backend, then fill in DATABASE_URL and JWT_SECRET
cp .env.example .env      # frontend, then set VITE_API_URL if needed

# 3. Create the database schema and seed it
cd ../backend
npm run db:migrate
npm run db:seed

# 4. Start the backend (default ports: NOVA MART 5000, SYNCSPACE 5004, FLOWBOARD 5001)
npm run dev

# 5. Start the frontend in a second terminal
cd ../frontend && npm run dev
```

Each backend also ships an embedded PostgreSQL for local development, so a local
database is not required:

```bash
cd backend && npm run db:local
```

The API health endpoint for each project is `GET /api/health`.

---

## Security

- `.env` files are excluded by `.gitignore` and are never committed. Only `.env.example`
  files with empty placeholders are tracked.
- Passwords are hashed with bcrypt. Password hashes are excluded from API responses by
  the Prisma select used for public user shapes.
- JWTs are signed with a secret that the backend refuses to start without when it is
  shorter than 32 characters.
- Request bodies are validated with Zod.
- CORS is an explicit origin allowlist configured with `CORS_ORIGIN`.
- Helmet sets security headers, and rate limiting is applied to the API and to
  authentication routes.
- File uploads are constrained by MIME type, extension and size.
- AI provider keys are optional server-side variables and are never exposed through
  `VITE_*` build variables.

## Environment variables

Every variable used by any project is listed in each project's `.env.example`. In
summary:

**Backend:** `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`CORS_ORIGIN`, plus `BCRYPT_ROUNDS`, `FREE_SHIPPING_THRESHOLD` and `SHIPPING_FEE`
(NOVA MART) and `MAX_FILE_MB` (SYNCSPACE).

**Optional AI providers:** `GEMINI_API_KEY`, `GROQ_API_KEY`. Each backend tries Gemini
first and falls back to Groq, and degrades to HTTP 503 when neither key is configured.

**Frontend:** `VITE_API_URL`, the public API origin. No secret is ever placed in a
`VITE_*` variable, because everything prefixed with `VITE_` is compiled into the
browser bundle.
