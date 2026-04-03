"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";

export default function StodPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { subsidies } = state.finances;

  const statusColors: Record<string, "green" | "amber" | "blue" | "stone"> = {
    "Ansökt": "amber",
    "Beviljad": "blue",
    "Utbetald": "green",
    "Avslagen": "stone",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">EU-stöd & bidrag</h1>

      <Card>
        <p className="text-sm text-stone-500 mb-4">
          EU:s jordbruksstöd utgör en viktig del av svenska lantbrukares inkomst.
          Ansök om stöd under vintern för att få utbetalning följande år.
        </p>
      </Card>

      {subsidies.length === 0 ? (
        <Card>
          <p className="text-stone-400">
            Inga stödansökningar ännu. Ansök under &quot;Beslut&quot;-fliken på vintern.
          </p>
        </Card>
      ) : (
        <Card title="Dina stödansökningar">
          <Table
            headers={["Stödtyp", "År", "Belopp", "Status"]}
            rows={subsidies.map((s) => [
              s.type,
              `År ${s.appliedYear}`,
              s.amount.toLocaleString("sv-SE") + " kr",
              <Badge key={s.type + s.appliedYear} color={statusColors[s.status] || "stone"}>
                {s.status}
              </Badge>,
            ])}
          />
        </Card>
      )}

      <Card title="Stödtyper">
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-stone-50 rounded-lg">
            <div className="font-medium">Grundbetalning (Gårdsstöd)</div>
            <div className="text-stone-500">
              Betalas per hektar stödberättigad mark. Nivån beror på region.
            </div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg">
            <div className="font-medium">Omfördelningsstöd</div>
            <div className="text-stone-500">
              ~181 kr/ha. Betalas till alla jordbrukare med stödberättigad mark.
            </div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg">
            <div className="font-medium">Eco-scheme (Precisionsjordbruk)</div>
            <div className="text-stone-500">
              ~453 kr/ha. Kräver växtföljd med minst 3 grödor om gården är över 30 ha.
            </div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg">
            <div className="font-medium">Kompensationsstöd</div>
            <div className="text-stone-500">
              Stöd för jordbruk i områden med sämre förutsättningar. Högst i Norrland.
            </div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg">
            <div className="font-medium">Miljöersättning</div>
            <div className="text-stone-500">
              Stöd för miljöfrämjande åtgärder som fånggrödor och betesmarker.
            </div>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg">
            <div className="font-medium">Djurvälfärdsersättning</div>
            <div className="text-stone-500">
              Stöd per djur för att upprätthålla hög djurvälfärd.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
