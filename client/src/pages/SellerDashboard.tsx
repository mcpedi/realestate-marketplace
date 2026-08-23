import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { isNewListingRequest, rememberNewListingAfterSignIn, sellerDashboardHref } from "@/lib/sellerListing";
import { LocationSuggestionInput } from "@/components/LocationSuggestionInput";
import {
  clearListingDraft,
  createEmptyListingForm,
  LISTING_FORM_STEPS,
  listingStepError,
  loadListingDraft,
  getListingDraftMetadata,
  MIN_LISTING_DESCRIPTION_LENGTH,
  saveListingDraft,
} from "@/lib/listingDraft";
import { advanceSellerListingWorkflow, applySuggestedLocation } from "@/lib/sellerWorkflow";
import { Loader2 } from "lucide-react";
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Upload,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Image as ImageIcon,
  Home as HomeIcon,
  Crown,
  TrendingUp,
  BarChart3,
  Heart,
  Sparkles,
  Users,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  WifiOff,
} from "lucide-react";

const PROPERTY_TYPES = ["house", "apartment", "villa", "land", "commercial", "townhouse", "studio", "penthouse"];
const LISTING_TYPES = ["sale", "rent"];
const AMENITY_OPTIONS = [
  "Swimming Pool", "Garden", "Garage", "Security System", "Air Conditioning",
  "Central Heating", "Fireplace", "Balcony", "Terrace", "Gym",
  "Near School", "Near Hospital", "Near Mall", "Near Park", "Near Transport",
  "WiFi Ready", "Smart Home", "Solar Panels", "Water Tank", "Borehole",
];

export default function SellerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const search = useSearch();
  const requestedNewListing = isNewListingRequest(search);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[oklch(0.45_0.18_260)] border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <HomeIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access the Seller Dashboard</p>
            <Button onClick={() => {
              if (requestedNewListing) rememberNewListingAfterSignIn(window.sessionStorage);
              startLogin();
            }}>{requestedNewListing ? "Sign In & Add Property" : "Sign In"}</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <SellerDashboardContent user={user!} />;
}

