"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { LIVESTOCK_DATA } from "@/data/livestock";

export default function DjurPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { livestock } = state.farm;
  const totalAnimals = livestock.reduce((s, h) => s + h.count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Djurhållning</h1>

      <Card accent="blue">
        <div className="text-sm text-stone-500">Totalt antal djur</div>
        <div className="text-2xl font-bold">{totalAnimals} st</div>
      </Card>

      {livestock.length === 0 ? (
        <Card>
          <p className="text-stone-400">
            Du har inga djur ännu. Köp djur under &quot;Beslut&quot;-fliken.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {livestock.map((herd) => {
            const data = LIVESTOCK_DATA[herd.type];
            const annualProfit =
              (data.annualRevenue - data.annualFeedCost - data.annualVetCost - data.housingCost) *
              herd.count;

            return (
              <Card key={herd.type} title={herd.type}>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Antal:</span>
                    <span className="font-medium">{herd.count} st</span>
                  </div>
                  <ProgressBar
                    value={herd.healthStatus * 100}
                    label="Hälsa"
                    showPercent
                    color={herd.healthStatus > 0.7 ? "green" : herd.healthStatus > 0.4 ? "amber" : "red"}
                  />
                  <div className="text-sm space-y-1 text-stone-600">
                    <div className="flex justify-between">
                      <span>Intäkt/år:</span>
                      <span className="text-green-600">
                        +{(data.annualRevenue * herd.count).toLocaleString("sv-SE")} kr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Foder/år:</span>
                      <span className="text-red-600">
                        -{(data.annualFeedCost * herd.count).toLocaleString("sv-SE")} kr
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Beräknad vinst/år:</span>
                      <span className={annualProfit >= 0 ? "text-green-700" : "text-red-600"}>
                        {annualProfit.toLocaleString("sv-SE")} kr
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
