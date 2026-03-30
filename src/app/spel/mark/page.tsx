"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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

      <Card title="Fält">
        <div className="grid gap-3">
          {farm.fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
            >
              <div>
                <div className="font-medium text-sm">
                  {field.crop || "Tomt fält"} - {field.hectares} ha
                </div>
                <div className="text-xs text-stone-500">
                  Jordkvalitet: {Math.round(field.soilQuality * 100)}%
                  {field.fertilizerApplied && " | Gödslad"}
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
