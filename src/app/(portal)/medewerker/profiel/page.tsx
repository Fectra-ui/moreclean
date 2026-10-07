import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MedewerkerProfielForm from "./MedewerkerProfielForm";

export const metadata: Metadata = { title: "Mijn Profiel" };

export default async function MedewerkerProfielPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, phone, avatar_path, company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profile || !["employee", "admin"].includes((profile as { role: string }).role)) redirect("/klant");
  if (!profile.company_id) throw new Error("Medewerker is niet aan een bedrijf gekoppeld");

  const { data: mileageStats } = await supabase
    .from("mileage_logs")
    .select("km")
    .eq("employee_id", user.id)
    .gte("date", new Date().getFullYear() + "-01-01");

  const totalKm = (mileageStats ?? []).reduce((s, m) => s + (m.km ?? 0), 0);

  const { count: completedCount, error: completedCountError } = await supabase
    .from("appointments")
    .select("id, appointment_employees!inner(employee_id)", { count: "exact", head: true })
    .eq("appointment_employees.employee_id", user.id)
    .eq("company_id", profile.company_id)
    .eq("status", "completed");
  if (completedCountError) throw completedCountError;
  if (completedCount === null) throw new Error("Afgeronde opdrachten konden niet worden geteld");

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Mijn profiel</h1>
        <p className="mt-1 text-sm text-[#606774]">Persoonlijke gegevens en statistieken</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-[#4D7EBA]">{completedCount}</p>
          <p className="mt-1 text-xs text-[#606774]">Opdrachten afgerond</p>
        </div>
        <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-[#4D7EBA]">{totalKm.toLocaleString("nl-NL")}</p>
          <p className="mt-1 text-xs text-[#606774]">Kilometer dit jaar</p>
        </div>
      </div>

      <MedewerkerProfielForm
        profile={{ ...profile, role: (profile as { role: string }).role } as {
          id: string; first_name: string | null; last_name: string | null;
          role: string; phone: string | null; avatar_path: string | null;
        }}
        email={user.email ?? ""}
      />
    </div>
  );
}
