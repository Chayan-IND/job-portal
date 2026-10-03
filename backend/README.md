# Job Portal - Backend

## Stage 1: Core Auth & Security
- Security middleware: Helmet, CORS (locked to FRONTEND_URL), mongo-sanitize, hpp, compression, request-size limits
- MongoDB connection pooling + graceful shutdown
- Redis wrapper for caching + distributed rate limits, degrades gracefully if Redis is unavailable
- Extensible RBAC (Role collection + permissions), stateless JWT auth
- Register/login (with account lockout)/refresh/forgot-password/reset-password
- Centralized error handling, structured Winston logging
- `GET /api/health`, `npm run seed:roles`

## Stage 2: Jobs, Applications, Profiles, Uploads
- Job postings, applications (duplicate-proof via a unique DB index), student/company profiles
- Cloudinary uploads for resumes/logos (never touches local disk)
- PDFs preview inline in-browser; Word docs upload byte-exact (no auto-conversion distortion)
- Redis-cached public job listing, pagination everywhere (capped at 50/page)
- Notifications fire on new applications and status changes

## Stage 3 (this update): Polish
- Company logos + names merged into job listings (`GET /api/jobs`, `GET /api/jobs/:jobId`)
- Applicant counts per job on the company's own listing (`GET /api/jobs/mine`)
- New stats endpoints:
  - `GET /api/jobs/mine/stats` (company) - open/closed job counts, total applicants
  - `GET /api/applications/me/stats` (student) - application counts by status

## Setup
```bash
npm install
cp .env.example .env
npm run seed:roles
npm run dev
```
