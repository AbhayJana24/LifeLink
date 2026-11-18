import { BLOOD_GROUPS, type BloodGroup, type DonationType } from "./types";

/**
 * Red-cell (whole blood) compatibility: recipient -> groups they can RECEIVE from.
 * O- is the universal red-cell donor, AB+ the universal recipient.
 */
const WHOLE_BLOOD_DONORS_FOR: Record<BloodGroup, readonly BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": [...BLOOD_GROUPS],
};

/**
 * Plasma compatibility is the reverse of red cells and depends on ABO only:
 * AB plasma is the universal plasma donor, O patients can receive any plasma.
 */
const PLASMA_DONOR_ABO_FOR: Record<string, readonly string[]> = {
  O: ["O", "A", "B", "AB"],
  A: ["A", "AB"],
  B: ["B", "AB"],
  AB: ["AB"],
};

const abo = (group: BloodGroup) => group.replace(/[+-]$/, "");

/** All donor blood groups that can give to `recipient` for the given donation type. */
export function compatibleDonorGroups(
  recipient: BloodGroup,
  type: DonationType = "WHOLE_BLOOD",
): BloodGroup[] {
  if (type === "WHOLE_BLOOD") return [...WHOLE_BLOOD_DONORS_FOR[recipient]];
  const allowedAbo = PLASMA_DONOR_ABO_FOR[abo(recipient)];
  return BLOOD_GROUPS.filter((g) => allowedAbo.includes(abo(g)));
}

/** All recipient blood groups that `donor` can give to. */
export function compatibleRecipientGroups(
  donor: BloodGroup,
  type: DonationType = "WHOLE_BLOOD",
): BloodGroup[] {
  return BLOOD_GROUPS.filter((recipient) => canDonate(donor, recipient, type));
}

export function canDonate(
  donor: BloodGroup,
  recipient: BloodGroup,
  type: DonationType = "WHOLE_BLOOD",
): boolean {
  return compatibleDonorGroups(recipient, type).includes(donor);
}
