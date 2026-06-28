import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCalendarAppointments, getEmployees } from "@/lib/services/planning/appointments";
import PlanningCalendar from "./PlanningCalendar";

export const metadata: Metadata = { title: "Planning" };

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; view?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { from, view = "week" } = await searchParams;

  // Default: current week Monday
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const startDate = from ?? monday.toISOString().slice(0, 10);

  // For month view we need 6 weeks; for week 7 days; for day 1 day
  const start = new Date(startDate);
  let end: Date;
  if (view === "month") {
    end = new Date(start);
    end.setDate(start.getDate() + 41); // 6 weeks
  } else if (view === "dag") {
    end = new Date(start);
  } else {
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  }

  const [appointments, employees] = await Promise.all([
    getCalendarAppointments(COMPANY_ID, startDate, end.toISOString().slice(0, 10)),
    getEmployees(COMPANY_ID),
  ]);

  // Clients list for new appointment modal
  const { data: clients } = await supabase
    .from("clients")
    .select("id, contact_name, company_name, address, city")
    .eq("company_id", COMPANY_ID)
    .eq("active", true)
    .order("contact_name")
    .limit(200);

  return (
    <PlanningCalendar
      initialAppointments={appointments}
      employees={employees}
      clients={clients ?? []}
      startDate={startDate}
      view={view as "dag" | "week" | "maand" | "medewerker"}
    />
  );
}
