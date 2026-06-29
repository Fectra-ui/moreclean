// Pure types + constants — geen server imports, veilig in client components

export type WorkflowState =
  | "concept"
  | "verzonden"
  | "akkoord"
  | "wacht_betaling"
  | "betaald"
  | "planning"
  | "uitvoering"
  | "uitgevoerd"
  | "gefactureerd"
  | "factuur_betaald"
  | "afgewezen"
  | "verlopen";

export interface WorkflowStep {
  key: WorkflowState;
  label: string;
  description: string;
  adminOnly?: boolean;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: "concept",         label: "Concept",           description: "Offerte in opmaak",              adminOnly: true },
  { key: "verzonden",       label: "Verzonden",          description: "Wacht op reactie klant" },
  { key: "akkoord",         label: "Klant akkoord",      description: "Klant heeft geaccepteerd" },
  { key: "wacht_betaling",  label: "Wacht op betaling",  description: "Betaalinstructies verstuurd" },
  { key: "betaald",         label: "Betaling ontvangen", description: "Opdracht bevestigd — inplannen" },
  { key: "planning",        label: "Ingepland",          description: "Datum en team vastgelegd" },
  { key: "uitvoering",      label: "Uitvoering",         description: "Werkzaamheden lopen" },
  { key: "uitgevoerd",      label: "Uitgevoerd",         description: "Werk voltooid, factuur volgt" },
  { key: "gefactureerd",    label: "Factuur verstuurd",  description: "Wacht op factuurbetaling" },
  { key: "factuur_betaald", label: "Betaald",            description: "Opdracht volledig afgerond" },
];

export const TRANSITIONS: Partial<Record<WorkflowState, WorkflowState[]>> = {
  concept:        ["verzonden"],
  verzonden:      ["akkoord", "afgewezen", "verlopen"],
  akkoord:        ["wacht_betaling"],
  wacht_betaling: ["betaald"],
  betaald:        ["planning"],
  planning:       ["uitvoering"],
  uitvoering:     ["uitgevoerd"],
  uitgevoerd:     ["gefactureerd"],
  gefactureerd:   ["factuur_betaald"],
};

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getActiveStepIndex(state: WorkflowState): number {
  return WORKFLOW_STEPS.findIndex((s) => s.key === state);
}
