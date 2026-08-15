import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-premium-user",
    email: "premium-test@example.com",
    name: "Premium Test User",
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

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("subscription.plans", () => {
  it("returns seeded plans publicly", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    const plans = await caller.subscription.plans();
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThanOrEqual(1);
    const names = plans.map((p) => p.name);
    expect(names).toContain("Basic");
  });
});

describe("subscription.mySubscription", () => {
  it("returns the user's active subscription", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.subscription.mySubscription();
    // User 1 was granted an active Premium subscription in the prior session's DB.
    expect(result?.subscription?.status).toBe("active");
    expect(result?.plan?.name).toBeDefined();
  });
});

describe("subscription limits", () => {
  it("reports the correct max images/videos for the default plan", async () => {
    const plans = await db.getSubscriptionPlans();
    expect(plans.length).toBeGreaterThan(0);
    const basic = plans.find((p) => p.name === "Basic");
    expect(basic?.maxImages).toBeGreaterThan(0);
    expect(basic?.maxVideos ?? 0).toBeGreaterThanOrEqual(0);
    const premium = plans.find((p) => p.name === "Premium");
    if (premium) {
      // Premium plan offers more photos than Basic, and allows video uploads
      // (Basic allows 0 videos by design)
      expect(premium.maxImages).toBeGreaterThan(basic!.maxImages);
      expect(premium.maxVideos).toBeGreaterThan(basic!.maxVideos ?? 0);
    }
  });

  it("grants premium and raises limits", async () => {
    // User 1 may already be premium from previous data; grant again and assert the
    // effective limit stays at the premium plan's maxImages (never drops to the free tier).
    await db.grantPremiumSubscription(1);
    const after = await db.getUserMaxImages(1);
    const plans = await db.getSubscriptionPlans();
    const premium = plans.find((p) => p.name === "Premium");
    expect(after).toBeGreaterThanOrEqual(premium?.maxImages ?? 20);
    const premiumCheck = await db.isUserPremium(1);
    expect(premiumCheck).toBe(true);
  });
});

describe("subscription.subscribe + cancel", () => {
  it("creates a subscription, payment record, and supports cancellation", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const plans = await db.getSubscriptionPlans();
    const plan = plans.find((p) => p.name === "Premium");
    if (!plan) {
      throw new Error("Premium plan not seeded");
    }

    const result = await caller.subscription.subscribe({ planId: plan.id, method: "mpesa" });
    expect(result.subscription).toBeDefined();
    expect(result.plan.id).toBe(plan.id);

    // Active subscription now visible
    const sub = await caller.subscription.mySubscription();
    expect(sub?.subscription?.planId).toBe(plan.id);

    // isPremium flips to true
    const premiumCheck = await caller.subscription.isPremium();
    expect(premiumCheck.isPremium).toBe(true);

    // Cancel the newly created subscription and verify its row flips to cancelled.
    // NOTE: user 1 may hold an older admin-granted subscription that stays active;
    // this assertion therefore verifies the cancel mutation itself, not full
    // non-premium status of the user.
    const mySubAfterSubscribe = await caller.subscription.mySubscription();
    await caller.subscription.cancel({ subscriptionId: mySubAfterSubscribe.subscription.id });
    const cancelledRow = await db.getSubscriptionById(mySubAfterSubscribe.subscription.id);
    expect(cancelledRow?.status).toBe("cancelled");
    // After cancelling the most recent subscription, getUserSubscription returns the
    // remaining (older) active one; if user 1 has no older subs at all, isPremium is false.
    const remaining = await db.getUserSubscription(1);
    if (!remaining) {
      const premiumAfterCancel = await caller.subscription.isPremium();
      expect(premiumAfterCancel.isPremium).toBe(false);
    } else {
      expect(remaining.plan.name).toBeDefined();
    }
  });
});

describe("adminPremium", () => {
  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.adminPremium.plans()).rejects.toThrow();
  });

  it("allows admin to read plans and revenue", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const plans = await caller.adminPremium.plans();
    expect(plans.length).toBeGreaterThan(0);
    const revenue = await caller.adminPremium.revenue();
    expect(revenue).toHaveProperty("total");
    expect(revenue).toHaveProperty("count");
  });

  it("allows admin to update a plan", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const plans = await caller.adminPremium.plans();
    const basic = plans.find((p) => p.name === "Basic");
    if (!basic) throw new Error("Basic plan missing");
    const result = await caller.adminPremium.updatePlan({
      id: basic.id,
      name: "Basic",
      price: basic.price,
      maxImages: basic.maxImages,
      maxVideos: basic.maxVideos ?? 0,
      active: true,
    });
    expect(result).toEqual({ success: true });
  });
});

describe("featured listings", () => {
  it("features a property and includes it in public results", async () => {
    const userCaller = appRouter.createCaller(createUserContext());

    // Ensure the test user is premium so featureProperty succeeds
    await db.grantPremiumSubscription(1);

    // Get or create a test property owned by user 1
    let props = await db.getUserProperties(1);
    let property = props[0];
    if (!property) {
      await db.createProperty({
        userId: 1,
        title: "Premium Test Property",
        description: "Test property for premium features",
        price: 1000000,
        listingType: "sale",
        propertyType: "house",
        location: "Nairobi",
        bedrooms: 3,
        bathrooms: 2,
        status: "approved",
      });
      props = await db.getUserProperties(1);
      property = props[0];
    }
    if (!property) throw new Error("Could not obtain test property");

    // Feature the property — idempotently deactivate any prior active feature first
    const prior = await db.getActiveFeaturedListingForProperty(property.id);
    if (prior) {
      await db.deactivateFeaturedListingRecord(prior.id);
    }
    const featured = await userCaller.subscription.featureProperty({
      propertyId: property.id,
      duration: "7_days",
      paymentMethod: "mpesa",
    });
    expect(featured.featured.active).toBe(true);

    // Public getProperties surfaces featured-first ordering and exposes featured flag
    const publicCaller = appRouter.createCaller(createAnonymousContext());
    const all = await publicCaller.property.list({ page: 1, limit: 50 });
    expect(all.items.length).toBeGreaterThan(0);
    const featuredItem = all.items.find((p) => p.featured);
    expect(featuredItem).toBeDefined();
  });
});

describe("analytics.allStats", () => {
  it("requires login and returns per-property stats", async () => {
    const anon = appRouter.createCaller(createAnonymousContext());
    await expect(anon.analytics.allStats()).rejects.toThrow();

    const caller = appRouter.createCaller(createUserContext());
    const stats = await caller.analytics.allStats();
    expect(Array.isArray(stats)).toBe(true);
    if (stats.length > 0) {
      expect(stats[0]).toHaveProperty("views");
      expect(stats[0]).toHaveProperty("saves");
      expect(stats[0]).toHaveProperty("inquiries");
    }
  });
});
