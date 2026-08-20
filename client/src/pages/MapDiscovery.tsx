import { useCallback, useMemo, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { MapPin, Bed, Bath, Tag, Maximize, Move } from "lucide-react";
import type { Property } from "../../../drizzle/schema";

type PropWithPhoto = Property & { photos?: { url: string }[] };

// Kenya bounding defaults (Kenya roughly spans lat 4.6S..4.3N, lng 33.9E..41.9E)
const KENYA_CENTER = { lat: -0.0236, lng: 37.9062 };

export default function MapDiscovery() {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapBounds, setMapBounds] = useState<{ latMin: number; latMax: number; lngMin: number; lngMax: number } | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const filters = useMemo(
    () => ({
      status: "approved" as const,
      limit: 60,
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(propertyType ? { propertyType } : {}),
      ...(listingType ? { listingType } : {}),
    }),
    [location, propertyType, listingType],
  );

  const { data, isLoading } = trpc.property.list.useQuery(filters);
  const properties = (data?.items ?? []) as PropWithPhoto[];

  const areaResults = mapBounds
    ? properties.filter((p) => {
        if (p.latitude == null || p.longitude == null) return false;
        return (
          p.latitude >= mapBounds.latMin &&
          p.latitude <= mapBounds.latMax &&
          p.longitude >= mapBounds.lngMin &&
          p.longitude <= mapBounds.lngMax
        );
      })
    : null;
  const displayed = areaResults ?? properties;

  const searchThisArea = useCallback(() => {
    if (!mapRef) return;
    const bounds = mapRef.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    setMapBounds({ latMin: sw.lat(), latMax: ne.lat(), lngMin: sw.lng(), lngMax: ne.lng() });
    mapRef.fitBounds(bounds); // snap markers within the new bounds
  }, [mapRef]);

  const clearArea = useCallback(() => {
    setMapBounds(null);
  }, []);

  const onMapReady = useCallback(
    (map: google.maps.Map) => {
      setMapRef(map);
      const geocoder = new google.maps.Geocoder();
      if (location.trim()) {
        geocoder.geocode({ address: `${location.trim()}, Kenya` }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            map.setCenter(results[0].geometry.location);
            map.setZoom(13);
          }
        });
      }
      const bounds = new google.maps.LatLngBounds();
      properties.forEach((p) => {
        if (p.latitude == null || p.longitude == null) return;
        const pos = { lat: p.latitude, lng: p.longitude };
        bounds.extend(pos);
        const marker = new google.maps.Marker({
          map,
          position: pos,
          title: `${p.title} — Ksh ${p.price.toLocaleString()}`,
        });
        const info = new google.maps.InfoWindow({
          content: `
            <div style="font-family: inherit; min-width: 180px">
              <div style="font-weight: 700; margin-bottom: 2px">${p.title}</div>
              <div style="font-size: 12px; color: #555; margin-bottom: 4px">${p.location}</div>
              <div style="color: #1d4ed8; font-weight: 700">Ksh ${p.price.toLocaleString()}${p.listingType === "rent" ? "/mo" : ""}</div>
              <a href="/property/${p.id}" style="font-size: 12px; color: #1d4ed8; text-decoration: underline">View details</a>
            </div>
          `,
        });
        marker.addListener("click", () => {
          setSelectedId(p.id);
          info.open({ anchor: marker, map });
        });
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, 60);
    },
    [properties, location],
  );

  const selected = properties.find((p) => p.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Explore on the Map
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover properties across Kenya with an interactive map
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <Card className="p-4 space-y-3">
              <Input
                placeholder="Search location (e.g. Kisii, Migori)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="">Any type</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="studio">Studio</option>
                  <option value="penthouse">Penthouse</option>
                </select>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                >
                  <option value="">Sale & Rent</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
              <div className="text-xs text-muted-foreground">
                {isLoading ? "Loading…" : areaResults ? `${areaResults.length} properties in this area` : `${properties.length} properties shown`}
              </div>
              <Button size="sm" className="w-full" variant="outline" onClick={searchThisArea}>
                Search this area
              </Button>
              {areaResults && (
                <Button size="sm" className="w-full" variant="ghost" onClick={clearArea}>
                  Show all properties
                </Button>
              )}
            </Card>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {displayed.map((p) => (
                <Link
                  key={p.id}
                  href={`/property/${p.id}`}
                  className={`block rounded-xl border p-3 hover:shadow-md transition-shadow bg-card ${
                    selectedId === p.id ? "border-[oklch(0.45_0.18_260)] shadow-md" : "border-border"
                  }`}
                  onMouseEnter={() => setSelectedId(p.id)}
                >
                  <div className="flex gap-3">
                    <img
                      src={p.photos?.[0]?.url || "/placeholder-property.jpg"}
                      alt={p.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {p.location}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{p.bedrooms}</span>
                        <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{p.bathrooms}</span>
                        <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{p.floorArea ?? p.landSize ?? "—"}m²</span>
                      </div>
                      <div className="text-sm font-bold text-[oklch(0.45_0.18_260)] mt-1">
                        Ksh {p.price?.toLocaleString()}{p.listingType === "rent" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {displayed.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No properties match your filters.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-border">
            <MapView
              className="w-full h-[70vh]"
              initialCenter={KENYA_CENTER}
              initialZoom={6}
              onMapReady={onMapReady}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Move className="w-3.5 h-3.5" /> Pan and zoom the map, then tap "Search this area" to filter results to the visible area
        </div>
      </main>
      <Footer />
    </div>
  );
}
