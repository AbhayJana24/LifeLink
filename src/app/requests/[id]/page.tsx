import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestDetailClient } from "@/components/request-detail-client";
import { findMatchingDonors, getRequestById } from "@/server/store";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const req = getRequestById(id);
  if (!req) notFound();

  const nearbyDonors = findMatchingDonors({
    center: req.location,
    radiusKm: 15,
    recipientBloodGroup: req.bloodGroup,
    donationType: req.donationType,
    onlyEligible: false,
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-4">
        <Link
          href="/requests"
          className="text-xs font-semibold text-neutral-500 hover:text-red-600"
        >
          ← Back to all Delhi NCR urgent requests
        </Link>
      </div>
      <RequestDetailClient initialRequest={req} nearbyDonors={nearbyDonors} />
    </main>
  );
}
