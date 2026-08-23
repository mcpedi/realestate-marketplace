import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createPlanningAnalysis: vi.fn(),
  getUserPlanningAnalyses: vi.fn(),
  deletePlanningAnalysis: vi.fn(),
  getPropertyById: vi.fn(),
}));

vi.mock("./db", () => mocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(userId = 7): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `planning-user-${userId}`,
    email: `planning-${userId}@example.com`,
    name: "Planning Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const roiInputs = { purchasePrice: 10_000_000, monthlyRent: 100_000, monthlyExpenses: 10_000, annualExpenses: 60_000, vacancyRate: 5, additionalCosts: 500_000 };

describe("planning router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves a user-owned scenario after confirming its linked property belongs to the caller", async () => {
    mocks.getPropertyById.mockResolvedValue({ id: 11, userId: 7 });
    mocks.createPlanningAnalysis.mockResolvedValue({ id: 41, userId: 7, kind: "roi", name: "Kilimani ROI", inputs: roiInputs });
    const caller = appRouter.createCaller(context());

    const result = await caller.planning.save({ kind: "roi", name: "Kilimani ROI", propertyId: 11, inputs: roiInputs });

    expect(result.analysis?.id).toBe(41);
    expect(result.result.headline.label).toBe("Estimated annual ROI");
    expect(mocks.createPlanningAnalysis).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, propertyId: 11, kind: "roi", name: "Kilimani ROI", inputs: roiInputs }));
  });

  it("rejects linking a planning scenario to somebody else's property", async () => {
    mocks.getPropertyById.mockResolvedValue({ id: 11, userId: 9 });
    const caller = appRouter.createCaller(context());
    await expect(caller.planning.save({ kind: "roi", name: "Restricted property", propertyId: 11, inputs: roiInputs })).rejects.toThrow("only link a scenario to your own property");
    expect(mocks.createPlanningAnalysis).not.toHaveBeenCalled();
  });

  it("scopes list and delete actions to the authenticated user", async () => {
    mocks.getUserPlanningAnalyses.mockResolvedValue([{ id: 41, userId: 7, name: "Kilimani ROI" }]);
    mocks.deletePlanningAnalysis.mockResolvedValue(true);
    const caller = appRouter.createCaller(context());
    await expect(caller.planning.list()).resolves.toHaveLength(1);
    await expect(caller.planning.delete({ id: 41 })).resolves.toEqual({ success: true });
    expect(mocks.getUserPlanningAnalyses).toHaveBeenCalledWith(7);
    expect(mocks.deletePlanningAnalysis).toHaveBeenCalledWith(41, 7);
  });

  it("rejects invalid percentage inputs server-side before calculating or saving", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.planning.calculate({ kind: "roi", inputs: { ...roiInputs, vacancyRate: 101 } })).rejects.toThrow("vacancyRate cannot exceed 100%");
    await expect(caller.planning.save({ kind: "roi", name: "Invalid rate", inputs: { ...roiInputs, vacancyRate: 101 } })).rejects.toThrow("vacancyRate cannot exceed 100%");
  });
});
