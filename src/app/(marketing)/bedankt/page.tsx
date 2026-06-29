import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Bedankt voor uw aanvraag | More Clean",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BedanktPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-32 text-[#121212]">
      {/* BACKGROUND GLOW */}
      <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-center">
        <div
          className="
            w-full
            max-w-2xl
            rounded-[36px]
            border
            border-white/60
            bg-white/70
            p-12
            text-center
            shadow-[0_20px_80px_rgba(0,0,0,.08)]
            backdrop-blur-3xl
          "
        >
          {/* ICON */}
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA] shadow-[0_15px_50px_rgba(77,126,186,.35)]">
            <CheckCircle2 size={46} className="text-white" />
          </div>

          {/* BADGE */}
          <div className="mt-8 inline-flex rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
            Aanvraag ontvangen
          </div>

          {/* TITLE */}
          <h1 className="mt-8 text-4xl font-black leading-tight tracking-[-0.04em] text-[#101536] md:text-5xl">
            Bedankt voor uw aanvraag
          </h1>

          {/* TEXT */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#606774]">
            We hebben uw aanvraag succesvol ontvangen en nemen
            binnen 24 uur contact met u op voor een vrijblijvende offerte.
          </p>

          {/* EXTRA TRUST */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              "Binnen 24 uur reactie",
              "Vrijblijvende offerte",
              "Professionele service",
            ].map((item) => (
              <div
                key={item}
                className="rounded-full bg-[#EEF3F8] px-4 py-2 text-sm font-medium text-[#101536]"
              >
                {item}
              </div>
            ))}
          </div>

          {/* BUTTON */}
          <Link
            href="/"
            className="
              group
              mt-12
              inline-flex
              items-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-[#667FB0]
              via-[#95AEC1]
              to-[#4D7EBA]
              px-8
              py-5
              text-lg
              font-semibold
              text-white
              shadow-[0_20px_60px_rgba(77,126,186,.35)]
              transition
              duration-300
              hover:scale-[1.03]
            "
          >
            Terug naar home

            <ArrowRight
              size={20}
              className="transition duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
