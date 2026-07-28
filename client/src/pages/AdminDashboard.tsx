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
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [testimonialData, setTestimonialData] = useState({ name: "", role: "", content: "", rating: 5, featured: false });
  const [blogData, setBlogData] = useState({ title: "", slug: "", excerpt: "", content: "", coverImage: "", published: false });
  const [categoryData, setCategoryData] = useState({ name: "", slug: "", description: "" });

  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: pendingProps, refetch: refetchPending } = trpc.admin.pendingProperties.useQuery();
  const { data: allProps } = trpc.admin.allProperties.useQuery({ page: 1, limit: 20 });
  const { data: allUsers } = trpc.admin.allUsers.useQuery();
  const { data: allTestimonials } = trpc.admin.testimonials.useQuery();
  const { data: allBlogPosts } = trpc.admin.blogPosts.useQuery();
  const { data: allCategories } = trpc.admin.categories.useQuery();

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
      <Navbar />

      <section className="bg-secondary/30 border-b border-border/50">
        <div className="container py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            <Shield className="w-7 h-7 text-[oklch(0.45_0.18_260)]" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage content, listings, and users</p>
        </div>
      </section>

      <section className="flex-1">
        <div className="container py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Building} label="Total Properties" value={stats?.totalProperties || 0} color="text-blue-600" />
            <StatCard icon={Clock} label="Pending Review" value={stats?.pendingProperties || 0} color="text-yellow-600" />
            <StatCard icon={CheckCircle} label="Approved" value={stats?.approvedProperties || 0} color="text-green-600" />
            <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="text-purple-600" />
            <StatCard icon={MessageSquare} label="Inquiries" value={stats?.totalInquiries || 0} color="text-orange-600" />
            <StatCard icon={Star} label="Testimonials" value={stats?.totalTestimonials || 0} color="text-pink-600" />
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="pending" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pending ({pendingProps?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

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
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteUserMutation.mutate(u.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

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
      </section>

      <Footer />
    </div>
  );
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
