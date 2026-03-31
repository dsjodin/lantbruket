/**
 * Swedish farm name generator.
 * Combines traditional prefixes and suffixes to create realistic farm names.
 */

const PREFIXES = [
  "Björk", "Ek", "Sten", "Sol", "Äng", "Lid", "Åker", "Ås", "Lund", "Gran",
  "Häll", "Stor", "Kvarn", "Norr", "Söder", "Väst", "Öster", "Back", "Berg", "Skog",
  "Sjö", "Bäck", "Hag", "Moss", "Sand", "Tall", "Röd", "Vit", "Grön", "Gull",
  "Lin", "Kull", "Ler", "Fur", "Alm",
];

const SUFFIXES = [
  "gården", "torp", "holm", "lunda", "by", "hälla", "ås", "berg",
  "haga", "bäck", "äng", "vik", "hed", "dal", "näs", "bo", "rud",
];

/**
 * Generate a deterministic Swedish farm name from a seed number.
 */
export function generateFarmName(seed: number): string {
  // Simple hash to get two independent indices
  const a = Math.abs(((seed * 2654435761) >>> 0) % PREFIXES.length);
  const b = Math.abs(((seed * 2246822519 + 13) >>> 0) % SUFFIXES.length);
  return PREFIXES[a] + SUFFIXES[b];
}

/**
 * Generate a seed number from a player name string.
 */
export function nameToSeed(name: string): number {
  return name
    .trim()
    .toLowerCase()
    .split("")
    .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0);
}
