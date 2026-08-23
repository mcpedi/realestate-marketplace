import { useMemo, useState } from "react";
import { Redirect } from "wouter";
import { BarChart3, Building2, Calculator, ChartNoAxesCombined, ClipboardList, Construction, Landmark, Layers3, Loader2, Save, Trash2, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { calculatePlanningAnalysis, type PlanningAnalysisKind, type PlanningInputs } from "@shared/planning";

type Field = { key: string; label: string; hint?: string; defaultValue: number; step?: number };
type CalculatorConfig = { kind: PlanningAnalysisKind; title: string; eyebrow: string; description: string; icon: typeof Calculator; fields: Field[] };

const CALCULATORS: CalculatorConfig[] = [
  {
    kind: "roi", title: "Investment ROI", eyebrow: "Investor toolkit", icon: TrendingUp,
    description: "Estimate cash flow, annual net income, payback time, and return using your own assumptions.",
    fields: [
      { key: "purchasePrice", label: "Purchase price (KES)", defaultValue: 0 }, { key: "monthlyRent", label: "Expected monthly rent (KES)", defaultValue: 0 },
      { key: "monthlyExpenses", label: "Monthly operating expenses (KES)", defaultValue: 0 }, { key: "annualExpenses", label: "Annual expenses (KES)", defaultValue: 0 },
      { key: "vacancyRate", label: "Vacancy assumption (%)", defaultValue: 5, step: 0.1 }, { key: "additionalCosts", label: "Additional investment costs (KES)", defaultValue: 0 },
    ],
  },
  {
    kind: "rental_yield", title: "Rental Yield", eyebrow: "Investor toolkit", icon: ChartNoAxesCombined,
    description: "Compare gross and occupancy-adjusted net rental yield before you make a decision.",
    fields: [
      { key: "purchasePrice", label: "Property purchase price (KES)", defaultValue: 0 }, { key: "monthlyRent", label: "Monthly rent (KES)", defaultValue: 0 },
      { key: "occupancyRate", label: "Expected occupancy (%)", defaultValue: 90, step: 0.1 }, { key: "monthlyExpenses", label: "Monthly expenses (KES)", defaultValue: 0 },
      { key: "annualExpenses", label: "Annual expenses (KES)", defaultValue: 0 },
    ],
  },
  {
    kind: "construction", title: "Construction Cost", eyebrow: "Project planning", icon: Construction,
    description: "Build a transparent construction budget from approximate area and costs you provide.",
    fields: [
      { key: "buildingArea", label: "Approximate building area (m²)", defaultValue: 0, step: 0.1 }, { key: "costPerSqm", label: "Construction cost per m² (KES)", defaultValue: 0 },
      { key: "sitePreparation", label: "Site preparation (KES)", defaultValue: 0 }, { key: "permits", label: "Permits and approvals (KES)", defaultValue: 0 },
      { key: "contingencyRate", label: "Contingency (%)", defaultValue: 10, step: 0.1 },
    ],
  },
  {
    kind: "development", title: "Development Plan", eyebrow: "Project planning", icon: Building2,
    description: "Model a full property development cost, revenue, margin, and break-even scenario.",
    fields: [
      { key: "landAcquisition", label: "Land acquisition (KES)", defaultValue: 0 }, { key: "construction", label: "Construction cost (KES)", defaultValue: 0 },
      { key: "professionalFees", label: "Professional fees (KES)", defaultValue: 0 }, { key: "permits", label: "Permits and related expenses (KES)", defaultValue: 0 },
      { key: "financing", label: "Financing costs (KES)", defaultValue: 0 }, { key: "marketing", label: "Marketing costs (KES)", defaultValue: 0 },
      { key: "contingency", label: "Contingency (KES)", defaultValue: 0 }, { key: "expectedSaleRevenue", label: "Expected sale revenue (KES)", defaultValue: 0 },
      { key: "expectedRentalRevenue", label: "Expected rental revenue (KES)", defaultValue: 0 },
    ],
  },
];

const money = (value: number) => `KES ${Math.round(value).toLocaleString()}`;
const defaultsFor = (config: CalculatorConfig): PlanningInputs => Object.fromEntries(config.fields.map((field) => [field.key, field.defaultValue]));
const formatValue = (value: number, format: "currency" | "percent" | "months") => format === "currency" ? money(value) : format === "percent" ? `${value.toFixed(1)}%` : value > 0 ? `${Math.round(value).toLocaleString()} months` : "Not reached";

export default function PlanningStudio() {
  const { user, loading: authLoading } = useAuth();
  const [kind, setKind] = useState<PlanningAnalysisKind>("roi");
  const [inputs, setInputs] = useState<PlanningInputs>(() => defaultsFor(CALCULATORS[0]));
  const [name, setName] = useState("");
  const [propertyId, setPropertyId] = useState("none");
  const utils = trpc.useUtils();
  const scenarios = trpc.planning.list.useQuery(undefined, { enabled: !!user, retry: false });
  const assumptionTemplates = trpc.planning.assumptionTemplates.useQuery({ kind }, { enabled: !!user, retry: false });
  const properties = trpc.property.myProperties.useQuery(undefined, { enabled: !!user, retry: false });
  const active = CALCULATORS.find((calculator) => calculator.kind === kind) ?? CALCULATORS[0];
  const result = useMemo(() => calculatePlanningAnalysis(kind, inputs), [kind, inputs]);
  const positiveBreakdown = result.breakdown.filter((item) => item.value > 0);
  const saveScenario = trpc.planning.save.useMutation({
    onSuccess: () => { utils.planning.list.invalidate(); toast.success("Planning scenario saved"); },
    onError: (error) => toast.error(error.message),
  });
  const deleteScenario = trpc.planning.delete.useMutation({
    onSuccess: () => { utils.planning.list.invalidate(); toast.success("Scenario deleted"); },
    onError: (error) => toast.error(error.message),
  });

  const selectCalculator = (nextKind: PlanningAnalysisKind) => {
    const next = CALCULATORS.find((calculator) => calculator.kind === nextKind) ?? CALCULATORS[0];
    setKind(nextKind); setInputs(defaultsFor(next)); setName(""); setPropertyId("none");
  };
  const loadScenario = (scenario: { kind: PlanningAnalysisKind; name: string; propertyId: number | null; inputs: unknown }) => {
    const next = CALCULATORS.find((calculator) => calculator.kind === scenario.kind) ?? CALCULATORS[0];
    setKind(scenario.kind); setInputs(scenario.inputs as PlanningInputs); setName(scenario.name); setPropertyId(scenario.propertyId ? String(scenario.propertyId) : "none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = () => saveScenario.mutate({ kind, name: name.trim() || `${active.title} scenario`, propertyId: propertyId === "none" ? undefined : Number(propertyId), inputs });

  if (authLoading) return <div className="grid min-h-screen place-items-center"><Spinner className="h-8 w-8" /></div>;
  if (!user) return <Redirect to="/" />;

  const Icon = active.icon;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main>
        <section className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,_#d1fae5_0,_transparent_33%),linear-gradient(130deg,_#0f766e,_#0f3b5d)] text-white">
          <div className="container py-10 md:py-14">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100"><Calculator className="h-3.5 w-3.5" /> Planning Studio</div>
              <h1 className="text-3xl font-extrabold tracking-[-0.045em] md:text-5xl">Make property plans with clarity.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 md:text-lg">Run investment, rental, construction, and development scenarios from your own assumptions. Every outcome is an estimate—not financial, valuation, or construction advice.</p>
            </div>
          </div>
        </section>

        <section className="container py-7 md:py-10">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CALCULATORS.map((calculator) => {
              const CardIcon = calculator.icon; const selected = calculator.kind === kind;
              return <button key={calculator.kind} onClick={() => selectCalculator(calculator.kind)} className={`rounded-2xl border p-4 text-left transition-all ${selected ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm"}`}>
                <CardIcon className={`h-5 w-5 ${selected ? "text-emerald-600" : "text-slate-500"}`} /><p className="mt-3 text-sm font-extrabold">{calculator.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{calculator.eyebrow}</p>
              </button>;
            })}
          </div>

          {assumptionTemplates.data?.length ? <section className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/60 p-4 md:p-5"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sky-700 shadow-sm"><Layers3 className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-700">Administrator-provided defaults</p><p className="mt-1 text-sm leading-6 text-sky-900">Select a template only if it suits your plan. Its values remain fully editable and are not market data or advice.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{assumptionTemplates.data.map((template) => <Button key={template.id} variant="outline" onClick={() => setInputs(template.inputs as PlanningInputs)} className="h-auto rounded-xl border-sky-200 bg-white px-3 py-2 text-left text-xs font-bold text-sky-900 hover:bg-sky-100"><span>{template.name}</span><span className="ml-2 font-normal text-sky-600">Apply</span></Button>)}</div></section> : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-5"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">{active.eyebrow}</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">{active.title} calculator</h2><p className="mt-1 text-sm leading-6 text-slate-500">{active.description}</p></div></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {active.fields.map((field) => <div key={field.key}><Label htmlFor={field.key}>{field.label}</Label><Input id={field.key} type="number" min="0" step={field.step ?? 1} value={inputs[field.key] ?? 0} onChange={(event) => setInputs((current) => ({ ...current, [field.key]: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1.5 h-11 rounded-xl" /></div>)}
              </div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Save this scenario</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} placeholder={`${active.title} scenario`} className="h-11 rounded-xl bg-white" /><Select value={propertyId} onValueChange={setPropertyId}><SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Optional property link" /></SelectTrigger><SelectContent><SelectItem value="none">No property linked</SelectItem>{(properties.data ?? []).map((property) => <SelectItem key={property.id} value={String(property.id)}>{property.title}</SelectItem>)}</SelectContent></Select></div><Button onClick={save} disabled={saveScenario.isPending} className="mt-3 h-11 w-full rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500"><Save className="mr-2 h-4 w-4" />{saveScenario.isPending ? "Saving scenario…" : "Save planning scenario"}</Button></div>
            </section>

            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/30 md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">Scenario result</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">{result.headline.label}</h2><p className="mt-2 text-4xl font-extrabold text-emerald-300 md:text-5xl">{formatValue(result.headline.value, result.headline.format)}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">{result.metrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-3.5"><p className="text-xs font-semibold text-slate-400">{metric.label}</p><p className="mt-1 text-lg font-extrabold">{formatValue(metric.value, metric.format)}</p></div>)}</div>
              <div className="mt-6 rounded-2xl bg-white p-3 text-slate-900"><p className="px-2 pt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Income, cost & allocation</p>{positiveBreakdown.length ? <><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={positiveBreakdown} dataKey="value" nameKey="label" innerRadius={48} outerRadius={76} paddingAngle={3}>{positiveBreakdown.map((_, index) => <Cell key={index} fill={["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"][index % 6]} />)}</Pie><Tooltip formatter={(value: number) => money(value)} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-x-3 gap-y-2 px-2 pb-2">{result.breakdown.slice(0, 8).map((item) => <div key={item.label} className="flex items-center justify-between gap-2 text-xs"><span className="truncate text-slate-500">{item.label}</span><span className="font-bold">{money(item.value)}</span></div>)}</div></> : <div className="grid h-56 place-items-center px-6 text-center"><div><BarChart3 className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-3 text-sm font-bold">Enter your assumptions to preview the allocation.</p><p className="mt-1 text-xs leading-5 text-slate-500">Your income, costs, and category split will appear here as you build the scenario.</p></div></div>}</div>
              <p className="mt-4 text-xs leading-5 text-slate-400">Results are estimates based only on values entered here. Confirm costs, tax, financing, permits, prices, and professional advice before acting.</p>
            </section>
          </div>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Your scenarios</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">Saved planning work</h2></div><ClipboardList className="h-6 w-6 text-slate-400" /></div>
            {scenarios.isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : scenarios.isError ? <div className="py-10 text-center"><p className="text-sm text-slate-500">Your saved scenarios could not be loaded.</p><Button variant="outline" onClick={() => scenarios.refetch()} className="mt-3 rounded-xl">Try again</Button></div> : scenarios.data?.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{scenarios.data.map((scenario) => <article key={scenario.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">{scenario.kind.replace("_", " ")}</p><h3 className="mt-1 font-extrabold">{scenario.name}</h3><p className="mt-1 text-xs text-slate-500">Updated {new Date(scenario.updatedAt).toLocaleDateString()}</p></div><button aria-label={`Delete ${scenario.name}`} onClick={() => deleteScenario.mutate({ id: scenario.id })} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div><div className="mt-4 flex gap-2"><Button variant="outline" onClick={() => loadScenario(scenario as any)} className="h-9 flex-1 rounded-xl text-xs font-bold">Load scenario</Button></div></article>)}</div> : <div className="py-10 text-center"><Landmark className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">No saved planning scenarios yet.</p><p className="mt-1 text-sm text-slate-500">Use any calculator above, then save the assumptions you want to revisit.</p></div>}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
