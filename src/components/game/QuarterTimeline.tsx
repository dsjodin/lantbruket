"use client";

import { useGameStore } from "@/store/gameStore";
import { Quarter } from "@/types/enums";

const quarterOrder = [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter];

const quarterShort: Record<string, string> = {
  [Quarter.Var]: "V",
  [Quarter.Sommar]: "S",
  [Quarter.Host]: "H",
  [Quarter.Vinter]: "Vi",
};

export default function QuarterTimeline() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const totalQuarters = state.totalYears * 4;
  const currentIndex =
    (state.currentYear - 1) * 4 + quarterOrder.indexOf(state.currentQuarter);

  // Build quarter nodes
  const nodes: { year: number; quarter: Quarter; index: number; netResult?: number }[] = [];
  for (let y = 1; y <= state.totalYears; y++) {
    for (const q of quarterOrder) {
      const idx = (y - 1) * 4 + quarterOrder.indexOf(q);
      const historyEntry = state.history[idx];
      nodes.push({
        year: y,
        quarter: q,
        index: idx,
        netResult: historyEntry?.financialRecord.netResult,
      });
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-hide">
        {nodes.map((node) => {
          const isCurrent = node.index === currentIndex;
          const isPast = node.index < currentIndex;
          const isFuture = node.index > currentIndex;

          let colorClass = "bg-stone-200 border-stone-300";
          if (isPast && node.netResult !== undefined) {
            colorClass = node.netResult >= 0
              ? "bg-green-400 border-green-500"
              : "bg-red-400 border-red-500";
          }
          if (isCurrent) {
            colorClass = "bg-green-600 border-green-700 ring-2 ring-green-300";
          }
          if (isFuture) {
            colorClass = "bg-stone-100 border-stone-200";
          }

          const isYearStart = node.quarter === Quarter.Var;

          return (
            <div key={node.index} className="flex flex-col items-center" title={`${node.quarter} Ar ${node.year}`}>
              {isYearStart && (
                <span className="text-[9px] text-stone-400 mb-0.5 font-medium">
                  {node.year}
                </span>
              )}
              {!isYearStart && <span className="text-[9px] mb-0.5 invisible">.</span>}
              <div
                className={`
                  ${isCurrent ? "w-4 h-4" : "w-2.5 h-2.5"}
                  rounded-full border transition-all
                  ${colorClass}
                `}
              />
              {isCurrent && (
                <span className="text-[8px] text-green-700 font-bold mt-0.5">
                  {quarterShort[node.quarter]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-stone-400 mt-1">
        Kvartal {currentIndex + 1} av {totalQuarters}
      </div>
    </div>
  );
}
