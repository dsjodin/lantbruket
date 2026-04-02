/**
 * Central game loop for the Lantbruket farm simulator.
 * All functions are pure: state in, state out.
 */

import {
  type GameState,
  type QuarterDecisions,
  type LandOffer,
  Quarter,
  Region,
  CropType,
  type Farm,
  type Field,
  type Building,
  type CostBreakdown,
  type QuarterRecord,
} from "@/types";

import { CROPS_DATA } from "@/data/crops";
import { LIVESTOCK_DATA } from "@/data/livestock";
import { REGIONS_DATA } from "@/data/regions";
import { REPAIR_COSTS, REPAIR_CONDITION_BOOST } from "@/data/machinery";
import { BUILDING_CATALOG, MACHINE_SHOP } from "@/data/buildings";

import { createRandom } from "@/lib/random";
import { generateWeather } from "./weather";
import { generateMarketPrices } from "./market";
import { calculateYield, elapsedQuarters, updateSoilQuality, getWorkerEfficiencyModifier, getMachineConditionModifier } from "./crops";
import {
  calculateQuarterlyLivestockRevenue,
  applyHealthChange,
  getWorkerHealthEffect,
} from "./livestock";
import { calculateSubsidies } from "./subsidies";
import { calculateQuarterlyPayment, processLoanPayment, createLoan } from "./loans";
import { generateEvents, applyEventEffects, type EventState, type FarmContext } from "./events";
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
      previousCrops: [],
    });
  }

  // Sort fields largest first for a natural feel
  fields.sort((a, b) => b.hectares - a.hectares);

  // Create initial loan if requested
  const loans = [];
  if (loanAmount > 0) {
    loans.push(createLoan(loanAmount, 10, 0.045, 1));
  }

  // Derive a unique seed: player name + hectares + timestamp for variety
  const seed = Math.floor(
    Math.abs(
      playerName
        .split("")
        .reduce((a, c) => a + c.charCodeAt(0), 0) *
        7919 +
        totalHectares * 13 +
        (Date.now() % 1000000)
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
      employees: 1,
      storage: {},
      siloCapacity: 50, // Beräknas från byggnader + basvärde 50 ton
      machines: [
        { id: "m-1", name: "Traktor (begagnad)", type: "traktor", purchaseYear: 1, condition: 0.7, maintenanceCostPerQuarter: 3000 },
        { id: "m-2", name: "Enkel plog", type: "plog", purchaseYear: 1, condition: 0.8, maintenanceCostPerQuarter: 1000 },
        { id: "m-3", name: "Tallriksharv", type: "harv", purchaseYear: 1, condition: 0.75, maintenanceCostPerQuarter: 800 },
        { id: "m-4", name: "Såmaskin (äldre)", type: "saamaskin", purchaseYear: 1, condition: 0.65, maintenanceCostPerQuarter: 1200 },
      ],
      buildings: [], // Startar med enkel lada (inbyggd 50 ton), inga specialbyggnader
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
    priceHistory: {},
    pendingLandOffers: [],
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
  // NOTE: Livestock buy/sell cash changes are already handled by the store's
  // buyLivestock/sellLivestock actions. The engine only updates herd counts here
  // (which the store also already did, but we keep this for consistency with
  // the engine's pure-function model). Cash is NOT modified here to avoid double-counting.
  for (const action of decisions.livestockActions) {
    const existingIdx = livestock.findIndex((h) => h.type === action.type);

    if (action.action === "buy") {
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
        const sellCount = Math.min(
          action.count,
          livestock[existingIdx].count
        );
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

  // ---- Step 5: Machine purchases, repairs, building construction ----
  let machines = (farm.machines || []).map((m) => ({ ...m }));
  let farmBuildings: Building[] = (farm.buildings || []).map((b) => ({ ...b }));

  // Process machine repairs (with workshop discount if available)
  const hasWorkshop = farmBuildings.some((b) => b.type === "verkstad");
  const repairDiscount = hasWorkshop
    ? farmBuildings.find((b) => b.type === "verkstad")?.effects.repairDiscount ?? 0
    : 0;
  for (const machineId of (decisions.repairMachines || [])) {
    const machineIdx = machines.findIndex((m) => m.id === machineId);
    if (machineIdx !== -1) {
      const machine = machines[machineIdx];
      const baseCost = REPAIR_COSTS[machine.type] ?? 15000;
      const repairCost = Math.round(baseCost * (1 - repairDiscount));
      cash -= repairCost;
      machines[machineIdx] = {
        ...machine,
        condition: Math.min(1.0, Math.round((machine.condition + REPAIR_CONDITION_BOOST) * 100) / 100),
      };
    }
  }

  // Process new machine purchases
  for (const shopId of (decisions.buyMachines || [])) {
    const def = MACHINE_SHOP.find((m) => m.id === shopId);
    if (def) {
      cash -= def.cost;
      machines.push({
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: def.name,
        type: def.type,
        purchaseYear: currentYear,
        condition: def.condition,
        maintenanceCostPerQuarter: def.maintenanceCostPerQuarter,
      });
    }
  }

  // Process building construction
  for (const buildingId of (decisions.constructBuildings || [])) {
    const def = BUILDING_CATALOG.find((b) => b.id === buildingId);
    if (def) {
      cash -= def.cost;
      farmBuildings.push({
        id: def.id,
        name: def.name,
        type: def.type,
        builtYear: currentYear,
        maintenanceCostPerQuarter: def.maintenanceCostPerQuarter,
        effects: { ...def.effects },
      });
    }
  }

  // Derive silo capacity from buildings (base 50 ton lada + all silo buildings)
  const siloCapacity = 50 + farmBuildings.reduce((sum, b) => sum + (b.effects.siloCapacity ?? 0), 0);

  // Derive machinery efficiency from individual machine bonuses
  const machineryEfficiency = 1.0 + MACHINE_SHOP
    .filter((def) => machines.some((m) => m.name === def.name))
    .reduce((max, def) => Math.max(max, def.efficiencyBonus ?? 0), 0);

  // ---- Step 6: Generate weather ----
  const weather = generateWeather(currentQuarter, seed, currentYear);

  // ---- Step 7: Calculate crop yields → harvest to storage ----
  const storage: Record<string, number> = { ...(farm.storage || {}) };
  const harvestedCrops: Record<string, number> = {};

  for (let fi = 0; fi < fields.length; fi++) {
    const field = fields[fi];
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
      // Unique seed per field per year for natural yield variation
      const fieldSeed = seed + currentYear * 1009 + fi * 137;
      const tons = calculateYield(
        field.crop,
        field.hectares,
        field.soilQuality,
        field.fertilizerApplied,
        weather,
        regionData.yieldModifier,
        field.previousCrops,
        newEmployees,
        farm.totalHectares,
        machines,
        machineryEfficiency,
        fieldSeed
      );

      const rounded = Math.round(tons * 10) / 10;
      harvestedCrops[field.crop] = (harvestedCrops[field.crop] ?? 0) + rounded;
      storage[field.crop] = (storage[field.crop] ?? 0) + rounded;

      // Update soil quality based on harvest
      field.soilQuality = updateSoilQuality(field.soilQuality, field.crop, true, field.fertilizerApplied);

      // Track crop rotation history
      field.previousCrops = [field.crop, ...(field.previousCrops || [])].slice(0, 4);

      field.status = "Skördad";
    }
  }

  // ---- Step 7b: Apply spoilage to stored crops ----
  for (const [crop, tons] of Object.entries(storage)) {
    const cropData = CROPS_DATA[crop as CropType];
    if (cropData && cropData.spoilageRate > 0 && tons > 0) {
      const spoiled = Math.round(tons * cropData.spoilageRate * 10) / 10;
      storage[crop] = Math.round((tons - spoiled) * 10) / 10;
      if (storage[crop] <= 0) delete storage[crop];
    }
  }

  // ---- Step 8: Generate market prices ----
  const previousPrices = state.currentMarketPrices as Record<CropType, number>;
  const marketPrices = generateMarketPrices(seed, currentYear, currentQuarter, previousPrices);

  // Sell overflow that doesn't fit in silo at current market price
  let overflowRevenue = 0;
  const totalStored = Object.values(storage).reduce((a, b) => a + b, 0);
  if (totalStored > siloCapacity) {
    const overflow = totalStored - siloCapacity;
    // Sell newest harvest first (proportional from harvested crops)
    const harvestedTotal = Object.values(harvestedCrops).reduce((a, b) => a + b, 0);
    if (harvestedTotal > 0) {
      let remaining = overflow;
      for (const [crop, harvested] of Object.entries(harvestedCrops)) {
        const sellTons = Math.min(
          Math.round((harvested / harvestedTotal) * overflow * 10) / 10,
          storage[crop] ?? 0,
          remaining
        );
        if (sellTons > 0) {
          overflowRevenue += sellTons * (marketPrices[crop as CropType] ?? 0);
          storage[crop] = Math.round(((storage[crop] ?? 0) - sellTons) * 10) / 10;
          if (storage[crop] <= 0) delete storage[crop];
          remaining -= sellTons;
        }
      }
    }
  }

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
      employees: newEmployees,
      storage,
      siloCapacity,
      machines,
      buildings: farmBuildings,
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
    employees: newEmployees,
    storage,
    siloCapacity,
    machines,
    buildings: farmBuildings,
  };

  const costs = calculateQuarterCosts({
    farm: updatedFarmForCosts,
    fields,
    livestock,
    loans,
    quarter: currentQuarter,
    storage,
  });

  // ---- Step 13: Process loan payments ----
  loans = loans.map((loan) => {
    if (loan.remainingPrincipal <= 0) return loan;
    return processLoanPayment(loan);
  });

  // ---- Step 14: Generate and apply random events ----
  const farmContext: FarmContext = {
    animalTypes: livestock.map((h) => h.type),
    cropTypes: [...new Set(fields.filter((f) => f.crop).map((f) => f.crop!))],
  };
  const events = generateEvents(currentQuarter, seed, currentYear, farmContext);

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

  // Apply worker staffing effect on animal health
  const totalAnimals = livestock.reduce((sum, h) => sum + h.count, 0);
  const workerHealthDelta = getWorkerHealthEffect(newEmployees, totalAnimals);
  if (workerHealthDelta !== 0) {
    livestock = applyHealthChange(livestock, workerHealthDelta);
  }

  // Apply building health bonus for livestock (from stalls)
  if (totalAnimals > 0) {
    const buildingHealthBonus = farmBuildings.reduce(
      (sum, b) => sum + (b.effects.animalHealthBonus ?? 0), 0
    );
    if (buildingHealthBonus > 0) {
      livestock = applyHealthChange(livestock, buildingHealthBonus);
    }
  }
  // Track event income/costs for the financial record (flows through revenue/costs, not direct cash)
  const eventIncome = Math.max(0, eventState.directCashChange);
  const eventCost = Math.max(0, -eventState.directCashChange);

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

  // Adjust revenue for event price modifiers, silo overflow sales, and event income
  revenue.cropSales = Math.round(revenue.cropSales + eventPriceAdjustment + overflowRevenue);
  revenue.other = Math.round(revenue.other + eventIncome);

  // Apply event cost modifier
  const costMultiplier = 1 + eventState.costModifier;
  const adjustedCosts: CostBreakdown = {
    ...costs,
    fuel: Math.round(costs.fuel * costMultiplier),
    seeds: Math.round(costs.seeds * costMultiplier),
    other: Math.round(costs.other + eventCost),
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
    adjustedCosts.storageCosts +
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
    // Update soil quality for fallow/grass fields each quarter
    let soilQuality = f.soilQuality;
    if (f.crop === CropType.Trada || f.crop === CropType.Vall) {
      soilQuality = updateSoilQuality(soilQuality, f.crop, false, false);
    }

    if (f.status === "Sådd")
      return { ...f, soilQuality, status: "Växande" as const };
    if (f.status === "Växande")
      return { ...f, soilQuality, status: "Skördeklar" as const };
    if (f.status === "Skördad")
      return {
        ...f,
        soilQuality,
        crop: null,
        status: "Oplöjd" as const,
        fertilizerApplied: false,
        plantedYear: null,
        plantedQuarter: null,
      };
    return { ...f, soilQuality };
  });

  // Pre-harvest: harvest any crops that are ready in the upcoming quarter
  // so fields are available for planting when the player sees the decision screen.
  const nextWeather = generateWeather(nextQuarter, seed, nextYear);
  const finalFields = advancedFields.map((f, fi) => {
    if (!f.crop || f.status === "Oplöjd" || f.status === "Skördad") return f;
    const cropData = CROPS_DATA[f.crop];
    if (cropData.harvestQuarter !== nextQuarter) return f;
    const hasPlantingData = f.plantedYear != null && f.plantedQuarter != null;
    if (!hasPlantingData) return f;
    const elapsed = elapsedQuarters(f.plantedYear!, f.plantedQuarter!, nextYear, nextQuarter);
    if (elapsed < cropData.growingSeasons) return f;

    // Harvest this field now (unique seed per field per year)
    const fieldSeed = seed + nextYear * 1009 + fi * 137;
    const tons = calculateYield(
      f.crop, f.hectares, f.soilQuality, f.fertilizerApplied,
      nextWeather, regionData.yieldModifier,
      f.previousCrops, newEmployees, farm.totalHectares, machines,
      machineryEfficiency, fieldSeed
    );
    const rounded = Math.round(tons * 10) / 10;
    storage[f.crop] = (storage[f.crop] ?? 0) + rounded;

    // Update soil quality and rotation history for pre-harvested fields
    const updatedSoilQuality = updateSoilQuality(f.soilQuality, f.crop, true, f.fertilizerApplied);
    const updatedPreviousCrops = [f.crop, ...(f.previousCrops || [])].slice(0, 4);

    return {
      ...f,
      crop: null,
      status: "Oplöjd" as const,
      fertilizerApplied: false,
      plantedYear: null,
      plantedQuarter: null,
      soilQuality: updatedSoilQuality,
      previousCrops: updatedPreviousCrops,
    };
  });

  // Sell overflow from pre-harvest at next quarter's market prices
  const nextMarketPrices = generateMarketPrices(seed, nextYear, nextQuarter, marketPrices);
  const totalStoredFinal = Object.values(storage).reduce((a, b) => a + b, 0);
  if (totalStoredFinal > siloCapacity) {
    const overflow = totalStoredFinal - siloCapacity;
    const storedEntries = Object.entries(storage).filter(([, v]) => v > 0);
    const storedTotal = storedEntries.reduce((a, [, v]) => a + v, 0);
    let remaining = overflow;
    for (const [crop, stored] of storedEntries) {
      const sellTons = Math.min(
        Math.round((stored / storedTotal) * overflow * 10) / 10,
        stored,
        remaining
      );
      if (sellTons > 0) {
        overflowRevenue += sellTons * (nextMarketPrices[crop as CropType] ?? 0);
        storage[crop] = Math.round((stored - sellTons) * 10) / 10;
        if (storage[crop] <= 0) delete storage[crop];
        remaining -= sellTons;
      }
    }
  }

  const gameEnded =
    nextYear > state.totalYears && nextQuarter === Quarter.Var;

  // Degrade machine condition each quarter (slower if maskinhall exists)
  const hasMachineHall = farmBuildings.some((b) => b.type === "maskinhall");
  const degradeRate = hasMachineHall ? 0.01 : 0.02; // Maskinhall halves degradation
  machines = machines.map((m) => ({
    ...m,
    condition: Math.max(0.1, Math.round((m.condition - degradeRate) * 100) / 100),
    maintenanceCostPerQuarter: m.condition < 0.4
      ? Math.round(m.maintenanceCostPerQuarter * 1.5)
      : m.maintenanceCostPerQuarter,
  }));

  // Generate land offers (~10% chance per quarter, only in Vår and Höst)
  const landOffers: LandOffer[] = [];
  if (!gameEnded && (nextQuarter === Quarter.Var || nextQuarter === Quarter.Host)) {
    const landRng = createRandom(seed + nextYear * 97 + (nextQuarter === Quarter.Var ? 1 : 3) * 71);
    const offerFieldNames = [
      "Ekbacken", "Ängsholmen", "Norrskogen", "Sjöängen", "Lindgården",
      "Björkudden", "Sandviken", "Hagalund", "Tallåsen", "Granliden",
    ];
    if (landRng.chance(0.12)) {
      const ha = Math.round(10 + landRng.next() * 30); // 10-40 ha
      const pricePerHa = Math.round(35000 + landRng.next() * 30000); // 35k-65k kr/ha
      const nameIdx = Math.floor(landRng.next() * offerFieldNames.length);
      landOffers.push({
        id: `land-buy-${nextYear}-${nextQuarter}`,
        type: "buy",
        hectares: ha,
        totalPrice: ha * pricePerHa,
        fieldName: offerFieldNames[nameIdx],
        soilQuality: Math.round((0.8 + landRng.next() * 0.3) * 100) / 100,
        description: `Granngården "${offerFieldNames[nameIdx]}" med ${ha} ha mark är till salu. Priset är ${(ha * pricePerHa).toLocaleString("sv-SE")} kr.`,
      });
    }
    if (landRng.chance(0.10)) {
      const ha = Math.round(5 + landRng.next() * 20); // 5-25 ha
      const annualLease = Math.round(ha * (2000 + landRng.next() * 3000)); // 2k-5k kr/ha/år
      const nameIdx = Math.floor(landRng.next() * offerFieldNames.length);
      landOffers.push({
        id: `land-lease-${nextYear}-${nextQuarter}`,
        type: "lease",
        hectares: ha,
        totalPrice: annualLease,
        fieldName: offerFieldNames[nameIdx],
        soilQuality: Math.round((0.75 + landRng.next() * 0.3) * 100) / 100,
        description: `${ha} ha arrendemark vid "${offerFieldNames[nameIdx]}" finns tillgängligt. Arrende ${annualLease.toLocaleString("sv-SE")} kr/år.`,
      });
    }
  }

  return {
    ...state,
    currentYear: nextYear,
    currentQuarter: nextQuarter,
    phase: gameEnded ? "ended" : "decisions",
    farm: {
      totalHectares: farm.totalHectares,
      fields: finalFields,
      livestock,
      employees: newEmployees,
      storage,
      siloCapacity,
      machines,
      buildings: farmBuildings,
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
    priceHistory: updatePriceHistory(state.priceHistory || {}, marketPrices),
    pendingLandOffers: landOffers,
    lastHarvestedCrops: harvestedCrops,
  };
}

/**
 * Append current prices to price history, keeping last 8 quarters per crop.
 */
function updatePriceHistory(
  history: Record<string, number[]>,
  currentPrices: Record<CropType, number>
): Record<string, number[]> {
  const updated: Record<string, number[]> = {};
  for (const [crop, price] of Object.entries(currentPrices)) {
    const prev = history[crop] || [];
    updated[crop] = [...prev, price].slice(-8);
  }
  return updated;
}
