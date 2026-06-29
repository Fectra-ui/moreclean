"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, X, Check } from "lucide-react";
import type { Service, ServiceCategory, ServiceUnit } from "@/types/database";

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  glasbewassing: "Glasbewassing",
  zonnepanelen: "Zonnepanelen",
  schoonmaak: "Schoonmaak",
  gevelreiniging: "Gevelreiniging",
  overig: "Overig",
};

const UNIT_LABEL: Record<ServiceUnit, string> = {
  per_raam: "per raam",
  per_uur: "per uur",
  vast: "vast bedrag",
  per_m2: "per m²",
  per_paneel: "per paneel",
};

const CATEGORY_COLOR: Record<ServiceCategory, string> = {
  glasbewassing: "bg-blue-100 text-blue-700",
  zonnepanelen: "bg-amber-100 text-amber-700",
  schoonmaak: "bg-emerald-100 text-emerald-700",
  gevelreiniging: "bg-purple-100 text-purple-700",
  overig: "bg-[#F3F5F7] text-[#606774]",
};

const CATEGORIES: ServiceCategory[] = ["glasbewassing", "zonnepanelen", "schoonmaak", "gevelreiniging", "overig"];
const UNITS: ServiceUnit[] = ["per_raam", "per_uur", "vast", "per_m2", "per_paneel"];

interface FormState {
  name: string;
  description: string;
  category: ServiceCategory;
  unit: ServiceUnit;
  default_price: string;
  vat_rate: string;
}

const EMPTY_FORM: FormState = {
  name: "", description: "", category: "glasbewassing",
  unit: "per_raam", default_price: "", vat_rate: "21",
};

export default function DienstenClient({ initialServices, companyId }: { initialServices: Service[]; companyId: string }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<ServiceCategory | "all">("all");

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      category: s.category,
      unit: s.unit,
      default_price: s.default_price != null ? String(s.default_price) : "",
      vat_rate: String(s.vat_rate),
    });
    setError(null);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) { setError("Naam is verplicht"); return; }
    setError(null);
    startTransition(async () => {
      const body = {
        ...form,
        default_price: form.default_price ? parseFloat(form.default_price) : null,
        vat_rate: parseFloat(form.vat_rate) || 21,
        company_id: companyId,
        id: editing?.id,
      };
      const res = await fetch("/api/admin/diensten", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Opslaan mislukt"); return; }
      if (editing) {
        setServices((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...body, id: editing.id } as Service : s));
      } else {
        setServices((prev) => [...prev, json as Service]);
      }
      setShowForm(false);
    });
  }

  function handleToggleActive(s: Service) {
    startTransition(async () => {
      const res = await fetch("/api/admin/diensten", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, active: !s.active }),
      });
      if (res.ok) {
        setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, active: !x.active } : x));
      }
    });
  }

  const filtered = filterCat === "all" ? services : services.filter((s) => s.category === filterCat);
  const activeCount = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Dienstencatalogus</h1>
          <p className="mt-1 text-sm text-[#606774]">
            {activeCount} actieve diensten · {services.length} totaal
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5"
        >
          <Plus size={16} /> Nieuwe dienst
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filterCat === cat
                ? "bg-[#101536] text-white"
                : "bg-[#F3F5F7] text-[#606774] hover:bg-[#101536]/10"
            }`}
          >
            {cat === "all" ? "Alles" : CATEGORY_LABEL[cat]}
            <span className="ml-1.5 opacity-60">
              {cat === "all" ? services.length : services.filter((s) => s.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {services.length === 0 && (
        <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold text-[#101536]">Nog geen diensten</p>
          <p className="mt-1 text-sm text-[#606774]">Voeg je eerste dienst toe of importeer via de onboarding-wizard.</p>
          <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#4D7EBA] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            <Plus size={14} /> Nieuwe dienst
          </button>
        </div>
      )}

      {/* Services table */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#101536]/06 bg-[#F8F9FB]">
                {["Dienst", "Categorie", "Prijs", "Eenheid", "BTW", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#606774]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101536]/05">
              {filtered.map((s) => (
                <tr key={s.id} className={`transition hover:bg-[#F8F9FB] ${!s.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#101536]">{s.name}</p>
                    {s.description && <p className="text-xs text-[#606774] truncate max-w-[220px]">{s.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLOR[s.category]}`}>
                      {CATEGORY_LABEL[s.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#101536]">
                    {s.default_price != null ? `€ ${Number(s.default_price).toFixed(2).replace(".", ",")}` : "–"}
                  </td>
                  <td className="px-4 py-3 text-[#606774]">{UNIT_LABEL[s.unit]}</td>
                  <td className="px-4 py-3 text-[#606774]">{s.vat_rate}%</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(s)} disabled={isPending}
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${s.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-[#F3F5F7] text-[#606774] hover:bg-[#101536]/10"}`}>
                      {s.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                      {s.active ? "Actief" : "Inactief"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(s)}
                      className="rounded-xl border border-[#101536]/10 bg-white p-1.5 text-[#606774] transition hover:border-[#4D7EBA]/30 hover:text-[#4D7EBA]">
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-in form panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#101536]">{editing ? "Dienst bewerken" : "Nieuwe dienst"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-1.5 text-[#606774] hover:bg-[#F3F5F7]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Naam *">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="bijv. Glasbewassing kozijnen" className={INPUT} />
              </Field>
              <Field label="Omschrijving">
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optionele toelichting op de offerte" className={INPUT + " resize-none"} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categorie">
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))} className={INPUT}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </select>
                </Field>
                <Field label="Eenheid">
                  <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as ServiceUnit }))} className={INPUT}>
                    {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
                  </select>
                </Field>
                <Field label="Standaardprijs (€)">
                  <input type="number" min="0" step="0.01" value={form.default_price}
                    onChange={(e) => setForm((f) => ({ ...f, default_price: e.target.value }))}
                    placeholder="0.00" className={INPUT} />
                </Field>
                <Field label="BTW-tarief (%)">
                  <select value={form.vat_rate} onChange={(e) => setForm((f) => ({ ...f, vat_rate: e.target.value }))} className={INPUT}>
                    <option value="0">0%</option>
                    <option value="9">9%</option>
                    <option value="21">21%</option>
                  </select>
                </Field>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-2xl border border-[#101536]/10 px-5 py-2.5 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">
                Annuleren
              </button>
              <button onClick={handleSave} disabled={isPending}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.20)] transition hover:-translate-y-0.5 disabled:opacity-60">
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const INPUT = "w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm text-[#101536] focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#606774]">{label}</label>
      {children}
    </div>
  );
}
