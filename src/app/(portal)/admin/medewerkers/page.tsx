import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import InviteModal from "./InviteModal";

export const metadata: Metadata = { title: "Medewerkers" };

export default async function MedewerkersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") redirect("/klant");

  const { data: employees } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, created_at, role")
    .in("role", ["employee", "admin"])
    .order("last_name");

  // Per employee: appointments completed this month
  const monthStart = new Date().toISOString().slice(0, 7) + "-01";
  const { data: completions } = await supabase
    .from("appointments")
    .select("employee_ids")
    .eq("status", "completed")
    .gte("scheduled_date", monthStart);

  const countByEmployee: Record<string, number> = {};
  (completions ?? []).forEach((a) => {
    ((a.employee_ids as string[]) ?? []).forEach((eid) => {
      countByEmployee[eid] = (countByEmployee[eid] ?? 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101536]">Medewerkers</h1>
          <p className="mt-1 text-sm text-[#606774]">{employees?.length ?? 0} actieve medewerkers</p>
        </div>
        <InviteModal />
      </div>

      {!employees?.length ? (
        <div className="rounded-[24px] border border-white/60 bg-white/75 p-12 text-center backdrop-blur-xl">
          <Users size={32} className="mx-auto mb-3 text-[#95AEC1]" />
          <p className="text-sm text-[#606774]">Geen medewerkers gevonden</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => {
            const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Onbekend";
            const initials = [emp.first_name?.[0], emp.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
            const completed = countByEmployee[emp.id] ?? 0;
            return (
              <div key={emp.id} className="rounded-[20px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4D7EBA]/10 text-sm font-bold text-[#4D7EBA]">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[#101536]">{name}</p>
                    <span className={`text-xs font-medium ${emp.role === "admin" ? "text-violet-600" : "text-[#4D7EBA]"}`}>
                      {emp.role === "admin" ? "Beheerder" : "Medewerker"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {emp.phone && (
                    <p className="text-[#606774]">📞 {emp.phone}</p>
                  )}
                  <p className="text-[#606774]">
                    <span className="font-semibold text-[#101536]">{completed}</span> opdrachten afgerond deze maand
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
