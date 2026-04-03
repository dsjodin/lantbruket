import { AnimalType } from "@/types/enums";
import { LivestockData } from "@/types/livestock";

export const LIVESTOCK_DATA: Record<AnimalType, LivestockData> = {
  [AnimalType.Mjolkko]: {
    type: AnimalType.Mjolkko,
    purchasePrice: 30000,
    annualRevenue: 67000,
    annualFeedCost: 16600,
    annualVetCost: 3500,
    housingCost: 8000,
    requiredHectaresPerAnimal: 1.0,
  },
  [AnimalType.Diko]: {
    type: AnimalType.Diko,
    purchasePrice: 15000,
    annualRevenue: 15000,
    annualFeedCost: 9000,
    annualVetCost: 1500,
    housingCost: 3000,
    requiredHectaresPerAnimal: 1.0,
  },
  [AnimalType.Slaktsvin]: {
    type: AnimalType.Slaktsvin,
    purchasePrice: 800,
    annualRevenue: 3200,
    annualFeedCost: 1900,
    annualVetCost: 200,
    housingCost: 300,
    requiredHectaresPerAnimal: 0,
  },
  [AnimalType.Varphons]: {
    type: AnimalType.Varphons,
    purchasePrice: 80,
    annualRevenue: 280,
    annualFeedCost: 120,
    annualVetCost: 15,
    housingCost: 20,
    requiredHectaresPerAnimal: 0.01,
  },
  [AnimalType.Tacka]: {
    type: AnimalType.Tacka,
    purchasePrice: 3000,
    annualRevenue: 4500,
    annualFeedCost: 2000,
    annualVetCost: 500,
    housingCost: 400,
    requiredHectaresPerAnimal: 0.5,
  },
};
