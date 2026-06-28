import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appointmentToIcs } from "@/lib/calendar/ics";

// GET /api/appointments/ics?id=[appointmentId]
// Stuurt een .ics bestand terug dat in elke agendaapp geopend kan worden.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appt } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_date,
      scheduled_start,
      scheduled_end,
      notes,
      clients(contact_name, company_name, address, city)
    `)
    .eq("id", id)
    .single();

  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = (appt.clients as unknown) as {
    contact_name: string;
    company_name?: string | null;
    address?: string | null;
    city?: string | null;
  } | null;

  const clientName = client?.company_name ?? client?.contact_name ?? "Klant";
  const address = client?.address && client?.city
    ? `${client.address}, ${client.city}`
    : client?.address ?? null;

  const ics = appointmentToIcs({
    id: (appt as { id: string }).id,
    clientName,
    scheduledDate: (appt as { scheduled_date: string }).scheduled_date,
    scheduledStart: (appt as { scheduled_start: string | null }).scheduled_start,
    scheduledEnd: (appt as { scheduled_end: string | null }).scheduled_end,
    address,
    notes: (appt as { notes?: string | null }).notes,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="afspraak-${id.slice(0, 8)}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
