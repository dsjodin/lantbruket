/**
 * Financial calculations: revenue, costs, and financial record creation.
 */

import {
  type CropType,
  type Quarter,
  type Farm,
  type Field,
  type Loan,
  type FinancialRecord,
  type RevenueBreakdown,
  type CostBreakdown,
} from "@/types";
import type { LivestockHerd } from "@/types";
import { CROPS_DATA } from "@/data/crops";
import {
  MACHINERY_MAINTENANCE,
  BUILDING_MAINTENANCE,
} from "@/data/machinery";
import { calculateQuarterlyLivestockCosts } from "./livestock";
import { calculateQuarterlyPayment } from "./loans";

// Cost constants (per quarter unless stated otherwise)
const FUEL_COST_PER_HA_PER_YEAR = 400;
const INSURANCE_COST_PER_HA_PER_YEAR = 200;
const SALARY_PER_EMPLOYEE_PER_QUARTER = 100000;

/**
 * Calculate total quarterly revenue from all sources.
 */
export function calculateQuarterRevenue(params: {
  cropSales: Record<CropType, { tons: number; pricePerTon: number }>;
  livestockIncome: number;
  subsidyPayments: number;
}): RevenueBreakdown {
  const cropSalesTotal = Object.values(params.cropSales).reduce(
    (sum, sale) => sum + sale.tons * sale.pricePerTon,
    0
  );

  return {
    cropSales: Math.round(cropSalesTotal),
    livestockIncome: Math.round(params.livestockIncome),
    subsidies: Math.round(params.subsidyPayments),
    other: 0,
  };
}

/**
 * Calculate all quarterly costs broken down by category.
 */
export function calculateQuarterCosts(params: {
  farm: Farm;
  fields: Field[];
  livestock: LivestockHerd[];
  loans: Loan[];
  quarter: Quarter;
}): CostBreakdown {
  const { farm, fields, livestock, loans, quarter } = params;

  // Seed costs - only charge when field was just planted (status "Sådd")
  let seeds = 0;
  let fertilizer = 0;

  for (const field of fields) {
    if (!field.crop) continue;
    const cropData = CROPS_DATA[field.crop];

    // Seeds: charge when the field is freshly sown
    if (cropData.plantQuarter === quarter && field.status === "Sådd") {
      seeds += cropData.seedCostPerHa * field.hectares;
    }

    // Fertilizer: charge if fertilizer was applied
    if (field.fertilizerApplied) {
      fertilizer += cropData.fertilizerCostPerHa * field.hectares;
    }
  }

  // Fuel costs based on total hectares in use (quarterly)
  const usedHectares = fields.reduce((sum, f) => sum + f.hectares, 0);
  const fuel = (usedHectares * FUEL_COST_PER_HA_PER_YEAR) / 4;

  // Machinery depreciation/maintenance (quarterly)
  const machinery = MACHINERY_MAINTENANCE[farm.machinery] ?? 8000;

  // Livestock costs
  const livestockCosts = calculateQuarterlyLivestockCosts(livestock);

  // Salaries
  const salaries = farm.employees * SALARY_PER_EMPLOYEE_PER_QUARTER;

  // Loan payments
  let loanInterest = 0;
  let loanAmortization = 0;
  for (const loan of loans) {
    if (loan.remainingPrincipal <= 0) continue;
    const payment = calculateQuarterlyPayment(loan);
    loanInterest += payment.interest;
    loanAmortization += payment.amortization;
  }

  // Insurance (quarterly)
  const insurance = (farm.totalHectares * INSURANCE_COST_PER_HA_PER_YEAR) / 4;

  // Building maintenance (quarterly)
  const buildingMaintenance = BUILDING_MAINTENANCE[farm.buildings] ?? 5000;

  // Lease costs (quarterly = annual / 4)
  const leaseCosts = fields
    .filter((f) => f.leased && f.leaseAnnualCost)
    .reduce((sum, f) => sum + (f.leaseAnnualCost! / 4), 0);

  return {
    seeds: Math.round(seeds),
    fertilizer: Math.round(fertilizer),
    fuel: Math.round(fuel),
    machinery: Math.round(machinery),
    feed: Math.round(livestockCosts.feed),
    veterinary: Math.round(livestockCosts.veterinary),
    salaries: Math.round(salaries),
    loanInterest: Math.round(loanInterest),
    loanAmortization: Math.round(loanAmortization),
    insurance: Math.round(insurance),
    buildingMaintenance: Math.round(buildingMaintenance),
    other: Math.round(leaseCosts),
  };
}

/**
 * Create a financial record summarizing the quarter's economics.
 */
export function createFinancialRecord(
  year: number,
  quarter: Quarter,
  revenue: RevenueBreakdown,
  costs: CostBreakdown,
  previousCash: number
): FinancialRecord {
  const totalRevenue =
    revenue.cropSales + revenue.livestockIncome + revenue.subsidies + revenue.other;
  const totalCosts =
    costs.seeds +
    costs.fertilizer +
    costs.fuel +
    costs.machinery +
    costs.feed +
    costs.veterinary +
    costs.salaries +
    costs.loanInterest +
    costs.loanAmortization +
    costs.insurance +
    costs.buildingMaintenance +
    costs.other;

  const netResult = totalRevenue - totalCosts;

  return {
    year,
    quarter,
    revenue,
    costs,
    netResult: Math.round(netResult),
    cashBalanceEnd: Math.round(previousCash + netResult),
  };
}
