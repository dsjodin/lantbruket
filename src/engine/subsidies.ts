/**
 * Swedish agricultural subsidy calculations (2025 CAP structure).
 */

import type { Farm, SubsidyApplication, SubsidyType } from "@/types";
import { Region, AnimalType } from "@/types";
import { REGIONS_DATA } from "@/data/regions";
import {
  OMFORDELNINGSSTOD_PER_HA,
  ECO_SCHEME_PER_HA,
  NOTKREATURSSTOD,
  MIN_CROPS_FOR_ECO_SCHEME,
} from "@/data/subsidies";

/**
 * Calculate subsidies based on Swedish agricultural support rules (2025 CAP).
 * Returns an array of SubsidyApplication objects with status "Beviljad".
 */
export function calculateSubsidies(
  farm: Farm,
  region: Region,
  appliedTypes: SubsidyType[]
): SubsidyApplication[] {
  const regionData = REGIONS_DATA[region];
  const results: SubsidyApplication[] = [];
  const totalHa = farm.totalHectares;

  // Count distinct crops planted (excluding null and fallow)
  const distinctCrops = new Set(
    farm.fields
      .filter((f) => f.crop !== null && f.crop !== "Träda")
      .map((f) => f.crop)
  );

  for (const subsidyType of appliedTypes) {
    let amount = 0;

    switch (subsidyType) {
      case "Grundbetalning":
        // Gårdsstöd per hectare - flat rate across all regions (134.80 EUR/ha)
        amount = totalHa * regionData.grundbetalningPerHa;
        break;

      case "Omfördelningsstöd":
        // 16.40 EUR/ha for all farmers with land
        amount = totalHa * OMFORDELNINGSSTOD_PER_HA;
        break;

      case "Eco-scheme":
        // 41 EUR/ha, requires 3+ different crops if >30ha
        if (totalHa > 30 && distinctCrops.size < MIN_CROPS_FOR_ECO_SCHEME) {
          amount = 0;
        } else {
          amount = totalHa * ECO_SCHEME_PER_HA;
        }
        break;

      case "Kompensationsstöd":
        // Per hectare based on region
        amount = totalHa * regionData.kompensationsstodPerHa;
        break;

      case "Miljöersättning":
        // 900 kr/ha for land with environmental measures (simplified: 50% of land)
        amount = Math.floor(totalHa * 0.5) * 900;
        break;

      case "Djurvälfärdsersättning": {
        const animalWelfareRates: Record<string, number> = {
          [AnimalType.Mjolkko]: 1600,
          [AnimalType.Diko]: 1100,
          [AnimalType.Slaktsvin]: 250,
          [AnimalType.Varphons]: 20,
          [AnimalType.Tacka]: 500,
        };
        amount = farm.livestock.reduce((sum, herd) => {
          const rate = animalWelfareRates[herd.type] ?? 0;
          return sum + herd.count * rate;
        }, 0);
        break;
      }

      case "Nötkreatursstöd": {
        const cowCount = farm.livestock
          .filter(
            (h) => h.type === AnimalType.Mjolkko || h.type === AnimalType.Diko
          )
          .reduce((sum, h) => sum + h.count, 0);
        amount = cowCount * NOTKREATURSSTOD;
        break;
      }
    }

    if (amount > 0) {
      results.push({
        type: subsidyType,
        appliedYear: 0,
        amount: Math.round(amount),
        status: "Beviljad",
      });
    }
  }

  return results;
}
