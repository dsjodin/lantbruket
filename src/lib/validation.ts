/**
 * Validation helpers for farm actions.
 */

import type { Farm, Field } from "@/types";
import type { LivestockHerd } from "@/types";
import { LIVESTOCK_DATA } from "@/data/livestock";

/** Check if a cash balance can cover a cost */
export function canAfford(cash: number, cost: number): boolean {
  return cash >= cost;
}

/** Check if the farm has enough unused land for the required hectares */
export function hasEnoughLand(farm: Farm, requiredHa: number): boolean {
  return getAvailableHectares(farm) >= requiredHa;
}

/** Sum up all hectares currently used by fields */
export function getUsedHectares(fields: Field[]): number {
  return fields.reduce((sum, field) => sum + field.hectares, 0);
}

/** Calculate remaining available hectares on the farm */
export function getAvailableHectares(farm: Farm): number {
  const used = getUsedHectares(farm.fields);
  return Math.max(0, farm.totalHectares - used);
}

/** Calculate total grazing/land need for all livestock herds */
export function getLivestockGrazingNeed(livestock: LivestockHerd[]): number {
  return livestock.reduce((total, herd) => {
    const data = LIVESTOCK_DATA[herd.type];
    return total + herd.count * data.requiredHectaresPerAnimal;
  }, 0);
}
