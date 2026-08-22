import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, MapPin, Bed, Bath, Maximize, Tag, Plus, Star } from "lucide-react";
import { PropertyScoreChip } from "@/components/PropertyCard";
import type { Property } from "../../../drizzle/schema";

const COMPARE_KEY = "pw-compare-ids";

type PropWithPhoto = Property & { photos?: { url: string }[] };

function getIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) ?? "[]") as number[];
  } catch {
    return [];
  }
}

function saveIds(ids: number[]) {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(ids.slice(0, 4)));
}

// Lightweight global event so PropertyCard can push ids without context plumbing.
const listeners = new Set<() => void>();
export function emitCompareChange() {
  listeners.forEach((l) => l());
}
export function subscribeCompareChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export default function Compare() {
  const [ids, setIds] = useState<number[]>(() => getIds());
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  useEffect(() => {
    return () => {
      subscribeCompareChange(() => setIds(getIds()));
    };
  }, []);

  const queries = ids.map((id) =>
    trpc.property.byId.useQuery(id, { enabled: ids.length > 0 }),
  );
  const properties = useMemo(() => {
    return queries.map((q) => (q.data ? (q.data as unknown as PropWithPhoto) : null));
  }, [queries]);

  const allLoaded = ids.length > 0 && properties.every(Boolean);
  const loading = ids.length > 0 && !allLoaded;

  const remove = (id: number) => {
    const next = ids.filter((i) => i !== id);
    saveIds(next);
    setIds(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            Property Comparison
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare up to 4 properties side by side
          </p>
        </div>

        {!allLoaded && !loading && ids.length === 0 && (
          <Card className="p-10 text-center space-y-4">
            <Plus className="w-10 h-10 mx-auto text-muted-foreground" />
            <div className="text-lg font-semibold">No properties to compare yet</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Browse properties and add them to your comparison using the "Compare" button on each listing, or swipe discovery saves.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/properties">Browse properties</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/discover">Swipe discovery</Link>
              </Button>
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {allLoaded && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className="w-32 p-3 text-left text-xs uppercase text-muted-foreground align-bottom">Property</th>
                  {properties.map((p, i) =>
                    p ? (
                      <th key={p.id} className="p-3 align-bottom min-w-[220px]">
                        <div className="relative group">
                          <Link href={`/property/${p.id}`}>
                            <img
                              src={p.photos?.[0]?.url || "/placeholder-property.jpg"}
                              alt={p.title}
                              className="w-full h-36 object-cover rounded-lg"
                            />
                          </Link>
                          <button
                            onClick={() => remove(p.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
                            aria-label="Remove from comparison"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <Link href={`/property/${p.id}`} className="font-medium text-sm mt-2 block truncate">
                            {p.title}
                          </Link>
                        </div>
                      </th>
                    ) : null,
                  )}
                </tr>
              </thead>
              <tbody className="text-sm align-top">
                <Row label="Price" value={properties.map((p) => p ? `Ksh ${p.price?.toLocaleString()}${p.listingType === "rent" ? "/mo" : ""}` : null)} strong />
                <Row label="Type" value={properties.map((p) => p?.propertyType ?? null)} />
                <Row label="Listing" value={properties.map((p) => p?.listingType ?? null)} />
                <Row
                  label="Location"
                  value={properties.map((p) => (
                    <span key={p?.id ?? "loc"} className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{p?.location ?? "—"}</span>
                  ))}
                />
                <Row
                  label="Bedrooms"
                  value={properties.map((p) => (
                    <span key={p?.id ?? "bed"} className="inline-flex items-center gap-1"><Bed className="w-3 h-3" />{p?.bedrooms ?? "—"}</span>
                  ))}
                />
                <Row
                  label="Bathrooms"
                  value={properties.map((p) => (
                    <span key={p?.id ?? "bath"} className="inline-flex items-center gap-1"><Bath className="w-3 h-3" />{p?.bathrooms ?? "—"}</span>
                  ))}
                />
                <Row
                  label="Size (m²)"
                  value={properties.map((p) => (
                    <span key={p?.id ?? "size"} className="inline-flex items-center gap-1"><Maximize className="w-3 h-3" />{p?.floorArea ?? p?.landSize ?? "—"}</span>
                  ))}
                />
                <Row
                  label="Nyumba 360 Score"
                  value={properties.map((p) => (p ? <PropertyScoreChip key={p.id} propertyId={p.id} /> : null))}
                />
                <Row
                  label="Amenities"
                  value={properties.map((p) =>
                    p?.amenities
                      ? (typeof p.amenities === "string" ? p.amenities : String(p.amenities)).split(",").slice(0, 6).join(", ")
                      : "—",
                  )}
                />
                <tr>
                  <td className="p-3" />
                  {properties.map((p) =>
                    p ? (
                      <td key={p.id} className="p-3">
                        <Button asChild size="sm" className="w-full">
                          <Link href={`/property/${p.id}`}>View details</Link>
                        </Button>
                      </td>
                    ) : null,
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: (string | React.ReactNode | null)[]; strong?: boolean }) {
  return (
    <tr className="border-t border-border">
      <td className="p-3 text-xs uppercase text-muted-foreground">{label}</td>
      {value.map((v, i) => (
        <td key={i} className={`p-3 ${strong ? "font-bold text-[oklch(0.45_0.18_260)]" : ""}`}>{v}</td>
      ))}
    </tr>
  );
}
