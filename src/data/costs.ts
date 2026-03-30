import { MachineryLevel } from "@/types/enums";

/** Bränslekostnad per hektar och år (kr) */
export const FUEL_COST_PER_HA = 700;

/** Maskinavskrivning per hektar och år beroende på nivå (kr) */
export const MACHINERY_DEPRECIATION_PER_HA: Record<MachineryLevel, number> = {
  [MachineryLevel.Basic]: 1200,
  [MachineryLevel.Modern]: 1800,
  [MachineryLevel.Advanced]: 2500,
};

/** Försäkringskostnad per hektar och år (kr) */
export const INSURANCE_PER_HA = 300;

/** Försäkringskostnad per djur och år (kr) */
export const INSURANCE_PER_ANIMAL = 500;

/** Lönekostnad per anställd och månad, inklusive sociala avgifter (kr) */
export const SALARY_PER_MONTH = 35000;

/** Underhåll av byggnader per hektar och år (kr) */
export const BUILDING_MAINTENANCE_PER_HA = 200;

/** Kostnad för att uppgradera maskinpark (kr) */
export const MACHINERY_UPGRADE_COST = {
  toModern: 500000,
  toAdvanced: 1200000,
};

/** Kostnad för att uppgradera byggnader (kr) */
export const BUILDING_UPGRADE_COST = {
  toStandard: 300000,
  toExpanded: 800000,
};
