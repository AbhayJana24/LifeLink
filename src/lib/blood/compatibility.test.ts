import { describe, expect, it } from "vitest";
import { BLOOD_GROUPS } from "./types";
import { canDonate, compatibleDonorGroups, compatibleRecipientGroups } from "./compatibility";

describe("whole blood compatibility", () => {
  it("O- is the universal donor", () => {
    expect(compatibleRecipientGroups("O-")).toEqual([...BLOOD_GROUPS]);
  });

  it("AB+ is the universal recipient", () => {
    expect(compatibleDonorGroups("AB+").sort()).toEqual([...BLOOD_GROUPS].sort());
  });

  it("O- can only receive O-", () => {
    expect(compatibleDonorGroups("O-")).toEqual(["O-"]);
  });

  it("Rh-negative patients cannot receive Rh-positive blood", () => {
    expect(canDonate("A+", "A-")).toBe(false);
    expect(canDonate("O+", "B-")).toBe(false);
  });

  it.each([
    ["A+", "AB+", true],
    ["B+", "A+", false],
    ["O+", "A+", true],
    ["AB-", "AB+", true],
    ["AB+", "AB-", false],
  ] as const)("%s -> %s is %s", (donor, recipient, expected) => {
    expect(canDonate(donor, recipient)).toBe(expected);
  });
});

describe("plasma compatibility (reversed, ABO only)", () => {
  it("AB plasma can go to everyone", () => {
    expect(compatibleRecipientGroups("AB-", "PLASMA")).toEqual([...BLOOD_GROUPS]);
  });

  it("O patients can receive any plasma", () => {
    expect(compatibleDonorGroups("O+", "PLASMA")).toEqual([...BLOOD_GROUPS]);
  });

  it("O plasma can only go to O patients", () => {
    expect(compatibleRecipientGroups("O-", "PLASMA")).toEqual(["O+", "O-"]);
  });

  it("ignores Rh for plasma", () => {
    expect(canDonate("A+", "A-", "PLASMA")).toBe(true);
  });
});
