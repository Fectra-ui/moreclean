import Navbar from "@/components/Navbar";
import { Sparkles, Building2, Home, SunMedium } from "lucide-react";

const services = [
  {
    icon: Sparkles,
    title: "Glasbewassing",
    text: "Streeploze ramen voor woningen, winkels en bedrijfspanden. Professioneel, veilig en representatief resultaat.",
  },
  {
    icon: SunMedium,
    title: "Zonnepanelen Reinigen",
    text: "Meer rendement en langere levensduur dankzij specialistische reiniging zonder schade of strepen.",
  },
  {
    icon: Building2,
    title: "Zakelijke Schoonmaak",
    text: "Schone kantoren, winkels en werkplekken zorgen voor een professionele uitstraling en prettige werkomgeving.",
  },
  {
    icon: Home,
    title: "Particuliere Schoonmaak",
    text: "Betrouwbare hulp voor een fris, schoon en verzorgd thuis. Flexibel en zorgvuldig uitgevoerd.",
  },
];

export default function DienstenPage() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[220px] text-[#121212]">
        {/* BACKGROUND GLOW */}
<div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />
        {/* HERO */}
        <section className="mx-auto max-w-7xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Onze Diensten
          </span>

          <h1 className="mt-6 text-4xl font-bold md:text-6xl xl:text-7xl leading-tight">
            Professionele{" "}
            <span className="gradient-text">schoonmaakdiensten</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#606774]">
            More Clean levert hoogwaardige schoonmaakdiensten voor particulieren
            en bedrijven in Roermond, Limburg en omgeving.
          </p>
        </section>

        {/* SERVICES */}
        <section className="mx-auto mt-20 grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl transition duration-300 hover:-translate-y-2"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-[#4D7EBA]/20 p-4 text-[#95AEC1]">
                  <Icon size={26} />
                </div>

                <h2 className="text-2xl font-semibold">{service.title}</h2>

                <p className="mt-4 text-white/75">{service.text}</p>

                <a
            href="/offerte"
            className="
              group
              relative
              mt-8
              inline-flex
              items-center
              gap-2
              overflow-hidden
              rounded-2xl
              bg-gradient-to-r
              from-[#667FB0]
              via-[#95AEC1]
              to-[#4D7EBA]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-[0_15px_40px_rgba(77,126,186,.22)]
              transition-all
              duration-500
              hover:-translate-y-1
              hover:shadow-[0_25px_60px_rgba(77,126,186,.34)]
            "
          >
            <span className="relative z-10">
              Offerte aanvragen
            </span>

            <span className="relative z-10 transition duration-300 group-hover:translate-x-1">
              →
            </span>

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
                  </a>
              </div>
            );
          })}
        </section>

        {/* CTA */}
        <section className="mx-auto mt-24 max-w-5xl">
          <div className="glass shadow-premium rounded-3xl p-10 text-center">
            <h2 className="text-4xl font-bold">
              Op zoek naar kwaliteit en resultaat?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-white/75">
              Vraag vandaag nog vrijblijvend een offerte aan en ontvang snel een
              reactie van More Clean.
            </p>

            <a
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
              <>
            <span className="relative z-10">
              Gratis Offerte Aanvragen
            </span>

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
          </>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}