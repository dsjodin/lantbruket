"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import FloatingAdvanceButton from "@/components/layout/FloatingAdvanceButton";
import QuarterSummary from "@/components/game/QuarterSummary";
import AchievementToast from "@/components/game/AchievementToast";
import SeasonParticles from "@/components/effects/SeasonParticles";
import DecisionTracker from "@/components/game/DecisionTracker";
import PageTransition from "@/components/layout/PageTransition";
import { useGameStore } from "@/store/gameStore";
import { Quarter } from "@/types/enums";

const seasonBg: Record<string, string> = {
  [Quarter.Var]: "bg-[#f0fdf4]",
  [Quarter.Sommar]: "bg-[#fefce8]",
  [Quarter.Host]: "bg-[#fff7ed]",
  [Quarter.Vinter]: "bg-[#eff6ff]",
};

export default function SpelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const advanceQuarter = useGameStore((s) => s.advanceQuarter);
  const save = useGameStore((s) => s.save);
  const showQuarterSummary = useGameStore((s) => s.showQuarterSummary);
  const lastQuarterResult = useGameStore((s) => s.lastQuarterResult);
  const dismissSummary = useGameStore((s) => s.dismissSummary);
  const pendingAchievementToasts = useGameStore((s) => s.pendingAchievementToasts);
  const dismissAchievementToast = useGameStore((s) => s.dismissAchievementToast);

  const load = useGameStore((s) => s.load);

  useEffect(() => {
    if (!state) {
      const loaded = load();
      if (!loaded) {
        router.push("/");
      }
    }
  }, [state, load, router]);

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

  const mainBg = seasonBg[state.currentQuarter] || "bg-white";

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
        <DecisionTracker />
        <main className={`flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto transition-colors duration-500 ${mainBg} relative`}>
          <SeasonParticles quarter={state.currentQuarter} />
          <div className="relative z-10">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>

      <BottomNav />
      <FloatingAdvanceButton
        onClick={advanceQuarter}
        disabled={state.phase !== "decisions"}
      />

      {showQuarterSummary && lastQuarterResult && (
        <QuarterSummary result={lastQuarterResult} onContinue={dismissSummary} />
      )}

      {pendingAchievementToasts.length > 0 && (
        <AchievementToast
          key={pendingAchievementToasts[0].id}
          achievement={pendingAchievementToasts[0]}
          onDone={dismissAchievementToast}
        />
      )}
    </div>
  );
}
