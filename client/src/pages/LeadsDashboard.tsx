import { useMemo, useState } from "react";
import { useLocation, Link, Redirect } from "wouter";
import {
  Mail,
  Phone,
  MessageSquare,
  Home as HomeIcon,
  Clock,
  CheckCircle2,
  Eye,
  Handshake,
  XCircle,
  ArrowLeft,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

type LeadStatus = "new" | "contacted" | "viewing" | "negotiating" | "closed" | "lost";

const STATUS_OPTIONS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "viewing", label: "Viewing scheduled" },
  { value: "negotiating", label: "Negotiating" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

const STATUS_META: Record<LeadStatus, { label: string; className: string; icon: typeof Clock }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  contacted: { label: "Contacted", className: "bg-sky-100 text-sky-700 border-sky-200", icon: CheckCircle2 },
  viewing: { label: "Viewing", className: "bg-purple-100 text-purple-700 border-purple-200", icon: Eye },
  negotiating: { label: "Negotiating", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Handshake },
  closed: { label: "Closed", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  lost: { label: "Lost", className: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle },
};

function formatPrice(price: number): string {
  return `KES ${price.toLocaleString()}`;
}

export default function LeadsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  const leadsQuery = trpc.leads.myLeads.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const statsQuery = trpc.leads.stats.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.myLeads.invalidate();
      utils.leads.stats.invalidate();
      toast.success("Lead status updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const stats = statsQuery.data;
  const leads = leadsQuery.data ?? [];

  const properties = useMemo(() => {
    const map = new Map<number, string>();
    leads.forEach((l) => {
      if (!map.has(l.propertyId)) map.set(l.propertyId, l.propertyTitle);
    });
    return Array.from(map.entries());
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (propertyFilter !== "all" && l.propertyId !== Number(propertyFilter)) return false;
      return true;
    });
  }, [leads, statusFilter, propertyFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d3b9e] to-[#1e2a78] text-white">
        <div className="container py-8">
          <button
            onClick={() => navigate("/seller")}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Seller Dashboard
          </button>
          <h1 className="text-3xl font-serif font-bold">Leads Dashboard</h1>
          <p className="text-white/70 mt-1">
            Track and manage buyer inquiries across all your listings
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={UserPlus}
            label="Total leads"
            value={stats?.total ?? 0}
            tone="blue"
          />
          <StatCard icon={Clock} label="New" value={stats?.newLeads ?? 0} tone="blue" />
          <StatCard icon={CheckCircle2} label="Contacted" value={stats?.contacted ?? 0} tone="sky" />
          <StatCard icon={Eye} label="Viewing" value={stats?.viewing ?? 0} tone="purple" />
          <StatCard icon={Handshake} label="Negotiating" value={stats?.negotiating ?? 0} tone="amber" />
          <StatCard icon={TrendingUp} label="Conversion" value={`${stats?.conversionRate ?? 0}%`} tone="emerald" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[260px] bg-white">
              <SelectValue placeholder="All properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map(([id, title]) => (
                <SelectItem key={id} value={String(id)}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500 ml-auto">
            {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Leads list */}
        {leadsQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center gap-3">
            <Spinner className="w-8 h-8" />
            <p className="text-slate-500">Loading your leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              {leads.length === 0 ? "No leads yet" : "No matching leads"}
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              {leads.length === 0
                ? "When buyers inquire about your listings, they will appear here. Start by checking the Seller Dashboard to manage your listings."
                : "Try adjusting your filters to see more leads."}
            </p>
            <Link href="/seller">
              <Button className="mt-4">Go to Seller Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => {
              const meta = STATUS_META[lead.status as LeadStatus] ?? STATUS_META.new;
              const StatusIcon = meta.icon;
              return (
                <div
                  key={lead.leadId}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1">
                        <HomeIcon className="w-4 h-4 text-[#0d3b9e]" />
                        <span className="font-semibold text-slate-800">{lead.propertyTitle}</span>
                        <span className="text-sm text-[#c9a227] font-medium">
                          {formatPrice(lead.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" /> {lead.buyerName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{lead.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`border ${meta.className}`}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1" />
                        {meta.label}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="w-3.5 h-3.5" /> {lead.buyerEmail}
                        {lead.buyerPhone && (
                          <>
                            <span className="text-slate-300">•</span>
                            <Phone className="w-3.5 h-3.5" /> {lead.buyerPhone}
                          </>
                        )}
                      </div>
                      <Select
                        value={lead.status}
                        onValueChange={(v) =>
                          updateStatusMutation.mutate({ leadId: lead.leadId, status: v as LeadStatus })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-[170px] bg-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: number | string;
  tone: "blue" | "sky" | "purple" | "amber" | "emerald";
}) {
  const tones: Record<string, string> = {
    blue: "text-[#0d3b9e]",
    sky: "text-sky-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <Icon className={`w-5 h-5 ${tones[tone]} mb-2`} />
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
