import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("administrator pending human-review badge", () => {
  it("derives the badge count from the factual command-center listing-review task", () => {
    expect(dashboard).toContain('task.id === "listing-review"');
    expect(dashboard).toContain("pendingReviewCount");
    expect(dashboard).toContain("pending human review");
  });

  it("opens the human moderation workspace without introducing a separate moderation count source", () => {
    expect(dashboard).toContain('setActiveTab("moderation")');
    expect(dashboard).toContain('aria-label={`${pendingReviewCount}');
    expect(dashboard).toContain('pendingReviewCount > 99 ? "99+" : pendingReviewCount');
  });
});
