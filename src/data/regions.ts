import { Region } from "@/types/enums";

export interface RegionData {
  yieldModifier: number;
  grundbetalningPerHa: number;
  kompensationsstodPerHa: number;
  description: string;
}

export const REGIONS_DATA: Record<Region, RegionData> = {
  [Region.GotalandSoder]: {
    yieldModifier: 1.1,
    grundbetalningPerHa: 1490,
    kompensationsstodPerHa: 0,
    description:
      "Sveriges bästa jordbruksmark med höga skördar och gynnsamt klimat. Här odlas bland annat sockerbeta och höstvete med utmärkta resultat.",
  },
  [Region.GotalandNorra]: {
    yieldModifier: 1.05,
    grundbetalningPerHa: 1490,
    kompensationsstodPerHa: 0,
    description:
      "God jordbruksmark i Östergötland och Västergötland. Mångsidigt jordbruk med både växtodling och djurhållning.",
  },
  [Region.Svealand]: {
    yieldModifier: 1.0,
    grundbetalningPerHa: 1490,
    kompensationsstodPerHa: 500,
    description:
      "Mellansvenska slättbygder med genomsnittliga odlingsförhållanden. Varierade gårdar med blandad produktion.",
  },
  [Region.GotalandSkogs]: {
    yieldModifier: 0.9,
    grundbetalningPerHa: 1490,
    kompensationsstodPerHa: 1200,
    description:
      "Skogsbygder i Götaland med kuperad terräng. Lägre skördenivåer men kompenseras delvis av EU-stöd.",
  },
  [Region.MellansverigeSkogs]: {
    yieldModifier: 0.85,
    grundbetalningPerHa: 1490,
    kompensationsstodPerHa: 2000,
    description:
      "Skogsbygder i Mellansverige med tuffa odlingsförhållanden. Ofta kombinerat med skogsbruk.",
  },
  [Region.Norrland]: {
    yieldModifier: 0.7,
    grundbetalningPerHa: 1490,
    kompensationsstodPerHa: 3600,
    description:
      "Norrlands inland med korta odlingssäsonger och långa vintrar. Höga kompensationsstöd gör jordbruk möjligt.",
  },
};
