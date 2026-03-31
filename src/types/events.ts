import {
  EventCategory,
  CropType,
  AnimalType,
  Quarter,
  WeatherCondition,
} from "./enums";
import { FinancialRecord } from "./economics";

export interface GameEvent {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  effects: EventEffect[];
  quarters: Quarter[]; // Vilka kvartal händelsen kan inträffa
  probability: number; // 0.0 - 1.0
}

export interface EventEffect {
  type:
    | "yieldModifier"
    | "priceModifier"
    | "costModifier"
    | "animalHealth"
    | "directCost"
    | "directIncome";
  target?: CropType | AnimalType;
  value: number;
}

export interface QuarterRecord {
  year: number;
  quarter: Quarter;
  events: GameEvent[];
  financialRecord: FinancialRecord;
  weather: WeatherCondition;
  marketPrices: Record<CropType, number>;
}
