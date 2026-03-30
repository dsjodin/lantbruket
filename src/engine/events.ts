/**
 * Random event generation and effect application.
 */

import type { Quarter, GameEvent, CropType } from "@/types";
import { GAME_EVENTS } from "@/data/events";
import { createRandom } from "@/lib/random";

/**
 * Generate random events for a quarter using seeded randomness.
 * Rolls against each event that can occur this quarter.
 * Returns 0-2 events max per quarter.
 */
export function generateEvents(
  quarter: Quarter,
  seed: number,
  year: number
): GameEvent[] {
  const quarterIndex = ["Vår", "Sommar", "Höst", "Vinter"].indexOf(quarter);
  const combinedSeed = seed + year * 37 + quarterIndex * 53;
  const rng = createRandom(combinedSeed);

  const eligibleEvents = GAME_EVENTS.filter((event) =>
    event.quarters.includes(quarter)
  );

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
