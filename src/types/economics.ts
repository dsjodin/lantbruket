import { Quarter, SubsidyType, SubsidyStatus } from "./enums";

export interface Finances {
  cashBalance: number;
  loans: Loan[];
  subsidies: SubsidyApplication[];
}

export interface Loan {
  id: string;
  principal: number;
  remainingPrincipal: number;
  annualInterestRate: number;
  quarterlyPayment: number;
  termYears: number;
  yearTaken: number;
}

export interface SubsidyApplication {
  type: SubsidyType;
  appliedYear: number;
  amount: number;
  status: SubsidyStatus;
}

export interface FinancialRecord {
  year: number;
  quarter: Quarter;
  revenue: RevenueBreakdown;
  costs: CostBreakdown;
  netResult: number;
  cashBalanceEnd: number;
}

export interface RevenueBreakdown {
  cropSales: number;
  livestockIncome: number;
  subsidies: number;
  other: number;
}

export interface CostBreakdown {
  seeds: number;
  fertilizer: number;
  fuel: number;
  machinery: number;
  feed: number;
  veterinary: number;
  salaries: number;
  loanInterest: number;
  loanAmortization: number;
  insurance: number;
  buildingMaintenance: number;
  other: number;
}
