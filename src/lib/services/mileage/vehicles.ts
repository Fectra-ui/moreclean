import { createClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";

export type VehicleStatus = "active" | "maintenance" | "inactive";

export interface Vehicle {
  id: string;
  name: string;
  license_plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  fuel_type: string;
  status: VehicleStatus;
  current_odometer: number;
  purchase_date: string | null;
  next_service_km: number | null;
  next_service_date: string | null;
  apk_expiry: string | null;
  insurance_expiry: string | null;
  notes: string | null;
}

export interface VehicleStats extends Vehicle {
  vehicle_id: string;
  today_km: number;
  today_trips: number;
  quarter_km: number;
  quarter_costs: number;
}

export interface VehicleAssignment {
  id: string;
  employee_id: string;
  vehicle_id: string;
  date: string;
  employee?: { first_name: string | null; last_name: string | null } | null;
  vehicle?: Pick<Vehicle, "name" | "license_plate"> | null;
}

export async function getVehicles(includeInactive = false): Promise<Vehicle[]> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  let q = supabase
    .from("vehicles")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (!includeInactive) q = q.neq("status", "inactive");
  const { data } = await q;
  return (data ?? []) as Vehicle[];
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();
  return data as Vehicle | null;
}

export async function getVehicleStats(): Promise<VehicleStats[]> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_vehicle_stats")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  return (data ?? []) as VehicleStats[];
}

export async function getVehicleDetail(vehicleId: string) {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  const [vehicleRes, logsRes, receiptsRes] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", vehicleId).single(),
    supabase
      .from("mileage_logs")
      .select("*, employee:profiles!employee_id(first_name, last_name), appointment:appointments(scheduled_date, clients(contact_name, company_name))")
      .eq("vehicle_id", vehicleId)
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .limit(50),
    supabase
      .from("receipts")
      .select("*, uploader:profiles!uploaded_by(first_name, last_name)")
      .eq("vehicle_id", vehicleId)
      .eq("company_id", companyId)
      .order("receipt_date", { ascending: false })
      .limit(50),
  ]);
  return {
    vehicle: vehicleRes.data as Vehicle | null,
    logs: logsRes.data ?? [],
    receipts: receiptsRes.data ?? [],
  };
}

// ---- Toewijzingen ----

export async function getAssignmentsForDate(date: string): Promise<VehicleAssignment[]> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_vehicle_assignments")
    .select("*, employee:profiles!employee_id(first_name, last_name), vehicle:vehicles(name, license_plate)")
    .eq("company_id", companyId)
    .eq("date", date);
  return (data ?? []) as unknown as VehicleAssignment[];
}

export async function getEmployeeVehicleForDate(employeeId: string, date: string): Promise<Vehicle | null> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_vehicle_assignments")
    .select("vehicle:vehicles(*)")
    .eq("employee_id", employeeId)
    .eq("date", date)
    .eq("company_id", companyId)
    .single();
  if (!data) return null;
  return (data as unknown as { vehicle: Vehicle }).vehicle;
}

export async function upsertAssignment(employeeId: string, vehicleId: string, date: string): Promise<{ error: string | null }> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_vehicle_assignments")
    .upsert({
      company_id: companyId,
      employee_id: employeeId,
      vehicle_id: vehicleId,
      date,
    }, { onConflict: "employee_id,date" });
  return { error: error?.message ?? null };
}

export async function deleteAssignment(employeeId: string, date: string): Promise<{ error: string | null }> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_vehicle_assignments")
    .delete()
    .eq("employee_id", employeeId)
    .eq("date", date)
    .eq("company_id", companyId);
  return { error: error?.message ?? null };
}

// ---- Onderhoudswaarschuwingen ----

export interface MaintenanceAlert {
  vehicleId: string;
  vehicleName: string;
  type: "service_km" | "service_date" | "apk" | "insurance";
  message: string;
  urgency: "critical" | "warning" | "info";
}

export function computeAlerts(vehicles: Vehicle[]): MaintenanceAlert[] {
  const alerts: MaintenanceAlert[] = [];
  const today = new Date();

  for (const v of vehicles) {
    if (v.status === "inactive") continue;

    // Kilometeronderhoud
    if (v.next_service_km != null) {
      const remaining = v.next_service_km - v.current_odometer;
      if (remaining <= 0) {
        alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "service_km", message: `Onderhoud overschreden met ${Math.abs(remaining).toLocaleString("nl-NL")} km`, urgency: "critical" });
      } else if (remaining <= 500) {
        alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "service_km", message: `Onderhoud over ${remaining.toLocaleString("nl-NL")} km`, urgency: "critical" });
      } else if (remaining <= 1500) {
        alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "service_km", message: `Onderhoud over ${remaining.toLocaleString("nl-NL")} km`, urgency: "warning" });
      }
    }

    // Datumonderhoud
    if (v.next_service_date) {
      const days = Math.ceil((new Date(v.next_service_date).getTime() - today.getTime()) / 86400000);
      if (days <= 0) alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "service_date", message: `Servicebeurt verlopen`, urgency: "critical" });
      else if (days <= 14) alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "service_date", message: `Servicebeurt over ${days} dag${days === 1 ? "" : "en"}`, urgency: "warning" });
      else if (days <= 30) alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "service_date", message: `Servicebeurt over ${days} dagen`, urgency: "info" });
    }

    // APK
    if (v.apk_expiry) {
      const days = Math.ceil((new Date(v.apk_expiry).getTime() - today.getTime()) / 86400000);
      if (days <= 0) alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "apk", message: `APK verlopen`, urgency: "critical" });
      else if (days <= 30) alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "apk", message: `APK over ${days} dag${days === 1 ? "" : "en"}`, urgency: days <= 7 ? "critical" : "warning" });
    }

    // Verzekering
    if (v.insurance_expiry) {
      const days = Math.ceil((new Date(v.insurance_expiry).getTime() - today.getTime()) / 86400000);
      if (days <= 0) alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "insurance", message: `Verzekering verlopen`, urgency: "critical" });
      else if (days <= 30) alerts.push({ vehicleId: v.id, vehicleName: v.name, type: "insurance", message: `Verzekering over ${days} dag${days === 1 ? "" : "en"}`, urgency: "warning" });
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.urgency] - order[b.urgency];
  });
}
