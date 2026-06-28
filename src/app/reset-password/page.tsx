"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function ResetForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Supabase puts the token in the URL hash; the client handles it automatically
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Er ging iets mis. Probeer opnieuw of vraag een nieuwe link aan.");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-10 shadow-[0_20px_60px_rgba(16,21,54,.08)]">
        <h1 className="text-2xl font-bold text-[#101536]">Nieuw wachtwoord instellen</h1>
        <p className="mt-2 text-sm text-[#606774]">Kies een sterk wachtwoord voor uw account.</p>

        {done ? (
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
