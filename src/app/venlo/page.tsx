import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MapPin } from "lucide-react";

export const metadata = {
  title: "Glazenwasser Venlo | Glasbewassing & Ramen Wassen | More Clean",
  description:
    "Professionele glazenwasser in Venlo voor glasbewassing, ramen wassen, zonnepanelen reinigen en schoonmaakdiensten. Vraag vrijblijvend een offerte aan.",
};

const voordelen = [
  "Glazenwasser in Venlo en omgeving",
  "Ramen wassen & glasbewassing",
  "Zonnepanelen professioneel reinigen",
  "Zakelijke schoonmaakservice",
  "Particuliere schoonmaak op maat",
  "Snelle service en streeploos resultaat",
];

export default function VenloPage() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[220px] text-[#121212]">
        {/* BACKGROUND GLOW */}
        <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

        {/* HERO */}
        <section className="relative z-10 mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Venlo
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl xl:text-7xl">
            Glazenwasser, glasbewassing & schoonmaak in{" "}
            <span className="gradient-text">Venlo</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#606774]">
            Voor woningen, bedrijven en appartementen in Venlo levert More Clean
            hoogwaardige glasbewassing, ramen wassen, zonnepanelen reinigen en
            complete schoonmaakdiensten met oog voor kwaliteit.
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
              gap-2
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
            <span className="relative z-10">
              Gratis Offerte
            </span>

            <ArrowRight
              size={18}
              className="relative z-10 transition duration-300 group-hover:translate-x-1"
            />

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
        </section>

        {/* CARDS */}
        <section className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-3">
          {voordelen.map((item) => (
            <div
              key={item}
              className="
                rounded-[32px]
                border
                border-white/60
                bg-white/75
                p-6
                shadow-[0_20px_80px_rgba(0,0,0,.08)]
                backdrop-blur-3xl
                transition
                duration-300
                hover:-translate-y-2
              "
            >
              <CheckCircle2
                className="mb-4 text-[#95AEC1]"
                size={22}
              />

              <p className="leading-relaxed text-[#606774]">
                {item}
              </p>
            </div>
          ))}
        </section>

        {/* SEO CONTENT */}
        <section className="mx-auto mt-24 max-w-5xl rounded-[36px] border border-white/60 bg-white/75 p-10 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
          <h2 className="text-3xl font-bold text-[#101536]">
            Waarom kiezen voor More Clean in Venlo?
          </h2>

          <p className="mt-6 leading-relaxed text-[#606774]">
            Schone ramen en een verzorgd pand zorgen direct voor een betere
            uitstraling. Wij werken nauwkeurig, betrouwbaar en leveren een
            zichtbaar schoon resultaat voor woningen en bedrijven.
          </p>

          <p className="mt-4 leading-relaxed text-[#606774]">
            Dankzij flexibele planning zijn wij snel inzetbaar in Venlo,
            Blerick, Tegelen, Belfeld en omliggende plaatsen.
          </p>

          <div className="mt-8 flex items-center gap-3 text-[#4D7EBA]">
            <MapPin size={20} />
            <span>Werkzaam in Venlo en omgeving</span>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-24 max-w-5xl">
          <div className="glass shadow-premium rounded-[36px] p-12 text-center">
            <h2 className="text-4xl font-black tracking-[-0.03em] text-[#101536]">
              Op zoek naar een glazenwasser in Venlo?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#606774]">
              Vraag vrijblijvend een offerte aan en ontvang snel reactie van
              More Clean.
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
                gap-2
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
              <span className="relative z-10">
                Vraag Gratis Offerte Aan
              </span>

              <ArrowRight
                size={18}
                className="relative z-10 transition duration-300 group-hover:translate-x-1"
              />

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
      </main>
    </>
  );
}