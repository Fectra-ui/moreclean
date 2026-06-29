"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

const FUEL_TYPES = [
  { value: "diesel",   label: "Diesel" },
  { value: "petrol",   label: "Benzine" },
  { value: "electric", label: "Elektrisch" },
  { value: "hybrid",   label: "Hybride" },
  { value: "lpg",      label: "LPG" },
];

export default function NieuwVoertuigPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    const res = await fetch("/api/admin/voertuigen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) { setError(json.error ?? "Opslaan mislukt"); return; }
    router.push(`/admin/voertuigen/${json.id}`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/voertuigen" className="mb-3 flex items-center gap-1 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Voertuigen
        </Link>
        <h1 className="text-2xl font-bold text-[#101536]">Nieuw voertuig</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur-xl space-y-5">
        {error && (
          <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Naam *" name="name" placeholder="Bestelbus 1" required />
          <Field label="Kenteken *" name="license_plate" placeholder="XX-000-X" required />
          <Field label="Merk" name="brand" placeholder="Mercedes" />
          <Field label="Model" name="model" placeholder="Sprinter" />
          <Field label="Bouwjaar" name="year" type="number" placeholder={String(new Date().getFullYear())} min="1990" max={String(new Date().getFullYear() + 1)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#101536]">Brandstof</label>
            <select name="fuel_type" defaultValue="diesel"
              className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-2.5 text-sm text-[#101536] focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10">
              {FUEL_TYPES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <Field label="Huidige kilometerstand" name="current_odometer" type="number" placeholder="0" min="0" />
          <Field label="Onderhoud bij km-stand" name="next_service_km" type="number" placeholder="bijv. 150000" min="0" />
          <Field label="APK vervaldatum" name="apk_expiry" type="date" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5 disabled:opacity-60">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Voertuig opslaan
          </button>
          <Link href="/admin/voertuigen"
            className="flex items-center rounded-2xl border border-[#101536]/10 bg-white px-5 py-3 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, required, min, max }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; min?: string; max?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#101536]">{label}</label>
      <input
        type={type} name={name} placeholder={placeholder} required={required} min={min} max={max}
        className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-2.5 text-sm text-[#101536] placeholder-[#606774]/50 focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10"
      />
    </div>
  );
}
