# Sweety — Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking web application built with **Next.js (App Router)**, **Express.js**, **TypeScript**, and **PostgreSQL** (`pg`). Patients can securely register, log up to 4 daily glucose readings across meal and fasting slots, track trends with interactive charts, and review daily, month-to-date, and previous-month reports.

---

## Features

- **Authentication & User Isolation**:
  - Registration (`name`, `email`, `password`, `confirmPassword`), login, profile lookup (`/api/auth/me`), and logout.
  - Passwords hashed with `bcrypt`; stateless JWT bearer authentication; strict ownership checks on every reading and report endpoint.
- **Reading Management (CRUD & Strict Validation)**:
  - Add, view, edit, and delete readings (`reading_date`, `time_slot`, `glucose_value` in mg/dL) with pagination and date filtering.
  - Enforces all 5 business rules on both frontend (React Hook Form + Zod) and backend (Zod + PostgreSQL transactions & constraints):
    1. Required value (`"Please enter a glucose value."`)
    2. Whole number between `40` and `600` (`"Value must be between 40 and 600 mg/dl."`)
    3. One reading per time slot per day (`"You already have an After lunch reading for this date."`)
    4. Maximum 4 readings per day (`"You can add only 4 readings per day."`)
    5. No future dates (`"Date cannot be in the future."`)
- **Reporting & Visualization**:
  - **Daily report** (`/api/reports/daily?date=YYYY-MM-DD`): Highest, lowest, average (rounded to 1 decimal), count, and slot-ordered readings for the selected date.
  - **Month-to-date report** (`/api/reports/month-to-date?date=YYYY-MM-DD`): 1st of the selected month through the selected date.
  - **Monthly report** (`/api/reports/monthly?date=YYYY-MM-DD`): Entire previous calendar month (handles year rollovers and leap years).
  - **Interactive Recharts Trend Chart**: Responsive line chart powered by real PostgreSQL aggregation data.
- **Swagger / OpenAPI Documentation**: Interactive API docs served at `/api/docs`.

---

## Technology Stack

- **Frontend**: Next.js (App Router), React 18, TypeScript, Tailwind CSS, Shadcn UI (Radix primitives), TanStack Query, React Hook Form, Zod, Recharts, Lucide React.
- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL (`pg` direct SQL queries — no ORM), JWT, bcrypt, Zod, Swagger/OpenAPI (`swagger-ui-express`).
- **Testing**: Jest + Supertest (backend integration & unit tests), Jest + React Testing Library (frontend form tests).

---

## Architecture

```text
blood sugar/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment loading & PostgreSQL Pool
│   │   ├── database/        # SQL migrations, migrate runner & seed script
│   │   ├── middleware/      # JWT auth guard, Zod validation, error handler
│   │   ├── modules/
│   │   │   ├── auth/        # Register, login, logout, /me
│   │   │   ├── users/       # User repository & types
│   │   │   ├── readings/    # Transactional CRUD & business rule validation
│   │   │   └── reports/     # SQL aggregation queries for daily/MTD/monthly
│   │   ├── routes/          # API router & OpenAPI specification
│   │   ├── utils/           # Date math, password/JWT helpers, error classes
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/               # Jest + Supertest tests
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # /login, /register, /dashboard, /readings, /reports
│   │   ├── components/      # Shadcn UI primitives, AppShell, forms, charts
│   │   ├── hooks/           # TanStack Query hooks
│   │   ├── lib/             # Zod schemas, date/slot helpers
│   │   ├── providers/       # QueryClientProvider & AuthProvider
│   │   ├── services/        # Centralized REST API client
│   │   └── types/           # TypeScript interfaces
│   └── .env.example
├── docker-compose.yml       # PostgreSQL 16 Alpine service
└── .env.example
```

---

## Prerequisites

- **Node.js** `>= 20` and **npm**
- **Docker** and **Docker Compose** (for PostgreSQL)

---

## Installation & Setup

### 1. Clone and install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2. Environment Configuration

Copy the example environment files (never commit `.env` or `.env.local` files):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**Backend (`backend/.env`)**:
- `NODE_ENV=development`
- `PORT=5000`
- `DATABASE_HOST=localhost`
- `DATABASE_PORT=5432`
- `DATABASE_NAME=sweety`
- `DATABASE_USER=postgres`
- `DATABASE_PASSWORD=postgres`
- `JWT_SECRET=<your-secure-random-secret>`
- `JWT_EXPIRES_IN=7d`
- `FRONTEND_URL=http://localhost:3000`

**Frontend (`frontend/.env.local`)**:
- `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### 3. Start PostgreSQL with Docker

```bash
docker compose up -d postgres
```

### 4. Run Database Migrations

```bash
npm --prefix backend run migrate
```

### 5. Seed Sample Data

```bash
npm --prefix backend run seed
```

#### Demo Credentials
- **Email**: `demo@example.com`
- **Password**: `DemoUser123!`

---

## Running the Application

Start the backend API and frontend app in two separate terminals:

```bash
# Terminal 1 — Backend API (http://localhost:5000)
npm --prefix backend run dev

# Terminal 2 — Frontend App (http://localhost:3000)
npm --prefix frontend run dev
```

### Swagger / OpenAPI Documentation

Once the backend is running, open:
- **Swagger UI**: `http://localhost:5000/api/docs`
- **OpenAPI JSON**: `http://localhost:5000/api/docs.json`

---

## Running Tests

Ensure the Docker PostgreSQL container is running (`docker compose up -d postgres`), then run:

```bash
# Backend Jest + Supertest integration & unit tests
npm --prefix backend test

# Frontend Jest + React Testing Library tests
npm --prefix frontend test

# TypeScript checks & production build check
npm --prefix backend run typecheck
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

---

## Notes

### Assumptions
- **Dates & Timezones**: Readings represent calendar dates (`YYYY-MM-DD`) in the user's local calendar without time-of-day timestamps. Both `pg` (`DATE` type parser override) and the frontend treat dates as pure `YYYY-MM-DD` strings to prevent UTC off-by-one shifts. Future-date validation compares against the server's local calendar date.
- **Glucose Values**: Stored and validated strictly as whole integers in mg/dL (`40–600`).
- **Concurrency Safety**: Creating or updating a reading wraps daily count and slot uniqueness checks inside a PostgreSQL transaction locking the user record (`FOR UPDATE`), backed by database `UNIQUE` and `CHECK` constraints.

### Future Improvements
- Timezone-aware "today" validation passed or derived per user profile preference.
- CSV / PDF export for monthly doctor visits.
- Refresh token rotation with HttpOnly cookies and Redis-backed report caching.
- Automated reminders for incomplete daily logs.

