# 🩸 LifeLink — Geospatial Blood & Plasma Donor Finder (Delhi NCR)

**LifeLink** matches urgent hospital blood and plasma requests across **Delhi NCR** with compatible, NBTC-eligible donors nearby in seconds—using **PostGIS** geospatial queries, interactive **Leaflet + OpenStreetMap** maps, **privacy-masked SMS alerts**, and an **offline-first PWA Emergency Donor ID Card**.

---

## ✨ Key Features

1. **Interactive Delhi NCR Donor Map (`/find`)**
   - Built with **Leaflet** and OpenStreetMap tiles (no API key required).
   - Filter across **12 major Delhi NCR hospitals** (AIIMS, Safdarjung, Sir Ganga Ram, RML, LNJP, Max Saket, Indraprastha Apollo, Fortis Escorts, Manipal Dwarka, Medanta Gurugram, Kailash Noida), browser **GPS Geolocation**, or click anywhere on the map to move the search pin.
   - Filter by recipient blood group (`O-` to `AB+`), component (`WHOLE_BLOOD` or `PLASMA`), and radius (`2 km` – `35 km`).
   - **Privacy-by-design**: public donor markers are snapped to a `~1.1 km` grid (`fuzzLocation`) so exact home addresses are never exposed.

2. **Whole Blood & Plasma Compatibility Engine (`src/lib/blood/compatibility.ts`)**
   - Full ABO + Rh red-cell compatibility (`O-` universal donor, `AB+` universal recipient).
   - Reversed ABO compatibility for **apheresis plasma** (`AB` universal plasma donor, `O` universal plasma recipient).

3. **NBTC Donor Eligibility Engine (`src/lib/blood/eligibility.ts`)**
   - Enforces age (`18–65`), minimum weight (`≥ 45 kg`), and recovery intervals (`90 days` male whole blood, `120 days` female whole blood, `14 days` plasma).
   - Computes exact cooldown days remaining and `nextEligibleAt` date.

4. **Urgent Request Broadcast & Privacy-Preserving SMS Lifecycle (`/requests`, `/requests/new`, `/requests/[id]`)**
   - Create an urgent request with Zod validation and live SMS character-count preview.
   - Automatically matches nearby eligible donors and dispatches SMS alerts (`console`, `Twilio`, or `Fast2SMS`).
   - Donor phone numbers remain **masked** (`+91 98XXX XXX01`) until the donor accepts the request, at which point their contact is unmasked for the patient's attendant.

5. **Donor Hub & Offline PWA Wallet Card (`/donor`)**
   - Register as a donor in Delhi NCR, toggle SMS availability, and view compatible requests near your locality.
   - Caches your **Emergency Donor ID Card** in `localStorage` + Service Worker (`public/sw.js`) so it works **100% offline**.

6. **SMS Gateway Audit Console (`/sms-log`)**
   - Inspect every outbound SMS payload, E.164 recipient, and delivery status (`LOGGED` / `SENT`).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Geospatial**: PostgreSQL + **PostGIS** (`geography(Point, 4326)`, `ST_DWithin`, `ST_Distance`, GiST spatial indexes) on **Supabase**, with **Drizzle ORM**
- **Maps**: Leaflet + OpenStreetMap
- **Auth**: Better Auth (`src/lib/auth.ts`)
- **Validation & Testing**: Zod v4 + Vitest unit test suite

---

## 🚀 Getting Started

```bash
cd "/Users/abhayjana/Documents/Portfolio Projects/LifeLink"
npm install
npm run dev
```

Open **http://localhost:3000** — the app works immediately out of the box with pre-seeded Delhi NCR hospitals, 18 donors, and 5 hospital requests!

### Connecting Your Supabase PostGIS Database (Optional Persistence)

1. In your Supabase project (`eomryyfzrbnfxdoudqjd`), go to **Database → Extensions** and enable **`postgis`**.
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `DIRECT_URL` with your Supabase password:
   ```bash
   cp .env.example .env
   ```
3. Push the PostGIS schema and seed the Delhi NCR dataset:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Running Tests & Typecheck

```bash
npm test            # Run all Vitest unit tests (compatibility, eligibility, geo, phone)
npm run typecheck   # Run Next.js route typegen + TypeScript compiler
npm run build       # Production build check
```
