import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const navbarSource = readFileSync(resolve(process.cwd(), "client/src/components/Navbar.tsx"), "utf8");
const sellerSource = readFileSync(resolve(process.cwd(), "client/src/pages/SellerDashboard.tsx"), "utf8");

describe("Add Property flow", () => {
  it("routes the mobile Add Property action directly to a new listing request", () => {
    expect(navbarSource).toContain("sellerDashboardHref(true)");
  });

  it("opens a fresh seller form from the direct listing request and clears it on completion", () => {
    expect(sellerSource).toContain("isNewListingRequest(search)");
    expect(sellerSource).toContain("rememberNewListingAfterSignIn(window.sessionStorage)");
    expect(sellerSource).toContain("setShowForm(true)");
    expect(sellerSource).toContain("setLocation(sellerDashboardHref())");
    expect(sellerSource).toContain("Property listing submitted for review!");
  });

  it("keeps actionable create-listing errors visible to sellers", () => {
    expect(sellerSource).toContain('toast.error(error.message || "Failed to create listing")');
  });
});
