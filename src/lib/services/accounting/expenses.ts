import { createClient, createServiceClient } from "@/lib/supabase/server";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export type ExpenseType =
  | "fuel" | "maintenance" | "tools" | "supplies"
  | "parking" | "toll" | "travel" | "equipment"
  | "subscription" | "other";

export type ExpenseStatus = "draft" | "approved" | "exported";

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, { label: string; icon: string }> = {
  fuel:         { label: "Brandstof",    icon: "⛽" },
  maintenance:  { label: "Onderhoud",    icon: "🔧" },
  tools:        { label: "Gereedschap",  icon: "🛠" },
  supplies:     { label: "Materiaal",    icon: "📦" },
  parking:      { label: "Parkeren",     icon: "🅿️" },
  toll:         { label: "Tol",          icon: "🛣" },
  travel:       { label: "Reiskosten",   icon: "🚗" },
  equipment:    { label: "Apparatuur",   icon: "🎥" },
  subscription: { label: "Abonnement",   icon: "💳" },
  other:        { label: "Overig",       icon: "📄" },
};

export interface Expense {
  id: string;
  type: ExpenseType;
  status: ExpenseStatus;
  receipt_id: string | null;
  vehicle_id: string | null;
  appointment_id: string | null;
  employee_id: string | null;
  business_unit_id: string | null;
  supplier: string | null;
  description: string | null;
  date: string;
  amount_excl_vat: number;
  vat_amount: number;
  amount_incl_vat: number;
  year: number;
  quarter: number;
  created_at: string;
  vehicle?: { name: string; license_plate: string } | null;
  employee?: { first_name: string | null; last_name: string | null } | null;
  business_unit?: { name: string; icon: string | null; primary_color: string } | null;
}

export interface VehicleCostSummary {
  vehicle_id: string;
  name: string;
  license_plate: string;
  year: number | null;
  quarter: number | null;
  total_costs: number;
  fuel_costs: number;
  maintenance_costs: number;
  total_km: number;
  cost_per_km: number | null;
}

export interface ClientProfitability {
  client_id: string;
  contact_name: string;
  company_name: string | null;
  year: number;
  revenue: number;
  total_costs: number;
  material_costs: number;
  travel_costs: number;
  gross_profit: number;
  appointment_count: number;
}

export interface BusinessHealth {
  month: string;
  total_costs: number;
  fuel_costs: number;
  maintenance_costs: number;
  material_costs: number;
  travel_costs: number;
  expense_count: number;
}

export async function getExpenses(opts: {
  year?: number;
  quarter?: number;
  vehicleId?: string;
  employeeId?: string;
  type?: ExpenseType;
  status?: ExpenseStatus;
}): Promise<Expense[]> {
  const supabase = await createClient();
  let q = supabase
    .from("expenses")
    .select(`
      *,
      vehicle:vehicles(name, license_plate),
      employee:profiles!employee_id(first_name, last_name),
      business_unit:business_units(name, icon, primary_color)
    `)
    .eq("company_id", COMPANY_ID)
    .order("date", { ascending: false });

  if (opts.year) q = q.eq("year", opts.year);
  if (opts.quarter) q = q.eq("quarter", opts.quarter);
  if (opts.vehicleId) q = q.eq("vehicle_id", opts.vehicleId);
  if (opts.employeeId) q = q.eq("employee_id", opts.employeeId);
  if (opts.type) q = q.eq("type", opts.type);
  if (opts.status) q = q.eq("status", opts.status);

  const { data } = await q.limit(500);
  return (data ?? []) as unknown as Expense[];
}

export async function createExpense(input: {
  type: ExpenseType;
  vehicleId?: string;
  appointmentId?: string;
  businessUnitId?: string;
  supplier?: string;
  description?: string;
  date: string;
  amountExclVat: number;
  vatAmount: number;
  amountInclVat: number;
  employeeId: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      company_id: COMPANY_ID,
      type: input.type,
      vehicle_id: input.vehicleId ?? null,
      appointment_id: input.appointmentId ?? null,
      business_unit_id: input.businessUnitId ?? null,
      employee_id: input.employeeId,
      supplier: input.supplier ?? null,
      description: input.description ?? null,
      date: input.date,
      amount_excl_vat: input.amountExclVat,
      vat_amount: input.vatAmount,
      amount_incl_vat: input.amountInclVat,
      created_by: input.employeeId,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id, error: null };
}

export async function approveExpense(id: string, approverId: string): Promise<{ error: string | null }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("expenses")
    .update({ status: "approved", approved_by: approverId, approved_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function getVehicleCosts(vehicleId: string, year: number): Promise<VehicleCostSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_vehicle_costs")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("year", year);
  return (data ?? []) as VehicleCostSummary[];
}

export async function getClientProfitability(year: number): Promise<ClientProfitability[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_client_profitability")
    .select("*")
    .eq("company_id", COMPANY_ID)
    .eq("year", year)
    .order("revenue", { ascending: false })
    .limit(50);
  return (data ?? []) as ClientProfitability[];
}

export async function getBusinessHealth(months = 6): Promise<BusinessHealth[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const { data } = await supabase
    .from("v_business_health")
    .select("*")
    .eq("company_id", COMPANY_ID)
    .gte("month", since.toISOString().split("T")[0])
    .order("month", { ascending: true });
  return (data ?? []) as BusinessHealth[];
}

export async function getExpenseStats(year: number, quarter?: number) {
  const expenses = await getExpenses({ year, quarter });
  const total = expenses.reduce((s, e) => s + Number(e.amount_incl_vat), 0);
  const byType = Object.keys(EXPENSE_TYPE_LABEL).reduce((acc, t) => {
    acc[t as ExpenseType] = expenses
      .filter((e) => e.type === t)
      .reduce((s, e) => s + Number(e.amount_incl_vat), 0);
    return acc;
  }, {} as Record<ExpenseType, number>);
  const pendingApproval = expenses.filter((e) => e.status === "draft").length;
  return { total, byType, pendingApproval, count: expenses.length };
}
