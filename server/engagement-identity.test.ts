import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getWishlistCollections: vi.fn(),
  createWishlistCollection: vi.fn(),
  createModuleAuditLog: vi.fn(),
  getWishlistCollectionById: vi.fn(),
  updateWishlistCollection: vi.fn(),
  deleteWishlistCollection: vi.fn(),
  isFavorite: vi.fn(),
  addWishlistCollectionItem: vi.fn(),
  removeWishlistCollectionItem: vi.fn(),
  getUserProperties: vi.fn(),
  getPropertyIdentifiersByPropertyIds: vi.fn(),
  getPropertyById: vi.fn(),
  getPropertyIdentifierByPropertyId: vi.fn(),
  createPropertyIdentifier: vi.fn(),
  getPublicPropertyByIdentifier: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(userId = 7): TrpcContext {
  const user: AuthenticatedUser = { id: userId, openId: `engagement-${userId}`, email: `engagement-${userId}@example.com`, name: "Engagement User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("Wishlist collections and property identity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates private collections and only adds already-favourited properties", async () => {
    dbMocks.createWishlistCollection.mockResolvedValue({ id: 21, ownerUserId: 7, name: "Dream homes" });
    dbMocks.getWishlistCollectionById.mockResolvedValue({ id: 21, ownerUserId: 7 });
    dbMocks.isFavorite.mockResolvedValue(true);
    const caller = appRouter.createCaller(context());

    await expect(caller.collections.create({ name: "Dream homes" })).resolves.toMatchObject({ id: 21, name: "Dream homes" });
    await expect(caller.collections.addProperty({ collectionId: 21, propertyId: 4 })).resolves.toEqual({ success: true });
    expect(dbMocks.addWishlistCollectionItem).toHaveBeenCalledWith({ collectionId: 21, propertyId: 4 });
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "wishlist_collection.add_property", propertyId: 4 }));
  });

  it("rejects cross-user collection changes and properties that are not favourites", async () => {
    dbMocks.getWishlistCollectionById.mockResolvedValue({ id: 21, ownerUserId: 99 });
    const caller = appRouter.createCaller(context());
    await expect(caller.collections.remove({ id: 21 })).rejects.toThrow();
    await expect(caller.collections.addProperty({ collectionId: 21, propertyId: 4 })).rejects.toThrow();
    expect(dbMocks.addWishlistCollectionItem).not.toHaveBeenCalled();
  });

  it("creates a permanent property ID only for the property owner and audits the action", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 4, userId: 7, location: "Kilimani, Nairobi" });
    dbMocks.getPropertyIdentifierByPropertyId.mockResolvedValue(undefined);
    dbMocks.createPropertyIdentifier.mockResolvedValue({ id: 41, propertyId: 4, identifier: "N360-KIL-000004", createdByUserId: 7 });
    const caller = appRouter.createCaller(context());

    await expect(caller.propertyIdentity.ensure({ propertyId: 4 })).resolves.toMatchObject({ identifier: "N360-KIL-000004" });
    expect(dbMocks.createPropertyIdentifier).toHaveBeenCalledWith({ propertyId: 4, identifier: "N360-KIL-000004", createdByUserId: 7 });
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "property_identifier.create", propertyId: 4 }));
  });

  it("does not reveal an identity for a non-owner property or a missing public approved listing", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 4, userId: 99, location: "Kilimani" });
    dbMocks.getPublicPropertyByIdentifier.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(context());
    await expect(caller.propertyIdentity.ensure({ propertyId: 4 })).rejects.toThrow();
    await expect(caller.propertyIdentity.lookup({ identifier: "N360-KIL-000004" })).rejects.toThrow();
  });

  it("validates the public identifier format before it reaches the data layer", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.propertyIdentity.lookup({ identifier: "untrusted-identity" })).rejects.toThrow();
    expect(dbMocks.getPublicPropertyByIdentifier).not.toHaveBeenCalled();
  });
});
