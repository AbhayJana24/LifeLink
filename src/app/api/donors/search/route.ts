import { NextResponse } from "next/server";
import {
  compatibleDonorGroups,
  isBloodGroup,
  type BloodGroup,
  type DonationType,
} from "@/lib/blood";
import { DELHI_CENTER } from "@/lib/geo";
import { findMatchingDonors } from "@/server/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") ?? DELHI_CENTER.lat);
  const lng = Number(searchParams.get("lng") ?? DELHI_CENTER.lng);
  const radiusKm = Math.min(100, Math.max(1, Number(searchParams.get("radiusKm") ?? 15)));
  const bgParam = searchParams.get("bloodGroup") ?? "ALL";
  const recipientBloodGroup: BloodGroup | "ALL" = isBloodGroup(bgParam) ? bgParam : "ALL";
  const donationType: DonationType =
    searchParams.get("donationType") === "PLASMA" ? "PLASMA" : "WHOLE_BLOOD";
  const onlyEligible = searchParams.get("onlyEligible") !== "false";

  const donors = findMatchingDonors({
    center: { lat, lng },
    radiusKm,
    recipientBloodGroup,
    donationType,
    onlyEligible,
  });

  return NextResponse.json({
    center: { lat, lng },
    radiusKm,
    recipientBloodGroup,
    donationType,
    compatibleGroups:
      recipientBloodGroup === "ALL"
        ? null
        : compatibleDonorGroups(recipientBloodGroup, donationType),
    count: donors.length,
    donors,
  });
}
