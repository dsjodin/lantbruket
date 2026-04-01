"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { Quarter } from "@/types/enums";
import { REPAIR_COSTS } from "@/data/machinery";
import { getMachineConditionModifier } from "@/engine/crops";
import { calculateScore } from "@/engine/scoring";
import FarmMap from "@/components/game/FarmMap";
import {
  LineChart,
  Line,
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

const seasonTips: Record<string, string> = {
  [Quarter.Var]: "Dags for varsadd! Plantera vargridor, godsla falten och kop djur infor sommaren.",
  [Quarter.Sommar]: "Grodorna vaxer. Bra tillfalle att salja spannmal om priset ar ratt.",
  [Quarter.Host]: "Skorden ar inne! Falt frigors for hostsadd. Sa hostgridor nu.",
  [Quarter.Vinter]: "Sok EU-stod, planera infor varen och se over ekonomin.",
};

const categoryIcons: Record<string, string> = {
  "Väder": "🌦",
  "Marknad": "📈",
  "Sjukdom": "🦠",
  "Politik": "🏛",
  "Maskineri": "🔧",
};

export default function OversiktPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { farm, finances, history, currentQuarter, currentYear } = state;

  const totalAnimals = farm.livestock.reduce((sum, h) => sum + h.count, 0);
  const usedHa = farm.fields
    .filter((f) => f.crop !== null)
    .reduce((sum, f) => sum + f.hectares, 0);

  // Trend calculations
  const lastRecord = history.length > 0 ? history[history.length - 1] : null;
  const prevRecord = history.length > 1 ? history[history.length - 2] : null;
  const cashTrend = lastRecord && prevRecord
    ? lastRecord.financialRecord.cashBalanceEnd - prevRecord.financialRecord.cashBalanceEnd
    : 0;
  const netResult = lastRecord?.financialRecord.netResult ?? 0;

  // Debt ratio
  const totalDebt = finances.loans.reduce((s, l) => s + l.remainingPrincipal, 0);
  const debtRatio = finances.cashBalance > 0 ? totalDebt / finances.cashBalance : totalDebt > 0 ? 999 : 0;

  // Live scoring
  const { score, grade, breakdown } = calculateScore(state);
  const gradeColors: Record<string, string> = {
    A: "text-green-600 bg-green-100",
    B: "text-blue-600 bg-blue-100",
    C: "text-amber-600 bg-amber-100",
    D: "text-orange-600 bg-orange-100",
    F: "text-red-600 bg-red-100",
  };

  const chartData = history.map((record) => ({
    name: `Ar ${record.year} ${record.quarter}`,
    "Intakter":
      record.financialRecord.revenue.cropSales +
      record.financialRecord.revenue.livestockIncome +
      record.financialRecord.revenue.subsidies +
      record.financialRecord.revenue.other,
    Kostnader: Object.values(record.financialRecord.costs).reduce(
      (a: number, b) => a + (typeof b === "number" ? b : 0),
      0
    ),
    Resultat: record.financialRecord.netResult,
  }));

  // Sanitize tip (avoid special chars that break SSR)
  const tip = currentQuarter === Quarter.Var
    ? "Dags för vårsådd! Plantera vårgrödor, gödsla fälten och köp djur inför sommaren."
    : currentQuarter === Quarter.Sommar
      ? "Grödorna växer. Bra tillfälle att sälja spannmål om priset är rätt."
      : currentQuarter === Quarter.Host
        ? "Skörden är inne! Fält frigörs för höstsådd. Så höstgrödor nu."
        : "Sök EU-stöd, planera inför våren och se över ekonomin.";

  return (
    <div className="space-y-6">
      {/* Header with grade */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Översikt</h1>
          <p className="text-sm text-stone-500 mt-1">{tip}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${gradeColors[grade] || gradeColors.C}`}>
            {grade}
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">Betyg</div>
            <div className="text-sm font-semibold text-stone-700">{score}/100</div>
          </div>
        </div>
      </div>

      {/* Quick stats with trends */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card accent="green">
          <div className="text-sm text-stone-500">Kassa</div>
          <div className={`text-2xl font-bold ${finances.cashBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
            {fmt(finances.cashBalance)}
          </div>
          {cashTrend !== 0 && (
            <div className={`text-xs font-medium mt-1 ${cashTrend > 0 ? "text-green-600" : "text-red-500"}`}>
              {cashTrend > 0 ? "▲" : "▼"} {fmt(Math.abs(cashTrend))} sedan förra kvartalet
            </div>
          )}
        </Card>

        <Card accent={netResult >= 0 ? "green" : "red"}>
          <div className="text-sm text-stone-500">Senaste resultat</div>
          <div className={`text-2xl font-bold ${netResult >= 0 ? "text-green-700" : "text-red-600"}`}>
            {netResult >= 0 ? "+" : ""}{fmt(netResult)}
          </div>
          <div className="text-xs text-stone-400 mt-1">Nettoresultat Q{history.length}</div>
        </Card>

        <Card accent="amber">
          <div className="text-sm text-stone-500">Odlad mark</div>
          <div className="text-2xl font-bold text-amber-700">
            {usedHa} / {farm.totalHectares} ha
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {Math.round((usedHa / farm.totalHectares) * 100)}% utnyttjat
          </div>
        </Card>

        <Card accent="blue">
          <div className="text-sm text-stone-500">Skuldsättning</div>
          <div className={`text-2xl font-bold ${debtRatio > 2 ? "text-red-600" : debtRatio > 1 ? "text-amber-600" : "text-blue-700"}`}>
            {totalDebt > 0 ? fmt(totalDebt) : "0 kr"}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {totalDebt > 0 ? `${Math.round(debtRatio * 100)}% av kassa` : "Skuldfri"}
          </div>
        </Card>
      </div>

      {/* Events - prominent */}
      {state.activeEvents.length > 0 && (
        <div className="space-y-2">
          {state.activeEvents.map((event) => {
            const isNegative = event.effects.some(e => e.type === "directCost" || e.value < 0);
            const isPositive = event.effects.some(e => e.type === "directIncome" || (e.value > 0 && e.type !== "costModifier"));
            const icon = categoryIcons[event.category] || "📋";
            return (
              <div
                key={event.id}
                className={`flex gap-3 p-4 rounded-lg border ${
                  isNegative ? "bg-red-50 border-red-200" : isPositive ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-stone-800">{event.title}</div>
                  <div className="text-sm text-stone-600">{event.description}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
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

      {/* Farm Health - 5 scoring dimensions */}
      <Card title="Gårdshälsa">
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Ekonomi", value: breakdown.netWorth, color: "green" as const },
            { label: "Lönsamhet", value: breakdown.profitability, color: "blue" as const },
            { label: "Hållbarhet", value: breakdown.sustainability, color: "amber" as const },
            { label: "EU-stöd", value: breakdown.subsidyUsage, color: "blue" as const },
            { label: "Motståndskraft", value: breakdown.resilience, color: "green" as const },
          ].map((dim) => (
            <div key={dim.label} className="text-center">
              <div className="text-xs text-stone-500 mb-1">{dim.label}</div>
              <ProgressBar
                value={dim.value}
                max={100}
                color={dim.value >= 60 ? "green" : dim.value >= 30 ? "amber" : "red"}
              />
              <div className="text-xs font-semibold text-stone-700 mt-1">{dim.value}%</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Farm map */}
      <Card title="Gårdskarta">
        <FarmMap fields={farm.fields} compact />
      </Card>

      {/* Grain storage */}
      {(() => {
        const storage = farm.storage || {};
        const storedCrops = Object.entries(storage).filter(([, tons]) => tons > 0);
        const totalStored = Object.values(storage).reduce((a, b) => a + b, 0);
        const siloCapacity = farm.siloCapacity || 500;

        if (storedCrops.length > 0 || totalStored > 0) {
          // Estimate storage value from current market prices
          const storageValue = storedCrops.reduce((sum, [crop, tons]) => {
            const price = state.currentMarketPrices?.[crop] ?? 0;
            return sum + tons * price;
          }, 0);

          return (
            <Card title="Spannmålslager">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-stone-500">Silo</span>
                <span className="font-medium">
                  {totalStored.toFixed(0)} / {siloCapacity} ton
                  {storageValue > 0 && (
                    <span className="text-green-600 ml-2">(~{fmt(storageValue)})</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all ${totalStored / siloCapacity > 0.9 ? "bg-red-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(100, (totalStored / siloCapacity) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {storedCrops.map(([crop, tons]) => {
                  const price = state.currentMarketPrices?.[crop] ?? 0;
                  return (
                    <div key={crop} className="bg-stone-50 p-2 rounded text-sm">
                      <div className="font-medium">{crop}</div>
                      <div className="text-stone-500">{tons.toFixed(1)} ton</div>
                      {price > 0 && (
                        <div className="text-xs text-green-600">~{fmt(tons * price)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        }
        return null;
      })()}

      {/* Financial chart */}
      {chartData.length > 0 && (
        <Card title="Ekonomisk utveckling">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number" ? value.toLocaleString("sv-SE") + " kr" : value
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="Intakter" stroke="#16a34a" strokeWidth={2} name="Intäkter" />
                <Line type="monotone" dataKey="Kostnader" stroke="#dc2626" strokeWidth={2} />
                <Line type="monotone" dataKey="Resultat" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Machinery */}
      {(farm.machines || []).length > 0 && (() => {
        const machineMod = getMachineConditionModifier(farm.machines || []);
        const machinePercent = Math.round((machineMod - 1) * 100);
        return (
          <Card title="Maskinpark">
            {machinePercent < 0 && (
              <div className="text-xs px-2 py-1.5 mb-2 rounded bg-red-50 text-red-700">
                Maskinernas skick påverkar skörden med {machinePercent}%. Reparera maskiner via Beslut → Underhåll.
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(farm.machines || []).map((m) => {
                const condColor = m.condition > 0.7 ? "text-green-600" : m.condition > 0.4 ? "text-amber-600" : "text-red-600";
                const age = currentYear - m.purchaseYear;
                const repairCost = REPAIR_COSTS[m.type] ?? 15000;
                return (
                  <div key={m.id} className="bg-stone-50 p-2 rounded text-sm">
                    <div className="font-medium">{m.name}</div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={condColor}>
                        {Math.round(m.condition * 100)}% skick
                      </span>
                      <span className="text-stone-400">{age > 0 ? `${age} år` : "Ny"}</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${m.condition > 0.7 ? "bg-green-500" : m.condition > 0.4 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${m.condition * 100}%` }}
                      />
                    </div>
                    {m.condition < 0.7 && (
                      <div className="text-xs text-amber-600 mt-1">Behöver reparation ({(repairCost / 1000)}k kr)</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {/* Farm details */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Grödor">
          {farm.fields.filter((f) => f.crop).length === 0 ? (
            <p className="text-stone-400 text-sm">Inga grödor planterade ännu.</p>
          ) : (
            <div className="space-y-2">
              {farm.fields
                .filter((f) => f.crop)
                .map((f) => (
                  <div key={f.id} className="flex justify-between items-center text-sm">
                    <span>
                      <span className="font-medium">{f.name}</span>
                      <span className="text-stone-400 ml-2">{f.crop}</span>
                    </span>
                    <span className="text-stone-500">
                      {f.hectares} ha - {f.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card title="Djurbesättning">
          {farm.livestock.length === 0 ? (
            <p className="text-stone-400 text-sm">Inga djur ännu.</p>
          ) : (
            <div className="space-y-2">
              {farm.livestock.map((h) => (
                <div key={h.type} className="flex justify-between items-center text-sm">
                  <span>{h.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500">{h.count} st</span>
                    <span className={`text-xs ${h.healthStatus > 0.7 ? "text-green-600" : h.healthStatus > 0.4 ? "text-amber-600" : "text-red-600"}`}>
                      {Math.round(h.healthStatus * 100)}% hälsa
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
