import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sparkles, Send, ArrowRight, MapPin, Bed, Bath, Tag, Heart, User } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChatProperty {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  propertyType: string | null;
  listingType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  photos?: Array<{ url: string }>;
}

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  properties?: ChatProperty[];
  total?: number;
}

const EXAMPLES = [
  "Find me a 2-bedroom apartment in Migori under KSh 25,000",
  "Show me houses for sale with at least 3 bedrooms",
  "What rental properties are available in Kisii?",
  "Find a villa under KSh 15M with a garden",
];

export default function AIAssistant() {
  const { isAuthenticated } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Hi! I'm the Nyumba 360 AI Assistant. Tell me what you're looking for — a location, budget, number of bedrooms, or property type — and I'll find matching listings for you. For example: \"Find me a 2-bedroom apartment in Migori under KSh 25,000.\"",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const askMutation = trpc.modern.aiAssistant.useMutation();
  const savePrefsMutation = trpc.modern.preferencesSet.useMutation({
    onSuccess: () => toast.success("Preferences saved — I'll use them for better recommendations."),
  });

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setMessages((m) => [...m, { role: "user", text: text.trim() }]);
    setInput("");
    setBusy(true);
    try {
      const res = await askMutation.mutateAsync({ message: text.trim() });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: res.summary,
          properties: res.results ?? [],
          total: res.total,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "I'm sorry, I couldn't process that request. Please try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              AI Property Assistant
            </h1>
            <p className="text-sm text-muted-foreground">
              Describe your dream property in plain language
            </p>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="space-y-4 mb-6 max-h-[55vh] overflow-y-auto pr-1"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[oklch(0.45_0.18_260)] text-white rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.properties && m.properties.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {m.properties.map((p) => (
                      <Link
                        key={p.id}
                        href={`/property/${p.id}`}
                        className="block rounded-xl border border-border/60 p-3 hover:shadow-md transition-shadow bg-background"
                      >
                        <div className="flex gap-3 items-center">
                          <img
                            src={p.photos?.[0]?.url || "/placeholder-property.jpg"}
                            alt={p.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{p.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {p.location}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{p.bedrooms}</span>
                              <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{p.bathrooms}</span>
                              <span className="flex items-center gap-0.5"><Tag className="w-3 h-3" />{p.propertyType}</span>
                            </div>
                            <div className="text-sm font-bold text-[oklch(0.45_0.18_260)] mt-1">
                              Ksh {p.price?.toLocaleString()}{p.listingType === "rent" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href="/properties"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.45_0.18_260)] hover:underline"
                    >
                      Browse all properties <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
                {m.properties && m.properties.length === 0 && m.role === "assistant" && (
                  <Link
                    href="/properties"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.45_0.18_260)] hover:underline"
                  >
                    Browse all properties instead <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 border border-border bg-card">
                <Spinner />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => handleSend(ex)}
                className="text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:border-[oklch(0.45_0.18_260)] hover:text-[oklch(0.45_0.18_260)] transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2 sticky bottom-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you're looking for..."
            className="flex-1 shadow-lg"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            {busy ? <Spinner /> : <Send className="w-4 h-4" />}
          </Button>
        </form>

        <div className="mt-8">
          <Accordion type="single" collapsible>
            <AccordionItem value="prefs">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2"><User className="w-4 h-4" /> Set my search preferences</span>
              </AccordionTrigger>
              <AccordionContent>
                <PreferencesPanel onSave={savePrefsMutation.mutate} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}

type PrefsInput = {
  budgetMin: number | null;
  budgetMax: number | null;
  preferredLocations: string[];
  preferredTypes: string[];
  minBedrooms: number;
  listingType: "sale" | "rent" | "any";
};

function PreferencesPanel({ onSave }: { onSave: (input: PrefsInput) => void }) {
  const { data: prefs } = trpc.modern.preferencesGet.useQuery();
  const [budgetMax, setBudgetMax] = useState<number>(prefs?.budgetMax ?? 25000);
  const [minBedrooms, setMinBedrooms] = useState<number>(prefs?.minBedrooms ?? 1);
  const locations = (prefs?.preferredLocations ?? []) as string[];
  const types = (prefs?.preferredTypes ?? []) as string[];
  const [preferredLocations, setPreferredLocations] = useState<string>(locations.join(", "));
  const [preferredTypes, setPreferredTypes] = useState<string>(types.join(", "));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
      <div>
        <label className="text-xs text-muted-foreground">Max budget (KSh)</label>
        <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Min bedrooms</label>
        <Input type="number" value={minBedrooms} onChange={(e) => setMinBedrooms(Number(e.target.value))} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Preferred locations (comma-separated)</label>
        <Input value={preferredLocations} onChange={(e) => setPreferredLocations(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Preferred types (e.g. apartment, house)</label>
        <Input value={preferredTypes} onChange={(e) => setPreferredTypes(e.target.value)} />
      </div>
      <Button
        className="sm:col-span-2"
        onClick={() =>
          onSave({
            budgetMin: null,
            budgetMax,
            minBedrooms,
            listingType: "any",
            preferredLocations: preferredLocations.split(",").map((s) => s.trim()).filter(Boolean),
            preferredTypes: preferredTypes.split(",").map((s) => s.trim()).filter(Boolean),
          })
        }
      >
        Save preferences
      </Button>
    </div>
  );
}
