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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { consumePostAuthSellerPath, sellerDashboardHref } from "@/lib/sellerListing";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Crown,
  FileText,
  Fingerprint,
  FolderLock,
  GitCompareArrows,
  Heart,
  Home,
  Languages,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Moon,
  PenTool,
  Calculator,
  Plus,
  PlusCircle,
  Search,
  Shield,
  Sparkles,
  Sun,
  Target,
  User,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const SITE_NAME = "Nyumba 360";

const desktopLinks = (t: (key: any) => string) => [
  { href: "/", label: t("nav.home") }, { href: "/properties", label: t("nav.explore") }, { href: "/map", label: t("nav.map") }, { href: "/assistant", label: t("nav.assistant") },
];

const menuLinks = (t: (key: any) => string) => [
  { href: "/properties", label: t("nav.browse"), icon: Search }, { href: "/map", label: t("nav.mapDiscovery"), icon: MapIcon }, { href: "/assistant", label: t("nav.assistant"), icon: Sparkles }, { href: "/planning", label: t("nav.planning"), icon: Calculator }, { href: "/operations", label: t("nav.operations"), icon: FolderLock }, { href: "/agent-operations", label: t("nav.agentOperations"), icon: Target }, { href: "/property-identity", label: t("nav.propertyIds"), icon: Fingerprint }, { href: "/discover", label: t("nav.swipe"), icon: Sparkles }, { href: "/compare", label: t("nav.compare"), icon: GitCompareArrows }, { href: "/alerts", label: t("nav.alerts"), icon: Bell }, { href: "/bookings", label: t("nav.viewings"), icon: CalendarDays }, { href: "/about", label: t("nav.about"), icon: FileText }, { href: "/blog", label: t("nav.guides"), icon: PenTool },
];

