import { DonorHubClient } from "@/components/donor-hub-client";
import { listDonors, listRequests } from "@/server/store";

export const dynamic = "force-dynamic";

export default function DonorPage() {
  const donors = listDonors();
  const openRequests = listRequests("OPEN");

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          NBTC Eligibility Engine · Offline PWA Donor Card
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Donor Hub & Emergency Wallet Card
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Check your donation eligibility, manage SMS availability, or register as a donor in Delhi
          NCR. Your donor ID card is cached locally for offline access.
        </p>
      </div>

      <DonorHubClient initialDonors={donors} openRequests={openRequests} />
    </main>
  );
}
