"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DelhiMap } from "@/components/delhi-map";
import {
  BLOOD_GROUPS,
  compatibleDonorGroups,
  type BloodGroup,
  type DonationType,
} from "@/lib/blood";
import { DELHI_HOSPITALS } from "@/lib/delhi-ncr";
import type { LngLat } from "@/lib/geo";
import { donorAlertMessage } from "@/lib/messages";
import type { Urgency } from "@/lib/validation";
import type { MatchedDonor } from "@/server/store";

export default function NewRequestPage() {
  const router = useRouter();
  const defaultHospital = DELHI_HOSPITALS[0];

  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("B-");
  const [donationType, setDonationType] = useState<DonationType>("WHOLE_BLOOD");
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<Urgency>("CRITICAL");
  const [hospitalPreset, setHospitalPreset] = useState(defaultHospital.id);
  const [hospitalName, setHospitalName] = useState(defaultHospital.name);
  const [hospitalAddress, setHospitalAddress] = useState(defaultHospital.address);
  const [location, setLocation] = useState<LngLat>(defaultHospital.location);
  const [contactPhone, setContactPhone] = useState("9811550999");
  const [hoursNeeded, setHoursNeeded] = useState(6);
  const [radiusKm, setRadiusKm] = useState(15);
  const [notes, setNotes] = useState("");
  const [nearbyDonors, setNearbyDonors] = useState<MatchedDonor[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radiusKm: String(radiusKm),
      bloodGroup,
      donationType,
      onlyEligible: "true",
    });
    fetch(`/api/donors/search?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setNearbyDonors(d.donors ?? []))
      .catch(() => {});
  }, [location, radiusKm, bloodGroup, donationType]);

  const sampleSms = donorAlertMessage({
    requestId: "req-preview",
    bloodGroup,
    donationType,
    units,
    hospitalName: hospitalName || "AIIMS New Delhi",
    distanceM: nearbyDonors[0]?.distanceM ?? 1400,
    urgency,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const neededBy = new Date(Date.now() + hoursNeeded * 3600 * 1000).toISOString();
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          bloodGroup,
          donationType,
          units,
          hospitalName,
          hospitalAddress,
          contactPhone,
          urgency,
          neededBy,
          notes,
          lat: location.lat,
          lng: location.lng,
          radiusKm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { form: "Please check the form inputs." });
        return;
      }
      router.push(`/requests/${data.request.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const compat = compatibleDonorGroups(bloodGroup, donationType);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Emergency Broadcast · PostGIS + SMS
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Post an Urgent Blood or Plasma Request
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          We automatically match compatible, NBTC-eligible donors within {radiusKm} km and dispatch
          instant SMS alerts.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-red-100 bg-white p-6 shadow-sm lg:col-span-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rameshwar Verma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              />
              {errors.patientName && (
                <p className="mt-1 text-xs text-red-600">{errors.patientName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Attendant Mobile (10-digit India) *
              </label>
              <input
                type="tel"
                required
                placeholder="9811550999"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              />
              {errors.contactPhone && (
                <p className="mt-1 text-xs text-red-600">{errors.contactPhone}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Blood Group *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-bold focus:border-red-500 focus:outline-none"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Component
              </label>
              <select
                value={donationType}
                onChange={(e) => setDonationType(e.target.value as DonationType)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-semibold focus:border-red-500 focus:outline-none"
              >
                <option value="WHOLE_BLOOD">Whole Blood</option>
                <option value="PLASMA">Plasma</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Units Needed
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-semibold focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-bold text-red-700 focus:border-red-500 focus:outline-none"
              >
                <option value="CRITICAL">CRITICAL (&lt;6h)</option>
                <option value="URGENT">URGENT (&lt;24h)</option>
                <option value="STANDARD">STANDARD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-600">
              Select Delhi NCR Hospital Preset (or click map to pin)
            </label>
            <select
              value={hospitalPreset}
              onChange={(e) => {
                const id = e.target.value;
                setHospitalPreset(id);
                const h = DELHI_HOSPITALS.find((item) => item.id === id);
                if (h) {
                  setHospitalName(h.name);
                  setHospitalAddress(h.address);
                  setLocation(h.location);
                }
              }}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm font-medium focus:border-red-500 focus:outline-none"
            >
              {DELHI_HOSPITALS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.area}
                </option>
              ))}
              <option value="custom">Custom Delhi NCR Hospital</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Hospital Name *
              </label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Hospital Address *
              </label>
              <input
                type="text"
                required
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Needed Within (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={72}
                value={hoursNeeded}
                onChange={(e) => setHoursNeeded(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs font-semibold uppercase text-neutral-600">
                <span>SMS Broadcast Radius</span>
                <span className="text-red-600">{radiusKm} km</span>
              </label>
              <input
                type="range"
                min={5}
                max={30}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="mt-3 w-full accent-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-600">
              Clinical / Ward Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Report to Gate 2 Blood Bank counter, room 104."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* SMS Preview Box */}
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-red-900">
              <span>📱 Outbound SMS Preview ({sampleSms.length} chars)</span>
              <span>
                Will alert <strong>{Math.min(8, nearbyDonors.length)}</strong> eligible donors (
                {compat.join(", ")})
              </span>
            </div>
            <p className="mt-1.5 font-mono text-xs text-neutral-800">{sampleSms}</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:opacity-50"
          >
            {submitting
              ? "Broadcasting SMS Alerts..."
              : `Create Request & Alert ${Math.min(8, nearbyDonors.length)} Nearby Donors`}
          </button>
        </form>

        {/* Live Map Preview */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-900">
              Live Coverage Around Selected Hospital ({nearbyDonors.length} compatible eligible
              donors)
            </h2>
            <p className="mt-0.5 mb-3 text-xs text-neutral-500">
              Click anywhere on the map to adjust the hospital coordinates.
            </p>
            <DelhiMap
              center={location}
              radiusKm={radiusKm}
              donors={nearbyDonors}
              onPickLocation={(coords) => {
                setLocation(coords);
                setHospitalPreset("custom");
              }}
              heightClass="h-[420px]"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
