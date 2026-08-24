import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const aboutPage = readFileSync(resolve(process.cwd(), "client/src/pages/About.tsx"), "utf8");

describe("reference-inspired About page", () => {
  it("keeps the Nyumba 360 hero, overlapping mission card, and local story hierarchy", () => {
    expect(aboutPage).toContain("About Nyumba 360");
    expect(aboutPage).toContain("Find the place that");
    expect(aboutPage).toContain("Our mission");
    expect(aboutPage).toContain("Our core values");
    expect(aboutPage).toContain("Our story");
    expect(aboutPage).toContain("Made for property journeys in Kenya");
  });

  it("retains a dedicated contact call-to-action and responsive mobile-safe page spacing", () => {
    expect(aboutPage).toContain('href="/contact"');
    expect(aboutPage).toContain("Have a question?");
    expect(aboutPage).toContain("pb-24 lg:pb-0");
    expect(aboutPage).toContain("grid-cols-2");
  });

  it("places an accessible interactive team spotlight directly below the local story", () => {
    expect(aboutPage).toContain("The people behind Nyumba 360");
    expect(aboutPage).toContain("Meet the team shaping every property journey.");
    expect(aboutPage).toContain("selectedTeamMemberId");
    expect(aboutPage).toContain("aria-pressed={isSelected}");
    expect(aboutPage).toContain("Team spotlight");
    expect(aboutPage.indexOf("The people behind Nyumba 360")).toBeGreaterThan(aboutPage.indexOf("Our story"));
    expect(aboutPage.indexOf("The people behind Nyumba 360")).toBeLessThan(aboutPage.indexOf("The Nyumba 360 difference"));
  });
});
