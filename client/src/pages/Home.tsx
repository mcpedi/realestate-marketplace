import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertySearch } from "@/components/PropertySearch";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Search,
  PlusCircle,
  Shield,
  ArrowRight,
  Home as HomeIcon,
  Building,
  Users,
  Star,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

const stats = [
  { icon: Building, label: "Properties", value: "2,500+" },
  { icon: Users, label: "Happy Clients", value: "5,000+" },
  { icon: TrendingUp, label: "Cities Served", value: "15+" },
  { icon: Star, label: "5-Star Reviews", value: "1,200+" },
];

const features = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Find your dream property with advanced filters for location, price, type, and more.",
  },
  {
    icon: Shield,
    title: "Verified Listings",
    description: "All properties are reviewed and verified by our team before going live.",
  },
  {
    icon: Phone,
    title: "Direct Contact",
    description: "Connect directly with property owners via call, WhatsApp, or inquiry form.",
  },
  {
    icon: Sparkles,
    title: "Premium Experience",
    description: "Enjoy a seamless, modern browsing experience on any device.",
  },
];

export default function Home() {
  const { data: featured, isLoading: loadingFeatured } =
    trpc.property.featured.useQuery();
  const { data: latest, isLoading: loadingLatest } =
    trpc.property.latest.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/manus-storage/159512_dacaa659.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[oklch(0.45_0.18_260/0.06)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[oklch(0.72_0.15_80/0.06)] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative container py-16 md:py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Your Trusted Real Estate Partner
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Find Your <span className="text-[oklch(0.72_0.15_80)]">Dream</span>{" "}
              <span className="text-[oklch(0.72_0.15_80)]">Property</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Discover exceptional properties in prime locations. Whether you're buying, selling, or renting, Pedi wa Real Estate connects you with the perfect opportunity.
            </p>
          </div>

          {/* Search */}
          <PropertySearch />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-border/50">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-[oklch(0.45_0.18_260)] mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Featured Properties
              </h2>
              <p className="text-muted-foreground">Handpicked properties for discerning buyers</p>
            </div>
            <Link href="/properties">
              <Button variant="outline" className="gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border/50 animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (featured && featured.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <HomeIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No featured properties yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Latest Properties */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Latest Listings
              </h2>
              <p className="text-muted-foreground">Newly added properties to the marketplace</p>
            </div>
            <Link href="/properties">
              <Button variant="outline" className="gap-2">
                Browse All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loadingLatest ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border/50 animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (latest && latest.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latest.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No properties listed yet. Be the first to add one!</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Choose Us
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We provide a comprehensive real estate experience designed to make your journey seamless
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-[oklch(0.45_0.18_260/0.08)] flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[oklch(0.45_0.18_260)]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.35_0.18_260)] text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to List Your Property?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join thousands of property owners who trust Pedi wa Real Estate to showcase their listings to qualified buyers and renters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[oklch(0.45_0.18_260)] hover:bg-[oklch(0.72_0.15_80)] hover:text-white transition-colors gap-2"
                onClick={() => startLogin()}
              >
                <PlusCircle className="w-5 h-5" />
                List Your Property
              </Button>
              <Link href="/properties">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 gap-2"
                >
                  <Search className="w-5 h-5" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
