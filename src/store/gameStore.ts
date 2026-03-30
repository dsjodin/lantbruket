"use client";

import { create } from "zustand";
import { GameState, QuarterDecisions, CropType, SubsidyType } from "@/types";
import { Region } from "@/types/enums";
import {
  createInitialGameState,
  advanceQuarter,
} from "@/engine/gameLoop";

const SAVE_KEY = "lantbruket-save";

const emptyDecisions: QuarterDecisions = {
  cropActions: [],
  livestockActions: [],
  hireWorkers: 0,
  newLoan: null,
  subsidyApplications: [],
  machineryUpgrade: false,
  buildingUpgrade: false,
  sellCrops: {} as Record<CropType, number>,
};

interface GameStore {
  state: GameState | null;
  pendingDecisions: QuarterDecisions;

  startGame: (params: {
    playerName: string;
    farmName: string;
    region: Region;
    totalHectares: number;
    startingCapital: number;
    loanAmount: number;
    totalYears: number;
  }) => void;

  updateDecisions: (partial: Partial<QuarterDecisions>) => void;
  advanceQuarter: () => void;
  save: () => void;
  load: () => boolean;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  pendingDecisions: { ...emptyDecisions },

  startGame: (params) => {
    const gameState = createInitialGameState(params);
    set({ state: gameState, pendingDecisions: { ...emptyDecisions } });
    // Auto-save
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch {
      // Ignore storage errors
    }
  },

  updateDecisions: (partial) => {
    const current = get().pendingDecisions;
    set({
      pendingDecisions: { ...current, ...partial },
    });
  },

  advanceQuarter: () => {
    const { state, pendingDecisions } = get();
    if (!state || state.phase !== "decisions") return;

    // Auto-sell all harvested crops if no explicit sell decisions
    const sellCrops = { ...pendingDecisions.sellCrops };
    // Default: sell everything that was harvested
    for (const field of state.farm.fields) {
      if (field.crop && (field.status === "Skördeklar" || field.status === "Växande")) {
        const cropType = field.crop as CropType;
        if (!(cropType in sellCrops)) {
          // Auto-sell based on yield estimate
          sellCrops[cropType] = (sellCrops[cropType] || 0) + 999; // Sell all available
        }
      }
    }

    const decisions: QuarterDecisions = {
      ...pendingDecisions,
      sellCrops,
    };

    const newState = advanceQuarter(state, decisions);
    set({
      state: newState,
      pendingDecisions: { ...emptyDecisions },
    });

    // Auto-save
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(newState));
    } catch {
      // Ignore storage errors
    }
  },

  save: () => {
    const { state } = get();
    if (state) {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }
    }
  },

  load: () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const gameState = JSON.parse(saved) as GameState;
        set({ state: gameState, pendingDecisions: { ...emptyDecisions } });
        return true;
      }
    } catch {
      // Ignore parse errors
    }
    return false;
  },

  reset: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // Ignore
    }
    set({ state: null, pendingDecisions: { ...emptyDecisions } });
  },
}));
