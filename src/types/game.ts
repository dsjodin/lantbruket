import {
  Quarter,
  Region,
  CropType,
  AnimalType,
  SubsidyType,
  GamePhase,
} from "./enums";
import { Farm } from "./farm";
import { Finances } from "./economics";
import { GameEvent, QuarterRecord } from "./events";

export interface LandOffer {
  id: string;
  type: "buy" | "lease";
  hectares: number;
  totalPrice: number; // Köpesumma (buy) eller årlig arrendekostnad (lease)
  fieldName: string;
  soilQuality: number;
  description: string;
}

export interface GameState {
  id: string;
  playerName: string;
  farmName: string;
  region: Region;
  currentYear: number;
  currentQuarter: Quarter;
  totalYears: number;
  phase: GamePhase;
  farm: Farm;
  finances: Finances;
  history: QuarterRecord[];
  activeEvents: GameEvent[];
  seed: number; // För slumpmässig men reproducerbar händelsegenerering
  currentMarketPrices: Record<string, number>; // Aktuella marknadspriser per CropType
  priceHistory: Record<string, number[]>; // Senaste 8 kvartalens priser per gröda
  pendingLandOffers: LandOffer[];
}

export interface QuarterDecisions {
  cropActions: CropAction[];
  livestockActions: LivestockAction[];
  hireWorkers: number;
  newLoan: { amount: number; termYears: number; interestRate: number } | null;
  subsidyApplications: SubsidyType[];
  machineryUpgrade: boolean;
  buildingUpgrade: boolean;
  sellCrops: Record<CropType, number>; // ton att sälja per gröda
  repairMachines: string[]; // machine IDs att reparera
}

export interface CropAction {
  fieldId: string;
  action: "plant" | "fertilize" | "harvest";
  cropType?: CropType;
}

export interface LivestockAction {
  type: AnimalType;
  action: "buy" | "sell";
  count: number;
}
