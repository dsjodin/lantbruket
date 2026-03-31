/**
 * Central game loop for the Lantbruket farm simulator.
 * All functions are pure: state in, state out.
 */

import {
  type GameState,
  type QuarterDecisions,
  Quarter,
  Region,
  CropType,
  MachineryLevel,
  BuildingLevel,
  type Farm,
  type Field,
  type RevenueBreakdown,
  type CostBreakdown,
  type QuarterRecord,
} from "@/types";

import { CROPS_DATA } from "@/data/crops";
import { LIVESTOCK_DATA } from "@/data/livestock";
import { REGIONS_DATA } from "@/data/regions";
import { MACHINERY_UPGRADES, BUILDING_UPGRADES } from "@/data/machinery";

import { createRandom } from "@/lib/random";
import { generateWeather } from "./weather";
import { generateMarketPrices } from "./market";
import { calculateYield, elapsedQuarters } from "./crops";
import {
  calculateQuarterlyLivestockRevenue,
  applyHealthChange,
} from "./livestock";
import { calculateSubsidies } from "./subsidies";
import { calculateQuarterlyPayment, processLoanPayment, createLoan } from "./loans";
import { generateEvents, applyEventEffects, type EventState } from "./events";
import {
  calculateQuarterRevenue,
  calculateQuarterCosts,
  createFinancialRecord,
} from "./economics";

/**
 * Get the next quarter in sequence.
 */
export function getNextQuarter(quarter: Quarter): Quarter {
  switch (quarter) {
    case Quarter.Var:
      return Quarter.Sommar;
    case Quarter.Sommar:
      return Quarter.Host;
    case Quarter.Host:
      return Quarter.Vinter;
    case Quarter.Vinter:
      return Quarter.Var;
  }
}

/**
 * Check if the game is over (past the final Vinter of the last year).
 */
export function isGameOver(state: GameState): boolean {
  return (
    state.currentYear > state.totalYears &&
    state.currentQuarter === Quarter.Var
  );
}

/**
 * Create the initial game state from setup parameters.
 */
