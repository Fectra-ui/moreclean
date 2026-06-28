import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inloggen | More Clean",
  robots: { index: false, follow: false },
};

const portals = [
  {
    icon: "👤",
    title: "Klant",
    description: "Bekijk uw afspraken, offertes en facturen.",
    href: "/klant",
  },
  {
    icon: "👷",
    title: "Medewerker",
    description: "Uw dagplanning en opdrachtenoverzicht.",
    href: "/medewerker",
  },
  {
    icon: "🛠",
    title: "Admin",
    description: "Volledig bedrijfsbeheer en rapportages.",
    href: "/admin",
  },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* LEFT — BRAND */}
      <div
        className="hidden w-[45%] flex-col justify-between p-12 lg:flex"
        style={{ background: "linear-gradient(135deg, #0d1230 0%, #1a2a58 50%, #2d5a8e 100%)" }}
      >
        <div>
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            More Clean
          </Link>
        </div>

        <div>
          <p className="text-4xl font-bold leading-tight text-white">
            Uw bedrijf,<br />
            <span style={{ color: "#b8d0e8" }}>altijd in orde.</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            Bekijk uw afspraken, offertes en facturen. Communiceer direct met More Clean.
          </p>

          {/* Portal links */}
          <div className="mt-10 space-y-3">
            {portals.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-3 rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <span className="mt-0.5 text-xl">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{p.title}portal</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.80)" }}>{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>Binnen 24 uur reactie gegarandeerd</p>
        </div>
      </div>

      {/* RIGHT — FORM */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F3F5F7] px-6 py-12">
        {/* MOBILE LOGO */}
        <Link href="/" className="mb-10 lg:hidden">
          <Image src="/images/logo.png" alt="More Clean" width={110} height={40} />
        </Link>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-[#101536]">Inloggen</h1>
          <p className="mt-2 text-sm text-[#606774]">U wordt na het inloggen automatisch doorgestuurd naar uw portaal.</p>

          {/* PORTAL CARDS — mobile only, desktop shows in left panel */}
          <div className="mt-6 grid grid-cols-3 gap-2 lg:hidden">
            {portals.map((p) => (
              <div key={p.title} className="rounded-2xl border border-[#101536]/08 bg-white p-3 text-center shadow-sm">
                <span className="text-2xl">{p.icon}</span>
                <p className="mt-1 text-xs font-semibold text-[#101536]">{p.title}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-[#606774]">{p.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_20px_60px_rgba(16,21,54,.08)] backdrop-blur-xl">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-[#606774]">
            Nog geen account?{" "}
            <a href="mailto:info@moreclean.nl" className="font-medium text-[#4D7EBA] hover:underline">
              Neem contact op
            </a>
          </p>

          <p className="mt-3 text-center text-sm">
            <Link href="/" className="text-[#606774] hover:text-[#101536]">
              ← Terug naar de website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
