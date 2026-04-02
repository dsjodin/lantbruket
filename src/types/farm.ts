import {
  CropType,
  Quarter,
  FieldStatus,
} from "./enums";
import { LivestockHerd } from "./livestock";

export interface Machine {
  id: string;
  name: string;
  type: "traktor" | "plog" | "harv" | "saamaskin" | "troska" | "spruta";
  purchaseYear: number;
  condition: number; // 0.0 - 1.0
  maintenanceCostPerQuarter: number;
}

export interface Building {
  id: string;           // Matches BuildingDef id
  name: string;
  type: "silo" | "maskinhall" | "stall" | "lada" | "verkstad";
  builtYear: number;
  maintenanceCostPerQuarter: number;
  effects: {
    siloCapacity?: number;
    machineProtection?: boolean;
    animalHealthBonus?: number;
    animalCapacity?: number;
    repairDiscount?: number;
  };
}

export interface Farm {
  totalHectares: number;
  fields: Field[];
  livestock: LivestockHerd[];
  employees: number;
  storage: Record<string, number>; // ton lagrad spannmål per CropType
  siloCapacity: number; // max ton totalt (beräknas från byggnader)
  machines: Machine[];
  buildings: Building[];  // Individuella byggnader
}

export interface Field {
  id: string;
  name: string;
  hectares: number;
  crop: CropType | null;
  soilQuality: number; // 0.6 - 1.3 (dynamisk, påverkas av brukande)
  fertilizerApplied: boolean;
  status: FieldStatus;
  plantedYear: number | null;
  plantedQuarter: Quarter | null;
  leased?: boolean; // true if this field is leased (recurring cost)
  leaseAnnualCost?: number; // yearly lease cost (charged quarterly)
  previousCrops: CropType[]; // Historik över senaste 4 grödorna (index 0 = senaste)
}

export interface CropData {
  type: CropType;
  baseYieldPerHa: number; // ton per hektar
  seedCostPerHa: number; // kr per hektar
  fertilizerCostPerHa: number; // kr per hektar
  harvestCostPerHa: number; // kr per hektar
  plantQuarter: Quarter;
  harvestQuarter: Quarter;
  growingSeasons: number; // min antal kvartal från sådd till skörd
  spoilageRate: number; // % förlust per kvartal i lager (0.01 = 1%)
}
