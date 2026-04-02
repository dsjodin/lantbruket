/**
 * Loan management: creation, payment calculation, processing, and credit assessment.
 */

import type { Loan, GameState } from "@/types";

export interface CreditAssessment {
  approved: boolean;
  maxBorrowable: number;
  interestRate: number;
  debtToAssetRatio: number;
  totalAssets: number;
  totalDebt: number;
  reason?: string;
}

const LAND_VALUE_PER_HA = 50000;

/**
 * Assess a farm's creditworthiness based on assets, debt, and cash flow.
 */
export function assessCreditworthiness(state: GameState): CreditAssessment {
  const { farm, finances, history } = state;

  const landValue = farm.totalHectares * LAND_VALUE_PER_HA;
  // Machine value based on maintenance cost × condition (proxy for purchase price)
  const machineryValue = (farm.machines || []).reduce(
    (sum, m) => sum + Math.round(m.maintenanceCostPerQuarter * 20 * m.condition), 0
  );
  // Building value based on maintenance cost (proxy for construction price)
  const buildingValue = (farm.buildings || []).reduce(
    (sum, b) => sum + b.maintenanceCostPerQuarter * 25, 0
  );
  const storageValue = Object.entries(farm.storage || {}).reduce((sum, [crop, tons]) => {
    const price = state.currentMarketPrices?.[crop] ?? 0;
    return sum + tons * price;
  }, 0);
  const totalAssets = landValue + machineryValue + buildingValue + storageValue + Math.max(0, finances.cashBalance);

  const totalDebt = finances.loans.reduce((s, l) => s + l.remainingPrincipal, 0);
  const debtToAssetRatio = totalAssets > 0 ? totalDebt / totalAssets : totalDebt > 0 ? 1 : 0;

  // Average net result over last 4 quarters
  const recentHistory = history.slice(-4);
  const avgNetResult = recentHistory.length > 0
    ? recentHistory.reduce((s, r) => s + r.financialRecord.netResult, 0) / recentHistory.length
    : 0;

  // Determine interest rate based on risk
  let baseRate = 0.045;
  if (debtToAssetRatio > 0.5) baseRate += 0.02;
  else if (debtToAssetRatio > 0.3) baseRate += 0.01;
  if (avgNetResult < 0) baseRate += 0.015;
  const interestRate = Math.round(baseRate * 1000) / 1000;

  // Rejection check
  if (debtToAssetRatio > 0.7) {
    return {
      approved: false,
      maxBorrowable: 0,
      interestRate,
      debtToAssetRatio: Math.round(debtToAssetRatio * 100) / 100,
      totalAssets,
      totalDebt,
      reason: "Skuldsättningsgraden är för hög (över 70%). Betala av befintliga lån först.",
    };
  }

  // Max borrowable: keep debt-to-asset ratio under 60%
  let maxBorrowable = Math.max(0, totalAssets * 0.6 - totalDebt);
  if (avgNetResult < 0) maxBorrowable = Math.round(maxBorrowable * 0.5);
  maxBorrowable = Math.round(maxBorrowable / 10000) * 10000; // Round to nearest 10k

  if (maxBorrowable < 50000) {
    return {
      approved: false,
      maxBorrowable: 0,
      interestRate,
      debtToAssetRatio: Math.round(debtToAssetRatio * 100) / 100,
      totalAssets,
      totalDebt,
      reason: "Tillgångarna räcker inte för att bevilja ytterligare lån.",
    };
  }

  return {
    approved: true,
    maxBorrowable,
    interestRate,
    debtToAssetRatio: Math.round(debtToAssetRatio * 100) / 100,
    totalAssets,
    totalDebt,
  };
}

/**
 * Calculate the quarterly payment breakdown for a loan.
 * Interest = remainingPrincipal * annualRate / 4
 * Amortization = principal / (termYears * 4)
 */
export function calculateQuarterlyPayment(
  loan: Loan
): { interest: number; amortization: number; total: number } {
  const interest = loan.remainingPrincipal * loan.annualInterestRate / 4;
  const amortization = loan.principal / (loan.termYears * 4);
  const total = interest + amortization;
  return { interest, amortization, total };
}

/**
 * Process a single loan payment, returning an updated loan with reduced principal.
 */
export function processLoanPayment(loan: Loan): Loan {
  const { amortization } = calculateQuarterlyPayment(loan);
  const newRemaining = Math.max(0, loan.remainingPrincipal - amortization);
  return {
    ...loan,
    remainingPrincipal: newRemaining,
  };
}

/**
 * Create a new loan with the given parameters.
 */
export function createLoan(
  amount: number,
  termYears: number,
  interestRate: number,
  yearTaken: number
): Loan {
  const quarterlyAmortization = amount / (termYears * 4);
  const quarterlyInterest = amount * interestRate / 4;

  return {
    id: `loan-${yearTaken}-${Date.now()}`,
    principal: amount,
    remainingPrincipal: amount,
    annualInterestRate: interestRate,
    quarterlyPayment: quarterlyAmortization + quarterlyInterest,
    termYears,
    yearTaken,
  };
}
