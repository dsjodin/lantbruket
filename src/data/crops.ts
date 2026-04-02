import { CropType, Quarter } from "@/types/enums";
import { CropData } from "@/types/farm";

export const CROPS_DATA: Record<CropType, CropData> = {
  [CropType.Hostvete]: {
    type: CropType.Hostvete,
    baseYieldPerHa: 7.0,
    seedCostPerHa: 1200,
    fertilizerCostPerHa: 2500,
    harvestCostPerHa: 800,
    plantQuarter: Quarter.Host,
    harvestQuarter: Quarter.Host,
    growingSeasons: 4,
    spoilageRate: 0.01,
  },
  [CropType.Varkorn]: {
    type: CropType.Varkorn,
    baseYieldPerHa: 5.5,
    seedCostPerHa: 900,
    fertilizerCostPerHa: 2000,
    harvestCostPerHa: 700,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.01,
  },
  [CropType.Havre]: {
    type: CropType.Havre,
    baseYieldPerHa: 4.5,
    seedCostPerHa: 800,
    fertilizerCostPerHa: 1800,
    harvestCostPerHa: 700,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.01,
  },
  [CropType.Hostraps]: {
    type: CropType.Hostraps,
    baseYieldPerHa: 3.5,
    seedCostPerHa: 1500,
    fertilizerCostPerHa: 3000,
    harvestCostPerHa: 900,
    plantQuarter: Quarter.Host,
    harvestQuarter: Quarter.Host,
    growingSeasons: 4,
    spoilageRate: 0.02,
  },
  [CropType.Vall]: {
    type: CropType.Vall,
    baseYieldPerHa: 8.0,
    seedCostPerHa: 600,
    fertilizerCostPerHa: 1200,
    harvestCostPerHa: 500,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Sommar,
    growingSeasons: 1,
    spoilageRate: 0.02,
  },
  [CropType.Potatis]: {
    type: CropType.Potatis,
    baseYieldPerHa: 35.0,
    seedCostPerHa: 15000,
    fertilizerCostPerHa: 3500,
    harvestCostPerHa: 3000,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.05,
  },
  [CropType.Sockerbeta]: {
    type: CropType.Sockerbeta,
    baseYieldPerHa: 55.0,
    seedCostPerHa: 4000,
    fertilizerCostPerHa: 3000,
    harvestCostPerHa: 2500,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.07,
  },
  [CropType.Trada]: {
    type: CropType.Trada,
    baseYieldPerHa: 0,
    seedCostPerHa: 0,
    fertilizerCostPerHa: 0,
    harvestCostPerHa: 0,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 0,
    spoilageRate: 0,
  },
  [CropType.Varvete]: {
    type: CropType.Varvete,
    baseYieldPerHa: 5.5,
    seedCostPerHa: 1100,
    fertilizerCostPerHa: 2300,
    harvestCostPerHa: 800,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.01,
  },
  [CropType.Maltkorn]: {
    type: CropType.Maltkorn,
    baseYieldPerHa: 5.0,
    seedCostPerHa: 1100,
    fertilizerCostPerHa: 2200,
    harvestCostPerHa: 700,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.01,
  },
  [CropType.Foderkorn]: {
    type: CropType.Foderkorn,
    baseYieldPerHa: 5.5,
    seedCostPerHa: 800,
    fertilizerCostPerHa: 1800,
    harvestCostPerHa: 700,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.01,
  },
  [CropType.Grynhavre]: {
    type: CropType.Grynhavre,
    baseYieldPerHa: 4.5,
    seedCostPerHa: 900,
    fertilizerCostPerHa: 1900,
    harvestCostPerHa: 700,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.01,
  },
  [CropType.Foderhavre]: {
    type: CropType.Foderhavre,
    baseYieldPerHa: 5.0,
    seedCostPerHa: 700,
    fertilizerCostPerHa: 1600,
    harvestCostPerHa: 600,
    plantQuarter: Quarter.Var,
    harvestQuarter: Quarter.Host,
    growingSeasons: 2,
    spoilageRate: 0.01,
  },
  [CropType.Hostrag]: {
    type: CropType.Hostrag,
    baseYieldPerHa: 6.0,
    seedCostPerHa: 1000,
    fertilizerCostPerHa: 2200,
    harvestCostPerHa: 750,
    plantQuarter: Quarter.Host,
    harvestQuarter: Quarter.Host,
    growingSeasons: 4,
    spoilageRate: 0.01,
  },
  [CropType.Ragvete]: {
    type: CropType.Ragvete,
    baseYieldPerHa: 6.5,
    seedCostPerHa: 1100,
    fertilizerCostPerHa: 2400,
    harvestCostPerHa: 800,
    plantQuarter: Quarter.Host,
    harvestQuarter: Quarter.Host,
    growingSeasons: 4,
    spoilageRate: 0.01,
  },
};

/** Alias för bakåtkompatibilitet med engine */
export const CROP_DATA = CROPS_DATA;

/**
 * Växtföljdseffekter: vilka förgrödor som gynnar/missgynnar varje gröda.
 * goodPredecessors ger +8% yield, badPredecessors ger -5% yield (utöver monokulturstraff).
 */
