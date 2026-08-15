import GlobalSearch from "@/components/portal/GlobalSearch";
import NotificationBell from "@/components/portal/NotificationBell";
import LogoutButton from "@/components/portal/LogoutButton";
import type { Profile } from "@/types/database";

interface PortalHeaderProps {
  profile: Profile;
  title?: string;
  unreadCount?: number;
}

export default function PortalHeader({ profile, title }: PortalHeaderProps) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email?.split("@")[0] || "Gebruiker";
  const initials = [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("").toUpperCase() || (profile.email?.[0] ?? "?").toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const roleLabel: Record<string, string> = { admin: "Admin", employee: "Medewerker", customer: "Klant" };

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-2 border-b border-[#101536]/06 bg-white/90 py-2 pl-16 pr-3 backdrop-blur-xl sm:pr-6 md:px-8">
      {/* GREETING / TITLE */}
      <div>
        {title ? (
          <h1 className="text-lg font-semibold text-[#101536]">{title}</h1>
        ) : (
          <p className="truncate text-sm font-semibold text-[#101536] sm:text-lg">
            {greeting}, {profile.first_name || name}
          </p>
        )}
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-4">
        {/* GLOBAL SEARCH — admin only */}
        <div className="hidden lg:block">{profile.role === "admin" && <GlobalSearch />}</div>
        {/* NOTIFICATIONS — Realtime via Supabase, geen polling */}
        <NotificationBell userId={profile.id} />

        <LogoutButton />

        {/* AVATAR */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4D7EBA] to-[#95AEC1] text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[#101536]">{name}</p>
            <p className="text-xs text-[#606774]">{profile.is_owner ? "Hoofdadmin" : (roleLabel[profile.role] ?? profile.role)}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
