# 🩸 LifeLink

Find compatible, eligible **blood & plasma donors near you** and alert them instantly.

> Portfolio / capstone project, under active development.

## Tech stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL + PostGIS (Supabase) · Prisma · Leaflet · Vitest

## Features (roadmap)
- [x] Blood compatibility engine (whole blood + plasma), unit tested
- [x] Donor eligibility rules (age, weight, donation gap), unit tested
- [ ] Database schema with PostGIS + seed data (Delhi NCR)
- [ ] Auth & roles (Donor / Requester / Admin)
- [ ] Donor onboarding with browser geolocation
- [ ] Urgent requests + nearby donor matching (`ST_DWithin`)
- [ ] Map view (Leaflet + OpenStreetMap)
- [ ] SMS alerts + accept flow
- [ ] PWA + offline support
- [ ] CI, E2E tests, deploy

## Project structure
```
src/
  app/                 # Routes (App Router)
  components/          # UI components
  lib/blood/           # Pure domain logic: compatibility, eligibility (+ tests)
```

## Getting started
```bash
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev            # http://localhost:3000
npm test               # unit tests
```
