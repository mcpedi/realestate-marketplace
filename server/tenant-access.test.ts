import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getPropertyById: vi.fn(), createPropertyTenantAssignment: vi.fn(), createModuleAuditLog: vi.fn(),
  getPropertyTenantAssignmentById: vi.fn(), endPropertyTenantAssignment: vi.fn(),
  getPropertyOperationRecordById: vi.fn(), hasActiveTenantAssignment: vi.fn(), updatePropertyOperationRecord: vi.fn(),
  getPropertyTenantAssignmentByInvitation: vi.fn(), activatePropertyTenantAssignment: vi.fn(), getTenantDashboard: vi.fn(),
  getOwnerPropertyTenantAssignments: vi.fn(), getUserProperties: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(id = 7, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = { id, openId: `tenant-${id}`, email: `tenant-${id}@example.com`, name: "Tenant User", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("explicit tenant identity and dashboard access", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a tenant invitation only for a property owner and writes a safe audit event", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 7 });
    dbMocks.createPropertyTenantAssignment.mockResolvedValue({ id: 11, propertyId: 5, ownerUserId: 7, invitationCode: "N360-T-AB12CD34", status: "pending", unitLabel: "A-2", expiresAt: null });
    const caller = appRouter.createCaller(context());
    await expect(caller.tenantAccess.createInvitation({ propertyId: 5, unitLabel: "A-2" })).resolves.toMatchObject({ id: 11, status: "pending" });
    expect(dbMocks.createPropertyTenantAssignment).toHaveBeenCalledWith(expect.objectContaining({ propertyId: 5, ownerUserId: 7, invitationCode: expect.stringMatching(/^N360-T-[A-Z0-9]{8}$/) }));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "tenant_assignment.create", propertyId: 5 }));
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 99 });
    await expect(caller.tenantAccess.createInvitation({ propertyId: 5 })).rejects.toThrow();
  });

  it("allows a different authenticated user to claim a valid pending invitation once", async () => {
    dbMocks.getPropertyTenantAssignmentByInvitation.mockResolvedValue({ id: 11, propertyId: 5, ownerUserId: 7, tenantUserId: null, status: "pending", expiresAt: null });
    dbMocks.activatePropertyTenantAssignment.mockResolvedValue(true);
    const caller = appRouter.createCaller(context(22));
    await expect(caller.tenantAccess.claimInvitation({ invitationCode: "N360-T-AB12CD34" })).resolves.toEqual({ success: true });
    expect(dbMocks.activatePropertyTenantAssignment).toHaveBeenCalledWith(11, 22);
    dbMocks.getPropertyTenantAssignmentByInvitation.mockResolvedValue({ id: 11, propertyId: 5, ownerUserId: 22, tenantUserId: null, status: "pending", expiresAt: null });
    await expect(caller.tenantAccess.claimInvitation({ invitationCode: "N360-T-AB12CD34" })).rejects.toThrow();
  });

  it("links an operation only to a tenant with an active assignment for that exact property", async () => {
    dbMocks.getPropertyOperationRecordById.mockResolvedValue({ id: 44, propertyId: 5, ownerUserId: 7 });
    dbMocks.hasActiveTenantAssignment.mockResolvedValue(true);
    dbMocks.updatePropertyOperationRecord.mockResolvedValue(true);
    const caller = appRouter.createCaller(context());
    await expect(caller.tenantAccess.linkOperation({ operationId: 44, tenantUserId: 22 })).resolves.toEqual({ success: true });
    expect(dbMocks.updatePropertyOperationRecord).toHaveBeenCalledWith(44, { tenantUserId: 22 });
    dbMocks.hasActiveTenantAssignment.mockResolvedValue(false);
    await expect(caller.tenantAccess.linkOperation({ operationId: 44, tenantUserId: 33 })).rejects.toThrow();
  });

  it("returns only the caller's server-scoped tenant dashboard and lets only the owner revoke", async () => {
    dbMocks.getTenantDashboard.mockResolvedValue({ assignments: [{ id: 11, tenantUserId: 22, status: "active" }], properties: [], records: [], documents: [] });
    const tenantCaller = appRouter.createCaller(context(22));
    await expect(tenantCaller.tenantAccess.dashboard()).resolves.toMatchObject({ assignments: [{ tenantUserId: 22 }] });
    expect(dbMocks.getTenantDashboard).toHaveBeenCalledWith(22);
    dbMocks.getPropertyTenantAssignmentById.mockResolvedValue({ id: 11, ownerUserId: 7, propertyId: 5 });
    const outsider = appRouter.createCaller(context(22));
    await expect(outsider.tenantAccess.endAssignment({ id: 11, status: "revoked" })).rejects.toThrow();
    const owner = appRouter.createCaller(context(7));
    dbMocks.endPropertyTenantAssignment.mockResolvedValue(true);
    await expect(owner.tenantAccess.endAssignment({ id: 11, status: "revoked" })).resolves.toEqual({ success: true });
  });
});
