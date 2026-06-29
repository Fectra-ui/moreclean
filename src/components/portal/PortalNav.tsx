"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <GridIcon /> },
  { label: "Planning", href: "/admin/planning", icon: <CalendarIcon /> },
  { label: "Klanten", href: "/admin/klanten", icon: <UsersIcon /> },
  { label: "Offertes", href: "/admin/offertes", icon: <DocumentIcon /> },
  { label: "Facturen", href: "/admin/facturen", icon: <ReceiptIcon /> },
  { label: "Administratie", href: "/admin/administratie", icon: <FolderIcon /> },
  { label: "Kosten", href: "/admin/kosten", icon: <CostIcon /> },
  { label: "Voertuigen", href: "/admin/voertuigen", icon: <TruckIcon /> },
  { label: "Kilometers", href: "/admin/kilometers", icon: <CarIcon /> },
  { label: "Medewerkers", href: "/admin/medewerkers", icon: <TeamIcon /> },
  { label: "Berichten", href: "/admin/berichten", icon: <ChatIcon /> },
  { label: "Rapportages", href: "/admin/rapportages", icon: <ChartIcon /> },
  { label: "Instellingen", href: "/admin/instellingen", icon: <SettingsIcon /> },
];

const employeeNav: NavItem[] = [
  { label: "Vandaag", href: "/medewerker", icon: <GridIcon /> },
  { label: "Agenda", href: "/medewerker/agenda", icon: <CalendarIcon /> },
  { label: "Bonnetje", href: "/medewerker/bonnetje", icon: <ReceiptIcon /> },
  { label: "Berichten", href: "/medewerker/berichten", icon: <ChatIcon /> },
  { label: "Mijn profiel", href: "/medewerker/profiel", icon: <UserIcon /> },
];

const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/klant", icon: <GridIcon /> },
  { label: "Afspraken", href: "/klant/afspraken", icon: <CalendarIcon /> },
  { label: "Offertes", href: "/klant/offertes", icon: <DocumentIcon /> },
  { label: "Facturen", href: "/klant/facturen", icon: <ReceiptIcon /> },
  { label: "Berichten", href: "/klant/berichten", icon: <ChatIcon /> },
  { label: "Mijn gegevens", href: "/klant/gegevens", icon: <UserIcon /> },
];

export default function PortalNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "admin" ? adminNav : role === "employee" ? employeeNav : customerNav;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-[#101536]/06 bg-white/90 backdrop-blur-xl">
      {/* LOGO */}
      <div className="flex h-16 items-center border-b border-[#101536]/06 px-6">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="More Clean" width={44} height={44} className="h-auto w-auto" />
        </Link>
      </div>

      {/* ROLE BADGE */}
      <div className="mx-4 mt-4 rounded-2xl bg-[#F3F5F7] px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#606774]">
          {role === "admin" ? "Bedrijfsdashboard" : role === "employee" ? "Medewerkersportaal" : "Klantenportaal"}
        </p>
      </div>

      {/* NAV */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/medewerker" && item.href !== "/klant" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200
                ${active
                  ? "bg-gradient-to-r from-[#4D7EBA]/12 to-[#95AEC1]/8 text-[#4D7EBA] shadow-sm"
                  : "text-[#606774] hover:bg-[#F3F5F7] hover:text-[#101536]"
                }
              `}
            >
              <span className={active ? "text-[#4D7EBA]" : "text-[#95AEC1]"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* SIGN OUT */}
      <div className="border-t border-[#101536]/06 p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#606774] transition hover:bg-[#F3F5F7] hover:text-[#101536]"
        >
          <LogoutIcon />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}

// ── Icons (inline to avoid extra client import) ──

function GridIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function DocumentIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function ReceiptIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 2 3 6 3 20 21 20 21 6 18 2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="2" x2="9" y2="10"/><line x1="15" y1="2" x2="15" y2="10"/></svg>;
}
function TeamIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function ChatIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function ChartIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function SettingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function UserIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function CarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function CostIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
function TruckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function FolderIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
