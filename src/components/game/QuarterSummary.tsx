"use client";

import { type QuarterResult } from "@/store/gameStore";

interface QuarterSummaryProps {
  result: QuarterResult;
  onContinue: () => void;
}

const weatherInfo: Record<string, { icon: string; label: string; color: string }> = {
  Normalt: { icon: "🌤", label: "Normalt väder", color: "text-stone-600" },
  Torka: { icon: "🔥", label: "Torka", color: "text-orange-600" },
  Översvämning: { icon: "🌊", label: "Översvämning", color: "text-blue-600" },
  Frost: { icon: "🥶", label: "Frost", color: "text-cyan-600" },
  Utmärkt: { icon: "☀️", label: "Utmärkt väder", color: "text-green-600" },
};

const seasonStyles: Record<string, { bg: string; border: string; accent: string }> = {
  "Vår": { bg: "from-green-50 to-emerald-50", border: "border-green-200", accent: "text-green-700" },
  "Sommar": { bg: "from-yellow-50 to-amber-50", border: "border-yellow-200", accent: "text-yellow-700" },
  "Höst": { bg: "from-orange-50 to-amber-50", border: "border-orange-200", accent: "text-orange-700" },
  "Vinter": { bg: "from-blue-50 to-indigo-50", border: "border-blue-200", accent: "text-blue-700" },
};

