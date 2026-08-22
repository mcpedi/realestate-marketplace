import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Bath,
  Bed,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  Heart,
  Home,
  Image as ImageIcon,
  KeyRound,
  LandPlot,
  Map as MapIcon,
  MapPin,
  Maximize,
  Search,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import type { Property } from "../../../drizzle/schema";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { buildExploreQuery, mergeExploreFilters, sortExploreProperties, type ExploreFilters, type ExploreSort } from "@/lib/explore";
import { toast } from "sonner";

type PropertyWithPhotos = Property & { photos?: { url: string }[] };

const propertyTypes = [
  { value: "all", label: "All", icon: Home },
  { value: "house", label: "Houses", icon: Home },
  { value: "apartment", label: "Apartments", icon: Building2 },
  { value: "land", label: "Land", icon: LandPlot },
  { value: "commercial", label: "Commercial", icon: Store },
] as const;

const typeLabels: Record<string, string> = {
  all: "All types",
  house: "Houses",
  apartment: "Apartments",
  villa: "Villas",
  townhouse: "Townhouses",
  studio: "Studios",
  penthouse: "Penthouses",
  commercial: "Commercial",
  land: "Land",
};

function formatCompactPrice(price: number) {
  if (price >= 1_000_000) return `KSh ${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`;
  if (price >= 1_000) return `KSh ${Math.round(price / 1_000).toLocaleString()}K`;
  return `KSh ${price.toLocaleString()}`;
}

