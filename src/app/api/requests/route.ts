import { NextResponse } from "next/server";
import { bloodRequestSchema, flattenErrors } from "@/lib/validation";
import { createBloodRequestAndAlertDonors, listRequests } from "@/server/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "OPEN" | "FULFILLED" | "ALL" | null;
  const requests = listRequests(status ?? "ALL");
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bloodRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: flattenErrors(parsed.error) }, { status: 400 });
  }

  const data = parsed.data;
  const radiusKm = Number(body.radiusKm ?? 15);
  const result = await createBloodRequestAndAlertDonors({
    patientName: data.patientName,
    bloodGroup: data.bloodGroup,
    donationType: data.donationType,
    units: data.units,
    hospitalName: data.hospitalName,
    hospitalAddress: data.hospitalAddress,
    location: { lat: data.lat, lng: data.lng },
    contactPhone: data.contactPhone,
    urgency: data.urgency,
    neededBy: data.neededBy,
    notes: data.notes,
    radiusKm,
  });

  return NextResponse.json(result, { status: 201 });
}
