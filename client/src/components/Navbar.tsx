import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Search,
  PlusCircle,
  Shield,
  Heart,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  FileText,
  Phone,
  HelpCircle,
  MessageCircle,
  PenTool,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const SITE_NAME = "Pedi wa Real Estate";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/properties", label: "Properties", icon: Search },
  { href: "/about", label: "About", icon: FileText },
  { href: "/blog", label: "Blog", icon: PenTool },
  { href: "/testimonials", label: "Testimonials", icon: MessageCircle },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Phone },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage =
    location === "/seller" ||
    location === "/admin" ||
    location === "/favorites" ||
    location.startsWith("/seller/") ||
    location.startsWith("/admin/");

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>
              {SITE_NAME}
            </span>
            <span className="font-bold text-lg tracking-tight text-foreground sm:hidden" style={{ fontFamily: "'Playfair Display', serif" }}>
              PWRE
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === link.href
                      ? "text-[oklch(0.45_0.18_260)] bg-[oklch(0.45_0.18_260/0.08)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user?.name || "Account"}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/seller" className="flex items-center gap-2 w-full">
                      <PlusCircle className="w-4 h-4" />
                      Seller Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="flex items-center gap-2 w-full">
                      <Heart className="w-4 h-4" />
                      My Favorites
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 w-full">
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => startLogin()}>
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Toggle */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] flex items-center justify-center">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  {SITE_NAME}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}>
                      <span
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                          location === link.href
                            ? "text-[oklch(0.45_0.18_260)] bg-[oklch(0.45_0.18_260/0.08)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
                <div className="border-t mt-4 pt-4 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      <Link href="/seller">
                        <span onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                          <PlusCircle className="w-4 h-4" />
                          Seller Dashboard
                        </span>
                      </Link>
                      <Link href="/favorites">
                        <span onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                          <Heart className="w-4 h-4" />
                          My Favorites
                        </span>
                      </Link>
                      {user?.role === "admin" && (
                        <Link href="/admin">
                          <span onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                            <Shield className="w-4 h-4" />
                            Admin Dashboard
                          </span>
                        </Link>
                      )}
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => { startLogin(); setMobileOpen(false); }}>
                      Sign In
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
