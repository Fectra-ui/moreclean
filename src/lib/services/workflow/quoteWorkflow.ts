import { createServiceClient } from "@/lib/supabase/server";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

// ── State definitions ───────────────────────────────────────────────────────

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
  adminOnly?: boolean; // hide from klant view
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: "concept",        label: "Concept",            description: "Offerte in opmaak",              adminOnly: true },
  { key: "verzonden",      label: "Verzonden",           description: "Wacht op reactie klant" },
  { key: "akkoord",        label: "Klant akkoord",       description: "Klant heeft geaccepteerd" },
  { key: "wacht_betaling", label: "Wacht op betaling",   description: "Betaalinstructies verstuurd" },
  { key: "betaald",        label: "Betaling ontvangen",  description: "Opdracht bevestigd — inplannen" },
  { key: "planning",       label: "Ingepland",           description: "Datum en team vastgelegd" },
  { key: "uitvoering",     label: "Uitvoering",          description: "Werkzaamheden lopen" },
  { key: "uitgevoerd",     label: "Uitgevoerd",          description: "Werk voltooid, factuur volgt" },
  { key: "gefactureerd",   label: "Factuur verstuurd",   description: "Wacht op factuurbetaling" },
  { key: "factuur_betaald",label: "Betaald",             description: "Opdracht volledig afgerond" },
];

// Allowed transitions: from → to[]
const TRANSITIONS: Partial<Record<WorkflowState, WorkflowState[]>> = {
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

// ── Transition function ─────────────────────────────────────────────────────

export async function transitionQuote(
  quoteId: string,
  to: WorkflowState,
  actorId?: string,
  payload: Record<string, unknown> = {}
): Promise<{ error: string | null }> {
  const svc = createServiceClient();

  // Read current state
  const { data: quote, error: readErr } = await svc
    .from("quotes")
    .select("id, workflow_state, client_id")
    .eq("id", quoteId)
    .single();

  if (readErr || !quote) return { error: "Offerte niet gevonden" };

  const from = (quote.workflow_state ?? "concept") as WorkflowState;
  if (!canTransition(from, to)) {
    return { error: `Transitie van '${from}' naar '${to}' niet toegestaan` };
  }

  // Build DB patch from state
  const patch: Record<string, unknown> = { workflow_state: to };

  // Mirror to legacy status field where possible
  const statusMap: Partial<Record<WorkflowState, string>> = {
    concept:        "draft",
    verzonden:      "sent",
    akkoord:        "accepted",
    wacht_betaling: "accepted",
    betaald:        "accepted",
    afgewezen:      "rejected",
    verlopen:       "expired",
  };
  if (statusMap[to]) patch.status = statusMap[to];

  // Timestamp columns
  if (to === "verzonden")      patch.sent_at           = new Date().toISOString();
  if (to === "akkoord")        patch.accepted_at       = new Date().toISOString();
  if (to === "betaald")        patch.payment_received_at = new Date().toISOString();
  if (to === "planning")       patch.planned_at        = new Date().toISOString();
  if (to === "uitvoering")     patch.work_started_at   = new Date().toISOString();
  if (to === "uitgevoerd")     patch.work_completed_at = new Date().toISOString();
  if (to === "afgewezen")      patch.rejected_at       = new Date().toISOString();

  const { error: updateErr } = await svc.from("quotes").update(patch).eq("id", quoteId);
  if (updateErr) return { error: updateErr.message };

  // Log domain event
  await svc.from("domain_events").insert({
    type:           `quote.${to.replace("_", ".")}`,
    aggregate_type: "quote",
    aggregate_id:   quoteId,
    company_id:     COMPANY_ID,
    actor_id:       actorId ?? null,
    payload:        { from, to, ...payload },
  });

  // Side effects
  if (to === "betaald") {
    await onBetaaldReceived(quoteId, svc);
  }

  return { error: null };
}

// ── Side effects ────────────────────────────────────────────────────────────

async function onBetaaldReceived(
  quoteId: string,
  svc: ReturnType<typeof createServiceClient>
) {
  // Notify all admins: klaar voor planning
  const { data: admins } = await svc
    .from("profiles")
    .select("id")
    .eq("company_id", COMPANY_ID)
    .eq("role", "admin");

  for (const admin of admins ?? []) {
    await svc.from("notifications").insert({
      profile_id: admin.id,
      type:       "quote_accepted",
      title:      "Betaling ontvangen — inplannen",
      body:       "Een klant heeft betaald. De opdracht kan worden ingepland.",
      link:       `/admin/offertes/${quoteId}`,
    });
  }
}
