import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Heart,
  Phone,
  MessageSquare,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  Share2,
  ArrowLeft,
  Building,
  Tag,
  Home as HomeIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Inquiry form
  const [inquiryForm, setInquiryForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    message: "",
  });

  const { data: property, isLoading } = trpc.property.byId.useQuery(propertyId, {
    enabled: !!propertyId,
  });
  const { data: photos, isLoading: loadingPhotos } = trpc.property.photos.useQuery(propertyId, {
    enabled: !!propertyId,
  });
  const { data: seller } = trpc.property.seller.useQuery(propertyId, {
    enabled: !!propertyId,
  });
  const favoriteQuery = trpc.favorite.check.useQuery(propertyId, {
    enabled: !!propertyId && isAuthenticated,
  });

  const inquiryMutation = trpc.inquiry.create.useMutation({
    onSuccess: () => {
      toast.success("Your inquiry has been sent successfully!");
      setInquiryForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", message: "" });
    },
    onError: () => toast.error("Failed to send inquiry. Please try again."),
  });

  const toggleFav = trpc.favorite.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.isFavorite ? "Added to favorites" : "Removed from favorites");
      favoriteQuery.refetch();
    },
  });

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    inquiryMutation.mutate({
      propertyId,
      ...inquiryForm,
    });
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    if (property && property.latitude && property.longitude) {
      map.setCenter({ lat: property.latitude, lng: property.longitude });
      map.setZoom(15);
      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: property.latitude, lng: property.longitude },
        title: property.title,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-96 bg-muted rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
              <div className="h-64 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container py-16 text-center">
          <HomeIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Link href="/properties">
            <Button>Browse Properties</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `Ksh ${Math.round(price / 1000000).toLocaleString()}M`;
    if (price >= 1000) return `Ksh ${Math.round(price / 1000).toLocaleString()}K`;
    return `Ksh ${price.toLocaleString()}`;
  };

  const amenities = property.amenities ? (Array.isArray(property.amenities) ? property.amenities : JSON.parse(String(property.amenities))) : [];
  const photoUrls = photos?.map((p) => p.url) || [];
  const propertyPhotos = photoUrls.length > 0 ? photoUrls : ["/placeholder-property.jpg"];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-secondary/30 border-b border-border/50">
        <div className="container py-4">
          <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
        </div>
      </section>

      <section className="container py-6 md:py-10">
        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {property.title}
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {property.location}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${property.listingType === "sale" ? "bg-[oklch(0.45_0.18_260)]" : "bg-[oklch(0.72_0.15_80)]"}`}>
                For {property.listingType === "sale" ? "Sale" : "Rent"}
              </span>
              <span className="capitalize flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {property.propertyType}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-bold text-[oklch(0.45_0.18_260)]">
                {formatPrice(property.price)}
                {property.listingType === "rent" && (
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                )}
              </div>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => toggleFav.mutate(propertyId)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${favoriteQuery.data ? "border-red-200 bg-red-50" : "border-border hover:border-red-200"}`}
              >
                <Heart className={`w-5 h-5 ${favoriteQuery.data ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              </button>
            )}
            {!isAuthenticated && (
              <button
                onClick={() => startLogin()}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-red-200"
              >
                <Heart className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          {propertyPhotos.length > 1 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {propertyPhotos.map((url, i) => (
                  <CarouselItem key={i}>
                    <div className="aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden">
                      <img src={url} alt={`${property.title} - Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          ) : (
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden">
              <img src={propertyPhotos[0]} alt={property.title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-border/50 p-4 text-center">
                <Bed className="w-5 h-5 text-[oklch(0.45_0.18_260)] mx-auto mb-1" />
                <div className="text-lg font-bold">{property.bedrooms}</div>
                <div className="text-xs text-muted-foreground">Bedrooms</div>
              </div>
              <div className="bg-white rounded-lg border border-border/50 p-4 text-center">
                <Bath className="w-5 h-5 text-[oklch(0.45_0.18_260)] mx-auto mb-1" />
                <div className="text-lg font-bold">{property.bathrooms}</div>
                <div className="text-xs text-muted-foreground">Bathrooms</div>
              </div>
              {property.landSize && (
                <div className="bg-white rounded-lg border border-border/50 p-4 text-center">
                  <Maximize className="w-5 h-5 text-[oklch(0.45_0.18_260)] mx-auto mb-1" />
                  <div className="text-lg font-bold">{property.landSize}</div>
                  <div className="text-xs text-muted-foreground">Land Size (sqm)</div>
                </div>
              )}
              {property.floorArea && (
                <div className="bg-white rounded-lg border border-border/50 p-4 text-center">
                  <Building className="w-5 h-5 text-[oklch(0.45_0.18_260)] mx-auto mb-1" />
                  <div className="text-lg font-bold">{property.floorArea}</div>
                  <div className="text-xs text-muted-foreground">Floor Area (sqm)</div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Description
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{property.description}</p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.15_80)]" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Location
              </h2>
              <div className="rounded-xl overflow-hidden border border-border/50">
                {property.latitude && property.longitude ? (
                  <MapView
                    initialCenter={{ lat: property.latitude, lng: property.longitude }}
                    initialZoom={15}
                    onMapReady={handleMapReady}
                    className="h-80 md:h-96"
                  />
                ) : (
                  <div className="h-80 md:h-96 bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">Location map not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Contact & Inquiry */}
          <div className="space-y-6">
            {/* Seller Info */}
            {seller && (
              <div className="bg-white rounded-xl border border-border/50 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">{seller.name || "Property Owner"}</div>
                    <div className="text-xs text-muted-foreground">Verified Seller</div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Card */}
            <div className="bg-white rounded-xl border border-border/50 p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Contact Seller</h3>
              <div className="space-y-3 mb-5">
                <a
                  href={`tel:+${seller?.phone || '0716339552'}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Call Seller</div>
                    <div className="text-xs text-muted-foreground">Tap to call</div>
                  </div>
                </a>
                <a
                  href={`https://wa.me/${(seller?.phone || '0716339552').replace(/[^0-9]/g, '')}?text=Hi, I'm interested in ${encodeURIComponent(property.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white"
                >
                  <MessageSquare className="w-5 h-5" />
                  <div>
                    <div className="text-sm font-medium">WhatsApp</div>
                    <div className="text-xs opacity-80">Send a message</div>
                  </div>
                </a>
                <a
                  href={`mailto:${seller?.email || 'pediwarealestate@gmail.com'}?subject=Inquiry: ${encodeURIComponent(property.title)}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-xs text-muted-foreground">Send an email</div>
                  </div>
                </a>
              </div>

              {/* Inquiry Form */}
              <h4 className="font-medium text-sm text-foreground mb-3">Send an Inquiry</h4>
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <Input
                  placeholder="Your Name *"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your Email *"
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Phone Number"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                />
                <Textarea
                  placeholder="Your Message *"
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  rows={4}
                  required
                />
                <Button type="submit" className="w-full" disabled={inquiryMutation.isPending}>
                  {inquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                </Button>
              </form>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-xl border border-border/50 p-5">
              <h3 className="font-semibold text-foreground mb-3">Property Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{property.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listing</span>
                  <span className="font-medium capitalize">For {property.listingType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium text-right max-w-[60%]">{property.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{property.viewsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listed</span>
                  <span className="font-medium">{new Date(property.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
