"use client";

import { Quarter } from "@/types/enums";
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

export default function TopBar({
  quarter,
  year,
  cashBalance,
  farmName,
  onSave,
  onAdvanceQuarter,
  phase,
}: TopBarProps) {
  return (
    <div className="bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="font-bold text-stone-700">{farmName}</h2>
        <QuarterBanner quarter={quarter} year={year} />
      </div>

      <div className="flex items-center gap-4">
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
