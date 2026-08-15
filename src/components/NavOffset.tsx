"use client";

import { usePathname } from "next/navigation";

/** Adds top spacing on all pages except the homepage, where the hero intentionally goes under the navbar. */
export default function NavOffset() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  // navbar is ~88px on desktop (mt-4 + py-3.5 + logo), ~76px on mobile
  return <div className="h-[5.25rem] md:h-[6.5rem]" aria-hidden="true" />;
}
