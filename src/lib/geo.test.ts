import { describe, expect, it } from "vitest";
import { formatDistance, fuzzLocation, haversineMeters, parseEwkbPoint } from "./geo";

describe("haversineMeters", () => {
  it("computes ~1.2 km between AIIMS and Green Park in New Delhi", () => {
    const aiims = { lat: 28.5672, lng: 77.21 };
    const greenPark = { lat: 28.5588, lng: 77.2068 };
    const meters = haversineMeters(aiims, greenPark);
    expect(meters).toBeGreaterThan(900);
    expect(meters).toBeLessThan(1200);
  });

  it("returns 0 for identical coordinates", () => {
    const pt = { lat: 28.6139, lng: 77.209 };
    expect(haversineMeters(pt, pt)).toBe(0);
  });
});

describe("fuzzLocation", () => {
  it("snaps coordinates to 2 decimal places (~1.1 km privacy grid)", () => {
    const exact = { lat: 28.567234, lng: 77.210489 };
    expect(fuzzLocation(exact)).toEqual({ lat: 28.57, lng: 77.21 });
  });
});

describe("formatDistance", () => {
  it("formats sub-kilometre distances in rounded 100m steps", () => {
    expect(formatDistance(420)).toBe("400 m");
  });

  it("formats kilometre distances cleanly", () => {
    expect(formatDistance(2450)).toBe("2.5 km");
    expect(formatDistance(14200)).toBe("14 km");
  });
});

describe("parseEwkbPoint", () => {
  it("parses a PostGIS SRID=4326 little-endian EWKB hex point", () => {
    // POINT(77.209 28.6139) with SRID 4326
    const buf = new ArrayBuffer(25);
    const view = new DataView(buf);
    view.setUint8(0, 1); // little endian
    view.setUint32(1, 0x20000001, true); // Point + SRID flag
    view.setUint32(5, 4326, true);
    view.setFloat64(9, 77.209, true);
    view.setFloat64(17, 28.6139, true);
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const parsed = parseEwkbPoint(hex);
    expect(parsed.lng).toBeCloseTo(77.209, 5);
    expect(parsed.lat).toBeCloseTo(28.6139, 5);
  });
});
