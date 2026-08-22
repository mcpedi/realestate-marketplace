import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertySearch } from "@/components/PropertySearch";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  ChevronRight,
  Compass,
  GitCompareArrows,
  Heart,
  Map,
  MapPin,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const quickActions = [
  { href: "/assistant", label: "AI Assistant", icon: Bot, color: "bg-emerald-50 text-emerald-700" },
  { href: "/map", label: "Map Search", icon: MapPin, color: "bg-sky-50 text-sky-700" },
  { href: "/favorites", label: "Saved", icon: Heart, color: "bg-rose-50 text-rose-600" },
  { href: "/compare", label: "Compare", icon: GitCompareArrows, color: "bg-emerald-50 text-emerald-700" },
  { href: "/alerts", label: "Alerts", icon: Bell, color: "bg-amber-50 text-amber-600" },
];

function HomeMapPreview({ properties }: { properties: Array<{ id: number; price: number; listingType: string; latitude?: number | null; longitude?: number | null }> }) {
  const pins = properties.slice(0, 4);
  const placements = ["left-[13%] top-[26%]", "left-[39%] top-[52%]", "right-[22%] top-[25%]", "right-[7%] bottom-[18%]"];

  const priceLabel = (price: number, listingType: string) => {
    const formatted = price >= 1_000_000 ? `${Math.round(price / 1_000_000)}M` : `${Math.round(price / 1000)}K`;
    return `KSh ${formatted}${listingType === "rent" ? "/mo" : ""}`;
  };

  return (
    <Link href="/map" className="block group">
      <div className="relative h-44 md:h-64 overflow-hidden rounded-[1.35rem] border border-emerald-100 bg-[radial-gradient(circle_at_18%_32%,rgba(255,255,255,.94)_0_2px,transparent_3px),radial-gradient(circle_at_78%_68%,rgba(255,255,255,.86)_0_2px,transparent_3px),linear-gradient(138deg,#d7f1db_0%,#edf7ea_45%,#bfe9f3_100%)] shadow-sm">
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(102deg,transparent_0_19%,#9acfa6_20%_21%,transparent_22%_36%,#b2d9aa_37%_38%,transparent_39%_100%),linear-gradient(12deg,transparent_0_31%,#8ebfd1_32%_34%,transparent_35%_56%,#9ed1ad_57%_59%,transparent_60%_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0_15%,rgba(255,255,255,.5)_16%_17%,transparent_18%_100%)] opacity-70" />
        <div className="absolute left-[43%] top-[35%] h-16 w-16 rounded-full border-[10px] border-emerald-500/25 bg-emerald-600/80 text-white shadow-lg flex items-center justify-center font-bold">
          {properties.length || 0}
        </div>
        {pins.map((property, index) => (
          <span
            key={property.id}
            className={`absolute ${placements[index]} rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-md transition-transform group-hover:-translate-y-0.5`}
          >
            {priceLabel(property.price, property.listingType)}
          </span>
        ))}
        <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-700 shadow-md">
          <Compass className="h-5 w-5" />
        </span>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-emerald-950/55 via-emerald-950/5 to-transparent px-4 pb-3 pt-10 text-white">
          <span className="text-sm font-semibold">Discover homes by location</span>
          <span className="flex items-center gap-1 text-xs font-semibold">Open map <ChevronRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </Link>
  );
}

function QuickActionStrip() {
  return (
    <div className="rounded-[1.45rem] border border-slate-100 bg-white px-1.5 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.07)] md:px-3">
      <div className="grid grid-cols-5 gap-0.5">
        {quickActions.map(({ href, label, icon: Icon, color }) => (
          <Link href={href} key={href} className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-center transition-transform active:scale-[0.96]">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="truncate text-[10px] font-semibold tracking-[-0.01em] text-slate-700 md:text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function AssistantPrompt({ name }: { name?: string | null }) {
  const chips = ["Homes under 30K", "2 bedroom in Migori", "Land in Rongo"];
  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-lime-50/60 p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-3">
        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
          <Bot className="h-6 w-6" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-bold text-slate-900">Nyumba 360 AI Assistant</h2>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-emerald-800">BETA</span>
          </div>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">Hi {name?.split(" ")[0] || "there"}! What kind of property are you looking for?</p>
        </div>
        <Link href="/assistant" className="shrink-0">
          <Button size="sm" variant="outline" className="h-9 rounded-full border-emerald-600 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask AI
          </Button>
        </Link>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {chips.map((chip) => (
          <Link href="/assistant" key={chip} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-700">
            <Search className="mr-1.5 inline h-3.5 w-3.5" />{chip}
          </Link>
        ))}
      </div>
    </section>
  );
}

function PreferenceOnboarding({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const utils = trpc.useUtils();
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [bedrooms, setBedrooms] = useState("2");
  const [listingType, setListingType] = useState<"rent" | "sale" | "any">("rent");
  const [formError, setFormError] = useState("");
  const savePreferences = trpc.modern.preferencesSet.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.modern.preferencesGet.invalidate(),
        utils.modern.recommendations.invalidate(),
      ]);
      onComplete();
    },
    onError: () => setFormError("We could not save your preferences. Please try again."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedLocation = location.trim();
    const budgetMax = Number(budget.replace(/,/g, ""));
    if (!normalizedLocation || !Number.isFinite(budgetMax) || budgetMax <= 0) {
      setFormError("Add a location and your maximum budget to continue.");
      return;
    }
    setFormError("");
    savePreferences.mutate({
      budgetMin: null,
      budgetMax,
      preferredLocations: [normalizedLocation],
      preferredTypes: [propertyType],
      minBedrooms: Math.max(0, Number(bedrooms) || 0),
      listingType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent className="max-w-md overflow-hidden rounded-[1.6rem] border-emerald-100 bg-white p-0 sm:rounded-[1.8rem]">
        <div className="bg-[radial-gradient(circle_at_78%_15%,rgba(190,242,100,.62),transparent_26%),linear-gradient(135deg,#064e3b,#047857)] px-6 pb-7 pt-8 text-white">
          <span className="inline-grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-lime-200"><Sparkles className="h-5 w-5" /></span>
          <DialogHeader className="mt-4 text-left">
            <DialogTitle className="!font-sans text-2xl font-black tracking-[-0.04em] text-white">Make your picks personal</DialogTitle>
            <DialogDescription className="mt-2 max-w-sm text-sm leading-6 text-emerald-50/85">Tell us what home you want and we will prioritise better matches in Picked For You.</DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-5">
          <div className="space-y-2">
            <Label htmlFor="preference-location" className="font-bold text-slate-800">Preferred location</Label>
            <div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-emerald-600" /><Input id="preference-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Migori Town" className="h-11 rounded-xl border-slate-200 pl-10" autoFocus /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="preference-budget" className="font-bold text-slate-800">Maximum budget</Label><Input id="preference-budget" inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="e.g. 25,000" className="h-11 rounded-xl border-slate-200" /></div>
            <div className="space-y-2"><Label htmlFor="preference-listing-type" className="font-bold text-slate-800">Looking to</Label><select id="preference-listing-type" value={listingType} onChange={(event) => setListingType(event.target.value as "rent" | "sale" | "any")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"><option value="rent">Rent</option><option value="sale">Buy</option><option value="any">Either</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="preference-type" className="font-bold text-slate-800">Property type</Label><select id="preference-type" value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"><option value="apartment">Apartment</option><option value="house">House</option><option value="townhouse">Townhouse</option><option value="villa">Villa</option><option value="land">Land</option><option value="commercial">Commercial</option></select></div>
            <div className="space-y-2"><Label htmlFor="preference-bedrooms" className="font-bold text-slate-800">Minimum bedrooms</Label><select id="preference-bedrooms" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"><option value="0">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option></select></div>
          </div>
          {formError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{formError}</p>}
          <Button type="submit" disabled={savePreferences.isPending} className="h-11 w-full rounded-xl bg-emerald-600 font-extrabold hover:bg-emerald-500">{savePreferences.isPending ? "Saving your picks..." : "Show my matches"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          <p className="text-center text-[11px] leading-4 text-slate-400">You can update these preferences anytime from the AI Assistant.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data: featured, isLoading: loadingFeatured } = trpc.property.featured.useQuery();
  const { data: latest, isLoading: loadingLatest } = trpc.property.latest.useQuery();
  const { data: preferences, isLoading: preferencesLoading } = trpc.modern.preferencesGet.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: recsData, isLoading: recsLoading } = trpc.modern.recommendations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated && !preferencesLoading && !preferences) setShowOnboarding(true);
  }, [isAuthenticated, preferences, preferencesLoading]);

  const recommendations = recsData?.items ?? [];
  const spotlight = isAuthenticated && recommendations.length > 0 ? recommendations : featured ?? [];
  const mapProperties = (featured ?? latest ?? []).slice(0, 4);
  const spotlightLoading = isAuthenticated ? recsLoading : loadingFeatured;

  return (
    <div className="min-h-screen bg-[#f8faf9] pb-24 md:bg-background md:pb-0">
      <Navbar />
      <PreferenceOnboarding open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <main>
        {/* Reference-inspired mobile dashboard */}
        <div className="md:hidden">
          <section className="px-4 pt-4">
            <div className="flex gap-2">
              <Link href="/properties" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-400 shadow-sm">
                <Search className="h-5 w-5 shrink-0 text-slate-500" />
                <span className="truncate">Search location, property or keyword...</span>
              </Link>
              <Link href="/properties" className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-emerald-700 shadow-sm">
                <SlidersHorizontal className="h-5 w-5" />
              </Link>
            </div>
          </section>

          <section className="px-4 pt-5">
            <div className="relative min-h-[290px] overflow-hidden rounded-[1.55rem] bg-emerald-950 p-6 shadow-[0_20px_34px_rgba(6,78,59,.2)]">
              <div className="absolute inset-0 bg-cover bg-center opacity-75" style={{ backgroundImage: "url('/manus-storage/pediwa-kenyan-estate-hero_d54d8e46.jpg')" }} />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/80 to-emerald-950/5" />
              <div className="absolute -right-20 top-0 h-44 w-44 rounded-full bg-lime-300/15 blur-3xl" />
              <div className="relative flex h-full flex-col items-start">
                <span className="rounded-lg bg-lime-300/15 px-3 py-1.5 text-xs font-semibold text-lime-200 backdrop-blur-sm">Find Your Perfect Home</span>
                <h1 className="mt-4 max-w-[250px] !font-sans text-[2.1rem] font-black leading-[1.08] tracking-[-0.04em] text-white">
                  Property.<br /><span className="text-lime-300">Your Future.</span>
                </h1>
                <p className="mt-3 max-w-[210px] text-sm leading-5 text-emerald-50/90">Buy, rent or sell properties in Kenya with confidence.</p>
                <Link href="/properties" className="mt-auto">
                  <Button className="mt-6 h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg hover:bg-emerald-500">
                    Explore Properties <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <span className="absolute bottom-0 right-0 flex gap-1.5">
                  <i className="h-1.5 w-5 rounded-full bg-lime-400" />
                  <i className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  <i className="h-1.5 w-1.5 rounded-full bg-white/80" />
                </span>
              </div>
            </div>
          </section>

          <section className="px-4 pt-4"><QuickActionStrip /></section>

          <section className="pt-6">
            <div className="flex items-end justify-between px-4">
              <div>
                <h2 className="!font-sans text-lg font-extrabold tracking-[-0.02em] text-slate-900">{isAuthenticated ? "Picked For You" : "Featured Properties"}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{isAuthenticated ? "Based on your recent activity" : "Explore verified listings near you"}</p>
              </div>
              <Link href="/properties" className="pb-0.5 text-sm font-bold text-emerald-700">View all</Link>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {spotlightLoading ? Array.from({ length: 3 }).map((_, index) => (
                <div className="h-[295px] w-[265px] shrink-0 rounded-2xl bg-white animate-pulse" key={index} />
              )) : spotlight.length > 0 ? spotlight.slice(0, 6).map((property) => (
                <div className="w-[265px] shrink-0" key={property.id}><PropertyCard property={property} /></div>
              )) : (
                <div className="mx-4 w-full rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-500">New verified listings will appear here soon.</div>
              )}
            </div>
          </section>

          <section className="px-4 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="!font-sans text-lg font-extrabold tracking-[-0.02em] text-slate-900">Explore Properties on Map</h2>
              <Link href="/map" className="text-sm font-bold text-emerald-700">View map</Link>
            </div>
            <HomeMapPreview properties={mapProperties} />
          </section>

          <section className="px-4 pb-4 pt-6"><AssistantPrompt name={user?.name} /></section>
        </div>

        {/* Wider screens retain a richer marketplace landing experience. */}
        <div className="hidden md:block">
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/manus-storage/pediwa-kenyan-estate-hero_d54d8e46.jpg')" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/55 to-slate-950/35" />
            <div className="relative container grid min-h-[530px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
              <div className="max-w-2xl text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-lime-300/15 px-3 py-1.5 text-sm font-semibold text-lime-100 backdrop-blur-sm"><Sparkles className="h-4 w-4" /> Find your perfect Kenyan property</span>
                <h1 className="mt-6 !font-sans text-5xl font-black leading-[1.02] tracking-[-0.05em] lg:text-6xl">Property.<br /><span className="text-lime-300">Your Future.</span></h1>
                <p className="mt-5 max-w-lg text-lg leading-8 text-emerald-50/85">Search verified homes, apartments, land, and commercial spaces with AI-powered recommendations and local insights.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/properties"><Button size="lg" className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500">Explore Properties <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                  <Link href="/assistant"><Button size="lg" variant="outline" className="rounded-xl border-white/35 bg-white/10 font-bold text-white hover:bg-white/20"><Bot className="mr-2 h-4 w-4" /> Ask the AI</Button></Link>
                </div>
              </div>
              <div className="self-end"><PropertySearch /></div>
            </div>
          </section>

          <section className="border-b border-slate-100 bg-white py-7"><div className="container"><QuickActionStrip /></div></section>

          <section className="container py-16">
            <div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Personalized discovery</p><h2 className="mt-2 !font-sans text-4xl font-black tracking-[-0.04em] text-slate-900">{isAuthenticated ? "Picked For You" : "Featured Properties"}</h2></div><Link href="/properties"><Button variant="outline" className="gap-2">View All <ArrowRight className="h-4 w-4" /></Button></Link></div>
            {spotlightLoading ? <div className="grid grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-96 rounded-2xl bg-slate-100 animate-pulse" />)}</div> : spotlight.length > 0 ? <div className="grid grid-cols-3 gap-6">{spotlight.slice(0, 3).map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">New verified listings will appear here soon.</div>}
          </section>

          <section className="bg-emerald-50/55 py-16"><div className="container grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]"><HomeMapPreview properties={mapProperties} /><AssistantPrompt name={user?.name} /></div></section>

          <section className="container py-16 text-center"><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">List with confidence</p><h2 className="mx-auto mt-2 max-w-2xl !font-sans text-4xl font-black tracking-[-0.04em] text-slate-900">Ready to put your property in front of the right buyers?</h2><p className="mx-auto mt-4 max-w-xl text-slate-600">Create a listing, add high-quality photos, and manage inquiries from one trusted marketplace.</p><Button size="lg" className="mt-7 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500" onClick={() => startLogin()}><PlusCircle className="mr-2 h-5 w-5" /> List Your Property</Button></section>
        </div>
      </main>
      <div className="hidden md:block"><Footer /></div>
    </div>
  );
}
