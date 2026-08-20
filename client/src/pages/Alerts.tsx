import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bell, BellOff, Trash2, MapPin, Tag, Home as HomeIcon, BedDouble, Wallet, Sparkles } from "lucide-react";

export default function Alerts() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");

  const alertsQuery = trpc.modern.alertList.useQuery(undefined, { enabled: isAuthenticated });
  const alerts = alertsQuery.data ?? [];

  const createMutation = trpc.modern.alertCreate.useMutation({
    onSuccess: () => {
      utils.modern.alertList.invalidate();
      toast.success("Alert created — we'll notify you when matching properties are added.");
    },
    onError: () => toast.error("Could not create the alert. Please try again."),
  });
  const deleteMutation = trpc.modern.alertDelete.useMutation({
    onSuccess: () => utils.modern.alertList.invalidate(),
  });
  const toggleMutation = trpc.modern.alertToggle.useMutation({
    onSuccess: () => utils.modern.alertList.invalidate(),
  });
  const priceDropMutation = trpc.modern.checkPriceDrops.useMutation({
    onSuccess: (res) => {
      const drops = (res as any)?.drops ?? [];
      if (drops.length > 0) {
        toast.success(`${drops.length} saved propert${drops.length === 1 ? "y has" : "ies have"} dropped in price!`);
      } else {
        toast.info("No price drops on your saved properties right now.");
      }
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-16 text-center">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Property Alerts
          </h1>
          <p className="text-muted-foreground mb-6">Sign in to create alerts and get notified about new listings.</p>
          <Button onClick={() => startLogin()}>Sign in</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            Property Alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            Get notified when properties matching your criteria are added, or when prices drop on saved listings
          </p>
        </div>

        <Card className="p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[oklch(0.72_0.15_80)]" />
            <h2 className="font-semibold text-sm">Create instant alert</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Location (optional)</label>
              <Input placeholder="e.g. Kisii" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" /> Property type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
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
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3" /> Max price (KSh, optional)</label>
              <Input type="number" placeholder="25000000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><BedDouble className="w-3 h-3" /> Min bedrooms (optional)</label>
              <Input type="number" placeholder="2" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} />
            </div>
          </div>
          <Button
            className="mt-4 w-full sm:w-auto"
            disabled={createMutation.isPending}
            onClick={() => {
              createMutation.mutate({
                type: "instant",
                propertyId: null,
                criteria: {
                  ...(location.trim() ? { location: location.trim() } : {}),
                  ...(propertyType ? { propertyType } : {}),
                  ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
                  ...(minBedrooms ? { bedrooms: Number(minBedrooms) } : {}),
                },
              });
              setLocation("");
              setPropertyType("");
              setMaxPrice("");
              setMinBedrooms("");
            }}
          >
            {createMutation.isPending ? <Spinner /> : "Create alert"}
          </Button>
        </Card>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Price-drop alerts</h2>
          <Button
            variant="outline"
            size="sm"
            disabled={priceDropMutation.isPending}
            onClick={() => priceDropMutation.mutate()}
          >
            {priceDropMutation.isPending ? <Spinner /> : "Check saved properties"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Save a property from its details page to track its price. Create a price-drop alert below after saving.
        </p>

        <h2 className="font-semibold text-sm mb-3">Your alerts ({alerts.length})</h2>
        {alertsQuery.isLoading && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}
        {!alertsQuery.isLoading && alerts.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            You have no alerts yet. Create one above to get started.
          </Card>
        )}
        <div className="space-y-3">
          {alerts.map((a: any) => (
            <Card key={a.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {a.type === "instant" ? (
                  <Bell className="w-4 h-4 text-[oklch(0.45_0.18_260)] flex-shrink-0" />
                ) : (
                  <BellOff className="w-4 h-4 text-[oklch(0.72_0.15_80)] flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {a.type === "instant"
                      ? (a.criteria && Object.keys(a.criteria).length > 0
                          ? Object.entries(a.criteria as Record<string, unknown>)
                              .filter(([, v]) => v !== "" && v !== null && v !== undefined)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")
                          : null) || "Custom search"
                      : a.propertyId
                        ? `Price drop alert · Property #${a.propertyId}`
                        : "Price drop alert · Any saved property"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.type === "instant" ? "Instant" : "Price drop"} · created{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={a.active}
                  onCheckedChange={(active) => toggleMutation.mutate({ id: a.id, active })}
                />
                <button
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => deleteMutation.mutate({ id: a.id })}
                  aria-label="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
