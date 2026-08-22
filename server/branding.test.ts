import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const publicBrandSources = [
  source("client/index.html"),
  source("client/src/components/Navbar.tsx"),
  source("client/src/components/Footer.tsx"),
  source("client/src/components/PropertyCard.tsx"),
  source("client/src/pages/Home.tsx"),
  source("client/src/pages/PropertyDetail.tsx"),
];

describe("Nyumba 360 public branding", () => {
  it("uses Nyumba 360 in browser metadata and shared site navigation", () => {
    const metadata = publicBrandSources[0];
    const navigation = publicBrandSources[1];
    const footer = publicBrandSources[2];

    expect(metadata).toContain("Nyumba 360 — Find Your Dream Property");
    expect(metadata).toContain('property="og:site_name" content="Nyumba 360"');
    expect(navigation).toContain('aria-label="Nyumba 360 home"');
    expect(footer).toContain('const SITE_NAME = "Nyumba 360"');
  });

  it("uses the new name for the AI assistant and property score product labels", () => {
    expect(publicBrandSources[3]).toContain("Nyumba 360 Score");
    expect(publicBrandSources[4]).toContain("Nyumba 360 AI Assistant");
    expect(publicBrandSources[5]).toContain("Nyumba 360 Property Score");
  });

  it("does not retain the former Pedi wa brand in public source files", () => {
    expect(publicBrandSources.join("\n")).not.toMatch(/Pedi\s*[Ww]a/);
  });
});
