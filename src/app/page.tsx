import Link from "next/link";
import { CompatibilityChart } from "@/components/compatibility-chart";
import { getPlatformStats, listRequests } from "@/server/store";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "PostGIS Geospatial Matching",
    body: "Finds compatible donors within 2–35 km of any Delhi NCR hospital using ST_DWithin & GiST spatial indexes, sorted by distance.",
  },
  {
    title: "NBTC Eligibility Engine",
    body: "Automatically enforces 18–65 age, ≥45 kg weight, and 90-day (male) / 120-day (female) / 14-day (plasma) recovery intervals.",
  },
  {
    title: "Privacy-First SMS Alerts",
    body: "Donors' exact coordinates are fuzzed to a ~1 km grid and phone numbers stay masked (+91 98XXX XXX01) until they accept.",
  },
  {
    title: "Offline-Ready PWA & Donor ID",
    body: "Installable Progressive Web App with a Service Worker and locally cached Emergency Donor Wallet Card that works without internet.",
  },
];

export default function Home() {
  const stats = getPlatformStats();
  const openRequests = listRequests("OPEN").slice(0, 4);

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-12 text-center sm:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          Live across {stats.hospitalsCovered} Delhi NCR Major Hospitals · PostGIS + Leaflet + SMS
        </div>
        <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Match urgent hospital blood requests with{" "}
          <span className="text-red-600">nearby eligible donors</span> in seconds.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-neutral-600 sm:text-lg">
          No more forwarding panicked messages across WhatsApp groups. LifeLink locates compatible,
          NBTC-eligible blood and plasma donors within kilometres of the hospital and alerts them
          by SMS.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/find"
            className="rounded-full bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
          >
            🗺️ Open Live Delhi NCR Donor Map
          </Link>
          <Link
            href="/requests/new"
            className="rounded-full border border-red-200 bg-white px-7 py-3.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
          >
            🚨 Post Urgent Blood Request
          </Link>
          <Link
            href="/donor"
            className="rounded-full border border-neutral-200 bg-white px-7 py-3.5 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
          >
            🪪 Donor Hub & Offline ID Card
          </Link>
        </div>

        {/* Live Metrics Strip */}
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs">
            <p className="text-2xl font-black text-red-600">{stats.eligibleDonors}</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500">
              Eligible Donors Ready in NCR
            </p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs">
            <p className="text-2xl font-black text-neutral-900">{stats.openRequests}</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500">Active Emergency Requests</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs">
            <p className="text-2xl font-black text-emerald-600">{stats.smsDispatched}</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500">SMS Alerts Dispatched</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-xs">
            <p className="text-2xl font-black text-neutral-900">{stats.hospitalsCovered}</p>
            <p className="mt-0.5 text-xs font-medium text-neutral-500">Delhi NCR Blood Banks</p>
          </div>
        </div>
      </section>

      {/* Active Emergency Requests Preview */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Active Emergency Requests in Delhi NCR
            </h2>
            <p className="text-sm text-neutral-600">
              Click any request to inspect matched donors, simulate SMS acceptance, or get
              directions.
            </p>
          </div>
          <Link href="/requests" className="text-sm font-bold text-red-600 hover:underline">
            View all requests →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {openRequests.map((r) => (
            <Link
              key={r.id}
              href={`/requests/${r.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-red-100 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {r.urgency}
                  </span>
                  <span className="text-xs font-bold text-red-700">
                    {r.bloodGroup} · {r.units}u
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-neutral-900 group-hover:text-red-600">
                  {r.hospitalName}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">Patient: {r.patientName}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-600">
                <span>{r.responses.length} donors alerted</span>
                <span className="font-semibold text-red-600">Respond →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Engineering Highlights */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-center text-2xl font-bold">How LifeLink Works Under the Hood</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rounded-2xl border border-red-100 bg-white p-5 shadow-xs"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-xs font-black text-red-700">
                0{i + 1}
              </span>
              <h3 className="mt-3 text-base font-bold text-neutral-900">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compatibility Matrix */}
      <section id="chart" className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="text-center text-2xl font-bold">Whole Blood Compatibility Matrix</h2>
        <p className="mt-2 mb-6 text-center text-sm text-neutral-600">
          Computed live from LifeLink&apos;s unit-tested matching engine (`src/lib/blood`). O− is
          the universal red-cell donor; AB+ is the universal recipient.
        </p>
        <CompatibilityChart />
      </section>
    </main>
  );
}
