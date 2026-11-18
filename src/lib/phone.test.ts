import { describe, expect, it } from "vitest";
import { formatPhone, maskPhone, normalizeIndianPhone } from "./phone";

describe("normalizeIndianPhone", () => {
  it("normalizes 10-digit, 0-prefixed, and +91-prefixed Indian mobile numbers", () => {
    expect(normalizeIndianPhone("98110 23401")).toBe("+919811023401");
    expect(normalizeIndianPhone("+91-98110-23401")).toBe("+919811023401");
    expect(normalizeIndianPhone("09811023401")).toBe("+919811023401");
  });

  it("rejects invalid Indian mobile numbers", () => {
    expect(normalizeIndianPhone("1234567890")).toBeNull();
    expect(normalizeIndianPhone("98110")).toBeNull();
  });
});

describe("formatPhone and maskPhone", () => {
  it("formats E.164 numbers for display", () => {
    expect(formatPhone("+919811023401")).toBe("+91 98110 23401");
  });

  it("masks the middle 6 digits for privacy until donor accepts", () => {
    expect(maskPhone("+919811023401")).toBe("+91 98XXX XXX01");
  });
});
