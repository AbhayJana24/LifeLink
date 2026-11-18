import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  checkEligibility,
  compatibleDonorGroups,
  type BloodGroup,
  type DonationType,
  type Sex,
} from "@/lib/blood";
import { DELHI_HOSPITALS, SEED_DONORS, SEED_REQUESTS } from "@/lib/delhi-ncr";
import { fuzzLocation, haversineMeters, type LngLat } from "@/lib/geo";
import { donorAcceptedMessage, donorAlertMessage } from "@/lib/messages";
import { formatPhone, maskPhone } from "@/lib/phone";
import type { Urgency } from "@/lib/validation";
import { getSmsProvider } from "@/server/sms";

export interface DonorRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  sex: Sex;
  dateOfBirth: string;
  weightKg: number;
  area: string;
  location: LngLat;
  lastDonatedAt: string | null;
  lastDonationType: DonationType | null;
  isAvailable: boolean;
  smsOptIn: boolean;
}

export interface MatchedDonor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  area: string;
  /** Fuzzed ~1.1km coordinate for public map privacy */
  approxLocation: LngLat;
  distanceM: number;
  eligible: boolean;
  eligibilityReasons: string[];
  nextEligibleAt: string | null;
  isAvailable: boolean;
  maskedPhone: string;
}

export interface DonorResponseItem {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  donorArea: string;
  /** Masked while NOTIFIED/DECLINED, unmasked once ACCEPTED or DONATED */
  donorPhoneDisplay: string;
  status: "NOTIFIED" | "ACCEPTED" | "DECLINED" | "DONATED";
  distanceM: number;
  notifiedAt: string;
  respondedAt: string | null;
}

export interface BloodRequestRecord {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  donationType: DonationType;
  units: number;
  hospitalName: string;
  hospitalAddress: string;
  location: LngLat;
  contactPhone: string;
  urgency: Urgency;
  status: "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED";
  notes: string | null;
  neededBy: string;
  createdAt: string;
  fulfilledAt: string | null;
  responses: DonorResponseItem[];
}

export interface NotificationRecord {
  id: string;
  requestId: string | null;
  recipientName: string;
  to: string;
  channel: "SMS" | "IN_APP";
  status: "SENT" | "LOGGED" | "FAILED";
  body: string;
  createdAt: string;
}

interface MemoryStore {
  donors: DonorRecord[];
  requests: BloodRequestRecord[];
  notifications: NotificationRecord[];
}

const globalStore = globalThis as unknown as { __lifelinkStore?: MemoryStore };

function createInitialStore(): MemoryStore {
  const now = Date.now();
  const donors: DonorRecord[] = SEED_DONORS.map((d) => ({ ...d }));
  const notifications: NotificationRecord[] = [];

  const requests: BloodRequestRecord[] = SEED_REQUESTS.map((r, idx) => {
    const createdAt = new Date(now - (idx + 1) * 42 * 60 * 1000).toISOString();
    const neededBy = new Date(now + r.hoursFromNow * 60 * 60 * 1000).toISOString();
    const compat = compatibleDonorGroups(r.bloodGroup, r.donationType);

    const nearby = donors
      .filter((d) => compat.includes(d.bloodGroup) && d.isAvailable)
      .map((d) => {
        const elig = checkEligibility({
          dateOfBirth: new Date(d.dateOfBirth),
          weightKg: d.weightKg,
          sex: d.sex,
          lastDonatedAt: d.lastDonatedAt ? new Date(d.lastDonatedAt) : null,
          lastDonationType: d.lastDonationType,
        });
        return {
          donor: d,
          distanceM: Math.round(haversineMeters(r.location, d.location)),
          eligible: elig.eligible,
        };
      })
      .filter((m) => m.eligible && m.distanceM <= 18_000)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 5);

    const responses: DonorResponseItem[] = nearby.map((m, rIdx) => {
      const status: DonorResponseItem["status"] =
        r.status === "FULFILLED" && rIdx < 2
          ? "DONATED"
          : rIdx === 0
            ? "ACCEPTED"
            : "NOTIFIED";
      const smsBody = donorAlertMessage({
        requestId: r.id,
        bloodGroup: r.bloodGroup,
        donationType: r.donationType,
        units: r.units,
        hospitalName: r.hospitalName,
        distanceM: m.distanceM,
        urgency: r.urgency,
      });
      notifications.push({
        id: `notif-${r.id}-${m.donor.id}`,
        requestId: r.id,
        recipientName: m.donor.name,
        to: m.donor.phone,
        channel: "SMS",
        status: "LOGGED",
        body: smsBody,
        createdAt,
      });

      return {
        id: `resp-${r.id}-${m.donor.id}`,
        requestId: r.id,
        donorId: m.donor.id,
        donorName: m.donor.name,
        donorBloodGroup: m.donor.bloodGroup,
        donorArea: m.donor.area,
        donorPhoneDisplay:
          status === "ACCEPTED" || status === "DONATED"
            ? formatPhone(m.donor.phone)
            : maskPhone(m.donor.phone),
        status,
        distanceM: m.distanceM,
        notifiedAt: createdAt,
        respondedAt: status !== "NOTIFIED" ? new Date(now - 15 * 60 * 1000).toISOString() : null,
      };
    });

    return {
      id: r.id,
      patientName: r.patientName,
      bloodGroup: r.bloodGroup,
      donationType: r.donationType,
      units: r.units,
      hospitalName: r.hospitalName,
      hospitalAddress: r.hospitalAddress,
      location: r.location,
      contactPhone: r.contactPhone,
      urgency: r.urgency,
      status: r.status,
      notes: r.notes,
      neededBy,
      createdAt,
      fulfilledAt: r.status === "FULFILLED" ? new Date(now - 10 * 60 * 1000).toISOString() : null,
      responses,
    };
  });

  return {
    donors,
    requests,
    notifications: notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

function getStore(): MemoryStore {
  if (!globalStore.__lifelinkStore) {
    globalStore.__lifelinkStore = createInitialStore();
  }
  return globalStore.__lifelinkStore;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && !url.includes("[PASSWORD]") && !url.includes("missing-database-url"));
}

