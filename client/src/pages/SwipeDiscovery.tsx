import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { X, Heart, Eye, RotateCcw, MapPin, Bed, Bath, Tag } from "lucide-react";
import type { Property } from "../../../drizzle/schema";

type PropWithPhoto = Property & { photos?: { url: string }[] };

const DRAG_THRESHOLD = 90;

export default function SwipeDiscovery() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [deck, setDeck] = useState<PropWithPhoto[] | null>(null);
  const [top, setTop] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const favoriteMutation = trpc.favorite.toggle.useMutation({
    onSuccess: () => utils.favorite.list.invalidate(),
  });
  const activityMutation = trpc.modern.recordActivity.useMutation();

  const favoritesQuery = trpc.favorite.list.useQuery(undefined, { enabled: isAuthenticated });
  const favSet = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((f: any) => f.id)),
    [favoritesQuery.data],
  );

  const loadDeck = useCallback(async () => {
    try {
      const { items } = await utils.modern.recommendations.fetch({ limit: 20 });
      setDeck(items as unknown as PropWithPhoto[]);
      setTop(0);
    } catch {
      toast.error("Could not load recommendations. Please try again.");
    }
  }, [utils]);

  const handleFav = (p: PropWithPhoto) => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    favoriteMutation.mutate(p.id);
    activityMutation.mutate({ propertyId: p.id, eventType: "save" });
  };

  const commitCard = (p: PropWithPhoto, direction: "right" | "left") => {
    if (direction === "right" && isAuthenticated) {
      handleFav(p);
    }
    setTop((t) => t + 1);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag((d) => ({ ...d, active: true }));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = startRef.current;
    if (!start || !drag.active) return;
    setDrag((d) => ({
      ...d,
      x: e.clientX - start.x,
      y: e.clientY - start.y,
    }));
  };

  const endDrag = () => {
    setDrag((d) => ({ ...d, active: false }));
    const start = startRef.current;
    if (!start) return;
    const p = deck?.[top];
    if (!p) return;
    if (Math.abs(drag.x) > DRAG_THRESHOLD) {
      commitCard(p, drag.x > 0 ? "right" : "left");
    }
    startRef.current = null;
    setDrag({ x: 0, y: 0, active: false });
  };

  const current = deck?.[top];
  const rotation = drag.x * 0.06;
  const likeOpacity = Math.max(0, Math.min(1, drag.x / DRAG_THRESHOLD));
  const skipOpacity = Math.max(0, Math.min(1, -drag.x / DRAG_THRESHOLD));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 max-w-lg flex flex-col items-center">
        <div className="text-center mb-6 w-full">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            Swipe Discovery
          </h1>
          <p className="text-sm text-muted-foreground">
            Swipe right to save, swipe left to skip, or tap the eye to view details
          </p>
        </div>

        {!deck && (
          <div className="flex flex-col items-center gap-4 py-16">
            {isAuthenticated ? (
              <Button onClick={() => void loadDeck()}>Start Swiping</Button>
            ) : (
              <Button onClick={() => startLogin()}>Sign in to swipe</Button>
            )}
          </div>
        )}

        {deck && (
          <div className="relative w-full" style={{ height: "480px" }}>
            {current ? (
              <div
                key={current.id}
                className="absolute inset-0 rounded-2xl overflow-hidden border border-border bg-card shadow-xl select-none touch-none"
                style={{
                  transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
                  transition: drag.active ? "none" : "transform 250ms cubic-bezier(0.23, 1, 0.32, 1)",
                  cursor: "grab",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
              >
                <img
                  src={current.photos?.[0]?.url || "/placeholder-property.jpg"}
                  alt={current.title}
                  className="w-full h-3/4 object-cover pointer-events-none"
                  draggable={false}
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-bold opacity-0"
                  style={{ opacity: likeOpacity, transition: "opacity 100ms" }}>
                  Saved
                </div>
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-bold"
                  style={{ opacity: skipOpacity, transition: "opacity 100ms" }}>
                  Skip
                </div>
                <div className="p-4 space-y-1 pointer-events-none">
                  <div className="font-semibold truncate">{current.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {current.location}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{current.bedrooms}</span>
                    <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{current.bathrooms}</span>
                    <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" />{current.propertyType}</span>
                  </div>
                  <div className="font-bold text-[oklch(0.45_0.18_260)]">
                    Ksh {current.price?.toLocaleString()}{current.listingType === "rent" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                  </div>
                </div>
                <div className="absolute top-4 right-4 pointer-events-auto flex gap-2 opacity-100">
                  <Button
                    size="icon"
                    className="rounded-full bg-white/90 text-foreground hover:bg-white shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/property/${current.id}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                {favSet.has(current.id) && (
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <Heart className="w-8 h-8 fill-[oklch(0.55_0.2_350)] text-[oklch(0.55_0.2_350)]" />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="text-lg font-semibold">You're all caught up!</div>
                <p className="text-sm text-muted-foreground">
                  Check back later for new recommendations based on your activity.
                </p>
                <Button variant="outline" onClick={() => void loadDeck()}>
                  <RotateCcw className="w-4 h-4" /> Refresh
                </Button>
              </div>
            )}
          </div>
        )}

        {deck && current && (
          <div className="flex gap-6 mt-6">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-14 h-14 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => commitCard(current, "left")}
            >
              <X className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              className="rounded-full w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => commitCard(current, "right")}
            >
              <Heart className="w-6 h-6" />
            </Button>
          </div>
        )}

        {deck && current && (
          <Link href="/compare" className="mt-6 text-sm font-medium text-[oklch(0.45_0.18_260)] hover:underline">
            Compare saved properties →
          </Link>
        )}
      </main>
      <Footer />
    </div>
  );
}
