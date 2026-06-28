"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  profile: { id: string; first_name: string | null; last_name: string | null; role: string; phone: string | null; avatar_url: string | null };
  email: string;
}

export default function MedewerkerProfielForm({ profile, email }: Props) {
  const [values, setValues] = useState({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    phone: profile.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabel: Record<string, string> = { admin: "Beheerder", employee: "Medewerker", customer: "Klant" };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").update(values).eq("id", profile.id);
    if (err) setError(err.message);
    else setSaved(true);
    setSaving(false);
  }

  const inp = "w-full rounded-xl border border-[#101536]/10 bg-[#F8F9FB] px-3 py-2.5 text-sm text-[#101536] focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10 transition";

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-[#101536]">Persoonlijke gegevens</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Voornaam</label>
          <input className={inp} value={values.first_name} onChange={(e) => setValues((v) => ({ ...v, first_name: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Achternaam</label>
          <input className={inp} value={values.last_name} onChange={(e) => setValues((v) => ({ ...v, last_name: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#606774]">E-mailadres</label>
          <input className={`${inp} opacity-60`} value={email} disabled />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Telefoonnummer</label>
          <input className={inp} value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} placeholder="+31 6 12345678" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#606774]">Rol</label>
          <input className={`${inp} opacity-60`} value={roleLabel[profile.role] ?? profile.role} disabled />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
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
