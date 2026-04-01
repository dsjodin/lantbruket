/**
 * Market price generation with trends, seasonal effects, and mean-reversion.
 */

import { CropType, Quarter, type Quarter as QuarterType } from "@/types";
import { BASE_PRICES, PRICE_VOLATILITY } from "@/data/prices";
import { createRandom } from "@/lib/random";

/**
 * Seasonal price modifier per quarter.
 * Harvest quarter (Höst) has lower prices due to supply glut.
 * Late winter/spring has higher prices due to scarcity.
 */
const SEASONAL_MODIFIERS: Record<string, number> = {
  [Quarter.Var]: 0.03,     // Vår: knapphet → +3%
  [Quarter.Sommar]: 0.01,  // Sommar: neutral-positiv
  [Quarter.Host]: -0.05,   // Höst: skördepress → -5%
  [Quarter.Vinter]: 0.02,  // Vinter: lagring → +2%
};

/**
 * Generate market prices with trend momentum, seasonal effects, and mean-reversion.
 *
 * Price model per crop:
 * 1. Seasonal component: fixed modifier per quarter
 * 2. Trend momentum: 30% of previous quarter's price movement continues
 * 3. Mean-reversion: 15% pull back toward base price when >20% deviation
 * 4. Random noise: gaussian with reduced volatility (60% of original)
 * 5. Clamp to ±40% of base price
 */
export function generateMarketPrices(
  seed: number,
  year: number,
  quarter: QuarterType,
  previousPrices?: Record<CropType, number>
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
    const prevPrice = previousPrices?.[cropType] ?? basePrice;

    // 1. Seasonal modifier
    const seasonal = SEASONAL_MODIFIERS[quarter] ?? 0;

    // 2. Trend momentum: 30% of previous movement continues
    const prevMovement = (prevPrice - basePrice) / basePrice;
    const momentum = prevMovement * 0.30;

    // 3. Mean-reversion: pull back toward base when far away
    const deviation = (prevPrice - basePrice) / basePrice;
    const meanReversion = Math.abs(deviation) > 0.15
      ? -deviation * 0.15
      : 0;

    // 4. Random noise (reduced: 60% of original volatility)
    const stddev = basePrice * volatility * 0.6;
    const noise = (rng.nextGaussian(0, stddev)) / basePrice;

    // Combine all effects
    const totalChange = seasonal + momentum + meanReversion + noise;
    const newPrice = prevPrice * (1 + totalChange);

    // Clamp to ±40% of base price
    const minPrice = basePrice * 0.6;
    const maxPrice = basePrice * 1.4;
    prices[cropType] = Math.round(Math.max(minPrice, Math.min(maxPrice, newPrice)));
  }

  return prices;
}
