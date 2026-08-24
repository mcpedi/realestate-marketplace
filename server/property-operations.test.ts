import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getPropertyById: vi.fn(),
  getPropertyDocuments: vi.fn(),
  createPropertyDocument: vi.fn(),
  createModuleAuditLog: vi.fn(),
  getPropertyDocumentById: vi.fn(),
  getDocumentAccess: vi.fn(),
  softDeletePropertyDocument: vi.fn(),
  getPropertyAuditLogs: vi.fn(),
  grantDocumentAccess: vi.fn(),
  createPropertyOperationRecord: vi.fn(),
  getOwnerPropertyOperationRecords: vi.fn(),
  getPropertyOperationRecordById: vi.fn(),
  updatePropertyOperationRecord: vi.fn(),
  getOwnerPropertyOperationSummary: vi.fn(),
}));
const storageMocks = vi.hoisted(() => ({ storagePut: vi.fn(), storageGetSignedUrl: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => storageMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(userId = 7): TrpcContext {
  const user: AuthenticatedUser = { id: userId, openId: `operations-${userId}`, email: `operations-${userId}@example.com`, name: "Operations User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const validUpload = { propertyId: 5, name: "title-deed.pdf", category: "ownership" as const, mimeType: "application/pdf" as const, data: Buffer.from("%PDF-1.7\nsecure document").toString("base64") };

describe("Property Operations document vault", () => {
  beforeEach(() => { vi.clearAllMocks(); storageMocks.storagePut.mockResolvedValue({ key: "property-documents/7/5/title-deed_abc.pdf", url: "/manus-storage/property-documents/7/5/title-deed_abc.pdf" }); });

  it("allows only the property owner to list and upload protected documents", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 7 });
    dbMocks.getPropertyDocuments.mockResolvedValue([]);
    dbMocks.createPropertyDocument.mockResolvedValue({ id: 12, propertyId: 5, uploadedByUserId: 7, name: "title-deed.pdf" });
    const caller = appRouter.createCaller(context());

    await expect(caller.operations.documents.list({ propertyId: 5 })).resolves.toEqual([]);
    await expect(caller.operations.documents.upload(validUpload)).resolves.toMatchObject({ id: 12, propertyId: 5 });
    expect(storageMocks.storagePut).toHaveBeenCalled();
    expect(dbMocks.createPropertyDocument).toHaveBeenCalledWith(expect.objectContaining({ propertyId: 5, uploadedByUserId: 7, fileKey: "property-documents/7/5/title-deed_abc.pdf" }));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "document.upload", actorUserId: 7, propertyId: 5 }));
  });

  it("rejects uploads and lists for a property owned by someone else", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 99 });
    const caller = appRouter.createCaller(context());
    await expect(caller.operations.documents.list({ propertyId: 5 })).rejects.toThrow();
    await expect(caller.operations.documents.upload(validUpload)).rejects.toThrow("Only the property owner can upload documents");
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
  });

  it("issues a signed download only to a user with download permission", async () => {
    dbMocks.getPropertyDocumentById.mockResolvedValue({ id: 12, propertyId: 5, uploadedByUserId: 99, fileKey: "private/title-deed.pdf", name: "title-deed.pdf" });
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 99 });
    dbMocks.getDocumentAccess.mockResolvedValue({ id: 3, documentId: 12, userId: 7, permission: "download" });
    storageMocks.storageGetSignedUrl.mockResolvedValue("https://signed.example/title-deed.pdf");
    const caller = appRouter.createCaller(context());

    await expect(caller.operations.documents.download({ id: 12 })).resolves.toEqual({ url: "https://signed.example/title-deed.pdf", name: "title-deed.pdf" });
    expect(storageMocks.storageGetSignedUrl).toHaveBeenCalledWith("private/title-deed.pdf");
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "document.download", propertyId: 5 }));
  });

  it("rejects a view-only grant from downloading and prevents deletion by unauthorized users", async () => {
    dbMocks.getPropertyDocumentById.mockResolvedValue({ id: 12, propertyId: 5, uploadedByUserId: 99, fileKey: "private/title-deed.pdf", name: "title-deed.pdf", category: "ownership" });
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 99 });
    dbMocks.getDocumentAccess.mockResolvedValue({ id: 3, documentId: 12, userId: 7, permission: "view" });
    const caller = appRouter.createCaller(context());
    await expect(caller.operations.documents.download({ id: 12 })).rejects.toThrow();
    await expect(caller.operations.documents.remove({ id: 12 })).rejects.toThrow();
    expect(dbMocks.softDeletePropertyDocument).not.toHaveBeenCalled();
  });
});

describe("Property Operations workflow records", () => {
  const maintenanceRecord = { id: 44, propertyId: 5, ownerUserId: 7, type: "maintenance", title: "Repair kitchen tap", status: "open", priority: "high", createdAt: new Date(), updatedAt: new Date() };

  beforeEach(() => { vi.clearAllMocks(); });

  it("creates and lists records only for the property owner and writes an audit event", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 7 });
    dbMocks.createPropertyOperationRecord.mockResolvedValue(maintenanceRecord);
    dbMocks.getOwnerPropertyOperationRecords.mockResolvedValue([maintenanceRecord]);
    const caller = appRouter.createCaller(context());

    await expect(caller.operations.records.create({ propertyId: 5, type: "maintenance", title: "Repair kitchen tap", status: "open", priority: "high", amount: 4500, details: "Leak under the sink" })).resolves.toMatchObject({ id: 44, type: "maintenance" });
    await expect(caller.operations.records.list({ propertyId: 5, type: "maintenance" })).resolves.toEqual([maintenanceRecord]);
    expect(dbMocks.createPropertyOperationRecord).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: 7, amount: "4500", details: { notes: "Leak under the sink" } }));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "operations.maintenance.create", propertyId: 5, actorUserId: 7 }));
  });

  it("rejects a record creation and filtered list for another owner's property", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 99 });
    const caller = appRouter.createCaller(context());
    await expect(caller.operations.records.create({ propertyId: 5, type: "lease", title: "Lease for apartment", status: "active" })).rejects.toThrow();
    await expect(caller.operations.records.list({ propertyId: 5 })).rejects.toThrow();
    expect(dbMocks.createPropertyOperationRecord).not.toHaveBeenCalled();
  });

  it("validates required workflow details before querying the database", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.operations.records.create({ propertyId: 5, type: "rent", title: "x", status: "" })).rejects.toThrow();
    expect(dbMocks.getPropertyById).not.toHaveBeenCalled();
  });

  it("updates only an owned record, writes an audit event, and exposes the owner summary", async () => {
    dbMocks.getPropertyOperationRecordById.mockResolvedValue(maintenanceRecord);
    dbMocks.updatePropertyOperationRecord.mockResolvedValue(true);
    dbMocks.getOwnerPropertyOperationSummary.mockResolvedValue({ total: 5, open: 3, dueSoon: 1, byType: { lease: 1, inspection: 1, maintenance: 2, rent: 1, vacancy: 0 } });
    const caller = appRouter.createCaller(context());

    await expect(caller.operations.records.updateStatus({ id: 44, status: "resolved" })).resolves.toEqual({ success: true });
    await expect(caller.operations.records.summary()).resolves.toMatchObject({ total: 5, open: 3, dueSoon: 1 });
    expect(dbMocks.updatePropertyOperationRecord).toHaveBeenCalledWith(44, expect.objectContaining({ status: "resolved", completedAt: expect.any(Date) }));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "operations.maintenance.status_update", resourceId: 44 }));
  });
});
