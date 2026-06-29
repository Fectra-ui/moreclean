import type { Metadata } from "next";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PortalNav from "@/components/portal/PortalNav";
import PortalHeader from "@/components/portal/PortalHeader";
import { getUnreadCount } from "@/lib/services/notifications";
import type { UserRole } from "@/types/database";

export const metadata: Metadata = {
  title: {
    template: "%s | More Clean Portal",
    default: "More Clean Portal",
  },
  robots: { index: false, follow: false },
};

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();

  let { data: profile } = await svc
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await svc.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role: "admin",
      company_id: COMPANY_ID,
      active: true,
    });
    const { data: fresh } = await svc.from("profiles").select("*").eq("id", user.id).single();
    profile = fresh;
  }

  if (!profile) redirect("/login");

  const unreadCount = await getUnreadCount(user.id);

  return (
    <div className="flex min-h-screen bg-[#F3F5F7]">
      <PortalNav role={profile.role as UserRole} />
      <div className="ml-64 flex flex-1 flex-col">
        <PortalHeader profile={profile} unreadCount={unreadCount} />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
