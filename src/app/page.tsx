"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lantbruket-save");
    setHasSavedGame(!!saved);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-amber-50">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="text-6xl mb-4">🌾</div>
        <h1 className="text-5xl font-bold text-green-800 mb-4">Lantbruket</h1>
        <p className="text-xl text-stone-600 mb-2">
          Gårdssimulator för naturbrukselever
        </p>
        <p className="text-stone-500 mb-8 max-w-md mx-auto">
          Driv din egen gård, fatta ekonomiska beslut och lär dig hur
          lantbruksekonomi fungerar med verklig svensk data.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => router.push("/ny-gard")}
            className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl w-64"
          >
            Starta nytt spel
          </button>

          {hasSavedGame && (
            <button
              onClick={() => router.push("/spel/oversikt")}
              className="px-8 py-4 bg-amber-600 text-white text-lg font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-lg w-64"
            >
              Ladda sparat spel
            </button>
          )}
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-stone-500">
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl mb-1">🌱</div>
            <div>Växtodling</div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl mb-1">🐄</div>
            <div>Djurhållning</div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl mb-1">💰</div>
            <div>EU-stöd & Lån</div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="text-2xl mb-1">📊</div>
            <div>Ekonomi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
