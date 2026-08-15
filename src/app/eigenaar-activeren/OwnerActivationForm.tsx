"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

export default function OwnerActivationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/activate-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Activeren is niet gelukt.");
    setDone(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F5F7] px-4 py-10 sm:px-6">
      <div className="w-full max-w-lg rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_20px_70px_rgba(16,21,54,.10)] sm:p-10">
        <Link href="/" className="inline-flex"><Image src="/images/logo.png" alt="More Clean" width={100} height={40} /></Link>
        {done ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
            <h1 className="mt-5 text-2xl font-bold text-[#101536]">Account is geactiveerd</h1>
            <p className="mt-3 text-sm text-[#606774]">De code is nu definitief gebruikt. U kunt direct inloggen als beheerder.</p>
            <Link href="/login" className="mt-7 inline-flex rounded-2xl bg-[#101536] px-6 py-3 font-semibold text-white">Naar inloggen</Link>
          </div>
        ) : (
          <>
            <h1 className="mt-7 text-3xl font-bold text-[#101536]">Eigenaaraccount activeren</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#606774]">Vul de eenmalige code in en kies uw eigen inloggegevens.</p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <Field label="Eenmalige activatiecode" name="code" autoComplete="one-time-code" placeholder="MC-XXXX-XXXX-XXXX-XXXX" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Voornaam" name="firstName" autoComplete="given-name" />
                <Field label="Achternaam" name="lastName" autoComplete="family-name" required={false} />
              </div>
              <Field label="E-mailadres" name="email" type="email" autoComplete="email" />
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#101536]">Wachtwoord</label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={12} maxLength={128} autoComplete="new-password" className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 pr-12 text-[#101536] outline-none focus:border-[#4D7EBA] focus:ring-2 focus:ring-[#4D7EBA]/15" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#606774]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <p className="mt-1.5 text-xs text-[#606774]">Minimaal 12 tekens.</p>
              </div>
              {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] py-3.5 font-semibold text-white disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={17} />}{loading ? "Account aanmaken..." : "Eigenaaraccount aanmaken"}</button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", autoComplete, placeholder, required = true }: { label: string; name: string; type?: string; autoComplete?: string; placeholder?: string; required?: boolean }) {
  return <div><label htmlFor={name} className="mb-1.5 block text-sm font-medium text-[#101536]">{label}</label><input id={name} name={name} type={type} required={required} maxLength={120} autoComplete={autoComplete} placeholder={placeholder} className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-[#101536] outline-none focus:border-[#4D7EBA] focus:ring-2 focus:ring-[#4D7EBA]/15" /></div>;
}
