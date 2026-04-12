# McMillan Drilling – LMS Core (API + Database)

This repo is the **core Learning Management System backend** for competency-first training:
- Users & roles (ADMIN / SUPERVISOR / LEARNER)
- Competency catalogue (digital training matrix)
- Module shells (content comes later)
- Training sessions (group briefings / toolbox talks)
- Attendance + session assessments
- Competency awards (audit-ready)

Built for **Coolify + Postgres** and designed to support **individual learning and group assessed sessions**.

---

## Tech
- Node.js 20 (Express)
- Postgres
- Prisma ORM
- JWT auth + role-based access

---

## Quick start (local)

### 1) Start Postgres
```bash
docker compose up -d db
```

### 2) Install deps
```bash
npm i
```

### 3) Migrate & seed
```bash
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
```

### 4) Run API
```bash
npm run dev
```

API runs at `http://localhost:3000`.

Default seeded users:
- **Admin**: `admin@example.com` / `ChangeMe123!`
- **Supervisor**: `supervisor@example.com` / `ChangeMe123!`
- **Learner**: `learner@example.com` / `ChangeMe123!`

> Change these immediately in production.

---

## Deploy to Coolify

### Option 1: Coolify builds from this repo (recommended)
1. Create a **Postgres** service in Coolify.
2. Create a **New Application** from your GitHub repo.
3. Set environment variables (see `.env.example`).
4. Ensure the app exposes port **3000**.

This repo includes a production entrypoint that runs:
- `prisma migrate deploy`
- then starts the API

### Required env vars
- `DATABASE_URL` (points to Coolify Postgres)
- `JWT_SECRET`
- `CORS_ORIGIN` (your UI domain, optional)

---

## API overview

### Auth
- `POST /auth/login`  → { token }
- `GET /auth/me` (Bearer token)

### Competencies (ADMIN for create/update)
- `GET /competencies`
- `POST /competencies`
- `PATCH /competencies/:id`
- `POST /competencies/:id/award` (SUPERVISOR/ADMIN)

### Modules (shells)
- `GET /modules`
- `POST /modules` (ADMIN)
- `PATCH /modules/:id` (ADMIN)
- `PUT /modules/:id/competencies` (ADMIN) – map competencies to a module with evidence rules

### Training Sessions
- `GET /sessions`
- `POST /sessions` (SUPERVISOR/ADMIN)
- `GET /sessions/:id`
- `POST /sessions/:id/attendance` (SUPERVISOR/ADMIN)
- `POST /sessions/:id/assessments` (SUPERVISOR/ADMIN)

---

## Notes
- This is the **foundation**. The React LMS UI and actual learning modules plug into this API later.
- Competency awards are the single source of truth (audit safe).
