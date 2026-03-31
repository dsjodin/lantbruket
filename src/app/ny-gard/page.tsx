"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Region } from "@/types/enums";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useGameStore } from "@/store/gameStore";
import { generateFarmName, nameToSeed } from "@/data/farmNames";

const regionDescriptions: Record<Region, string> = {
  [Region.GotalandSoder]: "Sveriges bästa jordbruksmark. Höga skördar, lågt kompensationsstöd.",
  [Region.GotalandNorra]: "God jordbruksmark i Östergötland/Västergötland. Bra förutsättningar.",
  [Region.Svealand]: "Slättbygder i Mälardalen. Bra odlingsförhållanden med visst kompensationsstöd.",
  [Region.GotalandSkogs]: "Småländska höglandet m.fl. Lägre skördar men högre kompensationsstöd.",
  [Region.MellansverigeSkogs]: "Skogsbygder i Värmland/Dalarna. Utmanande med höga stöd.",
  [Region.Norrland]: "Tuffa förhållanden men högst kompensationsstöd. Kort odlingssäsong.",
};

const steps = ["Ditt namn", "Region", "Storlek", "Startkapital", "Sammanfattning"];

export default function NyGardPage() {
  const router = useRouter();
  const startGame = useGameStore((s) => s.startGame);
  const [step, setStep] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [region, setRegion] = useState<Region>(Region.Svealand);
  const [hectares, setHectares] = useState(60);
  const [startingCapital, setStartingCapital] = useState(500000);
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [totalYears, setTotalYears] = useState(5);

  const farmName = useMemo(
    () => playerName.trim() ? generateFarmName(nameToSeed(playerName)) : "",
    [playerName]
  );

  const handleStart = () => {
    startGame({
      playerName,
      farmName,
      region,
      totalHectares: hectares,
      startingCapital,
      loanAmount,
      totalYears,
    });
    router.push("/spel/oversikt");
  };

  const canNext = () => {
    if (step === 0) return playerName.trim() !== "";
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-stone-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-2 text-center">
          Skapa din gård
        </h1>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-1 text-sm ${
                i === step
                  ? "text-green-700 font-semibold"
                  : i < step
                    ? "text-green-500"
                    : "text-stone-400"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  i === step
                    ? "bg-green-600 text-white"
                    : i < step
                      ? "bg-green-200 text-green-700"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {i + 1}
              </div>
              <span className="hidden sm:inline">{s}</span>
              {i < steps.length - 1 && (
                <span className="text-stone-300 mx-1">—</span>
              )}
            </div>
          ))}
        </div>

        <Card className="max-w-lg mx-auto">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Vad heter du?</h2>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Ditt namn
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Anna Andersson"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              {farmName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs text-green-600 font-medium mb-1">Din gård heter</div>
                  <div className="text-lg font-bold text-green-800">{farmName}</div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Region */}
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Välj region</h2>
              <p className="text-sm text-stone-500">
                Regionen påverkar skördenivåer, EU-stöd och väderrisker.
              </p>
              <div className="space-y-2">
                {Object.values(Region).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r as Region)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      region === r
                        ? "border-green-500 bg-green-50"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="font-medium">{r}</div>
                    <div className="text-sm text-stone-500">
                      {regionDescriptions[r as Region]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Size */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Gårdens storlek</h2>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Areal: {hectares} hektar
                </label>
                <input
                  type="range"
                  min={30}
                  max={150}
                  step={5}
                  value={hectares}
                  onChange={(e) => setHectares(Number(e.target.value))}
                  className="w-full accent-green-600"
                />
                <div className="flex justify-between text-xs text-stone-400">
                  <span>30 ha (liten)</span>
                  <span>150 ha (mellanstor)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Antal spelår
                </label>
                <div className="flex gap-2">
                  {[3, 5, 7, 10].map((y) => (
                    <button
                      key={y}
                      onClick={() => setTotalYears(y)}
                      className={`px-4 py-2 rounded-lg border ${
                        totalYears === y
                          ? "border-green-500 bg-green-50 font-medium"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {y} år
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Capital */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Startkapital och lån</h2>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Eget kapital: {startingCapital.toLocaleString("sv-SE")} kr
                </label>
                <input
                  type="range"
                  min={100000}
                  max={2000000}
                  step={50000}
                  value={startingCapital}
                  onChange={(e) => setStartingCapital(Number(e.target.value))}
                  className="w-full accent-green-600"
                />
                <div className="flex justify-between text-xs text-stone-400">
                  <span>100 000 kr</span>
                  <span>2 000 000 kr</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Banklån: {loanAmount.toLocaleString("sv-SE")} kr (ränta ~5%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={5000000}
                  step={100000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-xs text-stone-400">
                  <span>0 kr (inget lån)</span>
                  <span>5 000 000 kr</span>
                </div>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg text-sm">
                <strong>Total startkassa:</strong>{" "}
                {(startingCapital + loanAmount).toLocaleString("sv-SE")} kr
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sammanfattning</h2>
              <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Lantbrukare:</span>
                  <span className="font-medium">{playerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Gård:</span>
                  <span className="font-medium">{farmName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Region:</span>
                  <span className="font-medium">{region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Areal:</span>
                  <span className="font-medium">{hectares} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Spelperiod:</span>
                  <span className="font-medium">{totalYears} år</span>
                </div>
                <hr className="border-stone-200" />
                <div className="flex justify-between">
                  <span className="text-stone-500">Eget kapital:</span>
                  <span className="font-medium">
                    {startingCapital.toLocaleString("sv-SE")} kr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Banklån:</span>
                  <span className="font-medium">
                    {loanAmount.toLocaleString("sv-SE")} kr
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Startkassa:</span>
                  <span className="text-green-700">
                    {(startingCapital + loanAmount).toLocaleString("sv-SE")} kr
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => step > 0 ? setStep(step - 1) : router.push("/")}
            >
              {step > 0 ? "Tillbaka" : "Avbryt"}
            </Button>

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Nästa
              </Button>
            ) : (
              <Button onClick={handleStart} size="lg">
                Starta gården!
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
