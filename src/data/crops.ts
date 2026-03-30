import { CropType, Quarter } from "@/types/enums";
import { CropData } from "@/types/farm";

export const CROPS_DATA: Record<CropType, CropData> = {
  [CropType.Hostvete]: {
    type: CropType.Hostvete,
    baseYieldPerHa: 7.0, // ton per hektar
    seedCostPerHa: 1200,
    fertilizerCostPerHa: 2500,
    harvestCostPerHa: 800,
    plantQuarter: Quarter.Host,
    harvestQuarter: Quarter.Host, // skördas hösten året efter
  },
  [CropType.Varkorn]: {
    type: CropType.Varkorn,
    baseYieldPerHa: 5.5,
    seedCostPerHa: 900,
    fertilizerCostPerHa: 2000,
    harvestCostPerHa: 700,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
  },
  [CropType.Havre]: {
    type: CropType.Havre,
    baseYieldPerHa: 4.5,
    seedCostPerHa: 800,
    fertilizerCostPerHa: 1800,
    harvestCostPerHa: 700,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
  },
  [CropType.Hostraps]: {
    type: CropType.Hostraps,
    baseYieldPerHa: 3.5,
    seedCostPerHa: 1500,
    fertilizerCostPerHa: 3000,
    harvestCostPerHa: 900,
    plantQuarter: Quarter.Host,
    harvestQuarter: Quarter.Sommar, // skördas sommaren året efter
  },
  [CropType.Vall]: {
    type: CropType.Vall,
    baseYieldPerHa: 8.0,
    seedCostPerHa: 600,
    fertilizerCostPerHa: 1200,
    harvestCostPerHa: 500,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Sommar, // kan skördas sommar + höst
  },
  [CropType.Potatis]: {
    type: CropType.Potatis,
    baseYieldPerHa: 35.0,
    seedCostPerHa: 15000,
    fertilizerCostPerHa: 3500,
    harvestCostPerHa: 3000,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
  },
  [CropType.Sockerbeta]: {
    type: CropType.Sockerbeta,
    baseYieldPerHa: 55.0,
    seedCostPerHa: 4000,
    fertilizerCostPerHa: 3000,
    harvestCostPerHa: 2500,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
  },
  [CropType.Trada]: {
    type: CropType.Trada,
    baseYieldPerHa: 0,
    seedCostPerHa: 0,
    fertilizerCostPerHa: 0,
    harvestCostPerHa: 0,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
  },
};

/** Alias för bakåtkompatibilitet med engine */
export const CROP_DATA = CROPS_DATA;

/** Vilka kvartal varje gröda kan planteras */
export const PLANTING_QUARTERS: Record<CropType, Quarter[]> = {
  [CropType.Hostvete]: [Quarter.Host],
  [CropType.Varkorn]: [Quarter.Var],
  [CropType.Havre]: [Quarter.Var],
  [CropType.Hostraps]: [Quarter.Host],
  [CropType.Vall]: [Quarter.Var],
  [CropType.Potatis]: [Quarter.Var],
  [CropType.Sockerbeta]: [Quarter.Var],
  [CropType.Trada]: [Quarter.Var, Quarter.Host],
};

/** Vilka kvartal varje gröda skördas */
export const HARVEST_QUARTERS: Record<CropType, Quarter[]> = {
  [CropType.Hostvete]: [Quarter.Host],
  [CropType.Varkorn]: [Quarter.Host],
  [CropType.Havre]: [Quarter.Host],
  [CropType.Hostraps]: [Quarter.Sommar],
  [CropType.Vall]: [Quarter.Sommar, Quarter.Host],
  [CropType.Potatis]: [Quarter.Host],
  [CropType.Sockerbeta]: [Quarter.Host],
  [CropType.Trada]: [],
};
