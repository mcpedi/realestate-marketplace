export type PremiumPaymentMethod = "mpesa" | "bank_transfer";

export function normalizeKenyanPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (/^07\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^2547\d{8}$/.test(digits)) return digits;
  if (/^7\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

export function premiumCheckoutError(method: PremiumPaymentMethod, phone: string): string | null {
  if (method === "mpesa" && !normalizeKenyanPhone(phone)) {
    return "Enter a valid Kenyan M-Pesa number, for example 0716 339 552.";
  }
  return null;
}

export function premiumPaymentReference(method: PremiumPaymentMethod, phone: string): string {
  if (method === "mpesa") {
    const normalizedPhone = normalizeKenyanPhone(phone);
    return normalizedPhone ? `MPESA-****${normalizedPhone.slice(-4)}` : "MPESA-PENDING";
  }
  return "BANK-TRANSFER-REQUEST";
}

export function preparePremiumCheckoutSubmission(method: PremiumPaymentMethod, phone: string): { error: string | null; payload: { method: PremiumPaymentMethod; reference: string } | null } {
  const error = premiumCheckoutError(method, phone);
  if (error) return { error, payload: null };
  return { error: null, payload: { method, reference: premiumPaymentReference(method, phone) } };
}

export function parsePremiumCheckoutPlanId(search: string): number | null {
  const value = new URLSearchParams(search).get("checkout");
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
