import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const exploreSource = readFileSync(resolve(process.cwd(), "client/src/pages/Properties.tsx"), "utf8");

describe("reference-inspired Explore layout", () => {
  it("retains the live property query while providing search-first discovery controls", () => {
    expect(exploreSource).toContain("trpc.property.list.useQuery(queryInput)");
    expect(exploreSource).toContain("isError");
    expect(exploreSource).toContain("We could not load properties");
    expect(exploreSource).toContain("Try again");
    expect(exploreSource).toContain("Search location, estate or property...");
    expect(exploreSource).toContain("Explore Properties");
    expect(exploreSource).toContain("Refine your search");
  });

  it("includes property category tiles, compact filters, and a map discovery route", () => {
    expect(exploreSource).toContain('label: "Houses"');
    expect(exploreSource).toContain('label: "Apartments"');
    expect(exploreSource).toContain('label: "Commercial"');
    expect(exploreSource).toContain("Find properties around you");
    expect(exploreSource).toContain('setLocation("/map")');
  });

  it("renders rich horizontal property rows with sorting and key property information", () => {
    expect(exploreSource).toContain("Sort: Newest");
    expect(exploreSource).toContain("ExplorePropertyRow");
    expect(exploreSource).toContain("Saved to your favorites");
    expect(exploreSource).toContain("property.amenities");
  });
});
