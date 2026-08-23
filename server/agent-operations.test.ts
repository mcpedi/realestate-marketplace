import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getAgentOperationsSummary: vi.fn(),
  getAgentContacts: vi.fn(),
  getPropertyById: vi.fn(),
  createAgentContact: vi.fn(),
  createModuleAuditLog: vi.fn(),
  getAgentContactById: vi.fn(),
  updateAgentContact: vi.fn(),
  createLeadActivity: vi.fn(),
  getLeadActivities: vi.fn(),
  getListingTemplates: vi.fn(),
  createListingTemplate: vi.fn(),
  getListingTemplateById: vi.fn(),
  deleteListingTemplate: vi.fn(),
  getAgentTransactions: vi.fn(),
  createAgentTransaction: vi.fn(),
  getAgentTransactionById: vi.fn(),
  updateAgentTransaction: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(userId = 7): TrpcContext {
  const user: AuthenticatedUser = { id: userId, openId: `agent-${userId}`, email: `agent-${userId}@example.com`, name: "Agent User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("Agent Operations protected CRM workflows", () => {
  const contact = { id: 12, ownerUserId: 7, propertyId: 5, name: "Amina Buyer", stage: "new", source: "manual", createdAt: new Date(), updatedAt: new Date() };

  beforeEach(() => vi.clearAllMocks());

  it("creates a CRM contact only for an owned property and records an audit event", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 7 });
    dbMocks.createAgentContact.mockResolvedValue(contact);
    const caller = appRouter.createCaller(context());

    await expect(caller.agentOperations.contacts.create({ propertyId: 5, name: "Amina Buyer", email: "amina@example.com", source: "manual" })).resolves.toMatchObject({ id: 12, name: "Amina Buyer" });
    expect(dbMocks.createAgentContact).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: 7, stage: "new" }));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "agent_contact.create", resourceId: 12, propertyId: 5 }));
  });

  it("rejects CRM contact creation for another owner's property before inserting", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 99 });
    const caller = appRouter.createCaller(context());
    await expect(caller.agentOperations.contacts.create({ propertyId: 5, name: "Amina Buyer" })).rejects.toThrow();
    expect(dbMocks.createAgentContact).not.toHaveBeenCalled();
  });

  it("writes a timeline activity and audit log when an owner updates the CRM stage", async () => {
    dbMocks.getAgentContactById.mockResolvedValue(contact);
    dbMocks.updateAgentContact.mockResolvedValue(true);
    dbMocks.createLeadActivity.mockResolvedValue({ id: 31 });
    const caller = appRouter.createCaller(context());

    await expect(caller.agentOperations.contacts.updateStage({ id: 12, stage: "qualified" })).resolves.toEqual({ success: true });
    expect(dbMocks.createLeadActivity).toHaveBeenCalledWith(expect.objectContaining({ contactId: 12, agentUserId: 7, type: "stage_change", fromStage: "new", toStage: "qualified" }));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "agent_contact.stage_update", resourceId: 12 }));
  });

  it("keeps listing templates private to the owner and rejects invalid template input", async () => {
    dbMocks.getListingTemplateById.mockResolvedValue({ id: 22, ownerUserId: 99, category: "rent" });
    const caller = appRouter.createCaller(context());
    await expect(caller.agentOperations.templates.remove({ id: 22 })).rejects.toThrow();
    await expect(caller.agentOperations.templates.create({ name: "x", category: "sale", templateData: {} })).rejects.toThrow();
    expect(dbMocks.deleteListingTemplate).not.toHaveBeenCalled();
  });

  it("creates an owned-property transaction and protects status changes from other users", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 5, userId: 7 });
    dbMocks.createAgentTransaction.mockResolvedValue({ id: 66, propertyId: 5, ownerUserId: 7, title: "Apartment sale", stage: "intake", status: "active" });
    dbMocks.getAgentTransactionById.mockResolvedValue({ id: 66, propertyId: 5, ownerUserId: 99, title: "Apartment sale", stage: "intake", status: "active" });
    const caller = appRouter.createCaller(context());

    await expect(caller.agentOperations.transactions.create({ propertyId: 5, title: "Apartment sale", amount: 8000000 })).resolves.toMatchObject({ id: 66, propertyId: 5 });
    await expect(caller.agentOperations.transactions.updateStage({ id: 66, stage: "offer", status: "active" })).rejects.toThrow();
    expect(dbMocks.createAgentTransaction).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: 7, amount: "8000000", stage: "intake" }));
  });

  it("returns the owner-scoped performance summary", async () => {
    dbMocks.getAgentOperationsSummary.mockResolvedValue({ totalContacts: 5, activeContacts: 4, followUpsDue: 2, openTransactions: 1, marketplaceLeads: 3, byStage: { new: 1, contacted: 1, qualified: 1, viewing: 1, negotiating: 0, won: 1, lost: 0 } });
    const caller = appRouter.createCaller(context());
    await expect(caller.agentOperations.summary()).resolves.toMatchObject({ totalContacts: 5, followUpsDue: 2, openTransactions: 1 });
  });
});
