"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<"checking" | "ready" | "invalid" | "unavailable">("checking");
  const submitInFlight = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function checkSession() {
      try {
        // getSession waits for Supabase to process a PKCE redirect before reading the session.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!active) return;

        // An unprocessed callback must not fall back to another signed-in account.
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const callbackFailed = query.has("code") || query.has("error") || query.has("error_code") ||
          hash.has("access_token") || hash.has("error") || hash.has("error_code");
        if (sessionError || !session || callbackFailed) {
          setSessionStatus("invalid");
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!active) return;
        setSessionStatus(userError ? "unavailable" : !user || user.id !== session.user.id ? "invalid" : "ready");
      } catch {
        if (active) setSessionStatus("unavailable");
      }
    }

    void checkSession();
    return () => { active = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitInFlight.current || sessionStatus !== "ready" || done) return;
    submitInFlight.current = true;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setSessionStatus("invalid");
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setSessionStatus("unavailable");
        return;
      }
      if (!user || user.id !== session.user.id) {
        setSessionStatus("invalid");
        return;
      }

      const { data, error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError || !data.user) {
        setError("Het wachtwoord kon niet worden opgeslagen. Probeer opnieuw of vraag een nieuwe link aan.");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Het wachtwoord kon niet worden opgeslagen. Controleer uw verbinding en probeer opnieuw.");
    } finally {
      submitInFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-10 shadow-[0_20px_60px_rgba(16,21,54,.08)]">
        <h1 className="text-2xl font-bold text-[#101536]">Nieuw wachtwoord instellen</h1>
        <p className="mt-2 text-sm text-[#606774]">Kies een sterk wachtwoord voor uw account.</p>

        {sessionStatus === "checking" ? (
          <p className="mt-6 text-sm text-[#606774]">Herstellink controleren...</p>
        ) : sessionStatus === "invalid" ? (
          <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Deze herstellink is ongeldig of verlopen. Vraag een nieuwe link aan via de inlogpagina.
          </p>
        ) : sessionStatus === "unavailable" ? (
          <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            De herstelsessie kon niet worden gecontroleerd. Controleer uw verbinding en laad de pagina opnieuw.
          </p>
        ) : done ? (
          <p className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
            Wachtwoord opgeslagen! U wordt doorgestuurd...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nieuw wachtwoord (min. 8 tekens)"
              className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-[#101536] outline-none transition focus:border-[#4D7EBA]/50 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/15"
            />
            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA] py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Opslaan..." : "Wachtwoord opslaan"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
