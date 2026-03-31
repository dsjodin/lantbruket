"use client";

import { Quarter } from "@/types/enums";
import { useGameStore } from "@/store/gameStore";
import { calculateScore } from "@/engine/scoring";
import QuarterBanner from "./QuarterBanner";

interface TopBarProps {
  quarter: Quarter;
  year: number;
  cashBalance: number;
  farmName: string;
  onSave: () => void;
  onAdvanceQuarter: () => void;
  phase: string;
}

function formatKr(amount: number): string {
  return amount.toLocaleString("sv-SE") + " kr";
}

const gradeColors: Record<string, string> = {
  A: "text-green-700 bg-green-100 border-green-300",
  B: "text-blue-700 bg-blue-100 border-blue-300",
  C: "text-amber-700 bg-amber-100 border-amber-300",
  D: "text-orange-700 bg-orange-100 border-orange-300",
  F: "text-red-700 bg-red-100 border-red-300",
};

export default function TopBar({
  quarter,
  year,
  cashBalance,
  farmName,
  onSave,
  onAdvanceQuarter,
  phase,
}: TopBarProps) {
  const state = useGameStore((s) => s.state);
  const { grade, score } = state ? calculateScore(state) : { grade: "C", score: 50 };

  return (
    <div className="bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="font-bold text-stone-700">{farmName}</h2>
        <QuarterBanner quarter={quarter} year={year} />
      </div>

      <div className="flex items-center gap-4">
        {/* Farm grade */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${gradeColors[grade] || gradeColors.C}`} title={`Betyg: ${score}/100`}>
          <span className="text-sm font-black">{grade}</span>
          <span className="text-xs font-medium opacity-70">{score}</span>
        </div>

        <div className="text-right">
          <div className="text-xs text-stone-500">Kassa</div>
          <div
            className={`font-bold ${cashBalance >= 0 ? "text-green-700" : "text-red-600"}`}
          >
            {formatKr(cashBalance)}
          </div>
        </div>

        <button
          onClick={onSave}
          className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
        >
          Spara
        </button>

        <button
          onClick={onAdvanceQuarter}
          disabled={phase !== "decisions"}
          className="px-4 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Avsluta kvartal
        </button>
      </div>
    </div>
  );
}
