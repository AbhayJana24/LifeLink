"use client";

import Link from "next/link";
import { useState } from "react";
import { DelhiMap } from "@/components/delhi-map";
import { compatibleDonorGroups } from "@/lib/blood";
import { formatDistance, googleMapsDirectionsUrl } from "@/lib/geo";
import { formatPhone } from "@/lib/phone";
import type { BloodRequestRecord, MatchedDonor } from "@/server/store";

interface RequestDetailClientProps {
  initialRequest: BloodRequestRecord;
  nearbyDonors: MatchedDonor[];
}

export function RequestDetailClient({
  initialRequest,
  nearbyDonors,
}: RequestDetailClientProps) {
  const [req, setReq] = useState<BloodRequestRecord>(initialRequest);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDonorAction = async (
    donorId: string,
    action: "ACCEPTED" | "DECLINED" | "DONATED",
  ) => {
    setBusyId(donorId);
    try {
      const res = await fetch(`/api/requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        setReq(data.request);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (status: "OPEN" | "FULFILLED" | "CANCELLED") => {
    setBusyId("status");
    try {
      const res = await fetch(`/api/requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setReq(data.request);
      }
    } finally {
      setBusyId(null);
    }
  };

  const compat = compatibleDonorGroups(req.bloodGroup, req.donationType);
  const acceptedCount = req.responses.filter(
    (r) => r.status === "ACCEPTED" || r.status === "DONATED",
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
            <span className="text-2xl font-black leading-none">{req.bloodGroup}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase">
              {req.donationType === "PLASMA" ? "Plasma" : "Blood"}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white">
                {req.urgency}
              </span>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                  req.status === "OPEN"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-neutral-200 text-neutral-800"
                }`}
              >
                Status: {req.status}
              </span>
              <span className="text-xs text-neutral-500">
                {req.units} {req.units === 1 ? "unit" : "units"} needed
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900">{req.hospitalName}</h1>
            <p className="text-sm text-neutral-600">{req.hospitalAddress}</p>
            <p className="mt-1 text-sm text-neutral-800">
              Patient: <strong>{req.patientName}</strong> · Attendant:{" "}
              <strong className="font-mono">{formatPhone(req.contactPhone)}</strong>
            </p>
            {req.notes && (
              <p className="mt-2 rounded-xl bg-red-50/70 px-3 py-2 text-xs text-red-950">
                {req.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={googleMapsDirectionsUrl(req.location)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            🗺️ Google Maps Directions ↗
          </a>
          {req.status === "OPEN" ? (
            <button
              type="button"
              disabled={busyId === "status"}
              onClick={() => handleStatusChange("FULFILLED")}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              ✓ Mark Request Fulfilled
            </button>
          ) : (
            <button
              type="button"
              disabled={busyId === "status"}
              onClick={() => handleStatusChange("OPEN")}
              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
            >
              Reopen Request
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Donor Responses & Lifecycle + Map */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Alerted Donors & Privacy-Protected Responses ({req.responses.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Phone numbers stay masked (`XXX`) until a donor accepts the SMS alert.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {acceptedCount} Accepted / Donated
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {req.responses.map((resp) => {
                const isAccepted = resp.status === "ACCEPTED" || resp.status === "DONATED";
                return (
                  <li
                    key={resp.id}
                    className={`rounded-xl border p-4 transition ${
                      isAccepted
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-neutral-100 bg-neutral-50/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white">
                          {resp.donorBloodGroup}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-neutral-900">{resp.donorName}</p>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                resp.status === "DONATED"
                                  ? "bg-emerald-700 text-white"
                                  : resp.status === "ACCEPTED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : resp.status === "DECLINED"
                                      ? "bg-neutral-200 text-neutral-600"
                                      : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {resp.status}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600">
                            {resp.donorArea} ·{" "}
                            <strong>{formatDistance(resp.distanceM)}</strong> from hospital
                          </p>
                          <p className="mt-1 font-mono text-xs font-semibold text-neutral-800">
                            📞 {resp.donorPhoneDisplay}{" "}
                            {isAccepted ? (
                              <span className="text-[11px] font-normal text-emerald-700">
                                (Unmasked — donor consented)
                              </span>
                            ) : (
                              <span className="text-[11px] font-normal text-neutral-400">
                                (Masked until donor accepts)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Demo Controls to simulate donor one-tap SMS link */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {resp.status !== "ACCEPTED" && resp.status !== "DONATED" && (
                          <button
                            type="button"
                            disabled={busyId === resp.donorId}
                            onClick={() => handleDonorAction(resp.donorId, "ACCEPTED")}
                            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Accept & Unmask Phone
                          </button>
                        )}
                        {resp.status === "ACCEPTED" && (
                          <button
                            type="button"
                            disabled={busyId === resp.donorId}
                            onClick={() => handleDonorAction(resp.donorId, "DONATED")}
                            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Record Unit Donated
                          </button>
                        )}
                        {resp.status === "NOTIFIED" && (
                          <button
                            type="button"
                            disabled={busyId === resp.donorId}
                            onClick={() => handleDonorAction(resp.donorId, "DECLINED")}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
              <span>Compatible donor groups: {compat.join(", ")}</span>
              <Link href="/sms-log" className="font-semibold text-red-600 hover:underline">
                Inspect SMS Dispatch Log →
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DelhiMap
            center={req.location}
            radiusKm={15}
            donors={nearbyDonors}
            requests={[
              {
                id: req.id,
                patientName: req.patientName,
                bloodGroup: req.bloodGroup,
                hospitalName: req.hospitalName,
                urgency: req.urgency,
                units: req.units,
                location: req.location,
              },
            ]}
            heightClass="h-[460px]"
          />
        </div>
      </div>
    </div>
  );
}
