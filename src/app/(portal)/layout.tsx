import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/auth/requireAdmin";
import PortalNav from "@/components/portal/PortalNav";
import PortalHeader from "@/components/portal/PortalHeader";
import { getUnreadCount } from "@/lib/services/notifications";
import type { UserRole } from "@/types/database";

export const metadata: Metadata = {
  title: { template: "%s | More Clean Portal", default: "More Clean Portal" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const unreadCount = await getUnreadCount(profile.id);

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
