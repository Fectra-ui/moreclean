import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | More Clean",
  description:
    "Neem contact op met More Clean. Bel, mail of stuur een WhatsApp voor glasbewassing, zonnepanelen reinigen of schoonmaakdiensten in Limburg.",
  alternates: {
    canonical: "https://moreclean.nl/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[220px] text-[#121212]">
      {/* BACKGROUND GLOW */}
      <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-6xl text-center">
        <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
          Contact
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl xl:text-7xl">
          Neem <span className="gradient-text">contact met ons op</span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#606774]">
          Heeft u vragen of wilt u direct een offerte aanvragen? Wij helpen u
          graag verder.
        </p>
      </section>

      {/* CONTENT */}
      <ContactForm />
    </div>
  );
}
