import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({ getAdminDashboardOverview: vi.fn(), getAdminCommandCenter: vi.fn(), getAdminOperationsHub: vi.fn(), getAdminModerationQueue: vi.fn(), getAdminAgencyDirectory: vi.fn(), getAdminSystemHealth: vi.fn(), getAgencyProfileById: vi.fn(), setAgencyVerification: vi.fn(), createModuleAuditLog: vi.fn() }));
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

  it("defaults to seven days, supports the approved control-center presets, and rejects unsupported dashboard ranges", async () => {
    dbMocks.getAdminDashboardOverview.mockResolvedValue({ stats: {}, changes: {}, series: [], recentProperties: [], recentActivity: [] });
    const caller = appRouter.createCaller(context("admin"));
    await caller.admin.dashboardOverview();
    expect(dbMocks.getAdminDashboardOverview).toHaveBeenCalledWith(7);
    await caller.admin.dashboardOverview({ range: 90 });
    await caller.admin.dashboardOverview({ range: 365 });
    expect(dbMocks.getAdminDashboardOverview).toHaveBeenCalledWith(365);
    await expect(caller.admin.dashboardOverview({ range: 14 as never })).rejects.toThrow();
  });

  it("exposes grouped global discovery and factual tasks only to administrators", async () => {
    const commandCenter = {
      tasks: [{ id: "listing-review", label: "Listings awaiting review", count: 2, href: "/admin?tab=pending", tone: "amber" }],
      search: { properties: [{ id: 4, title: "Kilimani Apartment", location: "Kilimani", status: "approved", price: 150000 }], users: [], payments: [] },
    };
    dbMocks.getAdminCommandCenter.mockResolvedValue(commandCenter);
    const adminCaller = appRouter.createCaller(context("admin"));
    await expect(appRouter.createCaller(context("user")).admin.commandCenter({ query: "Kilimani" })).rejects.toThrow();
    await expect(adminCaller.admin.commandCenter({ query: "Kilimani" })).resolves.toEqual(commandCenter);
    expect(dbMocks.getAdminCommandCenter).toHaveBeenCalledWith("Kilimani");
    await expect(adminCaller.admin.commandCenter({ query: "x".repeat(81) })).rejects.toThrow();
  });

  it("keeps operations summaries admin-only and bounds their pagination input", async () => {
    const operations = { page: 2, limit: 10, payments: [], viewings: [], documents: [], auditEvents: [] };
    dbMocks.getAdminOperationsHub.mockResolvedValue(operations);
    const adminCaller = appRouter.createCaller(context("admin"));
    await expect(appRouter.createCaller(context("user")).admin.operationsHub({ page: 2, limit: 10 })).rejects.toThrow();
    await expect(adminCaller.admin.operationsHub({ page: 2, limit: 10 })).resolves.toEqual(operations);
    expect(dbMocks.getAdminOperationsHub).toHaveBeenCalledWith({ page: 2, limit: 10 });
    await expect(adminCaller.admin.operationsHub({ page: 1, limit: 26 })).rejects.toThrow();
  });

  it("keeps the moderation queue admin-only and validates its bounded filters", async () => {
    const moderation = { page: 1, limit: 10, total: 1, items: [{ id: 4, title: "Kilimani Apartment", status: "pending" }] };
    dbMocks.getAdminModerationQueue.mockResolvedValue(moderation);
    const adminCaller = appRouter.createCaller(context("admin"));
    const input = { status: "pending" as const, query: "Kilimani", page: 1, limit: 10 };
    await expect(appRouter.createCaller(context("user")).admin.moderationQueue(input)).rejects.toThrow();
    await expect(adminCaller.admin.moderationQueue(input)).resolves.toEqual(moderation);
    expect(dbMocks.getAdminModerationQueue).toHaveBeenCalledWith(input);
    await expect(adminCaller.admin.moderationQueue({ status: "all", query: "x".repeat(81), page: 1, limit: 10 })).rejects.toThrow();
  });

  it("keeps the agency directory admin-only and validates its bounded filters", async () => {
    const directory = { page: 1, limit: 10, total: 1, items: [{ id: 3, agencyName: "Nyumba Agency", verified: false }] };
    dbMocks.getAdminAgencyDirectory.mockResolvedValue(directory);
    const adminCaller = appRouter.createCaller(context("admin"));
    const input = { verification: "unverified" as const, query: "Nyumba", page: 1, limit: 10 };
    await expect(appRouter.createCaller(context("user")).admin.agencyDirectory(input)).rejects.toThrow();
    await expect(adminCaller.admin.agencyDirectory(input)).resolves.toEqual(directory);
    expect(dbMocks.getAdminAgencyDirectory).toHaveBeenCalledWith(input);
    await expect(adminCaller.admin.agencyDirectory({ verification: "all", query: "x".repeat(81), page: 1, limit: 10 })).rejects.toThrow();
  });

  it("keeps the system-health posture summary admin-only", async () => {
    const health = { checkedAt: new Date("2026-08-25T08:00:00.000Z"), database: { status: "available", label: "Database connection" }, controls: [] };
    dbMocks.getAdminSystemHealth.mockResolvedValue(health);
    await expect(appRouter.createCaller(context("user")).admin.systemHealth()).rejects.toThrow();
    await expect(appRouter.createCaller(context("admin")).admin.systemHealth()).resolves.toEqual(health);
  });

  it("records an audit event when an administrator changes an agency verification flag", async () => {
    dbMocks.getAgencyProfileById.mockResolvedValue({ id: 9, userId: 42, verified: false });
    dbMocks.setAgencyVerification.mockResolvedValue(true);
    dbMocks.createModuleAuditLog.mockResolvedValue({ id: 1 });
    const input = { agencyId: 9, verified: true };
    await expect(appRouter.createCaller(context("user")).admin.setAgencyVerification(input)).rejects.toThrow();
    await expect(appRouter.createCaller(context("admin")).admin.setAgencyVerification(input)).resolves.toEqual({ success: true });
    expect(dbMocks.setAgencyVerification).toHaveBeenCalledWith(9, true);
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "agency.verify", resourceType: "agency", resourceId: 9, metadata: { agencyUserId: 42, verified: true } }));
  });
});
