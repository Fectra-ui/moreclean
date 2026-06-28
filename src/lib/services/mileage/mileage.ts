import { createClient, createServiceClient } from "@/lib/supabase/server";
export type { Vehicle } from "./vehicles";
import type { Vehicle } from "./vehicles";
import { getVehicles as _getVehicles } from "./vehicles";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";
const RATE_PER_KM = 0.23; // fiscaal 2026

export interface MileageLog {
  id: string;
  appointment_id: string | null;
  employee_id: string;
  vehicle_id: string | null;
  date: string;
  start_odometer: number;
  end_odometer: number;
  km: number;
  route: string | null;
  travel_time_min: number | null;
  start_location: string | null;
  end_location: string | null;
  departed_at: string | null;
  arrived_at: string | null;
  notes: string | null;
  approved: boolean;
  created_at: string;
  vehicle?: Pick<Vehicle, "name" | "license_plate"> | null;
  employee?: { first_name: string | null; last_name: string | null } | null;
  appointment?: { scheduled_date: string; clients: { contact_name: string; company_name: string | null } | null } | null;
}

export interface MileageInput {
  appointmentId?: string;
  vehicleId?: string;
  date: string;
  startOdometer: number;
  endOdometer: number;
  route?: string;
  travelTimeMin?: number;
  startLocation?: string;
  endLocation?: string;
  departedAt?: string;
  arrivedAt?: string;
  notes?: string;
}

export interface EmployeeDaySummary {
  date: string;
  totalKm: number;
  totalTravelMin: number;
  totalWorkMin: number;
  appointmentCount: number;
  trips: MileageLog[];
}

export async function getVehicles() { return _getVehicles(); }

export async function logMileage(input: MileageInput, employeeId: string): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mileage_logs")
    .insert({
      company_id: COMPANY_ID,
      employee_id: employeeId,
      appointment_id: input.appointmentId ?? null,
      vehicle_id: input.vehicleId ?? null,
      date: input.date,
      start_odometer: input.startOdometer,
      end_odometer: input.endOdometer,
      route: input.route ?? null,
      travel_time_min: input.travelTimeMin ?? null,
      start_location: input.startLocation ?? null,
      end_location: input.endLocation ?? null,
      departed_at: input.departedAt ?? null,
      arrived_at: input.arrivedAt ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id, error: null };
}

export async function getMileageLogs(opts: {
  year?: number;
  month?: number;
  quarter?: number;
  employeeId?: string;
  appointmentId?: string;
}): Promise<MileageLog[]> {
  const supabase = await createClient();
  let q = supabase
    .from("mileage_logs")
    .select(`
      *,
      vehicle:vehicles(name, license_plate),
      employee:profiles!employee_id(first_name, last_name),
      appointment:appointments(scheduled_date, clients(contact_name, company_name))
    `)
    .eq("company_id", COMPANY_ID)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts.employeeId) q = q.eq("employee_id", opts.employeeId);
  if (opts.appointmentId) q = q.eq("appointment_id", opts.appointmentId);

  if (opts.year) {
    const year = opts.year;
    if (opts.quarter) {
      const startMonth = (opts.quarter - 1) * 3 + 1;
      const endMonth = opts.quarter * 3;
      q = q
        .gte("date", `${year}-${String(startMonth).padStart(2, "0")}-01`)
        .lte("date", `${year}-${String(endMonth).padStart(2, "0")}-31`);
    } else if (opts.month) {
      const m = String(opts.month).padStart(2, "0");
      const nextMonth = opts.month === 12 ? `${year + 1}-01` : `${year}-${String(opts.month + 1).padStart(2, "0")}`;
      q = q.gte("date", `${year}-${m}-01`).lt("date", `${nextMonth}-01`);
    } else {
      q = q.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
    }
  }

  const { data } = await q.limit(1000);
  return (data ?? []) as unknown as MileageLog[];
}

export async function getEmployeeDaySummary(employeeId: string, date: string): Promise<EmployeeDaySummary> {
  const trips = await getMileageLogs({ employeeId, year: new Date(date).getFullYear() });
  const dayTrips = trips.filter((t) => t.date === date);

  return {
    date,
    totalKm: dayTrips.reduce((s, t) => s + Number(t.km), 0),
    totalTravelMin: dayTrips.reduce((s, t) => s + (t.travel_time_min ?? 0), 0),
    totalWorkMin: 0,
    appointmentCount: new Set(dayTrips.map((t) => t.appointment_id).filter(Boolean)).size,
    trips: dayTrips,
  };
}

export async function approveMileage(id: string, approverId: string): Promise<{ error: string | null }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("mileage_logs")
    .update({ approved: true, approved_by: approverId, approved_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function getMileageStats(year: number, quarter?: number) {
  const logs = await getMileageLogs({ year, quarter });
  const totalKm = logs.reduce((s, l) => s + Number(l.km), 0);
  const totalTravelMin = logs.reduce((s, l) => s + (l.travel_time_min ?? 0), 0);
  const uniqueEmployees = new Set(logs.map((l) => l.employee_id)).size;
  const pendingApproval = logs.filter((l) => !l.approved).length;
  const totalAllowance = totalKm * RATE_PER_KM;

  return {
    totalKm,
    totalTravelMin,
    uniqueEmployees,
    pendingApproval,
    totalAllowance,
    tripCount: logs.length,
  };
}
