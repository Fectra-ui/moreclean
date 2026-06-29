"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      title="Uitloggen"
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-[#606774] transition hover:bg-red-50 hover:text-red-600"
    >
      <LogOut size={16} />
      <span className="hidden md:inline">Uitloggen</span>
    </button>
  );
}
