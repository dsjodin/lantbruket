/**
 * End-of-game scoring and grading system.
 */

import type { GameState } from "@/types";

export interface ScoreBreakdown {
  netWorth: number;
  profitability: number;
  sustainability: number;
  subsidyUsage: number;
  resilience: number;
}

/**
 * Calculate the player's final score and grade.
 *
 * Weights:
 *   - Net worth (cash + assets - loans): 40%
 *   - Profitability trend: 20%
 *   - Sustainability (crop diversity, soil quality): 20%
 *   - Use of subsidies: 10%
 *   - Event resilience: 10%
 *
 * Grades: A (>80), B (60-80), C (40-60), D (20-40), F (<20)
 */
export function calculateScore(
  state: GameState
): { score: number; grade: string; breakdown: ScoreBreakdown } {
  // --- Net Worth Score (0-100) ---
  const totalLoans = state.finances.loans.reduce(
    (sum, l) => sum + l.remainingPrincipal,
    0
  );
  const cash = state.finances.cashBalance;
  // Estimate asset value: land value + machinery + buildings + livestock
  const landValue = state.farm.totalHectares * 50000; // rough per-ha value
  // Machine value: sum based on condition and type (rough estimate)
  const machineryValue = (state.farm.machines || []).reduce((sum, m) => {
    const baseValue = m.maintenanceCostPerQuarter * 20; // rough heuristic
    return sum + Math.round(baseValue * m.condition);
  }, 0);
  // Building value: sum of construction costs (estimated from maintenance)
  const buildingValue = (state.farm.buildings || []).reduce((sum, b) => {
    return sum + b.maintenanceCostPerQuarter * 25; // rough heuristic
  }, 0);

  const netWorth = cash + landValue + machineryValue + buildingValue - totalLoans;
  // Scale: 0 at negative, 100 at 10M+ for a ~100ha farm
  const targetNetWorth = state.farm.totalHectares * 80000;
  const netWorthScore = Math.max(0, Math.min(100, (netWorth / targetNetWorth) * 100));

  // --- Profitability Trend Score (0-100) ---
  const records = state.history.map((h) => h.financialRecord);
  let profitabilityScore = 50; // default if no history
  if (records.length >= 4) {
    const firstHalfRecords = records.slice(0, Math.floor(records.length / 2));
    const secondHalfRecords = records.slice(Math.floor(records.length / 2));
    const avgFirst =
      firstHalfRecords.reduce((s, r) => s + r.netResult, 0) / firstHalfRecords.length;
    const avgSecond =
      secondHalfRecords.reduce((s, r) => s + r.netResult, 0) / secondHalfRecords.length;

    if (avgSecond > avgFirst && avgSecond > 0) {
      profitabilityScore = Math.min(100, 60 + ((avgSecond - avgFirst) / Math.max(1, Math.abs(avgFirst))) * 40);
    } else if (avgSecond > 0) {
      profitabilityScore = 50;
    } else {
      profitabilityScore = Math.max(0, 30 + avgSecond / 10000);
    }
  }

  // --- Sustainability Score (0-100) ---
  // Crop diversity: more crops = better
  const uniqueCrops = new Set(
    state.farm.fields.filter((f) => f.crop && f.crop !== "Träda").map((f) => f.crop)
  );
  const diversityScore = Math.min(100, (uniqueCrops.size / 5) * 100);

  // Soil quality average
  const avgSoil =
    state.farm.fields.length > 0
      ? state.farm.fields.reduce((s, f) => s + f.soilQuality, 0) /
        state.farm.fields.length
      : 1.0;
  const soilScore = Math.min(100, (avgSoil / 1.1) * 100);

  const sustainabilityScore = diversityScore * 0.6 + soilScore * 0.4;

  // --- Subsidy Usage Score (0-100) ---
  const totalSubsidies = state.finances.subsidies.reduce((s, sub) => s + sub.amount, 0);
  // Good if they used subsidies effectively - rough heuristic
  const expectedSubsidies = state.farm.totalHectares * 3000 * state.totalYears;
  const subsidyScore = Math.min(
    100,
    (totalSubsidies / Math.max(1, expectedSubsidies)) * 100
  );

  // --- Event Resilience Score (0-100) ---
  // Measure: did cash stay positive despite events?
  const negativeQuarters = records.filter((r) => r.cashBalanceEnd < 0).length;
  const resilienceScore = Math.max(
    0,
    100 - (negativeQuarters / Math.max(1, records.length)) * 200
  );

  // --- Weighted Total ---
  const breakdown: ScoreBreakdown = {
    netWorth: Math.round(netWorthScore),
    profitability: Math.round(profitabilityScore),
    sustainability: Math.round(sustainabilityScore),
    subsidyUsage: Math.round(subsidyScore),
    resilience: Math.round(resilienceScore),
  };

  const score = Math.round(
    netWorthScore * 0.4 +
    profitabilityScore * 0.2 +
    sustainabilityScore * 0.2 +
    subsidyScore * 0.1 +
    resilienceScore * 0.1
  );

  let grade: string;
  if (score > 80) grade = "A";
  else if (score > 60) grade = "B";
  else if (score > 40) grade = "C";
  else if (score > 20) grade = "D";
  else grade = "F";

  return { score, grade, breakdown };
}

/**
 * Calculate improvement streak: consecutive quarters of positive net result.
 */
export function calculateStreak(state: GameState): number {
  let streak = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    if (state.history[i].financialRecord.netResult > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
