/**
 * Normalises Indian mobile numbers to E.164 (+91XXXXXXXXXX).
 * Accepts "98765 43210", "+91-98765-43210", "098765 43210", "919876543210".
 * Returns null for anything that isn't a valid Indian mobile number.
 */
export function normalizeIndianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

/** "+919876543210" -> "+91 98765 43210" */
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+91(\d{5})(\d{5})$/);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** "+919876543210" -> "+91 98XXX XXX10" (privacy until a donor accepts) */
export function maskPhone(e164: string): string {
  const m = e164.match(/^\+91(\d{2})\d{6}(\d{2})$/);
  return m ? `+91 ${m[1]}XXX XXX${m[2]}` : "hidden";
}
