export const planningAnalysisKinds = ["roi", "rental_yield", "construction", "development"] as const;
export type PlanningAnalysisKind = (typeof planningAnalysisKinds)[number];
export type PlanningInputs = Record<string, number>;
export type PlanningResult = {
  headline: { label: string; value: number; format: "currency" | "percent" | "months" };
  metrics: Array<{ label: string; value: number; format: "currency" | "percent" | "months" }>;
  breakdown: Array<{ label: string; value: number }>;
};

const input = (inputs: PlanningInputs, key: string) => Math.max(0, Number(inputs[key] ?? 0));
const percent = (inputs: PlanningInputs, key: string) => Math.min(100, input(inputs, key));

export function calculatePlanningAnalysis(kind: PlanningAnalysisKind, inputs: PlanningInputs): PlanningResult {
  if (kind === "roi") {
    const purchasePrice = input(inputs, "purchasePrice");
    const monthlyRent = input(inputs, "monthlyRent");
    const monthlyExpenses = input(inputs, "monthlyExpenses");
    const annualExpenses = input(inputs, "annualExpenses");
    const additionalCosts = input(inputs, "additionalCosts");
    const vacancyRate = percent(inputs, "vacancyRate");
    const annualGrossIncome = monthlyRent * 12;
    const vacancyCost = annualGrossIncome * (vacancyRate / 100);
    const annualOperatingExpenses = monthlyExpenses * 12 + annualExpenses + vacancyCost;
    const annualNetIncome = annualGrossIncome - annualOperatingExpenses;
    const totalInvestment = purchasePrice + additionalCosts;
    const roi = totalInvestment > 0 ? (annualNetIncome / totalInvestment) * 100 : 0;
    const paybackMonths = annualNetIncome > 0 ? (totalInvestment / annualNetIncome) * 12 : 0;
    return {
      headline: { label: "Estimated annual ROI", value: roi, format: "percent" },
      metrics: [
        { label: "Annual gross income", value: annualGrossIncome, format: "currency" },
        { label: "Annual operating expenses", value: annualOperatingExpenses, format: "currency" },
        { label: "Annual net income", value: annualNetIncome, format: "currency" },
        { label: "Monthly cash flow", value: annualNetIncome / 12, format: "currency" },
        { label: "Estimated payback", value: paybackMonths, format: "months" },
      ],
      breakdown: [
        { label: "Net income", value: Math.max(annualNetIncome, 0) },
        { label: "Expenses & vacancy", value: annualOperatingExpenses },
      ],
    };
  }

  if (kind === "rental_yield") {
    const purchasePrice = input(inputs, "purchasePrice");
    const monthlyRent = input(inputs, "monthlyRent");
    const monthlyExpenses = input(inputs, "monthlyExpenses");
    const annualExpenses = input(inputs, "annualExpenses");
    const occupancyRate = percent(inputs, "occupancyRate");
    const annualPotentialIncome = monthlyRent * 12;
    const occupancyAdjustedIncome = annualPotentialIncome * (occupancyRate / 100);
    const totalExpenses = monthlyExpenses * 12 + annualExpenses;
    const netAnnualIncome = occupancyAdjustedIncome - totalExpenses;
    const grossYield = purchasePrice > 0 ? (annualPotentialIncome / purchasePrice) * 100 : 0;
    const netYield = purchasePrice > 0 ? (netAnnualIncome / purchasePrice) * 100 : 0;
    return {
      headline: { label: "Estimated net rental yield", value: netYield, format: "percent" },
      metrics: [
        { label: "Gross rental yield", value: grossYield, format: "percent" },
        { label: "Occupancy-adjusted income", value: occupancyAdjustedIncome, format: "currency" },
        { label: "Annual expenses", value: totalExpenses, format: "currency" },
        { label: "Net annual income", value: netAnnualIncome, format: "currency" },
        { label: "Monthly cash flow", value: netAnnualIncome / 12, format: "currency" },
      ],
      breakdown: [
        { label: "Net income", value: Math.max(netAnnualIncome, 0) },
        { label: "Expenses", value: totalExpenses },
      ],
    };
  }

  if (kind === "construction") {
    const buildingArea = input(inputs, "buildingArea");
    const costPerSqm = input(inputs, "costPerSqm");
    const sitePreparation = input(inputs, "sitePreparation");
    const permits = input(inputs, "permits");
    const contingencyRate = percent(inputs, "contingencyRate");
    const coreConstruction = buildingArea * costPerSqm;
    const subtotal = coreConstruction + sitePreparation + permits;
    const contingency = subtotal * (contingencyRate / 100);
    const total = subtotal + contingency;
    const costPerSquareMeter = buildingArea > 0 ? total / buildingArea : 0;
    const coreParts = [
      ["Foundation", 0.12], ["Structural works", 0.32], ["Roofing", 0.1], ["Plumbing", 0.07], ["Electrical", 0.07],
      ["Flooring", 0.08], ["Doors & windows", 0.05], ["Painting", 0.04], ["Finishing", 0.07], ["Labour", 0.08],
    ] as const;
    return {
      headline: { label: "Estimated construction budget", value: total, format: "currency" },
      metrics: [
        { label: "Cost per square metre", value: costPerSquareMeter, format: "currency" },
        { label: "Core construction", value: coreConstruction, format: "currency" },
        { label: "Site & permits", value: sitePreparation + permits, format: "currency" },
        { label: "Contingency", value: contingency, format: "currency" },
      ],
      breakdown: [...coreParts.map(([label, share]) => ({ label, value: coreConstruction * share })), { label: "Site preparation", value: sitePreparation }, { label: "Permits", value: permits }, { label: "Contingency", value: contingency }],
    };
  }

  const landAcquisition = input(inputs, "landAcquisition");
  const construction = input(inputs, "construction");
  const professionalFees = input(inputs, "professionalFees");
  const permits = input(inputs, "permits");
  const financing = input(inputs, "financing");
  const marketing = input(inputs, "marketing");
  const contingency = input(inputs, "contingency");
  const expectedSaleRevenue = input(inputs, "expectedSaleRevenue");
  const expectedRentalRevenue = input(inputs, "expectedRentalRevenue");
  const totalCost = landAcquisition + construction + professionalFees + permits + financing + marketing + contingency;
  const expectedRevenue = expectedSaleRevenue + expectedRentalRevenue;
  const estimatedProfit = expectedRevenue - totalCost;
  const profitMargin = expectedRevenue > 0 ? (estimatedProfit / expectedRevenue) * 100 : 0;
  const roi = totalCost > 0 ? (estimatedProfit / totalCost) * 100 : 0;
  const breakEvenRevenueShare = expectedRevenue > 0 ? (totalCost / expectedRevenue) * 100 : 0;
  return {
    headline: { label: "Estimated development profit", value: estimatedProfit, format: "currency" },
    metrics: [
      { label: "Total project cost", value: totalCost, format: "currency" },
      { label: "Expected revenue", value: expectedRevenue, format: "currency" },
      { label: "Profit margin", value: profitMargin, format: "percent" },
      { label: "Estimated ROI", value: roi, format: "percent" },
      { label: "Break-even revenue share", value: breakEvenRevenueShare, format: "percent" },
    ],
    breakdown: [
      { label: "Land acquisition", value: landAcquisition }, { label: "Construction", value: construction }, { label: "Professional fees", value: professionalFees },
      { label: "Permits", value: permits }, { label: "Financing", value: financing }, { label: "Marketing", value: marketing }, { label: "Contingency", value: contingency },
    ],
  };
}
