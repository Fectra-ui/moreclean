import type { DomainEvent, DomainEventType, EventMap } from "./types";
import { createServiceClient } from "@/lib/supabase/server";

// ============================================================
// HANDLER REGISTRY
// Type-safe: on("invoice.paid", handler) dwingt af dat handler
// een DomainEvent<"invoice.paid"> ontvangt — geen expliciete
// generics nodig op de call-site.
// ============================================================

type Handler<K extends DomainEventType> = (event: DomainEvent<K>) => Promise<void>;

// Intern: slaat handlers op als unknown zodat we één Map kunnen
// gebruiken zonder distributieve generics.
type AnyHandler = (event: DomainEvent<DomainEventType>) => Promise<void>;

const registry = new Map<DomainEventType, AnyHandler[]>();

export function on<K extends DomainEventType>(type: K, handler: Handler<K>): void {
  const existing = registry.get(type) ?? [];
  registry.set(type, [...existing, handler as AnyHandler]);
}

// register() — groepsregistratie voor de declaratieve API die de
// gebruiker beschreef: register("QuoteAccepted", [h1, h2, h3])
export function register<K extends DomainEventType>(type: K, handlers: Handler<K>[]): void {
  for (const h of handlers) on(type, h);
}

// ============================================================
// PUBLISH
// Persisteert het event en dispatcht naar alle handlers.
// Elke handler faalt onafhankelijk — een crash blokkeert de rest niet.
// ============================================================

export async function publish<K extends DomainEventType>(
  event: Omit<DomainEvent<K>, "occurredAt"> & { payload: EventMap[K] }
): Promise<void> {
  const fullEvent = { ...event, occurredAt: new Date() } as DomainEvent<K>;

  // Persist (fire-and-forget — nooit geblokkeerd door storage-fouten)
  persistEvent(fullEvent).catch((err) => {
    console.error("[eventBus] persistEvent failed:", fullEvent.type, err);
  });

  const handlers = registry.get(event.type) ?? [];
  if (handlers.length === 0) return;

  const results = await Promise.allSettled(
    handlers.map((h) => h(fullEvent as DomainEvent<DomainEventType>))
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[eventBus] handler failed for:", event.type, result.reason);
    }
  }
}

async function persistEvent(event: DomainEvent<DomainEventType>): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("domain_events").insert({
    type: event.type,
    aggregate_type: event.aggregateType,
    aggregate_id: event.aggregateId,
    company_id: event.companyId,
    actor_id: event.actorId ?? null,
    payload: event.payload as unknown as Record<string, unknown>,
    processed_at: new Date().toISOString(),
  });
}
