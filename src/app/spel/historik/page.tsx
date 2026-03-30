"use client";

import { useGameStore } from "@/store/gameStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function HistorikPage() {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { history } = state;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Historik</h1>

      {history.length === 0 ? (
        <Card>
          <p className="text-stone-400">Ingen historik ännu. Avsluta ditt första kvartal.</p>
        </Card>
      ) : (
        [...history].reverse().map((record, i) => (
          <Card key={i}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">
                År {record.year} - {record.quarter}
              </h3>
              <div className="flex gap-2">
                <Badge color="blue">{record.weather}</Badge>
                <Badge
                  color={record.financialRecord.netResult >= 0 ? "green" : "red"}
                >
                  {record.financialRecord.netResult >= 0 ? "+" : ""}
                  {Math.round(record.financialRecord.netResult).toLocaleString("sv-SE")} kr
                </Badge>
              </div>
            </div>

            {record.events.length > 0 && (
              <div className="space-y-1 mb-2">
                {record.events.map((event) => (
                  <div key={event.id} className="text-sm bg-amber-50 p-2 rounded">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-stone-500"> - {event.description}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-500">Intäkter:</span>{" "}
                <span className="text-green-600">
                  {Math.round(
                    record.financialRecord.revenue.cropSales +
                    record.financialRecord.revenue.livestockIncome +
                    record.financialRecord.revenue.subsidies
                  ).toLocaleString("sv-SE")} kr
                </span>
              </div>
              <div>
                <span className="text-stone-500">Kassa:</span>{" "}
                <span className="font-medium">
                  {Math.round(record.financialRecord.cashBalanceEnd).toLocaleString("sv-SE")} kr
                </span>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