/**
 * Reference PostGIS query used when running against Supabase PostgreSQL + PostGIS.
 * Uses ST_DWithin & ST_Distance on the GiST-indexed `geography(Point, 4326)` column.
 */
export async function queryPostgisNearbyDonors(params: {
  center: LngLat;
  radiusKm: number;
  compatibleGroups: BloodGroup[];
}) {
  const radiusM = params.radiusKm * 1000;
  const pointSql = sql`ST_SetSRID(ST_MakePoint(${params.center.lng}, ${params.center.lat}), 4326)::geography`;
  return db.execute(sql`
    SELECT
      dp.user_id AS id,
      u.name,
      u.phone,
      dp.blood_group AS "bloodGroup",
      dp.sex,
      dp.date_of_birth AS "dateOfBirth",
      dp.weight_kg AS "weightKg",
      dp.area,
      dp.last_donated_at AS "lastDonatedAt",
      dp.last_donation_type AS "lastDonationType",
      dp.is_available AS "isAvailable",
      ROUND(ST_Distance(dp.location, ${pointSql}))::int AS "distanceM"
    FROM donor_profile dp
    JOIN "user" u ON u.id = dp.user_id
    WHERE dp.is_available = true
      AND dp.blood_group = ANY(${params.compatibleGroups})
      AND ST_DWithin(dp.location, ${pointSql}, ${radiusM})
    ORDER BY dp.location <-> ${pointSql}
    LIMIT 50
  `);
}

export function findMatchingDonors(params: {
  center: LngLat;
  radiusKm: number;
  recipientBloodGroup?: BloodGroup | "ALL";
  donationType?: DonationType;
  onlyEligible?: boolean;
}): MatchedDonor[] {
  const store = getStore();
  const donationType = params.donationType ?? "WHOLE_BLOOD";
  const allowedGroups =
    !params.recipientBloodGroup || params.recipientBloodGroup === "ALL"
      ? null
      : compatibleDonorGroups(params.recipientBloodGroup, donationType);
  const maxMeters = params.radiusKm * 1000;

  return store.donors
    .map((d): MatchedDonor => {
      const distanceM = Math.round(haversineMeters(params.center, d.location));
      const elig = checkEligibility({
        dateOfBirth: new Date(d.dateOfBirth),
        weightKg: d.weightKg,
        sex: d.sex,
        lastDonatedAt: d.lastDonatedAt ? new Date(d.lastDonatedAt) : null,
        lastDonationType: d.lastDonationType,
      });
      return {
        id: d.id,
        name: d.name,
        bloodGroup: d.bloodGroup,
        area: d.area,
        approxLocation: fuzzLocation(d.location),
        distanceM,
        eligible: elig.eligible,
        eligibilityReasons: elig.reasons,
        nextEligibleAt: elig.nextEligibleAt ? elig.nextEligibleAt.toISOString() : null,
        isAvailable: d.isAvailable,
        maskedPhone: maskPhone(d.phone),
      };
    })
    .filter((d) => {
      if (d.distanceM > maxMeters) return false;
      if (allowedGroups && !allowedGroups.includes(d.bloodGroup)) return false;
      if (params.onlyEligible && (!d.eligible || !d.isAvailable)) return false;
      return true;
    })
    .sort((a, b) => a.distanceM - b.distanceM);
}

