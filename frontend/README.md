# Job Portal - Frontend (React + Vite)

## Core features
- Public job board (search, filters, pagination) as the homepage
- Student flow: browse → apply → track applications → edit profile → upload resume
- Company flow: post jobs → manage postings → review applicants → update status → edit profile → upload logo
- Notifications with unread indicator
- JWT auth with automatic token refresh

## Polish (this update)
- Company logos shown on job cards, job detail page, and the navbar (when logged in as a company)
- Debounced search/location filters (fires 400ms after you stop typing, not on every keystroke)
- Stats bars on both dashboards (open jobs/applicants for companies; application status breakdown for students)
- "Posted X days ago" + applicant counts on job cards
- Toast notifications (bottom-right) instead of plain inline text for success/error feedback
- Proper 404 page for unmatched routes
- Skeleton loading placeholders on the job listing

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```
Runs at `http://localhost:5173`.

## Build for production
```bash
npm run build
```