export const ROTATION_EFFECTS: Record<CropType, {
  goodPredecessors: CropType[];
  badPredecessors: CropType[];
}> = {
  [CropType.Hostvete]: {
    goodPredecessors: [CropType.Hostraps, CropType.Potatis, CropType.Vall, CropType.Trada, CropType.Sockerbeta],
    badPredecessors: [], // monokulturstraff räcker
  },
  [CropType.Varkorn]: {
    goodPredecessors: [CropType.Hostraps, CropType.Potatis, CropType.Sockerbeta, CropType.Vall, CropType.Trada],
    badPredecessors: [CropType.Havre, CropType.Foderhavre, CropType.Grynhavre], // spannmål efter spannmål
  },
  [CropType.Havre]: {
    goodPredecessors: [CropType.Hostvete, CropType.Varvete, CropType.Hostraps, CropType.Vall, CropType.Trada],
    badPredecessors: [CropType.Varkorn, CropType.Foderkorn, CropType.Maltkorn],
  },
  [CropType.Hostraps]: {
    goodPredecessors: [CropType.Hostvete, CropType.Varkorn, CropType.Havre, CropType.Hostrag],
    badPredecessors: [CropType.Hostraps], // raps efter raps = klubbrot-risk
  },
  [CropType.Vall]: {
    goodPredecessors: [], // vall trivs överallt
    badPredecessors: [],
  },
  [CropType.Potatis]: {
    goodPredecessors: [CropType.Vall, CropType.Trada, CropType.Hostvete, CropType.Varkorn],
    badPredecessors: [CropType.Potatis, CropType.Sockerbeta], // nematod-risk
  },
  [CropType.Sockerbeta]: {
    goodPredecessors: [CropType.Hostvete, CropType.Varkorn, CropType.Vall, CropType.Trada],
    badPredecessors: [CropType.Sockerbeta, CropType.Potatis], // nematod-risk
  },
  [CropType.Trada]: {
    goodPredecessors: [],
    badPredecessors: [],
  },
  [CropType.Varvete]: {
    goodPredecessors: [CropType.Hostraps, CropType.Potatis, CropType.Vall, CropType.Trada],
    badPredecessors: [CropType.Hostvete], // vete efter vete
  },
  [CropType.Maltkorn]: {
    goodPredecessors: [CropType.Hostraps, CropType.Potatis, CropType.Sockerbeta, CropType.Vall],
    badPredecessors: [CropType.Varkorn, CropType.Foderkorn],
  },
  [CropType.Foderkorn]: {
    goodPredecessors: [CropType.Hostraps, CropType.Vall, CropType.Trada],
    badPredecessors: [CropType.Varkorn, CropType.Maltkorn],
  },
  [CropType.Grynhavre]: {
    goodPredecessors: [CropType.Hostvete, CropType.Varvete, CropType.Hostraps, CropType.Vall],
    badPredecessors: [CropType.Havre, CropType.Foderhavre],
  },
  [CropType.Foderhavre]: {
    goodPredecessors: [CropType.Hostvete, CropType.Varvete, CropType.Hostraps, CropType.Vall],
    badPredecessors: [CropType.Havre, CropType.Grynhavre],
  },
  [CropType.Hostrag]: {
    goodPredecessors: [CropType.Hostraps, CropType.Potatis, CropType.Vall, CropType.Trada],
    badPredecessors: [CropType.Ragvete],
  },
  [CropType.Ragvete]: {
    goodPredecessors: [CropType.Hostraps, CropType.Potatis, CropType.Vall, CropType.Trada],
    badPredecessors: [CropType.Hostrag],
  },
};

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
  [CropType.Varvete]: [Quarter.Var],
  [CropType.Maltkorn]: [Quarter.Var],
  [CropType.Foderkorn]: [Quarter.Var],
  [CropType.Grynhavre]: [Quarter.Var],
  [CropType.Foderhavre]: [Quarter.Var],
  [CropType.Hostrag]: [Quarter.Host],
  [CropType.Ragvete]: [Quarter.Host],
};

/** Vilka kvartal varje gröda skördas */
export const HARVEST_QUARTERS: Record<CropType, Quarter[]> = {
  [CropType.Hostvete]: [Quarter.Host],
  [CropType.Varkorn]: [Quarter.Host],
  [CropType.Havre]: [Quarter.Host],
  [CropType.Hostraps]: [Quarter.Host],
  [CropType.Vall]: [Quarter.Sommar, Quarter.Host],
  [CropType.Potatis]: [Quarter.Host],
  [CropType.Sockerbeta]: [Quarter.Host],
  [CropType.Trada]: [],
  [CropType.Varvete]: [Quarter.Host],
  [CropType.Maltkorn]: [Quarter.Host],
  [CropType.Foderkorn]: [Quarter.Host],
  [CropType.Grynhavre]: [Quarter.Host],
  [CropType.Foderhavre]: [Quarter.Host],
  [CropType.Hostrag]: [Quarter.Host],
  [CropType.Ragvete]: [Quarter.Host],
};
