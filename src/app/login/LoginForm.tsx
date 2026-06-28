"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Configuratiefout: neem contact op met de beheerder.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mailadres of wachtwoord onjuist.");
      setLoading(false);
      return;
    }

    // Fetch role to redirect to correct portal
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role;
    const destination = redirect
      || (role === "admin" ? "/admin" : role === "employee" ? "/medewerker" : "/klant");

    router.push(destination);
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Vul eerst uw e-mailadres in.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    setError(null);
    setInfo("Reset-link verstuurd! Controleer uw e-mail.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* EMAIL */}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#101536]">
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="uw@email.nl"
          className="
            w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3
            text-[#101536] placeholder-[#606774]/50 outline-none
            transition focus:border-[#4D7EBA]/50 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/15
          "
        />
      </div>

      {/* PASSWORD */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-[#101536]">
            Wachtwoord
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-[#4D7EBA] hover:underline"
          >
            Vergeten?
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="
              w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 pr-12
              text-[#101536] placeholder-[#606774]/50 outline-none
              transition focus:border-[#4D7EBA]/50 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/15
            "
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#606774] transition hover:text-[#101536]"
            aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* FEEDBACK */}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</p>
      )}
      {info && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-100">{info}</p>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className="
          flex w-full items-center justify-center gap-2 rounded-2xl
          bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA]
          py-3.5 text-sm font-semibold text-white
          shadow-[0_15px_40px_rgba(77,126,186,.25)]
          transition hover:shadow-[0_20px_50px_rgba(77,126,186,.35)] hover:-translate-y-0.5
          disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0
        "
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Inloggen..." : "Inloggen"}
      </button>
    </form>
  );
}
