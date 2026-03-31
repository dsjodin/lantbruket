/**
 * Crop yield calculation and field status helpers.
 */

import { type CropType, type Quarter, type WeatherCondition, type Field, CropType as CT, Quarter as Q } from "@/types";
import { CROPS_DATA } from "@/data/crops";
import { getYieldModifier } from "./weather";

/**
 * Map quarters to sequential index for elapsed-time calculations.
 */
export function quarterIndex(q: Quarter): number {
  switch (q) {
    case Q.Var: return 0;
    case Q.Sommar: return 1;
    case Q.Host: return 2;
    case Q.Vinter: return 3;
  }
}

/**
 * Calculate how many quarters have elapsed between planting and current time.
 */
export function elapsedQuarters(
  plantedYear: number,
  plantedQuarter: Quarter,
  currentYear: number,
  currentQuarter: Quarter
): number {
  return (currentYear - plantedYear) * 4
    + (quarterIndex(currentQuarter) - quarterIndex(plantedQuarter));
}

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
 * Check if a field is ready for harvest based on elapsed growing time.
 */
export function isReadyForHarvest(
  field: Field,
  currentYear: number,
  currentQuarter: Quarter
): boolean {
  if (!field.crop) return false;
  if (field.plantedYear == null || field.plantedQuarter == null) return false;
  if (field.status === "Oplöjd" || field.status === "Skördad") return false;

  const cropData = CROPS_DATA[field.crop];
  const elapsed = elapsedQuarters(field.plantedYear, field.plantedQuarter, currentYear, currentQuarter);

  return cropData.harvestQuarter === currentQuarter && elapsed >= cropData.growingSeasons;
}

/**
 * Get fields that are ready to be harvested this quarter.
 */
export function getHarvestableFields(fields: Field[], quarter: Quarter, currentYear: number): Field[] {
  return fields.filter((field) => isReadyForHarvest(field, currentYear, quarter));
}

/**
 * Get fields that can be planted this quarter.
 */
export function getPlantableFields(fields: Field[], quarter: Quarter): Field[] {
  const plantableCrops = Object.values(CT).filter(
    (cropType) => CROPS_DATA[cropType].plantQuarter === quarter
  );
  if (plantableCrops.length === 0) return [];

  return fields.filter((field) => {
    return !field.crop || field.status === "Skördad" || field.status === "Oplöjd";
  });
}
