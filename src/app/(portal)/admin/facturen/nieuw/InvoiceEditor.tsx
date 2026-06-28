"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Client {
  id: string;
  contact_name: string;
  company_name: string | null;
  address: string | null;
  city: string | null;
  payment_terms: number;
}

interface Service {
  id: string;
  name: string;
  default_price: number | null;
  vat_rate: number;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  serviceId?: string;
}

interface Props {
  clients: Client[];
  services: Service[];
  defaultClientId?: string;
  defaultAppointmentId?: string;
  defaultItems?: Array<{ description: string; quantity: number; unitPrice: number }>;
}

const today = new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function InvoiceEditor({ clients, services, defaultClientId, defaultAppointmentId, defaultItems }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [clientSearch, setClientSearch] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [vatRate, setVatRate] = useState(21);
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);
  const defaultDueDate = selectedClient ? addDays(issueDate, selectedClient.payment_terms) : addDays(issueDate, 14);
  const [dueDate, setDueDate] = useState(defaultDueDate);

  const [items, setItems] = useState<LineItem[]>(
    defaultItems?.map((it) => ({ id: crypto.randomUUID(), ...it })) ?? [
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]
  );

  const filteredClients = clients
    .filter((c) => {
      const q = clientSearch.toLowerCase();
      return (c.company_name ?? c.contact_name).toLowerCase().includes(q);
    })
    .slice(0, 8);

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, [field]: value } : it));
  };

  const addRow = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const prefillFromService = (lineId: string, serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    setItems((prev) => prev.map((it) =>
      it.id === lineId ? { ...it, serviceId, description: svc.name, unitPrice: svc.default_price ?? 0 } : it
    ));
    if (svc.vat_rate) setVatRate(svc.vat_rate);
  };

  // Totals
  const subtotalRaw = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const subtotal = subtotalRaw * (1 - discountPct / 100);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;
  const euro = (n: number) => n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { setError("Selecteer een klant"); return; }
    if (items.some((it) => !it.description)) { setError("Vul alle omschrijvingen in"); return; }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        appointmentId: defaultAppointmentId ?? null,
        issueDate,
        dueDate,
        vatRate,
        discountPct,
        notes: notes || null,
        items: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          serviceId: it.serviceId ?? null,
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Fout bij aanmaken"); setLoading(false); return; }
    router.push(`/admin/facturen/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#101536]">Klant</h2>
        {selectedClient ? (
          <div className="flex items-center justify-between rounded-2xl border border-[#4D7EBA]/20 bg-[#4D7EBA]/05 px-4 py-3">
            <div>
              <p className="font-semibold text-[#101536]">{selectedClient.company_name || selectedClient.contact_name}</p>
              {selectedClient.city && <p className="text-sm text-[#606774]">{selectedClient.address}, {selectedClient.city}</p>}
              <p className="text-xs text-[#606774]">Betalingstermijn: {selectedClient.payment_terms} dagen</p>
            </div>
            <button type="button" onClick={() => { setClientId(""); setClientSearch(""); }} className="text-sm text-[#606774] hover:text-red-500">Wijzigen</button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Zoek klant..."
              className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white"
            />
            {clientSearch.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-auto rounded-2xl border border-[#101536]/08 bg-white shadow-lg max-h-48">
                {filteredClients.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => { setClientId(c.id); setClientSearch(""); setDueDate(addDays(issueDate, c.payment_terms)); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#F3F5F7]">
                      <p className="font-medium text-[#101536]">{c.company_name || c.contact_name}</p>
                      {c.city && <p className="text-xs text-[#606774]">{c.city}</p>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#101536]">Datums</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Factuurdatum</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Vervaldatum</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#101536]">Regelitems</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="grid items-start gap-2" style={{ gridTemplateColumns: "1fr 80px 100px 100px 36px" }}>
              <div className="space-y-1.5">
                <select
                  value={item.serviceId ?? ""}
                  onChange={(e) => e.target.value ? prefillFromService(item.id, e.target.value) : null}
                  className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-xs text-[#606774] outline-none focus:border-[#4D7EBA]/40"
                >
                  <option value="">Dienst kiezen…</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Omschrijving *"
                  required
                  className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white"
                />
              </div>
              <input type="number" min="0.01" step="0.01" value={item.quantity}
                onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                className="rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm text-right outline-none focus:border-[#4D7EBA]/40" />
              <input type="number" min="0" step="0.01" value={item.unitPrice}
                onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                className="rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm text-right outline-none focus:border-[#4D7EBA]/40" />
              <div className="rounded-xl bg-[#F8F9FB] px-3 py-2 text-sm font-medium text-right text-[#101536]">
                {euro(item.quantity * item.unitPrice)}
              </div>
              <button type="button" onClick={() => removeRow(item.id)} disabled={items.length === 1}
                className="mt-0.5 rounded-xl p-2 text-[#606774] hover:text-red-500 disabled:opacity-30">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 80px 100px 100px 36px" }}>
            <p className="text-[10px] text-[#606774]">Omschrijving</p>
            <p className="text-[10px] text-right text-[#606774]">Aantal</p>
            <p className="text-[10px] text-right text-[#606774]">Stukprijs</p>
            <p className="text-[10px] text-right text-[#606774]">Totaal</p>
            <span />
          </div>
        </div>
        <button type="button" onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#4D7EBA] hover:underline">
          <Plus size={14} /> Regel toevoegen
        </button>
      </div>

      {/* Totals + settings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[#101536]">BTW & korting</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">BTW (%)</label>
              <input type="number" min="0" max="100" value={vatRate} onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none focus:border-[#4D7EBA]/40" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Korting (%)</label>
              <input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none focus:border-[#4D7EBA]/40" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Opmerkingen</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Betalingsinstructies, referenties..."
              className="w-full resize-none rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#101536]">Totaaloverzicht</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#606774]">Subtotaal (excl. BTW)</dt>
              <dd className="font-medium text-[#101536]">{euro(subtotalRaw)}</dd>
            </div>
            {discountPct > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#606774]">Korting ({discountPct}%)</dt>
                <dd className="text-red-600">– {euro(subtotalRaw * discountPct / 100)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[#606774]">BTW ({vatRate}%)</dt>
              <dd className="text-[#101536]">{euro(vatAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#101536]/10 pt-2 text-base font-bold text-[#101536]">
              <dt>Totaal</dt>
              <dd>{euro(total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {error && <p className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="rounded-2xl border border-[#101536]/10 px-6 py-3 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">
          Annuleren
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5 disabled:opacity-70">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Factuur aanmaken
        </button>
      </div>
    </form>
  );
}
