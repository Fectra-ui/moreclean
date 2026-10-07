import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uitnodiging bevestigen | More Clean",
  robots: { index: false, follow: false },
};

export default async function ConfirmInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F5F7] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-10 shadow-[0_20px_60px_rgba(16,21,54,.08)]">
        <h1 className="text-2xl font-bold text-[#101536]">Uitnodiging bevestigen</h1>
        <p className="mt-2 text-sm text-[#606774]">
          Vul uw e-mailadres en de eenmalige code uit de uitnodigingsmail in.
        </p>
        {error && (
          <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === "retry"
              ? "De bevestiging is nog niet afgerond. Probeer hieronder de koppeling opnieuw af te ronden."
              : "De uitnodiging kon niet worden bevestigd. Controleer uw code of vraag een nieuwe uitnodiging aan."}
          </p>
        )}
        <form action="/auth/confirm" method="post" className="mt-6 space-y-4">
          <label className="block text-sm text-[#101536]" htmlFor="invite-email">E-mailadres</label>
          <input id="invite-email" name="email" type="email" required autoComplete="email"
            className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-[#101536]" />
          <label className="block text-sm text-[#101536]" htmlFor="invite-code">Eenmalige code</label>
          <input id="invite-code" name="code" type="text" inputMode="numeric" pattern="[0-9]{6,10}"
            minLength={6} maxLength={10} required autoComplete="one-time-code"
            className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3 text-[#101536]" />
          <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA] py-3.5 text-sm font-semibold text-white shadow-md">
            Uitnodiging bevestigen
          </button>
        </form>
        <form action="/auth/confirm" method="post" className="mt-5">
          <input type="hidden" name="resume" value="1" />
          <button type="submit" className="text-sm text-[#4D7EBA] underline">
            Code al bevestigd? Rond de koppeling af
          </button>
        </form>
      </div>
    </div>
  );
}