export function listRequests(statusFilter?: "OPEN" | "FULFILLED" | "ALL"): BloodRequestRecord[] {
  const store = getStore();
  const list = [...store.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!statusFilter || statusFilter === "ALL") return list;
  return list.filter((r) => r.status === statusFilter);
}

export function getRequestById(id: string): BloodRequestRecord | null {
  return getStore().requests.find((r) => r.id === id) ?? null;
}

export function listDonors(): DonorRecord[] {
  return getStore().donors;
}

export function getDonorById(id: string): DonorRecord | null {
  return getStore().donors.find((d) => d.id === id) ?? getStore().donors[0] ?? null;
}

export function listNotifications(): NotificationRecord[] {
  return getStore().notifications;
}

export async function createBloodRequestAndAlertDonors(input: {
  patientName: string;
  bloodGroup: BloodGroup;
  donationType: DonationType;
  units: number;
  hospitalName: string;
  hospitalAddress: string;
  location: LngLat;
  contactPhone: string;
  urgency: Urgency;
  neededBy: Date;
  notes?: string;
  radiusKm?: number;
}): Promise<{ request: BloodRequestRecord; notifiedCount: number }> {
  const store = getStore();
  const id = `req-${Date.now().toString(36)}`;
  const nowIso = new Date().toISOString();
  const radiusKm = input.radiusKm ?? 15;

  const compat = compatibleDonorGroups(input.bloodGroup, input.donationType);
  const matching = store.donors
    .map((donor) => {
      const distanceM = Math.round(haversineMeters(input.location, donor.location));
      const elig = checkEligibility({
        dateOfBirth: new Date(donor.dateOfBirth),
        weightKg: donor.weightKg,
        sex: donor.sex,
        lastDonatedAt: donor.lastDonatedAt ? new Date(donor.lastDonatedAt) : null,
        lastDonationType: donor.lastDonationType,
      });
      return { donor, distanceM, eligible: elig.eligible };
    })
    .filter(
      (m) =>
        m.donor.isAvailable &&
        m.eligible &&
        compat.includes(m.donor.bloodGroup) &&
        m.distanceM <= radiusKm * 1000,
    )
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 8);

  const sms = getSmsProvider();
  const responses: DonorResponseItem[] = [];

  for (const m of matching) {
    const body = donorAlertMessage({
      requestId: id,
      bloodGroup: input.bloodGroup,
      donationType: input.donationType,
      units: input.units,
      hospitalName: input.hospitalName,
      distanceM: m.distanceM,
      urgency: input.urgency,
    });
    const res = m.donor.smsOptIn ? await sms.send(m.donor.phone, body) : { status: "LOGGED" as const };
    store.notifications.unshift({
      id: `notif-${id}-${m.donor.id}`,
      requestId: id,
      recipientName: m.donor.name,
      to: m.donor.phone,
      channel: "SMS",
      status: res.status,
      body,
      createdAt: nowIso,
    });
    responses.push({
      id: `resp-${id}-${m.donor.id}`,
      requestId: id,
      donorId: m.donor.id,
      donorName: m.donor.name,
      donorBloodGroup: m.donor.bloodGroup,
      donorArea: m.donor.area,
      donorPhoneDisplay: maskPhone(m.donor.phone),
      status: "NOTIFIED",
      distanceM: m.distanceM,
      notifiedAt: nowIso,
      respondedAt: null,
    });
  }

  const record: BloodRequestRecord = {
    id,
    patientName: input.patientName,
    bloodGroup: input.bloodGroup,
    donationType: input.donationType,
    units: input.units,
    hospitalName: input.hospitalName,
    hospitalAddress: input.hospitalAddress,
    location: input.location,
    contactPhone: input.contactPhone,
    urgency: input.urgency,
    status: "OPEN",
    notes: input.notes ?? null,
    neededBy: input.neededBy.toISOString(),
    createdAt: nowIso,
    fulfilledAt: null,
    responses,
  };

  store.requests.unshift(record);
  return { request: record, notifiedCount: responses.length };
}

