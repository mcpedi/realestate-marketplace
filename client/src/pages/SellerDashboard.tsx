import { useState, useCallback } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
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
            <Button onClick={() => startLogin()}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <SellerDashboardContent user={user!} />;
}

function SellerDashboardContent({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);

  const { data: myProperties, isLoading, refetch } = trpc.property.myProperties.useQuery();
  const createMutation = trpc.property.create.useMutation({
    onSuccess: () => {
      toast.success("Property listing submitted for review!");
      setShowForm(false);
      resetForm();
      refetch();
    },
    onError: () => toast.error("Failed to create listing"),
  });
  const updateMutation = trpc.property.update.useMutation({
    onSuccess: () => {
      toast.success("Property updated successfully!");
      setShowForm(false);
      setEditingProperty(null);
      resetForm();
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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    latitude: "",
    longitude: "",
    propertyType: "house",
    listingType: "sale",
    bedrooms: "0",
    bathrooms: "0",
    landSize: "",
    floorArea: "",
    amenities: [] as string[],
    photos: [] as { fileKey: string; url: string; preview: string }[],
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      location: "",
      latitude: "",
      longitude: "",
      propertyType: "house",
      listingType: "sale",
      bedrooms: "0",
      bathrooms: "0",
      landSize: "",
      floorArea: "",
      amenities: [],
      photos: [],
    });
  };

  const handlePhotoUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
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
            photos: [...prev.photos, { fileKey: result.key, url: result.url, preview: URL.createObjectURL(file) }],
          }));
        };
        reader.readAsDataURL(file);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [uploadMutation]);

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
        photos: formData.photos.map((p) => ({ fileKey: p.fileKey, url: p.url })),
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
        photos: formData.photos.map((p) => ({ fileKey: p.fileKey, url: p.url })),
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
      photos: (property.photos || []).map((p: any) => ({ fileKey: p.fileKey, url: p.url, preview: p.url })),
    });
    setEditingProperty(property);
    setShowForm(true);
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
            <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingProperty(null); resetForm(); } }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title *</label>
                    <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Modern 3BR Villa in Karen" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description *</label>
                    <Textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="Describe the property..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Price (Ksh) *</label>
                      <Input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="5000000" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location *</label>
                      <Input required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Karen, Nairobi" />
                    </div>
                  </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bedrooms</label>
                      <Input type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bathrooms</label>
                      <Input type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Land Size (sqm)</label>
                      <Input type="number" value={formData.landSize} onChange={(e) => setFormData({ ...formData, landSize: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Floor Area (sqm)</label>
                      <Input type="number" value={formData.floorArea} onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })} />
                    </div>
                  </div>
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
                        </div>
                      ))}
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
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                      {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingProperty ? "Update Property" : "Submit for Review"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingProperty(null); resetForm(); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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

// Helper import
import { Link } from "wouter";