function SellerDashboardContent({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const newListingRequested = useMemo(() => isNewListingRequest(search), [search]);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [showAiTools, setShowAiTools] = useState(false);
  const [listingStep, setListingStep] = useState(0);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saved" | "restored">("idle");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const { data: myProperties, isLoading, refetch } = trpc.property.myProperties.useQuery();
  const draftMetadata = getListingDraftMetadata(window.localStorage, user.id, isOnline);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  // Premium membership state
  const { data: premiumInfo } = trpc.subscription.isPremium.useQuery();
  const { data: mySub } = trpc.subscription.mySubscription.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.analytics.allStats.useQuery(undefined, {
    enabled: !!premiumInfo?.isPremium,
  });
  const isPremium = premiumInfo?.isPremium || false;

  // Server-enforced upload limit; UI mirrors it.
  const maxPhotos = (mySub?.plan?.maxImages ?? 10) as number;
  const maxVideos = (mySub?.plan?.maxVideos ?? 0) as number;

  // Premium featured listings & video support
  const { data: myFeatured } = trpc.subscription.featuredListings.useQuery(undefined, { enabled: isPremium });
  const featureMutation = trpc.subscription.featureProperty.useMutation({
    onSuccess: () => {
      toast.success("Property is now featured!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const videoUploadMutation = trpc.propertyVideo.upload.useMutation({
    onSuccess: () => toast.success("Video uploaded!"),
    onError: (err) => toast.error(err.message),
  });
  const createMutation = trpc.property.create.useMutation({
    onSuccess: () => {
      toast.success("Property listing submitted for review!");
      setShowForm(false);
      resetForm();
      clearListingDraft(window.localStorage, user.id);
      setListingStep(0);
      refetch();
      setLocation(sellerDashboardHref());
    },
    onError: (error) => toast.error(error.message?.toLowerCase().includes("description") ? `Please enter at least ${MIN_LISTING_DESCRIPTION_LENGTH} characters in the property description.` : error.message || "Failed to create listing"),
  });
  const updateMutation = trpc.property.update.useMutation({
    onSuccess: () => {
      toast.success("Property updated successfully!");
      setShowForm(false);
      setEditingProperty(null);
      resetForm();
      setListingStep(0);
      refetch();
    },
    onError: () => toast.error("Failed to update listing"),
  });
  const deleteMutation = trpc.property.delete.useMutation({
    onSuccess: () => {
      toast.success("Property deleted");
      refetch();
    },
    onError: () => toast.error("Failed to delete listing"),
  });
  const uploadMutation = trpc.upload.useMutation();

  const [formData, setFormData] = useState(createEmptyListingForm);
  const descriptionLength = formData.description.trim().length;

  const resetForm = () => {
    setFormData(createEmptyListingForm());
    setDraftStatus("idle");
  };

  const openNewListing = useCallback(() => {
    setEditingProperty(null);
    setListingStep(0);
    const savedDraft = loadListingDraft(window.localStorage, user.id);
    if (savedDraft) {
      setFormData(savedDraft);
      setDraftStatus("restored");
    } else {
      resetForm();
    }
    setShowForm(true);
  }, [user.id]);

  const closeListingForm = useCallback(() => {
    if (!editingProperty) saveListingDraft(window.localStorage, user.id, formData);
    setShowForm(false);
    setEditingProperty(null);
    setShowAiTools(false);
    setListingStep(0);
    if (newListingRequested) setLocation(sellerDashboardHref());
  }, [editingProperty, formData, newListingRequested, setLocation, user.id]);

  useEffect(() => {
    if (newListingRequested && !editingProperty) {
      openNewListing();
    }
  }, [newListingRequested, editingProperty, openNewListing]);

  useEffect(() => {
    if (!showForm || editingProperty) return;
    const timer = window.setTimeout(() => {
      if (saveListingDraft(window.localStorage, user.id, formData)) setDraftStatus("saved");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [editingProperty, formData, showForm, user.id]);

  const handlePhotoUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const atLimit = formData.photos.length >= maxPhotos;
    if (atLimit) {
      toast.error(`Photo limit reached (${maxPhotos} photos). ${isPremium ? "" : "Upgrade to Premium for more."}`);
      return;
    }
    const allowed = Array.from(files).slice(0, maxPhotos - formData.photos.length);
    if (allowed.length === 0) return;
    for (const file of allowed) {
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const result = await uploadMutation.mutateAsync({
            file: base64,
            fileName: file.name,
            contentType: file.type,
          });
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, { fileKey: result.key, url: result.url, preview: URL.createObjectURL(file), is360: false }],
          }));
        };
        reader.readAsDataURL(file);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [uploadMutation, formData.photos.length, maxPhotos, isPremium]);

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const basicError = listingStepError(formData, 0) || listingStepError(formData, 1);
    if (basicError) {
      toast.error(basicError);
      setListingStep(listingStepError(formData, 0) ? 0 : 1);
      return;
    }
    if (editingProperty) {
      updateMutation.mutate({
        id: editingProperty.id,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: formData.location,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        propertyType: formData.propertyType as any,
        listingType: formData.listingType as any,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        landSize: formData.landSize ? Number(formData.landSize) : undefined,
        floorArea: formData.floorArea ? Number(formData.floorArea) : undefined,
        amenities: formData.amenities,
        photos: formData.photos.map((p) => ({ fileKey: p.fileKey, url: p.url, is360: p.is360 })),
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: formData.location,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        propertyType: formData.propertyType as any,
        listingType: formData.listingType as any,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        landSize: formData.landSize ? Number(formData.landSize) : undefined,
        floorArea: formData.floorArea ? Number(formData.floorArea) : undefined,
        amenities: formData.amenities,
        photos: formData.photos.map((p) => ({ fileKey: p.fileKey, url: p.url, is360: p.is360 })),
      });
    }
  };

  const openEdit = (property: any) => {
    const amenities = property.amenities ? (Array.isArray(property.amenities) ? property.amenities : JSON.parse(String(property.amenities))) : [];
    setFormData({
      title: property.title,
      description: property.description,
      price: String(property.price),
      location: property.location,
      latitude: property.latitude ? String(property.latitude) : "",
      longitude: property.longitude ? String(property.longitude) : "",
      propertyType: property.propertyType,
      listingType: property.listingType,
      bedrooms: String(property.bedrooms || 0),
      bathrooms: String(property.bathrooms || 0),
      landSize: property.landSize ? String(property.landSize) : "",
      floorArea: property.floorArea ? String(property.floorArea) : "",
      amenities,
      photos: (property.photos || []).map((p: any) => ({ fileKey: p.fileKey, url: p.url, preview: p.url, is360: Boolean(p.is360) })),
    });
    setEditingProperty(property);
    setListingStep(0);
    setDraftStatus("idle");
    setShowForm(true);
  };

  const advanceListingStep = () => {
    const { error, nextStep } = advanceSellerListingWorkflow(formData, listingStep);
    if (error) {
      toast.error(error);
      return;
    }
    setListingStep(nextStep);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "pending": return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "rejected": return <Badge variant="outline" className="border-red-500 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = myProperties?.filter((p) => p.status === "pending").length || 0;
  const approvedCount = myProperties?.filter((p) => p.status === "approved").length || 0;
  const totalViews = myProperties?.reduce((sum, p) => sum + (p.viewsCount || 0), 0) || 0;
  const totalInquiries = myProperties?.reduce((sum, p) => sum + (p.inquiriesCount || 0), 0) || 0;
  const { data: pendingViewingsData } = trpc.modern.sellerBookings.useQuery();
  const pendingViewings = (pendingViewingsData ?? []).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-secondary/30 border-b border-border/50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Welcome back, {user?.name || "Seller"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/seller/viewings" className="inline-flex items-center gap-2 rounded-md border border-[oklch(0.45_0.18_260)]/30 px-4 py-2 text-sm font-medium text-[oklch(0.45_0.18_260)] hover:bg-[oklch(0.45_0.18_260)]/5 transition-colors">
                <CalendarDays className="w-4 h-4" />
                Viewings
                {pendingViewings > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[oklch(0.45_0.18_260)] px-1 text-xs font-semibold text-white">
                    {pendingViewings}
                  </span>
                )}
              </Link>
              <Link href="/leads" className="inline-flex items-center gap-2 rounded-md border border-[#0d3b9e]/30 px-4 py-2 text-sm font-medium text-[#0d3b9e] hover:bg-[#0d3b9e]/5 transition-colors">
                <Users className="w-4 h-4" />
                Leads
                {totalInquiries > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0d3b9e] px-1 text-xs font-semibold text-white">
                    {totalInquiries}
                  </span>
                )}
              </Link>
              <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeListingForm(); }}>
                <Button onClick={openNewListing} className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Add Property
                </Button>
              <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
                <DialogHeader>
                  <div className="border-b border-slate-100 px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
                    <DialogTitle className="text-xl font-extrabold tracking-tight">{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
                    <p className="mt-1 text-sm text-slate-500">{editingProperty ? "Update your listing details" : "Your progress is saved automatically on this device."}</p>
                    <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Listing form progress">
                      {LISTING_FORM_STEPS.map((step, index) => (
                        <li key={step.label} className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${index < listingStep ? "bg-emerald-600 text-white" : index === listingStep ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : "bg-slate-100 text-slate-500"}`}>{index < listingStep ? <Check className="h-4 w-4" /> : index + 1}</span>
                            <span className={`truncate text-xs font-bold ${index <= listingStep ? "text-slate-900" : "text-slate-400"}`}>{step.label}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
                  {!editingProperty && (draftStatus !== "idle" || !isOnline) && <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${isOnline ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{isOnline ? <Check className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{!isOnline ? "Offline — changes stay safely on this device until you reconnect." : draftStatus === "restored" ? "Your saved local draft was restored." : draftMetadata.savedAt ? `Draft saved locally at ${new Date(draftMetadata.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.` : "Draft saved automatically."}</div>}
                  {listingStep === 0 && <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title *</label>
                    <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Modern 3BR Villa in Karen" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description *</label>
                    <Textarea
                      required
                      minLength={MIN_LISTING_DESCRIPTION_LENGTH}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Describe the property, key features, and nearby conveniences..."
                      aria-invalid={descriptionLength > 0 && descriptionLength < MIN_LISTING_DESCRIPTION_LENGTH}
                      className={descriptionLength > 0 && descriptionLength < MIN_LISTING_DESCRIPTION_LENGTH ? "border-amber-400 focus-visible:ring-amber-300" : ""}
                    />
                    <p className={`mt-1.5 text-xs ${descriptionLength > 0 && descriptionLength < MIN_LISTING_DESCRIPTION_LENGTH ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                      {descriptionLength}/{MIN_LISTING_DESCRIPTION_LENGTH} characters minimum {descriptionLength > 0 && descriptionLength < MIN_LISTING_DESCRIPTION_LENGTH ? `— add ${MIN_LISTING_DESCRIPTION_LENGTH - descriptionLength} more.` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Property Type *</label>
                      <Select value={formData.propertyType} onValueChange={(v) => setFormData({ ...formData, propertyType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Listing Type *</label>
                      <Select value={formData.listingType} onValueChange={(v) => setFormData({ ...formData, listingType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LISTING_TYPES.map((t) => <SelectItem key={t} value={t}>{t === "sale" ? "For Sale" : "For Rent"}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bedrooms</label>
                      <Input type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bathrooms</label>
                      <Input type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Floor Area (sqm)</label>
                    <Input type="number" value={formData.floorArea} onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })} />
                  </div>
                  </>}
                  {listingStep === 1 && <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Price (Ksh) *</label>
                    <Input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="5000000" />
                  </div>
                  <LocationSuggestionInput
                    value={formData.location}
                    onChange={(location: string) => setFormData((current) => ({ ...current, location }))}
                    onSelect={(selection) => setFormData((current) => applySuggestedLocation(current, selection))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Latitude</label>
                      <Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="-1.3100" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Longitude</label>
                      <Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="36.7069" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Land Size (sqm)</label>
                    <Input type="number" value={formData.landSize} onChange={(e) => setFormData({ ...formData, landSize: e.target.value })} />
                  </div>
                  </>}
                  {listingStep === 2 && <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITY_OPTIONS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAmenity(a)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            formData.amenities.includes(a)
                              ? "bg-[oklch(0.45_0.18_260)] text-white border-[oklch(0.45_0.18_260)]"
                              : "border-border hover:border-[oklch(0.45_0.18_260)]"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Property Photos</label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {formData.photos.length > 0 && (
                        <div className="w-full text-xs text-muted-foreground mb-1">
                          {formData.photos.length} / {maxPhotos} photos {isPremium && "(Premium limit)"}
                        </div>
                      )}
                      {formData.photos.map((photo, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Mark as 360° photo (opens the 360° virtual tour viewer)"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                photos: prev.photos.map((p, j) => (j === i ? { ...p, is360: !p.is360 } : p)),
                              }))
                            }
                            className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-semibold backdrop-blur-sm ${
                              photo.is360 ? "bg-[oklch(0.45_0.18_260)] text-white" : "bg-black/40 text-white/80 hover:bg-black/60"
                            }`}
                          >
                            360°
                          </button>
                        </div>
                      ))}
                      {formData.photos.length < maxPhotos && (
                        <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-[oklch(0.45_0.18_260)] transition-colors">
                          <div className="text-center">
                            <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Upload</span>
                          </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e.target.files)}
                        />
                      </label>
                      )}
                    </div>
                    {formData.photos.length >= maxPhotos && (
                      <p className="text-xs text-muted-foreground">
                        Photo limit reached ({maxPhotos} photos).
                        {isPremium ? "" : " Upgrade to Premium for more photos."}
                      </p>
                    )}
                  </div>

                  {/* AI Tools (Premium) */}
                  <div className="rounded-lg border border-dashed border-[oklch(0.72_0.15_80)]/50 bg-[oklch(0.72_0.15_80)]/5 p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[oklch(0.72_0.15_80)]" />
                        <span className="text-sm font-semibold text-foreground">AI Assistant</span>
                        {!isPremium && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[oklch(0.72_0.15_80)] text-white">PREMIUM</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={!isPremium}
                        onClick={() => {
                          if (!isPremium) {
                            toast.error("AI tools are a Premium benefit — upgrade your plan to use them");
                            return;
                          }
                          setShowAiTools((v) => !v);
                        }}
                      >
                        {showAiTools ? "Hide Tools" : "Use AI Tools"}
                      </Button>
                    </div>
                    {showAiTools && isPremium && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <AiGenerateDescriptionButton formData={formData} setFormData={setFormData} /> 
                        <AiRecommendPriceButton formData={formData} setFormData={setFormData} /> 
                      </div>
                    )}
                  </div>
                  </>}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => listingStep > 0 ? setListingStep((step) => step - 1) : closeListingForm()}>
                      {listingStep > 0 ? <><ChevronLeft className="mr-1 h-4 w-4" />Back</> : "Save & close"}
                    </Button>
                    {listingStep < LISTING_FORM_STEPS.length - 1 ? (
                      <Button type="button" className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500" onClick={advanceListingStep}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>
                    ) : (
                      <Button type="submit" className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500" disabled={createMutation.isPending || updateMutation.isPending}>
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingProperty ? "Update Property" : "Submit for Review"}
                      </Button>
                    )}
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1">
        <div className="container py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-border/50 p-4">
              <div className="text-2xl font-bold text-foreground">{myProperties?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Listings</div>
            </div>
            <div className="bg-white rounded-xl border border-border/50 p-4">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="bg-white rounded-xl border border-border/50 p-4">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </div>
            <div className="bg-white rounded-xl border border-border/50 p-4">
              <div className="text-2xl font-bold text-[oklch(0.45_0.18_260)]">{totalViews}</div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
          </div>

          {/* Premium Analytics */}
          {isPremium && (
            <div className="mb-8 rounded-xl border border-[oklch(0.72_0.15_80)]/40 bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.4_0.16_280)] text-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[oklch(0.8_0.15_80)]" />
                <h3 className="font-semibold">Listing Analytics</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[oklch(0.72_0.15_80)] text-white">PREMIUM</span>
              </div>
              {statsLoading || !stats ? (
                <div className="animate-pulse flex gap-4">
                  <div className="h-8 bg-white/20 rounded w-24" />
                  <div className="h-8 bg-white/20 rounded w-24" />
                  <div className="h-8 bg-white/20 rounded w-24" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{stats.reduce((s, p) => s + p.views, 0)}</div>
                    <div className="text-sm text-blue-100 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.reduce((s, p) => s + p.saves, 0)}</div>
                    <div className="text-sm text-blue-100 flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Saves</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.reduce((s, p) => s + p.inquiries, 0)}</div>
                    <div className="text-sm text-blue-100 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Inquiries</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Properties List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border/50 p-5 animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-4 bg-muted rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !myProperties || myProperties.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">No Properties Yet</h3>
              <p className="text-muted-foreground mb-6">Start by adding your first property listing</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Property
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-xl border border-border/50 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {property.photos && property.photos.length > 0 && (
                      <img
                        src={property.photos[0].url}
                        alt={property.title}
                        className="w-full md:w-32 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{property.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{property.location}</span>
                            <span>•</span>
                            <span className="capitalize">{property.propertyType}</span>
                            <span>•</span>
                            <span>{property.bedrooms} BR / {property.bathrooms} BA</span>
                          </div>
                        </div>
                        {getStatusBadge(property.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {property.viewsCount || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> {property.inquiriesCount || 0} inquiries
                        </span>
                        <span className="font-semibold text-[oklch(0.45_0.18_260)]">
                          Ksh {property.price.toLocaleString()}
                          {property.listingType === "rent" && "/mo"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/property/${property.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(property)}>
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-600 hover:text-red-700 hover:border-red-200"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this property?")) {
                            deleteMutation.mutate(property.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                    </div>
                    {/* Premium: feature this listing */}
                    {isPremium && property.status === "approved" && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-[oklch(0.72_0.15_80)]" /> Boost this listing
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8 text-[oklch(0.72_0.15_80)] border-[oklch(0.72_0.15_80)]/40"
                          disabled={featureMutation.isPending}
                          onClick={() => {
                            if (!window.confirm("Feature this property for 30 days at Ksh 1,500? It will appear at the top of search results.")) return;
                            featureMutation.mutate({ propertyId: property.id, duration: "30_days", paymentMethod: "mpesa" });
                          }}
                        >
                          {featureMutation.isPending ? "Processing..." : "Feature Listing (30 days)"}
                        </Button>
                        <VideoUploadRow propertyId={property.id} maxVideos={maxVideos} uploadMutation={videoUploadMutation} /> 
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Video upload row for premium users (Premium)
function VideoUploadRow({ propertyId, maxVideos, uploadMutation }: { propertyId: number; maxVideos: number; uploadMutation: any }) {
  const [working, setWorking] = useState(false);
  const { data: videos, refetch } = trpc.propertyVideo.list.useQuery(propertyId, { enabled: maxVideos > 0 });
  const videoDeleteMutation = trpc.propertyVideo.delete.useMutation({
    onSuccess: () => {
      toast.success("Video deleted");
      refetch();
    },
    onError: () => toast.error("Failed to delete video"),
  });

  const handleVideoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be smaller than 100MB");
      return;
    }
    if ((videos?.length ?? 0) >= maxVideos) {
      toast.error(`Video limit reached (${maxVideos} videos per property). Upgrade to Premium for more.`);
      return;
    }
    setWorking(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(new Uint8Array(arrayBuffer).reduce((d, b) => d + String.fromCharCode(b), ""));
      await uploadMutation.mutateAsync({ propertyId, fileName: file.name, contentType: file.type, data: base64 });
      refetch();
    } catch {
      toast.error("Failed to upload video");
    } finally {
      setWorking(false);
    }
  };

  if (maxVideos <= 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">{(videos?.length ?? 0)}/{maxVideos} videos</span>
      {(videos?.length ?? 0) < maxVideos && (
        <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-dashed border-[oklch(0.45_0.18_260)]/50 cursor-pointer hover:bg-secondary transition-colors">
          <Upload className="w-3.5 h-3.5 text-[oklch(0.45_0.18_260)]" />
          {working ? "Uploading..." : "Add Video"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleVideoUpload(e.target.files)}
          />
        </label>
      )}
      {videos?.map((v: any) => (
        <span key={v.id} className="inline-flex items-center gap-1 text-xs border rounded-md px-2 py-1">
          Video
          <button
            type="button"
            onClick={() => videoDeleteMutation.mutate(v.id)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

// AI description generator button (Premium)
function AiGenerateDescriptionButton({ formData, setFormData }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  const [working, setWorking] = useState(false);
  const generateDescription = trpc.ai.generateDescription.useMutation();

  const handleGenerate = async () => {
    if (!formData.title || !formData.propertyType || !formData.location) {
      toast.error("Please fill in at least the title, property type, and location first");
      return;
    }
    setWorking(true);
    try {
      const result = await generateDescription.mutateAsync({
        propertyType: formData.propertyType,
        location: formData.location,
        bedrooms: Number(formData.bedrooms || 0),
        bathrooms: Number(formData.bathrooms || 0),
        listingType: formData.listingType,
        price: formData.price ? Number(formData.price) : undefined,
        features: (formData.amenities || []).join(", "),
      });
      setFormData((prev: any) => ({ ...prev, description: result.description }));
      toast.success("AI description generated!");
    } catch {
      toast.error("Failed to generate description");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={handleGenerate} disabled={working || generateDescription.isPending}>
      {working || generateDescription.isPending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" /> Generate Description
        </>
      )}
    </Button>
  );
}

// AI price recommendation button (Premium)
function AiRecommendPriceButton({ formData, setFormData }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  const [working, setWorking] = useState(false);
  const recommendPrice = trpc.ai.recommendPrice.useMutation();

  const handleRecommend = async () => {
    if (!formData.propertyType || !formData.location || !formData.bedrooms || !formData.bathrooms) {
      toast.error("Please fill in property type, location, bedrooms, and bathrooms first");
      return;
    }
    setWorking(true);
    try {
      const result = await recommendPrice.mutateAsync({
        propertyType: formData.propertyType,
        location: formData.location,
        bedrooms: Number(formData.bedrooms || 0),
        bathrooms: Number(formData.bathrooms || 0),
        landSize: formData.landSize ? Number(formData.landSize) : undefined,
        floorArea: formData.floorArea ? Number(formData.floorArea) : undefined,
        listingType: formData.listingType,
      });
      setFormData((prev: any) => ({ ...prev, price: String(Math.round(result.recommendedPrice)) }));
      toast.success(`AI suggests Ksh ${Math.round(result.recommendedPrice).toLocaleString()} — ${result.reasoning}`);
    } catch {
      toast.error("Failed to generate price recommendation");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={handleRecommend} disabled={working || recommendPrice.isPending}>
      {working || recommendPrice.isPending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
        </>
      ) : (
        <>
          <TrendingUp className="w-3.5 h-3.5" /> Suggest Price
        </>
      )}
    </Button>
  );
}
