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
import { calculateYield } from "./crops";
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

  // Divide land into ~5 equal plots
  const plotCount = 5;
  const hectaresPerPlot =
    Math.floor((totalHectares / plotCount) * 10) / 10;
  const remainder =
    Math.round((totalHectares - hectaresPerPlot * plotCount) * 10) / 10;

  const rng = createRandom(totalHectares + startingCapital);

  const fields: Field[] = [];
  for (let i = 0; i < plotCount; i++) {
    const ha =
      i === plotCount - 1
        ? hectaresPerPlot + remainder
        : hectaresPerPlot;
    fields.push({
      id: `field-${i + 1}`,
      hectares: Math.round(ha * 10) / 10,
      crop: null,
      soilQuality:
        Math.round((0.9 + rng.next() * 0.2) * 100) / 100, // 0.9 - 1.1
      fertilizerApplied: false,
      status: "Oplöjd",
    });
  }

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
    },
    finances: {
      cashBalance: startingCapital + loanAmount,
      loans,
      subsidies: [],
    },
    history: [],
    activeEvents: [],
    seed,
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

  // ---- Step 7: Calculate crop yields (if harvest quarter) ----
  const harvestedCrops: Record<string, number> = {};
  for (const field of fields) {
    if (!field.crop) continue;
    const cropData = CROPS_DATA[field.crop];
    if (
      cropData.harvestQuarter === currentQuarter &&
      field.status !== "Skördad" &&
      field.status !== "Oplöjd"
    ) {
      const tons = calculateYield(
        field.crop,
        field.hectares,
        field.soilQuality,
        field.fertilizerApplied,
        weather,
        regionData.yieldModifier
      );
      harvestedCrops[field.crop] =
        (harvestedCrops[field.crop] ?? 0) + tons;
      field.status = "Skördeklar";
    }
  }

  // Mark fields explicitly harvested via crop actions
  for (const action of decisions.cropActions) {
    if (action.action === "harvest") {
      const field = fields.find((f) => f.id === action.fieldId);
      if (field && field.crop) {
        field.status = "Skördad";
      }
    }
  }

  // ---- Step 8: Generate market prices ----
  const marketPrices = generateMarketPrices(seed, currentYear, currentQuarter);

  // ---- Step 9: Process crop sales ----
  const cropSales = {} as Record<
    CropType,
    { tons: number; pricePerTon: number }
  >;
  for (const cropType of Object.values(CropType)) {
    const tonsToSell = decisions.sellCrops[cropType] ?? 0;
    const available = harvestedCrops[cropType] ?? 0;
    const actualSell = Math.min(tonsToSell, available);
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
    },
    finances: {
      cashBalance: Math.round(cash),
      loans,
      subsidies,
    },
    history: [...state.history, quarterRecord],
    activeEvents: events,
    seed: state.seed,
  };
}
