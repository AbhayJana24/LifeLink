import { z } from "zod";
import { BLOOD_GROUPS, DONATION_TYPES } from "@/lib/blood";
import { normalizeIndianPhone } from "@/lib/phone";

export const URGENCIES = ["CRITICAL", "URGENT", "STANDARD"] as const;
export type Urgency = (typeof URGENCIES)[number];

const lat = z.coerce.number().min(-90).max(90);
const lng = z.coerce.number().min(-180).max(180);

/** Delhi NCR bounding box (generous): keeps the MVP focused on one region. */
export const NCR_BOUNDS = { minLat: 28.2, maxLat: 28.95, minLng: 76.8, maxLng: 77.6 };

const inNcr = (v: { lat: number; lng: number }) =>
  v.lat >= NCR_BOUNDS.minLat &&
  v.lat <= NCR_BOUNDS.maxLat &&
  v.lng >= NCR_BOUNDS.minLng &&
  v.lng <= NCR_BOUNDS.maxLng;

const indianPhone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const phone = normalizeIndianPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit Indian mobile number" });
      return z.NEVER;
    }
    return phone;
  });

const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.date().optional(),
);

export const donorProfileSchema = z
  .object({
    bloodGroup: z.enum(BLOOD_GROUPS, { message: "Select your blood group" }),
    sex: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Select an option" }),
    dateOfBirth: z.coerce.date({ message: "Enter your date of birth" }),
    weightKg: z.coerce.number().int().min(30, "Enter a realistic weight").max(250),
    area: z.string().trim().min(2, "Enter your area / locality").max(80),
    lat,
    lng,
    lastDonatedAt: optionalDate,
    lastDonationType: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.enum(DONATION_TYPES).optional(),
    ),
    smsOptIn: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()),
  })
  .refine(inNcr, { message: "LifeLink currently only supports Delhi NCR", path: ["lat"] })
  .refine((v) => !v.lastDonatedAt || v.lastDonatedAt <= new Date(), {
    message: "Last donation can't be in the future",
    path: ["lastDonatedAt"],
  });

export type DonorProfileInput = z.infer<typeof donorProfileSchema>;

export const bloodRequestSchema = z
  .object({
    patientName: z.string().trim().min(2, "Enter the patient's name").max(80),
    bloodGroup: z.enum(BLOOD_GROUPS, { message: "Select the required blood group" }),
    donationType: z.enum(DONATION_TYPES).default("WHOLE_BLOOD"),
    units: z.coerce.number().int().min(1, "At least 1 unit").max(10, "Max 10 units per request"),
    hospitalName: z.string().trim().min(2, "Enter the hospital name").max(120),
    hospitalAddress: z.string().trim().min(5, "Enter the hospital address").max(240),
    contactPhone: indianPhone,
    urgency: z.enum(URGENCIES),
    neededBy: z.coerce.date({ message: "When is the blood needed?" }),
    notes: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
    lat,
    lng,
  })
  .refine(inNcr, { message: "Pick a hospital location in Delhi NCR", path: ["lat"] });

export type BloodRequestInput = z.infer<typeof bloodRequestSchema>;

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email"),
  phone: indianPhone,
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(["DONOR", "REQUESTER"]),
});

/** Turns FormData into a plain object for zod (checkboxes become "on"). */
export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}

export type FieldErrors = Partial<Record<string, string>>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
