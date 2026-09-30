# NOVA MART — Simple Ecommerce Store

> **CodeAlpha Full Stack Development Internship — Task 1**
> A production-style, full-stack e-commerce storefront: **React + Vite + Tailwind CSS** frontend, **Node.js + Express + Prisma + PostgreSQL** backend, JWT auth, and a fully seeded demo catalogue.

## ✨ Features

**Storefront**
- Responsive premium UI (mobile → desktop) with product grid, category nav, search
- Product listing with **search, category/price filters, in-stock filter, sorting**
- Product detail page: image gallery, specs, reviews, related products
- Persistent **shopping cart** (guest + login merge), quantity controls, remove
- **Checkout** with full validation → order creation → confirmation page
- Order history & order detail, wishlist, account profile

**Auth & security**
- Register / login with JWT (`Bearer`), bcrypt password hashing
- Zod request validation, Helmet security headers, rate limiting, CORS
- Role-based admin endpoints (product/order management)

**Backend**
- REST API under `/api`, layered `controllers → services → Prisma`
- PostgreSQL via Prisma ORM with migrations + demo seed (catalogue, users, orders)
- Runs with Docker Postgres **or** one-command embedded Postgres (no install)

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 3, React Router 7, lucide-react |
| Backend | Node.js ≥18, Express 5, Zod, JWT, Helmet, express-rate-limit |
| Database | PostgreSQL 17 + Prisma ORM (typed client, migrations, seed) |
| DevOps | Docker Compose (optional), embedded Postgres fallback |

## 📦 Project Structure

```
CodeAlpha_Simple_Ecommerce_Store/
├── backend/
│   ├── prisma/            # schema, migrations, seed, demo product data
│   ├── scripts/           # local embedded-postgres helper
│   └── src/
│       ├── controllers/   # request → service → response mapping
│       ├── services/      # business logic
│       ├── routes/        # /api routers
│       └── server.js      # express app entry
├── frontend/
│   └── src/
│       ├── pages/         # Home, Shop, Product, Cart, Checkout, Orders, Account…
│       ├── components/    # layout, product, cart, ui primitives
│       ├── context/       # Auth / Cart / Wishlist providers
│       └── lib/api.js      # typed fetch client (envelope-unwrapping)
├── docker-compose.yml     # optional one-command PostgreSQL
└── package.json           # workspace scripts
```

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
Copy the example env files and adjust if needed:
```bash
# backend/.env  (see backend/.env.example)
DATABASE_URL="postgresql://nova:nova@localhost:5432/novamart?schema=public"
JWT_SECRET="change-me"
PORT=5000

# frontend/.env  (see frontend/.env.example)
VITE_API_URL="http://localhost:5000/api"
```

### 3. Start PostgreSQL — pick one
**Option A — Docker**
```bash
docker compose up -d
```
**Option B — embedded Postgres (no install)**
```bash
npm --prefix backend run db:local
```

### 4. Migrate + seed the database
```bash
npm run db:setup
```

### 5. Run in development (two terminals)
```bash
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173
```

### Production build
```bash
npm run build          # outputs frontend/dist
npm --prefix backend start
```

## 🔌 API Overview

Base URL: `http://localhost:5000/api`

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password` |
| Products | `GET /products` (search/filter/sort), `GET /products/:slug`, `GET /products/summary`, `GET /categories` |
| Cart | `GET /cart`, `POST /cart`, `PATCH /cart/:itemId`, `DELETE /cart/:itemId`, `DELETE /cart`, `POST /cart/merge` |
| Wishlist | `GET /wishlist`, `POST /wishlist/:productId` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` |
| Admin | `POST/PATCH/DELETE /products…`, `GET/PATCH /admin/orders…` (role-guarded) |

Responses follow the envelope `{ success, data, message? }`; detail/create resources are nested (`data.product`, `data.order`).

## ✅ Verification

- **60/60 backend integration tests pass** — auth, RBAC, validation, products, cart, wishlist, orders, stock & persistence
- `prisma validate` ✔ · `prisma migrate status` ✔ · `npm run build` ✔
- Browser flows verified end-to-end: browse → detail → cart → checkout → order history

## 📄 License

MIT — built for the CodeAlpha internship program.
