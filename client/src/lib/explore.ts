export type ExploreFilters = {
  location: string;
  propertyType: string;
  listingType: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  page: number;
};

export type ExploreSort = "newest" | "price-low" | "price-high";

export function buildExploreQuery(filters: ExploreFilters) {
  return {
    ...(filters.location ? { location: filters.location } : {}),
    ...(filters.propertyType !== "all" ? { propertyType: filters.propertyType } : {}),
    ...(filters.listingType !== "all" ? { listingType: filters.listingType } : {}),
    ...(filters.minPrice > 0 ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice < 1_000_000 ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.bedrooms > 0 ? { bedrooms: filters.bedrooms } : {}),
    ...(filters.bathrooms > 0 ? { bathrooms: filters.bathrooms } : {}),
    page: filters.page,
    limit: 12,
  };
}

export function mergeExploreFilters(current: ExploreFilters, updates: Partial<ExploreFilters>): ExploreFilters {
  return { ...current, page: 1, ...updates };
}

export function sortExploreProperties<T extends { price: number; createdAt: Date | string }>(items: T[], sort: ExploreSort): T[] {
  return [...items].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
