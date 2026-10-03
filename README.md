# Job Portal

A full-stack job portal where **companies post jobs and review applicants** and **students browse, apply and track their applications**. Built with React, Node.js/Express and MongoDB, with role-based access control, automated tests, Docker and a CI pipeline.

![CI](https://github.com/Chayan-IND/job-portal/actions/workflows/ci.yml/badge.svg)

**Live demo:** _coming soon_

## Screenshots

_Add 3 or 4 screenshots here (job board, student dashboard, company dashboard, applicants page)._

<!-- ![Job board](docs/job-board.png) -->

## Features

**Students**
- Browse and search jobs with filters (type, location, skills) and pagination
- Apply with a cover note, using an uploaded resume (PDF or Word)
- Track every application and its status (applied, shortlisted, rejected, hired)
- Dashboard with application stats, profile editing, notifications

**Companies**
- Post, edit, close and delete jobs
- Review applicants per job and update their status (the student is notified)
- Company profile with logo upload, dashboard with open jobs and applicant counts

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express 4, Mongoose, JWT |
| Database | MongoDB (Atlas in production) |
| Cache | Redis (optional; the app works without it) |
| File storage | Cloudinary (resumes, logos) |
| Testing | Jest, Supertest, mongodb-memory-server |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Engineering highlights

- **Authentication and security:** JWT access and refresh tokens, bcrypt password hashing, account lockout after 5 failed logins, generic login errors (no user enumeration), hashed single-use password-reset tokens.
- **Role-based access control:** a `Role` collection with permissions (`job:create`, `application:update_status`, ...). Routes check the specific permission, and ownership checks stop one company from touching another's jobs or applicants.
- **Hardening:** Helmet, CORS locked to the frontend URL, NoSQL-injection sanitising, HTTP parameter pollution protection, request-size limits, per-route rate limiting.
- **Data integrity:** a unique database index makes duplicate applications impossible, even under concurrent requests.
- **Resilience:** Redis caching for the public job list that degrades gracefully when Redis is down; graceful shutdown; structured Winston logging; centralized error handling.
- **Quality:** 77 automated API tests (auth, jobs, applications, RBAC, input validation, security) with about 82% line coverage on the backend.
- **CI:** every push runs lint, the full test suite, the frontend build and both Docker image builds on GitHub Actions.

## Architecture

```
React (Vite) ──HTTPS──> Express API ──> MongoDB
                           │
                           ├──> Redis (optional cache + rate-limit store)
                           └──> Cloudinary (resume / logo files)
```

## Run locally

Requirements: Node.js 20+, a MongoDB instance (local or Atlas).

```bash
# backend
cd backend
npm install
cp .env.example .env        # then fill in the values
npm run seed:roles          # creates the student / company / admin roles (run once)
npm run dev                 # http://localhost:5000

# frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

## Run with Docker

```bash
cp backend/.env.example backend/.env     # then fill in the values
docker compose up --build
docker compose exec backend npm run seed:roles    # first run only
```

Frontend: http://localhost:8080 | API health check: http://localhost:5000/api/health

## Tests

```bash
cd backend
npm test
```

Tests use an in-memory MongoDB, so no database setup is needed. Set `TEST_MONGO_URI` to run them against a real MongoDB instead.

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `login`, `refresh`, `forgot-password`, `reset-password`, `GET /api/auth/me` |
| Jobs | `GET /api/jobs`, `GET /api/jobs/:id`, `POST /api/jobs`, `PATCH/DELETE /api/jobs/:id`, `GET /api/jobs/mine`, `GET /api/jobs/mine/stats` |
| Applications | `POST /api/applications/jobs/:jobId/apply`, `GET /api/applications/me`, `GET /api/applications/me/stats`, `GET /api/applications/jobs/:jobId`, `PATCH /api/applications/:id/status` |
| Profiles | `GET/PATCH /api/students/me`, `GET/PATCH /api/companies/me`, resume and logo uploads |
| Other | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `GET /api/health` |

## Known limitations

- Forgot-password generates and stores a secure reset token, but **email delivery is not connected yet**, so the reset link is only logged on the server.
- No admin UI yet. The admin role exists in the permission system.

## Author

**Chayan Choudhury** - [GitHub](https://github.com/Chayan-IND)
