"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  client: {
    id: string;
    contact_name: string | null;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    vat_number: string | null;
  };
  email: string;
}

export default function KlantGegevensForm({ client, email }: Props) {
  const [values, setValues] = useState({
    contact_name: client.contact_name ?? "",
    company_name: client.company_name ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    postal_code: client.postal_code ?? "",
    city: client.city ?? "",
    vat_number: client.vat_number ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(k: keyof typeof values, v: string) {
    setValues((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("clients")
      .update(values)
      .eq("id", client.id);
    if (err) setError(err.message);
    else setSaved(true);
    setSaving(false);
  }

  const inp = "w-full rounded-xl border border-[#101536]/10 bg-[#F8F9FB] px-3 py-2.5 text-sm text-[#101536] placeholder:text-[#606774]/50 focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10 transition";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-[#101536]">Contactgegevens</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Contactpersoon</label>
            <input className={inp} value={values.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Bedrijfsnaam</label>
            <input className={inp} value={values.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Optioneel" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">E-mailadres</label>
            <input className={`${inp} opacity-60`} value={email} disabled title="Pas uw e-mail aan via accountinstellingen" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Telefoonnummer</label>
            <input className={inp} value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+31 6 12345678" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-[#101536]">Adres</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Straat + huisnummer</label>
            <input className={inp} value={values.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Postcode</label>
            <input className={inp} value={values.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Stad</label>
            <input className={inp} value={values.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#606774]">BTW-nummer</label>
            <input className={inp} value={values.vat_number} onChange={(e) => set("vat_number", e.target.value)} placeholder="Optioneel" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[#4D7EBA] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3a6aa8] disabled:opacity-60"
        >
          {saving ? "Opslaan…" : "Opslaan"}
        </button>
        {saved && <p className="text-sm font-medium text-emerald-600">Opgeslagen</p>}
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>
    </form>
  );
}
