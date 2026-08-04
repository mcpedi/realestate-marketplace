import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Camera, Save, User, Mail, Phone, MapPin, FileText } from "lucide-react";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form from profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const utils = trpc.useUtils();

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      utils.profile.get.invalidate();
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const uploadPictureMutation = trpc.profile.uploadPicture.useMutation({
    onSuccess: (data) => {
      toast.success("Profile picture updated!");
      utils.profile.get.invalidate();
    },
    onError: () => {
      toast.error("Failed to upload profile picture");
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    updateMutation.mutate(formData, {
      onSettled: () => setSaving(false),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      uploadPictureMutation.mutate({
        fileName: file.name,
        contentType: file.type,
        data: base64,
      });
    } catch {
      toast.error("Failed to process file");
      setUploading(false);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">Please sign in to view your profile</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentProfile = profile || user;
  const initials = (currentProfile.name || currentProfile.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Profile
            </h1>
            <p className="text-muted-foreground">Manage your account details and preferences</p>
          </div>

          {/* Profile Picture Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Profile Picture</CardTitle>
              <CardDescription>
                Update your profile picture. It will be visible to other users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-2 border-border/50">
                  <AvatarImage
                    src={currentProfile.profilePicture || ""}
                    alt={currentProfile.name || "Profile"}
                  />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 w-fit"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>
                Update your personal details. Changes will be saved immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <Separator />

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <Separator />

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 0712345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <Separator />

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Nairobi, Kenya"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <Separator />

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    About Me
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself..."
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Write a short description about yourself. This will be visible on your profile.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
