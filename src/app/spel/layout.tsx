"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useGameStore } from "@/store/gameStore";

export default function SpelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const advanceQuarter = useGameStore((s) => s.advanceQuarter);
  const save = useGameStore((s) => s.save);

  useEffect(() => {
    if (!state) {
      const saved = localStorage.getItem("lantbruket-save");
      if (!saved) {
        router.push("/");
      }
    }
  }, [state, router]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Laddar...</p>
      </div>
    );
  }

  if (state.phase === "ended") {
    router.push("/resultat");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar
          quarter={state.currentQuarter}
          year={state.currentYear}
          cashBalance={state.finances.cashBalance}
          farmName={state.farmName}
          onSave={save}
          onAdvanceQuarter={advanceQuarter}
          phase={state.phase}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
