import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({ getAdminDashboardOverview: vi.fn() }));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(role: "user" | "admin"): TrpcContext {
  const user: AuthenticatedUser = { id: role === "admin" ? 1 : 2, openId: `dashboard-${role}`, name: "Dashboard User", email: "dashboard@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("admin dashboard overview", () => {
  it("returns factual overview data only to administrators", async () => {
    const overview = { stats: { totalProperties: 4 }, changes: { properties: null, users: 25 }, series: [], recentProperties: [], recentActivity: [] };
    dbMocks.getAdminDashboardOverview.mockResolvedValue(overview);
    await expect(appRouter.createCaller(context("user")).admin.dashboardOverview({ range: 7 })).rejects.toThrow();
    await expect(appRouter.createCaller(context("admin")).admin.dashboardOverview({ range: 30 })).resolves.toEqual(overview);
    expect(dbMocks.getAdminDashboardOverview).toHaveBeenCalledWith(30);
  });

  it("defaults to seven days and rejects unsupported dashboard ranges", async () => {
    dbMocks.getAdminDashboardOverview.mockResolvedValue({ stats: {}, changes: {}, series: [], recentProperties: [], recentActivity: [] });
    const caller = appRouter.createCaller(context("admin"));
    await caller.admin.dashboardOverview();
    expect(dbMocks.getAdminDashboardOverview).toHaveBeenCalledWith(7);
    await expect(caller.admin.dashboardOverview({ range: 14 as never })).rejects.toThrow();
  });
});
