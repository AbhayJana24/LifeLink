import type { BloodGroup, DonationType } from "@/lib/blood";
import { formatDistance } from "@/lib/geo";
import type { Urgency } from "@/lib/validation";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

const URGENCY_WORD: Record<Urgency, string> = {
  CRITICAL: "CRITICAL",
  URGENT: "URGENT",
  STANDARD: "",
};

/** Keep it short: a single 160-char SMS segment where possible. */
export function donorAlertMessage(input: {
  requestId: string;
  bloodGroup: BloodGroup;
  donationType: DonationType;
  units: number;
  hospitalName: string;
  distanceM: number;
  urgency: Urgency;
}): string {
  const what = input.donationType === "PLASMA" ? "plasma" : "blood";
  const urgency = URGENCY_WORD[input.urgency];
  return [
    `LifeLink: ${urgency ? `${urgency} ` : ""}need for ${input.bloodGroup} ${what}`,
    `(${input.units} unit${input.units > 1 ? "s" : ""}) at ${input.hospitalName},`,
    `${formatDistance(input.distanceM)} from you. Can you help?`,
    `${appUrl()}/requests/${input.requestId}`,
  ].join(" ");
}

export function donorAcceptedMessage(input: { donorName: string; requestId: string }): string {
  return `LifeLink: ${input.donorName} has agreed to donate for your request. View contact details: ${appUrl()}/requests/${input.requestId}`;
}
