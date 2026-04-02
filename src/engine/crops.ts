/**
 * Crop yield calculation and field status helpers.
 */

import { type CropType, type Quarter, type WeatherCondition, type Field, CropType as CT, Quarter as Q } from "@/types";
import type { Machine } from "@/types/farm";
import { CROPS_DATA, ROTATION_EFFECTS } from "@/data/crops";
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
 * Calculate rotation modifier based on field's crop history.
 * Monoculture penalty: -8% per consecutive same crop (max -24%).
 * Good predecessor bonus: +8%. Bad predecessor penalty: -5%.
 */
export function getRotationModifier(previousCrops: CropType[], currentCrop: CropType): number {
  if (!previousCrops || previousCrops.length === 0 || currentCrop === CT.Trada) return 1.0;

  const lastCrop = previousCrops[0];
  let modifier = 1.0;

  // Monokulturstraff: samma gröda i rad
  const consecutiveSame = previousCrops.findIndex(c => c !== currentCrop);
  const sameCount = consecutiveSame === -1 ? previousCrops.length : consecutiveSame;
  if (sameCount >= 1) modifier -= 0.08 * Math.min(sameCount, 3); // -8%, -16%, -24%

  // Växtföljdsbonus/straff baserat på förgröda
  const rotation = ROTATION_EFFECTS[currentCrop];
  if (rotation) {
    if (rotation.goodPredecessors.includes(lastCrop)) modifier += 0.08;
    if (rotation.badPredecessors.includes(lastCrop)) modifier -= 0.05;
  }

  return Math.max(0.7, Math.min(1.15, modifier));
}

/**
 * Update soil quality based on farming activity.
 * Fallow and grass restore soil; intensive crops drain it.
 */
export function updateSoilQuality(
  currentQuality: number,
  crop: CropType | null,
  harvested: boolean,
  hasFertilizer: boolean
): number {
  let sq = currentQuality;

  if (crop === CT.Trada) {
    sq += 0.03; // Träda restaurerar
  } else if (crop === CT.Vall) {
    sq += 0.02; // Vall förbättrar
  } else if (harvested && crop) {
    // Intensiva grödor dränerar mer
    const isIntensive = crop === CT.Potatis || crop === CT.Sockerbeta;
    const drain = isIntensive ? 0.03 : 0.015;
    sq -= hasFertilizer ? drain * 0.3 : drain; // Gödsel bromsar degradering
  }

  return Math.round(Math.max(0.6, Math.min(1.3, sq)) * 100) / 100;
}

/**
 * Worker efficiency modifier based on hectares per employee.
 */
export function getWorkerEfficiencyModifier(employees: number, totalHectares: number): number {
  const haPerWorker = totalHectares / Math.max(1, employees);
  if (haPerWorker <= 50) return 1.05;   // Väl bemannat
  if (haPerWorker <= 100) return 1.0;   // Normalt
  if (haPerWorker <= 150) return 0.93;  // Underbemannat
  return 0.85;                           // Allvarligt underbemannat
}

/**
 * Machine condition modifier on yield.
 * Poor machine condition reduces harvest efficiency.
 */
export function getMachineConditionModifier(machines: Machine[]): number {
  if (!machines || machines.length === 0) return 1.0;
  const avgCondition = machines.reduce((sum, m) => sum + m.condition, 0) / machines.length;
  if (avgCondition >= 0.7) return 1.0;    // Bra skick
  if (avgCondition >= 0.5) return 0.95;   // Slitet: -5%
  if (avgCondition >= 0.3) return 0.88;   // Dåligt: -12%
  return 0.80;                             // Kritiskt: -20%
}

/**
 * Calculate crop yield in tons.
 * Formula: baseYield * hectares * soilQuality * weatherMod * regionMod * fertilizerMod
 *          * rotationMod * workerMod * machineMod
 */
export function calculateYield(
  crop: CropType,
  hectares: number,
  soilQuality: number,
  fertilizerApplied: boolean,
  weather: WeatherCondition,
  regionModifier: number,
  previousCrops?: CropType[],
  employees?: number,
  totalHectares?: number,
  machines?: Machine[],
  machineryEfficiency?: number
): number {
  const cropData = CROPS_DATA[crop];
  const baseYield = cropData.baseYieldPerHa;

  if (baseYield === 0) return 0;

  const weatherMod = getYieldModifier(weather);
  const fertilizerMod = fertilizerApplied ? 1.15 : 0.85;
  const rotationMod = previousCrops ? getRotationModifier(previousCrops, crop) : 1.0;
  const workerMod = (employees != null && totalHectares != null)
    ? getWorkerEfficiencyModifier(employees, totalHectares) : 1.0;
  const machineMod = machines ? getMachineConditionModifier(machines) : 1.0;
  const efficiencyMod = machineryEfficiency ?? 1.0;

  return baseYield * hectares * soilQuality * weatherMod * regionModifier
    * fertilizerMod * rotationMod * workerMod * machineMod * efficiencyMod;
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
