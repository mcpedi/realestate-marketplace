import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { Link } from "wouter";
import { AdminSearchGroup } from "@/components/AdminSearchGroup";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Building,
  MessageSquare,
  Star,
  PenTool,
  Trash2,
  Eye,
  Home as HomeIcon,
  UserPlus,
  Crown,
  Banknote,
  Sparkles,
  BadgeCheck,
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  MoreHorizontal,
  PanelLeft,
  ReceiptText,
  TrendingUp,
  Search,
  ListTodo,
  WalletCards,
} from "lucide-react";

export default function AdminDashboard() {
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
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in with an admin account</p>
            <Button onClick={() => startLogin()}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">You do not have admin privileges</p>
            <Link href="/"><Button>Go Home</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewRange, setOverviewRange] = useState<7 | 30 | 90 | 365>(7);
  const [adminSearch, setAdminSearch] = useState("");
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [testimonialData, setTestimonialData] = useState({ name: "", role: "", content: "", rating: 5, featured: false });
  const [blogData, setBlogData] = useState({ title: "", slug: "", excerpt: "", content: "", coverImage: "", published: false });
  const [categoryData, setCategoryData] = useState({ name: "", slug: "", description: "" });
  const [editPlan, setEditPlan] = useState<any>(null);

  const overview = trpc.admin.dashboardOverview.useQuery({ range: overviewRange });
  const commandCenter = trpc.admin.commandCenter.useQuery({ query: adminSearch });
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: pendingProps, refetch: refetchPending } = trpc.admin.pendingProperties.useQuery();
  const { data: allProps } = trpc.admin.allProperties.useQuery({ page: 1, limit: 20 });
  const { data: allUsers } = trpc.admin.allUsers.useQuery();
  const { data: allTestimonials } = trpc.admin.testimonials.useQuery();
  const { data: allBlogPosts } = trpc.admin.blogPosts.useQuery();
  const { data: allCategories } = trpc.admin.categories.useQuery();

  // Premium management queries
  const { data: premiumPlans } = trpc.adminPremium.plans.useQuery();
  const { data: premiumRevenue } = trpc.adminPremium.revenue.useQuery();
  const { data: premiumSubs } = trpc.adminPremium.allSubscriptions.useQuery();
  const { data: featuredListings } = trpc.adminPremium.allFeatured.useQuery();

  const updatePlanMutation = trpc.adminPremium.updatePlan.useMutation({
    onSuccess: () => { toast.success("Plan updated"); setEditPlan(null); },
    onError: () => toast.error("Failed to update plan"),
  });

  // Sync plan edit form data when a plan is selected
  const [planFormData, setPlanFormDataState] = useState({ name: "", price: 0, maxImages: 10, maxVideos: 0, active: true });
  const syncPlanFormData = (plan: any) => {
    setPlanFormDataState({
      name: plan.name,
      price: plan.price,
      maxImages: plan.maxImages,
      maxVideos: plan.maxVideos,
      active: plan.active,
    });
    setEditPlan(plan);
  };
  const setPlanFormData = setPlanFormDataState;
  const verifyUserMutation = trpc.adminPremium.verifyUser.useMutation({
    onSuccess: () => toast.success("User granted Premium subscription"),
    onError: (err) => toast.error(err.message),
  });
  const deactivateFeaturedMutation = trpc.adminPremium.deactivateFeatured.useMutation({
    onSuccess: () => toast.success("Featured listing deactivated"),
  });

  const approveMutation = trpc.admin.approveProperty.useMutation({
    onSuccess: () => { toast.success("Property approved!"); refetchPending(); },
  });
  const rejectMutation = trpc.admin.rejectProperty.useMutation({
    onSuccess: () => { toast.success("Property rejected"); refetchPending(); },
  });
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => toast.success("User deleted"),
  });
  const deletePropertyMutation = trpc.property.delete.useMutation({
    onSuccess: () => toast.success("Property deleted"),
  });
  const addTestimonialMutation = trpc.admin.addTestimonial.useMutation({
    onSuccess: () => { toast.success("Testimonial added!"); setShowTestimonialForm(false); setTestimonialData({ name: "", role: "", content: "", rating: 5, featured: false }); },
  });

  const deleteTestimonialMutation = trpc.admin.deleteTestimonial.useMutation({
    onSuccess: () => toast.success("Testimonial deleted"),
  });
  const createBlogMutation = trpc.admin.createBlogPost.useMutation({
    onSuccess: () => { toast.success("Blog post created!"); setShowBlogForm(false); setBlogData({ title: "", slug: "", excerpt: "", content: "", coverImage: "", published: false }); },
  });
  const deleteBlogMutation = trpc.admin.deleteBlogPost.useMutation({
    onSuccess: () => toast.success("Blog post deleted"),
  });
  const createCategoryMutation = trpc.admin.createCategory.useMutation({
    onSuccess: () => { toast.success("Category created!"); setShowCategoryForm(false); setCategoryData({ name: "", slug: "", description: "" }); },
  });
  const deleteCategoryMutation = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => toast.success("Category deleted"),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden" aria-label="Administrator navigation"><PanelLeft className="h-5 w-5" /></button><Link href="/admin" className="flex min-w-0 items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm"><Shield className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-sm font-extrabold tracking-[-0.03em] text-slate-950">Nyumba 360</p><p className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 sm:block">Admin console</p></div></Link></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="rounded-xl text-slate-600" aria-label="Platform alerts"><Bell className="h-5 w-5" /></Button><Link href="/admin/modules" className="hidden rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 sm:block">Module controls</Link><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-xs font-extrabold text-white" title={user?.name ?? "Administrator"}>{user?.name?.slice(0, 1).toUpperCase() ?? "A"}</div></div></div>
      </header>

      <main className="flex-1 bg-slate-50 pb-24 md:pb-10">
        <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_78%_0,_#d9f99d_0,_transparent_30%),linear-gradient(120deg,_#062b2c,_#075b42_52%,_#0f766e)] text-white">
          <div className="container py-7 md:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-emerald-100"><Shield className="h-3.5 w-3.5" /> Nyumba 360 control centre</div><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.045em] md:text-5xl">Welcome back, Admin.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/80 md:text-base">Here is a live view of listings, users, moderation, subscriptions, and platform activity.</p></div>
              <Select value={String(overviewRange)} onValueChange={(value) => setOverviewRange(Number(value) as 7 | 30 | 90 | 365)}><SelectTrigger className="h-11 w-40 rounded-xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/15"><CalendarDays className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 3 months</SelectItem><SelectItem value="365">Last 12 months</SelectItem></SelectContent></Select>
            </div>
          </div>
        </section>

          <div className="container py-6 md:py-8">
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Global admin discovery</p>
                  <h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">Find platform records quickly</h2>
                  <p className="mt-1 text-sm text-slate-500">Search existing properties, user accounts, and recorded payments. Results are grouped and access-controlled.</p>
                </div>
                <div className="relative w-full md:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Search administrator records" value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} placeholder="Search property, user, payment reference…" className="h-11 rounded-xl border-slate-200 pl-10" /></div>
              </div>
              {adminSearch.trim().length >= 2 && <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <AdminSearchGroup title="Properties" empty="No matching properties" items={commandCenter.data?.search.properties ?? []} renderItem={(item) => <Link href={`/property/${item.id}`} className="block rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-emerald-200 hover:bg-emerald-50/60"><p className="truncate text-sm font-bold text-slate-900">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.location} · <span className="capitalize">{item.status}</span></p></Link>} />
                <AdminSearchGroup title="Users" empty="No matching users" items={commandCenter.data?.search.users ?? []} renderItem={(item) => <button type="button" onClick={() => setActiveTab("users")} className="block w-full rounded-xl border border-slate-100 px-3 py-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/60"><p className="truncate text-sm font-bold text-slate-900">{item.name || "Unnamed account"}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.email || "No email"} · {item.role}</p></button>} />
                <AdminSearchGroup title="Payments" empty="No matching payments" items={commandCenter.data?.search.payments ?? []} renderItem={(item) => <button type="button" onClick={() => setActiveTab("premium")} className="block w-full rounded-xl border border-slate-100 px-3 py-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/60"><p className="truncate text-sm font-bold text-slate-900">KSh {Number(item.amount).toLocaleString()} · <span className="capitalize">{item.status}</span></p><p className="mt-0.5 truncate font-mono text-xs text-slate-500">{item.reference || `Payment #${item.id}`}</p></button>} />
              </div>}
            </section>

            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Operations queue</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">Priority administrative tasks</h2></div><ListTodo className="h-5 w-5 text-emerald-600" /></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">{commandCenter.data?.tasks.map((task) => {
                const targetTab = task.id === "listing-review" ? "pending" : task.id === "pending-payments" ? "premium" : "overview";
                const Icon = task.id === "pending-payments" ? WalletCards : task.id === "upcoming-viewings" ? CalendarDays : ClipboardCheck;
                const tone = task.tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : task.tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-950" : "border-emerald-200 bg-emerald-50 text-emerald-950";
                return <button key={task.id} type="button" onClick={() => setActiveTab(targetTab)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${tone}`}><div className="flex items-start justify-between gap-3"><Icon className="h-5 w-5" /><span className="rounded-full bg-white/80 px-2.5 py-1 text-lg font-extrabold tabular-nums">{task.count}</span></div><p className="mt-5 text-sm font-bold">{task.label}</p><p className="mt-1 text-xs opacity-75">Open its existing control surface</p></button>;
              })}</div>
            </section>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="hidden h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm md:flex">
              <TabsTrigger value="overview" className="gap-1.5 rounded-xl px-4"><LayoutDashboard className="h-4 w-4" /> Overview</TabsTrigger>
              <TabsTrigger value="pending" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pending ({pendingProps?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="premium" className="gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Premium
              </TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <OverviewMetric icon={Building} label="Total properties" value={overview.data?.stats.totalProperties ?? stats?.totalProperties ?? 0} tone="emerald" change={overview.data?.changes.properties} />
                <OverviewMetric icon={CheckCircle} label="Active listings" value={overview.data?.stats.approvedProperties ?? stats?.approvedProperties ?? 0} tone="blue" />
                <OverviewMetric icon={Users} label="Total users" value={overview.data?.stats.totalUsers ?? stats?.totalUsers ?? 0} tone="violet" change={overview.data?.changes.users} />
                <OverviewMetric icon={ClipboardCheck} label="Pending review" value={overview.data?.stats.pendingProperties ?? stats?.pendingProperties ?? 0} tone="amber" />
                <OverviewMetric icon={Crown} label="Active premium" value={overview.data?.stats.activeSubscriptions ?? 0} tone="rose" />
                <OverviewMetric icon={Banknote} label="Subscription revenue" value={`KSh ${Math.round(overview.data?.stats.recordedSubscriptionRevenue ?? 0).toLocaleString()}`} tone="gold" caption="Recorded completed payments" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.85fr)]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Platform overview</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">New properties and users</h2><p className="mt-1 text-sm text-slate-500">Actual registrations and listing submissions in the selected period.</p></div><span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{overviewRange} days</span></div><div className="mt-5 h-72">{overview.isLoading ? <OverviewLoading /> : overview.data?.series.some((point) => point.properties || point.users) ? <ResponsiveContainer width="100%" height="100%"><LineChart data={overview.data.series} margin={{ top: 10, right: 6, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" tickFormatter={(date) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" })} tickLine={false} axisLine={false} fontSize={11} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} /><Tooltip labelFormatter={(date) => new Date(`${date}T00:00:00Z`).toLocaleDateString()} contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }} /><Line type="monotone" dataKey="properties" name="Properties" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="users" name="Users" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer> : <OverviewEmpty icon={Activity} title="No activity in this period" description="New property submissions and user registrations will appear here when they occur." />}</div></section>
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Recent activity</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">Operational timeline</h2></div><Activity className="h-5 w-5 text-emerald-600" /></div><div className="mt-5 space-y-4">{overview.isLoading ? <OverviewLoading /> : overview.data?.recentActivity.length ? overview.data.recentActivity.map((activity) => <div key={activity.id} className="flex gap-3"><div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Activity className="h-4 w-4" /></div><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{formatAdminActivity(activity.action, activity.resourceType)}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p></div></div>) : <OverviewEmpty icon={Activity} title="No recent admin events" description="Reviewed and audited platform activity will appear here." />}</div></section>
              </div>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Latest inventory</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">Recent properties</h2></div><Button variant="ghost" className="rounded-xl font-bold text-emerald-700" onClick={() => setActiveTab("properties")}>View all <ArrowUpRight className="ml-1.5 h-4 w-4" /></Button></div><div className="mt-5 grid gap-3">{overview.isLoading ? <OverviewLoading /> : overview.data?.recentProperties.length ? overview.data.recentProperties.map((property) => <Link key={property.id} href={`/property/${property.id}`} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">{property.imageUrl ? <img src={property.imageUrl} alt="" className="h-full w-full object-cover" /> : <Building className="m-5 h-6 w-6 text-slate-300" />}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{property.title}</p><p className="mt-1 truncate text-xs text-slate-500">{property.location}</p><p className="mt-1 text-sm font-extrabold text-emerald-700">KSh {property.price.toLocaleString()}</p></div><Badge variant={property.status === "approved" ? "default" : property.status === "pending" ? "outline" : "destructive"} className="shrink-0 capitalize">{property.status}</Badge></Link>) : <OverviewEmpty icon={Building} title="No properties yet" description="New listings will appear here after they are submitted." />}</div></section>
            </TabsContent>

            {/* Pending Approvals */}
            <TabsContent value="pending">
              <div className="space-y-4">
                {!pendingProps || pendingProps.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p className="text-muted-foreground">No pending properties for review</p>
                  </div>
                ) : (
                  pendingProps.map((prop: any) => (
                    <div key={prop.id} className="bg-white rounded-xl border border-border/50 p-5">
                      <div className="flex flex-col md:flex-row gap-4">
                        {prop.photos && prop.photos.length > 0 && (
                          <img src={prop.photos[0].url} alt={prop.title} className="w-full md:w-32 h-24 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{prop.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{prop.location}</p>
                          <p className="text-sm text-muted-foreground mt-1">By: {prop.seller?.name || "Unknown"}</p>
                          <p className="text-sm font-semibold text-[oklch(0.45_0.18_260)] mt-1">Ksh {prop.price.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{prop.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate(prop.id)}>
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:border-red-400" onClick={() => rejectMutation.mutate(prop.id)}>
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* All Properties */}
            <TabsContent value="properties">
              <div className="space-y-4">
                {allProps?.items.map((p: any) => (
                  <div key={p.id} className="bg-white rounded-xl border border-border/50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium text-sm">{p.title}</h4>
                        <p className="text-xs text-muted-foreground">{p.location} • {p.bedrooms}BR • {p.bathrooms}BA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={p.status === "approved" ? "default" : p.status === "pending" ? "outline" : "destructive"}>
                        {p.status}
                      </Badge>
                      <Link href={`/property/${p.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users">
              <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Joined</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers?.map((u: any) => (
                      <tr key={u.id} className="border-b border-border/50 last:border-0">
                        <td className="p-4">{u.name || "N/A"}</td>
                        <td className="p-4">{u.email || "N/A"}</td>
                        <td className="p-4"><Badge variant={u.role === "admin" ? "default" : "outline"}>{u.role}</Badge></td>
                        <td className="p-4 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          {u.role !== "admin" && (
                            <div className="inline-flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-[oklch(0.72_0.15_80)]"
                                onClick={() => verifyUserMutation.mutate(u.id)}
                                title="Grant 12-month Premium subscription"
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteUserMutation.mutate(u.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Premium Management */}
            <TabsContent value="premium">
              <div className="space-y-6">
                {/* Revenue */}
                <div className="rounded-xl border border-[oklch(0.72_0.15_80)]/40 bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.4_0.16_280)] text-white p-5 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[oklch(0.8_0.15_80)]" />
                    <span className="font-semibold">Subscription Revenue</span>
                  </div>
                  <div className="text-3xl font-bold">Ksh {(premiumRevenue?.total ?? 0).toLocaleString()}</div>
                  <div className="text-blue-100">{(premiumRevenue?.count ?? 0)} payments</div>
                  <div className="ml-auto text-blue-100 text-sm">{premiumSubs?.filter((s: any) => s.status === "active").length ?? 0} active subscriptions</div>
                </div>

                {/* Plans */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[oklch(0.72_0.15_80)]" /> Subscription Plans
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {premiumPlans?.map((plan: any) => (
                      <div key={plan.id} className="bg-white rounded-xl border border-border/50 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{plan.name}</h4>
                            <p className="text-sm text-muted-foreground">Ksh {plan.price.toLocaleString()} / {plan.period}</p>
                          </div>
                          <Badge variant={plan.active ? "default" : "destructive"}>{plan.active ? "Active" : "Inactive"}</Badge>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground space-y-1">
                          <div>{plan.maxImages} photos max</div>
                          <div>{plan.maxVideos} videos max</div>
                          <div>Featured listings: {plan.featuredListings}</div>
                          <div>Analytics: {plan.analytics ? "Yes" : "No"} • AI: {plan.aiTools ? "Yes" : "No"} • Verified badge: {plan.verifiedBadge ? "Yes" : "No"}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full gap-1"
                          onClick={() => syncPlanFormData(plan)}
                        >
                          <PenTool className="w-3.5 h-3.5" /> Edit Plan
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured Listings */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[oklch(0.72_0.15_80)]" /> Active Featured Listings
                  </h3>
                  {!featuredListings || featuredListings.length === 0 ? (
                    <div className="bg-white rounded-xl border border-border/50 p-6 text-center text-sm text-muted-foreground">
                      No active featured listings
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {featuredListings.map((l: any) => (
                        <div key={l.id} className="bg-white rounded-xl border border-[oklch(0.72_0.15_80)]/40 p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-sm">{l.propertyTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              Featured until {new Date(l.featuredUntil).toLocaleDateString()} • {l.paymentMethod}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-red-600"
                            onClick={() => deactivateFeaturedMutation.mutate(l.id)}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Deactivate
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subscriptions */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-[oklch(0.72_0.15_80)]" /> Subscriptions
                  </h3>
                  <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left p-4 font-medium">User</th>
                          <th className="text-left p-4 font-medium">Plan</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Ends</th>
                          <th className="text-left p-4 font-medium">Auto-renew</th>
                        </tr>
                      </thead>
                      <tbody>
                        {premiumSubs && premiumSubs.length > 0 ? (
                          premiumSubs.map((s: any) => (
                            <tr key={s.id} className="border-b border-border/50 last:border-0">
                              <td className="p-4">User #{s.userId}</td>
                              <td className="p-4">{s.plan?.name || `Plan #${s.planId}`}</td>
                              <td className="p-4"><Badge variant={s.status === "active" ? "default" : s.status === "cancelled" ? "outline" : "destructive"}>{s.status}</Badge></td>
                              <td className="p-4 text-muted-foreground">{s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}</td>
                              <td className="p-4 text-muted-foreground">{s.autoRenew ? "Yes" : "No"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No subscriptions yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Plan Edit Dialog */}
            <Dialog open={!!editPlan} onOpenChange={(open) => { if (!open) setEditPlan(null); }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Plan: {editPlan?.name}</DialogTitle></DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editPlan) return;
                    updatePlanMutation.mutate({
                      id: editPlan.id,
                      name: planFormData.name,
                      price: Number(planFormData.price),
                      maxImages: Number(planFormData.maxImages),
                      maxVideos: Number(planFormData.maxVideos),
                      active: planFormData.active,
                    });
                  }}
                  className="space-y-3"
                >
                  <Input
                    placeholder="Plan name"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Price (KES)"
                      value={planFormData.price}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="Max photos"
                      value={planFormData.maxImages}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxImages: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Max videos"
                      value={planFormData.maxVideos}
                      onChange={(e) => setPlanFormData({ ...planFormData, maxVideos: Number(e.target.value) })}
                    />
                    <label className="flex items-center gap-2 text-sm border rounded-md px-3">
                      <input
                        type="checkbox"
                        checked={planFormData.active}
                        onChange={(e) => setPlanFormData({ ...planFormData, active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      Active
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={updatePlanMutation.isPending}>Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Testimonials */}
            <TabsContent value="testimonials">
              <div className="flex justify-end mb-4">
                <Dialog open={showTestimonialForm} onOpenChange={setShowTestimonialForm}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><UserPlus className="w-4 h-4" /> Add Testimonial</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Testimonial</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); addTestimonialMutation.mutate(testimonialData); }} className="space-y-3">
                      <Input placeholder="Name *" required value={testimonialData.name} onChange={(e) => setTestimonialData({ ...testimonialData, name: e.target.value })} />
                      <Input placeholder="Role (e.g. Buyer, Agent)" value={testimonialData.role} onChange={(e) => setTestimonialData({ ...testimonialData, role: e.target.value })} />
                      <Textarea placeholder="Testimonial content *" required rows={4} value={testimonialData.content} onChange={(e) => setTestimonialData({ ...testimonialData, content: e.target.value })} />
                      <Select value={String(testimonialData.rating)} onValueChange={(v) => setTestimonialData({ ...testimonialData, rating: Number(v) })}>
                        <SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} Stars</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="submit" className="w-full" disabled={addTestimonialMutation.isPending}>Add Testimonial</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {allTestimonials?.map((t: any) => (
                  <div key={t.id} className="bg-white rounded-xl border border-border/50 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{t.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500 text-sm">{"★".repeat(t.rating)}</span>
                        {t.featured && <Badge className="bg-yellow-500 text-xs">Featured</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteTestimonialMutation.mutate(t.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Blog */}
            <TabsContent value="blog">
              <div className="flex justify-end mb-4">
                <Dialog open={showBlogForm} onOpenChange={setShowBlogForm}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><PenTool className="w-4 h-4" /> New Post</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>New Blog Post</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createBlogMutation.mutate(blogData); }} className="space-y-3">
                      <Input placeholder="Title *" required value={blogData.title} onChange={(e) => setBlogData({ ...blogData, title: e.target.value, slug: blogData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} />
                      <Input placeholder="Slug (auto-generated)" value={blogData.slug} onChange={(e) => setBlogData({ ...blogData, slug: e.target.value })} />
                      <Input placeholder="Excerpt" value={blogData.excerpt || ""} onChange={(e) => setBlogData({ ...blogData, excerpt: e.target.value })} />
                      <Input placeholder="Cover Image URL" value={blogData.coverImage || ""} onChange={(e) => setBlogData({ ...blogData, coverImage: e.target.value })} />
                      <Textarea placeholder="Content *" required rows={6} value={blogData.content} onChange={(e) => setBlogData({ ...blogData, content: e.target.value })} />
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Published</label>
                        <input type="checkbox" checked={blogData.published} onChange={(e) => setBlogData({ ...blogData, published: e.target.checked })} className="w-4 h-4" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createBlogMutation.isPending}>Create Post</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {allBlogPosts?.map((b: any) => (
                  <div key={b.id} className="bg-white rounded-xl border border-border/50 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{b.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={b.published ? "default" : "outline"}>{b.published ? "Published" : "Draft"}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/blog/${b.slug}`}>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteBlogMutation.mutate(b.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Categories */}
            <TabsContent value="categories">
              <div className="flex justify-end mb-4">
                <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">Add Category</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createCategoryMutation.mutate(categoryData); }} className="space-y-3">
                      <Input placeholder="Name *" required value={categoryData.name} onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} />
                      <Input placeholder="Slug" value={categoryData.slug} onChange={(e) => setCategoryData({ ...categoryData, slug: e.target.value })} />
                      <Textarea placeholder="Description" value={categoryData.description || ""} onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })} />
                      <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>Create Category</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {allCategories?.map((c: any) => (
                  <div key={c.id} className="bg-white rounded-xl border border-border/50 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{c.name}</h4>
                      <p className="text-xs text-muted-foreground">/{c.slug}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteCategoryMutation.mutate(c.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <nav aria-label="Administrator dashboard sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">{[
          { value: "overview", label: "Dashboard", icon: LayoutDashboard },
          { value: "properties", label: "Listings", icon: Building },
          { value: "pending", label: "Reviews", icon: ClipboardCheck },
          { value: "users", label: "Users", icon: Users },
          { value: "premium", label: "More", icon: MoreHorizontal },
        ].map((item) => { const Icon = item.icon; const active = activeTab === item.value; return <button key={item.value} onClick={() => setActiveTab(item.value)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500"}`}><Icon className="h-5 w-5" /><span>{item.label}</span></button>; })}</div>
      </nav>

    </div>
  );
}

function OverviewMetric({ icon: Icon, label, value, tone, change, caption }: { icon: any; label: string; value: number | string; tone: "emerald" | "blue" | "violet" | "amber" | "rose" | "gold"; change?: number | null; caption?: string }) {
  const tones = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", gold: "bg-yellow-50 text-yellow-700" };
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div>{typeof change === "number" ? <span className={`inline-flex items-center gap-1 text-xs font-bold ${change >= 0 ? "text-emerald-700" : "text-rose-600"}`}><TrendingUp className={`h-3.5 w-3.5 ${change < 0 ? "rotate-180" : ""}`} />{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span> : null}</div><p className="mt-4 text-2xl font-extrabold tracking-[-0.04em] text-slate-900">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>{caption ? <p className="mt-2 text-[10px] leading-4 text-slate-400">{caption}</p> : <p className="mt-2 text-[10px] leading-4 text-slate-400">{typeof change === "number" ? "vs previous period" : "Live platform total"}</p>}</article>;
}

function OverviewLoading() {
  return <div className="grid h-full min-h-28 place-items-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" /></div>;
}

function OverviewEmpty({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return <div className="grid h-full min-h-28 place-items-center rounded-2xl border border-dashed border-slate-200 px-6 text-center"><div><Icon className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>;
}

function formatAdminActivity(action: string, resourceType: string) {
  const readableAction = action.replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const readableType = resourceType.replace(/[._]/g, " ");
  return `${readableAction} · ${readableType}`;
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-border/50 p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
