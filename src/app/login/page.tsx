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
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#101536] p-12 lg:flex">
        <div className="absolute inset-0">
          <video
            autoPlay muted loop playsInline
            aria-hidden="true"
            className="h-full w-full object-cover opacity-30"
          >
            <source src="/video/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-[#101536]/90 via-[#101536]/75 to-[#4D7EBA]/40" />
        </div>

        <div className="relative z-10">
          <Link href="/">
            <Image src="/images/logo.png" alt="More Clean" width={120} height={44} className="brightness-0 invert" />
          </Link>
        </div>

        <div className="relative z-10">
          <p className="text-4xl font-bold leading-tight text-white">
            Uw bedrijf,<br />
            <span className="text-[#95AEC1]">altijd in orde.</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Bekijk uw afspraken, offertes en facturen. Communiceer direct met More Clean.
          </p>

          {/* Portal links */}
          <div className="mt-10 space-y-3">
            {portals.map((p) => (
              <div key={p.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/05 px-4 py-3">
                <span className="mt-0.5 text-xl">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{p.title}portal</p>
                  <p className="text-xs text-white/50">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="text-sm text-white/60">Binnen 24 uur reactie gegarandeerd</p>
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
