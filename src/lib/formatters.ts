/**
 * Swedish currency and unit formatting utilities.
 */

/**
 * Formats a number as Swedish kronor, e.g. "1 234 567 kr".
 * Uses non-breaking space as thousands separator.
 */
export function formatKronor(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return rounded < 0 ? `-${formatted} kr` : `${formatted} kr`;
}

/**
 * Formats a number as tons with Swedish decimal comma, e.g. "7,5 ton".
 */
export function formatTon(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  const str = rounded.toFixed(1).replace(".", ",");
  return `${str} ton`;
}

/**
 * Formats a decimal ratio as a percentage with Swedish decimal comma.
 * Value 0.045 -> "4,5%"
 */
export function formatPercent(value: number): string {
  const percent = Math.round(value * 1000) / 10;
  const str = percent.toFixed(1).replace(".", ",").replace(",0", "");
  // If the result ends with ,0 it was already stripped; handle whole numbers
  return `${str}%`;
}

/**
 * Formats hectares, e.g. "100 ha".
 */
export function formatHektar(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  const str = Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(1).replace(".", ",");
  return `${str} ha`;
}
