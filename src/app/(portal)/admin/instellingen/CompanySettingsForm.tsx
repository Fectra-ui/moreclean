"use client";

import { useState, useRef } from "react";
import type { CompanySettings } from "@/lib/services/crm/company";
import Image from "next/image";

interface Props {
  company: CompanySettings;
}

export default function CompanySettingsForm({ company }: Props) {
  const [values, setValues] = useState({
    name:             company.name ?? "",
    kvk:              company.kvk ?? "",
    vat_number:       company.vat_number ?? "",
    address:          company.address ?? "",
    postal_code:      company.postal_code ?? "",
    city:             company.city ?? "",
    phone:            company.phone ?? "",
    email:            company.email ?? "",
    iban:             company.iban ?? "",
    boekhouder_email: company.boekhouder_email ?? "",
    site_url:         company.site_url ?? "",
    primary_color:    company.primary_color ?? "#4D7EBA",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(company.logo_path ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Opslaan mislukt");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/company/logo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload mislukt");
      setLogoUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload mislukt");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* BEDRIJFSGEGEVENS */}
      <section className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-[#101536]">Bedrijfsgegevens</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bedrijfsnaam" required>
            <input
              className={input}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </Field>
          <Field label="Primaire kleur">
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-14 cursor-pointer rounded-xl border border-[#101536]/10 p-1"
                value={values.primary_color}
                onChange={(e) => set("primary_color", e.target.value)}
              />
              <input
                className={`${input} flex-1`}
                value={values.primary_color}
                onChange={(e) => set("primary_color", e.target.value)}
                placeholder="#4D7EBA"
              />
            </div>
          </Field>
          <Field label="Adres">
            <input className={input} value={values.address} onChange={(e) => set("address", e.target.value)} placeholder="Straatnaam 1" />
          </Field>
          <Field label="Postcode + Stad">
            <div className="flex gap-2">
              <input className={`${input} w-28`} value={values.postal_code} onChange={(e) => set("postal_code", e.target.value)} placeholder="6041 AA" />
              <input className={`${input} flex-1`} value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Roermond" />
            </div>
          </Field>
          <Field label="E-mailadres">
            <input className={input} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="info@moreclean.nl" />
          </Field>
          <Field label="Telefoonnummer">
            <input className={input} value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+31 6 12345678" />
          </Field>
          <Field label="Website">
            <input className={input} value={values.site_url} onChange={(e) => set("site_url", e.target.value)} placeholder="https://moreclean.nl" />
          </Field>
        </div>
      </section>

      {/* FISCALE GEGEVENS */}
      <section className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-[#101536]">Fiscale & bankgegevens</h2>
        <p className="mb-4 text-xs text-[#606774]">Deze gegevens verschijnen op facturen en offertes.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="KVK-nummer">
            <input className={input} value={values.kvk} onChange={(e) => set("kvk", e.target.value)} placeholder="12345678" />
          </Field>
          <Field label="BTW-nummer">
            <input className={input} value={values.vat_number} onChange={(e) => set("vat_number", e.target.value)} placeholder="NL123456789B01" />
          </Field>
          <Field label="IBAN" className="sm:col-span-2">
            <input className={input} value={values.iban} onChange={(e) => set("iban", e.target.value)} placeholder="NL00 RABO 0000 0000 00" />
          </Field>
        </div>
      </section>

      {/* BOEKHOUDING */}
      <section className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-[#101536]">Boekhouding</h2>
        <Field label="E-mail boekhouder">
          <input
            className={input}
            type="email"
            value={values.boekhouder_email}
            onChange={(e) => set("boekhouder_email", e.target.value)}
            placeholder="boekhouder@kantoor.nl"
          />
        </Field>
        <p className="mt-2 text-xs text-[#606774]">Kwartaalexports worden automatisch naar dit adres gestuurd.</p>
      </section>

      {/* LOGO */}
      <section className="rounded-2xl border border-[#101536]/08 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-[#101536]">Bedrijfslogo</h2>
        <p className="mb-4 text-xs text-[#606774]">Wordt links bovenaan facturen en offertes geplaatst. PNG of SVG aanbevolen, max 2 MB.</p>
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <div className="relative h-16 w-40 overflow-hidden rounded-xl border border-[#101536]/10 bg-[#F8F9FB] p-2">
              <Image src={logoUrl} alt="Bedrijfslogo" fill className="object-contain" unoptimized />
            </div>
          ) : (
            <div className="flex h-16 w-40 items-center justify-center rounded-xl border border-dashed border-[#101536]/20 bg-[#F8F9FB] text-xs text-[#606774]">
              Geen logo
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl border border-[#101536]/10 bg-white px-4 py-2 text-sm font-medium text-[#606774] shadow-sm transition hover:border-[#4D7EBA]/30 hover:text-[#4D7EBA] disabled:opacity-50"
            >
              {uploading ? "Uploaden…" : "Logo uploaden"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
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

const input =
  "w-full rounded-xl border border-[#101536]/10 bg-[#F8F9FB] px-3 py-2 text-sm text-[#101536] placeholder:text-[#606774]/50 focus:border-[#4D7EBA]/40 focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10 transition";

function Field({ label, children, className, required }: { label: string; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-[#606774]">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
