import { createHash } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CENTS = 9_999_999_999;

function uuid(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new Error("Ongeldige offertegegevens.");
  return value.toLowerCase();
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Ongeldige offertegegevens.");
  return value;
}

function hundredths(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Ongeldige offertegegevens.");
  const scaled = Math.round(value * 100);
  if (value < minimum || value > maximum || Math.abs(value * 100 - scaled) > 1e-7) {
    throw new Error("Ongeldige offertegegevens.");
  }
  return scaled;
}

function decimal(value: number): string {
  return (value / 100).toFixed(2);
}

function date(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error("Ongeldige offertegegevens.");
  }
  return value;
}

export interface RawQuoteCreate {
  quote_id: unknown;
  client_id: unknown;
  subject?: unknown;
  intro_text?: unknown;
  notes?: unknown;
  internal_notes?: unknown;
  valid_until?: unknown;
  discount_pct?: unknown;
  vat_rate?: unknown;
  items: unknown;
}

export function canonicalQuoteCreate(raw: RawQuoteCreate, actorId: string, companyId: string) {
  if (!Array.isArray(raw.items)) throw new Error("Ongeldige offertegegevens.");
  const discount = hundredths(raw.discount_pct ?? 0, 0, 100);
  const vat = hundredths(raw.vat_rate ?? 21, 0, 100);
  let grossCents = 0;
  const items = raw.items.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Ongeldige offerteregel.");
    const item = entry as Record<string, unknown>;
    if (typeof item.description !== "string" || !item.description) throw new Error("Ongeldige offerteregel.");
    const quantity = hundredths(item.quantity, 0.01, 99_999_999.99);
    const unitPrice = hundredths(item.unit_price, 0, 99_999_999.99);
    const totalPrice = Math.round(quantity * unitPrice / 100);
    if (!Number.isSafeInteger(totalPrice) || totalPrice > MAX_CENTS) throw new Error("Ongeldige offerteregel.");
    grossCents += totalPrice;
    if (!Number.isSafeInteger(grossCents) || grossCents > MAX_CENTS) throw new Error("Offertebedrag is te hoog.");
    return {
      service_id: item.service_id ? uuid(item.service_id) : null,
      description: item.description,
      quantity: decimal(quantity),
      unit_price: decimal(unitPrice),
      total_price: decimal(totalPrice),
      sort_order: index,
    };
  });
  const subtotal = Math.round(grossCents * (10_000 - discount) / 10_000);
  const vatAmount = Math.round(subtotal * vat / 10_000);
  const total = subtotal + vatAmount;
  if (total > MAX_CENTS) throw new Error("Offertebedrag is te hoog.");

  const intent = {
    version: "quote-create:v1",
    quote_id: uuid(raw.quote_id),
    actor_id: uuid(actorId),
    company_id: uuid(companyId),
    client_id: uuid(raw.client_id),
    subject: optionalText(raw.subject),
    intro_text: optionalText(raw.intro_text),
    notes: optionalText(raw.notes),
    internal_notes: optionalText(raw.internal_notes),
    valid_until: date(raw.valid_until),
    discount_pct: decimal(discount),
    vat_rate: decimal(vat),
    subtotal: decimal(subtotal),
    vat_amount: decimal(vatAmount),
    total: decimal(total),
    items,
  };
  return { intent, hash: createHash("sha256").update(JSON.stringify(intent), "utf8").digest("hex") };
}
