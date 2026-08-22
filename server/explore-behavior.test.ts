import { describe, expect, it } from "vitest";
import { buildExploreQuery, mergeExploreFilters, sortExploreProperties, type ExploreFilters } from "../client/src/lib/explore";

const defaults: ExploreFilters = {
  location: "",
  propertyType: "all",
  listingType: "all",
  minPrice: 0,
  maxPrice: 1_000_000,
  bedrooms: 0,
  bathrooms: 0,
  page: 1,
};

describe("Explore behavior", () => {
  it("sends only active filters to the live property query", () => {
    expect(buildExploreQuery(defaults)).toEqual({ page: 1, limit: 12 });
    expect(buildExploreQuery({ ...defaults, location: "Kilimani", propertyType: "apartment", minPrice: 25_000, bedrooms: 2, page: 3 })).toEqual({
      location: "Kilimani",
      propertyType: "apartment",
      minPrice: 25_000,
      bedrooms: 2,
      page: 3,
      limit: 12,
    });
  });

  it("resets results to the first page after a filter change but preserves explicit pagination", () => {
    expect(mergeExploreFilters({ ...defaults, page: 4 }, { propertyType: "house" })).toMatchObject({ propertyType: "house", page: 1 });
    expect(mergeExploreFilters({ ...defaults, page: 4 }, { page: 2 })).toMatchObject({ page: 2 });
  });

  it("sorts property rows by selected price or recency without mutating the source list", () => {
    const properties = [
      { id: 1, price: 500_000, createdAt: "2026-08-01" },
      { id: 2, price: 100_000, createdAt: "2026-08-05" },
      { id: 3, price: 850_000, createdAt: "2026-07-15" },
    ];

    expect(sortExploreProperties(properties, "price-low").map(({ id }) => id)).toEqual([2, 1, 3]);
    expect(sortExploreProperties(properties, "price-high").map(({ id }) => id)).toEqual([3, 1, 2]);
    expect(sortExploreProperties(properties, "newest").map(({ id }) => id)).toEqual([2, 1, 3]);
    expect(properties.map(({ id }) => id)).toEqual([1, 2, 3]);
  });
});
