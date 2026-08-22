export function sellerDashboardHref(openNewListing = false): string {
  return openNewListing ? "/seller?new=1" : "/seller";
}

export function isNewListingRequest(search: string): boolean {
  return new URLSearchParams(search).get("new") === "1";
}

export const SELLER_POST_AUTH_PATH_KEY = "nyumba-360-post-auth-seller-path";

type SessionStorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function rememberNewListingAfterSignIn(storage: SessionStorageLike): void {
  storage.setItem(SELLER_POST_AUTH_PATH_KEY, sellerDashboardHref(true));
}

export function consumePostAuthSellerPath(storage: SessionStorageLike): string | null {
  const path = storage.getItem(SELLER_POST_AUTH_PATH_KEY);
  storage.removeItem(SELLER_POST_AUTH_PATH_KEY);
  return path === sellerDashboardHref(true) ? path : null;
}
