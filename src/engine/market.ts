/**
 * Market price generation with gaussian fluctuation.
 */

import { CropType, type Quarter } from "@/types";
import { BASE_PRICES, PRICE_VOLATILITY } from "@/data/prices";
import { createRandom } from "@/lib/random";

/**
 * Generate market prices for all crop types with seeded randomness.
 * Prices fluctuate around base prices using gaussian distribution,
 * clamped to ±30% of the base price.
 */
export function generateMarketPrices(
  seed: number,
  year: number,
  quarter: Quarter
): Record<CropType, number> {
  const quarterIndex = ["Vår", "Sommar", "Höst", "Vinter"].indexOf(quarter);
  const combinedSeed = seed + year * 23 + quarterIndex * 47;
  const rng = createRandom(combinedSeed);

  const prices = {} as Record<CropType, number>;

  for (const cropType of Object.values(CropType)) {
    const basePrice = BASE_PRICES[cropType];

    if (basePrice === 0) {
      prices[cropType] = 0;
      continue;
    }

    const volatility = PRICE_VOLATILITY[cropType];
    const stddev = basePrice * volatility;
    const fluctuatedPrice = rng.nextGaussian(basePrice, stddev);

    // Clamp to ±30% of base price
    const minPrice = basePrice * 0.7;
    const maxPrice = basePrice * 1.3;
    prices[cropType] = Math.round(Math.max(minPrice, Math.min(maxPrice, fluctuatedPrice)));
  }

  return prices;
}
