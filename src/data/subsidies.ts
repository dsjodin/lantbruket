import { AnimalType, CropType, Region } from "@/types/enums";
import type { Farm } from "@/types/farm";
import type { SubsidyApplication } from "@/types/economics";
import { REGIONS_DATA } from "./regions";

/** Omfördelningsstöd per hektar (kr) - 16.40 EUR x 11.06 */
export const OMFORDELNINGSSTOD_PER_HA = 181;

/** Eco-scheme (precisionsjordbruk/planering) per hektar (kr) - 41 EUR x 11.06 */
export const ECO_SCHEME_PER_HA = 453;

/** Miljöersättning per hektar, genomsnittligt (kr) */
export const MILJOERSATTNING_PER_HA = 900;

/** Djurvälfärdsersättning per djur och år (kr) */
export const DJURVALFARD_PER_ANIMAL: Partial<Record<AnimalType, number>> = {
  [AnimalType.Mjolkko]: 1600,
  [AnimalType.Diko]: 750,
  [AnimalType.Slaktsvin]: 500,
  [AnimalType.Tacka]: 600,
};

/** Nötkreatursstöd per nötkreatur och år (kr) - 93.23 EUR x 11.06 */
export const NOTKREATURSSTOD = 1031;

/** Minst 3 grödor krävs för eco-scheme på gårdar > 30 ha */
export const MIN_CROPS_FOR_ECO_SCHEME = 3;

/**
 * Beräkna stödberättigande och uppskattade belopp.
 * Returnerar en lista med potentiella stödansökningar.
 */
export function calculateSubsidies(
  farm: Farm,
  region: Region
): SubsidyApplication[] {
  const regionData = REGIONS_DATA[region];
  const totalHa = farm.totalHectares;
  const currentYear = 0;
  const subsidies: SubsidyApplication[] = [];

  // Grundbetalning (gårdsstöd) - alla jordbrukare med stödberättigad mark
  if (totalHa > 0) {
    subsidies.push({
      type: "Grundbetalning",
      appliedYear: currentYear,
      amount: Math.round(regionData.grundbetalningPerHa * totalHa),
      status: "Ansökt",
    });
  }

  // Omfördelningsstöd - alla jordbrukare med mark
  if (totalHa > 0) {
    subsidies.push({
      type: "Omfördelningsstöd",
      appliedYear: currentYear,
      amount: Math.round(OMFORDELNINGSSTOD_PER_HA * totalHa),
      status: "Ansökt",
    });
  }

  // Eco-scheme (precisionsjordbruk) - krav på grödmångfald
  const uniqueCrops = new Set(
    farm.fields
      .filter((f) => f.crop !== null && f.crop !== CropType.Trada)
      .map((f) => f.crop)
  );
  const eligibleForEcoScheme =
    totalHa <= 30 || uniqueCrops.size >= MIN_CROPS_FOR_ECO_SCHEME;

  if (eligibleForEcoScheme && totalHa > 0) {
    subsidies.push({
      type: "Eco-scheme",
      appliedYear: currentYear,
      amount: Math.round(ECO_SCHEME_PER_HA * totalHa),
      status: "Ansökt",
    });
  }

  // Kompensationsstöd - bara i regioner med kompensationsstöd > 0
  if (regionData.kompensationsstodPerHa > 0 && totalHa > 0) {
    subsidies.push({
      type: "Kompensationsstöd",
      appliedYear: currentYear,
      amount: Math.round(regionData.kompensationsstodPerHa * totalHa),
      status: "Ansökt",
    });
  }

  // Miljöersättning - kräver att det finns vall eller träda
  const hasVallOrTrada = farm.fields.some(
    (f) => f.crop === CropType.Vall || f.crop === CropType.Trada
  );
  if (hasVallOrTrada) {
    const vallHa = farm.fields
      .filter((f) => f.crop === CropType.Vall || f.crop === CropType.Trada)
      .reduce((sum, f) => sum + f.hectares, 0);
    subsidies.push({
      type: "Miljöersättning",
      appliedYear: currentYear,
      amount: Math.round(MILJOERSATTNING_PER_HA * vallHa),
      status: "Ansökt",
    });
  }

  // Djurvälfärdsersättning
  for (const herd of farm.livestock) {
    const perAnimal = DJURVALFARD_PER_ANIMAL[herd.type];
    if (perAnimal && herd.count > 0) {
      subsidies.push({
        type: "Djurvälfärdsersättning",
        appliedYear: currentYear,
        amount: Math.round(perAnimal * herd.count),
        status: "Ansökt",
      });
    }
  }

  // Nötkreatursstöd - för mjölkkor och dikor
  const notkreatur = farm.livestock
    .filter(
      (h) => h.type === AnimalType.Mjolkko || h.type === AnimalType.Diko
    )
    .reduce((sum, h) => sum + h.count, 0);
  if (notkreatur > 0) {
    subsidies.push({
      type: "Nötkreatursstöd",
      appliedYear: currentYear,
      amount: Math.round(NOTKREATURSSTOD * notkreatur),
      status: "Ansökt",
    });
  }

  return subsidies;
}
