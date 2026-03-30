import { MachineryLevel, BuildingLevel } from "@/types/enums";

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
