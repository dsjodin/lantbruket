import { AnimalType } from "@/types/enums";
import { LivestockData } from "@/types/livestock";

export const LIVESTOCK_DATA: Record<AnimalType, LivestockData> = {
  [AnimalType.Mjolkko]: {
    type: AnimalType.Mjolkko,
    purchasePrice: 25000,
    annualRevenue: 40000,
    annualFeedCost: 18000,
    annualVetCost: 2000,
    housingCost: 3000,
    requiredHectaresPerAnimal: 0.8,
  },
  [AnimalType.Diko]: {
    type: AnimalType.Diko,
    purchasePrice: 15000,
    annualRevenue: 12000,
    annualFeedCost: 8000,
    annualVetCost: 1500,
    housingCost: 2000,
    requiredHectaresPerAnimal: 1.0,
  },
  [AnimalType.Slaktsvin]: {
    type: AnimalType.Slaktsvin,
    purchasePrice: 800,
    annualRevenue: 2800,
    annualFeedCost: 1600,
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
