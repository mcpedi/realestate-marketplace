import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Target,
  Eye,
  Users,
  Shield,
  Award,
  Heart,
  Home,
  Building,
} from "lucide-react";

const SITE_NAME = "Pedi wa Real Estate";

const team = [
  { name: "Peter Wambua", role: "Founder & CEO", bio: "Over 15 years of experience in real estate development and property management." },
  { name: "Sarah Mwangi", role: "Head of Operations", bio: "Expert in streamlining property transactions and client relationships." },
  { name: "James Ochieng", role: "Technology Lead", bio: "Building the digital infrastructure that powers modern real estate." },
  { name: "Grace Njeri", role: "Marketing Director", bio: "Connecting properties with the right buyers through strategic marketing." },
];

const values = [
  { icon: Shield, title: "Trust & Transparency", description: "Every listing is verified and every transaction is transparent." },
  { icon: Users, title: "Client-First Approach", description: "We prioritize the needs and satisfaction of our clients above all." },
  { icon: Award, title: "Quality Standards", description: "We maintain the highest standards in property listings and services." },
  { icon: Heart, title: "Community Focus", description: "We build lasting relationships within the communities we serve." },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.35_0.18_260)] text-white py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              About {SITE_NAME}
            </h1>
            <p className="text-lg opacity-90 leading-relaxed">
              We are a modern real estate marketplace connecting property owners, agents, and buyers in a seamless digital experience. Our mission is to make property transactions accessible, transparent, and efficient for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-border/50 p-8 shadow-sm">
              <Target className="w-10 h-10 text-[oklch(0.45_0.18_260)] mb-4" />
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To democratize real estate by providing a trusted platform where property owners can list their properties, buyers can discover their dream homes, and agents can grow their businesses — all in one place.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border/50 p-8 shadow-sm">
              <Eye className="w-10 h-10 text-[oklch(0.72_0.15_80)] mb-4" />
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become the leading real estate marketplace in East Africa, empowering millions of people to find their perfect property through technology, trust, and exceptional service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-xl border border-border/50 p-6 text-center hover:shadow-md transition-shadow">
                <v.icon className="w-10 h-10 text-[oklch(0.45_0.18_260)] mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>
            Our Leadership Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-xl border border-border/50 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-[oklch(0.45_0.18_260)] mb-2">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.35_0.18_260)] text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <Building className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold">2,500+</div>
              <div className="text-sm opacity-80">Properties Listed</div>
            </div>
            <div>
              <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold">5,000+</div>
              <div className="text-sm opacity-80">Happy Clients</div>
            </div>
            <div>
              <Home className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold">15+</div>
              <div className="text-sm opacity-80">Cities Served</div>
            </div>
            <div>
              <Award className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm opacity-80">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
