"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, Loader2, ExternalLink } from "lucide-react";
import type { Service } from "@/types/database";

interface ClientOption {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  vat_number: string | null;
}

interface LineItem {
  id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
}

const VAT_RATE = 21;

export default function QuoteEditor({
  clients,
  services,
  defaultClientId,
  userId,
}: {
  clients: ClientOption[];
  services: Pick<Service, "id" | "name" | "category" | "default_price" | "unit">[];
  defaultClientId?: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quote meta
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [subject, setSubject] = useState("");
  const [introText, setIntroText] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [discountPct, setDiscountPct] = useState(0);

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), service_id: null, description: "", quantity: 1, unit_price: 0 },
  ]);

  const selectedClient = clients.find((c) => c.id === clientId);

  // Live totals
  const { subtotal, discountAmount, vatAmount, total } = useMemo(() => {
    const gross = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const discountAmount = gross * (discountPct / 100);
    const subtotal = gross - discountAmount;
    const vatAmount = subtotal * (VAT_RATE / 100);
    return { subtotal, discountAmount, vatAmount, total: subtotal + vatAmount };
  }, [items, discountPct]);

  // Item operations
  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), service_id: null, description: "", quantity: 1, unit_price: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number | null) {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };

      // When a service is selected, prefill description + price
      if (field === "service_id" && value) {
        const svc = services.find((s) => s.id === value);
        if (svc) {
          updated.description = svc.name;
          updated.unit_price = svc.default_price ?? 0;
        }
      }
      return updated;
    }));
  }

  async function handleSave(sendImmediately: boolean) {
    if (!clientId) { setError("Selecteer een klant."); return; }
    if (items.some((i) => !i.description)) { setError("Vul alle omschrijvingen in."); return; }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        subject,
        intro_text: introText,
        notes,
        internal_notes: internalNotes,
        valid_until: validUntil,
        discount_pct: discountPct,
        items: items.map((i) => ({
          service_id: i.service_id || null,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        created_by: userId,
        send: sendImmediately,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Er is een fout opgetreden.");
      setLoading(false);
      return;
    }

    const { id } = await res.json();
    router.push(`/admin/offertes/${id}`);
  }

  const euro = (n: number) =>
    n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        {/* CLIENT SELECTOR */}
        <Card title="Klant">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-sm text-[#101536] outline-none focus:border-[#4D7EBA]/40 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/10"
          >
            <option value="">— Selecteer klant —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name || c.contact_name}
                {c.email ? ` · ${c.email}` : ""}
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="mt-3 rounded-2xl bg-[#F3F5F7]/60 p-4 text-sm">
              <p className="font-semibold text-[#101536]">{selectedClient.company_name || selectedClient.contact_name}</p>
              {selectedClient.address && (
                <p className="text-[#606774]">{selectedClient.address}, {selectedClient.postal_code} {selectedClient.city}</p>
              )}
              {selectedClient.email && <p className="text-[#606774]">{selectedClient.email}</p>}
              {selectedClient.vat_number && <p className="text-xs text-[#606774]">BTW: {selectedClient.vat_number}</p>}
            </div>
          )}
        </Card>

        {/* META */}
        <Card title="Offerte gegevens">
          <div className="space-y-4">
            <Field label="Onderwerp">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="bijv. Glasbewassing 2026 — Kantoor De Vries"
                className={INPUT}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Geldig tot">
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Korting (%)">
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                  className={INPUT}
                />
              </Field>
            </div>
            <Field label="Inleiding (wordt op PDF getoond)">
              <textarea
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                rows={2}
                placeholder="Geachte heer/mevrouw..."
                className={`${INPUT} resize-none`}
              />
            </Field>
          </div>
        </Card>

        {/* LINE ITEMS */}
        <Card title="Werkzaamheden">
          <div className="space-y-3">
            {/* HEADER ROW */}
            <div className="grid grid-cols-[1fr_80px_100px_36px] gap-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#606774]">Omschrijving</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#606774] text-right">Aantal</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#606774] text-right">Prijs</span>
              <span />
            </div>

            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#101536]/08 bg-[#F3F5F7]/60 p-3">
                {/* SERVICE QUICK-SELECT */}
                <div className="mb-2">
                  <select
                    value={item.service_id ?? ""}
                    onChange={(e) => updateItem(item.id, "service_id", e.target.value || null)}
                    className="w-full rounded-xl border border-[#101536]/08 bg-white px-3 py-2 text-xs text-[#606774] outline-none focus:border-[#4D7EBA]/30"
                  >
                    <option value="">— Kies dienst of typ zelf —</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · €{s.default_price?.toFixed(2) ?? "—"} / {s.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-[1fr_80px_100px_36px] items-center gap-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Omschrijving..."
                    className="rounded-xl border border-[#101536]/08 bg-white px-3 py-2 text-sm text-[#101536] outline-none focus:border-[#4D7EBA]/30 focus:ring-1 focus:ring-[#4D7EBA]/10"
                  />
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                    className="rounded-xl border border-[#101536]/08 bg-white px-3 py-2 text-sm text-right text-[#101536] outline-none focus:border-[#4D7EBA]/30"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#606774]">€</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-[#101536]/08 bg-white px-3 py-2 pl-6 text-sm text-right text-[#101536] outline-none focus:border-[#4D7EBA]/30"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[#606774] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-25"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-1.5 flex justify-end">
                  <span className="text-xs font-semibold text-[#101536]">
                    {euro(item.quantity * item.unit_price)}
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={addItem}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#4D7EBA]/25 py-3 text-sm font-medium text-[#4D7EBA] transition hover:border-[#4D7EBA]/50 hover:bg-[#4D7EBA]/04"
            >
              <Plus size={16} />
              Regel toevoegen
            </button>
          </div>
        </Card>

        {/* NOTES */}
        <Card title="Opmerkingen voor klant">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Aanvullende informatie voor de klant..."
            className={`${INPUT} resize-none`}
          />
        </Card>
      </div>

      {/* RIGHT COLUMN: TOTALS + ACTIONS */}
      <div className="space-y-4">
        {/* TOTALS */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#606774]">Totaaloverzicht</h3>

          <div className="space-y-2.5">
            <TotalsRow label="Subtotaal" value={euro(subtotal + discountAmount)} />
            {discountPct > 0 && (
              <TotalsRow label={`Korting (${discountPct}%)`} value={`- ${euro(discountAmount)}`} color="text-[#4D7EBA]" />
            )}
            {discountPct > 0 && (
              <TotalsRow label="Na korting" value={euro(subtotal)} />
            )}
            <TotalsRow label={`BTW (${VAT_RATE}%)`} value={euro(vatAmount)} />
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#4D7EBA] to-[#667FB0] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Eindtotaal</span>
                <span className="text-xl font-bold text-white">{euro(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl space-y-3">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#606774]">Opslaan als</h3>

          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-5 py-3 text-sm font-semibold text-[#101536] transition hover:bg-[#F3F5F7] disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Concept opslaan
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            Opslaan & versturen
          </button>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
        </div>

        {/* INTERNAL NOTES */}
        <div className="rounded-[24px] border border-amber-100 bg-amber-50/60 p-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-amber-700">
            Interne notities (niet op PDF)
          </label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={3}
            placeholder="Alleen zichtbaar voor personeel..."
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-[#101536] outline-none resize-none focus:border-amber-300"
          />
        </div>
      </div>
    </div>
  );
}

// ── SUB COMPONENTS ────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[#606774]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#101536]">{label}</label>
      {children}
    </div>
  );
}

function TotalsRow({ label, value, color = "text-[#606774]" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#606774]">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

const INPUT = "w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-sm text-[#101536] outline-none transition placeholder-[#606774]/50 focus:border-[#4D7EBA]/40 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/10";
