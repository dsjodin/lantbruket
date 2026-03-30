import { EventCategory, Quarter, CropType, AnimalType } from "@/types/enums";
import type { GameEvent } from "@/types/events";

export const GAME_EVENTS: GameEvent[] = [
  // --- Väderhändelser ---
  {
    id: "torka-svar",
    category: EventCategory.Weather,
    title: "Svår torka",
    description:
      "En ovanligt långvarig torka drabbar regionen. Grundvattennivåerna sjunker och grödorna lider svårt av vattenbrist.",
    effects: [{ type: "yieldModifier", value: -0.30 }],
    quarters: [Quarter.Sommar],
    probability: 0.06,
  },
  {
    id: "torka-mild",
    category: EventCategory.Weather,
    title: "Torrperiod",
    description:
      "Flera veckor utan regn påverkar grödorna negativt, särskilt på lätta jordar.",
    effects: [{ type: "yieldModifier", value: -0.15 }],
    quarters: [Quarter.Sommar],
    probability: 0.10,
  },
  {
    id: "frost-tidig",
    category: EventCategory.Weather,
    title: "Tidig höstfrost",
    description:
      "Oväntat tidig frost i september skadar grödor som inte hunnit skördas.",
    effects: [{ type: "yieldModifier", value: -0.20 }],
    quarters: [Quarter.Host],
    probability: 0.08,
  },
  {
    id: "frost-var",
    category: EventCategory.Weather,
    title: "Sen vårfrost",
    description:
      "Nattfrost i maj skadar nyplanterade grödor och blommande raps.",
    effects: [{ type: "yieldModifier", value: -0.15 }],
    quarters: [Quarter.Var],
    probability: 0.10,
  },
  {
    id: "oversvamning",
    category: EventCategory.Weather,
    title: "Översvämning",
    description:
      "Kraftiga regn orsakar översvämningar på lågliggande fält. Grödor drunknar och jordstrukturen skadas.",
    effects: [{ type: "yieldModifier", value: -0.25 }],
    quarters: [Quarter.Var, Quarter.Host],
    probability: 0.05,
  },
  {
    id: "perfekt-vader",
    category: EventCategory.Weather,
    title: "Perfekta odlingsförhållanden",
    description:
      "Idealiskt väder med lagom regn och sol ger utmärkta förutsättningar för rekordskördar.",
    effects: [{ type: "yieldModifier", value: 0.15 }],
    quarters: [Quarter.Sommar],
    probability: 0.08,
  },

  // --- Växtsjukdomar ---
  {
    id: "mjoldagg",
    category: EventCategory.Disease,
    title: "Mjöldaggsangrepp",
    description:
      "Fuktigt väder har lett till utbrett mjöldaggsangrepp i spannmålen. Skörden reduceras.",
    effects: [
      { type: "yieldModifier", target: CropType.Hostvete, value: -0.15 },
      { type: "yieldModifier", target: CropType.Varkorn, value: -0.10 },
    ],
    quarters: [Quarter.Sommar],
    probability: 0.08,
  },
  {
    id: "bladloss",
    category: EventCategory.Disease,
    title: "Bladlösangrepp",
    description:
      "Stora mängder bladlöss angriper grödorna. Bekämpningskostnader ökar och skörden påverkas.",
    effects: [
      { type: "yieldModifier", value: -0.10 },
      { type: "directCost", value: 15000 },
    ],
    quarters: [Quarter.Sommar],
    probability: 0.10,
  },
  {
    id: "potatisbladmogel",
    category: EventCategory.Disease,
    title: "Potatisbladmögel",
    description:
      "Phytophthora infestans sprider sig snabbt i potatisodlingarna under de fuktiga förhållandena.",
    effects: [
      { type: "yieldModifier", target: CropType.Potatis, value: -0.25 },
      { type: "directCost", value: 10000 },
    ],
    quarters: [Quarter.Sommar, Quarter.Host],
    probability: 0.07,
  },

  // --- Djursjukdomar ---
  {
    id: "svinpest-larm",
    category: EventCategory.Disease,
    title: "Afrikansk svinpest-larm",
    description:
      "Misstänkt fall av afrikansk svinpest i närområdet. Smittskyddsåtgärder krävs och handeln begränsas tillfälligt.",
    effects: [
      { type: "animalHealth", target: AnimalType.Slaktsvin, value: -0.20 },
      { type: "directCost", value: 30000 },
    ],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter],
    probability: 0.03,
  },
  {
    id: "mastit-utbrott",
    category: EventCategory.Disease,
    title: "Mastitutbrott",
    description:
      "Flera kor drabbas av juverinflammation. Mjölkproduktionen minskar och veterinärkostnader ökar.",
    effects: [
      { type: "animalHealth", target: AnimalType.Mjolkko, value: -0.15 },
      { type: "directCost", value: 20000 },
    ],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter],
    probability: 0.07,
  },
  {
    id: "god-djurhalsa",
    category: EventCategory.Disease,
    title: "Utmärkt djurhälsa",
    description:
      "Besättningen mår utmärkt och produktionen överstiger förväntningarna.",
    effects: [{ type: "animalHealth", value: 0.10 }],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter],
    probability: 0.08,
  },

  // --- Marknadshändelser ---
  {
    id: "prisras-spannmal",
    category: EventCategory.Market,
    title: "Prisras på spannmål",
    description:
      "Överproduktion i EU och stora globala lager pressar ned spannmålspriserna kraftigt.",
    effects: [
      { type: "priceModifier", target: CropType.Hostvete, value: -0.20 },
      { type: "priceModifier", target: CropType.Varkorn, value: -0.18 },
      { type: "priceModifier", target: CropType.Havre, value: -0.15 },
    ],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter],
    probability: 0.06,
  },
  {
    id: "prisokning-spannmal",
    category: EventCategory.Market,
    title: "Prisökning på spannmål",
    description:
      "Missväxt i andra länder driver upp världsmarknadspriserna på spannmål.",
    effects: [
      { type: "priceModifier", target: CropType.Hostvete, value: 0.22 },
      { type: "priceModifier", target: CropType.Varkorn, value: 0.18 },
      { type: "priceModifier", target: CropType.Havre, value: 0.15 },
    ],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter],
    probability: 0.06,
  },
  {
    id: "raps-boom",
    category: EventCategory.Market,
    title: "Rapspriserna rusar",
    description:
      "Ökad efterfrågan på biodiesel och vegetabiliska oljor höjer rapspriserna avsevärt.",
    effects: [
      { type: "priceModifier", target: CropType.Hostraps, value: 0.25 },
    ],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter],
    probability: 0.05,
  },
  {
    id: "diesel-prishojning",
    category: EventCategory.Market,
    title: "Dieselpriserna skenar",
    description:
      "Stigande oljepriser och ökad koldioxidskatt driver upp bränslekostnaderna rejält.",
    effects: [{ type: "costModifier", value: 0.15 }],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host, Quarter.Vinter],
    probability: 0.07,
  },

  // --- Maskinhändelser ---
  {
    id: "maskinhaveri",
    category: EventCategory.Machinery,
    title: "Maskinhaveri",
    description:
      "Traktorn går sönder mitt under vårsådden. Akut reparation krävs.",
    effects: [{ type: "directCost", value: 75000 }],
    quarters: [Quarter.Var, Quarter.Sommar, Quarter.Host],
    probability: 0.08,
  },
  {
    id: "troskskada",
    category: EventCategory.Machinery,
    title: "Tröskan havererar",
    description:
      "Skördetröskan går sönder under skörden. Dyrbar reparation och försenad skörd.",
    effects: [
      { type: "directCost", value: 120000 },
      { type: "yieldModifier", value: -0.05 },
    ],
    quarters: [Quarter.Host],
    probability: 0.05,
  },

  // --- Politiska händelser ---
  {
    id: "hojda-eu-stod",
    category: EventCategory.Policy,
    title: "Höjda EU-stöd",
    description:
      "EU beslutar om ökade jordbruksstöd i den nya programperioden. Extra utbetalning till alla stödberättigade.",
    effects: [{ type: "directIncome", value: 50000 }],
    quarters: [Quarter.Vinter],
    probability: 0.04,
  },
  {
    id: "miljokrav-skarpta",
    category: EventCategory.Policy,
    title: "Skärpta miljökrav",
    description:
      "Nya miljöregler kräver ökade insatser för markskydd och vattenvård. Kostnaderna stiger.",
    effects: [{ type: "costModifier", value: 0.08 }],
    quarters: [Quarter.Var],
    probability: 0.05,
  },
  {
    id: "gödselskatt",
    category: EventCategory.Policy,
    title: "Ny gödselskatt",
    description:
      "Riksdagen inför en ny skatt på mineralgödsel för att minska övergödning.",
    effects: [{ type: "costModifier", value: 0.10 }],
    quarters: [Quarter.Vinter],
    probability: 0.03,
  },
  {
    id: "investeringsstod",
    category: EventCategory.Policy,
    title: "Investeringsstöd beviljas",
    description:
      "Jordbruksverket beviljar investeringsstöd för modernisering av lantbruk.",
    effects: [{ type: "directIncome", value: 100000 }],
    quarters: [Quarter.Var, Quarter.Host],
    probability: 0.02,
  },
];
