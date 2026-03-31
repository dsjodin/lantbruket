"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PersonalPage() {
  const state = useGameStore((s) => s.state);
  const hireWorker = useGameStore((s) => s.hireWorker);
  const fireWorker = useGameStore((s) => s.fireWorker);
  if (!state) return null;

  const { employees } = state.farm;
  const monthlyCost = employees * 35000;
  const quarterlyCost = monthlyCost * 3;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Personal</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card accent="blue">
          <div className="text-sm text-stone-500">Anställda</div>
          <div className="text-2xl font-bold">{employees} st</div>
        </Card>
        <Card accent="amber">
          <div className="text-sm text-stone-500">Månadskostnad</div>
          <div className="text-xl font-bold">{monthlyCost.toLocaleString("sv-SE")} kr</div>
        </Card>
        <Card accent="red">
          <div className="text-sm text-stone-500">Kvartalskostnad</div>
          <div className="text-xl font-bold">{quarterlyCost.toLocaleString("sv-SE")} kr</div>
        </Card>
      </div>

      <Card title="Hantera personal">
        <p className="text-sm text-stone-500 mb-4">
          Varje anställd kostar ca 35 000 kr/mån inklusive sociala avgifter.
          Fler anställda behövs vid större gårdar och djurhållning.
        </p>
        <div className="flex gap-3">
          <Button onClick={hireWorker}>
            Anställ +1
          </Button>
          <Button
            variant="danger"
            onClick={fireWorker}
            disabled={employees === 0}
          >
            Säg upp -1
          </Button>
        </div>

        <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm">
          <strong>Tips:</strong> En tumregel är ca 1 anställd per 80-100 ha växtodling,
          eller 1 per 30-40 mjölkkor.
        </div>
      </Card>
    </div>
  );
}
