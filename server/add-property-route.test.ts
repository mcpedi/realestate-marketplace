import { describe, expect, it } from "vitest";
import { consumePostAuthSellerPath, isNewListingRequest, rememberNewListingAfterSignIn, sellerDashboardHref } from "../client/src/lib/sellerListing";

function createSessionStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("direct Add Property route behavior", () => {
  it("builds the direct new-listing route used by mobile navigation", () => {
    expect(sellerDashboardHref(true)).toBe("/seller?new=1");
    expect(sellerDashboardHref()).toBe("/seller");
  });

  it("opens the listing form only for the explicit new-listing request", () => {
    expect(isNewListingRequest("?new=1")).toBe(true);
    expect(isNewListingRequest("?new=0")).toBe(false);
    expect(isNewListingRequest("?source=mobile")).toBe(false);
    expect(isNewListingRequest("")).toBe(false);
  });

  it("preserves a new listing intent through sign-in and consumes it only once", () => {
    const storage = createSessionStorage();
    rememberNewListingAfterSignIn(storage);

    expect(consumePostAuthSellerPath(storage)).toBe("/seller?new=1");
    expect(consumePostAuthSellerPath(storage)).toBeNull();
  });
});
