import {
  CropType,
  Quarter,
  MachineryLevel,
  BuildingLevel,
  FieldStatus,
} from "./enums";
import { LivestockHerd } from "./livestock";

export interface Farm {
  totalHectares: number;
  fields: Field[];
  livestock: LivestockHerd[];
  machinery: MachineryLevel;
  buildings: BuildingLevel;
  employees: number;
  storage: Record<string, number>; // ton lagrad spannmål per CropType
  siloCapacity: number; // max ton totalt
}

export interface Field {
  id: string;
  name: string;
  hectares: number;
  crop: CropType | null;
  soilQuality: number; // 0.8 - 1.2
  fertilizerApplied: boolean;
  status: FieldStatus;
  plantedYear: number | null;
  plantedQuarter: Quarter | null;
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
}
