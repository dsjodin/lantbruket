"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FarmMap from "@/components/game/FarmMap";

const statusColors: Record<string, "green" | "amber" | "blue" | "stone" | "red"> = {
  "Oplöjd": "stone",
  "Sådd": "blue",
  "Växande": "green",
  "Skördeklar": "amber",
  "Skördad": "stone",
};

export default function MarkPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { farm } = state;
  const usedHa = farm.fields.filter(f => f.crop).reduce((s, f) => s + f.hectares, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Mark & Grödor</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card accent="green">
          <div className="text-sm text-stone-500">Total areal</div>
          <div className="text-xl font-bold">{farm.totalHectares} ha</div>
        </Card>
        <Card accent="amber">
          <div className="text-sm text-stone-500">Odlad mark</div>
          <div className="text-xl font-bold">{usedHa} ha</div>
        </Card>
        <Card accent="blue">
          <div className="text-sm text-stone-500">Ledig mark</div>
          <div className="text-xl font-bold">{farm.totalHectares - usedHa} ha</div>
        </Card>
      </div>

      {/* Farm map */}
      <Card title="Gårdskarta">
        <FarmMap fields={farm.fields} />
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {[
            { label: "Oplöjd", color: "#a08060" },
            { label: "Sådd", color: "#c4b078" },
            { label: "Växande", color: "#4ade80" },
            { label: "Skördeklar", color: "#fbbf24" },
            { label: "Skördad", color: "#d6d3d1" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
              <span className="text-stone-500">{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Grain storage */}
      {(() => {
        const storage = farm.storage || {};
        const storedCrops = Object.entries(storage).filter(([, tons]) => tons > 0);
        const totalStored = Object.values(storage).reduce((a, b) => a + b, 0);
        const siloCapacity = farm.siloCapacity || 500;

        return (
          <Card title="Spannmålslager">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-500">Silokapacitet</span>
              <span className="font-medium">{totalStored.toFixed(0)} / {siloCapacity} ton</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${totalStored / siloCapacity > 0.9 ? "bg-red-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(100, (totalStored / siloCapacity) * 100)}%` }}
              />
            </div>
            {storedCrops.length === 0 ? (
              <p className="text-sm text-stone-400">Inget lagrat spannmål.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {storedCrops.map(([crop, tons]) => (
                  <div key={crop} className="flex justify-between bg-stone-50 p-2 rounded text-sm">
                    <span>{crop}</span>
                    <span className="font-medium">{tons.toFixed(1)} ton</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })()}

      <Card title="Fält">
        <div className="grid gap-3">
          {farm.fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
            >
              <div>
                <div className="font-medium text-sm">
                  {field.name} ({field.hectares} ha) — {field.crop || "Tomt fält"}
                </div>
                <div className="text-xs text-stone-500">
                  Jordkvalitet: {Math.round(field.soilQuality * 100)}%
                  {field.fertilizerApplied && " | Gödslad"}
                  {field.leased && ` | Arrende ${((field.leaseAnnualCost ?? 0) / 1000).toFixed(0)}k kr/år`}
                </div>
              </div>
              <Badge color={statusColors[field.status] || "stone"}>
                {field.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
