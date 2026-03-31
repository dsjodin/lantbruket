/**
 * Random event generation and effect application.
 */

import type { Quarter, GameEvent, CropType, AnimalType } from "@/types";
import { GAME_EVENTS } from "@/data/events";
import { createRandom } from "@/lib/random";

export interface FarmContext {
  animalTypes: AnimalType[];  // animal types the player actually has
  cropTypes: CropType[];      // crop types currently growing
}

/**
 * Generate random events for a quarter using seeded randomness.
 * Filters out events targeting animals/crops the player doesn't have.
 * Returns 0-2 events max per quarter.
 */
export function generateEvents(
  quarter: Quarter,
  seed: number,
  year: number,
  farmContext?: FarmContext
): GameEvent[] {
  const quarterIndex = ["Vår", "Sommar", "Höst", "Vinter"].indexOf(quarter);
  const combinedSeed = seed + year * 37 + quarterIndex * 53;
  const rng = createRandom(combinedSeed);

  const eligibleEvents = GAME_EVENTS.filter((event) => {
    if (!event.quarters.includes(quarter)) return false;

    if (farmContext) {
      // Skip animal events if player has none of the targeted animals
      const animalEffects = event.effects.filter((e) => e.type === "animalHealth" && e.target);
      if (animalEffects.length > 0) {
        const hasRelevantAnimal = animalEffects.some((e) =>
          farmContext.animalTypes.includes(e.target as AnimalType)
        );
        if (!hasRelevantAnimal && farmContext.animalTypes.length === 0) return false;
        if (animalEffects.length === event.effects.filter((e) => e.type !== "directCost" && e.type !== "directIncome").length && !hasRelevantAnimal) return false;
      }

      // Skip crop-specific events if player doesn't grow those crops
      const cropEffects = event.effects.filter(
        (e) => (e.type === "yieldModifier" || e.type === "priceModifier") && e.target
      );
      if (cropEffects.length > 0 && cropEffects.length === event.effects.length) {
        const hasRelevantCrop = cropEffects.some((e) =>
          farmContext.cropTypes.includes(e.target as CropType)
        );
        if (!hasRelevantCrop) return false;
      }
    }

    return true;
  });

  const triggered: GameEvent[] = [];

  for (const event of eligibleEvents) {
    if (triggered.length >= 2) break;
    if (rng.chance(event.probability)) {
      triggered.push(event);
    }
  }

  return triggered;
}

export interface EventState {
  yieldModifier: number;
  priceModifiers: Record<string, number>;
  costModifier: number;
  healthDelta: number;
  directCashChange: number;
}

/**
 * Apply event effects to a state modifier object.
 * Returns a new state object with the effects applied.
 */
export function applyEventEffects(
  event: GameEvent,
  state: EventState
): EventState {
  let result = { ...state, priceModifiers: { ...state.priceModifiers } };

  for (const effect of event.effects) {
    switch (effect.type) {
      case "yieldModifier":
        result.yieldModifier += effect.value;
        break;
      case "priceModifier":
        if (effect.target) {
          const key = effect.target as string;
          result.priceModifiers[key] = (result.priceModifiers[key] ?? 0) + effect.value;
        }
        break;
      case "costModifier":
        result.costModifier += effect.value;
        break;
      case "animalHealth":
        result.healthDelta += effect.value;
        break;
      case "directCost":
        result.directCashChange -= effect.value;
        break;
      case "directIncome":
        result.directCashChange += effect.value;
        break;
    }
  }

  return result;
}
