"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Quarter } from "@/types/enums";
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

export default function OversiktPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { farm, finances, history, currentQuarter, currentYear } = state;

  const totalAnimals = farm.livestock.reduce((sum, h) => sum + h.count, 0);
  const usedHa = farm.fields
    .filter((f) => f.crop !== null)
    .reduce((sum, f) => sum + f.hectares, 0);

  const chartData = history.map((record) => ({
    name: `År ${record.year} ${record.quarter}`,
    Intäkter:
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

  const quarterBadgeColor = {
    [Quarter.Var]: "green" as const,
    [Quarter.Sommar]: "amber" as const,
    [Quarter.Host]: "amber" as const,
    [Quarter.Vinter]: "blue" as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">Översikt</h1>
        <Badge color={quarterBadgeColor[currentQuarter]}>
          År {currentYear} - {currentQuarter}
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card accent="green">
          <div className="text-sm text-stone-500">Kassa</div>
          <div
            className={`text-2xl font-bold ${finances.cashBalance >= 0 ? "text-green-700" : "text-red-600"}`}
          >
            {finances.cashBalance.toLocaleString("sv-SE")} kr
          </div>
        </Card>
        <Card accent="amber">
          <div className="text-sm text-stone-500">Odlad mark</div>
          <div className="text-2xl font-bold text-amber-700">
            {usedHa} / {farm.totalHectares} ha
          </div>
        </Card>
        <Card accent="blue">
          <div className="text-sm text-stone-500">Djur</div>
          <div className="text-2xl font-bold text-blue-700">{totalAnimals} st</div>
        </Card>
        <Card accent="orange">
          <div className="text-sm text-stone-500">Anställda</div>
          <div className="text-2xl font-bold text-orange-700">
            {farm.employees} st
          </div>
        </Card>
      </div>

      {/* Grain storage */}
      {(() => {
        const storage = farm.storage || {};
        const storedCrops = Object.entries(storage).filter(([, tons]) => tons > 0);
        const totalStored = Object.values(storage).reduce((a, b) => a + b, 0);
        const siloCapacity = farm.siloCapacity || 500;

        if (storedCrops.length > 0 || totalStored > 0) {
          return (
            <Card title="Spannmålslager">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-stone-500">Silo</span>
                <span className="font-medium">{totalStored.toFixed(0)} / {siloCapacity} ton</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full ${totalStored / siloCapacity > 0.9 ? "bg-red-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(100, (totalStored / siloCapacity) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {storedCrops.map(([crop, tons]) => (
                  <div key={crop} className="bg-stone-50 p-2 rounded text-sm">
                    <div className="font-medium">{crop}</div>
                    <div className="text-stone-500">{tons.toFixed(1)} ton</div>
                  </div>
                ))}
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
                <Line
                  type="monotone"
                  dataKey="Intäkter"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Kostnader"
                  stroke="#dc2626"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Resultat"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

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
                  <div
                    key={f.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span>{f.crop}</span>
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
                <div
                  key={h.type}
                  className="flex justify-between items-center text-sm"
                >
                  <span>{h.type}</span>
                  <span className="text-stone-500">{h.count} st</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent events */}
      {state.activeEvents.length > 0 && (
        <Card title="Senaste händelser" accent="amber">
          <div className="space-y-2">
            {state.activeEvents.map((event) => (
              <div key={event.id} className="bg-amber-50 p-3 rounded-lg">
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-stone-600">{event.description}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
