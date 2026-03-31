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
