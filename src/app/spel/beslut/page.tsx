"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Quarter, CropType, AnimalType, SubsidyType } from "@/types/enums";
import { CROPS_DATA, PLANTING_QUARTERS, ROTATION_EFFECTS } from "@/data/crops";
import { LIVESTOCK_DATA } from "@/data/livestock";
import { REGIONS_DATA } from "@/data/regions";
import { REPAIR_COSTS } from "@/data/machinery";
import { getRotationModifier, getWorkerEfficiencyModifier } from "@/engine/crops";

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

      <LandOffersCard />

      {currentQuarter === Quarter.Var && <SpringDecisions />}
      {currentQuarter === Quarter.Sommar && <SummerDecisions />}
      {currentQuarter === Quarter.Host && <AutumnDecisions />}
      {currentQuarter === Quarter.Vinter && <WinterDecisions />}
    </div>
  );
}

function LandOffersCard() {
  const state = useGameStore((s) => s.state)!;
  const acceptLandOffer = useGameStore((s) => s.acceptLandOffer);
  const declineLandOffer = useGameStore((s) => s.declineLandOffer);

  const offers = state.pendingLandOffers || [];
  if (offers.length === 0) return null;

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const isLease = offer.type === "lease";
        const canAfford = isLease || state.finances.cashBalance >= offer.totalPrice;
        const pricePerHa = Math.round(offer.totalPrice / offer.hectares);
        return (
          <div
            key={offer.id}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏡</span>
                  <span className="font-semibold text-stone-800">
                    {isLease ? "Arrendemark tillgänglig" : "Mark till salu"}
                  </span>
                </div>
                <p className="text-sm text-stone-600 mt-1">{offer.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-stone-500">
                  <span>{offer.hectares} ha</span>
                  <span>Jordkvalitet: {Math.round(offer.soilQuality * 100)}%</span>
                  <span>{pricePerHa.toLocaleString("sv-SE")} kr/ha{isLease ? "/år" : ""}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => acceptLandOffer(offer.id)}
                disabled={!canAfford}
              >
                {isLease
                  ? `Arrendera (${offer.totalPrice.toLocaleString("sv-SE")} kr/år)`
                  : `Köp (${offer.totalPrice.toLocaleString("sv-SE")} kr)`}
                {!canAfford && " — ej råd"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => declineLandOffer(offer.id)}
              >
                Avböj
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpringDecisions() {
  const state = useGameStore((s) => s.state)!;

  const springCrops = Object.values(CropType).filter(
    (c) => c !== CropType.Trada && PLANTING_QUARTERS[c]?.includes(Quarter.Var)
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <PlantingCard crops={springCrops} quarter={Quarter.Var} />

      <Card title="Köp djur" accent="blue">
        <LivestockBuyer />
      </Card>

      <GrainSalesCard />
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

      <GrainSalesCard />

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

  const growingFields = state.farm.fields.filter(
    (f) => f.crop && f.status !== "Skördad" && f.status !== "Oplöjd"
  );

  const autumnCrops = Object.values(CropType).filter(
    (c) => c !== CropType.Trada && PLANTING_QUARTERS[c]?.includes(Quarter.Host)
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Skörd" accent="orange">
        <p className="text-sm text-stone-500 mb-3">
          Grödorna skördas automatiskt vid kvartalsskifte och lagras i silon.
          Sälj sedan spannmål när marknadspriset passar dig.
        </p>
        {growingFields.length === 0 ? (
          <p className="text-sm text-stone-400">Inga grödor att skörda detta kvartal.</p>
        ) : (
          <div className="space-y-2">
            {growingFields.map((f) => (
              <div key={f.id} className="flex justify-between items-center py-2 border-b border-stone-100">
                <div>
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-xs text-stone-400 ml-2">
                    {f.crop} — {f.hectares} ha
                  </span>
                </div>
                <Badge color={f.status === "Växande" ? "green" : f.status === "Skördeklar" ? "amber" : "blue"}>
                  {f.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <GrainSalesCard />

      <PlantingCard crops={autumnCrops} quarter={Quarter.Host} />

      <Card title="Sälj djur">
        <LivestockSeller />
      </Card>
    </div>
  );
}

function getSubsidyEstimate(type: SubsidyType, state: NonNullable<ReturnType<typeof useGameStore.getState>["state"]>): number {
  const regionData = REGIONS_DATA[state.region];
  const ha = state.farm.totalHectares;
  const distinctCrops = new Set(state.farm.fields.filter(f => f.crop).map(f => f.crop));

  switch (type) {
    case "Grundbetalning": return Math.round(ha * regionData.grundbetalningPerHa);
    case "Förgröningsstöd": return (ha > 30 && distinctCrops.size < 3) ? 0 : Math.round(ha * 700);
    case "Kompensationsstöd": return Math.round(ha * regionData.kompensationsstodPerHa);
    case "Miljöersättning": return Math.round(Math.floor(ha * 0.5) * 900);
    case "Djurvälfärdsersättning": {
      const rates: Record<string, number> = { Mjölkko: 1600, Diko: 1100, Slaktsvin: 250, Värphöns: 20, Tacka: 500 };
      return Math.round(state.farm.livestock.reduce((s, h) => s + h.count * (rates[h.type] ?? 0), 0));
    }
    case "Nötkreatursstöd": {
      const cows = state.farm.livestock.filter(h => h.type === "Mjölkko" || h.type === "Diko").reduce((s, h) => s + h.count, 0);
      return cows * 1050;
    }
    default: return 0;
  }
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

  // Pre-check basic subsidies that virtually all Swedish farmers apply for
  const defaultSubsidies: SubsidyType[] = ["Grundbetalning", "Förgröningsstöd"];
  const [applied, setApplied] = useState<SubsidyType[]>(
    pendingDecisions.subsidyApplications.length > 0
      ? pendingDecisions.subsidyApplications
      : defaultSubsidies
  );

  // Auto-apply defaults on first render
  useEffect(() => {
    if (pendingDecisions.subsidyApplications.length === 0 && applied.length > 0) {
      applyForSubsidies(applied);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          {subsidyTypes.map((st) => {
            const estimate = getSubsidyEstimate(st, state);
            return (
              <label key={st} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={applied.includes(st)}
                  onChange={(e) => handleSubsidyToggle(st, e.target.checked)}
                  className="accent-green-600 w-4 h-4"
                />
                <span className="flex-1">{st}</span>
                {estimate > 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    ~{estimate.toLocaleString("sv-SE")} kr
                  </span>
                )}
                {estimate === 0 && (
                  <span className="text-xs text-stone-400">ej aktuell</span>
                )}
              </label>
            );
          })}
        </div>
        {applied.length > 0 && (() => {
          const totalEstimate = applied.reduce((s, st) => s + getSubsidyEstimate(st, state), 0);
          return (
            <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
              {applied.length} stödtyper valda — uppskattad utbetalning: <strong>{totalEstimate.toLocaleString("sv-SE")} kr</strong>
              <div className="text-xs text-green-600 mt-1">Utbetalas nästa vår.</div>
            </div>
          );
        })()}
      </Card>

      <Card title="Underhåll & investeringar" accent="amber">
        <MachineRepairSection />
      </Card>

      <GrainSalesCard />

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
  const pendingCropCosts = useGameStore((s) => s.pendingCropCosts);

  const [selectedCrop, setSelectedCrop] = useState<CropType>(crops[0]);

  const emptyFields = state.farm.fields.filter((f) => f.crop === null);
  const availableHa = emptyFields.reduce((s, f) => s + f.hectares, 0);
  const availableCash = state.finances.cashBalance - pendingCropCosts;

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
              const canAfford = availableCash >= cost;
              const rotMod = getRotationModifier(f.previousCrops || [], selectedCrop);
              const rotPercent = Math.round((rotMod - 1) * 100);
              const lastCrop = f.previousCrops?.[0];
              return (
                <div key={f.id} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">{f.name} </span>
                    <span className="text-xs text-stone-400">
                      ({f.hectares} ha, jord {Math.round(f.soilQuality * 100)}%)
                    </span>
                    {lastCrop && (
                      <span className="text-xs text-stone-400 ml-1">
                        [föreg: {lastCrop}]
                      </span>
                    )}
                    {rotPercent !== 0 && (
                      <span className={`text-xs ml-1 font-semibold ${rotPercent > 0 ? "text-green-600" : "text-red-500"}`}>
                        {rotPercent > 0 ? "+" : ""}{rotPercent}% växtföljd
                      </span>
                    )}
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
  const pendingCropCosts = useGameStore((s) => s.pendingCropCosts);

  const unfertilized = state.farm.fields.filter(f => f.crop && !f.fertilizerApplied);
  const availableCash = state.finances.cashBalance - pendingCropCosts;

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
            const canAfford = availableCash >= cost;
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

  const workerMod = getWorkerEfficiencyModifier(state.farm.employees, state.farm.totalHectares);
  const workerPercent = Math.round((workerMod - 1) * 100);
  const haPerWorker = Math.round(state.farm.totalHectares / Math.max(1, state.farm.employees));

  let staffLabel = "Normalt";
  let staffColor = "text-stone-600";
  if (workerPercent > 0) { staffLabel = "Väl bemannat"; staffColor = "text-green-600"; }
  else if (workerPercent < -10) { staffLabel = "Allvarligt underbemannat"; staffColor = "text-red-600"; }
  else if (workerPercent < 0) { staffLabel = "Underbemannat"; staffColor = "text-amber-600"; }

  return (
    <div className="space-y-2">
      <div className="text-sm">
        Nuvarande: <strong>{state.farm.employees}</strong> anställda
        <span className="text-xs text-stone-400 ml-2">({haPerWorker} ha/anställd)</span>
      </div>
      <div className={`text-xs font-medium ${staffColor}`}>
        {staffLabel} ({workerPercent >= 0 ? "+" : ""}{workerPercent}% skördeeffektivitet)
      </div>
      <div className="text-sm text-stone-500">
        Lönekostnad: {(state.farm.employees * 100000).toLocaleString("sv-SE")} kr/kvartal
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

function MachineRepairSection() {
  const state = useGameStore((s) => s.state)!;
  const repairMachine = useGameStore((s) => s.repairMachine);
  const updateDecisions = useGameStore((s) => s.updateDecisions);

  const machines = state.farm.machines || [];
  const avgCondition = machines.length > 0
    ? machines.reduce((sum, m) => sum + m.condition, 0) / machines.length
    : 1;
  const condPercent = Math.round(avgCondition * 100);

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <span className="text-stone-500">Maskinpark:</span>{" "}
        <span className="font-medium">{state.farm.machinery}</span>
        {condPercent < 70 && (
          <span className={`text-xs ml-2 font-semibold ${condPercent < 50 ? "text-red-600" : "text-amber-600"}`}>
            (snittskick {condPercent}% — påverkar skörd {condPercent < 50 ? "-12%" : condPercent < 70 ? "-5%" : ""})
          </span>
        )}
      </div>
      {machines.length > 0 && (
        <div className="space-y-1.5">
          {machines.map((m) => {
            const condColor = m.condition > 0.7 ? "text-green-600" : m.condition > 0.4 ? "text-amber-600" : "text-red-600";
            const repairCost = REPAIR_COSTS[m.type] ?? 15000;
            const canRepair = m.condition < 0.85 && state.finances.cashBalance >= repairCost;
            const needsRepair = m.condition < 0.7;
            return (
              <div key={m.id} className="flex justify-between items-center text-sm py-1 border-b border-stone-100">
                <span>{m.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${condColor}`}>{Math.round(m.condition * 100)}%</span>
                  {needsRepair && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => repairMachine(m.id)}
                      disabled={!canRepair}
                    >
                      Reparera ({(repairCost / 1000)}k)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-sm mt-2">
        <span className="text-stone-500">Byggnader:</span>{" "}
        <span className="font-medium">{state.farm.buildings}</span>
      </div>
      <div className="flex gap-2">
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
    </div>
  );
}

function GrainSalesCard() {
  const state = useGameStore((s) => s.state)!;
  const sellGrain = useGameStore((s) => s.sellGrain);
  const [sellAmounts, setSellAmounts] = useState<Record<string, number>>({});

  const storage = state.farm.storage || {};
  const prices = state.currentMarketPrices || {};
  const totalStored = Object.values(storage).reduce((a, b) => a + b, 0);
  const siloCapacity = state.farm.siloCapacity || 500;

  const storedCrops = Object.entries(storage).filter(([, tons]) => tons >= 0.05);

  // Build price history for stored crops
  const priceHistory: Record<string, number[]> = {};
  for (const [crop] of storedCrops) {
    priceHistory[crop] = state.history
      .slice(-8)
      .map((h) => (h.marketPrices as Record<string, number>)?.[crop] ?? 0)
      .filter((p) => p > 0);
  }

  return (
    <Card title="Spannmålslager & Försäljning" accent="amber">
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-stone-500">Silo</span>
          <span className="font-medium">{totalStored.toFixed(0)} / {siloCapacity} ton</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${totalStored / siloCapacity > 0.9 ? "bg-red-500" : "bg-amber-500"}`}
            style={{ width: `${Math.min(100, (totalStored / siloCapacity) * 100)}%` }}
          />
        </div>
      </div>

      {/* Spoilage warning for perishable crops */}
      {storedCrops.some(([crop]) => {
        const cd = CROPS_DATA[crop as CropType];
        return cd && cd.spoilageRate >= 0.03;
      }) && (
        <div className="text-xs px-2 py-1.5 mb-2 rounded bg-amber-50 text-amber-700">
          Färskvaror (potatis, sockerbetor) tappar {">"}3% per kvartal i lager. Sälj snart!
        </div>
      )}

      {storedCrops.length === 0 ? (
        <p className="text-sm text-stone-400">
          Inget lagrat. Grödorna hamnar här automatiskt efter skörd.
        </p>
      ) : (
        <div className="space-y-3">
          {storedCrops.map(([crop, tons]) => {
            const price = prices[crop] ?? 0;
            const amount = sellAmounts[crop] ?? Math.round(tons * 10) / 10;
            const clampedAmount = Math.round(Math.min(amount, tons) * 10) / 10;
            const estimatedRevenue = Math.round(clampedAmount * price);
            const history = priceHistory[crop] || [];
            const avgPrice = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : price;
            const priceVsAvg = avgPrice > 0 ? ((price - avgPrice) / avgPrice) * 100 : 0;

            return (
              <div key={crop} className="p-2 bg-stone-50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{crop}</span>
                  <span className="text-xs text-stone-500">{tons.toFixed(1)} ton i lager</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-stone-500">
                    Marknadspris: <strong className="text-stone-700">{price.toLocaleString("sv-SE")} kr/ton</strong>
                    {Math.abs(priceVsAvg) > 3 && (
                      <span className={`ml-1.5 font-semibold ${priceVsAvg > 0 ? "text-green-600" : "text-red-500"}`}>
                        {priceVsAvg > 0 ? "▲" : "▼"} {Math.abs(Math.round(priceVsAvg))}%
                      </span>
                    )}
                  </div>
                  {/* Mini sparkline */}
                  {history.length >= 2 && (
                    <MiniSparkline values={[...history, price]} />
                  )}
                </div>

                {Math.abs(priceVsAvg) > 5 && (
                  <div className={`text-xs px-2 py-1 rounded ${priceVsAvg > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {priceVsAvg > 0
                      ? `Priset ligger ${Math.round(priceVsAvg)}% över snittet — bra tillfälle att sälja!`
                      : `Priset ligger ${Math.abs(Math.round(priceVsAvg))}% under snittet — överväg att vänta.`}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={Math.round(tons * 10) / 10}
                    step={0.1}
                    value={clampedAmount}
                    onChange={(e) => setSellAmounts({ ...sellAmounts, [crop]: Number(e.target.value) })}
                    className="flex-1 accent-amber-600"
                  />
                  <span className="text-xs w-16 text-right">{clampedAmount.toFixed(1)} ton</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-700">
                    = {estimatedRevenue.toLocaleString("sv-SE")} kr
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        sellGrain(crop as CropType, Math.round(tons * 10) / 10);
                        setSellAmounts({ ...sellAmounts, [crop]: 0 });
                      }}
                      disabled={tons < 0.05}
                    >
                      Sälj allt
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        sellGrain(crop as CropType, clampedAmount);
                        setSellAmounts({ ...sellAmounts, [crop]: 0 });
                      }}
                      disabled={clampedAmount <= 0}
                    >
                      Sälj
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 bg-blue-50 p-2 rounded text-xs text-blue-700">
        <strong>Tips:</strong> Marknadspriserna ändras varje kvartal. Du kan vänta
        med att sälja om du tror att priset stiger!
      </div>
    </Card>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  const color = lastVal >= prevVal ? "#16a34a" : "#dc2626";

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      <circle cx={w} cy={h - ((lastVal - min) / range) * h} r="2" fill={color} />
    </svg>
  );
}
