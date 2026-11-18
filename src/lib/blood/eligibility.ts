import type { DonationType, Sex } from "./types";

/**
 * Simplified donor-eligibility rules, loosely based on India's NBTC guidelines.
 * NOT medical advice: a blood bank always does the final screening.
 */
export const ELIGIBILITY_RULES = {
  minAge: 18,
  maxAge: 65,
  minWeightKg: 45,
  /** Days to wait after a donation of this type before donating again. */
  gapDaysAfter: {
    WHOLE_BLOOD: { MALE: 90, FEMALE: 120, OTHER: 90 },
    PLASMA: { MALE: 14, FEMALE: 14, OTHER: 14 },
  },
} as const;

export interface EligibilityInput {
  dateOfBirth: Date;
  weightKg: number;
  sex: Sex;
  lastDonatedAt?: Date | null;
  lastDonationType?: DonationType | null;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  /** When the waiting period ends; null if there is no waiting period. */
  nextEligibleAt: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function ageOn(dateOfBirth: Date, on: Date): number {
  let age = on.getFullYear() - dateOfBirth.getFullYear();
  const hadBirthday =
    on.getMonth() > dateOfBirth.getMonth() ||
    (on.getMonth() === dateOfBirth.getMonth() && on.getDate() >= dateOfBirth.getDate());
  if (!hadBirthday) age--;
  return age;
}

export function checkEligibility(
  input: EligibilityInput,
  now: Date = new Date(),
): EligibilityResult {
  const reasons: string[] = [];
  const { minAge, maxAge, minWeightKg, gapDaysAfter } = ELIGIBILITY_RULES;

  const age = ageOn(input.dateOfBirth, now);
  if (age < minAge) reasons.push(`Must be at least ${minAge} years old`);
  if (age > maxAge) reasons.push(`Must be ${maxAge} years old or younger`);
  if (input.weightKg < minWeightKg) reasons.push(`Must weigh at least ${minWeightKg} kg`);

  let nextEligibleAt: Date | null = null;
  if (input.lastDonatedAt) {
    const gapDays = gapDaysAfter[input.lastDonationType ?? "WHOLE_BLOOD"][input.sex];
    const next = new Date(input.lastDonatedAt.getTime() + gapDays * DAY_MS);
    if (next > now) {
      nextEligibleAt = next;
      const daysLeft = Math.ceil((next.getTime() - now.getTime()) / DAY_MS);
      reasons.push(`Recently donated: can donate again in ${daysLeft} day(s)`);
    }
  }

  return { eligible: reasons.length === 0, reasons, nextEligibleAt };
}
