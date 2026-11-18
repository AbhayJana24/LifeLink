import Link from "next/link";
import { compatibleDonorGroups } from "@/lib/blood";
import { googleMapsDirectionsUrl } from "@/lib/geo";
import { listRequests } from "@/server/store";

export const dynamic = "force-dynamic";

const URGENCY_BADGE = {
  CRITICAL: "bg-red-600 text-white",
  URGENT: "bg-amber-500 text-white",
  STANDARD: "bg-neutral-800 text-white",
} as const;

export default function RequestsPage() {
  const requests = listRequests("ALL");

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Emergency Dispatch Board · Delhi NCR
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Urgent Blood & Plasma Requests
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Live hospital requests matched with nearby eligible donors via PostGIS & SMS alerts.
          </p>
        </div>
        <Link
          href="/requests/new"
          className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-200 hover:bg-red-700"
        >
          + Post Urgent Request
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {requests.map((req) => {
          const acceptedCount = req.responses.filter(
            (r) => r.status === "ACCEPTED" || r.status === "DONATED",
          ).length;
          const compat = compatibleDonorGroups(req.bloodGroup, req.donationType);

          return (
            <div
              key={req.id}
              className="flex flex-col justify-between rounded-2xl border border-red-100 bg-white p-6 shadow-sm transition hover:border-red-300"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${URGENCY_BADGE[req.urgency]}`}
                    >
                      {req.urgency}
                    </span>
                    <span className="rounded-full bg-red-50 px-3 py-0.5 text-xs font-semibold text-red-800">
                      {req.donationType === "PLASMA" ? "Plasma" : "Whole Blood"} · {req.units}{" "}
                      {req.units === 1 ? "unit" : "units"}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      req.status === "OPEN"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
                    <span className="text-lg font-black leading-none">{req.bloodGroup}</span>
                    <span className="mt-0.5 text-[10px] font-medium opacity-90">Needed</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">{req.hospitalName}</h2>
                    <p className="text-xs text-neutral-500">{req.hospitalAddress}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-800">
                      Patient: <span className="font-semibold">{req.patientName}</span>
                    </p>
                  </div>
                </div>

                {req.notes && (
                  <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                    {req.notes}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-neutral-500">Compatible donors:</span>
                  {compat.map((g) => (
                    <span
                      key={g}
                      className="rounded-md bg-red-50 px-2 py-0.5 font-bold text-red-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4 text-xs">
                <div className="text-neutral-600">
                  <strong className="text-neutral-900">{req.responses.length}</strong> nearby
                  donors alerted ·{" "}
                  <strong className="text-emerald-700">{acceptedCount} accepted</strong>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={googleMapsDirectionsUrl(req.location)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-neutral-200 px-3 py-1.5 font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Directions ↗
                  </a>
                  <Link
                    href={`/requests/${req.id}`}
                    className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700"
                  >
                    Manage / Respond →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
