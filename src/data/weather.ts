import { Quarter, WeatherCondition } from "@/types/enums";

export interface WeatherProbabilities {
  Normalt: number;
  Torka: number;
  Översvämning: number;
  Frost: number;
  Utmärkt: number;
}

export const WEATHER_PROBABILITIES: Record<Quarter, WeatherProbabilities> = {
  [Quarter.Var]: {
    Frost: 0.15,
    Normalt: 0.70,
    Utmärkt: 0.15,
    Torka: 0,
    Översvämning: 0,
  },
  [Quarter.Sommar]: {
    Torka: 0.15,
    Normalt: 0.65,
    Utmärkt: 0.15,
    Översvämning: 0.05,
    Frost: 0,
  },
  [Quarter.Host]: {
    Översvämning: 0.10,
    Normalt: 0.70,
    Utmärkt: 0.10,
    Frost: 0.10,
    Torka: 0,
  },
  [Quarter.Vinter]: {
    Frost: 0.20,
    Normalt: 0.70,
    Utmärkt: 0.10,
    Torka: 0,
    Översvämning: 0,
  },
};

export const WEATHER_YIELD_MODIFIERS: Record<WeatherCondition, number> = {
  Torka: 0.65,
  Frost: 0.7,
  Översvämning: 0.6,
  Normalt: 1.0,
  Utmärkt: 1.2,
};
