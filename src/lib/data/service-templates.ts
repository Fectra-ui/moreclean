export interface ServiceTemplate {
  name: string;
  description: string | null;
  category: "glasbewassing" | "zonnepanelen" | "schoonmaak" | "gevelreiniging" | "overig";
  unit: "per_raam" | "per_uur" | "vast" | "per_m2" | "per_paneel";
  default_price: number;
  vat_rate: number;
  sort_order: number;
}

export interface BranchTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  services: ServiceTemplate[];
}

export const STARTER_SERVICES: ServiceTemplate[] = [
  {
    name: "Glasbewassing",
    description: "Professionele reiniging van ramen, kozijnen en vensterbanken",
    category: "glasbewassing",
    unit: "per_raam",
    default_price: 2.10,
    vat_rate: 21,
    sort_order: 0,
  },
  {
    name: "Zonnepanelen reinigen",
    description: "Schoonmaken van zonnepanelen voor optimaal energierendement",
    category: "zonnepanelen",
    unit: "per_paneel",
    default_price: 8.50,
    vat_rate: 21,
    sort_order: 1,
  },
  {
    name: "Gevelreiniging",
    description: "Hogedrukreiniging van gevels, buitenmuren en bestrating",
    category: "gevelreiniging",
    unit: "per_m2",
    default_price: 3.50,
    vat_rate: 21,
    sort_order: 2,
  },
  {
    name: "Dakgootreiniging",
    description: "Reinigen en ontstoppen van dakgoten en afvoerpijpen",
    category: "overig",
    unit: "vast",
    default_price: 125.00,
    vat_rate: 21,
    sort_order: 3,
  },
  {
    name: "Kantoorschoonmaak",
    description: "Periodieke schoonmaak van kantoren en bedrijfsruimten",
    category: "schoonmaak",
    unit: "per_uur",
    default_price: 35.00,
    vat_rate: 21,
    sort_order: 4,
  },
  {
    name: "Opleveringsschoonmaak",
    description: "Grondige schoonmaak na bouw, verbouwing of renovatie",
    category: "schoonmaak",
    unit: "per_m2",
    default_price: 7.50,
    vat_rate: 21,
    sort_order: 5,
  },
];

export const BRANCH_TEMPLATES: BranchTemplate[] = [
  {
    id: "glazenwasser",
    label: "Glazenwasser",
    icon: "🪟",
    description: "Ramen, kozijnen, serres en dakramen",
    services: [
      { name: "Glasbewassing woning", description: "Ramen en kozijnen particulier", category: "glasbewassing", unit: "per_raam", default_price: 2.10, vat_rate: 21, sort_order: 0 },
      { name: "Glasbewassing bedrijf", description: "Ramen en kozijnen zakelijk", category: "glasbewassing", unit: "per_raam", default_price: 1.75, vat_rate: 21, sort_order: 1 },
      { name: "Serre reiniging", description: "Volledig reinigen serre binnen en buiten", category: "glasbewassing", unit: "vast", default_price: 195.00, vat_rate: 21, sort_order: 2 },
      { name: "Dakramen", description: "Reiniging dakramen en Velux", category: "glasbewassing", unit: "per_raam", default_price: 12.50, vat_rate: 21, sort_order: 3 },
      { name: "Zonnepanelen reinigen", description: "Reinigen zonnepanelen", category: "zonnepanelen", unit: "per_paneel", default_price: 8.50, vat_rate: 21, sort_order: 4 },
      { name: "Dakgootreiniging", description: "Reinigen en ontstoppen dakgoten", category: "overig", unit: "vast", default_price: 125.00, vat_rate: 21, sort_order: 5 },
    ],
  },
  {
    id: "schoonmaakbedrijf",
    label: "Schoonmaakbedrijf",
    icon: "🧹",
    description: "Kantoren, winkels en bedrijfspanden",
    services: [
      { name: "Kantoorschoonmaak", description: "Periodieke schoonmaak kantoorruimten", category: "schoonmaak", unit: "per_uur", default_price: 35.00, vat_rate: 21, sort_order: 0 },
      { name: "Toiletreiniging", description: "Sanitaire ruimten schoonmaken", category: "schoonmaak", unit: "per_uur", default_price: 35.00, vat_rate: 21, sort_order: 1 },
      { name: "Tapijt reinigen", description: "Chemisch reinigen tapijt en vloerbedekking", category: "schoonmaak", unit: "per_m2", default_price: 4.50, vat_rate: 21, sort_order: 2 },
      { name: "Opleveringsschoonmaak", description: "Grondige schoonmaak na bouw of verbouwing", category: "schoonmaak", unit: "per_m2", default_price: 7.50, vat_rate: 21, sort_order: 3 },
      { name: "Winkelschoonmaak", description: "Dagelijkse of wekelijkse winkelschoonmaak", category: "schoonmaak", unit: "per_uur", default_price: 32.50, vat_rate: 21, sort_order: 4 },
      { name: "Glasbewassing", description: "Ramen en etalages", category: "glasbewassing", unit: "per_raam", default_price: 1.75, vat_rate: 21, sort_order: 5 },
    ],
  },
  {
    id: "vve",
    label: "VvE / Appartement",
    icon: "🏢",
    description: "Gemeenschappelijke ruimten en appartementen",
    services: [
      { name: "Trappenhuisschoonmaak", description: "Wekelijkse reiniging trappenhuis", category: "schoonmaak", unit: "per_uur", default_price: 32.50, vat_rate: 21, sort_order: 0 },
      { name: "Glasbewassing gemeenschappelijk", description: "Ramen en glazen deuren gemeenschappelijk", category: "glasbewassing", unit: "per_raam", default_price: 2.10, vat_rate: 21, sort_order: 1 },
      { name: "Gevelreiniging flat", description: "Hogedrukreiniging gevels", category: "gevelreiniging", unit: "per_m2", default_price: 3.50, vat_rate: 21, sort_order: 2 },
      { name: "Parkeergarage reinigen", description: "Reiniging vloer parkeergarage", category: "schoonmaak", unit: "per_m2", default_price: 2.25, vat_rate: 21, sort_order: 3 },
      { name: "Groenonderhoud", description: "Onderhoud tuin en gemeenschappelijke groenstroken", category: "overig", unit: "per_uur", default_price: 45.00, vat_rate: 21, sort_order: 4 },
    ],
  },
  {
    id: "particulier",
    label: "Particulieren",
    icon: "🏠",
    description: "Woningen en tuinen",
    services: [
      { name: "Glasbewassing woning", description: "Alle ramen en kozijnen", category: "glasbewassing", unit: "per_raam", default_price: 2.10, vat_rate: 21, sort_order: 0 },
      { name: "Zonnepanelen reinigen", description: "Schoonmaak zonnepanelen dak", category: "zonnepanelen", unit: "per_paneel", default_price: 8.50, vat_rate: 21, sort_order: 1 },
      { name: "Dakgootreiniging", description: "Reinigen en entstoppen dakgoten", category: "overig", unit: "vast", default_price: 125.00, vat_rate: 21, sort_order: 2 },
      { name: "Gevelreiniging woning", description: "Reinigen gevel en oprit", category: "gevelreiniging", unit: "per_m2", default_price: 4.00, vat_rate: 21, sort_order: 3 },
      { name: "Voorjaarschoonmaak", description: "Complete buiten schoonmaak in het voorjaar", category: "schoonmaak", unit: "vast", default_price: 295.00, vat_rate: 21, sort_order: 4 },
    ],
  },
];
