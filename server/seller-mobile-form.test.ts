import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sellerDashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/SellerDashboard.tsx"), "utf8");

describe("seller Add Property smartphone workflow", () => {
  it("uses a mobile-first dialog, touch-sized controls, and a persistent action area", () => {
    expect(sellerDashboardSource).toContain("max-h-[100dvh]");
    expect(sellerDashboardSource).toContain("rounded-t-[1.5rem]");
    expect(sellerDashboardSource).toContain("grid-cols-1 gap-3 sm:grid-cols-2");
    expect(sellerDashboardSource).toContain("inputMode=\"numeric\"");
    expect(sellerDashboardSource).toContain("inputMode=\"decimal\"");
    expect(sellerDashboardSource).toContain("sticky bottom-0");
    expect(sellerDashboardSource).toContain("min-h-12 flex-1");
  });

  it("keeps photo management and the empty-state entry point practical on smaller screens", () => {
    expect(sellerDashboardSource).toContain("grid grid-cols-3 gap-3 mb-3");
    expect(sellerDashboardSource).toContain("aria-label={`Remove photo ${i + 1}`}");
    expect(sellerDashboardSource).toContain("onClick={openNewListing}");
  });
});
