/**
 * Minimal EWKB (hex) point parser for PostGIS `geography(Point)` values,
 * which postgres returns as hex strings like "0101000020E6100000...".
 */
export interface LngLat {
  lng: number;
  lat: number;
}

export function parseEwkbPoint(hex: string): LngLat {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  const view = new DataView(bytes.buffer);
  const littleEndian = view.getUint8(0) === 1;
  const type = view.getUint32(1, littleEndian);
  const hasSrid = (type & 0x20000000) !== 0;
  if ((type & 0xff) !== 1) throw new Error("Not a WKB point");
  const offset = hasSrid ? 9 : 5;
  return {
    lng: view.getFloat64(offset, littleEndian),
    lat: view.getFloat64(offset + 8, littleEndian),
  };
}

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres (used client-side & in tests; DB uses PostGIS). */
export function haversineMeters(a: LngLat, b: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Privacy: snap a coordinate to a ~1.1 km grid so public maps never reveal
 * exact homes or patient locations.
 */
export function fuzzLocation({ lng, lat }: LngLat, decimals = 2): LngLat {
  const f = 10 ** decimals;
  return { lng: Math.round(lng * f) / f, lat: Math.round(lat * f) / f };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(100, Math.round(meters / 100) * 100)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export const DELHI_CENTER: LngLat = { lat: 28.6139, lng: 77.209 };

export function googleMapsDirectionsUrl({ lat, lng }: LngLat): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
