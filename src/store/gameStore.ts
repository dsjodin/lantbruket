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
import { STARTER_MACHINES } from "@/data/machinery";

const SAVE_KEY = "lantbruket-save";

export interface QuarterResult {
  year: number;
  quarter: string;
  previousCash: number;
  newCash: number;
  cashChange: number;
  weather: string;
  events: { title: string; description: string; category: string; effects: { type: string; value: number; target?: string }[] }[];
  harvestedCrops: Record<string, number>; // crop → tons added to storage
  financialRecord: {
    revenue: { cropSales: number; livestockIncome: number; subsidies: number; other: number };
    costs: { seeds: number; fertilizer: number; fuel: number; machinery: number; feed: number; veterinary: number; salaries: number; loanInterest: number; loanAmortization: number; insurance: number; buildingMaintenance: number; other: number };
    netResult: number;
  };
  marketPrices: Record<string, number>;
  previousMarketPrices: Record<string, number>;
}

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
  showQuarterSummary: boolean;
  lastQuarterResult: QuarterResult | null;

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
  sellGrain: (cropType: CropType, tons: number) => void;
  buyLivestock: (type: AnimalType, count: number) => void;
  sellLivestock: (type: AnimalType, count: number) => void;
  hireWorker: () => void;
  fireWorker: () => void;
  applyForSubsidies: (types: SubsidyType[]) => void;
  takeLoan: (amount: number, termYears: number, interestRate: number) => void;
  acceptLandOffer: (offerId: string) => void;
  declineLandOffer: (offerId: string) => void;

  updateDecisions: (partial: Partial<QuarterDecisions>) => void;
  advanceQuarter: () => void;
  dismissSummary: () => void;
  clearMessages: () => void;
  save: () => void;
  load: () => boolean;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  pendingDecisions: { ...emptyDecisions },
  messages: [],
  showQuarterSummary: false,
  lastQuarterResult: null,

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
    newFields[fieldIdx] = {
      ...field,
      crop: cropType,
      status: "Sådd",
      fertilizerApplied: false,
      plantedYear: state.currentYear,
      plantedQuarter: state.currentQuarter,
    };

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

  sellGrain: (cropType, tons) => {
    const { state } = get();
    if (!state || tons <= 0) return;

    const storage = state.farm.storage || {};
    const available = storage[cropType] ?? 0;

    if (available < tons) {
      set({ messages: [{ text: `Inte tillräckligt i lager! Har ${available.toFixed(1)} ton ${cropType}.`, type: "error" }] });
      return;
    }

    const pricePerTon = state.currentMarketPrices?.[cropType] ?? 0;
    const revenue = Math.round(tons * pricePerTon);

    const newStorage = { ...storage, [cropType]: Math.round((available - tons) * 10) / 10 };
    // Remove zero entries
    if (newStorage[cropType] <= 0) delete newStorage[cropType];

    set({
      state: {
        ...state,
        farm: { ...state.farm, storage: newStorage },
        finances: { ...state.finances, cashBalance: state.finances.cashBalance + revenue },
      },
      messages: [{
        text: `Sålt ${tons.toFixed(1)} ton ${cropType} à ${pricePerTon.toLocaleString("sv-SE")} kr/ton = +${revenue.toLocaleString("sv-SE")} kr!`,
        type: "success",
      }],
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

  acceptLandOffer: (offerId) => {
    const { state } = get();
    if (!state) return;

    const offer = (state.pendingLandOffers || []).find((o) => o.id === offerId);
    if (!offer) return;

    if (state.finances.cashBalance < offer.totalPrice) {
      set({ messages: [{ text: `Inte tillräckligt med pengar! Kostar ${offer.totalPrice.toLocaleString("sv-SE")} kr.`, type: "error" }] });
      return;
    }

    // Create new fields from the offer
    const newFields: { id: string; name: string; hectares: number; crop: null; soilQuality: number; fertilizerApplied: boolean; status: "Oplöjd"; plantedYear: null; plantedQuarter: null }[] = [];
    const fieldCount = offer.hectares > 15 ? 2 : 1;
    for (let i = 0; i < fieldCount; i++) {
      const ha = i === fieldCount - 1
        ? offer.hectares - newFields.reduce((s, f) => s + f.hectares, 0)
        : Math.round(offer.hectares / fieldCount);
      newFields.push({
        id: `field-${state.farm.fields.length + i + 1}`,
        name: `${offer.fieldName} ${fieldCount > 1 ? (i + 1) : ""}`.trim(),
        hectares: ha,
        crop: null,
        soilQuality: offer.soilQuality,
        fertilizerApplied: false,
        status: "Oplöjd" as const,
        plantedYear: null,
        plantedQuarter: null,
      });
    }

    const updatedOffers = (state.pendingLandOffers || []).filter((o) => o.id !== offerId);
    const newTotalHa = state.farm.totalHectares + offer.hectares;

    set({
      state: {
        ...state,
        farm: {
          ...state.farm,
          totalHectares: newTotalHa,
          fields: [...state.farm.fields, ...newFields],
          siloCapacity: Math.round(newTotalHa * 5),
        },
        finances: {
          ...state.finances,
          cashBalance: state.finances.cashBalance - offer.totalPrice,
        },
        pendingLandOffers: updatedOffers,
      },
      messages: [{
        text: `${offer.type === "buy" ? "Köpt" : "Arrenderat"} ${offer.hectares} ha mark (${offer.fieldName})! (-${offer.totalPrice.toLocaleString("sv-SE")} kr)`,
        type: "success",
      }],
    });
  },

  declineLandOffer: (offerId) => {
    const { state } = get();
    if (!state) return;

    const updatedOffers = (state.pendingLandOffers || []).filter((o) => o.id !== offerId);
    set({
      state: { ...state, pendingLandOffers: updatedOffers },
      messages: [{ text: "Erbjudandet avböjt.", type: "info" }],
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

    const previousCash = state.finances.cashBalance;
    const previousStorage = { ...(state.farm.storage || {}) };
    const previousMarketPrices = { ...(state.currentMarketPrices || {}) };

    const newState = advanceQuarter(state, pendingDecisions);

    // Compute harvested crops (storage diff)
    const newStorage = newState.farm.storage || {};
    const harvestedCrops: Record<string, number> = {};
    for (const [crop, tons] of Object.entries(newStorage)) {
      const prev = previousStorage[crop] ?? 0;
      const diff = tons - prev;
      if (diff > 0.05) harvestedCrops[crop] = Math.round(diff * 10) / 10;
    }

    // Build quarter result from the latest history entry
    const latestRecord = newState.history[newState.history.length - 1];
    const quarterResult: QuarterResult = {
      year: state.currentYear,
      quarter: state.currentQuarter,
      previousCash,
      newCash: newState.finances.cashBalance,
      cashChange: newState.finances.cashBalance - previousCash,
      weather: latestRecord?.weather ?? "Normalt",
      events: (newState.activeEvents || []).map(e => ({
        title: e.title,
        description: e.description,
        category: e.category,
        effects: e.effects.map(eff => ({ type: eff.type, value: eff.value, target: eff.target as string | undefined })),
      })),
      harvestedCrops,
      financialRecord: latestRecord ? {
        revenue: { ...latestRecord.financialRecord.revenue },
        costs: { ...latestRecord.financialRecord.costs },
        netResult: latestRecord.financialRecord.netResult,
      } : {
        revenue: { cropSales: 0, livestockIncome: 0, subsidies: 0, other: 0 },
        costs: { seeds: 0, fertilizer: 0, fuel: 0, machinery: 0, feed: 0, veterinary: 0, salaries: 0, loanInterest: 0, loanAmortization: 0, insurance: 0, buildingMaintenance: 0, other: 0 },
        netResult: 0,
      },
      marketPrices: { ...(newState.currentMarketPrices || {}) },
      previousMarketPrices,
    };

    set({
      state: newState,
      pendingDecisions: { ...emptyDecisions },
      messages: [],
      showQuarterSummary: true,
      lastQuarterResult: quarterResult,
    });

    try { localStorage.setItem(SAVE_KEY, JSON.stringify(newState)); } catch {}
  },

  dismissSummary: () => {
    set({ showQuarterSummary: false });
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

        // Migrate old saves: add missing plantedYear/plantedQuarter
        for (const field of gameState.farm.fields) {
          if (field.crop && (field.plantedYear === undefined || field.plantedYear === null)) {
            const cropData = CROPS_DATA[field.crop as CropType];
            field.plantedQuarter = cropData.plantQuarter;
            field.plantedYear = Math.max(1, gameState.currentYear - 1);
          }
          if (field.plantedYear === undefined) field.plantedYear = null;
          if (field.plantedQuarter === undefined) field.plantedQuarter = null;
        }

        // Migrate: add missing storage/siloCapacity
        if (!gameState.farm.storage) gameState.farm.storage = {};
        if (!gameState.farm.siloCapacity) gameState.farm.siloCapacity = 500;

        // Migrate: add missing currentMarketPrices
        if (!gameState.currentMarketPrices) gameState.currentMarketPrices = {};

        // Migrate: add missing pendingLandOffers
        if (!gameState.pendingLandOffers) gameState.pendingLandOffers = [];

        // Migrate: add missing machines array
        if (!gameState.farm.machines) {
          const starterSet = STARTER_MACHINES[gameState.farm.machinery];
          gameState.farm.machines = starterSet
            ? starterSet.map((m) => ({ ...m, purchaseYear: gameState.currentYear }))
            : [];
        }

        set({ state: gameState, pendingDecisions: { ...emptyDecisions } });
        return true;
      }
    } catch {}
    return false;
  },

  reset: () => {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    set({ state: null, pendingDecisions: { ...emptyDecisions }, messages: [], showQuarterSummary: false, lastQuarterResult: null });
  },
}));
