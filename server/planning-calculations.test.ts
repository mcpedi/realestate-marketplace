import { describe, expect, it } from "vitest";
import { calculatePlanningAnalysis } from "../shared/planning";

describe("Planning Studio calculations", () => {
  it("calculates ROI from income, expenses, vacancy, and total investment", () => {
    const result = calculatePlanningAnalysis("roi", {
      purchasePrice: 10_000_000,
      monthlyRent: 100_000,
      monthlyExpenses: 10_000,
      annualExpenses: 60_000,
      vacancyRate: 5,
      additionalCosts: 500_000,
    });
    expect(result.headline.value).toBeCloseTo(9.14, 2);
    expect(result.metrics.find((metric) => metric.label === "Annual net income")?.value).toBe(960_000);
    expect(result.metrics.find((metric) => metric.label === "Monthly cash flow")?.value).toBe(80_000);
  });

  it("uses occupancy-adjusted income for rental yield", () => {
    const result = calculatePlanningAnalysis("rental_yield", {
      purchasePrice: 12_000_000,
      monthlyRent: 120_000,
      occupancyRate: 75,
      monthlyExpenses: 10_000,
      annualExpenses: 120_000,
    });
    expect(result.headline.value).toBeCloseTo(7, 2);
    expect(result.metrics.find((metric) => metric.label === "Gross rental yield")?.value).toBeCloseTo(12, 2);
  });

  it("breaks a construction estimate into transparent core costs, preparation, permits, and contingency", () => {
    const result = calculatePlanningAnalysis("construction", {
      buildingArea: 100,
      costPerSqm: 50_000,
      sitePreparation: 200_000,
      permits: 100_000,
      contingencyRate: 10,
    });
    expect(result.headline.value).toBe(5_830_000);
    expect(result.metrics.find((metric) => metric.label === "Cost per square metre")?.value).toBe(58_300);
    expect(result.breakdown.find((item) => item.label === "Foundation")?.value).toBe(600_000);
  });

  it("calculates development profit, margin, ROI, and break-even revenue share", () => {
    const result = calculatePlanningAnalysis("development", {
      landAcquisition: 5_000_000,
      construction: 10_000_000,
      professionalFees: 1_000_000,
      permits: 500_000,
      financing: 500_000,
      marketing: 500_000,
      contingency: 1_000_000,
      expectedSaleRevenue: 24_000_000,
      expectedRentalRevenue: 0,
    });
    expect(result.headline.value).toBe(5_500_000);
    expect(result.metrics.find((metric) => metric.label === "Profit margin")?.value).toBeCloseTo(22.92, 2);
    expect(result.metrics.find((metric) => metric.label === "Estimated ROI")?.value).toBeCloseTo(29.73, 2);
  });
});
