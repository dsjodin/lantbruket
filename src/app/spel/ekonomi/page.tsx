"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
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

  // Revenue breakdown for bar
  const revenueBreakdown = [
    { name: "Grödor", value: agg.rev.cropSales, color: "#16a34a" },
    { name: "Djur", value: agg.rev.livestockIncome, color: "#2563eb" },
    { name: "EU-stöd", value: agg.rev.subsidies, color: "#9333ea" },
    { name: "Övrigt", value: agg.rev.other, color: "#6b7280" },
  ].filter((r) => r.value > 0);

  // Cost breakdown
  const costBreakdown = [
    { name: "Utsäde", value: agg.cost.seeds },
    { name: "Gödsel", value: agg.cost.fertilizer },
    { name: "Bränsle", value: agg.cost.fuel },
    { name: "Maskiner", value: agg.cost.machinery },
    { name: "Foder", value: agg.cost.feed },
    { name: "Veterinär", value: agg.cost.veterinary },
    { name: "Löner", value: agg.cost.salaries },
    { name: "Ränta", value: agg.cost.loanInterest },
    { name: "Amortering", value: agg.cost.loanAmortization },
    { name: "Försäkring", value: agg.cost.insurance },
    { name: "Underhåll", value: agg.cost.buildingMaintenance },
    { name: "Övrigt", value: agg.cost.other },
  ].filter((c) => c.value > 0);

  const maxCost = Math.max(...costBreakdown.map((c) => c.value), 1);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Ekonomi</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card accent="green">
          <div className="text-sm text-stone-500">Kassa</div>
          <div className={`text-xl font-bold ${finances.cashBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
            {fmt(finances.cashBalance)}
          </div>
        </Card>
        <Card accent="red">
          <div className="text-sm text-stone-500">Skuld</div>
          <div className="text-xl font-bold text-red-600">{fmt(totalDebt)}</div>
        </Card>
        <Card accent="blue">
          <div className="text-sm text-stone-500">Nettovärde</div>
          <div className="text-xl font-bold text-blue-700">
            {fmt(finances.cashBalance - totalDebt)}
          </div>
        </Card>
        <Card accent={profitMargin >= 0 ? "green" : "red"}>
          <div className="text-sm text-stone-500">Vinstmarginal</div>
          <div className={`text-xl font-bold ${profitMargin >= 0 ? "text-green-700" : "text-red-600"}`}>
            {pct(profitMargin)}
          </div>
          <div className="text-xs text-stone-400">{tabLabel}</div>
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

      {/* Income statement */}
      {selectedRecords.length > 0 && (
        <Card title={`Resultaträkning — ${tabLabel}`}>
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

            {/* Costs */}
            <div>
              <div className="text-sm font-semibold text-red-700 mb-2">Kostnader</div>
              <div className="space-y-1">
                {costBreakdown.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="text-stone-600 w-24">{c.name}</span>
                    <div className="flex-1 bg-stone-100 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${(c.value / maxCost) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium w-28 text-right">{fmt(c.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-stone-200 pt-1 mt-1">
                  <span>Summa kostnader</span>
                  <span className="text-red-600">{fmt(agg.totalCost)}</span>
                </div>
              </div>
            </div>

            {/* Net result */}
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              agg.net >= 0 ? "bg-green-50" : "bg-red-50"
            }`}>
              <span className="font-bold text-lg">Nettoresultat</span>
              <span className={`font-bold text-lg ${agg.net >= 0 ? "text-green-700" : "text-red-600"}`}>
                {agg.net >= 0 ? "+" : ""}{fmt(agg.net)}
              </span>
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
                <Tooltip formatter={(v) => typeof v === "number" ? fmt(v) : v} />
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="py-2 text-stone-500 font-medium">Kvartal</th>
                  <th className="py-2 text-stone-500 font-medium text-right">Ingående</th>
                  <th className="py-2 text-stone-500 font-medium text-right">Intäkter</th>
                  <th className="py-2 text-stone-500 font-medium text-right">Kostnader</th>
                  <th className="py-2 text-stone-500 font-medium text-right">Resultat</th>
                  <th className="py-2 text-stone-500 font-medium text-right">Utgående</th>
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
