import { CropType } from "@/types/enums";

/** Baspriser per ton i kronor (kr/ton) */
export const BASE_PRICES: Record<CropType, number> = {
  [CropType.Hostvete]: 2200,
  [CropType.Varkorn]: 1900,
  [CropType.Havre]: 1800,
  [CropType.Hostraps]: 4800,
  [CropType.Vall]: 800,
  [CropType.Potatis]: 2500,
  [CropType.Sockerbeta]: 450,
  [CropType.Trada]: 0,
};

/** Prisvolatilitet som standardavvikelse (12%) */
export const PRICE_VOLATILITY = 0.12;
