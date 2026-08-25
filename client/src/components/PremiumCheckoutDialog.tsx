import { Building2, CheckCircle2, CreditCard, Landmark, Loader2, ShieldCheck, Smartphone, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { preparePremiumCheckoutSubmission, type MockMpesaOutcome, type PremiumCheckoutSubmission, type PremiumPaymentMethod } from "@/lib/premiumCheckout";

export type PremiumCheckoutPlan = {
  id: number;
  name: string;
  price: number;
  period: string;
  currency: string;
};

const mockOutcomeCopy: Record<MockMpesaOutcome, { label: string; detail: string }> = {
  pending: { label: "Keep pending", detail: "Creates a pending sandbox payment without activating benefits." },
  success: { label: "Simulate success", detail: "Creates a completed sandbox payment and activates a test subscription." },
  failure: { label: "Simulate failure", detail: "Creates a failed sandbox payment without activating benefits." },
};

export function PremiumCheckoutDialog({
  plan,
  open,
  isSubmitting,
  mockMpesaEnabled,
  onClose,
  onConfirm,
}: {
  plan: PremiumCheckoutPlan | null;
  open: boolean;
  isSubmitting: boolean;
  mockMpesaEnabled: boolean;
  onClose: () => void;
  onConfirm: (checkout: PremiumCheckoutSubmission) => void;
}) {
  const [method, setMethod] = useState<PremiumPaymentMethod>(mockMpesaEnabled ? "mpesa" : "bank_transfer");
  const [phone, setPhone] = useState("");
  const [mockOutcome, setMockOutcome] = useState<MockMpesaOutcome>("success");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMethod(mockMpesaEnabled ? "mpesa" : "bank_transfer");
      setPhone("");
      setMockOutcome("success");
      setError(null);
    }
  }, [open, plan?.id, mockMpesaEnabled]);

  if (!plan) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = preparePremiumCheckoutSubmission(method, phone, method === "mpesa" ? mockOutcome : undefined);
    if (result.error || !result.payload) {
      setError(result.error);
      return;
    }
    onConfirm(result.payload);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !isSubmitting) onClose(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <DialogTitle className="sr-only">Premium membership payment form</DialogTitle>
        <DialogDescription className="sr-only">Choose an offline payment method or an administrator-only M-Pesa sandbox outcome for the selected premium membership plan.</DialogDescription>
        <div className="bg-gradient-to-br from-[oklch(0.42_0.18_260)] to-[oklch(0.32_0.14_280)] px-6 pb-7 pt-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Premium checkout</p>
              <h2 className="mt-1 text-2xl font-extrabold">{plan.name} Membership</h2>
              <p className="mt-1 text-sm text-blue-100">{plan.period === "annual" ? "Annual" : "Monthly"} membership access</p>
            </div>
            <button type="button" aria-label="Close payment form" onClick={onClose} disabled={isSubmitting} className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-5 flex items-end justify-between rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <span className="text-sm font-medium text-blue-100">Amount due</span>
            <span className="text-2xl font-extrabold">{plan.currency} {plan.price.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div>
            <p className="text-sm font-bold text-slate-900">Choose a payment method</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button type="button" disabled={!mockMpesaEnabled} onClick={() => { setMethod("mpesa"); setError(null); }} className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${method === "mpesa" ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}`}>
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <span className="mt-2 block text-sm font-bold text-slate-900">Mock M-Pesa</span>
                <span className="mt-0.5 block text-xs text-slate-500">{mockMpesaEnabled ? "Administrator sandbox only" : "Sandbox restricted"}</span>
              </button>
              <button type="button" onClick={() => { setMethod("bank_transfer"); setError(null); }} className={`rounded-xl border p-3 text-left transition ${method === "bank_transfer" ? "border-[oklch(0.45_0.18_260)] bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
                <Landmark className="h-5 w-5 text-[oklch(0.45_0.18_260)]" />
                <span className="mt-2 block text-sm font-bold text-slate-900">Bank transfer</span>
                <span className="mt-0.5 block text-xs text-slate-500">Record an offline transfer</span>
              </button>
            </div>
          </div>

          {method === "mpesa" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950" data-testid="mock-mpesa-notice">
                <p className="font-extrabold">Mock M-Pesa sandbox — no money moves.</p>
                <p className="mt-1">This administrator-only test creates a simulated payment record. It does not contact Safaricom, send an STK prompt, or charge the supplied number.</p>
              </div>
              <div>
                <label htmlFor="premium-mpesa-phone" className="mb-1.5 block text-sm font-semibold text-slate-800">Test M-Pesa phone number</label>
                <Input id="premium-mpesa-phone" value={phone} onChange={(event) => { setPhone(event.target.value); setError(null); }} inputMode="tel" autoComplete="tel" placeholder="0716 339 552" className="h-11 rounded-xl" aria-invalid={Boolean(error)} />
                <p className="mt-1.5 text-xs text-slate-500">Only a masked reference is shown. The number is not sent to a payment provider.</p>
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-slate-800">Choose a sandbox outcome</legend>
                <div className="mt-2 grid gap-2">
                  {(Object.keys(mockOutcomeCopy) as MockMpesaOutcome[]).map((outcome) => {
                    const selected = mockOutcome === outcome;
                    return <button key={outcome} type="button" aria-pressed={selected} onClick={() => setMockOutcome(outcome)} className={`rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${selected ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}><span className="block text-sm font-bold text-slate-900">{mockOutcomeCopy[outcome].label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-600">{mockOutcomeCopy[outcome].detail}</span></button>;
                  })}
                </div>
              </fieldset>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <div className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0" /><p className="font-semibold">Bank transfer request</p></div>
              <p className="mt-1 pl-6 text-xs leading-5 text-blue-800">After activating your membership request, use the payment reference shown in Payment History when completing your transfer with the team.</p>
            </div>
          )}

          {!mockMpesaEnabled && <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">M-Pesa sandbox testing is restricted to administrators. The live M-Pesa gateway is not connected.</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><p><strong className="text-slate-800">Payment safety notice.</strong> Do not enter card numbers here. The M-Pesa option is a restricted test sandbox; production payment-gateway confirmation remains a separate integration.</p></div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing membership...</> : <><CreditCard className="mr-2 h-4 w-4" />{method === "mpesa" ? `Run mock M-Pesa ${mockOutcome}` : "Confirm bank transfer payment"}</>}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{method === "mpesa" ? "Mock success activates test premium benefits only." : `Your selected ${plan.name} benefits will activate after confirmation.`}</div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
