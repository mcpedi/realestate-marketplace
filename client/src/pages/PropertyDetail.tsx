import { useEffect, useState, useRef } from "react";
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
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  Share2,
  ArrowLeft,
  Building,
  Tag,
  Home as HomeIcon,
  CalendarDays,
  Video,
  Sparkles,
  GraduationCap,
  Stethoscope,
  ShoppingBag,
  Bus,
  Utensils,
  TreePine,
  X,
} from "lucide-react";
import { PropertyScoreChip, MatchBadge } from "@/components/PropertyCard";
import { emitCompareChange } from "@/pages/Compare";
import { useCompareIds } from "@/hooks/useCompareIds";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
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

  const compareIds = useCompareIds();
  const isInCompare = compareIds.includes(propertyId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "",
    type: "physical" as "physical" | "virtual",
    notes: "",
  });

  const bookingMutation = trpc.modern.bookingCreate.useMutation({
    onSuccess: () => {
      toast.success("Viewing booked! The seller will confirm shortly.");
      setBookingOpen(false);
      setBookingForm({ date: "", time: "", type: "physical", notes: "" });
    },
    onError: () => toast.error("Could not book the viewing. Please try again."),
  });

  const submitBooking = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!bookingForm.date || !bookingForm.time) {
      toast.error("Please pick a date and time.");
      return;
    }
    const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`).getTime();
    if (scheduledAt < Date.now()) {
      toast.error("Please choose a date and time in the future.");
      return;
    }
    bookingMutation.mutate({
      propertyId,
      scheduledAt,
      type: bookingForm.type,
      notes: bookingForm.notes || undefined,
    });
  };

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

  const recordActivity = trpc.modern.recordActivity.useMutation();
  const poiQuery = trpc.modern.nearbyPois.useQuery(
    { lat: property?.latitude ?? 0, lng: property?.longitude ?? 0, category: "school" },
    { enabled: !!property?.latitude && !!property?.longitude },
  );

  // Record view activity when property loads
  useEffect(() => {
    if (isAuthenticated && propertyId) {
      recordActivity.mutate({ propertyId, eventType: "view" });
    }
  }, [propertyId, isAuthenticated]);

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
  const photoIs360 = photos?.map((p) => Boolean(p.is360)) || [];
  const propertyPhotos = photoUrls.length > 0 ? photoUrls : ["/placeholder-property.jpg"];
  const viewerPhoto = photos?.[viewerPhotoIndex];

  const openViewer = (index: number) => {
    setViewerPhotoIndex(index);
    setViewerOpen(true);
  };

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
            <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
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
              <span className="text-xs text-muted-foreground">ID: {property.id}</span>
              <PropertyScoreChip propertyId={propertyId} />
              <MatchBadge propertyId={propertyId} />
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
            <button
              onClick={() => {
                const current = compareIds;
                const next = isInCompare
                  ? current.filter((i) => i !== propertyId)
                  : [...current, propertyId].slice(0, 4);
                localStorage.setItem("pw-compare-ids", JSON.stringify(next));
                emitCompareChange();
                toast.success(
                  isInCompare ? "Removed from comparison" : "Added to comparison (max 4)"
                );
              }}
              className={`h-10 px-4 rounded-full border flex items-center gap-2 text-sm font-medium transition-colors ${
                isInCompare
                  ? "border-[oklch(0.45_0.18_260)] text-[oklch(0.45_0.18_260)] bg-[oklch(0.45_0.18_260/0.06)]"
                  : "border-border hover:border-[oklch(0.45_0.18_260)]"
              }`}
            >
              <Building className="w-4 h-4" />
              Compare
            </button>
            <Button onClick={() => (isAuthenticated ? setBookingOpen(true) : startLogin())} className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Book a Viewing
            </Button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          {propertyPhotos.length > 1 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {propertyPhotos.map((url, i) => (
                  <CarouselItem key={i}>
                    <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden">
                      <img src={url} alt={`${property.title} - Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {photoIs360[i] && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-3 right-3 gap-1.5 shadow-lg"
                          onClick={() => openViewer(i)}
                        >
                          <Video className="w-4 h-4" /> 360° Tour
                        </Button>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          ) : (
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden">
              <img src={propertyPhotos[0]} alt={property.title} className="w-full h-full object-cover" />
              {photoIs360[0] && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 right-3 gap-1.5 shadow-lg"
                  onClick={() => openViewer(0)}
                >
                  <Video className="w-4 h-4" /> 360° Tour
                </Button>
              )}
            </div>
          )}
          {viewerOpen && viewerPhoto && (
            <PanoramaViewer
              src={viewerPhoto.url}
              label={`${property.title} — Photo ${viewerPhotoIndex + 1} of ${propertyPhotos.length}`}
              onClose={() => setViewerOpen(false)}
              onPrev={() => setViewerPhotoIndex((i) => (i - 1 + propertyPhotos.length) % propertyPhotos.length)}
              onNext={() => setViewerPhotoIndex((i) => (i + 1) % propertyPhotos.length)}
            />
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

            {/* Nyumba 360 Property Score */}
            <ScoreBreakdown propertyId={propertyId} />

            {/* Location Insights */}
            {property.latitude && property.longitude && <LocationInsights lat={property.latitude} lng={property.longitude} />}

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
            {/* Book Viewing Dialog */}
            <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> Book a Viewing
                  </DialogTitle>
                  <DialogDescription>
                    Schedule a physical or virtual viewing of {property.title}. The seller will confirm your request.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      value={bookingForm.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={bookingForm.type === "physical" ? "default" : "outline"}
                      onClick={() => setBookingForm({ ...bookingForm, type: "physical" })}
                    >
                      Physical
                    </Button>
                    <Button
                      variant={bookingForm.type === "virtual" ? "default" : "outline"}
                      onClick={() => setBookingForm({ ...bookingForm, type: "virtual" })}
                    >
                      Virtual
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Optional notes for the seller (e.g. preferred time, questions)"
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    rows={3}
                  />
                  <Button
                    className="w-full"
                    disabled={bookingMutation.isPending}
                    onClick={submitBooking}
                  >
                    {bookingMutation.isPending ? (
                      <><Spinner /> Booking…</>
                    ) : (
                      "Confirm Viewing Request"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-950">
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <p className="text-sm leading-5">Seller contact details stay private. Send a secure inquiry below and the seller can respond through Nyumba 360.</p>
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

function ScoreBreakdown({ propertyId }: { propertyId: number }) {
  const { data: score, isLoading } = trpc.modern.propertyScore.useQuery(
    { propertyId },
    { enabled: !!propertyId },
  );
  if (isLoading || !score) return null;
  const rows = [
    { label: "Value for Money", value: score.valueScore },
    { label: "Location", value: score.locationScore },
    { label: "Amenities", value: score.amenitiesScore },
    { label: "Accessibility", value: score.accessibilityScore },
  ];
  return (
    <div className="bg-white rounded-xl border border-border/50 p-5 shadow-sm">
      <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
        <Sparkles className="w-5 h-5 inline mr-2 text-[oklch(0.72_0.15_80)]" />
        Nyumba 360 Property Score
      </h2>
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white ${
            score.score >= 80
              ? "bg-emerald-500"
              : score.score >= 60
                ? "bg-[oklch(0.45_0.18_260)]"
                : "bg-amber-500"
          }`}
        >
          {score.score}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">
            {score.score >= 80 ? "Excellent Choice" : score.score >= 60 ? "Great Value" : "Good Potential"}
          </div>
          <div className="text-xs text-muted-foreground">Scored out of 100 by Nyumba 360</div>
        </div>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-foreground">{r.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] transition-all duration-500"
                style={{ width: `${r.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationInsights({ lat, lng }: { lat: number; lng: number }) {
  const categories = [
    { key: "school", label: "Schools", icon: GraduationCap },
    { key: "hospital", label: "Hospitals", icon: Stethoscope },
    { key: "shopping_mall", label: "Shopping", icon: ShoppingBag },
    { key: "transit_station", label: "Transport", icon: Bus },
    { key: "restaurant", label: "Restaurants", icon: Utensils },
    { key: "park", label: "Parks", icon: TreePine },
  ] as const;
  return (
    <div className="bg-white rounded-xl border border-border/50 p-5 shadow-sm">
      <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
        Smart Location Insights
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {categories.map((c) => (
          <InsightRow key={c.key} lat={lat} lng={lng} category={c.key} label={c.label} icon={c.icon} />
        ))}
      </div>
    </div>
  );
}

function InsightRow({
  lat,
  lng,
  category,
  label,
  icon: Icon,
}: {
  lat: number;
  lng: number;
  category: "school" | "hospital" | "shopping_mall" | "transit_station" | "restaurant" | "park";
  label: string;
  icon: typeof GraduationCap;
}) {
  const { data, isLoading } = trpc.modern.nearbyPois.useQuery({ lat, lng, category });
  const poi = data?.[0];
  if (isLoading)
    return (
      <div className="h-9 bg-muted/60 rounded-md animate-pulse" />
    );
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-lg bg-[oklch(0.45_0.18_260/0.1)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[oklch(0.45_0.18_260)]" />
      </div>
      <div className="min-w-0">
        <span className="text-muted-foreground">{label} nearby: </span>
        {poi ? (
          <span className="font-medium text-foreground truncate block" title={poi.name}>{poi.name}</span>
        ) : (
          <span className="text-muted-foreground">No results found</span>
        )}
      </div>
    </div>
  );
}

function PanoramaViewer({
  src,
  label,
  onClose,
  onPrev,
  onNext,
}: {
  src: string;
  label: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ startX: number; startY: number; bgX: number; bgY: number } | null>(null);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ startX: e.clientX, startY: e.clientY, bgX: bgPos.x, bgY: bgPos.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const width = areaRef.current?.clientWidth || 800;
    const height = areaRef.current?.clientHeight || 450;
    const dx = ((e.clientX - drag.startX) / width) * 100;
    const dy = ((e.clientY - drag.startY) / height) * 100;
    setBgPos({
      x: Math.max(0, Math.min(100, drag.bgX + dx)),
      y: Math.max(0, Math.min(100, drag.bgY - dy)),
    });
  };

  const onPointerUp = () => setDrag(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[oklch(0.72_0.15_80)]" />
            <span className="text-sm font-medium text-white">{label} — drag to look around</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors" aria-label="Close 360 view">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          ref={areaRef}
          className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label={label}
        >
          {/* Crosshair hint overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] text-white/70 bg-black/40 pointer-events-none">
            Drag to pan the view
          </span>
        </div>
        <div className="flex justify-center gap-3 mt-3">
          <Button variant="secondary" size="sm" onClick={onPrev} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button variant="secondary" size="sm" onClick={onNext} className="gap-1.5">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