export function createInitialGameState(params: {
  playerName: string;
  farmName: string;
  region: Region;
  totalHectares: number;
  startingCapital: number;
  loanAmount: number;
  totalYears: number;
}): GameState {
  const {
    playerName,
    farmName,
    region,
    totalHectares,
    startingCapital,
    loanAmount,
    totalYears,
  } = params;

  // Generate realistic field layout based on farm size
  const rng = createRandom(totalHectares + startingCapital);

  // Number of fields depends on total size
  const plotCount =
    totalHectares <= 50 ? 3 + Math.floor(rng.next() * 3) :       // 3-5
    totalHectares <= 150 ? 5 + Math.floor(rng.next() * 4) :      // 5-8
    totalHectares <= 300 ? 8 + Math.floor(rng.next() * 5) :      // 8-12
    10 + Math.floor(rng.next() * 6);                              // 10-15

  // Swedish field names
  const fieldNames = [
    "Storgärdet", "Lillåkern", "Kvarnfältet", "Ängsviken", "Norrskiftet",
    "Söderskiftet", "Backstugan", "Sjöängen", "Hagmarksfältet", "Tallåkern",
    "Björkängen", "Mossfältet", "Kullfältet", "Sandåkern", "Lerbacken",
  ];

  // Generate random weights and normalize to total hectares
  const weights: number[] = [];
  for (let i = 0; i < plotCount; i++) {
    // Use a mix to get varied but not extreme sizes
    weights.push(0.5 + rng.next() * 1.5);
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const fields: Field[] = [];
  let allocatedHa = 0;
  for (let i = 0; i < plotCount; i++) {
    const isLast = i === plotCount - 1;
    const ha = isLast
      ? Math.round((totalHectares - allocatedHa) * 10) / 10
      : Math.round((totalHectares * weights[i] / weightSum) * 10) / 10;
    allocatedHa += ha;

    fields.push({
      id: `field-${i + 1}`,
      name: fieldNames[i % fieldNames.length],
      hectares: Math.max(ha, 1), // Minimum 1 ha
      crop: null,
      soilQuality:
        Math.round((0.8 + rng.next() * 0.4) * 100) / 100, // 0.8 - 1.2
      fertilizerApplied: false,
      status: "Oplöjd",
      plantedYear: null,
      plantedQuarter: null,
    });
  }

  // Sort fields largest first for a natural feel
  fields.sort((a, b) => b.hectares - a.hectares);

  // Create initial loan if requested
  const loans = [];
  if (loanAmount > 0) {
    loans.push(createLoan(loanAmount, 10, 0.045, 1));
  }

  // Derive a deterministic seed from the player name
  const seed = Math.floor(
    Math.abs(
      playerName
        .split("")
        .reduce((a, c) => a + c.charCodeAt(0), 0) *
        7919 +
        totalHectares * 13
    )
  );

  return {
    id: `game-${Date.now()}`,
    playerName,
    farmName,
    region,
    currentYear: 1,
    currentQuarter: Quarter.Var,
    totalYears,
    phase: "decisions",
    farm: {
      totalHectares,
      fields,
      livestock: [],
      machinery: MachineryLevel.Basic,
      buildings: BuildingLevel.Simple,
      employees: 1,
      storage: {},
      siloCapacity: 500,
    },
    finances: {
      cashBalance: startingCapital + loanAmount,
      loans,
      subsidies: [],
    },
    history: [],
    activeEvents: [],
    seed,
    currentMarketPrices: generateMarketPrices(seed, 1, Quarter.Var),
  };
}

/**
 * The main game loop function. Advances one quarter.
 * Pure function: takes state + decisions, returns new state.
 *
 * Steps:
 *  1. Apply crop actions (plant, fertilize, harvest)
 *  2. Apply livestock actions (buy/sell)
 *  3. Apply worker changes
 *  4. Process new loan if any
 *  5. Process machinery/building upgrades
 *  6. Generate weather for this quarter
 *  7. Calculate crop yields (if harvest quarter)
 *  8. Generate market prices
 *  9. Process crop sales
 * 10. Calculate livestock quarterly revenue/costs
 * 11. Process subsidy applications (Vinter) / pay out (Vår)
 * 12. Calculate all costs
 * 13. Process loan payments
 * 14. Generate and apply random events
 * 15. Update cash balance
 * 16. Create financial record
 * 17. Create quarter history record
 * 18. Advance to next quarter (or end game)
 */
export function advanceQuarter(
  state: GameState,
  decisions: QuarterDecisions
): GameState {
  const { currentYear, currentQuarter, region, seed } = state;
  const farm = state.farm;
  let fields = farm.fields.map((f) => ({ ...f }));
  let livestock = farm.livestock.map((h) => ({ ...h }));
  let cash = state.finances.cashBalance;
  let loans = state.finances.loans.map((l) => ({ ...l }));
  let subsidies = state.finances.subsidies.map((s) => ({ ...s }));

  const regionData = REGIONS_DATA[region];

  // ---- Step 1: Apply crop actions ----
  for (const action of decisions.cropActions) {
    const fieldIdx = fields.findIndex((f) => f.id === action.fieldId);
    if (fieldIdx === -1) continue;
    const field = { ...fields[fieldIdx] };

    switch (action.action) {
      case "plant":
        if (action.cropType) {
          field.crop = action.cropType;
          field.status = "Sådd";
          field.fertilizerApplied = false;
          field.plantedYear = currentYear;
          field.plantedQuarter = currentQuarter;
        }
        break;
      case "fertilize":
        field.fertilizerApplied = true;
        break;
      case "harvest":
        field.status = "Skördad";
        break;
    }

    fields[fieldIdx] = field;
  }

  // ---- Step 2: Apply livestock actions ----
  for (const action of decisions.livestockActions) {
    const existingIdx = livestock.findIndex((h) => h.type === action.type);

    if (action.action === "buy") {
      const data = LIVESTOCK_DATA[action.type];
      const totalCost = data.purchasePrice * action.count;
      cash -= totalCost;

      if (existingIdx !== -1) {
        livestock[existingIdx] = {
          ...livestock[existingIdx],
          count: livestock[existingIdx].count + action.count,
        };
      } else {
        livestock.push({
          type: action.type,
          count: action.count,
          healthStatus: 1.0,
          productionModifier: 1.0,
        });
      }
    } else if (action.action === "sell") {
      if (existingIdx !== -1) {
        const data = LIVESTOCK_DATA[action.type];
        const sellPrice = data.purchasePrice * 0.7;
        const sellCount = Math.min(
          action.count,
          livestock[existingIdx].count
        );
        cash += sellPrice * sellCount;
        livestock[existingIdx] = {
          ...livestock[existingIdx],
          count: livestock[existingIdx].count - sellCount,
        };
        if (livestock[existingIdx].count <= 0) {
          livestock.splice(existingIdx, 1);
        }
      }
    }
  }

  // ---- Step 3: Apply worker changes ----
  const newEmployees = Math.max(0, farm.employees + decisions.hireWorkers);

  // ---- Step 4: Process new loan ----
  if (decisions.newLoan) {
    const newLoan = createLoan(
      decisions.newLoan.amount,
      decisions.newLoan.termYears,
      decisions.newLoan.interestRate,
      currentYear
    );
    loans.push(newLoan);
    cash += decisions.newLoan.amount;
  }

  // ---- Step 5: Machinery/building upgrades ----
  let machinery = farm.machinery;
  let buildings = farm.buildings;

  if (decisions.machineryUpgrade) {
    const upgrade = MACHINERY_UPGRADES.find((u) => u.from === machinery);
    if (upgrade) {
      cash -= upgrade.cost;
      machinery = upgrade.to;
    }
  }

  if (decisions.buildingUpgrade) {
    const upgrade = BUILDING_UPGRADES.find((u) => u.from === buildings);
    if (upgrade) {
      cash -= upgrade.cost;
      buildings = upgrade.to;
    }
  }

  // ---- Step 6: Generate weather ----
  const weather = generateWeather(currentQuarter, seed, currentYear);

  // ---- Step 7: Calculate crop yields → harvest to storage ----
  const storage: Record<string, number> = { ...(farm.storage || {}) };
  const siloCapacity = farm.siloCapacity || 500;
  const harvestedCrops: Record<string, number> = {};

  for (const field of fields) {
    if (!field.crop) continue;
    const cropData = CROPS_DATA[field.crop];

    // Harvest only if enough growing quarters have elapsed
    const hasPlantingData = field.plantedYear != null && field.plantedQuarter != null;
    const elapsed = hasPlantingData
      ? elapsedQuarters(field.plantedYear!, field.plantedQuarter!, currentYear, currentQuarter)
      : 999; // Legacy fields without planting data: allow harvest

    if (
      cropData.harvestQuarter === currentQuarter &&
      field.status !== "Oplöjd" &&
      field.status !== "Skördad" &&
      elapsed >= cropData.growingSeasons
    ) {
      const tons = calculateYield(
        field.crop,
        field.hectares,
        field.soilQuality,
        field.fertilizerApplied,
        weather,
        regionData.yieldModifier
      );

      const rounded = Math.round(tons * 10) / 10;
      harvestedCrops[field.crop] = (harvestedCrops[field.crop] ?? 0) + rounded;
      storage[field.crop] = (storage[field.crop] ?? 0) + rounded;

      field.status = "Skördad";
    }
  }

  // Clamp total storage to silo capacity
  const totalStored = Object.values(storage).reduce((a, b) => a + b, 0);
  if (totalStored > siloCapacity) {
    // Overflow: oldest (existing) grain is discarded proportionally
    const scale = siloCapacity / totalStored;
    for (const key of Object.keys(storage)) {
      storage[key] = Math.round(storage[key] * scale * 10) / 10;
    }
  }

  // ---- Step 8: Generate market prices ----
  const marketPrices = generateMarketPrices(seed, currentYear, currentQuarter);

  // ---- Step 9: Process crop sales (from manual sellGrain decisions) ----
  const cropSales = {} as Record<
    CropType,
    { tons: number; pricePerTon: number }
  >;
  for (const cropType of Object.values(CropType)) {
    const tonsToSell = decisions.sellCrops[cropType] ?? 0;
    // Sell from storage (including newly harvested)
    const available = storage[cropType] ?? 0;
    const actualSell = Math.min(tonsToSell, available);
    if (actualSell > 0) {
      storage[cropType] = Math.round((available - actualSell) * 10) / 10;
    }
    cropSales[cropType] = {
      tons: actualSell,
      pricePerTon: marketPrices[cropType],
    };
  }

  // ---- Step 10: Livestock quarterly revenue/costs ----
  const livestockRevenue =
    calculateQuarterlyLivestockRevenue(livestock);

  // ---- Step 11: Process subsidies ----
  let subsidyPayments = 0;

  // Apply for subsidies in Vinter
  if (
    currentQuarter === Quarter.Vinter &&
    decisions.subsidyApplications.length > 0
  ) {
    const updatedFarm: Farm = {
      totalHectares: farm.totalHectares,
      fields,
      livestock,
      machinery,
      buildings,
      employees: newEmployees,
      storage,
      siloCapacity,
    };
    const newSubsidies = calculateSubsidies(
      updatedFarm,
      region,
      decisions.subsidyApplications
    );
    const dated = newSubsidies.map((s) => ({
      ...s,
      appliedYear: currentYear,
    }));
    subsidies = [...subsidies, ...dated];
  }

  // Pay out previous year's approved subsidies in Vår
  if (currentQuarter === Quarter.Var) {
    for (let i = 0; i < subsidies.length; i++) {
      if (
        subsidies[i].status === "Beviljad" &&
        subsidies[i].appliedYear < currentYear
      ) {
        subsidyPayments += subsidies[i].amount;
        subsidies[i] = { ...subsidies[i], status: "Utbetald" };
      }
    }
  }

  // ---- Step 12: Calculate all costs ----
  const updatedFarmForCosts: Farm = {
    totalHectares: farm.totalHectares,
    fields,
    livestock,
    machinery,
    buildings,
    employees: newEmployees,
    storage,
    siloCapacity,
  };

  const costs = calculateQuarterCosts({
    farm: updatedFarmForCosts,
    fields,
    livestock,
    loans,
    quarter: currentQuarter,
  });

  // ---- Step 13: Process loan payments ----
  loans = loans.map((loan) => {
    if (loan.remainingPrincipal <= 0) return loan;
    return processLoanPayment(loan);
  });

  // ---- Step 14: Generate and apply random events ----
  const events = generateEvents(currentQuarter, seed, currentYear);

  let eventState: EventState = {
    yieldModifier: 0,
    priceModifiers: {},
    costModifier: 0,
    healthDelta: 0,
    directCashChange: 0,
  };

  for (const event of events) {
    eventState = applyEventEffects(event, eventState);
  }

  // Apply event health effects to livestock
  if (eventState.healthDelta !== 0) {
    livestock = applyHealthChange(livestock, eventState.healthDelta);
  }
  cash += eventState.directCashChange;

  // Apply event price modifiers to crop sales revenue
  let eventPriceAdjustment = 0;
  for (const [crop, modifier] of Object.entries(
    eventState.priceModifiers
  )) {
    const sale = cropSales[crop as CropType];
    if (sale) {
      eventPriceAdjustment += sale.tons * sale.pricePerTon * modifier;
    }
  }

  // ---- Step 15: Calculate revenue and update cash ----
  const revenue = calculateQuarterRevenue({
    cropSales,
    livestockIncome: livestockRevenue,
    subsidyPayments,
  });

  // Adjust revenue for event price modifiers
  revenue.cropSales = Math.round(revenue.cropSales + eventPriceAdjustment);

  // Apply event cost modifier
  const costMultiplier = 1 + eventState.costModifier;
  const adjustedCosts: CostBreakdown = {
    ...costs,
    fuel: Math.round(costs.fuel * costMultiplier),
    seeds: Math.round(costs.seeds * costMultiplier),
  };

  const totalRevenue =
    revenue.cropSales +
    revenue.livestockIncome +
    revenue.subsidies +
    revenue.other;
  const totalCosts =
    adjustedCosts.seeds +
    adjustedCosts.fertilizer +
    adjustedCosts.fuel +
    adjustedCosts.machinery +
    adjustedCosts.feed +
    adjustedCosts.veterinary +
    adjustedCosts.salaries +
    adjustedCosts.loanInterest +
    adjustedCosts.loanAmortization +
    adjustedCosts.insurance +
    adjustedCosts.buildingMaintenance +
    adjustedCosts.other;

  cash += totalRevenue - totalCosts;

  // ---- Step 16: Create financial record ----
  const financialRecord = createFinancialRecord(
    currentYear,
    currentQuarter,
    revenue,
    adjustedCosts,
    state.finances.cashBalance
  );

  // ---- Step 17: Create quarter history record ----
  const quarterRecord: QuarterRecord = {
    year: currentYear,
    quarter: currentQuarter,
    events,
    financialRecord,
    weather,
    marketPrices,
  };

  // ---- Step 18: Advance to next quarter ----
  const nextQuarter = getNextQuarter(currentQuarter);
  const nextYear =
    currentQuarter === Quarter.Vinter ? currentYear + 1 : currentYear;

  // Advance field growth statuses between quarters
  const advancedFields = fields.map((f) => {
    if (f.status === "Sådd")
      return { ...f, status: "Växande" as const };
    if (f.status === "Växande")
      return { ...f, status: "Skördeklar" as const };
    if (f.status === "Skördad")
      return {
        ...f,
        crop: null,
        status: "Oplöjd" as const,
        fertilizerApplied: false,
        plantedYear: null,
        plantedQuarter: null,
      };
    return f;
  });

  const gameEnded =
    nextYear > state.totalYears && nextQuarter === Quarter.Var;

  return {
    ...state,
    currentYear: nextYear,
    currentQuarter: nextQuarter,
    phase: gameEnded ? "ended" : "decisions",
    farm: {
      totalHectares: farm.totalHectares,
      fields: advancedFields,
      livestock,
      machinery,
      buildings,
      employees: newEmployees,
      storage,
      siloCapacity,
    },
    finances: {
      cashBalance: Math.round(cash),
      loans,
      subsidies,
    },
    history: [...state.history, quarterRecord],
    activeEvents: events,
    seed: state.seed,
    currentMarketPrices: marketPrices,
  };
}
