import Link from "next/link";
import GlobalSearch from "@/components/portal/GlobalSearch";
import NotificationBell from "@/components/portal/NotificationBell";
import LogoutButton from "@/components/portal/LogoutButton";
import type { Profile } from "@/types/database";

interface PortalHeaderProps {
  profile: Profile;
  title?: string;
  unreadCount?: number;
}

export default function PortalHeader({ profile, title, unreadCount = 0 }: PortalHeaderProps) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Gebruiker";
  const initials = [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#101536]/06 bg-white/80 px-8 backdrop-blur-xl">
      {/* GREETING / TITLE */}
      <div>
        {title ? (
          <h1 className="text-lg font-semibold text-[#101536]">{title}</h1>
        ) : (
          <p className="text-lg font-semibold text-[#101536]">
            {greeting}, {profile.first_name || name}
          </p>
        )}
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-4">
        {/* GLOBAL SEARCH — admin only */}
        {profile.role === "admin" && <GlobalSearch />}
        {/* NOTIFICATIONS — Realtime via Supabase, geen polling */}
        <NotificationBell userId={profile.id} />

        <LogoutButton />

        {/* AVATAR */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4D7EBA] to-[#95AEC1] text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[#101536]">{name}</p>
            <p className="text-xs text-[#606774] capitalize">{profile.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
