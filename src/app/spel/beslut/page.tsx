"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Quarter, CropType, AnimalType, SubsidyType } from "@/types/enums";
import { CROPS_DATA } from "@/data/crops";
import { LIVESTOCK_DATA } from "@/data/livestock";

export default function BeslutPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { currentQuarter } = state;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">
        Beslut - {currentQuarter}
      </h1>
      <p className="text-stone-500">
        Fatta beslut för kvartalet. Klicka &quot;Avsluta kvartal&quot; i toppenmenyn när du
        är klar.
      </p>

      {currentQuarter === Quarter.Var && <SpringDecisions />}
      {currentQuarter === Quarter.Sommar && <SummerDecisions />}
      {currentQuarter === Quarter.Host && <AutumnDecisions />}
      {currentQuarter === Quarter.Vinter && <WinterDecisions />}
    </div>
  );
}

function SpringDecisions() {
  const state = useGameStore((s) => s.state)!;
  const updateDecisions = useGameStore((s) => s.updateDecisions);
  const pendingDecisions = useGameStore((s) => s.pendingDecisions);
  const { farm } = state;

  const availableHa = farm.totalHectares - farm.fields.filter(f => f.crop !== null).reduce((s, f) => s + f.hectares, 0);
  const emptyFields = farm.fields.filter((f) => f.crop === null);
  const springCrops = [CropType.Varkorn, CropType.Havre, CropType.Vall, CropType.Potatis, CropType.Sockerbeta];

  const [selectedCrop, setSelectedCrop] = useState<CropType>(CropType.Varkorn);
  const [plantHa, setPlantHa] = useState(20);

  const handlePlant = () => {
    if (emptyFields.length === 0 || plantHa <= 0) return;
    const field = emptyFields[0];
    const ha = Math.min(plantHa, field.hectares);
    updateDecisions({
      cropActions: [
        ...(pendingDecisions?.cropActions || []),
        { fieldId: field.id, action: "plant", cropType: selectedCrop },
      ],
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Plantera grödor" accent="green">
        <p className="text-sm text-stone-500 mb-3">
          Tillgänglig mark: {availableHa} ha
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Gröda</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value as CropType)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg"
            >
              {springCrops.map((c) => (
                <option key={c} value={c}>
                  {c} - Utsäde: {CROPS_DATA[c].seedCostPerHa.toLocaleString("sv-SE")} kr/ha
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Areal: {plantHa} ha
            </label>
            <input
              type="range"
              min={0}
              max={Math.min(availableHa, 200)}
              step={5}
              value={plantHa}
              onChange={(e) => setPlantHa(Number(e.target.value))}
              className="w-full accent-green-600"
            />
          </div>
          <div className="text-sm text-stone-500">
            Kostnad: {(CROPS_DATA[selectedCrop].seedCostPerHa * plantHa).toLocaleString("sv-SE")} kr
          </div>
          <Button onClick={handlePlant} disabled={plantHa === 0}>
            Plantera
          </Button>
        </div>
      </Card>

      <Card title="Köp djur" accent="blue">
        <LivestockBuyer />
      </Card>

      <Card title="Gödsling">
        <p className="text-sm text-stone-500 mb-2">
          Gödsla fält för att öka skörden med ~15%.
        </p>
        {farm.fields.filter(f => f.crop && !f.fertilizerApplied).map(f => (
          <div key={f.id} className="flex justify-between items-center py-2 border-b border-stone-100">
            <span className="text-sm">{f.crop} - {f.hectares} ha</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">
                {(CROPS_DATA[f.crop!].fertilizerCostPerHa * f.hectares).toLocaleString("sv-SE")} kr
              </span>
              <Button
                size="sm"
                onClick={() => updateDecisions({
                  cropActions: [
                    ...(pendingDecisions?.cropActions || []),
                    { fieldId: f.id, action: "fertilize" },
                  ],
                })}
              >
                Gödsla
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <Card title="Anställ personal">
        <PersonnelControls />
      </Card>
    </div>
  );
}

function SummerDecisions() {
  const state = useGameStore((s) => s.state)!;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Drift & underhåll" accent="amber">
        <p className="text-sm text-stone-500">
          Sommaren är för drift och skötsel. Grödorna växer och djuren betar.
        </p>
        <div className="mt-3 space-y-2">
          {state.farm.fields.filter(f => f.crop).map(f => (
            <div key={f.id} className="flex justify-between text-sm py-1">
              <span>{f.crop}</span>
              <span className="text-green-600">{f.status}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Personal" accent="blue">
        <PersonnelControls />
      </Card>

      <Card title="Kompletteringsgödsling">
        <p className="text-sm text-stone-500 mb-2">Gödsla fält som inte gödslats ännu.</p>
        {state.farm.fields.filter(f => f.crop && !f.fertilizerApplied).length === 0 ? (
          <p className="text-sm text-stone-400">Alla fält är gödslade.</p>
        ) : (
          state.farm.fields.filter(f => f.crop && !f.fertilizerApplied).map(f => (
            <div key={f.id} className="text-sm py-1">{f.crop} - {f.hectares} ha (ej gödslad)</div>
          ))
        )}
      </Card>

      <Card title="Djurskötsel">
        <div className="space-y-2">
          {state.farm.livestock.length === 0 ? (
            <p className="text-sm text-stone-400">Inga djur att sköta.</p>
          ) : (
            state.farm.livestock.map(h => (
              <div key={h.type} className="flex justify-between text-sm">
                <span>{h.type} ({h.count} st)</span>
                <span className={h.healthStatus > 0.7 ? "text-green-600" : "text-amber-600"}>
                  Hälsa: {Math.round(h.healthStatus * 100)}%
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function AutumnDecisions() {
  const state = useGameStore((s) => s.state)!;
  const updateDecisions = useGameStore((s) => s.updateDecisions);
  const pendingDecisions = useGameStore((s) => s.pendingDecisions);
  const harvestableFields = state.farm.fields.filter(
    (f) => f.crop && (f.status === "Växande" || f.status === "Skördeklar")
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Skörd" accent="orange">
        <p className="text-sm text-stone-500 mb-3">
          Skörda dina grödor och sälj till marknadspris.
        </p>
        {harvestableFields.length === 0 ? (
          <p className="text-sm text-stone-400">Inga grödor att skörda.</p>
        ) : (
          harvestableFields.map((f) => (
            <div key={f.id} className="flex justify-between items-center py-2 border-b border-stone-100">
              <span className="text-sm">{f.crop} - {f.hectares} ha</span>
              <Button
                size="sm"
                onClick={() => updateDecisions({
                  cropActions: [
                    ...(pendingDecisions?.cropActions || []),
                    { fieldId: f.id, action: "harvest" },
                  ],
                })}
              >
                Skörda
              </Button>
            </div>
          ))
        )}
      </Card>

      <Card title="Höstplöjning & höstsådd" accent="amber">
        <p className="text-sm text-stone-500">
          Plantera höstvete och höstraps inför nästa säsong.
        </p>
        <div className="mt-2 space-y-2">
          {[CropType.Hostvete, CropType.Hostraps].map(crop => (
            <div key={crop} className="text-sm">
              {crop} - Utsäde: {CROPS_DATA[crop].seedCostPerHa.toLocaleString("sv-SE")} kr/ha
            </div>
          ))}
        </div>
      </Card>

      <Card title="Sälj djur">
        <LivestockSeller />
      </Card>

      <Card title="Ekonomisk sammanfattning">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-stone-500">Kassa:</span>
            <span className="font-medium">{state.finances.cashBalance.toLocaleString("sv-SE")} kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Lån kvar:</span>
            <span className="font-medium">
              {state.finances.loans.reduce((s, l) => s + l.remainingPrincipal, 0).toLocaleString("sv-SE")} kr
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function WinterDecisions() {
  const state = useGameStore((s) => s.state)!;
  const updateDecisions = useGameStore((s) => s.updateDecisions);
  const pendingDecisions = useGameStore((s) => s.pendingDecisions);

  const subsidyTypes: SubsidyType[] = [
    "Grundbetalning",
    "Förgröningsstöd",
    "Kompensationsstöd",
    "Miljöersättning",
    "Djurvälfärdsersättning",
    "Nötkreatursstöd",
  ];

  const applied = pendingDecisions?.subsidyApplications || [];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Ansök om EU-stöd" accent="blue">
        <p className="text-sm text-stone-500 mb-3">
          Ansök om stöd för att få utbetalning nästa år.
        </p>
        <div className="space-y-2">
          {subsidyTypes.map((st) => (
            <label key={st} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={applied.includes(st)}
                onChange={(e) => {
                  const newApplied = e.target.checked
                    ? [...applied, st]
                    : applied.filter((s) => s !== st);
                  updateDecisions({ subsidyApplications: newApplied });
                }}
                className="accent-green-600"
              />
              {st}
            </label>
          ))}
        </div>
      </Card>

      <Card title="Underhåll & investeringar" accent="amber">
        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-stone-500">Maskinpark:</span>{" "}
            <span className="font-medium">{state.farm.machinery}</span>
          </div>
          <div className="text-sm">
            <span className="text-stone-500">Byggnader:</span>{" "}
            <span className="font-medium">{state.farm.buildings}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateDecisions({ machineryUpgrade: true })}
          >
            Uppgradera maskiner
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateDecisions({ buildingUpgrade: true })}
          >
            Uppgradera byggnader
          </Button>
        </div>
      </Card>

      <Card title="Planering">
        <p className="text-sm text-stone-500">
          Vintern är tid för planering. Nästa kvartal börjar ett nytt odlingsår
          med nya möjligheter.
        </p>
        <div className="mt-3 bg-blue-50 p-3 rounded-lg text-sm">
          <strong>Tips:</strong> Se över din ekonomi under &quot;Ekonomi&quot;-fliken och
          planera vilka grödor du vill satsa på i vår.
        </div>
      </Card>

      <Card title="Personal">
        <PersonnelControls />
      </Card>
    </div>
  );
}

function LivestockBuyer() {
  const state = useGameStore((s) => s.state)!;
  const updateDecisions = useGameStore((s) => s.updateDecisions);
  const pendingDecisions = useGameStore((s) => s.pendingDecisions);
  const [buyType, setBuyType] = useState<AnimalType>(AnimalType.Mjolkko);
  const [buyCount, setBuyCount] = useState(5);

  const data = LIVESTOCK_DATA[buyType];
  const cost = data.purchasePrice * buyCount;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Djurslag</label>
        <select
          value={buyType}
          onChange={(e) => setBuyType(e.target.value as AnimalType)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        >
          {Object.values(AnimalType).map((a) => (
            <option key={a} value={a}>
              {a} - {LIVESTOCK_DATA[a].purchasePrice.toLocaleString("sv-SE")} kr/st
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Antal: {buyCount}</label>
        <input
          type="range"
          min={0}
          max={50}
          value={buyCount}
          onChange={(e) => setBuyCount(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>
      <div className="text-sm text-stone-500">
        Kostnad: {cost.toLocaleString("sv-SE")} kr
      </div>
      <Button
        size="sm"
        onClick={() => updateDecisions({
          livestockActions: [
            ...(pendingDecisions?.livestockActions || []),
            { type: buyType, action: "buy", count: buyCount },
          ],
        })}
        disabled={buyCount === 0 || cost > state.finances.cashBalance}
      >
        Köp {buyCount} {buyType}
      </Button>
    </div>
  );
}

function LivestockSeller() {
  const state = useGameStore((s) => s.state)!;
  const updateDecisions = useGameStore((s) => s.updateDecisions);
  const pendingDecisions = useGameStore((s) => s.pendingDecisions);

  return (
    <div className="space-y-2">
      {state.farm.livestock.length === 0 ? (
        <p className="text-sm text-stone-400">Inga djur att sälja.</p>
      ) : (
        state.farm.livestock.map((h) => (
          <div key={h.type} className="flex justify-between items-center text-sm">
            <span>{h.type} ({h.count} st)</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateDecisions({
                livestockActions: [
                  ...(pendingDecisions?.livestockActions || []),
                  { type: h.type, action: "sell", count: 1 },
                ],
              })}
            >
              Sälj 1
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

function PersonnelControls() {
  const state = useGameStore((s) => s.state)!;
  const updateDecisions = useGameStore((s) => s.updateDecisions);

  return (
    <div className="space-y-2">
      <div className="text-sm">
        Nuvarande: <strong>{state.farm.employees}</strong> anställda
      </div>
      <div className="text-sm text-stone-500">
        Lönekostnad: {(state.farm.employees * 35000).toLocaleString("sv-SE")} kr/mån
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => updateDecisions({ hireWorkers: 1 })}
        >
          +1 anställd
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => updateDecisions({ hireWorkers: -1 })}
          disabled={state.farm.employees === 0}
        >
          -1 anställd
        </Button>
      </div>
    </div>
  );
}
