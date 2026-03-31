"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ResultatPage() {
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const reset = useGameStore((s) => s.reset);

  if (!state) {
    router.push("/");
    return null;
  }

  const { history, finances, farm, farmName, playerName, currentYear } = state;

  const totalDebt = finances.loans.reduce((s, l) => s + l.remainingPrincipal, 0);
  const netWorth = finances.cashBalance - totalDebt;

  const cashOverTime = history.map((r) => ({
    name: `År ${r.year} ${r.quarter.slice(0, 3)}`,
    Kassa: Math.round(r.financialRecord.cashBalanceEnd),
  }));

  const totalRevenue = history.reduce(
    (s, r) =>
      s +
      r.financialRecord.revenue.cropSales +
      r.financialRecord.revenue.livestockIncome +
      r.financialRecord.revenue.subsidies +
      r.financialRecord.revenue.other,
    0
  );

  const totalCosts = history.reduce((s, r) => {
    const c = r.financialRecord.costs;
    return (
      s +
      c.seeds + c.fertilizer + c.fuel + c.machinery + c.feed +
      c.veterinary + c.salaries + c.loanInterest + c.loanAmortization +
      c.insurance + c.buildingMaintenance + c.other
    );
  }, 0);

  const grade =
    netWorth > 2000000
      ? "A"
      : netWorth > 1000000
        ? "B"
        : netWorth > 0
          ? "C"
          : netWorth > -500000
            ? "D"
            : "F";

  const gradeColors: Record<string, string> = {
    A: "text-green-600",
    B: "text-blue-600",
    C: "text-amber-600",
    D: "text-orange-600",
    F: "text-red-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-stone-800 mb-2">Spelresultat</h1>
          <p className="text-stone-500">
            {playerName} - {farmName} - {currentYear - 1} år
          </p>
        </div>

        <div className="text-center">
          <div className="text-8xl font-bold mb-2">
            <span className={gradeColors[grade]}>{grade}</span>
          </div>
          <p className="text-stone-500">
            {grade === "A" && "Utmärkt lantbrukare! Du har byggt en lönsam och hållbar gård."}
            {grade === "B" && "Bra jobbat! Gården går med vinst och har god potential."}
            {grade === "C" && "Godkänt! Du har klarat dig men det finns förbättringspotential."}
            {grade === "D" && "Svårt. Gården har haft det tufft ekonomiskt."}
            {grade === "F" && "Gården har gått i konkurs. Dags att analysera vad som gick fel."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card accent="green">
            <div className="text-xs text-stone-500">Nettovärde</div>
            <div className={`text-lg font-bold ${netWorth >= 0 ? "text-green-700" : "text-red-600"}`}>
              {Math.round(netWorth).toLocaleString("sv-SE")} kr
            </div>
          </Card>
          <Card accent="blue">
            <div className="text-xs text-stone-500">Total intäkt</div>
            <div className="text-lg font-bold text-blue-700">
              {Math.round(totalRevenue).toLocaleString("sv-SE")} kr
            </div>
          </Card>
          <Card accent="red">
            <div className="text-xs text-stone-500">Total kostnad</div>
            <div className="text-lg font-bold text-red-600">
              {Math.round(totalCosts).toLocaleString("sv-SE")} kr
            </div>
          </Card>
          <Card accent="amber">
            <div className="text-xs text-stone-500">Djur vid avslut</div>
            <div className="text-lg font-bold">
              {farm.livestock.reduce((s, h) => s + h.count, 0)} st
            </div>
          </Card>
        </div>

        {cashOverTime.length > 0 && (
          <Card title="Kassautveckling">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => typeof v === "number" ? v.toLocaleString("sv-SE") + " kr" : v} />
                  <Line type="monotone" dataKey="Kassa" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => { reset(); router.push("/ny-gard"); }}>
            Spela igen
          </Button>
          <Button size="lg" variant="secondary" onClick={() => { reset(); router.push("/"); }}>
            Tillbaka till start
          </Button>
        </div>
      </div>
    </div>
  );
}
