import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getAppointmentFull } from "@/lib/services/planning/execution";
import { getVehicles } from "@/lib/services/mileage/mileage";
import ExecutionView from "./ExecutionView";

export const metadata: Metadata = { title: "Opdracht uitvoeren" };

export default async function OpdrachtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "employee"].includes(profile.role)) redirect("/klant");

  const [appointment, vehicles] = await Promise.all([
    getAppointmentFull(id),
    getVehicles(),
  ]);
  if (!appointment) notFound();

  return <ExecutionView appointment={appointment} userId={user.id} vehicles={vehicles} />;
}
