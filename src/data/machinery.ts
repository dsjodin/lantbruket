import { MachineryLevel, BuildingLevel } from "@/types/enums";
import type { Machine } from "@/types/farm";

export interface MachineryUpgrade {
  from: MachineryLevel;
  to: MachineryLevel;
  cost: number;
  efficiencyModifier: number;
  maintenanceCostPerQuarter: number;
}

export interface BuildingUpgrade {
  from: BuildingLevel;
  to: BuildingLevel;
  cost: number;
  maintenanceCostPerQuarter: number;
}

export const MACHINERY_UPGRADES: MachineryUpgrade[] = [
  {
    from: MachineryLevel.Basic,
    to: MachineryLevel.Modern,
    cost: 500000,
    efficiencyModifier: 1.1,
    maintenanceCostPerQuarter: 15000,
  },
  {
    from: MachineryLevel.Modern,
    to: MachineryLevel.Advanced,
    cost: 1200000,
    efficiencyModifier: 1.2,
    maintenanceCostPerQuarter: 30000,
  },
];

export const BUILDING_UPGRADES: BuildingUpgrade[] = [
  {
    from: BuildingLevel.Simple,
    to: BuildingLevel.Standard,
    cost: 300000,
    maintenanceCostPerQuarter: 10000,
  },
  {
    from: BuildingLevel.Standard,
    to: BuildingLevel.Expanded,
    cost: 800000,
    maintenanceCostPerQuarter: 20000,
  },
];

export const MACHINERY_MAINTENANCE: Record<MachineryLevel, number> = {
  [MachineryLevel.Basic]: 8000,
  [MachineryLevel.Modern]: 15000,
  [MachineryLevel.Advanced]: 30000,
};

export const BUILDING_MAINTENANCE: Record<BuildingLevel, number> = {
  [BuildingLevel.Simple]: 5000,
  [BuildingLevel.Standard]: 10000,
  [BuildingLevel.Expanded]: 20000,
};

export const STARTER_MACHINES: Record<MachineryLevel, Machine[]> = {
  [MachineryLevel.Basic]: [
    { id: "m-1", name: "Traktor (begagnad)", type: "traktor", purchaseYear: 0, condition: 0.7, maintenanceCostPerQuarter: 3000 },
    { id: "m-2", name: "Enkel plog", type: "plog", purchaseYear: 0, condition: 0.8, maintenanceCostPerQuarter: 1000 },
    { id: "m-3", name: "Tallriksharv", type: "harv", purchaseYear: 0, condition: 0.75, maintenanceCostPerQuarter: 800 },
    { id: "m-4", name: "Såmaskin (äldre)", type: "saamaskin", purchaseYear: 0, condition: 0.65, maintenanceCostPerQuarter: 1200 },
  ],
  [MachineryLevel.Modern]: [
    { id: "m-1", name: "John Deere 6130R", type: "traktor", purchaseYear: 0, condition: 0.95, maintenanceCostPerQuarter: 4000 },
    { id: "m-2", name: "Kverneland plog", type: "plog", purchaseYear: 0, condition: 0.9, maintenanceCostPerQuarter: 1500 },
    { id: "m-3", name: "Väderstad Carrier", type: "harv", purchaseYear: 0, condition: 0.9, maintenanceCostPerQuarter: 1800 },
    { id: "m-4", name: "Väderstad Rapid", type: "saamaskin", purchaseYear: 0, condition: 0.95, maintenanceCostPerQuarter: 2000 },
    { id: "m-5", name: "Hardi spruta", type: "spruta", purchaseYear: 0, condition: 0.9, maintenanceCostPerQuarter: 1500 },
  ],
  [MachineryLevel.Advanced]: [
    { id: "m-1", name: "Fendt 724 Vario (GPS)", type: "traktor", purchaseYear: 0, condition: 1.0, maintenanceCostPerQuarter: 6000 },
    { id: "m-2", name: "Lemken storplog", type: "plog", purchaseYear: 0, condition: 0.95, maintenanceCostPerQuarter: 2000 },
    { id: "m-3", name: "Väderstad TopDown", type: "harv", purchaseYear: 0, condition: 0.95, maintenanceCostPerQuarter: 2500 },
    { id: "m-4", name: "Väderstad Spirit", type: "saamaskin", purchaseYear: 0, condition: 1.0, maintenanceCostPerQuarter: 3000 },
    { id: "m-5", name: "John Deere spruta", type: "spruta", purchaseYear: 0, condition: 1.0, maintenanceCostPerQuarter: 2500 },
    { id: "m-6", name: "Claas Lexion 770", type: "troska", purchaseYear: 0, condition: 1.0, maintenanceCostPerQuarter: 8000 },
  ],
};

/** Reparationskostnad per maskintyp (kr) */
export const REPAIR_COSTS: Record<string, number> = {
  traktor: 25000,
  plog: 8000,
  harv: 10000,
  saamaskin: 12000,
  troska: 35000,
  spruta: 15000,
};

/** Skickförbättring per reparation */
export const REPAIR_CONDITION_BOOST = 0.25;

export const MACHINE_TYPE_LABELS: Record<string, string> = {
  traktor: "Traktor",
  plog: "Plog",
  harv: "Harv",
  saamaskin: "Såmaskin",
  troska: "Tröska",
  spruta: "Spruta",
};
