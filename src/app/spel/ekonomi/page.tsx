"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import { GLOSSARY } from "@/data/glossary";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

/** Hoverable term with glossary explanation */
function Term({ term, children }: { term: string; children: React.ReactNode }) {
  const explanation = GLOSSARY[term];
  if (!explanation) return <>{children}</>;
  return (
    <Tooltip text={explanation}>
      <span className="underline decoration-dotted decoration-stone-400 cursor-help">{children}</span>
    </Tooltip>
  );
}

type ViewTab = "quarter" | "year" | "total";

export default function EkonomiPage() {
  const state = useGameStore((s) => s.state);
  const [tab, setTab] = useState<ViewTab>("quarter");
  if (!state) return null;

  const { finances, history } = state;
  const totalDebt = finances.loans.reduce((s, l) => s + l.remainingPrincipal, 0);

  // Aggregate helpers
  function sumRecords(records: typeof history) {
    const rev = { cropSales: 0, livestockIncome: 0, subsidies: 0, other: 0 };
    const cost = { seeds: 0, fertilizer: 0, fuel: 0, machinery: 0, feed: 0, veterinary: 0, salaries: 0, loanInterest: 0, loanAmortization: 0, insurance: 0, buildingMaintenance: 0, other: 0 };
    for (const r of records) {
      rev.cropSales += r.financialRecord.revenue.cropSales;
      rev.livestockIncome += r.financialRecord.revenue.livestockIncome;
      rev.subsidies += r.financialRecord.revenue.subsidies;
      rev.other += r.financialRecord.revenue.other;
      cost.seeds += r.financialRecord.costs.seeds;
      cost.fertilizer += r.financialRecord.costs.fertilizer;
      cost.fuel += r.financialRecord.costs.fuel;
      cost.machinery += r.financialRecord.costs.machinery;
      cost.feed += r.financialRecord.costs.feed;
      cost.veterinary += r.financialRecord.costs.veterinary;
      cost.salaries += r.financialRecord.costs.salaries;
      cost.loanInterest += r.financialRecord.costs.loanInterest;
      cost.loanAmortization += r.financialRecord.costs.loanAmortization;
      cost.insurance += r.financialRecord.costs.insurance;
      cost.buildingMaintenance += r.financialRecord.costs.buildingMaintenance;
      cost.other += r.financialRecord.costs.other;
    }
    const totalRev = rev.cropSales + rev.livestockIncome + rev.subsidies + rev.other;
    const totalCost = cost.seeds + cost.fertilizer + cost.fuel + cost.machinery + cost.feed + cost.veterinary + cost.salaries + cost.loanInterest + cost.loanAmortization + cost.insurance + cost.buildingMaintenance + cost.other;
    return { rev, cost, totalRev, totalCost, net: totalRev - totalCost };
  }

  // Current year records
  const yearRecords = history.filter((r) => r.year === state.currentYear);
  const lastRecord = history.length > 0 ? history[history.length - 1] : null;

  // Get data based on tab
  const selectedRecords = tab === "quarter" && lastRecord ? [lastRecord]
    : tab === "year" ? yearRecords
    : history;
  const agg = sumRecords(selectedRecords);

  const profitMargin = agg.totalRev > 0 ? agg.net / agg.totalRev : 0;

  const tabLabel = tab === "quarter" ? "Senaste kvartalet"
    : tab === "year" ? `År ${state.currentYear}`
    : "Totalt";

  // Revenue breakdown
  const revenueBreakdown = [
    { name: "Grödor", value: agg.rev.cropSales, color: "#16a34a" },
    { name: "Djur", value: agg.rev.livestockIncome, color: "#2563eb" },
    { name: "EU-stöd", value: agg.rev.subsidies, color: "#9333ea" },
    { name: "Övrigt", value: agg.rev.other, color: "#6b7280" },
  ].filter((r) => r.value > 0);

  // Cost breakdown - grouped into variable, fixed, financial
  const variableCosts = [
    { name: "Utsäde", value: agg.cost.seeds },
    { name: "Gödsel", value: agg.cost.fertilizer },
    { name: "Bränsle", value: agg.cost.fuel },
    { name: "Foder", value: agg.cost.feed },
  ].filter((c) => c.value > 0);
  const variableTotal = variableCosts.reduce((s, c) => s + c.value, 0);

  const fixedCosts = [
    { name: "Löner", value: agg.cost.salaries },
    { name: "Maskiner", value: agg.cost.machinery },
    { name: "Underhåll", value: agg.cost.buildingMaintenance },
    { name: "Försäkring", value: agg.cost.insurance },
    { name: "Veterinär", value: agg.cost.veterinary },
    { name: "Övrigt", value: agg.cost.other },
  ].filter((c) => c.value > 0);
  const fixedTotal = fixedCosts.reduce((s, c) => s + c.value, 0);

  const financialCosts = [
    { name: "Ränta", value: agg.cost.loanInterest },
    { name: "Amortering", value: agg.cost.loanAmortization },
  ].filter((c) => c.value > 0);
  const financialTotal = financialCosts.reduce((s, c) => s + c.value, 0);

  const allCosts = [...variableCosts, ...fixedCosts, ...financialCosts];
  const maxCost = Math.max(...allCosts.map((c) => c.value), 1);

  // Chart data
  const cashFlowData = history.map((record) => {
    const totalRevenue =
      record.financialRecord.revenue.cropSales +
      record.financialRecord.revenue.livestockIncome +
      record.financialRecord.revenue.subsidies +
      record.financialRecord.revenue.other;
    const totalCosts = Object.values(record.financialRecord.costs).reduce(
      (a: number, b) => a + (typeof b === "number" ? b : 0),
      0
    );
    return {
      name: `${record.quarter.slice(0, 3)} År${record.year}`,
      Intäkter: Math.round(totalRevenue),
      Kostnader: Math.round(-totalCosts),
      Resultat: Math.round(totalRevenue - totalCosts),
    };
  });

  // Key metrics
  const ha = Math.max(1, state.farm.totalHectares);
  const revenuePerHa = agg.totalRev / ha;
  const costPerHa = agg.totalCost / ha;
  const resultPerHa = agg.net / ha;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Ekonomi</h1>

      {/* Quick stats with explanations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card accent="green">
          <div className="text-sm text-stone-500">
            <Term term="Kassaflöde">Kassa</Term>
          </div>
          <div className={`text-xl font-bold ${finances.cashBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
            {fmt(finances.cashBalance)}
          </div>
          <div className="text-xs text-stone-400 mt-1">Pengar på kontot just nu</div>
        </Card>
        <Card accent="red">
          <div className="text-sm text-stone-500">
            <Term term="Amortering">Skuld</Term>
          </div>
          <div className="text-xl font-bold text-red-600">{fmt(totalDebt)}</div>
          <div className="text-xs text-stone-400 mt-1">Återstående lån till banken</div>
        </Card>
        <Card accent="blue">
          <div className="text-sm text-stone-500">
            <Term term="Soliditet">Nettovärde</Term>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {fmt(finances.cashBalance - totalDebt)}
          </div>
          <div className="text-xs text-stone-400 mt-1">Kassa minus skulder</div>
        </Card>
        <Card accent={profitMargin >= 0 ? "green" : "red"}>
          <div className="text-sm text-stone-500">
            <Term term="Nettointäkt">Vinstmarginal</Term>
          </div>
          <div className={`text-xl font-bold ${profitMargin >= 0 ? "text-green-700" : "text-red-600"}`}>
            {pct(profitMargin)}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">
            {profitMargin < 0
              ? "Negativt = du spenderar mer än du tjänar"
              : "Andel av intäkterna som blir vinst"}
          </div>
        </Card>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        {([["quarter", "Senaste kvartal"], ["year", `År ${state.currentYear}`], ["total", "Totalt"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-green-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Income statement with grouped costs */}
      {selectedRecords.length > 0 && (
        <Card title={`Resultaträkning — ${tabLabel}`}>
          <p className="text-xs text-stone-400 -mt-1 mb-3">
            <Term term="Resultaträkning">Resultaträkningen</Term> visar vad du tjänat och vad det kostat under perioden.
          </p>
          <div className="space-y-4">
            {/* Revenue */}
            <div>
              <div className="text-sm font-semibold text-green-700 mb-2">Intäkter</div>
              <div className="space-y-1">
                {revenueBreakdown.map((r) => (
                  <div key={r.name} className="flex justify-between text-sm">
                    <span className="text-stone-600">{r.name}</span>
                    <span className="font-medium">{fmt(r.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-stone-200 pt-1 mt-1">
                  <span>Summa intäkter</span>
                  <span className="text-green-700">{fmt(agg.totalRev)}</span>
                </div>
              </div>
            </div>

            {/* Costs - grouped */}
            <div>
              <div className="text-sm font-semibold text-red-700 mb-2">Kostnader</div>

              {/* Variable costs */}
              {variableCosts.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-stone-500 mb-1">
                    <Term term="Särkostnad">Rörliga kostnader</Term>
                    <span className="font-normal text-stone-400 ml-1">— varierar med produktion</span>
                  </div>
                  <div className="space-y-1">
                    {variableCosts.map((c) => (
                      <CostBar key={c.name} name={c.name} value={c.value} max={maxCost} />
                    ))}
                  </div>
                  <div className="text-xs text-right text-stone-500 mt-1">
                    Delsumma: {fmt(variableTotal)}
                  </div>
                </div>
              )}

              {/* Fixed costs */}
              {fixedCosts.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-stone-500 mb-1">
                    <Term term="Driftskostnad">Fasta kostnader</Term>
                    <span className="font-normal text-stone-400 ml-1">— löpande oavsett produktion</span>
                  </div>
                  <div className="space-y-1">
                    {fixedCosts.map((c) => (
                      <CostBar key={c.name} name={c.name} value={c.value} max={maxCost} />
                    ))}
                  </div>
                  <div className="text-xs text-right text-stone-500 mt-1">
                    Delsumma: {fmt(fixedTotal)}
                  </div>
                </div>
              )}

              {/* Financial costs */}
              {financialCosts.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-stone-500 mb-1">
                    <Term term="Ränta">Finansiella kostnader</Term>
                    <span className="font-normal text-stone-400 ml-1">— kopplade till lån</span>
                  </div>
                  <div className="space-y-1">
                    {financialCosts.map((c) => (
                      <CostBar key={c.name} name={c.name} value={c.value} max={maxCost} />
                    ))}
                  </div>
                  <div className="text-xs text-right text-stone-500 mt-1">
                    Delsumma: {fmt(financialTotal)}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold border-t border-stone-200 pt-1 mt-1">
                <span>Summa kostnader</span>
                <span className="text-red-600">{fmt(agg.totalCost)}</span>
              </div>
            </div>

            {/* Net result */}
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              agg.net >= 0 ? "bg-green-50" : "bg-red-50"
            }`}>
              <span className="font-bold text-lg">
                <Term term="Nettointäkt">Nettoresultat</Term>
              </span>
              <span className={`font-bold text-lg ${agg.net >= 0 ? "text-green-700" : "text-red-600"}`}>
                {agg.net >= 0 ? "+" : ""}{fmt(agg.net)}
              </span>
            </div>

            {/* Contextual learning tip */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <strong>Lärande:</strong>{" "}
              {agg.net < 0
                ? "Kostnaderna överstiger intäkterna. Titta på vilka kostnadsposter som är störst — kan du minska de rörliga kostnaderna eller öka intäkterna genom att sälja vid bättre marknadspriser?"
                : agg.totalRev > 0 && agg.rev.subsidies / agg.totalRev > 0.5
                  ? "Mer än hälften av dina intäkter kommer från EU-stöd. Det är vanligt i svenskt jordbruk, men försök diversifiera inkomstkällorna."
                  : agg.totalRev > 0 && agg.rev.cropSales / agg.totalRev > 0.8
                    ? "Din verksamhet är starkt beroende av växtodling. Överväg djurhållning eller EU-stöd för att sprida riskerna."
                    : "Bra balans i ekonomin! Fortsätt övervaka kostnaderna och leta efter möjligheter att öka marginalen."}
            </div>
          </div>
        </Card>
      )}

      {/* Key metrics */}
      {selectedRecords.length > 0 && (
        <Card title="Nyckeltal — hur går det egentligen?">
          <p className="text-xs text-stone-400 -mt-1 mb-3">
            Nyckeltalen hjälper dig jämföra din gårds prestanda med branschsnitt.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-stone-50 rounded-lg">
              <div className="text-xs text-stone-500">
                <Term term="Bruttointäkt">Intäkt per hektar</Term>
              </div>
              <div className="text-lg font-bold text-stone-800">{fmt(revenuePerHa)}</div>
              <div className="text-xs text-stone-400">Snitt: ~15 000 kr/ha</div>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-lg">
              <div className="text-xs text-stone-500">
                <Term term="Driftskostnad">Kostnad per hektar</Term>
              </div>
              <div className="text-lg font-bold text-stone-800">{fmt(costPerHa)}</div>
              <div className="text-xs text-stone-400">Snitt: ~12 000 kr/ha</div>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-lg">
              <div className="text-xs text-stone-500">
                <Term term="Täckningsbidrag">Resultat per hektar</Term>
              </div>
              <div className={`text-lg font-bold ${resultPerHa >= 0 ? "text-green-700" : "text-red-600"}`}>
                {resultPerHa >= 0 ? "+" : ""}{fmt(resultPerHa)}
              </div>
              <div className="text-xs text-stone-400">Mål: positivt</div>
            </div>
          </div>
        </Card>
      )}

      {/* Chart */}
      {cashFlowData.length > 0 && (
        <Card title="Ekonomisk utveckling">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(v) => typeof v === "number" ? fmt(v) : v} />
                <Legend />
                <Bar dataKey="Intäkter" fill="#16a34a" />
                <Bar dataKey="Kostnader" fill="#dc2626" />
                <Bar dataKey="Resultat" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Cash flow statement */}
      {history.length > 0 && (
        <Card title="Kassaflödesanalys">
          <p className="text-xs text-stone-400 mb-2">
            <Term term="Kassaflöde">Kassaflödesanalysen</Term> visar hur dina pengar rördes varje kvartal.
            Det är normalt att kassan minskar på våren när du köper utsäde och gödsel.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="py-2 text-stone-500 font-medium">Kvartal</th>
                  <th className="py-2 text-stone-500 font-medium text-right">
                    <Tooltip text="Hur mycket pengar du hade när kvartalet började">
                      <span className="cursor-help">Ingående</span>
                    </Tooltip>
                  </th>
                  <th className="py-2 text-stone-500 font-medium text-right">Intäkter</th>
                  <th className="py-2 text-stone-500 font-medium text-right">Kostnader</th>
                  <th className="py-2 text-stone-500 font-medium text-right">Resultat</th>
                  <th className="py-2 text-stone-500 font-medium text-right">
                    <Tooltip text="Hur mycket pengar du hade när kvartalet slutade">
                      <span className="cursor-help">Utgående</span>
                    </Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => {
                  const rev = r.financialRecord.revenue.cropSales + r.financialRecord.revenue.livestockIncome + r.financialRecord.revenue.subsidies + r.financialRecord.revenue.other;
                  const cost = Object.values(r.financialRecord.costs).reduce((a: number, b) => a + (typeof b === "number" ? b : 0), 0);
                  const net = r.financialRecord.netResult;
                  return (
                    <tr key={i} className={`border-b border-stone-100 ${r.year === state.currentYear ? "" : "opacity-60"}`}>
                      <td className="py-1.5 font-medium">{r.quarter.slice(0, 3)} År {r.year}</td>
                      <td className="py-1.5 text-right">{fmt((r.financialRecord.cashBalanceEnd - r.financialRecord.netResult))}</td>
                      <td className="py-1.5 text-right text-green-700">{fmt(rev)}</td>
                      <td className="py-1.5 text-right text-red-600">{fmt(cost)}</td>
                      <td className={`py-1.5 text-right font-medium ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
                        {net >= 0 ? "+" : ""}{fmt(net)}
                      </td>
                      <td className="py-1.5 text-right">{fmt(r.financialRecord.cashBalanceEnd)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/** Cost bar with visual indicator */
function CostBar({ name, value, max }: { name: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-stone-600 w-24">{name}</span>
      <div className="flex-1 bg-stone-100 rounded-full h-2">
        <div
          className="bg-red-400 h-2 rounded-full"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="font-medium w-28 text-right">{fmt(value)}</span>
    </div>
  );
}
