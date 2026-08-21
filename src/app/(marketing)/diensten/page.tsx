import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Droplets, Sparkles, Building2, Home, SunMedium } from "lucide-react";

export const metadata: Metadata = {
  title: "Onze Diensten | Glasbewassing & Schoonmaak | More Clean",
  description:
    "Professionele glasbewassing, zonnepanelen reinigen, zakelijke en particuliere schoonmaak in Roermond en Limburg. Bekijk al onze diensten.",
  alternates: {
    canonical: "https://moreclean.nl/diensten",
  },
};

const services = [
  {
    id: "glasbewassing",
    icon: Droplets,
    title: "Glasbewassing",
    text: "Streeploze ramen voor woningen, winkels en bedrijfspanden. Professioneel, veilig en representatief resultaat.",
    image: "/images/Glasbewassing foto.png",
    includes: ["Ramen en kozijnen", "Woningen, winkels en bedrijfspanden", "Eenmalig of periodiek onderhoud"],
    detail: "Heldere ramen maken direct verschil. We stemmen de glasbewassing af op uw woning of pand, met oog voor ramen, kozijnen en een verzorgde uitstraling.",
  },
  {
    id: "zonnepanelen-reinigen",
    icon: SunMedium,
    title: "Zonnepanelen Reinigen",
    text: "Meer rendement en langere levensduur dankzij specialistische reiniging zonder schade of strepen.",
    image: "/images/Zonnepanelen foto.png",
    includes: ["Reiniging zonder agressieve chemicaliën", "Veilig werken op en rond het dak", "Voor woningen en bedrijfspanden"],
    detail: "Vuil, stof en aanslag kunnen het rendement van zonnepanelen verminderen. Met een zorgvuldige reiniging helpen we uw panelen weer optimaal licht op te vangen.",
  },
  {
    id: "zakelijke-schoonmaak",
    icon: Building2,
    title: "Zakelijke Schoonmaak",
    text: "Schone kantoren, winkels en werkplekken zorgen voor een professionele uitstraling en prettige werkomgeving.",
    includes: ["Kantoren, winkels en werkplekken", "Een vaste of flexibele frequentie", "Afspraken passend bij uw bedrijfsvoering"],
    detail: "Een representatieve werkplek geeft vertrouwen aan medewerkers, bezoekers en klanten. We maken samen een praktische aanpak die aansluit bij uw ruimte en planning.",
  },
  {
    id: "particuliere-schoonmaak",
    icon: Home,
    title: "Particuliere Schoonmaak",
    text: "Van ramen tot overkappingen en rolluiken: zorgvuldig onderhoud voor een fris en verzorgd huis.",
    includes: ["Glasbewassing rond de woning", "Overkappingen en rolluiken reinigen", "Zonnepanelen als onderdeel van uw onderhoud"],
    detail: "Naast ramen helpen we ook met de onderdelen die een woning snel een verzorgde uitstraling geven, zoals overkappingen en rolluiken. Zo kunt u meerdere schoonmaakklussen in één keer afstemmen.",
  },
];

export default function DienstenPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-32 text-[#121212]">
      {/* BACKGROUND GLOW */}
      <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl text-center">
        <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
          Onze Diensten
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl xl:text-7xl">
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
            <Link
              key={service.title}
              href={`#${service.id}`}
              className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl transition duration-300 hover:-translate-y-2"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-[#4D7EBA]/20 p-4 text-[#95AEC1]">
                <Icon size={26} />
              </div>

              <h2 className="text-2xl font-semibold text-[#101536]">{service.title}</h2>

              <p className="mt-4 text-[#606774]">{service.text}</p>

              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#4D7EBA]">
                Bekijk wat we doen <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </section>

      {/* SERVICE DETAILS */}
      <section className="mx-auto mt-20 max-w-7xl space-y-12">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <article id={service.id} key={service.id} className="scroll-mt-28 overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_20px_80px_rgba(0,0,0,.08)]">
              <div className={`grid ${service.image ? "lg:grid-cols-2" : ""}`}>
                {service.image && (
                  <div className="relative min-h-72 lg:min-h-full">
                    <Image src={service.image} alt={service.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                  </div>
                )}
                <div className="p-8 sm:p-10 lg:p-12">
                  <div className="mb-5 inline-flex rounded-2xl bg-[#4D7EBA]/15 p-3 text-[#4D7EBA]"><Icon size={24} /></div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#4D7EBA]">Dienst {index + 1}</p>
                  <h2 className="mt-3 text-3xl font-bold text-[#101536] md:text-4xl">{service.title}</h2>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#606774]">{service.detail}</p>
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {service.includes.map((item) => <li key={item} className="flex items-start gap-2 text-sm font-medium text-[#101536]"><Check className="mt-0.5 shrink-0 text-[#4D7EBA]" size={16} />{item}</li>)}
                  </ul>
                  <Link href="/offerte" className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#4D7EBA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3e6da5]">Offerte aanvragen <ArrowRight size={16} /></Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-5xl">
        <div className="glass shadow-premium rounded-3xl p-10 text-center">
          <h2 className="text-4xl font-bold text-[#101536]">
            Op zoek naar kwaliteit en resultaat?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-[#606774]">
            Vraag vandaag nog vrijblijvend een offerte aan en ontvang snel een
            reactie van More Clean.
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
            <span className="relative z-10">Gratis Offerte Aanvragen</span>
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
