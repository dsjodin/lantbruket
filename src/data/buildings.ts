/**
 * Byggnadskatalog — individuella byggnader som kan byggas på gården.
 * Varje byggnad ger specifika bonusar och kostar underhåll.
 */

export interface BuildingDef {
  id: string;
  name: string;
  type: "silo" | "maskinhall" | "stall" | "lada" | "verkstad";
  cost: number;                    // Byggkostnad (kr)
  maintenanceCostPerQuarter: number;
  description: string;
  effects: {
    siloCapacity?: number;         // Ton extra lagringskapacitet
    machineProtection?: boolean;   // Skyddar maskiner (långsammare slitage)
    animalHealthBonus?: number;    // Hälsobonus per kvartal (0.01 = +1%)
    animalCapacity?: number;       // Max antal djur
    repairDiscount?: number;       // Rabatt på reparationer (0.2 = 20%)
  };
  /** Kräver att dessa byggnader redan finns (by type) */
  requires?: string[];
}

export const BUILDING_CATALOG: BuildingDef[] = [
  // --- Silo / lagring ---
  {
    id: "silo-liten",
    name: "Spannmålssilo (liten)",
    type: "silo",
    cost: 120000,
    maintenanceCostPerQuarter: 2000,
    description: "En grundläggande silo för spannmålslagring. Ger 200 ton extra kapacitet.",
    effects: { siloCapacity: 200 },
  },
  {
    id: "silo-stor",
    name: "Spannmålssilo (stor)",
    type: "silo",
    cost: 280000,
    maintenanceCostPerQuarter: 4000,
    description: "Stor silo med torkanläggning. Ger 500 ton extra kapacitet.",
    effects: { siloCapacity: 500 },
    requires: ["silo"],
  },
  {
    id: "silo-planlager",
    name: "Planlager",
    type: "silo",
    cost: 180000,
    maintenanceCostPerQuarter: 3000,
    description: "Platt lagringsyta under tak. Ger 300 ton extra kapacitet. Bra komplement till silo.",
    effects: { siloCapacity: 300 },
  },

  // --- Maskinhall ---
  {
    id: "maskinhall",
    name: "Maskinhall",
    type: "maskinhall",
    cost: 200000,
    maintenanceCostPerQuarter: 3000,
    description: "Skyddar maskiner mot väder och slitage. Maskiner tappar skick långsammare.",
    effects: { machineProtection: true },
  },
  {
    id: "verkstad",
    name: "Verkstad",
    type: "verkstad",
    cost: 150000,
    maintenanceCostPerQuarter: 2500,
    description: "Egen verkstad för enklare reparationer. Ger 20% rabatt på reparationskostnader.",
    effects: { repairDiscount: 0.2 },
    requires: ["maskinhall"],
  },

  // --- Djurstallar ---
  {
    id: "stall-enkel",
    name: "Enkel ladugård",
    type: "stall",
    cost: 250000,
    maintenanceCostPerQuarter: 5000,
    description: "Grundläggande stallutrymme för djurhållning. Plats för upp till 30 djur.",
    effects: { animalCapacity: 30, animalHealthBonus: 0.005 },
  },
  {
    id: "stall-modern",
    name: "Modern lösdrift",
    type: "stall",
    cost: 500000,
    maintenanceCostPerQuarter: 8000,
    description: "Modernt stall med lösdrift och automatisk utfodring. Plats för 80 djur, bättre djurhälsa.",
    effects: { animalCapacity: 80, animalHealthBonus: 0.015 },
    requires: ["stall"],
  },
];

/** Maskiner som kan köpas individuellt */
export interface MachineDef {
  id: string;
  name: string;
  type: "traktor" | "plog" | "harv" | "saamaskin" | "troska" | "spruta";
  cost: number;
  maintenanceCostPerQuarter: number;
  condition: number;
  description: string;
  efficiencyBonus?: number; // Extra skördeeffektivitet (0.05 = +5%)
}

export const MACHINE_SHOP: MachineDef[] = [
  // --- Traktorer ---
  {
    id: "shop-traktor-begagnad",
    name: "Traktor (begagnad)",
    type: "traktor",
    cost: 150000,
    maintenanceCostPerQuarter: 3000,
    condition: 0.7,
    description: "En äldre men pålitlig traktor. Bra för den som behöver fler dragfordon.",
  },
  {
    id: "shop-traktor-modern",
    name: "John Deere 6130R",
    type: "traktor",
    cost: 450000,
    maintenanceCostPerQuarter: 4000,
    condition: 0.95,
    description: "Modern traktor med bra bränsleeffektivitet och komfort.",
    efficiencyBonus: 0.03,
  },
  {
    id: "shop-traktor-gps",
    name: "Fendt 724 Vario (GPS)",
    type: "traktor",
    cost: 900000,
    maintenanceCostPerQuarter: 6000,
    condition: 1.0,
    description: "Toppmodern traktor med GPS-styrning. Ökar skördeeffektiviteten.",
    efficiencyBonus: 0.06,
  },

  // --- Redskap ---
  {
    id: "shop-plog",
    name: "Kverneland plog",
    type: "plog",
    cost: 120000,
    maintenanceCostPerQuarter: 1500,
    condition: 0.9,
    description: "Bra allroundplog för de flesta jordtyper.",
  },
  {
    id: "shop-harv",
    name: "Väderstad Carrier",
    type: "harv",
    cost: 180000,
    maintenanceCostPerQuarter: 1800,
    condition: 0.9,
    description: "Tallriksharv för effektiv jordbearbetning.",
  },
  {
    id: "shop-saamaskin",
    name: "Väderstad Rapid",
    type: "saamaskin",
    cost: 250000,
    maintenanceCostPerQuarter: 2000,
    condition: 0.95,
    description: "Kombisåmaskin för snabb och precis sådd.",
    efficiencyBonus: 0.03,
  },
  {
    id: "shop-spruta",
    name: "Hardi spruta",
    type: "spruta",
    cost: 200000,
    maintenanceCostPerQuarter: 1500,
    condition: 0.9,
    description: "Bogserad lantbruksspruta för växtskydd och gödsling.",
  },

  // --- Skördetröska ---
  {
    id: "shop-troska-begagnad",
    name: "Tröska (begagnad)",
    type: "troska",
    cost: 350000,
    maintenanceCostPerQuarter: 5000,
    condition: 0.65,
    description: "Äldre skördetröska. Gör jobbet men kräver underhåll.",
  },
  {
    id: "shop-troska-modern",
    name: "Claas Lexion 770",
    type: "troska",
    cost: 1200000,
    maintenanceCostPerQuarter: 8000,
    condition: 1.0,
    description: "Toppmodern skördetröska med hög kapacitet. Minskar skördeförluster.",
    efficiencyBonus: 0.05,
  },
];

/** Maskintyps-etiketter */
export const MACHINE_TYPE_LABELS: Record<string, string> = {
  traktor: "Traktor",
  plog: "Plog",
  harv: "Harv",
  saamaskin: "Såmaskin",
  troska: "Tröska",
  spruta: "Spruta",
};
