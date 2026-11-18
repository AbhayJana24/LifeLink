import { describe, expect, it } from "vitest";
import { ageOn, checkEligibility, type EligibilityInput } from "./eligibility";

const NOW = new Date(2026, 10, 18); // 18 Nov 2026
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

const healthyAdult: EligibilityInput = {
  dateOfBirth: new Date(1998, 4, 10),
  weightKg: 70,
  sex: "MALE",
};

describe("ageOn", () => {
  it("handles birthdays that haven't happened yet this year", () => {
    expect(ageOn(new Date(2008, 10, 19), NOW)).toBe(17);
    expect(ageOn(new Date(2008, 10, 18), NOW)).toBe(18);
  });
});

describe("checkEligibility", () => {
  it("accepts a healthy adult who never donated", () => {
    expect(checkEligibility(healthyAdult, NOW)).toEqual({
      eligible: true,
      reasons: [],
      nextEligibleAt: null,
    });
  });

  it("rejects under-18 and underweight donors with reasons", () => {
    const result = checkEligibility(
      { ...healthyAdult, dateOfBirth: new Date(2010, 0, 1), weightKg: 40 },
      NOW,
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });

  it("enforces a 90-day gap after whole blood for men", () => {
    const recent = checkEligibility({ ...healthyAdult, lastDonatedAt: daysAgo(60) }, NOW);
    expect(recent.eligible).toBe(false);
    expect(recent.reasons[0]).toContain("30 day");

    const old = checkEligibility({ ...healthyAdult, lastDonatedAt: daysAgo(91) }, NOW);
    expect(old.eligible).toBe(true);
  });

  it("enforces a 120-day gap for women", () => {
    const result = checkEligibility(
      { ...healthyAdult, sex: "FEMALE", lastDonatedAt: daysAgo(100) },
      NOW,
    );
    expect(result.eligible).toBe(false);
  });

  it("uses a shorter gap after plasma donation", () => {
    const result = checkEligibility(
      { ...healthyAdult, lastDonatedAt: daysAgo(20), lastDonationType: "PLASMA" },
      NOW,
    );
    expect(result.eligible).toBe(true);
  });
});
