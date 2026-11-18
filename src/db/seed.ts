import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { bloodRequest, donorProfile, user } from "./schema";
import { SEED_DONORS, SEED_REQUESTS } from "@/lib/delhi-ncr";

async function main() {
  console.log("🩸 Enabling PostGIS extension (if not already active)...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`);

  console.log(`🌱 Seeding ${SEED_DONORS.length} Delhi NCR donors...`);
  for (const d of SEED_DONORS) {
    await db
      .insert(user)
      .values({
        id: d.id,
        name: d.name,
        email: d.email,
        emailVerified: true,
        phone: d.phone,
        role: "DONOR",
      })
      .onConflictDoNothing();

    await db
      .insert(donorProfile)
      .values({
        userId: d.id,
        bloodGroup: d.bloodGroup,
        sex: d.sex,
        dateOfBirth: new Date(d.dateOfBirth),
        weightKg: d.weightKg,
        location: d.location,
        area: d.area,
        lastDonatedAt: d.lastDonatedAt ? new Date(d.lastDonatedAt) : null,
        lastDonationType: d.lastDonationType,
        isAvailable: d.isAvailable,
        smsOptIn: d.smsOptIn,
        isDemo: true,
      })
      .onConflictDoNothing();
  }

  const requesterId = "requester-delhi-emergency";
  await db
    .insert(user)
    .values({
      id: requesterId,
      name: "Delhi Emergency Desk",
      email: "desk@demo.lifelink.in",
      emailVerified: true,
      phone: "+911126594406",
      role: "REQUESTER",
    })
    .onConflictDoNothing();

  console.log(`🏥 Seeding ${SEED_REQUESTS.length} hospital blood/plasma requests...`);
  for (const r of SEED_REQUESTS) {
    await db
      .insert(bloodRequest)
      .values({
        requesterId,
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
        neededBy: new Date(Date.now() + r.hoursFromNow * 3600 * 1000),
      })
      .onConflictDoNothing();
  }

  console.log("✅ Supabase PostGIS database seeded with Delhi NCR data!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
