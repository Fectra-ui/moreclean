import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExpenses, EXPENSE_TYPE_LABEL } from "@/lib/services/accounting/expenses";

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

  const expenses = await getExpenses({ year, quarter });

  const header = [
    "Datum", "Type", "Leverancier", "Omschrijving",
    "Voertuig", "Medewerker", "Bedrijfsunit",
    "Excl. BTW", "BTW", "Incl. BTW", "Status",
  ].join(";");

  const rows = expenses.map((e) => {
    const meta = EXPENSE_TYPE_LABEL[e.type];
    const veh = e.vehicle as { name: string } | null;
    const emp = e.employee as { first_name: string | null; last_name: string | null } | null;
    const bu = e.business_unit as { name: string } | null;
    return [
      new Date(e.date).toLocaleDateString("nl-NL"),
      meta.label,
      e.supplier ?? "",
      e.description ?? "",
      veh?.name ?? "",
      emp ? [emp.first_name, emp.last_name].filter(Boolean).join(" ") : "",
      bu?.name ?? "",
      Number(e.amount_excl_vat).toFixed(2),
      Number(e.vat_amount).toFixed(2),
      Number(e.amount_incl_vat).toFixed(2),
      e.status,
    ].join(";");
  });

  const label = quarter ? `Q${quarter}-${year}` : `${year}`;
  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${label}_Kosten.csv"`,
    },
  });
}
