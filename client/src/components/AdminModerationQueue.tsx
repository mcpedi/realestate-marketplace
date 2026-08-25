import { useState } from "react";
import { Bot, CheckCircle2, Eye, Search, ShieldAlert, Sparkles, XCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ModerationDecision = { propertyId: number; title: string; action: "approve" | "reject" };

function signalTone(riskLevel?: "none" | "low" | "medium" | "high") {
  if (riskLevel === "high") return "border-red-200 bg-red-50";
  if (riskLevel === "medium") return "border-amber-200 bg-amber-50";
  return "border-sky-100 bg-sky-50/70";
}

export function AdminModerationQueue() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [query, setQuery] = useState("");
  const [pendingDecision, setPendingDecision] = useState<ModerationDecision | null>(null);
  const [actionInProgress, setActionInProgress] = useState<ModerationDecision | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const utils = trpc.useUtils();
  const queue = trpc.admin.moderationQueue.useQuery({ status, query, page: 1, limit: 10 });

  const refresh = () => {
    utils.admin.moderationQueue.invalidate();
    utils.admin.commandCenter.invalidate();
    utils.admin.dashboardOverview.invalidate();
    utils.admin.pendingProperties.invalidate();
  };

  const approve = trpc.admin.approveProperty.useMutation({
    onSuccess: () => {
      toast.success("Listing approved and audit event recorded.");
      setActionInProgress(null);
      setPendingDecision(null);
      refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setActionInProgress(null);
    },
  });
  const reject = trpc.admin.rejectProperty.useMutation({
    onSuccess: () => {
      toast.success("Listing rejected and audit event recorded.");
      setActionInProgress(null);
      setPendingDecision(null);
      setRejectionReason("");
      refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setActionInProgress(null);
    },
  });
  const analyze = trpc.admin.analyzePropertyModeration.useMutation({
    onSuccess: (result) => {
      toast.success(result.signal.riskLevel === "none" ? "AI review completed with no content-risk signal." : "AI review signal recorded for human assessment.");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const decisionPending = approve.isPending || reject.isPending;
  const confirmDecision = () => {
    if (!pendingDecision) return;
    setActionInProgress(pendingDecision);
    if (pendingDecision.action === "approve") approve.mutate(pendingDecision.propertyId);
    else reject.mutate({ propertyId: pendingDecision.propertyId, reason: rejectionReason.trim() || undefined });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-extrabold">Human moderation queue</p>
            <p className="mt-1">Use the listing record and its recent moderation history to make a decision. AI signals are content-review prompts only: they never reject a listing, suspend an account, establish fraud, or replace your review.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Property moderation</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-950">Listing review queue</h2>
            <p className="mt-1 text-sm text-slate-500">{queue.data?.total ?? 0} matching existing listings</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[10rem_minmax(16rem,1fr)]">
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Search moderation queue" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or location" className="h-11 rounded-xl pl-10" />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {queue.isLoading ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Loading listings…</p>
          ) : queue.data?.items.length ? queue.data.items.map((property) => {
            const currentAction = actionInProgress?.propertyId === property.id ? actionInProgress.action : null;
            return (
              <article key={property.id} className="rounded-2xl border border-slate-200 p-3 md:p-4">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 md:h-28 md:w-36">
                    {property.photoUrl ? <img src={property.photoUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs font-bold text-slate-400">No image</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-950">{property.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{property.location} · {property.propertyType} · <span className="capitalize">{property.listingType}</span></p>
                      </div>
                      <Badge variant={property.status === "approved" ? "default" : property.status === "pending" ? "outline" : "destructive"} className="capitalize">{property.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-emerald-700">KSh {Number(property.price).toLocaleString()}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{property.description}</p>
                    <p className="mt-3 text-xs text-slate-500">Owner: {property.owner?.name || `User #${property.id}`} · Submitted {new Date(property.createdAt).toLocaleDateString()}</p>

                    <div className={`mt-3 rounded-xl border p-3 ${signalTone(property.aiReviewSignal?.riskLevel)}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-sky-700" />
                          <p className="text-xs font-extrabold text-slate-900">AI content-review signal</p>
                          {property.aiReviewSignal && <Badge variant={property.aiReviewSignal.riskLevel === "high" ? "destructive" : "outline"} className="capitalize">{property.aiReviewSignal.riskLevel} risk</Badge>}
                        </div>
                        <Button size="sm" variant="outline" className="h-8 gap-1 border-sky-200 bg-white text-sky-800 hover:bg-sky-100" disabled={analyze.isPending || decisionPending} onClick={() => analyze.mutate(property.id)}>
                          <Sparkles className="h-3.5 w-3.5" />{property.aiReviewSignal ? "Re-analyze text" : "Analyze text"}
                        </Button>
                      </div>
                      {property.aiReviewSignal ? <>
                        <p className="mt-2 text-sm leading-5 text-slate-700">{property.aiReviewSignal.summary}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {property.aiReviewSignal.categories.map((category) => <span key={category} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{category.replace(/_/g, " ")}</span>)}
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{property.aiReviewSignal.confidence}% confidence</span>
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">Human decision required</span>
                        </div>
                      </> : <p className="mt-2 text-xs leading-5 text-slate-600">No AI review has been run. Analysis reviews only the listing’s text fields and does not make a decision.</p>}
                    </div>

                    {property.recentModeration.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
                      {property.recentModeration.map((event) => <span key={event.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{event.action.replace(/[._]/g, " ")} · {new Date(event.createdAt).toLocaleDateString()}</span>)}
                    </div>}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 md:w-36 md:flex-col">
                    <Link href={`/property/${property.id}`}><Button variant="outline" size="sm" className="w-full gap-1"><Eye className="h-3.5 w-3.5" /> View</Button></Link>
                    {property.status === "pending" && <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-2">
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-amber-900">Quick actions</p>
                      <div className="flex gap-2 md:flex-col">
                        <Button size="sm" className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-500 md:w-full" disabled={decisionPending || analyze.isPending} onClick={() => setPendingDecision({ propertyId: property.id, title: property.title, action: "approve" })}>
                          <CheckCircle2 className="h-3.5 w-3.5" />{currentAction === "approve" ? "Approving…" : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1 border-red-200 bg-white text-red-700 hover:bg-red-50 md:w-full" disabled={decisionPending || analyze.isPending} onClick={() => setPendingDecision({ propertyId: property.id, title: property.title, action: "reject" })}>
                          <XCircle className="h-3.5 w-3.5" />{currentAction === "reject" ? "Rejecting…" : "Reject"}
                        </Button>
                      </div>
                    </div>}
                  </div>
                </div>
              </article>
            );
          }) : <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No listings match the selected moderation filters.</p>}
        </div>
      </section>

      <AlertDialog open={Boolean(pendingDecision)} onOpenChange={(open) => { if (!open && !decisionPending) { setPendingDecision(null); setRejectionReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingDecision?.action === "approve" ? "Approve this listing?" : "Reject this listing?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDecision?.action === "approve" ? "This will make the listing eligible for public discovery." : "This will remove the listing from the review queue and keep it out of public discovery."} The decision and acting administrator are recorded in the moderation audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{pendingDecision?.title}</p>
          {pendingDecision?.action === "reject" && <div className="space-y-2">
            <label htmlFor="moderation-rejection-reason" className="text-sm font-extrabold text-slate-800">Private administrator reason <span className="font-medium text-slate-500">(optional)</span></label>
            <Textarea id="moderation-rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value.slice(0, 600))} placeholder="For example: missing required listing details" className="min-h-24 rounded-xl" disabled={decisionPending} />
            <p className="text-xs leading-5 text-slate-500">Stored in the administrator moderation audit trail only. This internal note is not exposed on public listing data or sent in the standard rejection notification.</p>
          </div>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={decisionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDecision} disabled={decisionPending} className={pendingDecision?.action === "reject" ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"}>
              {pendingDecision?.action === "approve" ? (decisionPending ? "Approving…" : "Approve listing") : (decisionPending ? "Rejecting…" : "Reject listing")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
