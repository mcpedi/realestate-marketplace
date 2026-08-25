import { describe, expect, it } from "vitest";
import { normalizeKenyanPhone, parsePremiumCheckoutPlanId, premiumCheckoutError, premiumPaymentReference, preparePremiumCheckoutSubmission } from "../client/src/lib/premiumCheckout";

describe("premium checkout payment form", () => {
  it("normalizes Kenyan M-Pesa numbers without retaining card details", () => {
    expect(normalizeKenyanPhone("0716 339 552")).toBe("254716339552");
    expect(normalizeKenyanPhone("+254 716 339 552")).toBe("254716339552");
    expect(normalizeKenyanPhone("12345")).toBeNull();
  });

  it("requires a valid mobile-money number only for the M-Pesa method", () => {
    expect(premiumCheckoutError("mpesa", "0716 339 552")).toBeNull();
    expect(premiumCheckoutError("mpesa", "invalid")).toContain("valid Kenyan M-Pesa number");
    expect(premiumCheckoutError("bank_transfer", "")).toBeNull();
  });

  it("creates a safe payment reference without persisting the full M-Pesa number", () => {
    expect(premiumPaymentReference("mpesa", "0716 339 552")).toBe("MPESA-****9552");
    expect(premiumPaymentReference("mpesa", "0716 339 552")).not.toContain("254716339552");
    expect(premiumPaymentReference("bank_transfer", "")).toBe("BANK-TRANSFER-REQUEST");
  });

  it("only prepares a subscription payload after payment-method-specific validation succeeds", () => {
    expect(preparePremiumCheckoutSubmission("mpesa", "short")).toEqual({
      error: "Enter a valid Kenyan M-Pesa number, for example 0716 339 552.",
      payload: null,
    });
    expect(preparePremiumCheckoutSubmission("mpesa", "0716 339 552")).toEqual({
      error: null,
      payload: { method: "mpesa", reference: "MPESA-****9552" },
    });
    expect(preparePremiumCheckoutSubmission("bank_transfer", "")).toEqual({
      error: null,
      payload: { method: "bank_transfer", reference: "BANK-TRANSFER-REQUEST" },
    });
    expect(preparePremiumCheckoutSubmission("mpesa", "0716 339 552", "failure")).toEqual({
      error: null,
      payload: { method: "mpesa", reference: "MPESA-****9552", mockOutcome: "failure" },
    });
  });

  it("accepts a positive plan identifier for a direct checkout link only", () => {
    expect(parsePremiumCheckoutPlanId("?checkout=1")).toBe(1);
    expect(parsePremiumCheckoutPlanId("?checkout=3&source=upgrade")).toBe(3);
    expect(parsePremiumCheckoutPlanId("?checkout=0")).toBeNull();
    expect(parsePremiumCheckoutPlanId("?checkout=abc")).toBeNull();
  });
});
