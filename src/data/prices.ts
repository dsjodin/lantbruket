import { CropType } from "@/types/enums";

/** Base prices per ton in SEK */
export const BASE_PRICES: Record<CropType, number> = {
  [CropType.Hostvete]: 2200,
  [CropType.Varkorn]: 1900,
  [CropType.Havre]: 1800,
  [CropType.Hostraps]: 4500,
  [CropType.Vall]: 1200,
  [CropType.Potatis]: 2500,
  [CropType.Sockerbeta]: 450,
  [CropType.Trada]: 0,
  [CropType.Varvete]: 2100,
  [CropType.Maltkorn]: 2200,
  [CropType.Foderkorn]: 1700,
  [CropType.Grynhavre]: 2000,
  [CropType.Foderhavre]: 1500,
  [CropType.Hostrag]: 1900,
  [CropType.Ragvete]: 2000,
};

/** Standard deviation as fraction of base price for gaussian fluctuation */
export const PRICE_VOLATILITY: Record<CropType, number> = {
  [CropType.Hostvete]: 0.12,
  [CropType.Varkorn]: 0.10,
  [CropType.Havre]: 0.10,
  [CropType.Hostraps]: 0.15,
  [CropType.Vall]: 0.08,
  [CropType.Potatis]: 0.18,
  [CropType.Sockerbeta]: 0.06,
  [CropType.Trada]: 0,
  [CropType.Varvete]: 0.12,
  [CropType.Maltkorn]: 0.10,
  [CropType.Foderkorn]: 0.10,
  [CropType.Grynhavre]: 0.10,
  [CropType.Foderhavre]: 0.10,
  [CropType.Hostrag]: 0.10,
  [CropType.Ragvete]: 0.10,
};
