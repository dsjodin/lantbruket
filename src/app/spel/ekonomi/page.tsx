"use client";

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

export default function EkonomiPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { finances, history } = state;
  const lastRecord = history.length > 0 ? history[history.length - 1] : null;

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
    };
  });

  const totalDebt = finances.loans.reduce((s, l) => s + l.remainingPrincipal, 0);

  const revenueRows = lastRecord
    ? [
        ["Grödförsäljning", fmt(lastRecord.financialRecord.revenue.cropSales)],
        ["Djurhållning", fmt(lastRecord.financialRecord.revenue.livestockIncome)],
        ["EU-stöd", fmt(lastRecord.financialRecord.revenue.subsidies)],
        ["Övrigt", fmt(lastRecord.financialRecord.revenue.other)],
      ]
    : [];

  const costRows = lastRecord
    ? [
        ["Utsäde", fmt(lastRecord.financialRecord.costs.seeds)],
        ["Gödsel", fmt(lastRecord.financialRecord.costs.fertilizer)],
        ["Bränsle", fmt(lastRecord.financialRecord.costs.fuel)],
        ["Maskiner", fmt(lastRecord.financialRecord.costs.machinery)],
        ["Foder", fmt(lastRecord.financialRecord.costs.feed)],
        ["Veterinär", fmt(lastRecord.financialRecord.costs.veterinary)],
        ["Löner", fmt(lastRecord.financialRecord.costs.salaries)],
        ["Ränta", fmt(lastRecord.financialRecord.costs.loanInterest)],
        ["Amortering", fmt(lastRecord.financialRecord.costs.loanAmortization)],
        ["Försäkring", fmt(lastRecord.financialRecord.costs.insurance)],
        ["Underhåll", fmt(lastRecord.financialRecord.costs.buildingMaintenance)],
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Ekonomi</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card accent="green">
          <div className="text-sm text-stone-500">Kassa</div>
          <div className={`text-xl font-bold ${finances.cashBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
            {fmt(finances.cashBalance)}
          </div>
        </Card>
        <Card accent="red">
          <div className="text-sm text-stone-500">Total skuld</div>
          <div className="text-xl font-bold text-red-600">{fmt(totalDebt)}</div>
        </Card>
        <Card accent="blue">
          <div className="text-sm text-stone-500">Nettovärde</div>
          <div className="text-xl font-bold text-blue-700">
            {fmt(finances.cashBalance - totalDebt)}
          </div>
        </Card>
      </div>

      {cashFlowData.length > 0 && (
        <Card title="Kassaflöde per kvartal">
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
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {lastRecord && (
          <>
            <Card title="Intäkter (senaste kvartalet)">
              <Table headers={["Post", "Belopp"]} rows={revenueRows} />
            </Card>
            <Card title="Kostnader (senaste kvartalet)">
              <Table headers={["Post", "Belopp"]} rows={costRows} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}
