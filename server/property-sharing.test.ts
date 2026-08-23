import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getPropertyById: vi.fn(), getPropertyIdentifierByPropertyId: vi.fn(), createPropertyIdentifier: vi.fn(),
  getPropertyShareRecordByPropertyId: vi.fn(), createPropertyShareRecord: vi.fn(), setPropertyShareEnabled: vi.fn(),
  createModuleAuditLog: vi.fn(), getPublicPropertyShare: vi.fn(), getUserProperties: vi.fn(), getPropertyIdentifiersByPropertyIds: vi.fn(), getPropertyShareRecordsByPropertyIds: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(id = 7, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = { id, openId: `sharing-${id}`, email: `sharing-${id}@example.com`, name: "Sharing User", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("property sharing privacy controls", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates public sharing only for an approved listing owned by the caller", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 4, userId: 7, status: "approved", location: "Kilimani, Nairobi" });
    dbMocks.getPropertyIdentifierByPropertyId.mockResolvedValue({ id: 8, propertyId: 4, identifier: "N360-KIL-000004" });
    dbMocks.getPropertyShareRecordByPropertyId.mockResolvedValue(undefined);
    dbMocks.createPropertyShareRecord.mockResolvedValue({ id: 9, propertyId: 4, propertyIdentifierId: 8, enabled: true });
    const caller = appRouter.createCaller(context());
    await expect(caller.propertySharing.ensure({ propertyId: 4 })).resolves.toMatchObject({ identifier: "N360-KIL-000004", share: { enabled: true } });
    expect(dbMocks.createPropertyShareRecord).toHaveBeenCalledWith(expect.objectContaining({ propertyId: 4, propertyIdentifierId: 8, createdByUserId: 7 }));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "property_share.create", propertyId: 4 }));
  });

  it("rejects sharing for another user's or an unapproved listing", async () => {
    const caller = appRouter.createCaller(context());
    dbMocks.getPropertyById.mockResolvedValue({ id: 4, userId: 99, status: "approved" });
    await expect(caller.propertySharing.ensure({ propertyId: 4 })).rejects.toThrow();
    dbMocks.getPropertyById.mockResolvedValue({ id: 4, userId: 7, status: "pending" });
    await expect(caller.propertySharing.ensure({ propertyId: 4 })).rejects.toThrow();
    expect(dbMocks.createPropertyShareRecord).not.toHaveBeenCalled();
  });

  it("allows only owners to enable or disable a sharing record and audits the change", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 4, userId: 7, status: "approved" });
    dbMocks.getPropertyShareRecordByPropertyId.mockResolvedValue({ id: 9, propertyId: 4, enabled: true });
    dbMocks.setPropertyShareEnabled.mockResolvedValue(true);
    const caller = appRouter.createCaller(context());
    await expect(caller.propertySharing.setEnabled({ propertyId: 4, enabled: false })).resolves.toEqual({ success: true });
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "property_share.set_enabled", metadata: { enabled: false } }));
  });

  it("returns a public sharing result only through the approved and enabled resolver", async () => {
    dbMocks.getPublicPropertyShare.mockResolvedValue({ identifier: "N360-KIL-000004", shareId: 9, property: { id: 4, title: "Kilimani apartment" }, photos: [] });
    const caller = appRouter.createCaller(context());
    await expect(caller.propertySharing.publicLookup({ identifier: "N360-KIL-000004" })).resolves.toMatchObject({ identifier: "N360-KIL-000004", property: { id: 4 } });
    dbMocks.getPublicPropertyShare.mockResolvedValue(undefined);
    await expect(caller.propertySharing.publicLookup({ identifier: "N360-KIL-000004" })).rejects.toThrow();
    await expect(caller.propertySharing.publicLookup({ identifier: "untrusted" })).rejects.toThrow();
  });
});
