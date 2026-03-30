"use client";

import { create } from "zustand";
import { GameState, QuarterDecisions, CropType, AnimalType, SubsidyType } from "@/types";
import { Region } from "@/types/enums";
import { CROPS_DATA } from "@/data/crops";
import { LIVESTOCK_DATA } from "@/data/livestock";
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
  messages: { text: string; type: "success" | "error" | "info" }[];

  startGame: (params: {
    playerName: string;
    farmName: string;
    region: Region;
    totalHectares: number;
    startingCapital: number;
    loanAmount: number;
    totalYears: number;
  }) => void;

  // Direct actions that immediately update game state
  plantCrop: (fieldId: string, cropType: CropType) => void;
  fertilizeField: (fieldId: string) => void;
  harvestField: (fieldId: string) => void;
  buyLivestock: (type: AnimalType, count: number) => void;
  sellLivestock: (type: AnimalType, count: number) => void;
  hireWorker: () => void;
  fireWorker: () => void;
  applyForSubsidies: (types: SubsidyType[]) => void;
  takeLoan: (amount: number, termYears: number, interestRate: number) => void;

  updateDecisions: (partial: Partial<QuarterDecisions>) => void;
  advanceQuarter: () => void;
  clearMessages: () => void;
  save: () => void;
  load: () => boolean;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  pendingDecisions: { ...emptyDecisions },
  messages: [],

  startGame: (params) => {
    const gameState = createInitialGameState(params);
    set({ state: gameState, pendingDecisions: { ...emptyDecisions }, messages: [] });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(gameState)); } catch {}
  },

  plantCrop: (fieldId, cropType) => {
    const { state } = get();
    if (!state) return;

    const fieldIdx = state.farm.fields.findIndex((f) => f.id === fieldId);
    if (fieldIdx === -1) return;

    const field = state.farm.fields[fieldIdx];
    if (field.crop !== null) {
      set({ messages: [{ text: "Fältet har redan en gröda!", type: "error" }] });
      return;
    }

    const cropData = CROPS_DATA[cropType];
    const seedCost = cropData.seedCostPerHa * field.hectares;

    if (state.finances.cashBalance < seedCost) {
      set({ messages: [{ text: `Inte tillräckligt med pengar! Kostar ${seedCost.toLocaleString("sv-SE")} kr.`, type: "error" }] });
      return;
    }

    const newFields = [...state.farm.fields];
    newFields[fieldIdx] = { ...field, crop: cropType, status: "Sådd", fertilizerApplied: false };

    // Also track in pendingDecisions for the engine
    const pd = get().pendingDecisions;

    set({
      state: {
        ...state,
        farm: { ...state.farm, fields: newFields },
        finances: { ...state.finances, cashBalance: state.finances.cashBalance - seedCost },
      },
      pendingDecisions: {
        ...pd,
        cropActions: [...pd.cropActions, { fieldId, action: "plant" as const, cropType }],
      },
      messages: [{ text: `${cropType} planterad på ${field.hectares} ha! (-${seedCost.toLocaleString("sv-SE")} kr)`, type: "success" }],
    });
  },

  fertilizeField: (fieldId) => {
    const { state } = get();
    if (!state) return;

    const fieldIdx = state.farm.fields.findIndex((f) => f.id === fieldId);
    if (fieldIdx === -1) return;

    const field = state.farm.fields[fieldIdx];
    if (!field.crop || field.fertilizerApplied) return;

    const cropData = CROPS_DATA[field.crop];
    const fertCost = cropData.fertilizerCostPerHa * field.hectares;

    if (state.finances.cashBalance < fertCost) {
      set({ messages: [{ text: `Inte tillräckligt med pengar! Kostar ${fertCost.toLocaleString("sv-SE")} kr.`, type: "error" }] });
      return;
    }

    const newFields = [...state.farm.fields];
    newFields[fieldIdx] = { ...field, fertilizerApplied: true };

    const pd = get().pendingDecisions;
    set({
      state: {
        ...state,
        farm: { ...state.farm, fields: newFields },
        finances: { ...state.finances, cashBalance: state.finances.cashBalance - fertCost },
      },
      pendingDecisions: {
        ...pd,
        cropActions: [...pd.cropActions, { fieldId, action: "fertilize" as const }],
      },
      messages: [{ text: `${field.crop} gödslad! (-${fertCost.toLocaleString("sv-SE")} kr)`, type: "success" }],
    });
  },

  harvestField: (fieldId) => {
    const { state } = get();
    if (!state) return;

    const fieldIdx = state.farm.fields.findIndex((f) => f.id === fieldId);
    if (fieldIdx === -1) return;

    const field = state.farm.fields[fieldIdx];
    if (!field.crop) return;

    const newFields = [...state.farm.fields];
    newFields[fieldIdx] = { ...field, status: "Skördad" };

    const pd = get().pendingDecisions;
    set({
      state: {
        ...state,
        farm: { ...state.farm, fields: newFields },
      },
      pendingDecisions: {
        ...pd,
        cropActions: [...pd.cropActions, { fieldId, action: "harvest" as const }],
      },
      messages: [{ text: `${field.crop} skördad på ${field.hectares} ha!`, type: "success" }],
    });
  },

  buyLivestock: (type, count) => {
    const { state } = get();
    if (!state || count <= 0) return;

    const data = LIVESTOCK_DATA[type];
    const cost = data.purchasePrice * count;

    if (state.finances.cashBalance < cost) {
      set({ messages: [{ text: `Inte tillräckligt med pengar! Kostar ${cost.toLocaleString("sv-SE")} kr.`, type: "error" }] });
      return;
    }

    const livestock = [...state.farm.livestock];
    const existingIdx = livestock.findIndex((h) => h.type === type);

    if (existingIdx !== -1) {
      livestock[existingIdx] = {
        ...livestock[existingIdx],
        count: livestock[existingIdx].count + count,
      };
    } else {
      livestock.push({
        type,
        count,
        healthStatus: 1.0,
        productionModifier: 1.0,
      });
    }

    const pd = get().pendingDecisions;
    set({
      state: {
        ...state,
        farm: { ...state.farm, livestock },
        finances: { ...state.finances, cashBalance: state.finances.cashBalance - cost },
      },
      pendingDecisions: {
        ...pd,
        livestockActions: [...pd.livestockActions, { type, action: "buy" as const, count }],
      },
      messages: [{ text: `Köpt ${count} ${type}! (-${cost.toLocaleString("sv-SE")} kr)`, type: "success" }],
    });
  },

  sellLivestock: (type, count) => {
    const { state } = get();
    if (!state || count <= 0) return;

    const livestock = [...state.farm.livestock];
    const existingIdx = livestock.findIndex((h) => h.type === type);
    if (existingIdx === -1 || livestock[existingIdx].count < count) {
      set({ messages: [{ text: "Inte tillräckligt med djur!", type: "error" }] });
      return;
    }

    const data = LIVESTOCK_DATA[type];
    const sellPrice = Math.round(data.purchasePrice * 0.7 * count);

    livestock[existingIdx] = {
      ...livestock[existingIdx],
      count: livestock[existingIdx].count - count,
    };

    // Remove herd if empty
    if (livestock[existingIdx].count <= 0) {
      livestock.splice(existingIdx, 1);
    }

    const pd = get().pendingDecisions;
    set({
      state: {
        ...state,
        farm: { ...state.farm, livestock },
        finances: { ...state.finances, cashBalance: state.finances.cashBalance + sellPrice },
      },
      pendingDecisions: {
        ...pd,
        livestockActions: [...pd.livestockActions, { type, action: "sell" as const, count }],
      },
      messages: [{ text: `Sålt ${count} ${type}! (+${sellPrice.toLocaleString("sv-SE")} kr)`, type: "success" }],
    });
  },

  hireWorker: () => {
    const { state } = get();
    if (!state) return;

    set({
      state: {
        ...state,
        farm: { ...state.farm, employees: state.farm.employees + 1 },
      },
      messages: [{ text: `Anställt 1 person. Nu ${state.farm.employees + 1} anställda.`, type: "success" }],
    });
  },

  fireWorker: () => {
    const { state } = get();
    if (!state || state.farm.employees <= 0) return;

    set({
      state: {
        ...state,
        farm: { ...state.farm, employees: state.farm.employees - 1 },
      },
      messages: [{ text: `Sagt upp 1 person. Nu ${state.farm.employees - 1} anställda.`, type: "info" }],
    });
  },

  applyForSubsidies: (types) => {
    const pd = get().pendingDecisions;
    set({
      pendingDecisions: { ...pd, subsidyApplications: types },
      messages: [{ text: `Ansökt om ${types.length} stödtyper.`, type: "success" }],
    });
  },

  takeLoan: (amount, termYears, interestRate) => {
    const pd = get().pendingDecisions;
    set({
      pendingDecisions: { ...pd, newLoan: { amount, termYears, interestRate } },
      messages: [{ text: `Lån på ${amount.toLocaleString("sv-SE")} kr ansökt. Beviljas vid kvartalsskifte.`, type: "info" }],
    });
  },

  updateDecisions: (partial) => {
    const current = get().pendingDecisions;
    set({ pendingDecisions: { ...current, ...partial } });
  },

  clearMessages: () => set({ messages: [] }),

  advanceQuarter: () => {
    const { state, pendingDecisions } = get();
    if (!state || state.phase !== "decisions") return;

    // Auto-sell all harvested crops
    const sellCrops = { ...pendingDecisions.sellCrops };
    for (const field of state.farm.fields) {
      if (field.crop && (field.status === "Skördeklar" || field.status === "Skördad")) {
        const cropType = field.crop as CropType;
        sellCrops[cropType] = (sellCrops[cropType] || 0) + 999;
      }
    }

    const decisions: QuarterDecisions = { ...pendingDecisions, sellCrops };
    const newState = advanceQuarter(state, decisions);

    set({
      state: newState,
      pendingDecisions: { ...emptyDecisions },
      messages: [],
    });

    try { localStorage.setItem(SAVE_KEY, JSON.stringify(newState)); } catch {}
  },

  save: () => {
    const { state } = get();
    if (state) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
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
    } catch {}
    return false;
  },

  reset: () => {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    set({ state: null, pendingDecisions: { ...emptyDecisions }, messages: [] });
  },
}));
