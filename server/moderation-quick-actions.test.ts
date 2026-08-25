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
});
