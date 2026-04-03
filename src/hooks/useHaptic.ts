"use client";

type HapticPattern = "tap" | "success" | "error" | "advance";

const patterns: Record<HapticPattern, number | number[]> = {
  tap: 10,
  success: [50, 30, 100],
  error: [100, 50, 100],
  advance: 30,
};

export function useHaptic() {
  return (pattern: HapticPattern) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(patterns[pattern]);
      }
    } catch {
      // Haptics not supported -- silently ignore
    }
  };
}
