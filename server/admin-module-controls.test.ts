import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  isPlatformModuleEnabled: vi.fn(), getPlatformModuleSetting: vi.fn(), getPlanningAssumptionTemplates: vi.fn(), setPlatformModuleEnabled: vi.fn(), createModuleAuditLog: vi.fn(),
  createPlanningAssumptionTemplate: vi.fn(), getPlanningAssumptionTemplateById: vi.fn(), updatePlanningAssumptionTemplate: vi.fn(),
  getUserPlanningAnalyses: vi.fn(), getPropertyById: vi.fn(), createPlanningAnalysis: vi.fn(), deletePlanningAnalysis: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(role: "user" | "admin" = "user", id = 7): TrpcContext {
  const user: AuthenticatedUser = { id, openId: `modules-${id}`, email: `modules-${id}@example.com`, name: "Module User", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("administrator module controls", () => {
  beforeEach(() => { vi.clearAllMocks(); dbMocks.isPlatformModuleEnabled.mockResolvedValue(true); });

  it("limits module settings and planning template changes to administrators", async () => {
    const userCaller = appRouter.createCaller(context());
    await expect(userCaller.adminModuleControls.setPlanningEnabled({ enabled: false })).rejects.toThrow();
    await expect(userCaller.adminModuleControls.createPlanningTemplate({ name: "Owner-provided defaults", kind: "roi", inputs: { vacancyRate: 5 } })).rejects.toThrow();
    const admin = appRouter.createCaller(context("admin", 1));
    dbMocks.setPlatformModuleEnabled.mockResolvedValue({ id: 2, moduleKey: "planning", enabled: false });
    await expect(admin.adminModuleControls.setPlanningEnabled({ enabled: false })).resolves.toMatchObject({ enabled: false });
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "module_setting.planning", actorUserId: 1 }));
  });

  it("stores only administrator-entered template inputs and keeps their provenance", async () => {
    dbMocks.createPlanningAssumptionTemplate.mockResolvedValue({ id: 4, name: "Owner inputs", kind: "construction", inputs: { costPerSqm: 82000 }, active: true });
    const admin = appRouter.createCaller(context("admin", 1));
    await expect(admin.adminModuleControls.createPlanningTemplate({ name: "Owner inputs", kind: "construction", inputs: { costPerSqm: 82000 } })).resolves.toMatchObject({ id: 4, kind: "construction" });
    expect(dbMocks.createPlanningAssumptionTemplate).toHaveBeenCalledWith(expect.objectContaining({ createdByUserId: 1, updatedByUserId: 1, inputs: { costPerSqm: 82000 } }));
  });

  it("blocks planning APIs server-side while the administrator has disabled the module", async () => {
    dbMocks.isPlatformModuleEnabled.mockResolvedValue(false);
    const userCaller = appRouter.createCaller(context());
    await expect(userCaller.planning.list()).rejects.toThrow();
    await expect(userCaller.planning.calculate({ kind: "roi", inputs: { purchasePrice: 100000 } })).rejects.toThrow();
    expect(dbMocks.getUserPlanningAnalyses).not.toHaveBeenCalled();
  });

  it("serves only active administrator-created templates when planning is enabled", async () => {
    dbMocks.getPlanningAssumptionTemplates.mockResolvedValue([{ id: 4, active: true, kind: "roi", inputs: { vacancyRate: 5 } }]);
    const caller = appRouter.createCaller(context());
    await expect(caller.planning.assumptionTemplates({ kind: "roi" })).resolves.toHaveLength(1);
    expect(dbMocks.getPlanningAssumptionTemplates).toHaveBeenCalledWith("roi", true);
  });
});
