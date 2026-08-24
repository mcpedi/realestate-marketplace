import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Crown,
  FileText,
  Heart,
  Info,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  UsersRound,
} from "lucide-react";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
};

type PreferenceForm = {
  location: string;
  budgetMin: string;
  budgetMax: string;
  propertyType: string;
  minBedrooms: string;
  listingType: "sale" | "rent" | "any";
};

type ActionRowProps = {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  value?: string;
  tone?: "default" | "danger";
  children?: React.ReactNode;
};

function ActionRow({ icon: Icon, label, href, onClick, value, tone = "default", children }: ActionRowProps) {
  const content = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === "danger" ? "bg-red-50 text-red-500 dark:bg-red-950/30" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className={`min-w-0 flex-1 text-sm font-medium ${tone === "danger" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{label}</span>
      {children}
      {value && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{value}</span>}
      <ChevronRight className={`h-4 w-4 shrink-0 ${tone === "danger" ? "text-red-300" : "text-muted-foreground"}`} />
    </>
  );

  const className = "flex min-h-14 items-center gap-3 px-3.5 transition-colors hover:bg-muted/70";
  if (href) return <a href={href} className={className}>{content}</a>;
  return <button type="button" onClick={onClick} className={`${className} w-full text-left`}>{content}</button>;
}

function AccountGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-base font-bold tracking-tight text-foreground">{title}</h2>
      <div className="divide-y divide-border/70 overflow-hidden rounded-[22px] border border-border/60 bg-card shadow-[0_8px_28px_rgba(10,37,31,0.06)]">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: mySub, isLoading: subLoading } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: !!user });
  const { data: hub, isLoading: hubLoading } = trpc.modern.profileHubSummary.useQuery(undefined, { enabled: !!user });
  const { data: preferences } = trpc.modern.preferencesGet.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({ name: "", email: "", phone: "", location: "", bio: "" });
  const [preferenceData, setPreferenceData] = useState<PreferenceForm>({
    location: "",
    budgetMin: "",
    budgetMax: "",
    propertyType: "",
    minBedrooms: "0",
    listingType: "any",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremium = Boolean(mySub?.plan);
  const planExpires = mySub?.subscription?.endDate ? new Date(mySub.subscription.endDate).toLocaleDateString() : null;

  useEffect(() => {
    if (!profile) return;
    setFormData({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      bio: profile.bio || "",
    });
  }, [profile]);

  useEffect(() => {
    if (!preferences) return;
    const locations = Array.isArray(preferences.preferredLocations) ? preferences.preferredLocations : [];
    const types = Array.isArray(preferences.preferredTypes) ? preferences.preferredTypes : [];
    setPreferenceData({
      location: locations[0] || "",
      budgetMin: preferences.budgetMin?.toString() || "",
      budgetMax: preferences.budgetMax?.toString() || "",
      propertyType: types[0] || "",
      minBedrooms: (preferences.minBedrooms ?? 0).toString(),
      listingType: preferences.listingType === "sale" || preferences.listingType === "rent" ? preferences.listingType : "any",
    });
  }, [preferences]);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setEditingProfile(false);
      utils.profile.get.invalidate();
      utils.auth.me.invalidate();
    },
    onError: () => toast.error("Could not update your profile"),
  });

  const uploadPictureMutation = trpc.profile.uploadPicture.useMutation({
    onSuccess: () => {
      toast.success("Profile picture updated");
      utils.profile.get.invalidate();
    },
    onError: () => toast.error("Could not upload your profile picture"),
    onSettled: () => setUploading(false),
  });

  const preferencesMutation = trpc.modern.preferencesSet.useMutation({
    onSuccess: () => {
      toast.success("Search preferences updated");
      setEditingPreferences(false);
      utils.modern.preferencesGet.invalidate();
      utils.modern.recommendations.invalidate();
    },
    onError: () => toast.error("Could not save search preferences"),
  });

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    updateMutation.mutate(formData, { onSettled: () => setSaving(false) });
  };

  const handlePreferenceSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    preferencesMutation.mutate({
      budgetMin: preferenceData.budgetMin ? Number(preferenceData.budgetMin) : null,
      budgetMax: preferenceData.budgetMax ? Number(preferenceData.budgetMax) : null,
      preferredLocations: preferenceData.location ? [preferenceData.location] : [],
      preferredTypes: preferenceData.propertyType ? [preferenceData.propertyType] : [],
      minBedrooms: Number(preferenceData.minBedrooms) || 0,
      listingType: preferenceData.listingType,
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Profile photos must be smaller than 3 MB");
      return;
    }
    setUploading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      uploadPictureMutation.mutate({ fileName: file.name, contentType: file.type, data: btoa(binary) });
    } catch {
      toast.error("Could not process that image");
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out");
    window.location.href = "/";
  };

  if (authLoading || profileLoading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-background"><Navbar /><main className="flex min-h-[60vh] items-center justify-center px-4"><div className="text-center"><User className="mx-auto mb-4 h-14 w-14 text-muted-foreground/50" /><h1 className="text-xl font-bold">Your profile is waiting</h1><p className="mt-2 text-sm text-muted-foreground">Please sign in to manage your account and preferences.</p></div></main></div>;
  }

  const currentProfile = profile || user;
  const initials = (currentProfile.name || currentProfile.email || "U").split(" ").map((part: string) => part[0]).join("").toUpperCase().slice(0, 2);
  const memberLabel = isPremium ? "Premium member" : "Property explorer";

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.004_145)] text-foreground dark:bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 md:pb-12 md:pt-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <a href="/" aria-label="Back to home" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"><ArrowRight className="h-5 w-5 rotate-180" /></a>
            <h1 className="text-lg font-bold tracking-tight">My Profile</h1>
            <button type="button" onClick={() => setEditingProfile(true)} aria-label="Edit profile" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"><Settings className="h-5 w-5" /></button>
          </div>

          <section className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_82%_24%,rgba(37,184,110,.44),transparent_36%),linear-gradient(125deg,#071e29_0%,#073c35_57%,#0a5a3e_100%)] px-5 pb-20 pt-6 text-white shadow-[0_18px_42px_rgba(3,62,46,.20)] sm:px-8 sm:pb-16">
            <div className="pointer-events-none absolute -bottom-12 right-0 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative flex items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24 border-4 border-white/90 shadow-lg sm:h-28 sm:w-28">
                  <AvatarImage src={currentProfile.profilePicture || ""} alt={currentProfile.name || "Profile"} />
                  <AvatarFallback className="bg-emerald-100 text-xl font-bold text-emerald-800">{initials}</AvatarFallback>
                </Avatar>
                <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Change profile picture" className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-md transition-transform hover:scale-105"><Camera className="h-4 w-4" /></button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{currentProfile.name || "Nyumba 360 member"}</h2>
                  {isPremium && <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-label="Premium member" />}
                </div>
                <p className="mt-0.5 text-sm font-medium text-emerald-200">{memberLabel}</p>
                <div className="mt-3 space-y-1.5 text-sm text-emerald-50/95">
                  {currentProfile.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-300" />{currentProfile.phone}</p>}
                  <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0 text-emerald-300" />{currentProfile.email}</p>
                  {currentProfile.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-300" />{currentProfile.location}</p>}
                </div>
              </div>
              <button type="button" onClick={() => setEditingProfile(true)} className="hidden shrink-0 items-center gap-2 rounded-full border border-white/60 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"><User className="h-4 w-4" />Edit profile</button>
            </div>
          </section>

          <section className="relative z-10 -mt-11 grid grid-cols-4 overflow-hidden rounded-[22px] border border-border/60 bg-card shadow-[0_12px_32px_rgba(10,37,31,0.12)]">
            {[
              { icon: Heart, label: "Saved", count: hub?.savedCount ?? 0, color: "text-emerald-600", href: "/favorites" },
              { icon: Bell, label: "Alerts", count: hub?.alertCount ?? 0, color: "text-blue-600", href: "/alerts" },
              { icon: CalendarDays, label: "Viewings", count: hub?.viewingCount ?? 0, color: "text-violet-600", href: "/bookings" },
              { icon: MessageSquare, label: "Inquiries", count: hub?.inquiryCount ?? 0, color: "text-amber-600", href: "/leads" },
            ].map(({ icon: Icon, label, count, color, href }, index) => (
              <a key={label} href={href} className={`min-w-0 px-2 py-4 text-center transition-colors hover:bg-muted/60 ${index > 0 ? "border-l border-border/60" : ""}`}>
                <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-muted ${color}`}><Icon className="h-[18px] w-[18px]" /></span>
                <p className="mt-2 text-lg font-extrabold leading-none tabular-nums">{hubLoading ? "—" : count}</p>
                <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
              </a>
            ))}
          </section>

          <section className={`mt-5 flex items-center gap-3 rounded-[22px] border px-4 py-4 ${isPremium ? "border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/25" : "border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 dark:border-emerald-900/50 dark:from-emerald-950/25 dark:to-lime-950/20"}`}>
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isPremium ? "bg-blue-600 text-white" : "bg-emerald-700 text-amber-300"}`}><Crown className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-foreground">{isPremium ? `${mySub?.plan?.name || "Premium"} plan active` : "Go Premium"}</h2>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{isPremium ? `Your benefits${planExpires ? ` are active until ${planExpires}` : " are active"}.` : "Unlock priority listings, richer tools, and more benefits."}</p>
            </div>
            <a href="/premium" className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isPremium ? "bg-blue-600" : "bg-emerald-700"}`}><Crown className="h-3.5 w-3.5" />{isPremium ? "Manage" : "Upgrade"}<ArrowRight className="h-3.5 w-3.5" /></a>
          </section>

          <div className="mt-6 space-y-6">
            <AccountGroup title="Account">
              <ActionRow icon={User} label="Personal information" onClick={() => setEditingProfile(true)} />
              <ActionRow icon={SlidersHorizontal} label="Search preferences" onClick={() => setEditingPreferences(true)} value={preferences ? "Set" : "Add"} />
              <ActionRow icon={ShieldCheck} label="Account security" onClick={() => toast.info("Your account is secured through Manus sign-in.")} />
              <ActionRow icon={CreditCard} label="Membership & payments" href="/premium" />
              <ActionRow icon={Bell} label="Notification preferences" href="/alerts" />
            </AccountGroup>

            <AccountGroup title="My Activity">
              <ActionRow icon={Clock3} label="Recently viewed" onClick={() => toast.info("Your latest viewed homes are shown above.")}>
                {hub?.recentlyViewed?.length ? <span className="flex -space-x-2">{hub.recentlyViewed.map((property) => property.imageUrl ? <img key={property.id} src={property.imageUrl} alt={property.title} className="h-8 w-10 rounded-lg border-2 border-card object-cover" /> : <span key={property.id} className="flex h-8 w-10 items-center justify-center rounded-lg border-2 border-card bg-emerald-100 text-[10px] font-bold text-emerald-800">{property.title.slice(0, 1)}</span>)}</span> : <span className="text-xs text-muted-foreground">No views yet</span>}
              </ActionRow>
              <ActionRow icon={CalendarDays} label="My viewings" href="/bookings" value={`${hub?.viewingCount ?? 0}`} />
              <ActionRow icon={MessageSquare} label="Inquiries & chats" href="/leads" value={`${hub?.inquiryCount ?? 0}`} />
              <ActionRow icon={Sparkles} label="Picked for You" href="/" />
            </AccountGroup>

            <AccountGroup title="More">
              <ActionRow icon={CircleHelp} label="Help center" href="/faq" />
              <ActionRow icon={UsersRound} label="Invite a friend" onClick={() => toast.info("Friend invitations are coming soon.")} value="Coming soon" />
              <ActionRow icon={Info} label="About Nyumba 360" href="/about" />
              <ActionRow icon={LogOut} label="Log out" tone="danger" onClick={handleLogout} />
            </AccountGroup>
          </div>
        </div>
      </main>
      <div className="hidden md:block"><Footer /></div>

      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Personal information</DialogTitle><DialogDescription>Keep the details shown on your profile up to date.</DialogDescription></DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="profile-phone">Phone number</Label><Input id="profile-phone" placeholder="0712 345 678" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="profile-email">Email address</Label><Input id="profile-email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="profile-location">Location</Label><Input id="profile-location" placeholder="e.g. Migori, Kenya" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="profile-bio">About me</Label><Textarea id="profile-bio" rows={4} placeholder="Tell buyers and agents a little about yourself" value={formData.bio} onChange={(event) => setFormData({ ...formData, bio: event.target.value })} /></div>
            <Button type="submit" className="w-full gap-2" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving…" : "Save changes"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingPreferences} onOpenChange={setEditingPreferences}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Search preferences</DialogTitle><DialogDescription>These details help Nyumba 360 find homes that suit you.</DialogDescription></DialogHeader>
          <form onSubmit={handlePreferenceSubmit} className="space-y-4 pt-2">
            <div className="space-y-2"><Label htmlFor="pref-location">Preferred location</Label><Input id="pref-location" placeholder="e.g. Migori" value={preferenceData.location} onChange={(event) => setPreferenceData({ ...preferenceData, location: event.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="pref-min">Minimum budget (KSh)</Label><Input id="pref-min" inputMode="numeric" placeholder="0" value={preferenceData.budgetMin} onChange={(event) => setPreferenceData({ ...preferenceData, budgetMin: event.target.value.replace(/\D/g, "") })} /></div>
              <div className="space-y-2"><Label htmlFor="pref-max">Maximum budget (KSh)</Label><Input id="pref-max" inputMode="numeric" placeholder="e.g. 25000" value={preferenceData.budgetMax} onChange={(event) => setPreferenceData({ ...preferenceData, budgetMax: event.target.value.replace(/\D/g, "") })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="pref-type">Property type</Label><select id="pref-type" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={preferenceData.propertyType} onChange={(event) => setPreferenceData({ ...preferenceData, propertyType: event.target.value })}><option value="">Any type</option><option value="house">House</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="land">Land</option><option value="commercial">Commercial</option></select></div>
              <div className="space-y-2"><Label htmlFor="pref-bedrooms">Minimum bedrooms</Label><select id="pref-bedrooms" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={preferenceData.minBedrooms} onChange={(event) => setPreferenceData({ ...preferenceData, minBedrooms: event.target.value })}>{[0, 1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count === 0 ? "Any" : `${count}+`}</option>)}</select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="pref-listing">I am looking to</Label><select id="pref-listing" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={preferenceData.listingType} onChange={(event) => setPreferenceData({ ...preferenceData, listingType: event.target.value as PreferenceForm["listingType"] })}><option value="any">Buy or rent</option><option value="sale">Buy a property</option><option value="rent">Rent a property</option></select></div>
            <Button type="submit" className="w-full gap-2" disabled={preferencesMutation.isPending}>{preferencesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{preferencesMutation.isPending ? "Saving…" : "Save preferences"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
