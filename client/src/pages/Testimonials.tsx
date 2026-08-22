import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Star, Quote, Users } from "lucide-react";

export default function Testimonials() {
  const { data: testimonials, isLoading } = trpc.testimonial.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.35_0.18_260)] text-white py-16 md:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Quote className="w-8 h-8" />
              <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                What Our Clients Say
              </h1>
            </div>
            <p className="text-lg opacity-90">
              Hear from property owners, buyers, and agents who trust Nyumba 360.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border/50 p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : testimonials && testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4 italic">"{t.content}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Quote className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">No Testimonials Yet</h3>
              <p className="text-muted-foreground">Be the first to share your experience with us!</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
