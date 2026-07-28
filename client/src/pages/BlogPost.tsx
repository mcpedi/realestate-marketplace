import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Clock, User, PenTool } from "lucide-react";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = trpc.blog.bySlug.useQuery(slug || "", {
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container py-12">
          <div className="animate-pulse space-y-6 max-w-3xl mx-auto">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container py-16 text-center">
          <PenTool className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h2 className="text-2xl font-bold mb-2">Article Not Found</h2>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link href="/blog"><button className="px-4 py-2 bg-[oklch(0.45_0.18_260)] text-white rounded-lg">Back to Blog</button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <article className="flex-1">
        <div className="container py-8 md:py-12">
          <div className="max-w-3xl mx-auto">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {"category" in post && (post as any).category && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[oklch(0.45_0.18_260/0.08)] text-[oklch(0.45_0.18_260)] mb-4">
                {(post as any).category.name}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {"author" in post ? (post as any).author?.name : "Admin"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>

            {post.coverImage && (
              <div className="aspect-[16/9] rounded-xl overflow-hidden mb-8">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6 font-medium">{post.excerpt}</p>
            )}

            <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>

            <div className="border-t border-border/50 mt-12 pt-8">
              <Link href="/blog">
                <button className="text-[oklch(0.45_0.18_260)] font-medium hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to all articles
                </button>
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
