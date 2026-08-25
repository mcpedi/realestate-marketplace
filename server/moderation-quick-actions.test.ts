import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const moderationQueue = readFileSync(resolve(process.cwd(), "client/src/components/AdminModerationQueue.tsx"), "utf8");

describe("moderation queue inline quick actions", () => {
  it("keeps approve and reject actions inline for pending properties", () => {
    expect(moderationQueue).toContain("Quick actions");
    expect(moderationQueue).toContain('action: "approve"');
    expect(moderationQueue).toContain('action: "reject"');
    expect(moderationQueue).toContain("property.status === \"pending\"");
  });

  it("requires confirmation and preserves property-specific pending feedback", () => {
    expect(moderationQueue).toContain("AlertDialog");
    expect(moderationQueue).toContain("The decision and acting administrator are recorded in the moderation audit trail.");
    expect(moderationQueue).toContain('currentAction === "approve" ? "Approving…" : "Approve"');
    expect(moderationQueue).toContain('currentAction === "reject" ? "Rejecting…" : "Reject"');
  });

  it("collects an optional private rejection reason only in the rejection confirmation", () => {
    expect(moderationQueue).toContain("Private administrator reason");
    expect(moderationQueue).toContain('id="moderation-rejection-reason"');
    expect(moderationQueue).toContain('pendingDecision?.action === "reject"');
    expect(moderationQueue).toContain("reason: rejectionReason.trim() || undefined");
    expect(moderationQueue).toContain("Stored in the administrator moderation audit trail only");
    expect(moderationQueue).toContain("This internal note is not exposed on public listing data or sent in the standard rejection notification.");
  });
});
