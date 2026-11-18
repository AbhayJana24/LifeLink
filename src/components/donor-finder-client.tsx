"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DelhiMap, type MapRequestPin } from "@/components/delhi-map";
import {
  BLOOD_GROUPS,
  compatibleDonorGroups,
  type BloodGroup,
  type DonationType,
} from "@/lib/blood";
import { DELHI_HOSPITALS } from "@/lib/delhi-ncr";
import { DELHI_CENTER, formatDistance, type LngLat } from "@/lib/geo";
import type { MatchedDonor } from "@/server/store";

interface DonorFinderClientProps {
  initialDonors: MatchedDonor[];
  openRequests: MapRequestPin[];
}

export function DonorFinderClient({
  initialDonors,
  openRequests,
}: DonorFinderClientProps) {
  const [center, setCenter] = useState<LngLat>(DELHI_HOSPITALS[0].location);
  const [selectedPreset, setSelectedPreset] = useState<string>(DELHI_HOSPITALS[0].id);
  const [radiusKm, setRadiusKm] = useState<number>(12);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "ALL">("ALL");
  const [donationType, setDonationType] = useState<DonationType>("WHOLE_BLOOD");
  const [onlyEligible, setOnlyEligible] = useState<boolean>(true);
  const [donors, setDonors] = useState<MatchedDonor[]>(initialDonors);
  const [loading, setLoading] = useState<boolean>(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams({
      lat: String(center.lat),
      lng: String(center.lng),
      radiusKm: String(radiusKm),
      bloodGroup,
      donationType,
      onlyEligible: String(onlyEligible),
    });

    fetch(`/api/donors/search?${qs.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDonors(data.donors ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [center, radiusKm, bloodGroup, donationType, onlyEligible]);

  const handleUseGps = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("Geolocation is not supported by your browser.");
      return;
    }
    setGeoStatus("Detecting your coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        };
        setCenter(next);
        setSelectedPreset("custom");
        setGeoStatus(`Pinned to your GPS (${next.lat}, ${next.lng})`);
      },
      () => {
        setCenter(DELHI_CENTER);
        setSelectedPreset("custom");
        setGeoStatus("GPS permission declined — centered on Connaught Place, New Delhi.");
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const compatibleList =
    bloodGroup === "ALL" ? null : compatibleDonorGroups(bloodGroup, donationType);

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Hospital / Location Preset */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Hospital / Search Center (Delhi NCR)
            </label>
            <div className="mt-1.5 flex gap-2">
              <select
                value={selectedPreset}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedPreset(id);
                  const h = DELHI_HOSPITALS.find((item) => item.id === id);
                  if (h) setCenter(h.location);
                }}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium focus:border-red-500 focus:bg-white focus:outline-none"
              >
                {DELHI_HOSPITALS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.area})
                  </option>
                ))}
                <option value="custom">
                  Custom Pin ({center.lat.toFixed(3)}, {center.lng.toFixed(3)})
                </option>
              </select>
              <button
                type="button"
                onClick={handleUseGps}
                className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                title="Center map on your GPS coordinates"
              >
                📍 Locate Me
              </button>
            </div>
            {geoStatus && <p className="mt-1 text-xs text-neutral-500">{geoStatus}</p>}
          </div>

          {/* Patient Blood Group */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Patient Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup | "ALL")}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold focus:border-red-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg} (Patient needs {bg})
                </option>
              ))}
            </select>
          </div>

          {/* Donation Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Component Type
            </label>
            <div className="mt-1.5 grid grid-cols-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDonationType("WHOLE_BLOOD")}
                className={`rounded-lg py-1.5 transition ${
                  donationType === "WHOLE_BLOOD"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Whole Blood
              </button>
              <button
                type="button"
                onClick={() => setDonationType("PLASMA")}
                className={`rounded-lg py-1.5 transition ${
                  donationType === "PLASMA"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Plasma
              </button>
            </div>
          </div>

          {/* Search Radius */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span>Search Radius</span>
              <span className="font-bold text-red-600">{radiusKm} km</span>
            </label>
            <input
              type="range"
              min={2}
              max={35}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="mt-3 w-full accent-red-600"
            />
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>2 km</span>
              <span>15 km</span>
              <span>35 km</span>
            </div>
          </div>
        </div>

        {/* Compatibility & Eligibility Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {compatibleList ? (
              <>
                <span className="font-semibold text-neutral-700">
                  Compatible {donationType === "PLASMA" ? "Plasma" : "Whole Blood"} donor groups for{" "}
                  <span className="text-red-600">{bloodGroup}</span>:
                </span>
                {compatibleList.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-red-100 px-2.5 py-0.5 font-bold text-red-800"
                  >
                    {g}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-neutral-600">
                Showing donors across all 8 ABO/Rh blood groups within{" "}
                <strong>{radiusKm} km</strong>.
              </span>
            )}
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={onlyEligible}
              onChange={(e) => setOnlyEligible(e.target.checked)}
              className="h-4 w-4 rounded accent-red-600"
            />
            Only NBTC-eligible donors (hide 90/120-day cooldown)
          </label>
        </div>
      </div>

      {/* Map + Results Split */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <DelhiMap
            center={center}
            radiusKm={radiusKm}
            donors={donors}
            requests={openRequests}
            onPickLocation={(coords) => {
              setCenter(coords);
              setSelectedPreset("custom");
            }}
            heightClass="h-[520px]"
          />
        </div>

        <div className="flex flex-col rounded-2xl border border-red-100 bg-white p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Matching Donors Nearby ({donors.length})
              </h2>
              <p className="text-xs text-neutral-500">
                Sorted by PostGIS / great-circle distance from pin
              </p>
            </div>
            <Link
              href="/requests/new"
              className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700"
            >
              + Alert via SMS
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-16 text-sm text-neutral-500">
              Searching nearby donors…
            </div>
          ) : donors.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-semibold text-neutral-700">
                No donors matched within {radiusKm} km
              </p>
              <p className="mt-1 max-w-xs text-xs text-neutral-500">
                Try increasing the search radius slider or unchecking the cooldown filter.
              </p>
            </div>
          ) : (
            <ul className="mt-3 max-h-[430px] space-y-2.5 overflow-y-auto pr-1">
              {donors.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 transition hover:border-red-200 hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-sm font-extrabold text-white shadow-xs">
                      {d.bloodGroup}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-neutral-900">{d.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            d.eligible
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.eligible ? "Eligible" : "Cooldown"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">
                        {d.area} ·{" "}
                        <strong className="text-neutral-900">
                          {formatDistance(d.distanceM)}
                        </strong>{" "}
                        away
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
                        {d.maskedPhone} (unmasked on SMS accept)
                      </p>
                      {!d.eligible && d.eligibilityReasons[0] && (
                        <p className="mt-0.5 text-[11px] text-amber-700">
                          {d.eligibilityReasons[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
