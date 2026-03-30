"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Quarter, CropType, AnimalType, SubsidyType } from "@/types/enums";
import { CROPS_DATA, PLANTING_QUARTERS } from "@/data/crops";
import { LIVESTOCK_DATA } from "@/data/livestock";

function MessageBar() {
  const messages = useGameStore((s) => s.messages);
  const clearMessages = useGameStore((s) => s.clearMessages);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [messages, clearMessages]);

  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            msg.type === "success"
              ? "bg-green-100 text-green-800"
              : msg.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}

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

      <MessageBar />

      {currentQuarter === Quarter.Var && <SpringDecisions />}
      {currentQuarter === Quarter.Sommar && <SummerDecisions />}
      {currentQuarter === Quarter.Host && <AutumnDecisions />}
      {currentQuarter === Quarter.Vinter && <WinterDecisions />}
    </div>
  );
}

function SpringDecisions() {
  const state = useGameStore((s) => s.state)!;
  const { farm } = state;

  const springCrops = Object.values(CropType).filter(
    (c) => c !== CropType.Trada && PLANTING_QUARTERS[c]?.includes(Quarter.Var)
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <PlantingCard crops={springCrops} quarter={Quarter.Var} />

      <Card title="Köp djur" accent="blue">
        <LivestockBuyer />
      </Card>

      <FertilizeCard />

      <Card title="Personal">
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
            <div key={f.id} className="flex justify-between text-sm py-1 border-b border-stone-100">
              <span>{f.crop} ({f.hectares} ha)</span>
              <Badge color={f.status === "Växande" ? "green" : "amber"}>{f.status}</Badge>
            </div>
          ))}
          {state.farm.fields.filter(f => f.crop).length === 0 && (
            <p className="text-sm text-stone-400">Inga grödor planterade.</p>
          )}
        </div>
      </Card>

      <Card title="Personal" accent="blue">
        <PersonnelControls />
      </Card>

      <FertilizeCard />

      <Card title="Djurskötsel">
        <div className="space-y-2">
          {state.farm.livestock.length === 0 ? (
            <p className="text-sm text-stone-400">Inga djur att sköta.</p>
          ) : (
            state.farm.livestock.map(h => (
              <div key={h.type} className="flex justify-between text-sm py-1">
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
  const harvestField = useGameStore((s) => s.harvestField);

  const harvestableFields = state.farm.fields.filter(
    (f) => f.crop && f.status !== "Skördad" && f.status !== "Oplöjd"
  );

  const autumnCrops = Object.values(CropType).filter(
    (c) => c !== CropType.Trada && PLANTING_QUARTERS[c]?.includes(Quarter.Host)
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Skörd" accent="orange">
        <p className="text-sm text-stone-500 mb-3">
          Skörda dina grödor. Försäljning sker automatiskt vid kvartalsskifte.
        </p>
        {harvestableFields.length === 0 ? (
          <p className="text-sm text-stone-400">Inga grödor att skörda.</p>
        ) : (
          <div className="space-y-2">
            {harvestableFields.map((f) => (
              <div key={f.id} className="flex justify-between items-center py-2 border-b border-stone-100">
                <div>
                  <span className="text-sm font-medium">{f.crop}</span>
                  <span className="text-xs text-stone-400 ml-2">{f.hectares} ha - {f.status}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => harvestField(f.id)}
                  disabled={f.status === "Skördad"}
                >
                  Skörda
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <PlantingCard crops={autumnCrops} quarter={Quarter.Host} />

      <Card title="Sälj djur">
        <LivestockSeller />
      </Card>

      <Card title="Ekonomisk sammanfattning">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-500">Kassa:</span>
            <span className={`font-medium ${state.finances.cashBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
              {state.finances.cashBalance.toLocaleString("sv-SE")} kr
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Lån kvar:</span>
            <span className="font-medium text-red-600">
              {state.finances.loans.reduce((s, l) => s + l.remainingPrincipal, 0).toLocaleString("sv-SE")} kr
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Djur:</span>
            <span className="font-medium">{state.farm.livestock.reduce((s, h) => s + h.count, 0)} st</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function WinterDecisions() {
  const state = useGameStore((s) => s.state)!;
  const applyForSubsidies = useGameStore((s) => s.applyForSubsidies);
  const pendingDecisions = useGameStore((s) => s.pendingDecisions);
  const updateDecisions = useGameStore((s) => s.updateDecisions);

  const subsidyTypes: SubsidyType[] = [
    "Grundbetalning",
    "Förgröningsstöd",
    "Kompensationsstöd",
    "Miljöersättning",
    "Djurvälfärdsersättning",
    "Nötkreatursstöd",
  ];

  const [applied, setApplied] = useState<SubsidyType[]>(
    pendingDecisions.subsidyApplications || []
  );

  const handleSubsidyToggle = (st: SubsidyType, checked: boolean) => {
    const newApplied = checked ? [...applied, st] : applied.filter((s) => s !== st);
    setApplied(newApplied);
    applyForSubsidies(newApplied);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Ansök om EU-stöd" accent="blue">
        <p className="text-sm text-stone-500 mb-3">
          Ansök om stöd för att få utbetalning nästa år.
        </p>
        <div className="space-y-2">
          {subsidyTypes.map((st) => (
            <label key={st} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-50 p-1 rounded">
              <input
                type="checkbox"
                checked={applied.includes(st)}
                onChange={(e) => handleSubsidyToggle(st, e.target.checked)}
                className="accent-green-600 w-4 h-4"
              />
              {st}
            </label>
          ))}
        </div>
        {applied.length > 0 && (
          <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
            {applied.length} stödtyper valda
          </div>
        )}
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
          Vintern är tid för planering. Nästa kvartal börjar ett nytt odlingsår.
        </p>
        <div className="mt-3 bg-blue-50 p-3 rounded-lg text-sm">
          <strong>Tips:</strong> Ansök om alla EU-stöd du är berättigad till!
          De utgör en stor del av lantbrukares inkomst.
        </div>
      </Card>

      <Card title="Personal">
        <PersonnelControls />
      </Card>
    </div>
  );
}

// -- Shared components --

function PlantingCard({ crops, quarter }: { crops: CropType[]; quarter: Quarter }) {
  const state = useGameStore((s) => s.state)!;
  const plantCrop = useGameStore((s) => s.plantCrop);

  const [selectedCrop, setSelectedCrop] = useState<CropType>(crops[0]);

  const emptyFields = state.farm.fields.filter((f) => f.crop === null);
  const availableHa = emptyFields.reduce((s, f) => s + f.hectares, 0);

  const label = quarter === Quarter.Var ? "Vårsådd" : "Höstsådd";

  return (
    <Card title={label} accent="green">
      <p className="text-sm text-stone-500 mb-3">
        Tillgänglig mark: <strong>{availableHa} ha</strong> ({emptyFields.length} fält)
      </p>

      {emptyFields.length === 0 ? (
        <p className="text-sm text-stone-400">Alla fält är upptagna.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Välj gröda</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value as CropType)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            >
              {crops.map((c) => (
                <option key={c} value={c}>
                  {c} — {CROPS_DATA[c].seedCostPerHa.toLocaleString("sv-SE")} kr/ha,
                  skörd ~{CROPS_DATA[c].baseYieldPerHa} ton/ha
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded">
            Utsäde: {CROPS_DATA[selectedCrop].seedCostPerHa.toLocaleString("sv-SE")} kr/ha |
            Gödsel: {CROPS_DATA[selectedCrop].fertilizerCostPerHa.toLocaleString("sv-SE")} kr/ha |
            Förväntad skörd: {CROPS_DATA[selectedCrop].baseYieldPerHa} ton/ha
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Välj fält att plantera:</p>
            {emptyFields.map((f) => {
              const cost = CROPS_DATA[selectedCrop].seedCostPerHa * f.hectares;
              const canAfford = state.finances.cashBalance >= cost;
              return (
                <div key={f.id} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Fält {f.id.replace("field-", "")} </span>
                    <span className="text-xs text-stone-400">
                      ({f.hectares} ha, jord {Math.round(f.soilQuality * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">{cost.toLocaleString("sv-SE")} kr</span>
                    <Button
                      size="sm"
                      onClick={() => plantCrop(f.id, selectedCrop)}
                      disabled={!canAfford}
                    >
                      Plantera
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function FertilizeCard() {
  const state = useGameStore((s) => s.state)!;
  const fertilizeField = useGameStore((s) => s.fertilizeField);

  const unfertilized = state.farm.fields.filter(f => f.crop && !f.fertilizerApplied);

  return (
    <Card title="Gödsling">
      <p className="text-sm text-stone-500 mb-2">
        Gödsla fält för att öka skörden med ~15%.
      </p>
      {unfertilized.length === 0 ? (
        <p className="text-sm text-stone-400">Inga fält att gödsla.</p>
      ) : (
        <div className="space-y-2">
          {unfertilized.map(f => {
            const cost = CROPS_DATA[f.crop!].fertilizerCostPerHa * f.hectares;
            const canAfford = state.finances.cashBalance >= cost;
            return (
              <div key={f.id} className="flex justify-between items-center py-2 border-b border-stone-100">
                <div>
                  <span className="text-sm">{f.crop}</span>
                  <span className="text-xs text-stone-400 ml-2">({f.hectares} ha)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">{cost.toLocaleString("sv-SE")} kr</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fertilizeField(f.id)}
                    disabled={!canAfford}
                  >
                    Gödsla
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function LivestockBuyer() {
  const state = useGameStore((s) => s.state)!;
  const buyLivestock = useGameStore((s) => s.buyLivestock);
  const [buyType, setBuyType] = useState<AnimalType>(AnimalType.Mjolkko);
  const [buyCount, setBuyCount] = useState(5);

  const data = LIVESTOCK_DATA[buyType];
  const cost = data.purchasePrice * buyCount;
  const canAfford = state.finances.cashBalance >= cost;

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
              {a} — {LIVESTOCK_DATA[a].purchasePrice.toLocaleString("sv-SE")} kr/st
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Antal: {buyCount}</label>
        <input
          type="range"
          min={1}
          max={50}
          value={buyCount}
          onChange={(e) => setBuyCount(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>
      <div className="text-xs bg-stone-50 p-2 rounded space-y-1">
        <div>Inköpskostnad: <strong>{cost.toLocaleString("sv-SE")} kr</strong></div>
        <div>Årlig intäkt: ~{(data.annualRevenue * buyCount).toLocaleString("sv-SE")} kr</div>
        <div>Årlig foderkostnad: ~{(data.annualFeedCost * buyCount).toLocaleString("sv-SE")} kr</div>
      </div>
      <Button
        onClick={() => buyLivestock(buyType, buyCount)}
        disabled={!canAfford || buyCount === 0}
      >
        Köp {buyCount} {buyType}
        {!canAfford && " (ej råd)"}
      </Button>
    </div>
  );
}

function LivestockSeller() {
  const state = useGameStore((s) => s.state)!;
  const sellLivestock = useGameStore((s) => s.sellLivestock);

  if (state.farm.livestock.length === 0) {
    return <p className="text-sm text-stone-400">Inga djur att sälja.</p>;
  }

  return (
    <div className="space-y-2">
      {state.farm.livestock.map((h) => {
        const sellPrice = Math.round(LIVESTOCK_DATA[h.type].purchasePrice * 0.7);
        return (
          <div key={h.type} className="flex justify-between items-center py-2 border-b border-stone-100">
            <div>
              <span className="text-sm font-medium">{h.type}</span>
              <span className="text-xs text-stone-400 ml-2">({h.count} st)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">{sellPrice.toLocaleString("sv-SE")} kr/st</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => sellLivestock(h.type, 1)}
                disabled={h.count <= 0}
              >
                Sälj 1
              </Button>
              {h.count >= 5 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => sellLivestock(h.type, 5)}
                >
                  Sälj 5
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonnelControls() {
  const state = useGameStore((s) => s.state)!;
  const hireWorker = useGameStore((s) => s.hireWorker);
  const fireWorker = useGameStore((s) => s.fireWorker);

  return (
    <div className="space-y-2">
      <div className="text-sm">
        Nuvarande: <strong>{state.farm.employees}</strong> anställda
      </div>
      <div className="text-sm text-stone-500">
        Lönekostnad: {(state.farm.employees * 35000).toLocaleString("sv-SE")} kr/mån
        ({(state.farm.employees * 35000 * 3).toLocaleString("sv-SE")} kr/kvartal)
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={hireWorker}>
          +1 anställd
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={fireWorker}
          disabled={state.farm.employees === 0}
        >
          -1 anställd
        </Button>
      </div>
    </div>
  );
}
