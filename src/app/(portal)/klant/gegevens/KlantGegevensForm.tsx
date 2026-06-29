"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2, Eye, EyeOff } from "lucide-react";

interface Props {
  client: {
    id: string;
    client_type?: string | null;
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

const INP = "w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-sm text-[#101536] placeholder:text-[#606774]/50 focus:border-[#4D7EBA]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/10 transition";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#606774]">{children}</label>;
}

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
      {saved ? "Opgeslagen" : saving ? "Opslaan…" : "Opslaan"}
    </button>
  );
}

// ── Sectie 1: Persoonsgegevens ─────────────────────────────────────────────

function GegevensSection({ client }: { client: Props["client"] }) {
  const isCompany = client.client_type === "company";
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
    const { error: err } = await supabase.from("clients").update(values).eq("id", client.id);
    if (err) setError(err.message);
    else setSaved(true);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur-xl space-y-5">
      <h2 className="font-semibold text-[#101536]">{isCompany ? "Contactgegevens" : "Persoonlijke gegevens"}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={isCompany ? "" : "sm:col-span-2"}>
          <Label>{isCompany ? "Contactpersoon" : "Volledige naam"}</Label>
          <input className={INP} value={values.contact_name} onChange={(e) => set("contact_name", e.target.value)} required />
        </div>
        {isCompany && (
          <div>
            <Label>Bedrijfsnaam</Label>
            <input className={INP} value={values.company_name} onChange={(e) => set("company_name", e.target.value)} />
          </div>
        )}
        <div>
          <Label>Telefoonnummer</Label>
          <input className={INP} type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+31 6 12345678" />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Adres</Label>
        <input className={INP} value={values.address} onChange={(e) => set("address", e.target.value)} placeholder="Straat + huisnummer" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={INP} value={values.postal_code} onChange={(e) => set("postal_code", e.target.value)} placeholder="Postcode" />
          <input className={INP} value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Stad" />
        </div>
      </div>

      {isCompany && (
        <div>
          <Label>BTW-nummer</Label>
          <input className={INP} value={values.vat_number} onChange={(e) => set("vat_number", e.target.value)} placeholder="NL123456789B01" />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      <SaveButton saving={saving} saved={saved} />
    </form>
  );
}

// ── Sectie 2: Wachtwoord wijzigen ─────────────────────────────────────────

function WachtwoordSection() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirm) { setError("Wachtwoorden komen niet overeen"); return; }
    if (newPw.length < 8) { setError("Wachtwoord moet minimaal 8 tekens zijn"); return; }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError("Gebruiker niet gevonden"); setSaving(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInErr) { setError("Huidig wachtwoord is onjuist"); setSaving(false); return; }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    if (updateErr) setError(updateErr.message);
    else {
      setSaved(true);
      setCurrent(""); setNewPw(""); setConfirm("");
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function PwInput({ value, onChange, placeholder, show, onToggle }: {
    value: string; onChange: (v: string) => void; placeholder: string; show: boolean; onToggle: () => void;
  }) {
    return (
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${INP} pr-11`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606774] hover:text-[#101536]"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur-xl space-y-4">
      <h2 className="font-semibold text-[#101536]">Wachtwoord wijzigen</h2>

      <div>
        <Label>Huidig wachtwoord</Label>
        <PwInput value={current} onChange={setCurrent} placeholder="••••••••" show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
      </div>
      <div>
        <Label>Nieuw wachtwoord</Label>
        <PwInput value={newPw} onChange={setNewPw} placeholder="Minimaal 8 tekens" show={showNew} onToggle={() => setShowNew(!showNew)} />
      </div>
      <div>
        <Label>Bevestig nieuw wachtwoord</Label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Herhaal wachtwoord"
          className={INP}
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <SaveButton saving={saving} saved={saved} />
    </form>
  );
}

// ── Sectie 3: E-mailadres (readonly info) ─────────────────────────────────

function EmailSection({ email }: { email: string }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur-xl">
      <h2 className="mb-4 font-semibold text-[#101536]">Inloggegevens</h2>
      <div>
        <Label>E-mailadres</Label>
        <p className="rounded-2xl border border-[#101536]/08 bg-[#F3F5F7] px-4 py-3 text-sm text-[#606774]">{email}</p>
        <p className="mt-1.5 text-xs text-[#606774]">Neem contact op met More Clean om uw e-mailadres te wijzigen.</p>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────

export default function KlantGegevensForm({ client, email }: Props) {
  return (
    <div className="space-y-5">
      <GegevensSection client={client} />
      <WachtwoordSection />
      <EmailSection email={email} />
    </div>
  );
}