const bottomTabs = (t: (key: any) => string) => [
  { href: "/", label: t("nav.home"), icon: Home }, { href: "/properties", label: t("nav.explore"), icon: Search }, { href: sellerDashboardHref(true), label: t("nav.addProperty"), icon: Plus, elevated: true }, { href: "/favorites", label: t("nav.saved"), icon: Heart }, { href: "/profile", label: t("nav.profile"), icon: User },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: accountActivity } = trpc.modern.accountActivitySummary.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const { data: notifications = [] } = trpc.modern.notificationsList.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const markNotificationRead = trpc.modern.notificationMarkRead.useMutation({
    onSuccess: () => {
      utils.modern.accountActivitySummary.invalidate();
      utils.modern.notificationsList.invalidate();
    },
  });
  const newLeadCount = accountActivity?.newLeadCount ?? 0;
  const unreadNotificationCount = accountActivity?.unreadNotificationCount ?? 0;
  const formatBadgeCount = (value: number) => (value > 9 ? "9+" : String(value));

  useEffect(() => {
    if (!isAuthenticated) return;
    const postAuthSellerPath = consumePostAuthSellerPath(window.sessionStorage);
    if (postAuthSellerPath) setLocation(postAuthSellerPath);
  }, [isAuthenticated, setLocation]);

  const themeButton = switchable ? (
    <button
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      onClick={toggleTheme}
      className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  ) : null;

  const isActive = (href: string) => href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);
  const localizedDesktopLinks = desktopLinks(t);
  const localizedMenuLinks = menuLinks(t);
  const localizedBottomTabs = bottomTabs(t);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="container flex h-[68px] items-center justify-between md:h-[74px]">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open navigation menu" className="grid h-10 w-10 place-items-center rounded-xl text-slate-800 transition-colors hover:bg-slate-100 lg:hidden">
                  {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(22rem,90vw)] border-r-slate-100 bg-white p-0">
                <SheetHeader className="border-b border-slate-100 px-5 py-5 text-left">
                  <SheetTitle className="flex items-center gap-3 text-left">
                    <BrandMark size="sm" />
                    <span className="block text-base font-extrabold text-slate-900">Nyumba 360</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="space-y-1 px-3 py-4">
                  {localizedMenuLinks.map(({ href, label, icon: Icon }) => (
                    <Link href={href} key={href} onClick={() => setMobileOpen(false)}>
                      <span className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors", isActive(href) ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                        <Icon className="h-4.5 w-4.5" /> {label}
                      </span>
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-slate-100 px-4 py-4">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link href="/profile" onClick={() => setMobileOpen(false)}><span className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><User className="h-4.5 w-4.5" /> My Profile</span></Link>
                      <Link href="/seller" onClick={() => setMobileOpen(false)}><span className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><PlusCircle className="h-4.5 w-4.5" /> Seller Dashboard</span></Link>
                      {user?.role === "admin" && <Link href="/admin" onClick={() => setMobileOpen(false)}><span className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Shield className="h-4.5 w-4.5" /> Admin Dashboard</span></Link>}
                      <Button variant="outline" className="mt-2 w-full" onClick={logout}>Sign out</Button>
                    </div>
                  ) : <Button className="w-full bg-emerald-600 font-bold hover:bg-emerald-500" onClick={() => { startLogin(); setMobileOpen(false); }}>Sign in to your account</Button>}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-xs font-semibold text-slate-600">{t("language.label")}</span><button aria-label="Switch language" onClick={() => setLanguage(language === "en" ? "sw" : "en")} className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-emerald-700 shadow-sm">{language === "en" ? "EN" : "SW"}</button></div>
                  {switchable && <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-xs font-semibold text-slate-600">Appearance</span>{themeButton}</div>}
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2.5" aria-label="Nyumba 360 home">
              <BrandMark />
              <span className="text-[1.15rem] font-extrabold tracking-[-0.04em] text-slate-900">Nyumba 360</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {localizedDesktopLinks.map(({ href, label }) => <Link href={href} key={href}><span className={cn("rounded-lg px-3 py-2 text-sm font-semibold transition-colors", isActive(href) ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}>{label}</span></Link>)}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-3">
            <Link href={isAuthenticated ? "/leads" : "/contact"} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100" aria-label={newLeadCount ? `${newLeadCount} new buyer inquiries` : "Messages and leads"}>
              <MessageSquare className="h-5 w-5" />
              {newLeadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">{formatBadgeCount(newLeadCount)}</span>}
            </Link>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100" aria-label={unreadNotificationCount ? `${unreadNotificationCount} unread notifications` : "Notifications"}>
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">{formatBadgeCount(unreadNotificationCount)}</span>}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-xl p-1.5">
                  <div className="px-2 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="px-2 py-5 text-center text-sm text-slate-500">You are all caught up.</div>
                  ) : notifications.slice(0, 6).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn("flex cursor-pointer flex-col items-start gap-1 rounded-lg px-2.5 py-2.5 whitespace-normal", !notification.readAt && "bg-emerald-50/70")}
                      onSelect={() => {
                        if (!notification.readAt) markNotificationRead.mutate({ id: notification.id });
                        if (notification.href) setLocation(notification.href);
                      }}
                    >
                      <span className="text-sm font-bold text-slate-800">{notification.title}</span>
                      <span className="line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem asChild><Link href="/alerts" className="cursor-pointer justify-center font-bold text-emerald-700">Manage property alerts</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/alerts" className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100" aria-label="Property alerts"><Bell className="h-5 w-5" /></Link>
            )}
            <div className="hidden lg:block">{themeButton}</div>
            <button aria-label="Switch language" onClick={() => setLanguage(language === "en" ? "sw" : "en")} className="hidden h-9 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50 lg:flex"><Languages className="h-3.5 w-3.5" />{language === "en" ? "EN" : "SW"}</button>
            <div className="hidden lg:block">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200 px-3 font-semibold"><User className="mr-2 h-4 w-4" />{user?.name || "Account"}<ChevronDown className="ml-2 h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" /> My Profile</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/seller"><PlusCircle className="mr-2 h-4 w-4" /> Seller Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/premium"><Crown className="mr-2 h-4 w-4 text-amber-500" /> Premium Plans</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/planning"><Calculator className="mr-2 h-4 w-4 text-emerald-600" /> Planning Studio</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/operations"><FolderLock className="mr-2 h-4 w-4 text-emerald-600" /> Property Operations</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/agent-operations"><Target className="mr-2 h-4 w-4 text-emerald-600" /> Agent Operations</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/property-identity"><Fingerprint className="mr-2 h-4 w-4 text-amber-600" /> Property IDs</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/favorites"><Heart className="mr-2 h-4 w-4" /> Saved Properties</Link></DropdownMenuItem>
                    {user?.role === "admin" && <DropdownMenuItem asChild><Link href="/admin"><Shield className="mr-2 h-4 w-4" /> Admin Dashboard</Link></DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : <Button size="sm" className="h-10 rounded-xl bg-emerald-600 px-4 font-bold hover:bg-emerald-500" onClick={startLogin}>Sign In</Button>}
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden" aria-label="Primary mobile navigation">
        <div className="mx-auto flex max-w-md items-end justify-between">
          {localizedBottomTabs.map(({ href, label, icon: Icon, elevated }) => (
            <Link href={href} key={href} className="relative flex w-[20%] flex-col items-center gap-1 text-center">
              {elevated ? <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-[0_8px_18px_rgba(5,150,105,0.38)] ring-4 ring-white"><Icon className="h-7 w-7" /></span> : <Icon className={cn("h-6 w-6", isActive(href) ? "text-emerald-600" : "text-slate-500")} />}
              <span className={cn("text-[10px] font-semibold", isActive(href) ? "text-emerald-700" : "text-slate-500")}>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const compact = size === "sm";
  return <span className={cn("relative grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 text-white shadow-sm", compact ? "h-9 w-9" : "h-10 w-10")}><Home className={compact ? "h-5 w-5" : "h-5.5 w-5.5"} /><span className="absolute bottom-1 h-1 w-4 rounded-full bg-lime-200/90" /></span>;
}
