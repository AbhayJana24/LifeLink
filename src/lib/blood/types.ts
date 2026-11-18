export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const DONATION_TYPES = ["WHOLE_BLOOD", "PLASMA"] as const;
export type DonationType = (typeof DONATION_TYPES)[number];

export type Sex = "MALE" | "FEMALE" | "OTHER";

export function isBloodGroup(value: string): value is BloodGroup {
  return (BLOOD_GROUPS as readonly string[]).includes(value);
}
