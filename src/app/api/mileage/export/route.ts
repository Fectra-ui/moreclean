import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMileageLogs } from "@/lib/services/mileage/mileage";

const RATE = 0.23;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = req.nextUrl;
  const year = url.searchParams.get("year") ? Number(url.searchParams.get("year")) : new Date().getFullYear();
  const quarter = url.searchParams.get("quarter") ? Number(url.searchParams.get("quarter")) : undefined;
  const month = url.searchParams.get("month") ? Number(url.searchParams.get("month")) : undefined;

  const logs = await getMileageLogs({ year, quarter, month });

  // Boekhouder-formaat: zelfde kolommen als in het kwartaaloverzicht
  const header = [
    "Datum",
    "Medewerker",
    "Bus",
    "Kenteken",
    "Route",
    "Begin km",
    "Eind km",
    "KM",
    "Reistijd (min)",
    "Klant",
    "Opdracht-ID",
    "Vergoeding (€)",
    "Goedgekeurd",
  ].join(";");

  const rows = logs.map((log) => {
    const emp = log.employee as { first_name: string | null; last_name: string | null } | null;
    const veh = log.vehicle as { name: string; license_plate: string } | null;
    const appt = log.appointment as { scheduled_date: string; clients: { contact_name: string; company_name: string | null } | null } | null;
    const clientName = appt?.clients?.company_name ?? appt?.clients?.contact_name ?? "";
    return [
      new Date(log.date).toLocaleDateString("nl-NL"),
      [emp?.first_name, emp?.last_name].filter(Boolean).join(" "),
      veh?.name ?? "",
      veh?.license_plate ?? "",
      log.route ?? "",
      log.start_odometer,
      log.end_odometer,
      Number(log.km),
      log.travel_time_min ?? "",
      clientName,
      log.appointment_id ?? "",
      (Number(log.km) * RATE).toFixed(2),
      log.approved ? "Ja" : "Nee",
    ].join(";");
  });

  const label = quarter ? `Q${quarter}-${year}` : month ? `${year}-${String(month).padStart(2, "0")}` : `${year}`;
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${label}_Kilometerregistratie.csv"`,
    },
  });
}
