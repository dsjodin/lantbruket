"use client";

import { Quarter } from "@/types/enums";
import type { GameState } from "@/types";

interface SeasonBriefingProps {
  state: GameState;
  onDismiss: () => void;
}

const seasonInfo: Record<string, { icon: string; color: string; bg: string; greeting: string }> = {
  [Quarter.Var]: {
    icon: "🌱",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    greeting: "Varen ar har!",
  },
  [Quarter.Sommar]: {
    icon: "☀️",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
    greeting: "Sommaren ar har!",
  },
  [Quarter.Host]: {
    icon: "🍂",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    greeting: "Hosten ar har!",
  },
  [Quarter.Vinter]: {
    icon: "❄️",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    greeting: "Vintern ar har!",
  },
};

function getTips(state: GameState): string[] {
  const tips: string[] = [];
  const q = state.currentQuarter;

  // Season-specific tips
  if (q === Quarter.Var) {
    const emptyFields = state.farm.fields.filter((f) => !f.crop);
    if (emptyFields.length > 0) {
      tips.push(`Du har ${emptyFields.length} lediga falt -- dags att sa!`);
    }
    tips.push("Var ar basta tiden for varsadd (korn, havre, potatis).");
  } else if (q === Quarter.Sommar) {
    const stored = Object.values(state.farm.storage || {}).reduce((a, b) => a + b, 0);
    if (stored > 0) {
      tips.push("Kolla marknadspriserna -- kanske dags att salja spannmal?");
    }
    tips.push("Grodorna vaxer. Planera for hostens skord.");
  } else if (q === Quarter.Host) {
    const harvestable = state.farm.fields.filter((f) => f.status === "Sk\u00f6rdeklar" || f.status === "V\u00e4xande");
    if (harvestable.length > 0) {
      tips.push(`${harvestable.length} falt ar redo for skord.`);
    }
    tips.push("Hosten ar bra for hostsadd (hostvete, hostraps).");
  } else if (q === Quarter.Vinter) {
    tips.push("Sok EU-stod nu -- ansokningsperioden ar oppen!");
    tips.push("Se over ekonomin och planera infor varen.");
  }

  // Context-specific tips
  const lowCondition = (state.farm.machines || []).filter((m) => m.condition < 0.5);
  if (lowCondition.length > 0) {
    tips.push(`${lowCondition.length} maskin(er) behover reparation.`);
  }

  if (state.finances.cashBalance < 0) {
    tips.push("Kassan ar negativ -- overvaeg att ta ett lan.");
  }

  // Market hints
  const prices = state.currentMarketPrices || {};
  const priceHistory = state.priceHistory || {};
  for (const [crop, history] of Object.entries(priceHistory)) {
    if (history.length >= 2) {
      const current = prices[crop] || 0;
      const prev = history[history.length - 2] || 0;
      if (current > prev * 1.15 && current > 0) {
        tips.push(`${crop} har stigit i pris -- bra lage att salja?`);
        break;
      }
    }
  }

  return tips.slice(0, 3);
}

export default function SeasonBriefing({ state, onDismiss }: SeasonBriefingProps) {
  const info = seasonInfo[state.currentQuarter] || seasonInfo[Quarter.Var];
  const tips = getTips(state);

  return (
    <div className={`${info.bg} border rounded-xl p-4 animate-[slideDown_300ms_ease-out] mb-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{info.icon}</span>
          <div>
            <h3 className={`font-bold ${info.color}`}>{info.greeting}</h3>
            <p className="text-sm text-stone-500">
              Ar {state.currentYear} - {state.currentQuarter}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-600 text-lg leading-none p-1"
        >
          &times;
        </button>
      </div>

      {tips.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-stone-400 mt-0.5">-</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
