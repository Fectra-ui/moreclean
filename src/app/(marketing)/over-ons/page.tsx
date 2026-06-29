import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, HeartHandshake, Gem, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Over Ons | More Clean",
  description:
    "Leer More Clean kennen. Een modern schoonmaakbedrijf uit Limburg gebouwd op kwaliteit, betrouwbaarheid en persoonlijke service.",
  alternates: {
    canonical: "https://moreclean.nl/over-ons",
  },
};

const values = [
  {
    icon: ShieldCheck,
    title: "Betrouwbaar",
    text: "Afspraak is afspraak. Wij werken netjes, op tijd en professioneel.",
  },
  {
    icon: Gem,
    title: "Kwaliteit",
    text: "Oog voor detail en een resultaat waar u direct verschil in ziet.",
  },
  {
    icon: HeartHandshake,
    title: "Persoonlijk",
    text: "Korte lijnen, duidelijke communicatie en echte betrokkenheid.",
  },
  {
    icon: MapPin,
    title: "Lokaal",
    text: "Actief in Roermond, Limburg en omgeving.",
  },
];

export default function OverOnsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-32 text-[#121212]">
      {/* BACKGROUND GLOW */}
      <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-6xl text-center">
        <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
          Over More Clean
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl xl:text-7xl">
          Een bedrijf gebouwd op{" "}
          <span className="gradient-text">kwaliteit & vertrouwen</span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#606774]">
          More Clean staat voor hoogwaardige schoonmaakdiensten met een
          persoonlijke aanpak. Wij helpen particulieren en bedrijven aan een
          representatief, fris en verzorgd resultaat.
        </p>
      </section>

      {/* STORY */}
      <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
        <div className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
          <h2 className="text-3xl font-bold text-[#101536]">Ons verhaal</h2>

          <p className="mt-5 leading-8 text-[#606774]">
            Wat begon met passie voor perfect schoon resultaat groeide uit tot
            More Clean: een modern schoonmaakbedrijf waar kwaliteit, service en
            betrouwbaarheid centraal staan.
          </p>

          <p className="mt-5 leading-8 text-[#606774]">
            Of het nu gaat om glasbewassing, zonnepanelen reinigen of complete
            schoonmaakdiensten — wij leveren werk waar u trots op kunt zijn.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-[#95AEC1]">
              More Clean
            </p>
            <h3 className="mt-3 text-4xl font-bold text-[#101536]">Professioneel. Persoonlijk. Premium.</h3>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto mt-24 max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-[#101536]">Onze kernwaarden</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => {
            const Icon = value.icon;

            return (
              <div
                key={value.title}
                className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl transition hover:-translate-y-2"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-[#4D7EBA]/20 p-4 text-[#95AEC1]">
                  <Icon size={24} />
                </div>

                <h3 className="text-2xl font-semibold text-[#101536]">{value.title}</h3>

                <p className="mt-4 text-[#606774]">{value.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-5xl">
        <div className="glass shadow-premium rounded-3xl p-10 text-center">
          <h2 className="text-4xl font-bold text-[#101536]">
            Klaar om samen te werken?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-[#606774]">
            Neem contact op of vraag direct vrijblijvend een offerte aan.
          </p>

          <Link
            href="/offerte"
            className="
              group
              relative
              mt-10
              inline-flex
              items-center
              justify-center
              overflow-hidden
              rounded-[22px]
              bg-gradient-to-r
              from-[#667FB0]
              via-[#95AEC1]
              to-[#4D7EBA]
              px-8
              py-5
              font-semibold
              text-white
              shadow-[0_20px_60px_rgba(77,126,186,.28)]
              transition-all
              duration-500
              hover:-translate-y-1
              hover:shadow-[0_30px_80px_rgba(77,126,186,.38)]
            "
          >
            <span className="relative z-10">Gratis Offerte</span>
            <div
              className="
                absolute
                inset-0
                opacity-0
                transition
                duration-500
                group-hover:opacity-100
                bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.25),transparent)]
                translate-x-[-120%]
                group-hover:translate-x-[120%]
              "
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
