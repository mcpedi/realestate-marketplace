import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user", id = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: "test-leads-user",
    email: "leads-test@example.com",
    name: "Leads Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("leads.myLeads", () => {
  it("returns leads scoped to the seller's own properties", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const leads = await caller.leads.myLeads();
    expect(Array.isArray(leads)).toBe(true);
    for (const lead of leads) {
      expect(lead.propertyTitle).toBeTruthy();
      expect(lead.buyerName).toBeTruthy();
      expect(lead.buyerEmail).toContain("@");
      expect(["new", "contacted", "viewing", "negotiating", "closed", "lost"]).toContain(lead.status);
    }
  });

  it("rejects anonymous callers", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.leads.myLeads()).rejects.toThrow(TRPCError);
  });
});

describe("leads.stats", () => {
  it("computes totals and conversion rate consistently", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const [stats, leads] = await Promise.all([caller.leads.stats(), caller.leads.myLeads()]);
    expect(stats.total).toBe(leads.length);
    const buckets =
      stats.newLeads + stats.contacted + stats.viewing + stats.negotiating + stats.closed + stats.lost;
    expect(buckets).toBe(stats.total);
    if (stats.total > 0) {
      expect(stats.conversionRate).toBe(Math.round((stats.closed / stats.total) * 100));
    } else {
      expect(stats.conversionRate).toBe(0);
    }
  });
});

describe("leads.updateStatus", () => {
  it("updates status on a lead owned by the seller and restores it", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const leads = await caller.leads.myLeads();
    if (leads.length === 0) return;
    const target = leads[0];
    const original = target.status;
    const next = original === "closed" ? "new" : "closed";
    await caller.leads.updateStatus({ leadId: target.leadId, status: next });
    const refreshed = await caller.leads.myLeads();
    expect(refreshed.find((l) => l.leadId === target.leadId)?.status).toBe(next);
    // Restore original status
    await caller.leads.updateStatus({ leadId: target.leadId, status: original });
    const restored = await caller.leads.myLeads();
    expect(restored.find((l) => l.leadId === target.leadId)?.status).toBe(original);
  });

  it("rejects updates to leads the seller does not own", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.updateStatus({ leadId: 999999999, status: "closed" })).rejects.toThrow(TRPCError);
  });
});
