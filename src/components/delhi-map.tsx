"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BloodGroup } from "@/lib/blood";
import { formatDistance, type LngLat } from "@/lib/geo";

export interface MapDonorPin {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  area: string;
  approxLocation: LngLat;
  distanceM: number;
  eligible: boolean;
}

export interface MapRequestPin {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  urgency: "CRITICAL" | "URGENT" | "STANDARD";
  units: number;
  location: LngLat;
}

interface DelhiMapProps {
  center: LngLat;
  radiusKm?: number;
  donors?: MapDonorPin[];
  requests?: MapRequestPin[];
  onPickLocation?: (coords: LngLat) => void;
  heightClass?: string;
}

export function DelhiMap({
  center,
  radiusKm = 10,
  donors = [],
  requests = [],
  onPickLocation,
  heightClass = "h-[460px]",
}: DelhiMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const leaflet = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      const map = leaflet.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: 12,
        scrollWheelZoom: true,
      });

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        })
        .addTo(map);

      const group = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = group;

      if (onPickLocation) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          onPickLocation({
            lat: Number(e.latlng.lat.toFixed(4)),
            lng: Number(e.latlng.lng.toFixed(4)),
          });
        });
      }
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function renderLayers() {
      const map = mapRef.current;
      const group = layerGroupRef.current;
      if (!map || !group) return;
      const leaflet = await import("leaflet");

      group.clearLayers();
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });

      // Search center + radius circle
      leaflet
        .circle([center.lat, center.lng], {
          radius: radiusKm * 1000,
          color: "#dc2626",
          weight: 1.5,
          fillColor: "#ef4444",
          fillOpacity: 0.07,
          dashArray: "6 6",
        })
        .addTo(group);

      const centerIcon = leaflet.divIcon({
        className: "lifelink-center-pin",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#111827;color:#fff;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.25);">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      leaflet
        .marker([center.lat, center.lng], { icon: centerIcon })
        .bindPopup(
          `<strong>Search Center</strong><br/>Radius: ${radiusKm} km<br/><span style="font-size:11px;color:#666">${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</span>`,
        )
        .addTo(group);

      // Urgent hospital request pins
      for (const req of requests) {
        const bg = req.urgency === "CRITICAL" ? "#b91c1c" : "#ea580c";
        const icon = leaflet.divIcon({
          className: "lifelink-req-pin",
          html: `<div style="display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:9999px;background:${bg};color:#fff;font-weight:800;font-size:11px;border:2px solid #fff;box-shadow:0 4px 12px rgba(185,28,28,0.45);white-space:nowrap;">🏥 ${req.bloodGroup}</div>`,
          iconSize: [64, 26],
          iconAnchor: [32, 13],
        });
        leaflet
          .marker([req.location.lat, req.location.lng], { icon })
          .bindPopup(
            `<div style="min-width:190px">
              <div style="font-weight:700;color:#b91c1c">${req.urgency}: ${req.bloodGroup} (${req.units}u)</div>
              <div style="font-size:12px;margin-top:2px"><strong>${req.hospitalName}</strong></div>
              <div style="font-size:11px;color:#555;margin-top:2px">Patient: ${req.patientName}</div>
              <a href="/requests/${req.id}" style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;color:#dc2626">View & Respond →</a>
            </div>`,
          )
          .addTo(group);
      }

      // Donor pins (privacy-fuzzed ~1.1km grid)
      for (const d of donors) {
        const bg = d.eligible ? "#059669" : "#6b7280";
        const icon = leaflet.divIcon({
          className: "lifelink-donor-pin",
          html: `<div style="display:flex;align-items:center;justify-content:center;min-width:34px;height:24px;padding:0 6px;border-radius:9999px;background:${bg};color:#fff;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${d.bloodGroup}</div>`,
          iconSize: [34, 24],
          iconAnchor: [17, 12],
        });
        leaflet
          .marker([d.approxLocation.lat, d.approxLocation.lng], { icon })
          .bindPopup(
            `<div style="min-width:160px">
              <div style="font-weight:700">${d.name} (${d.bloodGroup})</div>
              <div style="font-size:12px;color:#444">${d.area} · ${formatDistance(d.distanceM)}</div>
              <div style="font-size:11px;margin-top:3px;color:${d.eligible ? "#059669" : "#b45309"}">
                ${d.eligible ? "✓ Eligible to donate now" : "⏳ In post-donation cooldown"}
              </div>
              <div style="font-size:10px;color:#888;margin-top:3px">Location fuzzed (~1 km) for privacy</div>
            </div>`,
          )
          .addTo(group);
      }
    }

    renderLayers();
  }, [center, radiusKm, donors, requests]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-neutral-100 shadow-sm">
      <div ref={containerRef} className={`w-full ${heightClass} z-0`} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-red-100 bg-white/95 px-4 py-2.5 text-xs text-neutral-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-700" />
            Urgent Hospital Request
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
            Eligible Donor (~1 km privacy grid)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-500" />
            Cooldown Donor
          </span>
        </div>
        {onPickLocation && (
          <span className="font-medium text-red-700">
            Tip: Click anywhere on the map to move the search pin
          </span>
        )}
      </div>
    </div>
  );
}