export default function Properties() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [sort, setSort] = useState<ExploreSort>("newest");
  const [filters, setFilters] = useState<ExploreFilters>({
    location: params.get("location") || "",
    propertyType: params.get("propertyType") || "all",
    listingType: params.get("listingType") || "all",
    minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : 0,
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : 1_000_000,
    bedrooms: params.get("bedrooms") ? Number(params.get("bedrooms")) : 0,
    bathrooms: params.get("bathrooms") ? Number(params.get("bathrooms")) : 0,
    page: 1,
  });

  const queryInput = useMemo(() => buildExploreQuery(filters), [filters]);

  const { data, isLoading, isError, refetch } = trpc.property.list.useQuery(queryInput);
  const totalPages = Math.ceil((data?.total || 0) / 12);
  const activeFiltersCount =
    (filters.location ? 1 : 0) +
    (filters.propertyType !== "all" ? 1 : 0) +
    (filters.listingType !== "all" ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 1_000_000 ? 1 : 0) +
    (filters.bedrooms > 0 ? 1 : 0) +
    (filters.bathrooms > 0 ? 1 : 0);

  const updateFilters = (updates: Partial<ExploreFilters>) => {
    setFilters((previous) => mergeExploreFilters(previous, updates));
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      propertyType: "all",
      listingType: "all",
      minPrice: 0,
      maxPrice: 1_000_000,
      bedrooms: 0,
      bathrooms: 0,
      page: 1,
    });
  };

  const sortedProperties = useMemo(() => sortExploreProperties(data?.items ?? [], sort), [data?.items, sort]);

  const categoryLabel = filters.listingType === "rent" ? "Rentals" : typeLabels[filters.propertyType] ?? "All types";

  return (
    <div className="min-h-screen bg-[#fbfcff] pb-24 md:pb-0">
      <Navbar />

      <main className="container max-w-6xl py-5 md:py-8">
        <div className="mb-5 flex items-center justify-between gap-4 md:mb-7">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Property discovery</p>
            <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-slate-950 md:text-4xl">Explore Properties</h1>
          </div>
          <Link href="/map" className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 sm:flex">
            <MapIcon className="h-4 w-4" /> Map
          </Link>
        </div>

        <Sheet>
          <div className="rounded-[1.7rem] border border-slate-100 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:p-5">
            <div className="flex gap-2">
              <label className="flex h-13 min-w-0 flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-emerald-400">
                <Search className="h-5 w-5 shrink-0 text-slate-400" />
                <Input
                  aria-label="Search properties"
                  value={filters.location}
                  onChange={(event) => updateFilters({ location: event.target.value })}
                  placeholder="Search location, estate or property..."
                  className="h-auto border-0 bg-transparent p-0 text-sm font-medium text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 md:text-base"
                />
                {filters.location && (
                  <button aria-label="Clear property search" onClick={() => updateFilters({ location: "" })} className="text-slate-400 hover:text-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              <SheetTrigger asChild>
                <button aria-label="Open property filters" className="relative grid h-13 w-13 shrink-0 place-items-center rounded-2xl border border-slate-100 bg-white text-slate-700 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-700">
                  <SlidersHorizontal className="h-5 w-5" />
                  {activeFiltersCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">{activeFiltersCount}</span>}
                </button>
              </SheetTrigger>
            </div>

            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none md:mt-5 md:justify-between">
              {propertyTypes.map(({ value, label, icon: Icon }) => {
                const isActive = filters.propertyType === value && filters.listingType !== "rent";
                return (
                  <button
                    key={value}
                    onClick={() => updateFilters({ propertyType: value, listingType: "all" })}
                    className={`flex h-[82px] min-w-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-bold transition-all sm:min-w-[104px] ${isActive ? "border-emerald-600 bg-emerald-600 text-white shadow-[0_8px_18px_rgba(5,150,105,0.22)]" : "border-slate-100 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"}`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => updateFilters({ propertyType: "all", listingType: "rent" })}
                className={`flex h-[82px] min-w-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-bold transition-all sm:min-w-[104px] ${filters.listingType === "rent" ? "border-emerald-600 bg-emerald-600 text-white shadow-[0_8px_18px_rgba(5,150,105,0.22)]" : "border-slate-100 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"}`}
              >
                <KeyRound className="h-6 w-6" strokeWidth={1.8} />
                Rentals
              </button>
            </div>

            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
              <FilterChip icon={MapPin} label={filters.location || "Location"} active={Boolean(filters.location)} onClick={() => document.querySelector<HTMLInputElement>("input[aria-label='Search properties']")?.focus()} />
              <SheetTrigger asChild><FilterChip label={filters.minPrice > 0 || filters.maxPrice < 1_000_000 ? `${formatCompactPrice(filters.minPrice)} – ${formatCompactPrice(filters.maxPrice)}` : "Price"} active={filters.minPrice > 0 || filters.maxPrice < 1_000_000} /></SheetTrigger>
              <SheetTrigger asChild><FilterChip label={categoryLabel} active={filters.propertyType !== "all" || filters.listingType !== "all"} /></SheetTrigger>
              <SheetTrigger asChild><FilterChip label={filters.bedrooms > 0 ? `${filters.bedrooms}+ bedrooms` : "Bedrooms"} active={filters.bedrooms > 0} /></SheetTrigger>
              <SheetTrigger asChild><FilterChip icon={SlidersHorizontal} label="More" active={filters.bathrooms > 0} /></SheetTrigger>
            </div>
          </div>

          <SheetContent side="right" className="w-[min(24rem,92vw)] overflow-y-auto border-l-slate-100 bg-white p-0">
            <SheetHeader className="border-b border-slate-100 px-5 py-5 text-left">
              <SheetTitle className="text-xl font-extrabold tracking-tight">Refine your search</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 p-5">
              <FilterFields filters={filters} onChange={updateFilters} />
              <Button onClick={clearFilters} variant="outline" className="w-full rounded-xl border-slate-200 font-bold">Clear all filters</Button>
            </div>
          </SheetContent>
        </Sheet>

        <section className="relative mt-5 overflow-hidden rounded-[1.6rem] bg-gradient-to-r from-emerald-50 via-[#f2fbf7] to-blue-50 p-5 md:mt-7 md:p-7">
          <div className="absolute inset-y-0 right-0 w-[58%] opacity-80 [background-image:radial-gradient(circle_at_15%_55%,rgba(5,150,105,.18)_0_3px,transparent_4px),radial-gradient(circle_at_80%_30%,rgba(37,99,235,.14)_0_2px,transparent_3px),linear-gradient(28deg,transparent_48%,rgba(15,148,100,.12)_49%_51%,transparent_52%),linear-gradient(-33deg,transparent_48%,rgba(37,99,235,.11)_49%_51%,transparent_52%)" />
          <div className="absolute right-[12%] top-5 grid h-13 w-13 place-items-center rounded-full border-8 border-emerald-100 bg-emerald-600 text-lg font-extrabold text-white shadow-lg">{Math.min(data?.total ?? 0, 99)}</div>
          <div className="absolute bottom-7 right-[32%] h-10 w-10 rounded-full border-6 border-emerald-100 bg-emerald-600/90" />
          <div className="relative max-w-[15rem]">
            <h2 className="text-xl font-extrabold leading-tight tracking-[-0.035em] text-slate-900 md:text-2xl">Find properties around you <span className="text-emerald-700">on the map</span></h2>
            <p className="mt-2 text-sm leading-5 text-slate-600">Explore homes and investment opportunities by area.</p>
            <Button onClick={() => setLocation("/map")} className="mt-4 h-11 rounded-xl bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-500">
              View on Map <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        <section className="mt-6 md:mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500"><span className="font-extrabold text-emerald-700">{data?.total ?? 0}</span> properties found</p>
            <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
              <SelectTrigger className="h-10 w-[151px] rounded-xl border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Sort: Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to high</SelectItem>
                <SelectItem value="price-high">Price: High to low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <ExploreRowSkeleton key={index} />)}
            </div>
          ) : isError ? (
            <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/50 px-6 py-16 text-center">
              <Search className="mx-auto h-10 w-10 text-rose-300" />
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">We could not load properties</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Please check your connection and try again. Your filters will be kept in place.</p>
              <Button onClick={() => void refetch()} className="mt-5 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-500">Try again</Button>
            </div>
          ) : sortedProperties.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                {sortedProperties.map((property) => <ExplorePropertyRow key={property.id} property={property} />)}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl" disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })}><ChevronLeft className="h-4 w-4" /></Button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => (
                    <button key={index} onClick={() => updateFilters({ page: index + 1 })} className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${filters.page === index + 1 ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-emerald-50"}`}>{index + 1}</button>
                  ))}
                  <Button variant="outline" size="icon" className="rounded-xl" disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 })}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">No properties found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Try broadening your location or clearing a few filters to discover more homes.</p>
              <Button onClick={clearFilters} variant="outline" className="mt-5 rounded-xl font-bold">Clear filters</Button>
            </div>
          )}
        </section>
      </main>

      <div className="hidden md:block"><Footer /></div>
    </div>
  );
}

