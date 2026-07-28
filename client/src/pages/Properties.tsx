import { useState, useMemo, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { usePersistFn } from "@/hooks/usePersistFn";
import {
  Search,
  SlidersHorizontal,
  X,
  Home as HomeIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Properties() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const [filters, setFilters] = useState({
    location: params.get("location") || "",
    propertyType: params.get("propertyType") || "all",
    listingType: params.get("listingType") || "all",
    minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : 0,
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : 1000000,
    bedrooms: params.get("bedrooms") ? Number(params.get("bedrooms")) : 0,
    bathrooms: params.get("bathrooms") ? Number(params.get("bathrooms")) : 0,
    page: 1,
  });

  const queryInput = useMemo(() => ({
    ...(filters.location ? { location: filters.location } : {}),
    ...(filters.propertyType !== "all" ? { propertyType: filters.propertyType } : {}),
    ...(filters.listingType !== "all" ? { listingType: filters.listingType } : {}),
    ...(filters.minPrice > 0 ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice < 1000000 ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.bedrooms > 0 ? { bedrooms: filters.bedrooms } : {}),
    ...(filters.bathrooms > 0 ? { bathrooms: filters.bathrooms } : {}),
    page: filters.page,
    limit: 12,
  }), [filters]);

  const { data, isLoading } = trpc.property.list.useQuery(queryInput);

  const totalPages = Math.ceil((data?.total || 0) / 12);

  const updateFilters = usePersistFn((updates: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, page: 1, ...updates }));
  });

  const clearFilters = () => {
    setFilters({
      location: "",
      propertyType: "all",
      listingType: "all",
      minPrice: 0,
      maxPrice: 1000000,
      bedrooms: 0,
      bathrooms: 0,
      page: 1,
    });
  };

  const activeFiltersCount =
    (filters.location ? 1 : 0) +
    (filters.propertyType !== "all" ? 1 : 0) +
    (filters.listingType !== "all" ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 1000000 ? 1 : 0) +
    (filters.bedrooms > 0 ? 1 : 0) +
    (filters.bathrooms > 0 ? 1 : 0);

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${Math.round(price / 1000000)}M`;
    return `${Math.round(price / 1000).toLocaleString()}K`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-secondary/30 border-b border-border/50">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Browse Properties
          </h1>
          <p className="text-muted-foreground">
            {data?.total ? `${data.total} properties found` : "Search for your ideal property"}
          </p>
        </div>
      </section>

      <section className="flex-1">
        <div className="container py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="bg-white rounded-xl border border-border/50 p-5 sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[oklch(0.45_0.18_260)] hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                    <Input
                      placeholder="Enter location..."
                      value={filters.location}
                      onChange={(e) => updateFilters({ location: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Property Type</label>
                    <Select value={filters.propertyType} onValueChange={(v) => updateFilters({ propertyType: v })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Listing Type */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Listing Type</label>
                    <Select value={filters.listingType} onValueChange={(v) => updateFilters({ listingType: v })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Buy & Rent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Buy & Rent</SelectItem>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Price Range: {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
                    </label>
                    <Slider
                      defaultValue={[filters.minPrice, filters.maxPrice]}
                      max={1000000}
                      min={0}
                      step={1000}
                      onValueChange={([min, max]) => updateFilters({ minPrice: min, maxPrice: max })}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ""}
                        onChange={(e) => updateFilters({ minPrice: Number(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ""}
                        onChange={(e) => updateFilters({ maxPrice: Number(e.target.value) || 1000000 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Bedrooms</label>
                    <div className="flex gap-2 flex-wrap">
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => updateFilters({ bedrooms: n })}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            filters.bedrooms === n
                              ? "bg-[oklch(0.45_0.18_260)] text-white border-[oklch(0.45_0.18_260)]"
                              : "border-border hover:border-[oklch(0.45_0.18_260)]"
                          }`}
                        >
                          {n === 0 ? "Any" : `${n}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Bathrooms</label>
                    <div className="flex gap-2 flex-wrap">
                      {[0, 1, 2, 3].map((n) => (
                        <button
                          key={n}
                          onClick={() => updateFilters({ bathrooms: n })}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            filters.bathrooms === n
                              ? "bg-[oklch(0.45_0.18_260)] text-white border-[oklch(0.45_0.18_260)]"
                              : "border-border hover:border-[oklch(0.45_0.18_260)]"
                          }`}
                        >
                          {n === 0 ? "Any" : `${n}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Filters */}
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters ({activeFiltersCount})
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Location</label>
                      <Input
                        placeholder="Enter location..."
                        value={filters.location}
                        onChange={(e) => updateFilters({ location: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Property Type</label>
                      <Select value={filters.propertyType} onValueChange={(v) => updateFilters({ propertyType: v })}>
                        <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="penthouse">Penthouse</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Listing Type</label>
                      <Select value={filters.listingType} onValueChange={(v) => updateFilters({ listingType: v })}>
                        <SelectTrigger><SelectValue placeholder="Buy & Rent" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Buy & Rent</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Price: {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
                      </label>
                      <Slider defaultValue={[filters.minPrice, filters.maxPrice]} max={1000000} step={1000} onValueChange={([min, max]) => updateFilters({ minPrice: min, maxPrice: max })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Bedrooms</label>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => updateFilters({ bedrooms: n })} className={`px-3 py-1.5 rounded-lg text-sm border ${filters.bedrooms === n ? "bg-[oklch(0.45_0.18_260)] text-white" : ""}`}>{n === 0 ? "Any" : `${n}+`}</button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => { clearFilters(); }} className="w-full mt-4">Clear Filters</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-border/50 animate-pulse">
                      <div className="aspect-[4/3] bg-muted rounded-t-xl" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.items && data.items.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.items.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={filters.page <= 1}
                        onClick={() => updateFilters({ page: filters.page - 1 })}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => updateFilters({ page: i + 1 })}
                          className={`w-9 h-9 rounded-lg text-sm font-medium ${
                            filters.page === i + 1
                              ? "bg-[oklch(0.45_0.18_260)] text-white"
                              : "hover:bg-secondary"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={filters.page >= totalPages}
                        onClick={() => updateFilters({ page: filters.page + 1 })}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters to find more results</p>
                  <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
