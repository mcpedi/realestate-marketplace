// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PremiumCheckoutDialog } from "../client/src/components/PremiumCheckoutDialog";

const plan = { id: 1, name: "Basic", price: 500, period: "monthly", currency: "KES" };

afterEach(() => cleanup());

describe("PremiumCheckoutDialog", () => {
  it("renders the selected plan, blocks an invalid M-Pesa number, and confirms a safe payload", () => {
    const onConfirm = vi.fn();
    render(createElement(PremiumCheckoutDialog, { plan, open: true, isSubmitting: false, onClose: vi.fn(), onConfirm }));

    expect(screen.getByText("Basic Membership")).toBeTruthy();
    expect(screen.getByText("KES 500")).toBeTruthy();
    expect(screen.getByLabelText("M-Pesa phone number")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("M-Pesa phone number"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm M-Pesa payment" }));
    expect(screen.getByText("Enter a valid Kenyan M-Pesa number, for example 0716 339 552.")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("M-Pesa phone number"), { target: { value: "0716 339 552" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm M-Pesa payment" }));
    expect(onConfirm).toHaveBeenCalledWith({ method: "mpesa", reference: "MPESA-****9552" });
  });

  it("switches to bank transfer and confirms the expected subscription payload", () => {
    const onConfirm = vi.fn();
    render(createElement(PremiumCheckoutDialog, { plan, open: true, isSubmitting: false, onClose: vi.fn(), onConfirm }));

    fireEvent.click(screen.getByRole("button", { name: /Bank transfer/i }));
    expect(screen.queryByLabelText("M-Pesa phone number")).toBeNull();
    expect(screen.getByText("Bank transfer request")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm bank transfer payment" }));
    expect(onConfirm).toHaveBeenCalledWith({ method: "bank_transfer", reference: "BANK-TRANSFER-REQUEST" });
  });
});
