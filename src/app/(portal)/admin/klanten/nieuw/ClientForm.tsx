"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const FALLBACK_COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export default function ClientForm({ defaultValues, companyId }: { defaultValues?: Record<string, string>; companyId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientType, setClientType] = useState<"company" | "private">(
    defaultValues?.client_type === "private" ? "private" : "company"
  );
  const isCompany = clientType === "company";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Niet ingelogd."); setLoading(false); return; }

    const payload = {
      company_id: companyId ?? FALLBACK_COMPANY_ID,
      client_type: clientType,
      is_company: isCompany,
      company_name: fd.get("company_name") as string || null,
      contact_name: fd.get("contact_name") as string,
      email: fd.get("email") as string || null,
      phone: fd.get("phone") as string || null,
      phone_secondary: fd.get("phone_secondary") as string || null,
      address: fd.get("address") as string || null,
      postal_code: fd.get("postal_code") as string || null,
      city: fd.get("city") as string || null,
      vat_number: fd.get("vat_number") as string || null,
      payment_terms: parseInt(fd.get("payment_terms") as string) || 14,
      source: fd.get("source") as string || null,
      notes: fd.get("notes") as string || null,
      internal_notes: fd.get("internal_notes") as string || null,
      created_by: user.id,
    };

    const { data, error } = await supabase.from("clients").insert(payload).select("id").single();

    if (error) { setError("Er is een fout opgetreden: " + error.message); setLoading(false); return; }
    router.push(`/admin/klanten/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* TYPE */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#101536]">Type klant</label>
        <div className="flex gap-2 rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] p-1">
          {[
            { label: "Particulier", value: "private" as const },
            { label: "Bedrijf", value: "company" as const },
          ].map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => setClientType(value)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                clientType === value ? "bg-white shadow-sm text-[#101536]" : "text-[#606774]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isCompany && (
        <Field label="Bedrijfsnaam" name="company_name" required />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={isCompany ? "Contactpersoon" : "Volledige naam"} name="contact_name" required />
        <Field label="E-mailadres" name="email" type="email" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Telefoonnummer" name="phone" type="tel" />
        <Field label="Telefoonnummer 2" name="phone_secondary" type="tel" />
      </div>

      <fieldset className="rounded-2xl border border-[#101536]/08 p-4">
        <legend className="px-1 text-sm font-semibold text-[#101536]">Adres</legend>
        <div className="mt-3 space-y-4">
          <Field label="Straat + huisnummer" name="address" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Postcode" name="postal_code" />
            <Field label="Stad" name="city" />
          </div>
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        {isCompany && <Field label="BTW-nummer" name="vat_number" placeholder="NL123456789B01" />}
        <Field label="Betalingstermijn (dagen)" name="payment_terms" type="number" defaultValue="14" />
        <Field
          label="Hoe klant gevonden"
          name="source"
          as="select"
          options={["Website", "Google", "Referentie", "Direct contact", "Flyer", "Anders"]}
        />
      </div>

      <Field label="Notities (zichtbaar voor klant)" name="notes" as="textarea" rows={3} />
      <Field label="Interne notities (alleen voor personeel)" name="internal_notes" as="textarea" rows={3} />

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-2xl border border-[#101536]/10 px-6 py-3 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Klant aanmaken
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
  as,
  rows,
  options,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  as?: "textarea" | "select";
  rows?: number;
  options?: string[];
}) {
  const base = "w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-sm text-[#101536] outline-none transition placeholder-[#606774]/50 focus:border-[#4D7EBA]/40 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/10";

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#101536]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea name={name} rows={rows ?? 3} placeholder={placeholder} defaultValue={defaultValue} className={`${base} resize-none`} />
      ) : as === "select" ? (
        <select name={name} defaultValue={defaultValue ?? ""} className={base}>
          <option value="">— Kies —</option>
          {options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} className={base} />
      )}
    </div>
  );
}
