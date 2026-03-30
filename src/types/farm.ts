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
}

export interface Field {
  id: string;
  name: string;
  hectares: number;
  crop: CropType | null;
  soilQuality: number; // 0.8 - 1.2
  fertilizerApplied: boolean;
  status: FieldStatus;
}

export interface CropData {
  type: CropType;
  baseYieldPerHa: number; // ton per hektar
  seedCostPerHa: number; // kr per hektar
  fertilizerCostPerHa: number; // kr per hektar
  harvestCostPerHa: number; // kr per hektar
  plantQuarter: Quarter;
  harvestQuarter: Quarter;
}
