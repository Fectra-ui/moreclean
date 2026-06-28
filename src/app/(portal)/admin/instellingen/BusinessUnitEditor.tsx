"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { BusinessUnit } from "@/lib/services/crm/businessUnits";

export default function BusinessUnitEditor({ bu }: { bu: BusinessUnit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(bu.name);
  const [description, setDescription] = useState(bu.description ?? "");
  const [email, setEmail] = useState(bu.email ?? "");
  const [phone, setPhone] = useState(bu.phone ?? "");
  const [color, setColor] = useState(bu.primary_color);
  const [vatText, setVatText] = useState(bu.vat_text ?? "");
  const [paymentTerms, setPaymentTerms] = useState(bu.payment_terms.toString());
  const [active, setActive] = useState(bu.active);

  const save = async () => {
    setLoading(true);
    await fetch(`/api/business-units/${bu.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, email, phone, primary_color: color, vat_text: vatText, payment_terms: parseInt(paymentTerms, 10), active }),
    });
    router.refresh();
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#F8F9FB]"
      >
        <span className="text-2xl">{bu.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#101536]">{bu.name}</span>
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: `${bu.primary_color}18`, color: bu.primary_color }}>
              {bu.short_code}-xxxx-0001
            </span>
            {!bu.active && (
              <span className="rounded-full bg-[#F3F5F7] px-2 py-0.5 text-xs font-semibold text-[#606774]">Inactief</span>
            )}
          </div>
          <p className="text-sm text-[#606774]">{bu.description ?? "Geen beschrijving"}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-[#606774]" /> : <ChevronDown size={16} className="text-[#606774]" />}
      </button>

      {open && (
        <div className="border-t border-[#101536]/06 px-5 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Naam</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Merkkleur</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-[#101536]/10 p-1" />
                <input value={color} onChange={(e) => setColor(e.target.value)}
                  className="flex-1 rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm font-mono outline-none focus:border-[#4D7EBA]/40" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Beschrijving</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte omschrijving van de bedrijfsunit"
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">E-mailadres (facturen)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="unit@bedrijf.nl"
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Betaaltermijn (dagen)</label>
              <input type="number" min="1" max="90" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">BTW-tekst op factuur (optioneel afwijkend)</label>
            <input value={vatText} onChange={(e) => setVatText(e.target.value)}
              placeholder="Standaard BTW-tekst van More Clean"
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
          </div>

          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={active}
              onClick={() => setActive(!active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-[#4D7EBA]" : "bg-[#101536]/20"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-[#606774]">{active ? "Actief" : "Inactief — verborgen in selectielijsten"}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpen(false)}
              className="rounded-2xl border border-[#101536]/10 px-4 py-2 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">
              Annuleren
            </button>
            <button onClick={save} disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-[#4D7EBA] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#3d6eaa] disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
