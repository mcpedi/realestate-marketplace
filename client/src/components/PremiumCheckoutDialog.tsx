import React, { useEffect, useState } from "react";
import { Building2, CheckCircle2, CreditCard, Landmark, Loader2, ShieldCheck, Smartphone, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { preparePremiumCheckoutSubmission, type PremiumPaymentMethod } from "@/lib/premiumCheckout";

export type PremiumCheckoutPlan = {
  id: number;
  name: string;
  price: number;
  period: string;
  currency: string;
};

export function PremiumCheckoutDialog({
  plan,
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  plan: PremiumCheckoutPlan | null;
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (checkout: { method: PremiumPaymentMethod; reference: string }) => void;
}) {
  const [method, setMethod] = useState<PremiumPaymentMethod>("mpesa");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMethod("mpesa");
      setPhone("");
      setError(null);
    }
  }, [open, plan?.id]);

  if (!plan) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = preparePremiumCheckoutSubmission(method, phone);
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
        <DialogDescription className="sr-only">Choose a payment method and confirm payment for the selected premium membership plan.</DialogDescription>
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
              <button type="button" onClick={() => { setMethod("mpesa"); setError(null); }} className={`rounded-xl border p-3 text-left transition ${method === "mpesa" ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}`}>
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <span className="mt-2 block text-sm font-bold text-slate-900">M-Pesa</span>
                <span className="mt-0.5 block text-xs text-slate-500">Use your mobile money number</span>
              </button>
              <button type="button" onClick={() => { setMethod("bank_transfer"); setError(null); }} className={`rounded-xl border p-3 text-left transition ${method === "bank_transfer" ? "border-[oklch(0.45_0.18_260)] bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
                <Landmark className="h-5 w-5 text-[oklch(0.45_0.18_260)]" />
                <span className="mt-2 block text-sm font-bold text-slate-900">Bank transfer</span>
                <span className="mt-0.5 block text-xs text-slate-500">Record an offline transfer</span>
              </button>
            </div>
          </div>

          {method === "mpesa" ? (
            <div>
              <label htmlFor="premium-mpesa-phone" className="mb-1.5 block text-sm font-semibold text-slate-800">M-Pesa phone number</label>
              <Input id="premium-mpesa-phone" value={phone} onChange={(event) => { setPhone(event.target.value); setError(null); }} inputMode="tel" autoComplete="tel" placeholder="0716 339 552" className="h-11 rounded-xl" aria-invalid={Boolean(error)} />
              <p className="mt-1.5 text-xs text-slate-500">Use the number that will receive the mobile-money prompt.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <div className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0" /><p className="font-semibold">Bank transfer request</p></div>
              <p className="mt-1 pl-6 text-xs leading-5 text-blue-800">After activating your membership request, use the payment reference shown in Payment History when completing your transfer with the team.</p>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><p><strong className="text-slate-800">Secure payment notice.</strong> Do not enter card numbers here. Live payment-gateway confirmation can be connected separately; this form records your selected payment method for your membership request.</p></div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing membership...</> : <><CreditCard className="mr-2 h-4 w-4" />Confirm {method === "mpesa" ? "M-Pesa" : "bank transfer"} payment</>}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Your selected {plan.name} benefits will activate after confirmation.</div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
