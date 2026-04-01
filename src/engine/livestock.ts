/**
 * Livestock revenue, cost, and health calculations.
 */

import type { LivestockHerd, AnimalType } from "@/types";
import { LIVESTOCK_DATA } from "@/data/livestock";

/**
 * Calculate total quarterly revenue from all livestock herds.
 * Annual revenue / 4, scaled by production modifier and health.
 */
export function calculateQuarterlyLivestockRevenue(herds: LivestockHerd[]): number {
  return herds.reduce((total, herd) => {
    const data = LIVESTOCK_DATA[herd.type];
    const quarterlyPerAnimal = data.annualRevenue / 4;
    return total + quarterlyPerAnimal * herd.count * herd.productionModifier * herd.healthStatus;
  }, 0);
}

/**
 * Calculate quarterly costs broken down by category for all herds.
 * All costs are annual / 4.
 */
export function calculateQuarterlyLivestockCosts(
  herds: LivestockHerd[]
): { feed: number; veterinary: number; housing: number } {
  let feed = 0;
  let veterinary = 0;
  let housing = 0;

  for (const herd of herds) {
    const data = LIVESTOCK_DATA[herd.type];
    feed += (data.annualFeedCost / 4) * herd.count;
    veterinary += (data.annualVetCost / 4) * herd.count;
    housing += (data.housingCost / 4) * herd.count;
  }

  return { feed, veterinary, housing };
}

/**
 * Apply a health change to livestock herds, returning new array.
 * Health is clamped to [0, 1]. Optionally targets a specific animal type.
 */
export function applyHealthChange(
  herds: LivestockHerd[],
  healthDelta: number,
  targetType?: AnimalType
): LivestockHerd[] {
  return herds.map((herd) => {
    if (targetType && herd.type !== targetType) {
      return herd;
    }
    return {
      ...herd,
      healthStatus: Math.max(0, Math.min(1, herd.healthStatus + healthDelta)),
    };
  });
}

/**
 * Calculate worker effect on animal health based on staffing level.
 * Good staffing slowly improves health; understaffing degrades it.
 */
export function getWorkerHealthEffect(employees: number, totalAnimals: number): number {
  if (totalAnimals === 0) return 0;
  const animalsPerWorker = totalAnimals / Math.max(1, employees);
  if (animalsPerWorker <= 30) return 0.01;    // Bra: +1% hälsa/kvartal
  if (animalsPerWorker <= 60) return 0;        // Normalt
  if (animalsPerWorker <= 100) return -0.01;   // Underbemannat: -1%
  return -0.02;                                 // Allvarligt underbemannat: -2%
}
