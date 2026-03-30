"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

export default function LanPage() {
  const state = useGameStore((s) => s.state);
  const takeLoan = useGameStore((s) => s.takeLoan);
  if (!state) return null;

  const { loans } = state.finances;
  const totalDebt = loans.reduce((s, l) => s + l.remainingPrincipal, 0);
  const totalQuarterlyPayment = loans.reduce((s, l) => s + l.quarterlyPayment, 0);

  const [newAmount, setNewAmount] = useState(500000);
  const [newTerm, setNewTerm] = useState(10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Lån & Finansiering</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card accent="red">
          <div className="text-sm text-stone-500">Total skuld</div>
          <div className="text-xl font-bold text-red-600">
            {totalDebt.toLocaleString("sv-SE")} kr
          </div>
        </Card>
        <Card accent="amber">
          <div className="text-sm text-stone-500">Kvartalsbetalning</div>
          <div className="text-xl font-bold text-amber-600">
            {Math.round(totalQuarterlyPayment).toLocaleString("sv-SE")} kr
          </div>
        </Card>
        <Card accent="green">
          <div className="text-sm text-stone-500">Kassa</div>
          <div className="text-xl font-bold text-green-700">
            {state.finances.cashBalance.toLocaleString("sv-SE")} kr
          </div>
        </Card>
      </div>

      {loans.length > 0 && (
        <Card title="Aktiva lån">
          <Table
            headers={["Urspr. belopp", "Kvar", "Ränta", "Löptid", "Kvartalskostnad"]}
            rows={loans.map((l) => [
              l.principal.toLocaleString("sv-SE") + " kr",
              l.remainingPrincipal.toLocaleString("sv-SE") + " kr",
              (l.annualInterestRate * 100).toFixed(1) + "%",
              l.termYears + " år",
              Math.round(l.quarterlyPayment).toLocaleString("sv-SE") + " kr",
            ])}
          />
        </Card>
      )}

      <Card title="Ta nytt lån">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Belopp: {newAmount.toLocaleString("sv-SE")} kr
            </label>
            <input
              type="range"
              min={100000}
              max={3000000}
              step={100000}
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
              className="w-full accent-green-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Löptid</label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((y) => (
                <button
                  key={y}
                  onClick={() => setNewTerm(y)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    newTerm === y
                      ? "border-green-500 bg-green-50"
                      : "border-stone-200"
                  }`}
                >
                  {y} år
                </button>
              ))}
            </div>
          </div>
          <div className="bg-stone-50 p-3 rounded-lg text-sm space-y-1">
            <div>Ränta: ~5.0%</div>
            <div>
              Kvartalskostnad: ~{Math.round(newAmount / (newTerm * 4) + (newAmount * 0.05) / 4).toLocaleString("sv-SE")} kr
            </div>
          </div>
          <Button
            onClick={() => takeLoan(newAmount, newTerm, 0.05)}
          >
            Ansök om lån
          </Button>
        </div>
      </Card>
    </div>
  );
}
