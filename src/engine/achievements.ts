import type { GameState } from "@/types";
import { ACHIEVEMENTS, type AchievementDef } from "@/data/achievements";
import { calculateScore } from "./scoring";

/**
 * Check which achievements are newly unlocked after a state change.
 * Returns only achievements that are new (not already in unlockedAchievements).
 */
export function checkAchievements(
  state: GameState,
  alreadyUnlocked: string[]
): AchievementDef[] {
  const unlocked = new Set(alreadyUnlocked);
  const newlyUnlocked: AchievementDef[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;

    // Special case: grade_a needs score calculation
    if (achievement.id === "grade_a") {
      const { grade } = calculateScore(state);
      if (grade === "A") {
        newlyUnlocked.push(achievement);
      }
      continue;
    }

    try {
      if (achievement.check(state)) {
        newlyUnlocked.push(achievement);
      }
    } catch {
      // Skip achievements that fail to check (missing data etc)
    }
  }

  return newlyUnlocked;
}
