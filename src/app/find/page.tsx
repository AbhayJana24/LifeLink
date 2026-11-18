import { DonorFinderClient } from "@/components/donor-finder-client";
import { DELHI_HOSPITALS } from "@/lib/delhi-ncr";
import { findMatchingDonors, listRequests } from "@/server/store";

export const dynamic = "force-dynamic";

export default function FindDonorsPage() {
  const initialDonors = findMatchingDonors({
    center: DELHI_HOSPITALS[0].location,
    radiusKm: 12,
    recipientBloodGroup: "ALL",
    donationType: "WHOLE_BLOOD",
    onlyEligible: true,
  });

  const openRequests = listRequests("OPEN").map((r) => ({
    id: r.id,
    patientName: r.patientName,
    bloodGroup: r.bloodGroup,
    hospitalName: r.hospitalName,
    urgency: r.urgency,
    units: r.units,
    location: r.location,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            PostGIS Geospatial Search · Delhi NCR
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Live Blood & Plasma Donor Finder
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Filter by recipient blood group, component type, and radius around any Delhi NCR
            hospital. Donor pins are fuzzed to a ~1 km grid for privacy.
          </p>
        </div>
      </div>

      <DonorFinderClient initialDonors={initialDonors} openRequests={openRequests} />
    </main>
  );
}
