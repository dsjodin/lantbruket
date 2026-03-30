/**
 * Seeded pseudo-random number generator using the mulberry32 algorithm.
 * Provides deterministic randomness for reproducible game simulations.
 */

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandom(seed: number) {
  const rng = mulberry32(seed);
  let hasSpare = false;
  let spare = 0;

  return {
    /** Returns a float in [0, 1) */
    next(): number {
      return rng();
    },

    /** Returns an integer in [min, max] (inclusive) */
    nextInt(min: number, max: number): number {
      return Math.floor(rng() * (max - min + 1)) + min;
    },

    /** Returns a gaussian-distributed value using Box-Muller transform */
    nextGaussian(mean: number, stddev: number): number {
      if (hasSpare) {
        hasSpare = false;
        return spare * stddev + mean;
      }

      let u: number, v: number, s: number;
      do {
        u = rng() * 2 - 1;
        v = rng() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);

      const mul = Math.sqrt(-2.0 * Math.log(s) / s);
      spare = v * mul;
      hasSpare = true;
      return u * mul * stddev + mean;
    },

    /** Returns true with the given probability (0-1) */
    chance(probability: number): boolean {
      return rng() < probability;
    },
  };
}
