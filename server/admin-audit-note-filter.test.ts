import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const auditWorkspace = readFileSync(resolve(process.cwd(), "client/src/components/AdminOperationsHub.tsx"), "utf8");

describe("administrator audit-log rejection-note filter", () => {
  it("offers a rejection-note filter and bounded private-note search in the administrator audit workspace", () => {
    expect(auditWorkspace).toContain("Rejected with notes");
    expect(auditWorkspace).toContain('aria-label="Search private rejection notes"');
    expect(auditWorkspace).toContain("Private moderation note:");
    expect(auditWorkspace).toContain("Search private rejection notes");
  });

  it("labels the displayed rejection note as private administrator-only review data", () => {
    expect(auditWorkspace).toContain("Private rejection notes are visible only to administrators in this filtered review.");
    expect(auditWorkspace).toContain("No rejected properties with private moderation notes match this filter.");
  });
});
