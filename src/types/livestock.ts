import { AnimalType } from "./enums";

export interface LivestockHerd {
  type: AnimalType;
  count: number;
  healthStatus: number; // 0.0 - 1.0
  productionModifier: number; // 0.8 - 1.2
}

export interface LivestockData {
  type: AnimalType;
  purchasePrice: number; // kr per djur
  annualRevenue: number; // kr per djur och år
  annualFeedCost: number; // kr per djur och år
  annualVetCost: number; // kr per djur och år
  housingCost: number; // kr per djur och år
  requiredHectaresPerAnimal: number; // hektar per djur
}
