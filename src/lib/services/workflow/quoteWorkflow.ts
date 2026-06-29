import { createServiceClient } from "@/lib/supabase/server";

// Re-export shared pure types so existing server-side imports keep working
export type { WorkflowState, WorkflowStep } from "./quoteWorkflowTypes";
export { WORKFLOW_STEPS, TRANSITIONS, canTransition, getActiveStepIndex } from "./quoteWorkflowTypes";

import type { WorkflowState } from "./quoteWorkflowTypes";
import { canTransition } from "./quoteWorkflowTypes";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

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
