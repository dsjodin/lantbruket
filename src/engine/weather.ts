/**
 * Weather generation and yield modifier calculation.
 */

import type { Quarter, WeatherCondition } from "@/types";
import { WEATHER_PROBABILITIES, WEATHER_YIELD_MODIFIERS } from "@/data/weather";
import { createRandom } from "@/lib/random";

/**
 * Generate a weather condition for a given quarter using seeded randomness.
 * Different seed per year/quarter combination ensures variety.
 */
export function generateWeather(
  quarter: Quarter,
  seed: number,
  year: number
): WeatherCondition {
  // Combine seed with year and quarter for unique results per period
  const quarterIndex = ["Vår", "Sommar", "Höst", "Vinter"].indexOf(quarter);
  const combinedSeed = seed + year * 17 + quarterIndex * 31;
  const rng = createRandom(combinedSeed);

  const probs = WEATHER_PROBABILITIES[quarter];
  const roll = rng.next();

  let cumulative = 0;
  const conditions: WeatherCondition[] = [
    "Normalt",
    "Torka",
    "Översvämning",
    "Frost",
    "Utmärkt",
  ];

  for (const condition of conditions) {
    cumulative += probs[condition];
    if (roll < cumulative) {
      return condition;
    }
  }

  // Fallback (should not happen if probabilities sum to 1)
  return "Normalt";
}

/**
 * Get the yield modifier for a given weather condition.
 */
export function getYieldModifier(weather: WeatherCondition): number {
  return WEATHER_YIELD_MODIFIERS[weather];
}