const categoryIcons: Record<string, string> = {
  "Väder": "🌦",
  "Marknad": "📈",
  "Sjukdom": "🦠",
  "Politik": "🏛",
  "Maskineri": "🔧",
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

function fmtChange(n: number): string {
  const prefix = n >= 0 ? "+" : "";
  return prefix + fmt(n);
}

export default function QuarterSummary({ result, onContinue }: QuarterSummaryProps) {
  const season = seasonStyles[result.quarter] || seasonStyles["Vår"];
  const weather = weatherInfo[result.weather] || weatherInfo["Normalt"];

  const totalRevenue =
    result.financialRecord.revenue.cropSales +
    result.financialRecord.revenue.livestockIncome +
    result.financialRecord.revenue.subsidies +
    result.financialRecord.revenue.other;

  const totalCosts = Object.values(result.financialRecord.costs).reduce((a, b) => a + b, 0);
  const netResult = result.financialRecord.netResult;

  const harvestedEntries = Object.entries(result.harvestedCrops);
  const hasHarvest = harvestedEntries.length > 0;
  const totalHarvestedTons = harvestedEntries.reduce((s, [, t]) => s + t, 0);

  // Market price changes
  const priceChanges = Object.entries(result.marketPrices)
    .map(([crop, price]) => {
      const prev = result.previousMarketPrices[crop] ?? price;
      const change = prev > 0 ? ((price - prev) / prev) * 100 : 0;
      return { crop, price, prev, change };
    })
    .filter((p) => Math.abs(p.change) > 2 && p.price > 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  // Major revenue/cost items
  const revenueItems = [
    { label: "Grödförsäljning", value: result.financialRecord.revenue.cropSales },
    { label: "Djurhållning", value: result.financialRecord.revenue.livestockIncome },
    { label: "EU-stöd", value: result.financialRecord.revenue.subsidies },
    { label: "Övrigt", value: result.financialRecord.revenue.other },
  ].filter((r) => r.value > 0);

  const costItems = [
    { label: "Utsäde", value: result.financialRecord.costs.seeds },
    { label: "Gödsel", value: result.financialRecord.costs.fertilizer },
    { label: "Bränsle", value: result.financialRecord.costs.fuel },
    { label: "Löner", value: result.financialRecord.costs.salaries },
    { label: "Foder", value: result.financialRecord.costs.feed },
    { label: "Ränta", value: result.financialRecord.costs.loanInterest },
    { label: "Amortering", value: result.financialRecord.costs.loanAmortization },
    { label: "Maskiner", value: result.financialRecord.costs.machinery },
    { label: "Försäkring", value: result.financialRecord.costs.insurance },
    { label: "Underhåll", value: result.financialRecord.costs.buildingMaintenance },
    { label: "Veterinär", value: result.financialRecord.costs.veterinary },
  ].filter((c) => c.value > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`bg-gradient-to-br ${season.bg} rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border ${season.border}`}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${season.accent}`}>
                {result.quarter} - År {result.year}
              </h2>
              <p className="text-sm text-stone-500 mt-1">Kvartalsrapport</p>
            </div>
            <div className={`text-center ${weather.color}`}>
              <span className="text-3xl">{weather.icon}</span>
              <div className="text-xs font-medium mt-1">{weather.label}</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Events */}
          {result.events.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Händelser</h3>
              {result.events.map((event, i) => {
                const isNegative = event.effects.some((e) =>
                  e.type === "directCost" || e.value < 0
                );
                const isPositive = event.effects.some((e) =>
                  e.type === "directIncome" || (e.value > 0 && e.type !== "costModifier")
                );
                const bgColor = isNegative
                  ? "bg-red-50 border-red-200"
                  : isPositive
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200";
                const icon = categoryIcons[event.category] || "📋";

                return (
                  <div key={i} className={`${bgColor} border rounded-lg p-3 flex gap-3`}>
                    <span className="text-xl">{icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-stone-800">{event.title}</div>
                      <div className="text-xs text-stone-600 mt-0.5">{event.description}</div>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {event.effects.map((eff, j) => (
                          <span
                            key={j}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              eff.type === "directCost" || eff.value < 0
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {eff.type === "directCost" && `-${fmt(eff.value)}`}
                            {eff.type === "directIncome" && `+${fmt(eff.value)}`}
                            {eff.type === "yieldModifier" && `${eff.target ? eff.target + ": " : ""}Skörd ${eff.value > 0 ? "+" : ""}${Math.round(eff.value * 100)}%`}
                            {eff.type === "priceModifier" && `${eff.target ? eff.target + ": " : ""}Pris ${eff.value > 0 ? "+" : ""}${Math.round(eff.value * 100)}%`}
                            {eff.type === "costModifier" && `Kostnader +${Math.round(eff.value * 100)}%`}
                            {eff.type === "animalHealth" && `${eff.target ? eff.target + ": " : ""}Djurhälsa ${eff.value > 0 ? "+" : ""}${Math.round(eff.value * 100)}%`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Harvest report */}
          {hasHarvest && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-2">
                Skörd
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {harvestedEntries.map(([crop, tons]) => (
                  <div key={crop} className="flex justify-between text-sm">
                    <span className="text-stone-700">{crop}</span>
                    <span className="font-semibold text-amber-700">{tons.toFixed(1)} ton</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-amber-200 text-sm font-bold text-amber-800 flex justify-between">
                <span>Totalt skördat</span>
                <span>{totalHarvestedTons.toFixed(1)} ton</span>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-white/80 border border-stone-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">
              Resultaträkning
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Revenue */}
              <div>
                <div className="text-xs font-semibold text-green-700 mb-1.5">Intäkter</div>
                {revenueItems.map((r) => (
                  <div key={r.label} className="flex justify-between text-xs py-0.5">
                    <span className="text-stone-500">{r.label}</span>
                    <span className="text-stone-700">{fmt(r.value)}</span>
                  </div>
                ))}
                {revenueItems.length === 0 && (
                  <div className="text-xs text-stone-400">Inga intäkter</div>
                )}
                <div className="flex justify-between text-sm font-bold mt-1.5 pt-1.5 border-t border-stone-200">
                  <span className="text-green-700">Totalt</span>
                  <span className="text-green-700">{fmt(totalRevenue)}</span>
                </div>
              </div>

              {/* Costs */}
              <div>
                <div className="text-xs font-semibold text-red-700 mb-1.5">Kostnader</div>
                {costItems.map((c) => (
                  <div key={c.label} className="flex justify-between text-xs py-0.5">
                    <span className="text-stone-500">{c.label}</span>
                    <span className="text-stone-700">{fmt(c.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold mt-1.5 pt-1.5 border-t border-stone-200">
                  <span className="text-red-700">Totalt</span>
                  <span className="text-red-700">-{fmt(totalCosts)}</span>
                </div>
              </div>
            </div>

            {/* Net Result */}
            <div className={`mt-4 pt-3 border-t-2 ${netResult >= 0 ? "border-green-300" : "border-red-300"} flex justify-between items-center`}>
              <span className="font-bold text-stone-800">Nettoresultat</span>
              <span className={`text-xl font-bold ${netResult >= 0 ? "text-green-700" : "text-red-600"}`}>
                {fmtChange(netResult)}
              </span>
            </div>
          </div>

          {/* Cash summary */}
          <div className={`rounded-lg p-4 flex items-center justify-between ${result.cashChange >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div>
              <div className="text-xs text-stone-500">Kassa</div>
              <div className="text-sm text-stone-600">
                {fmt(result.previousCash)} &rarr; <span className="font-bold text-stone-800">{fmt(result.newCash)}</span>
              </div>
            </div>
            <div className={`text-lg font-bold ${result.cashChange >= 0 ? "text-green-700" : "text-red-600"}`}>
              {fmtChange(result.cashChange)}
            </div>
          </div>

          {/* Market price changes */}
          {priceChanges.length > 0 && (
            <div className="bg-white/60 border border-stone-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-2">
                Marknadspriser
              </h3>
              <div className="space-y-1">
                {priceChanges.map((p) => (
                  <div key={p.crop} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{p.crop}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 text-xs">{p.prev} kr/ton</span>
                      <span className="text-stone-400">&rarr;</span>
                      <span className="font-medium text-stone-800">{p.price} kr/ton</span>
                      <span className={`text-xs font-bold ${p.change > 0 ? "text-green-600" : "text-red-600"}`}>
                        {p.change > 0 ? "▲" : "▼"} {Math.abs(Math.round(p.change))}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Continue button */}
        <div className="px-6 py-4 border-t border-stone-200/50">
          <button
            onClick={onContinue}
            className={`w-full py-3 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.01] active:scale-[0.99] ${
              netResult >= 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-stone-700 hover:bg-stone-800"
            }`}
          >
            Fortsätt &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
