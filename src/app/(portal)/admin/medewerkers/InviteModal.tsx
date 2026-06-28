"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";

export default function InviteModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setFeedback({ type: "err", msg: data.error ?? "Er ging iets mis." });
    } else {
      setFeedback({ type: "ok", msg: `Uitnodiging verstuurd naar ${email}` });
      setEmail("");
      setRole("employee");
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setFeedback(null); }}
        className="flex items-center gap-2 rounded-2xl bg-[#101536] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <UserPlus size={16} />
        Uitnodigen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#101536]">Gebruiker uitnodigen</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-1.5 text-[#606774] transition hover:bg-[#F3F5F7] hover:text-[#101536]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#101536]">
                  E-mailadres
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@email.nl"
                  className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-[#101536] placeholder-[#606774]/50 outline-none transition focus:border-[#4D7EBA]/50 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#101536]">
                  Rol
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["employee", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        role === r
                          ? "border-[#4D7EBA] bg-[#4D7EBA]/10 text-[#4D7EBA]"
                          : "border-[#101536]/10 bg-[#F3F5F7] text-[#606774] hover:border-[#4D7EBA]/30"
                      }`}
                    >
                      {r === "employee" ? "👷 Medewerker" : "🛠 Beheerder"}
                    </button>
                  ))}
                </div>
              </div>

              {feedback && (
                <p className={`rounded-xl border px-4 py-3 text-sm ${
                  feedback.type === "ok"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-red-100 bg-red-50 text-red-700"
                }`}>
                  {feedback.msg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA] py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Versturen..." : "Uitnodiging versturen"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
