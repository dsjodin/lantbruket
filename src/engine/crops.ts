/**
 * Crop yield calculation and field status helpers.
 */

import { type CropType, type Quarter, type WeatherCondition, type Field, CropType as CT } from "@/types";
import { CROPS_DATA } from "@/data/crops";
import { getYieldModifier } from "./weather";

/**
 * Calculate crop yield in tons.
 * Formula: baseYield * hectares * soilQuality * weatherMod * regionMod * fertilizerMod
 */
export function calculateYield(
  crop: CropType,
  hectares: number,
  soilQuality: number,
  fertilizerApplied: boolean,
  weather: WeatherCondition,
  regionModifier: number
): number {
  const cropData = CROPS_DATA[crop];
  const baseYield = cropData.baseYieldPerHa;

  if (baseYield === 0) return 0;

  const weatherMod = getYieldModifier(weather);
  const fertilizerMod = fertilizerApplied ? 1.15 : 0.85;

  return baseYield * hectares * soilQuality * weatherMod * regionModifier * fertilizerMod;
}

/**
 * Get fields that are ready to be harvested this quarter.
 * A field is harvestable if it has a crop, its status is "Skördeklar",
 * and the crop's harvest quarter matches.
 */
export function getHarvestableFields(fields: Field[], quarter: Quarter): Field[] {
  return fields.filter((field) => {
    if (!field.crop) return false;
    const cropData = CROPS_DATA[field.crop];
    return cropData.harvestQuarter === quarter && field.status === "Skördeklar";
  });
}

/**
 * Get fields that can be planted this quarter.
 * A field is plantable if it has no crop (or is fallow/harvested)
 * and the current quarter is a valid planting quarter for at least one crop.
 */
export function getPlantableFields(fields: Field[], quarter: Quarter): Field[] {
  // Check if any crop can be planted this quarter
  const plantableCrops = Object.values(CT).filter(
    (cropType) => CROPS_DATA[cropType].plantQuarter === quarter
  );
  if (plantableCrops.length === 0) return [];

  return fields.filter((field) => {
    // Field must be unplanted or harvested
    return !field.crop || field.status === "Skördad" || field.status === "Oplöjd";
  });
}
