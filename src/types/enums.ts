export enum Quarter {
  Var = "Vår",
  Sommar = "Sommar",
  Host = "Höst",
  Vinter = "Vinter",
}

export enum Region {
  GotalandSoder = "Götalands södra slättbygder",
  GotalandNorra = "Götalands norra slättbygder",
  Svealand = "Svealands slättbygder",
  GotalandSkogs = "Götalands skogsbygder",
  MellansverigeSkogs = "Mellersta Sveriges skogsbygder",
  Norrland = "Norrland",
}

export enum CropType {
  Hostvete = "Höstvete",
  Varkorn = "Vårkorn",
  Havre = "Havre",
  Hostraps = "Höstraps",
  Vall = "Vall",
  Potatis = "Potatis",
  Sockerbeta = "Sockerbeta",
  Trada = "Träda",
}

export enum AnimalType {
  Mjolkko = "Mjölkko",
  Diko = "Diko",
  Slaktsvin = "Slaktsvin",
  Varphons = "Värphöns",
  Tacka = "Tacka",
}

export enum EventCategory {
  Weather = "Väder",
  Market = "Marknad",
  Disease = "Sjukdom",
  Policy = "Politik",
  Machinery = "Maskineri",
}

export enum MachineryLevel {
  Basic = "Grundläggande",
  Modern = "Modern",
  Advanced = "Avancerad",
}

export enum BuildingLevel {
  Simple = "Enkel",
  Standard = "Standard",
  Expanded = "Utbyggd",
}

export type GamePhase =
  | "setup"
  | "decisions"
  | "resolution"
  | "event"
  | "summary"
  | "ended";

export type SubsidyType =
  | "Grundbetalning"
  | "Förgröningsstöd"
  | "Kompensationsstöd"
  | "Miljöersättning"
  | "Djurvälfärdsersättning"
  | "Nötkreatursstöd";

export type SubsidyStatus = "Ansökt" | "Beviljad" | "Utbetald" | "Avslagen";

export type FieldStatus =
  | "Oplöjd"
  | "Sådd"
  | "Växande"
  | "Skördeklar"
  | "Skördad";

export type WeatherCondition =
  | "Normalt"
  | "Torka"
  | "Översvämning"
  | "Frost"
  | "Utmärkt";
