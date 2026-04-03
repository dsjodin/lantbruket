"use client";

import { useEffect, useState } from "react";
import { RARITY_COLORS, type AchievementDef } from "@/data/achievements";

interface AchievementToastProps {
  achievement: AchievementDef;
  onDone: () => void;
}

export default function AchievementToast({ achievement, onDone }: AchievementToastProps) {
  const [exiting, setExiting] = useState(false);
  const colors = RARITY_COLORS[achievement.rarity];

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 3500);
    const doneTimer = setTimeout(onDone, 4000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const rarityLabel = achievement.rarity === "common" ? "Vanlig" : achievement.rarity === "rare" ? "Sallsynt" : "Episk";

  return (
    <div
      className={`
        fixed top-4 right-4 z-[60] max-w-sm w-full pointer-events-auto
        ${exiting ? "animate-[toastSlideOut_400ms_ease-in_forwards]" : "animate-[toastSlideIn_400ms_ease-out]"}
      `}
    >
      <div className={`${colors.bg} border ${colors.border} rounded-xl shadow-lg p-4 flex gap-3 items-start`}>
        {/* Confetti dots */}
        <div className="relative">
          <span className="text-3xl">{achievement.icon}</span>
          {achievement.rarity !== "common" && (
            <>
              <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-amber-400 animate-[confettiBurst_600ms_ease-out_forwards]" />
              <span className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-green-400 animate-[confettiBurst_600ms_ease-out_100ms_forwards]" />
              <span className="absolute top-0 -right-1 w-2 h-2 rounded-full bg-blue-400 animate-[confettiBurst_600ms_ease-out_200ms_forwards]" />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Prestation</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
              {rarityLabel}
            </span>
          </div>
          <div className={`font-bold text-sm mt-0.5 ${colors.text}`}>{achievement.title}</div>
          <div className="text-xs text-stone-500 mt-0.5">{achievement.description}</div>
        </div>
      </div>
    </div>
  );
}