function FilterChip({ icon: Icon, label, active, onClick }: { icon?: typeof MapPin; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${active ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"}`}>
      {Icon && <Icon className="h-4 w-4" />}{label}<ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

function FilterFields({ filters, onChange }: { filters: ExploreFilters; onChange: (updates: Partial<ExploreFilters>) => void }) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">Location</label>
        <Input value={filters.location} onChange={(event) => onChange({ location: event.target.value })} placeholder="Enter location or estate" className="h-11 rounded-xl border-slate-200" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">Property type</label>
        <Select value={filters.propertyType} onValueChange={(propertyType) => onChange({ propertyType, listingType: "all" })}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">Listing type</label>
        <Select value={filters.listingType} onValueChange={(listingType) => onChange({ listingType })}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Buy & rent</SelectItem><SelectItem value="sale">For sale</SelectItem><SelectItem value="rent">For rent</SelectItem></SelectContent>
        </Select>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-700"><span>Price range</span><span className="text-emerald-700">{formatCompactPrice(filters.minPrice)} – {formatCompactPrice(filters.maxPrice)}</span></div>
        <Slider value={[filters.minPrice, filters.maxPrice]} min={0} max={1_000_000} step={1_000} onValueChange={([minPrice, maxPrice]) => onChange({ minPrice, maxPrice })} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">Bedrooms</label>
        <div className="flex flex-wrap gap-2">{[0, 1, 2, 3, 4, 5].map((bedrooms) => <button key={bedrooms} onClick={() => onChange({ bedrooms })} className={`h-9 min-w-10 rounded-xl border px-3 text-sm font-bold ${filters.bedrooms === bedrooms ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}>{bedrooms === 0 ? "Any" : `${bedrooms}+`}</button>)}</div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">Bathrooms</label>
        <div className="flex flex-wrap gap-2">{[0, 1, 2, 3, 4].map((bathrooms) => <button key={bathrooms} onClick={() => onChange({ bathrooms })} className={`h-9 min-w-10 rounded-xl border px-3 text-sm font-bold ${filters.bathrooms === bathrooms ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}>{bathrooms === 0 ? "Any" : `${bathrooms}+`}</button>)}</div>
      </div>
    </>
  );
}

function ExplorePropertyRow({ property }: { property: PropertyWithPhotos }) {
  const [isSaved, setIsSaved] = useState(false);
  const toggleFavorite = trpc.favorite.toggle.useMutation({
    onSuccess: ({ isFavorite }) => {
      setIsSaved(isFavorite);
      toast.success(isFavorite ? "Saved to your favorites" : "Removed from favorites");
    },
    onError: () => toast.error("Please sign in to save properties"),
  });
  const firstPhoto = property.photos?.[0]?.url || "/placeholder-property.jpg";
  const photoCount = property.photos?.length ?? 0;
  const size = property.floorArea ?? property.landSize;
  const amenities = Array.isArray(property.amenities) ? property.amenities.filter((amenity): amenity is string => typeof amenity === "string").slice(0, 3) : [];

  return (
    <article className="group overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.09)]">
      <div className="flex min-h-[170px]">
        <Link href={`/property/${property.id}`} className="relative block w-[46%] shrink-0 overflow-hidden bg-slate-100">
          <img src={firstPhoto} alt={property.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {property.featured && <span className="rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">Featured</span>}
            <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white ${property.listingType === "rent" ? "bg-amber-500" : "bg-blue-600"}`}>{property.listingType === "rent" ? "For rent" : "For sale"}</span>
          </div>
          {photoCount > 0 && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-slate-950/72 px-2 py-1 text-[10px] font-bold text-white"><ImageIcon className="h-3 w-3" /> {photoCount}</span>}
          <button aria-label={`Save ${property.title}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleFavorite.mutate(property.id); }} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/92 text-slate-600 shadow-sm backdrop-blur transition hover:scale-105">
            <Heart className={`h-4 w-4 ${isSaved ? "fill-emerald-600 text-emerald-600" : ""}`} />
          </button>
        </Link>
        <div className="min-w-0 flex flex-1 flex-col p-3.5">
          <Link href={`/property/${property.id}`}><h2 className="line-clamp-2 text-[15px] font-extrabold leading-5 tracking-[-0.02em] text-slate-900 transition group-hover:text-emerald-700 sm:text-base">{property.title}</h2></Link>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{property.location}</span></div>
          <p className="mt-3 text-base font-extrabold text-emerald-700 sm:text-lg">{formatCompactPrice(property.price)}{property.listingType === "rent" && <span className="text-xs font-semibold text-slate-400">/mo</span>}</p>
          <div className="mt-3 flex items-center gap-2.5 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.bedrooms ?? 0}</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms ?? 0}</span>
            {size ? <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{size}m²</span> : null}
          </div>
          {amenities.length > 0 && <div className="mt-auto flex gap-1 overflow-hidden pt-3">{amenities.map((amenity) => <span key={amenity} className="truncate rounded-md bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">{amenity}</span>)}</div>}
        </div>
      </div>
    </article>
  );
}

function ExploreRowSkeleton() {
  return <div className="flex min-h-[170px] overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white p-3 shadow-sm"><div className="w-[43%] animate-pulse rounded-xl bg-slate-100" /><div className="flex flex-1 flex-col gap-3 p-3"><div className="h-5 w-4/5 animate-pulse rounded bg-slate-100" /><div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" /><div className="mt-auto h-5 w-1/2 animate-pulse rounded bg-slate-100" /></div></div>;
}