export async function respondToBloodRequest(params: {
  requestId: string;
  donorId: string;
  action: "ACCEPTED" | "DECLINED" | "DONATED";
}): Promise<BloodRequestRecord | null> {
  const store = getStore();
  const req = store.requests.find((r) => r.id === params.requestId);
  if (!req) return null;

  const donor = store.donors.find((d) => d.id === params.donorId);
  let resp = req.responses.find((r) => r.donorId === params.donorId);
  const nowIso = new Date().toISOString();

  if (!resp && donor) {
    resp = {
      id: `resp-${req.id}-${donor.id}`,
      requestId: req.id,
      donorId: donor.id,
      donorName: donor.name,
      donorBloodGroup: donor.bloodGroup,
      donorArea: donor.area,
      donorPhoneDisplay: maskPhone(donor.phone),
      status: "NOTIFIED",
      distanceM: Math.round(haversineMeters(req.location, donor.location)),
      notifiedAt: nowIso,
      respondedAt: null,
    };
    req.responses.unshift(resp);
  }

  if (resp) {
    resp.status = params.action;
    resp.respondedAt = nowIso;
    if (donor && (params.action === "ACCEPTED" || params.action === "DONATED")) {
      // Unmask phone number once the donor explicitly accepts
      resp.donorPhoneDisplay = formatPhone(donor.phone);
      const sms = getSmsProvider();
      const body = donorAcceptedMessage({ donorName: donor.name, requestId: req.id });
      const smsRes = await sms.send(req.contactPhone, body);
      store.notifications.unshift({
        id: `notif-accept-${Date.now().toString(36)}`,
        requestId: req.id,
        recipientName: `${req.patientName} (Requester)`,
        to: req.contactPhone,
        channel: "SMS",
        status: smsRes.status,
        body,
        createdAt: nowIso,
      });
    }
    if (donor && params.action === "DONATED") {
      donor.lastDonatedAt = nowIso;
      donor.lastDonationType = req.donationType;
    }
  }

  return req;
}

export function updateRequestStatus(
  requestId: string,
  status: "OPEN" | "FULFILLED" | "CANCELLED",
): BloodRequestRecord | null {
  const req = getStore().requests.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = status;
  req.fulfilledAt = status === "FULFILLED" ? new Date().toISOString() : null;
  return req;
}

export function registerOrUpdateDonor(input: {
  id?: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  sex: Sex;
  dateOfBirth: string;
  weightKg: number;
  area: string;
  location: LngLat;
  lastDonatedAt: string | null;
  lastDonationType: DonationType | null;
  isAvailable: boolean;
  smsOptIn: boolean;
}): DonorRecord {
  const store = getStore();
  const id = input.id ?? `donor-${Date.now().toString(36)}`;
  const existingIdx = store.donors.findIndex((d) => d.id === id || d.email === input.email);
  const record: DonorRecord = { ...input, id };
  if (existingIdx >= 0) {
    store.donors[existingIdx] = record;
  } else {
    store.donors.unshift(record);
  }
  return record;
}

export function toggleDonorAvailability(donorId: string): DonorRecord | null {
  const donor = getStore().donors.find((d) => d.id === donorId);
  if (!donor) return null;
  donor.isAvailable = !donor.isAvailable;
  return donor;
}

export function getPlatformStats() {
  const store = getStore();
  const totalDonors = store.donors.length;
  const eligibleDonors = store.donors.filter((d) => {
    const elig = checkEligibility({
      dateOfBirth: new Date(d.dateOfBirth),
      weightKg: d.weightKg,
      sex: d.sex,
      lastDonatedAt: d.lastDonatedAt ? new Date(d.lastDonatedAt) : null,
      lastDonationType: d.lastDonationType,
    });
    return d.isAvailable && elig.eligible;
  }).length;
  const openRequests = store.requests.filter((r) => r.status === "OPEN").length;
  const fulfilledRequests = store.requests.filter((r) => r.status === "FULFILLED").length;
  const smsDispatched = store.notifications.length;

  return {
    totalDonors,
    eligibleDonors,
    openRequests,
    fulfilledRequests,
    smsDispatched,
    hospitalsCovered: DELHI_HOSPITALS.length,
    dbConnected: isSupabaseConfigured(),
  };
}
