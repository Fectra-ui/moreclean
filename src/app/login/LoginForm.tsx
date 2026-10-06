"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const loginInFlightRef = useRef(false);
  const resetInFlightRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetPending, setResetPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loginInFlightRef.current) return;
    loginInFlightRef.current = true;
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (redirectTo) formData.set("redirect", redirectTo);

    startTransition(async () => {
      try {
        const result = await loginAction(formData);
        if (result?.error) setError(result.error);
      } finally {
        loginInFlightRef.current = false;
      }
    });
  }

  async function handleForgotPassword() {
    if (resetInFlightRef.current) return;
    if (!email) {
      setError("Vul eerst uw e-mailadres in.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Vul een geldig e-mailadres in.");
      return;
    }
    resetInFlightRef.current = true;
    setResetPending(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setInfo("Als dit e-mailadres bekend is, ontvangt u een reset-link.");
    } catch {
      setError("De reset-link kon niet worden verstuurd. Probeer het later opnieuw.");
    } finally {
      resetInFlightRef.current = false;
      setResetPending(false);
    }
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
          name="email"
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
            disabled={resetPending}
            className="text-xs text-[#4D7EBA] hover:underline"
          >
            {resetPending ? "Versturen…" : "Vergeten?"}
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
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
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</p>
      )}
      {info && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-100">{info}</p>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isPending}
        className="
          flex w-full items-center justify-center gap-2 rounded-2xl
          bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA]
          py-3.5 text-sm font-semibold text-white
          shadow-[0_15px_40px_rgba(77,126,186,.25)]
          transition hover:shadow-[0_20px_50px_rgba(77,126,186,.35)] hover:-translate-y-0.5
          disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0
        "
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {isPending ? "Inloggen..." : "Inloggen"}
      </button>
    </form>
  );
}
