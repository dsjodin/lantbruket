"use client";

import { useGameStore } from "@/store/gameStore";

export default function DecisionTracker() {
  const decisions = useGameStore((s) => s.pendingDecisions);
  const pendingCropCosts = useGameStore((s) => s.pendingCropCosts);

  const counts: string[] = [];

  const cropActions = decisions.cropActions.filter((a) => a.action === "plant").length;
  if (cropActions > 0) counts.push(`${cropActions} falt planterade`);

  const fertActions = decisions.cropActions.filter((a) => a.action === "fertilize").length;
  if (fertActions > 0) counts.push(`${fertActions} godslade`);

  const livestock = decisions.livestockActions.length;
  if (livestock > 0) counts.push(`${livestock} djurandr.`);

  if (decisions.buyMachines.length > 0) counts.push(`${decisions.buyMachines.length} maskin(er)`);
  if (decisions.constructBuildings.length > 0) counts.push(`${decisions.constructBuildings.length} byggnad(er)`);
  if (decisions.repairMachines.length > 0) counts.push(`${decisions.repairMachines.length} reparation(er)`);
  if (decisions.newLoan) counts.push("1 lan ansokt");
  if (decisions.subsidyApplications.length > 0) counts.push(`${decisions.subsidyApplications.length} stod ansokt`);

  if (counts.length === 0) return null;

  return (
    <div className="bg-green-50 border-b border-green-200 px-3 md:px-6 py-1.5 text-xs text-green-700 flex items-center gap-2 overflow-x-auto">
      <span className="font-semibold shrink-0">Beslut:</span>
      <div className="flex gap-1.5 flex-wrap">
        {counts.map((c, i) => (
          <span key={i} className="bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">{c}</span>
        ))}
      </div>
      {pendingCropCosts > 0 && (
        <span className="ml-auto text-stone-500 shrink-0">
          ~{Math.round(pendingCropCosts).toLocaleString("sv-SE")} kr planerad
        </span>
      )}
    </div>
  );
}
