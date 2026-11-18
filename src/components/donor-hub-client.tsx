"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BLOOD_GROUPS,
  checkEligibility,
  compatibleRecipientGroups,
  type BloodGroup,
  type DonationType,
  type Sex,
} from "@/lib/blood";
import { DELHI_LOCALITIES } from "@/lib/delhi-ncr";
import { formatDistance, haversineMeters } from "@/lib/geo";
import { formatPhone } from "@/lib/phone";
import type { BloodRequestRecord, DonorRecord } from "@/server/store";

interface DonorHubClientProps {
  initialDonors: DonorRecord[];
  openRequests: BloodRequestRecord[];
}

const OFFLINE_CARD_KEY = "lifelink_offline_donor_card_v1";

export function DonorHubClient({ initialDonors, openRequests }: DonorHubClientProps) {
  const [donors, setDonors] = useState<DonorRecord[]>(initialDonors);
  const [selectedId, setSelectedId] = useState<string>(initialDonors[0]?.id ?? "");
  const [tab, setTab] = useState<"card" | "register">("card");

  // Registration form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [sex, setSex] = useState<Sex>("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("1999-04-15");
  const [weightKg, setWeightKg] = useState(68);
  const [localityName, setLocalityName] = useState(DELHI_LOCALITIES[0].name);
  const [lat, setLat] = useState(DELHI_LOCALITIES[0].location.lat);
  const [lng, setLng] = useState(DELHI_LOCALITIES[0].location.lng);
  const [lastDonatedAt, setLastDonatedAt] = useState("");
  const [lastDonationType, setLastDonationType] = useState<DonationType>("WHOLE_BLOOD");
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const activeDonor = donors.find((d) => d.id === selectedId) ?? donors[0];

  // Persist active donor card to localStorage for offline PWA access
  useEffect(() => {
    if (!activeDonor) return;
    try {
      const payload = {
        donor: activeDonor,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_CARD_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [activeDonor]);

  if (!activeDonor) return null;

  const eligibility = checkEligibility({
    dateOfBirth: new Date(activeDonor.dateOfBirth),
    weightKg: activeDonor.weightKg,
    sex: activeDonor.sex,
    lastDonatedAt: activeDonor.lastDonatedAt ? new Date(activeDonor.lastDonatedAt) : null,
    lastDonationType: activeDonor.lastDonationType,
  });

  const canGiveWholeBloodTo = compatibleRecipientGroups(activeDonor.bloodGroup, "WHOLE_BLOOD");
  const canGivePlasmaTo = compatibleRecipientGroups(activeDonor.bloodGroup, "PLASMA");

  const matchingRequests = openRequests
    .filter((r) => {
      const recipients = compatibleRecipientGroups(activeDonor.bloodGroup, r.donationType);
      return recipients.includes(r.bloodGroup);
    })
    .map((r) => ({
      ...r,
      distanceM: Math.round(haversineMeters(activeDonor.location, r.location)),
    }))
    .sort((a, b) => a.distanceM - b.distanceM);

  const handleToggleAvailability = async () => {
    const res = await fetch("/api/donors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorId: activeDonor.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setDonors((prev) => prev.map((d) => (d.id === data.donor.id ? data.donor : d)));
    }
  };

  const handleUseGps = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(Number(pos.coords.latitude.toFixed(4)));
      setLng(Number(pos.coords.longitude.toFixed(4)));
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          bloodGroup,
          sex,
          dateOfBirth,
          weightKg,
          area: localityName,
          lat,
          lng,
          lastDonatedAt: lastDonatedAt || undefined,
          lastDonationType: lastDonatedAt ? lastDonationType : undefined,
          smsOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstErr = Object.values(data.errors ?? {})[0] as string | undefined;
        setFormError(firstErr ?? "Please check your inputs.");
        return;
      }
      setDonors((prev) => [data.donor, ...prev]);
      setSelectedId(data.donor.id);
      setTab("card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Active Donor Profile:
          </label>
          <select
            value={activeDonor.id}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setTab("card");
            }}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm font-semibold focus:border-red-500 focus:outline-none"
          >
            {donors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.bloodGroup} · {d.area})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("card")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === "card"
                ? "bg-red-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            🪪 Donor ID & Matches
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === "register"
                ? "bg-red-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            + Register as New Donor
          </button>
        </div>
      </div>

      {tab === "register" ? (
        <form
          onSubmit={handleRegister}
          className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-red-100 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Register as a Verified Delhi NCR Donor
            </h2>
            <p className="text-xs text-neutral-500">
              Your exact coordinates are never shown publicly and your phone number remains masked
              until you accept a request.
            </p>
          </div>

          {formError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aakash Malhotra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Indian Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="9811099887"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm"
              />
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
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold"
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
                Sex *
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
              >
                <option value="MALE">Male (90d gap)</option>
                <option value="FEMALE">Female (120d gap)</option>
                <option value="OTHER">Other (90d gap)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Weight (kg) *
              </label>
              <input
                type="number"
                min={40}
                max={200}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Delhi NCR Locality *
              </label>
              <select
                value={localityName}
                onChange={(e) => {
                  const locName = e.target.value;
                  setLocalityName(locName);
                  const found = DELHI_LOCALITIES.find((l) => l.name === locName);
                  if (found) {
                    setLat(found.location.lat);
                    setLng(found.location.lng);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm"
              >
                {DELHI_LOCALITIES.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase text-neutral-600">
                  Coordinates
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-600"
                />
              </div>
              <button
                type="button"
                onClick={handleUseGps}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                📍 Use GPS
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Last Donation Date (Leave blank if never)
              </label>
              <input
                type="date"
                value={lastDonatedAt}
                onChange={(e) => setLastDonatedAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600">
                Last Donation Type
              </label>
              <select
                value={lastDonationType}
                onChange={(e) => setLastDonationType(e.target.value as DonationType)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm"
              >
                <option value="WHOLE_BLOOD">Whole Blood</option>
                <option value="PLASMA">Plasma (14-day gap)</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={smsOptIn}
              onChange={(e) => setSmsOptIn(e.target.checked)}
              className="h-4 w-4 rounded accent-red-600"
            />
            Receive emergency SMS alerts when a nearby hospital needs {bloodGroup}
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-md hover:bg-red-700"
          >
            {saving ? "Saving Donor Profile..." : "Complete Donor Registration"}
          </button>
        </form>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Offline-Ready Emergency Donor Wallet Card + NBTC Eligibility */}
          <div className="space-y-5 lg:col-span-5">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-red-700 via-red-600 to-rose-800 p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight">🩸 LifeLink</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Offline PWA Card
                  </span>
                </div>
                <span className="font-mono text-xs opacity-80">ID: {activeDonor.id}</span>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-red-100">Registered Donor</p>
                  <h2 className="text-2xl font-extrabold">{activeDonor.name}</h2>
                  <p className="mt-0.5 text-xs text-red-100">
                    📍 {activeDonor.area}, Delhi NCR · {formatPhone(activeDonor.phone)}
                  </p>
                </div>
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-white text-red-700 shadow-inner">
                  <span className="text-3xl font-black leading-none">{activeDonor.bloodGroup}</span>
                  <span className="mt-1 text-[9px] font-bold uppercase tracking-wider">
                    ABO / Rh
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-black/20 p-3.5 text-xs">
                <div>
                  <p className="text-[10px] uppercase text-red-200">Can Donate Red Cells To</p>
                  <p className="mt-0.5 font-bold">{canGiveWholeBloodTo.join(", ")}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-red-200">Can Donate Plasma To</p>
                  <p className="mt-0.5 font-bold">{canGivePlasmaTo.join(", ")}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-red-100">
                <span>
                  Status:{" "}
                  <strong>
                    {eligibility.eligible ? "✓ NBTC Eligible Now" : "⏳ Post-Donation Cooldown"}
                  </strong>
                </span>
                <span>✓ Cached to device storage for offline mode</span>
              </div>
            </div>

            {/* Eligibility & Availability Controls */}
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Emergency SMS Availability
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Pause alerts when travelling outside Delhi NCR
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    activeDonor.isAvailable
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {activeDonor.isAvailable ? "● Available" : "Paused"}
                </button>
              </div>

              <div className="mt-4 border-t border-neutral-100 pt-4 text-xs">
                <p className="font-semibold text-neutral-700">NBTC Screening Summary:</p>
                {eligibility.eligible ? (
                  <p className="mt-1 text-emerald-700">
                    ✓ Meets age (18–65), weight ({activeDonor.weightKg} kg ≥ 45 kg), and inter-donation
                    interval rules.
                  </p>
                ) : (
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-amber-700">
                    {eligibility.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right: Compatible Urgent Requests Near This Donor */}
          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm lg:col-span-7">
            <h2 className="text-lg font-bold text-neutral-900">
              Compatible Urgent Requests for {activeDonor.name} ({activeDonor.bloodGroup})
            </h2>
            <p className="text-xs text-neutral-500">
              Open hospital requests in Delhi NCR where your {activeDonor.bloodGroup} donation is
              compatible, sorted by distance from {activeDonor.area}.
            </p>

            {matchingRequests.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-500">
                No open requests currently need {activeDonor.bloodGroup}.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {matchingRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 hover:border-red-200 hover:bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          {r.urgency}
                        </span>
                        <span className="text-xs font-bold text-red-700">
                          Patient needs {r.bloodGroup} (
                          {r.donationType === "PLASMA" ? "Plasma" : "Whole Blood"} · {r.units}u)
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-neutral-900">{r.hospitalName}</p>
                      <p className="text-xs text-neutral-500">
                        {formatDistance(r.distanceM)} from {activeDonor.area} · Patient:{" "}
                        {r.patientName}
                      </p>
                    </div>
                    <Link
                      href={`/requests/${r.id}`}
                      className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700"
                    >
                      Respond to Alert →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
