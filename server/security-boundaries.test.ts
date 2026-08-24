import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getPropertyById: vi.fn(),
  getPublicPropertyById: vi.fn(),
  getPublicPropertyPhotos: vi.fn(),
  getPublicSellerByPropertyId: vi.fn(),
  getPublicProperties: vi.fn(),
  getPublicFeaturedProperties: vi.fn(),
  getPublicLatestProperties: vi.fn(),
  incrementPropertyViews: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import { isPublicStorageKey } from "./_core/storageProxy";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const owner: AuthenticatedUser = {
  id: 7,
  openId: "owner-open-id",
  name: "Owner User",
  email: "owner@example.com",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const publicListing = {
  id: 11,
  title: "Approved Kilimani apartment",
  description: "A secure approved listing.",
  price: 125000,
  location: "Kilimani, Nairobi",
  latitude: -1.2921,
  longitude: 36.783,
  propertyType: "apartment" as const,
  listingType: "rent" as const,
  bedrooms: 2,
  bathrooms: 2,
  landSize: null,
  floorArea: 90,
  amenities: ["Parking"],
  featured: false,
  viewsCount: 3,
  createdAt: new Date(),
};

describe("marketplace privacy boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only the approved public projection to an anonymous listing visitor", async () => {
    dbMocks.getPublicPropertyById.mockResolvedValue(publicListing);
    const caller = appRouter.createCaller(context(null));

    const result = await caller.property.byId(11);

    expect(result).toEqual(publicListing);
    expect(dbMocks.getPropertyById).not.toHaveBeenCalled();
    expect(dbMocks.incrementPropertyViews).toHaveBeenCalledWith(11);
    expect(result).not.toHaveProperty("userId");
    expect(result).not.toHaveProperty("status");
  });

  it("does not expose a non-public listing to a different signed-in user", async () => {
    dbMocks.getPropertyById.mockResolvedValue({ id: 12, userId: owner.id, status: "pending", privateNotes: "Not public" });
    dbMocks.getPublicPropertyById.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(context({ ...owner, id: 8, openId: "other-user" }));

    await expect(caller.property.byId(12)).resolves.toBeNull();
    expect(dbMocks.incrementPropertyViews).not.toHaveBeenCalled();
  });

  it("preserves a seller's own private listing access without making it public", async () => {
    const privateListing = { id: 12, userId: owner.id, status: "pending", title: "My draft" };
    dbMocks.getPropertyById.mockResolvedValue(privateListing);
    const caller = appRouter.createCaller(context(owner));

    await expect(caller.property.byId(12)).resolves.toEqual(privateListing);
    expect(dbMocks.getPublicPropertyById).not.toHaveBeenCalled();
  });

  it("returns only the public seller profile and blocks private listing photos", async () => {
    dbMocks.getPublicSellerByPropertyId.mockResolvedValue({ id: 7, name: "Owner User", profilePicture: null });
    dbMocks.getPublicPropertyPhotos.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(context(null));

    await expect(caller.property.seller(12)).resolves.toEqual({ id: 7, name: "Owner User", profilePicture: null });
    await expect(caller.property.photos(12)).resolves.toBeNull();
  });
});

describe("public storage proxy allowlist", () => {
  it("allows intended public asset prefixes only", () => {
    expect(isPublicStorageKey("property-photos/7/home.jpg")).toBe(true);
    expect(isPublicStorageKey("profile-pictures/7/avatar.png")).toBe(true);
    expect(isPublicStorageKey("nyumba-360-app-icon_46e5b435.png")).toBe(true);
  });

  it("blocks private document keys and malformed traversal attempts", () => {
    expect(isPublicStorageKey("property-documents/7/5/title-deed.pdf")).toBe(false);
    expect(isPublicStorageKey("../property-documents/7/5/title-deed.pdf")).toBe(false);
    expect(isPublicStorageKey("private/title-deed.pdf")).toBe(false);
  });
});
