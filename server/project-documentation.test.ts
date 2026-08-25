import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const guide = readFileSync(resolve(process.cwd(), "NYUMBA360_PROJECT_GUIDE.md"), "utf8");

describe("Nyumba 360 project documentation", () => {
  it("documents the product, route map, role workflows, and technical architecture", () => {
    expect(guide).toContain("# Nyumba 360 Project Guide");
    expect(guide).toContain("## 2. Route map and public navigation");
    expect(guide).toContain("## 5. Seller and listing workflow");
    expect(guide).toContain("## 6. Agent, owner, tenant, and property operations workflows");
    expect(guide).toContain("## 11. Technical architecture");
    expect(guide).toContain("/tenant-access");
    expect(guide).toContain("tRPC");
    expect(guide).toContain("Drizzle");
  });

  it("records current security controls and deferred live-payment constraints without overclaiming", () => {
    expect(guide).toContain("## 13. Security controls and known operational boundaries");
    expect(guide).toContain("approved-listing projection");
    expect(guide).toContain("Live M-Pesa STK Push");
    expect(guide).toContain("does **not** currently process live M-Pesa STK Push");
    expect(guide).toContain("## 15. Current deferred work and decisions");
  });

  it("documents the current About-page team spotlight and safe content boundary", () => {
    expect(guide).toContain("## 10. About page and team spotlight");
    expect(guide).toContain("The people behind Nyumba 360");
    expect(guide).toContain("does not invent employee names, portraits, credentials, testimonials, or social profiles");
  });
});
