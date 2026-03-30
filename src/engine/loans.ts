/**
 * Loan management: creation, payment calculation, and processing.
 */

import type { Loan } from "@/types";

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
