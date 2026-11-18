import { NextResponse } from "next/server";
import { checkEligibility } from "@/lib/blood";
import { normalizeIndianPhone } from "@/lib/phone";
import { donorProfileSchema, flattenErrors } from "@/lib/validation";
import {
  getDonorById,
  listDonors,
  registerOrUpdateDonor,
  toggleDonorAvailability,
} from "@/server/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const donor = getDonorById(id);
    if (!donor) return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    const eligibility = checkEligibility({
      dateOfBirth: new Date(donor.dateOfBirth),
      weightKg: donor.weightKg,
      sex: donor.sex,
      lastDonatedAt: donor.lastDonatedAt ? new Date(donor.lastDonatedAt) : null,
      lastDonationType: donor.lastDonationType,
    });
    return NextResponse.json({ donor, eligibility });
  }
  return NextResponse.json({ donors: listDonors() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = donorProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: flattenErrors(parsed.error) }, { status: 400 });
  }

  const phone = normalizeIndianPhone(String(body.phone ?? ""));
  if (!phone) {
    return NextResponse.json(
      { errors: { phone: "Enter a valid 10-digit Indian mobile number" } },
      { status: 400 },
    );
  }
  const name = String(body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ errors: { name: "Enter your full name" } }, { status: 400 });
  }

  const data = parsed.data;
  const donor = registerOrUpdateDonor({
    id: body.id ? String(body.id) : undefined,
    name,
    email: String(body.email ?? `${name.toLowerCase().replace(/\s+/g, ".")}@lifelink.in`),
    phone,
    bloodGroup: data.bloodGroup,
    sex: data.sex,
    dateOfBirth: data.dateOfBirth.toISOString().slice(0, 10),
    weightKg: data.weightKg,
    area: data.area,
    location: { lat: data.lat, lng: data.lng },
    lastDonatedAt: data.lastDonatedAt ? data.lastDonatedAt.toISOString() : null,
    lastDonationType: data.lastDonationType ?? null,
    isAvailable: true,
    smsOptIn: data.smsOptIn,
  });

  const eligibility = checkEligibility({
    dateOfBirth: new Date(donor.dateOfBirth),
    weightKg: donor.weightKg,
    sex: donor.sex,
    lastDonatedAt: donor.lastDonatedAt ? new Date(donor.lastDonatedAt) : null,
    lastDonationType: donor.lastDonationType,
  });

  return NextResponse.json({ donor, eligibility }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const donorId = String(body.donorId ?? "");
  const updated = toggleDonorAvailability(donorId);
  if (!updated) {
    return NextResponse.json({ error: "Donor not found" }, { status: 404 });
  }
  return NextResponse.json({ donor: updated });
}
