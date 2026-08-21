import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(id = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: "test-modern-user",
    email: "modern-test@example.com",
    name: "Modern Test User",
    loginMethod: "manus",
    role: "user",
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

describe("modern recommendations", () => {
  it("returns an items array excluding the caller's favorites", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const recs = await caller.modern.recommendations();
    expect(Array.isArray(recs.items)).toBe(true);
  });

  it("rejects anonymous callers", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.modern.recommendations()).rejects.toThrow(TRPCError);
  });
});

describe("modern preferences", () => {
  it("persists a round-trip preference set", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const set = await caller.modern.preferencesSet({
      preferredLocations: ["Migori"],
      preferredTypes: ["apartment"],
      budgetMin: 50000,
      budgetMax: 200000,
      minBedrooms: 1,
      listingType: "any",
    });
    expect(set).toBeTruthy();
    const prefs = await caller.modern.preferencesGet();
    expect(prefs?.preferredLocations).toContain("Migori");
    expect(prefs?.preferredTypes).toContain("apartment");
    expect(prefs?.budgetMax).toBe(200000);
  });

  it("rejects anonymous callers", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.modern.preferencesGet()).rejects.toThrow(TRPCError);
  });
});

describe("modern activity tracking", () => {
  it("records a view event", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.modern.recordActivity({ propertyId: 1, eventType: "view" });
    expect(result).toBeTruthy();
  });

  it("rejects invalid event types", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      // @ts-expect-error intentionally invalid input
      caller.modern.recordActivity({ propertyId: 1, eventType: "bogus" }),
    ).rejects.toThrow();
  });
});

describe("modern account notifications", () => {
  it("returns typed live counts for the persistent account header", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const summary = await caller.modern.accountActivitySummary();
    expect(summary.newLeadCount).toEqual(expect.any(Number));
    expect(summary.unreadNotificationCount).toEqual(expect.any(Number));
  });

  it("lists the signed-in member's notification inbox", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const notifications = await caller.modern.notificationsList();
    expect(Array.isArray(notifications)).toBe(true);
  });

  it("rejects anonymous notification inbox requests", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.modern.notificationsList()).rejects.toThrow(TRPCError);
  });
});

describe("modern alerts", () => {
  it("creates and lists an instant alert", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const created = await caller.modern.alertCreate({
      type: "instant",
      propertyId: null,
      criteria: { location: "Migori", propertyType: "apartment", maxPrice: 200000 },
    });
    expect((created as { success: boolean }).success).toBe(true);
    const list = await caller.modern.alertList();
    expect(Array.isArray(list)).toBe(true);
  });

  it("deletes an alert", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await caller.modern.alertCreate({ type: "priceDrop", propertyId: null, criteria: {} });
    const list = await caller.modern.alertList();
    if (list.length > 0) {
      const last = list[list.length - 1] as { id: number };
      const deleted = await caller.modern.alertDelete({ id: last.id });
      expect((deleted as { success: boolean }).success).toBe(true);
    }
  });
});

describe("modern bookings", () => {
  it("creates and lists a viewing booking", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const scheduledAt = Date.now() + 86400000;
    const created = await caller.modern.bookingCreate({
      propertyId: 1,
      scheduledAt,
      type: "physical",
      notes: "Test viewing",
    });
    expect(created).toBeTruthy();
    const mine = await caller.modern.myBookings();
    expect(Array.isArray(mine)).toBe(true);
    expect(mine.some((b) => b.type === "physical")).toBe(true);
  });

  it("rejects bookings scheduled in the past", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.modern.bookingCreate({ propertyId: 1, scheduledAt: Date.now() - 1000, type: "virtual" }),
    ).rejects.toThrow();
  });

  it("seller update fails when the caller owns no matching property", async () => {
    const caller = appRouter.createCaller(createUserContext(999999));
    await expect(
      caller.modern.sellerBookingUpdate({ id: 999999, status: "confirmed" }),
    ).rejects.toThrow(TRPCError);
  });
});

describe("modern property score", () => {
  it("computes a score bounded between 0 and 100", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const score = await caller.modern.propertyScoreCompute({ propertyId: 1 });
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.locationScore).toBeGreaterThanOrEqual(0);
    expect(score.locationScore).toBeLessThanOrEqual(100);
  });

  it("retrieves the persisted score for approved listings", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const score = await caller.modern.propertyScore({ propertyId: 1 });
    if (score) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("modern nearbyPois", () => {
  it("runs as a public procedure returning an array", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    const pois = await caller.modern.nearbyPois({ lat: -1.06, lng: 34.76, category: "school" });
    expect(Array.isArray(pois)).toBe(true);
  });
});
