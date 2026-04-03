import type { GameState } from "@/types";

export type AchievementRarity = "common" | "rare" | "epic";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  check: (state: GameState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- Common ---
  {
    id: "first_harvest",
    title: "Forsta skorden",
    description: "Skorda din forsta groda.",
    icon: "🌾",
    rarity: "common",
    check: (s) => {
      const total = Object.values(s.lastHarvestedCrops || {}).reduce((a, b) => a + b, 0);
      return total > 0;
    },
  },
  {
    id: "first_animal",
    title: "Djuragare",
    description: "Kop ditt forsta djur.",
    icon: "🐄",
    rarity: "common",
    check: (s) => s.farm.livestock.length > 0,
  },
  {
    id: "first_loan",
    title: "Lanat kapital",
    description: "Ta ditt forsta lan.",
    icon: "🏦",
    rarity: "common",
    check: (s) => s.finances.loans.length > 0,
  },
  {
    id: "first_machine",
    title: "Maskinagare",
    description: "Kop din forsta maskin fran butiken.",
    icon: "🚜",
    rarity: "common",
    check: (s) => (s.farm.machines || []).length > 4,
  },
  {
    id: "first_building",
    title: "Byggmastare",
    description: "Bygg din forsta byggnad.",
    icon: "🏗",
    rarity: "common",
    check: (s) => (s.farm.buildings || []).length > 0,
  },
  {
    id: "first_subsidy",
    title: "EU-mottagare",
    description: "Fa din forsta EU-stodutbetalning.",
    icon: "🇪🇺",
    rarity: "common",
    check: (s) => s.finances.subsidies.some((sub) => sub.status === "Utbetald"),
  },
  {
    id: "profitable_quarter",
    title: "I svarta siffror",
    description: "Avsluta ett kvartal med vinst.",
    icon: "📈",
    rarity: "common",
    check: (s) => {
      const last = s.history[s.history.length - 1];
      return last ? last.financialRecord.netResult > 0 : false;
    },
  },

  // --- Rare ---
  {
    id: "diversified",
    title: "Diversifierad",
    description: "Odla 4 eller fler olika grodor samtidigt.",
    icon: "🌈",
    rarity: "rare",
    check: (s) => {
      const crops = new Set(s.farm.fields.filter((f) => f.crop && f.crop !== "Tr\u00e4da").map((f) => f.crop));
      return crops.size >= 4;
    },
  },
  {
    id: "debt_free",
    title: "Skuldfri",
    description: "Betala av alla lan.",
    icon: "🎉",
    rarity: "rare",
    check: (s) => s.finances.loans.length === 0 && s.history.length >= 4,
  },
  {
    id: "big_herd",
    title: "Stor besattning",
    description: "Ha minst 50 djur totalt.",
    icon: "🐮",
    rarity: "rare",
    check: (s) => s.farm.livestock.reduce((sum, h) => sum + h.count, 0) >= 50,
  },
  {
    id: "healthy_animals",
    title: "Djurvan",
    description: "Alla djurbesattningar har over 90% halsa.",
    icon: "💚",
    rarity: "rare",
    check: (s) => {
      if (s.farm.livestock.length === 0) return false;
      return s.farm.livestock.every((h) => h.healthStatus >= 0.9);
    },
  },
  {
    id: "record_harvest",
    title: "Rekordsord",
    description: "Skorda mer an 10 ton per hektar pa ett falt.",
    icon: "🏆",
    rarity: "rare",
    check: (s) => {
      const harvested = s.lastHarvestedCrops || {};
      // Check if any harvested crop yields > 10 t/ha (approximate via total / field ha)
      for (const field of s.farm.fields) {
        if (field.status === "Sk\u00f6rdad" && field.crop) {
          const tons = harvested[field.crop] || 0;
          if (tons > 0 && tons / field.hectares > 10) return true;
        }
      }
      return false;
    },
  },
  {
    id: "three_profitable",
    title: "Vinstmaskin",
    description: "Tre kvartal i rad med vinst.",
    icon: "🔥",
    rarity: "rare",
    check: (s) => {
      if (s.history.length < 3) return false;
      const last3 = s.history.slice(-3);
      return last3.every((r) => r.financialRecord.netResult > 0);
    },
  },
  {
    id: "full_silo",
    title: "Fullt lager",
    description: "Fyll silon till over 90% kapacitet.",
    icon: "🏭",
    rarity: "rare",
    check: (s) => {
      const stored = Object.values(s.farm.storage || {}).reduce((a, b) => a + b, 0);
      const cap = s.farm.siloCapacity || 50;
      return stored / cap > 0.9;
    },
  },
  {
    id: "good_soil",
    title: "Jordvardare",
    description: "Alla falt har jordkvalitet over 1.0.",
    icon: "🌱",
    rarity: "rare",
    check: (s) => {
      if (s.farm.fields.length === 0) return false;
      return s.farm.fields.every((f) => f.soilQuality >= 1.0);
    },
  },

  // --- Epic ---
  {
    id: "land_baron",
    title: "Storbonde",
    description: "Utoka garden till over 200 hektar.",
    icon: "👑",
    rarity: "epic",
    check: (s) => s.farm.totalHectares >= 200,
  },
  {
    id: "millionaire",
    title: "Miljonar",
    description: "Ha over 1 000 000 kr pa kontot.",
    icon: "💰",
    rarity: "epic",
    check: (s) => s.finances.cashBalance >= 1_000_000,
  },
  {
    id: "eu_expert",
    title: "EU-expert",
    description: "Fa alla tillgangliga stodtyper utbetalda.",
    icon: "🌟",
    rarity: "epic",
    check: (s) => {
      const paidTypes = new Set(
        s.finances.subsidies.filter((sub) => sub.status === "Utbetald").map((sub) => sub.type)
      );
      return paidTypes.size >= 4;
    },
  },
  {
    id: "grade_a",
    title: "Toppbetyg",
    description: "Na betyg A (over 80 poang).",
    icon: "⭐",
    rarity: "epic",
    check: () => false, // checked separately with score
  },
  {
    id: "five_year_survivor",
    title: "Fem ar som bonde",
    description: "Slutfor hela spelperioden.",
    icon: "🎓",
    rarity: "epic",
    check: (s) => s.phase === "ended",
  },
  {
    id: "perfect_rotation",
    title: "Vaxtodsexpert",
    description: "Alla falt har bra forfruktseffekt.",
    icon: "🔄",
    rarity: "epic",
    check: (s) => {
      const planted = s.farm.fields.filter((f) => f.crop);
      if (planted.length < 3) return false;
      return planted.every((f) => f.previousCrops.length > 0);
    },
  },
];

export const RARITY_COLORS: Record<AchievementRarity, { bg: string; text: string; border: string }> = {
  common: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-300" },
  rare: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
  epic: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
};
