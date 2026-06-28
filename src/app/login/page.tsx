import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inloggen | More Clean",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* LEFT — BRAND */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#101536] p-12 lg:flex">
        {/* VIDEO BG */}
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

        {/* CONTENT */}
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
          <p className="mt-4 text-white/60 text-sm leading-relaxed">
            Bekijk uw afspraken, offertes en facturen. Communiceer direct met More Clean.
          </p>
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
          <p className="mt-2 text-sm text-[#606774]">Vul uw e-mailadres en wachtwoord in.</p>

          <div className="mt-8 rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_20px_60px_rgba(16,21,54,.08)] backdrop-blur-xl">
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
        </div>
      </div>
    </div>
  );
}
