"use client";

import { useState, useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { assessCreditworthiness } from "@/engine/loans";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

export default function LanPage() {
  const state = useGameStore((s) => s.state);
  const takeLoan = useGameStore((s) => s.takeLoan);
  if (!state) return null;

  const { loans } = state.finances;
  const totalDebt = loans.reduce((s, l) => s + l.remainingPrincipal, 0);
  const totalQuarterlyPayment = loans.reduce((s, l) => s + l.quarterlyPayment, 0);

  const credit = useMemo(() => assessCreditworthiness(state), [state]);

  const [newAmount, setNewAmount] = useState(Math.min(500000, credit.maxBorrowable));
  const [newTerm, setNewTerm] = useState(10);

  const clampedAmount = Math.min(newAmount, credit.maxBorrowable);
  const quarterlyPayment = clampedAmount > 0
    ? Math.round(clampedAmount / (newTerm * 4) + (clampedAmount * credit.interestRate) / 4)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Lån & Finansiering</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card accent="red">
          <div className="text-sm text-stone-500">Total skuld</div>
          <div className="text-xl font-bold text-red-600">
            {fmt(totalDebt)}
          </div>
        </Card>
        <Card accent="amber">
          <div className="text-sm text-stone-500">Kvartalsbetalning</div>
          <div className="text-xl font-bold text-amber-600">
            {fmt(totalQuarterlyPayment)}
          </div>
        </Card>
        <Card accent="green">
          <div className="text-sm text-stone-500">Kassa</div>
          <div className="text-xl font-bold text-green-700">
            {fmt(state.finances.cashBalance)}
          </div>
        </Card>
      </div>

      {/* Credit assessment */}
      <Card title="Kreditbedömning">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              credit.debtToAssetRatio < 0.3 ? "bg-green-500" :
              credit.debtToAssetRatio < 0.5 ? "bg-amber-500" : "bg-red-500"
            }`} />
            <span className="text-sm font-medium">
              Skuldsättningsgrad: {Math.round(credit.debtToAssetRatio * 100)}%
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                credit.debtToAssetRatio < 0.3 ? "bg-green-500" :
                credit.debtToAssetRatio < 0.5 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, credit.debtToAssetRatio * 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-stone-50 p-2 rounded">
              <div className="text-stone-500">Tillgångar</div>
              <div className="font-semibold text-green-700">{fmt(credit.totalAssets)}</div>
            </div>
            <div className="bg-stone-50 p-2 rounded">
              <div className="text-stone-500">Skulder</div>
              <div className="font-semibold text-red-600">{fmt(credit.totalDebt)}</div>
            </div>
          </div>
          {credit.approved ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <span className="font-semibold text-green-700">Kreditvärdighet: God</span>
              <div className="text-green-600 mt-1">
                Max låneutrymme: {fmt(credit.maxBorrowable)} | Ränta: {(credit.interestRate * 100).toFixed(1)}%
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <span className="font-semibold text-red-700">Lån avslaget</span>
              <div className="text-red-600 mt-1">{credit.reason}</div>
            </div>
          )}
        </div>
      </Card>

      {loans.length > 0 && (
        <Card title="Aktiva lån">
          <Table
            headers={["Urspr. belopp", "Kvar", "Ränta", "Löptid", "Kvartalskostnad"]}
            rows={loans.map((l) => [
              fmt(l.principal),
              fmt(l.remainingPrincipal),
              (l.annualInterestRate * 100).toFixed(1) + "%",
              l.termYears + " år",
              fmt(l.quarterlyPayment),
            ])}
          />
        </Card>
      )}

      {credit.approved && (
        <Card title="Ta nytt lån">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Belopp: {fmt(clampedAmount)}
              </label>
              <input
                type="range"
                min={100000}
                max={Math.max(100000, credit.maxBorrowable)}
                step={50000}
                value={clampedAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-xs text-stone-400">
                <span>100 000 kr</span>
                <span>{fmt(credit.maxBorrowable)}</span>
              </div>
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
              <div>Ränta: {(credit.interestRate * 100).toFixed(1)}%</div>
              <div>Kvartalskostnad: ~{fmt(quarterlyPayment)}</div>
              <div className="text-stone-400">
                Total kostnad: ~{fmt(quarterlyPayment * newTerm * 4)}
              </div>
            </div>
            <Button
              onClick={() => takeLoan(clampedAmount, newTerm, credit.interestRate)}
            >
              Ansök om lån
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
