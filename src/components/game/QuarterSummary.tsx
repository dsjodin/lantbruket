"use client";

import { type QuarterResult } from "@/store/gameStore";
import Tooltip from "@/components/ui/Tooltip";
import { GLOSSARY } from "@/data/glossary";

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

function Term({ term, children }: { term: string; children: React.ReactNode }) {
  const explanation = GLOSSARY[term];
  if (!explanation) return <>{children}</>;
  return (
    <Tooltip text={explanation}>
      <span className="underline decoration-dotted decoration-stone-400 cursor-help">{children}</span>
    </Tooltip>
  );
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

  // Revenue items
  const revenueItems = [
    { label: "Grödförsäljning", value: result.financialRecord.revenue.cropSales },
    { label: "Djurhållning", value: result.financialRecord.revenue.livestockIncome },
    { label: "EU-stöd", value: result.financialRecord.revenue.subsidies },
    { label: "Övrigt", value: result.financialRecord.revenue.other },
  ].filter((r) => r.value > 0);

  // Grouped costs
  const c = result.financialRecord.costs;
  const variableCosts = [
    { label: "Utsäde", value: c.seeds },
    { label: "Gödsel", value: c.fertilizer },
    { label: "Bränsle", value: c.fuel },
    { label: "Foder", value: c.feed },
  ].filter((x) => x.value > 0);
  const variableTotal = variableCosts.reduce((s, x) => s + x.value, 0);

  const fixedCosts = [
    { label: "Löner", value: c.salaries },
    { label: "Maskiner", value: c.machinery },
    { label: "Underhåll", value: c.buildingMaintenance },
    { label: "Försäkring", value: c.insurance },
    { label: "Veterinär", value: c.veterinary },
    { label: "Lagring", value: c.storageCosts ?? 0 },
    { label: "Övrigt", value: c.other },
  ].filter((x) => x.value > 0);
  const fixedTotal = fixedCosts.reduce((s, x) => s + x.value, 0);

  const financialCosts = [
    { label: "Ränta", value: c.loanInterest },
    { label: "Amortering", value: c.loanAmortization },
  ].filter((x) => x.value > 0);
  const financialTotal = financialCosts.reduce((s, x) => s + x.value, 0);

  // Biggest cost for insight
  const allCostItems = [...variableCosts, ...fixedCosts, ...financialCosts].sort((a, b) => b.value - a.value);
  const biggestCost = allCostItems[0];

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
              {totalHarvestedTons > 0 && result.siloCapacity > 0 && (
                <div className="mt-2 text-xs text-amber-700">
                  <div className="flex justify-between">
                    <span>Silokapacitet</span>
                    <span>{result.totalStoredAfter.toFixed(1)} / {result.siloCapacity} ton</span>
                  </div>
                  {result.totalStoredAfter >= result.siloCapacity && (
                    <p className="mt-1 text-amber-600 italic">
                      ⚠ Silon är full — överskottet såldes direkt till marknadspris. Bygg mer lagerkapacitet för att kunna spara och sälja till bättre pris.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== FINANCIAL SUMMARY - single column, grouped ===== */}
          <div className="bg-white/80 border border-stone-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-1">
              <Term term="Resultaträkning">Resultaträkning</Term>
            </h3>
            <p className="text-xs text-stone-400 mb-3">
              Visar vad som kom in (intäkter) och vad som gick ut (kostnader) detta kvartal.
            </p>

            {/* --- INTÄKTER --- */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-700">
                  <Term term="Bruttointäkt">Intäkter</Term>
                  <span className="font-normal text-stone-400 ml-1">— pengar in</span>
                </span>
              </div>
              {revenueItems.length > 0 ? (
                <div className="space-y-1 ml-4">
                  {revenueItems.map((r) => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-stone-600">{r.label}</span>
                      <span className="font-medium text-green-700">{fmt(r.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-4 text-sm text-stone-400 italic">
                  Inga intäkter detta kvartal. Intäkter kommer från försäljning av grödor, djurprodukter och EU-stöd.
                </div>
              )}
              <div className="flex justify-between text-sm font-bold mt-2 ml-4 pt-2 border-t border-green-200">
                <span className="text-green-700">Summa intäkter</span>
                <span className="text-green-700">{fmt(totalRevenue)}</span>
              </div>
            </div>

            {/* --- KOSTNADER --- */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-700">
                  <Term term="Driftskostnad">Kostnader</Term>
                  <span className="font-normal text-stone-400 ml-1">— pengar ut</span>
                </span>
              </div>

              {/* Rörliga kostnader */}
              {variableCosts.length > 0 && (
                <div className="ml-4 mb-3">
                  <div className="text-xs font-medium text-stone-500 mb-1">
                    <Term term="Särkostnad">Rörliga kostnader</Term>
                    <span className="font-normal text-stone-400"> — beror på vad du odlar/har</span>
                  </div>
                  {variableCosts.map((x) => (
                    <div key={x.label} className="flex justify-between text-sm py-0.5">
                      <span className="text-stone-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" />
                        {x.label}
                      </span>
                      <span className="text-stone-700">{fmt(x.value)}</span>
                    </div>
                  ))}
                  <div className="text-xs text-right text-stone-400 mt-0.5">
                    = {fmt(variableTotal)}
                  </div>
                </div>
              )}

              {/* Fasta kostnader */}
              {fixedCosts.length > 0 && (
                <div className="ml-4 mb-3">
                  <div className="text-xs font-medium text-stone-500 mb-1">
                    <Term term="Samkostnad">Fasta kostnader</Term>
                    <span className="font-normal text-stone-400"> — finns oavsett produktion</span>
                  </div>
                  {fixedCosts.map((x) => (
                    <div key={x.label} className="flex justify-between text-sm py-0.5">
                      <span className="text-stone-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" />
                        {x.label}
                      </span>
                      <span className="text-stone-700">{fmt(x.value)}</span>
                    </div>
                  ))}
                  <div className="text-xs text-right text-stone-400 mt-0.5">
                    = {fmt(fixedTotal)}
                  </div>
                </div>
              )}

              {/* Finansiella kostnader */}
              {financialCosts.length > 0 && (
                <div className="ml-4 mb-3">
                  <div className="text-xs font-medium text-stone-500 mb-1">
                    <Term term="Ränta">Lånekostnader</Term>
                    <span className="font-normal text-stone-400"> — för att ha lånat pengar</span>
                  </div>
                  {financialCosts.map((x) => (
                    <div key={x.label} className="flex justify-between text-sm py-0.5">
                      <span className="text-stone-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" />
                        <Term term={x.label}>{x.label}</Term>
                      </span>
                      <span className="text-stone-700">{fmt(x.value)}</span>
                    </div>
                  ))}
                  <div className="text-xs text-right text-stone-400 mt-0.5">
                    = {fmt(financialTotal)}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold ml-4 pt-2 border-t border-red-200">
                <span className="text-red-700">Summa kostnader</span>
                <span className="text-red-700">-{fmt(totalCosts)}</span>
              </div>
            </div>

            {/* --- NETTORESULTAT --- */}
            <div className={`p-3 rounded-lg ${netResult >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg text-stone-800">
                    <Term term="Nettointäkt">Resultat</Term>
                  </span>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {netResult >= 0 ? "Intäkter minus kostnader = vinst" : "Intäkter minus kostnader = förlust"}
                  </div>
                </div>
                <span className={`text-2xl font-bold ${netResult >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {fmtChange(netResult)}
                </span>
              </div>
            </div>
          </div>

          {/* Cash summary */}
          <div className={`rounded-lg p-4 ${result.cashChange >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-500 font-medium">
                  <Term term="Kassaflöde">Din kassa (pengarna på kontot)</Term>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-stone-500">{fmt(result.previousCash)}</span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="text-lg font-bold text-stone-800">{fmt(result.newCash)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${result.cashChange >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {fmtChange(result.cashChange)}
                </div>
                <div className="text-xs text-stone-400">
                  {result.cashChange >= 0 ? "ökade" : "minskade"} detta kvartal
                </div>
              </div>
            </div>
          </div>

          {/* Pedagogical insight */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Vad kan du lära dig av detta?</div>
            <div className="text-sm text-blue-800 space-y-1">
              {totalRevenue === 0 && totalCosts > 0 && (
                <p>Du hade inga intäkter men kostnader på {fmt(totalCosts)}. Det är vanligt tidigt — du måste investera i utsäde och gödsel innan du kan skörda och sälja.</p>
              )}
              {totalRevenue > 0 && netResult >= 0 && (
                <p>
                  Bra kvartal! Du gick med {fmt(netResult)} i vinst.
                  {revenueItems[0] && ` Största intäktskällan var ${revenueItems[0].label.toLowerCase()} (${Math.round((revenueItems[0].value / totalRevenue) * 100)}%).`}
                </p>
              )}
              {totalRevenue > 0 && netResult < 0 && (
                <p>Förlust på {fmt(Math.abs(netResult))}. Intäkterna ({fmt(totalRevenue)}) räckte inte för att täcka kostnaderna ({fmt(totalCosts)}).</p>
              )}
              {biggestCost && totalCosts > 0 && (
                <p>
                  Största kostnaden: <strong>{biggestCost.label.toLowerCase()}</strong> ({fmt(biggestCost.value)} = {Math.round((biggestCost.value / totalCosts) * 100)}% av alla kostnader).
                  {biggestCost.label === "Löner" && " Har du för många anställda i förhållande till gårdens storlek?"}
                  {biggestCost.label === "Gödsel" && " Gödsling ökar skörden med ~15% men kostar. Räkna på om det lönar sig."}
                  {biggestCost.label === "Foder" && " Foderkostnaden beror på antal djur. Kan du odla eget foder (vall)?"}
                  {biggestCost.label === "Ränta" && " Räntekostnader minskar du genom att amortera mer på lånen."}
                </p>
              )}
            </div>
          </div>

          {/* Market price changes */}
          {priceChanges.length > 0 && (
            <div className="bg-white/60 border border-stone-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-1">
                Marknadspriser
              </h3>
              <p className="text-xs text-stone-400 mb-2">Priserna ändras varje kvartal. Sälj när priset är högt!</p>
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
