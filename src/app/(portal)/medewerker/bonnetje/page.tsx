import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BonnetjeForm from "./BonnetjeForm";
import { getVehicles } from "@/lib/services/mileage/vehicles";

export const metadata: Metadata = { title: "Bonnetje indienen" };

export default async function BonnetiePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "employee"].includes((profile as { role: string }).role)) {
    redirect("/klant");
  }

  // Haal actieve afspraken van deze medewerker op voor projectkoppeling
  const today = new Date().toISOString().split("T")[0];
  const { data: appointments } = await supabase
    .from("appointment_employees")
    .select("appointment_id, appointments(id, scheduled_date, clients(contact_name, company_name))")
    .eq("employee_id", user.id)
    .gte("appointments.scheduled_date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0])
    .lte("appointments.scheduled_date", today)
    .limit(20);

  const apptOptions = (appointments ?? [])
    .map((ae) => {
      const appt = (ae as unknown as { appointment_id: string; appointments: { id: string; scheduled_date: string; clients: { contact_name: string; company_name?: string | null } | null } | null }).appointments;
      if (!appt) return null;
      const clientName = appt.clients?.company_name ?? appt.clients?.contact_name ?? "Klant";
      return { id: appt.id, label: `${clientName} – ${new Date(appt.scheduled_date).toLocaleDateString("nl-NL")}` };
    })
    .filter(Boolean) as Array<{ id: string; label: string }>;

  const vehicles = await getVehicles();
  const vehicleOptions = vehicles.map((v) => ({ id: v.id, label: `${v.name} (${v.license_plate})` }));

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Bonnetje indienen</h1>
        <p className="mt-1 text-sm text-[#606774]">Maak een foto of upload een bestand. Vul de details aan.</p>
      </div>
      <BonnetjeForm appointments={apptOptions} vehicles={vehicleOptions} />
    </div>
  );
}
