import { register } from "@/lib/events/eventBus";
import { createServiceClient } from "@/lib/supabase/server";
import type { DomainEvent, DomainEventType } from "@/lib/events/types";

const LABELS: Record<DomainEventType, string> = {
  "quote.created":            "Offerte aangemaakt",
  "quote.sent":               "Offerte verzonden naar klant",
  "quote.accepted":           "Offerte geaccepteerd door klant",
  "quote.rejected":           "Offerte afgewezen door klant",
  "quote.expired":            "Offerte verlopen",
  "appointment.created":      "Afspraak ingepland",
  "appointment.assigned":     "Medewerker toegewezen",
  "appointment.rescheduled":  "Afspraak verplaatst",
  "appointment.started":      "Werkzaamheden gestart",
  "appointment.completed":    "Werkzaamheden afgerond",
  "appointment.cancelled":    "Afspraak geannuleerd",
  "invoice.created":          "Factuur aangemaakt",
  "invoice.sent":             "Factuur verzonden naar klant",
  "invoice.paid":             "Factuur betaald",
  "invoice.overdue":          "Factuur verlopen",
  "invoice.credit_created":   "Creditfactuur aangemaakt",
  "maintenance.due":          "Onderhoud vervallen",
  "maintenance.scheduled":    "Onderhoud ingepland",
  "message.received":         "Bericht ontvangen",
  "payment.completed":        "Betaling ontvangen",
  "payment.failed":           "Betaling mislukt",
  "payment.refunded":         "Betaling teruggestort",
};

async function log(event: DomainEvent<DomainEventType>): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("activity_log").insert({
    actor_id: event.actorId ?? null,
    entity_type: event.aggregateType,
    entity_id: event.aggregateId,
    action: LABELS[event.type],
    metadata: { event_type: event.type, ...(event.payload as unknown as Record<string, unknown>) },
  });
}

// Catch-all: registreer voor alle bekende events
for (const type of Object.keys(LABELS) as DomainEventType[]) {
  register(type, [log as (event: DomainEvent<typeof type>) => Promise<void>]);
}
