import { Link } from "wouter";
import { Home, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const SITE_NAME = "Pedi wa Real Estate";

export function Footer() {
  return (
    <footer className="bg-[oklch(0.18_0.02_260)] text-[oklch(0.85_0.01_260)]">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                {SITE_NAME}
              </span>
            </div>
            <p className="text-sm leading-relaxed opacity-80 mb-4">
              Your trusted partner in finding the perfect property. We connect buyers, sellers, and agents in a seamless marketplace experience.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/properties" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Browse Properties</Link></li>
              <li><Link href="/seller" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">List Your Property</Link></li>
              <li><Link href="/about" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="font-semibold text-white mb-4">Property Types</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/properties?propertyType=house" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Houses</Link></li>
              <li><Link href="/properties?propertyType=apartment" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Apartments</Link></li>
              <li><Link href="/properties?propertyType=villa" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Villas</Link></li>
              <li><Link href="/properties?propertyType=commercial" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Commercial</Link></li>
              <li><Link href="/properties?propertyType=land" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Land</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[oklch(0.72_0.15_80)]" />
                <span>123 Property Lane, Business District</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[oklch(0.72_0.15_80)]" />
                <span>0716339552</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[oklch(0.72_0.15_80)]" />
                <span>pediwarealestate@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-70">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[oklch(0.72_0.15_80)] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
