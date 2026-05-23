"use client";

import ScrollReveal from "@/components/ScrollReveal";
import Navbar from "@/components/Navbar";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Droplets,
  Shield,
  Sparkles,
  Star,
  SunMedium,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#F3F5F7] text-[#121212]">
      <Navbar />
      
      {/* ================= HERO ================= */}
<section className="relative min-h-screen overflow-hidden">
  {/* VIDEO BACKGROUND */}
  <div className="absolute inset-0">
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/images/hero-fallback.jpg"
      className="
        absolute
        left-1/2
        top-1/2
        h-full
        w-full
        -translate-x-1/2
        -translate-y-1/2
        object-cover
        scale-[1.18]
        md:scale-[1.45]
      "
    >
      <source src="/video/hero-video.mp4" type="video/mp4" />
    </video>

    {/* DARK OVERLAY */}
    <div
      className="absolute inset-0"
      style={{
        background: `
          linear-gradient(
            180deg,
            rgba(16,21,54,.55) 0%,
            rgba(16,21,54,.38) 38%,
            rgba(16,21,54,.78) 100%
          )
        `,
      }}
    />

    {/* GLOW */}
    <div className="absolute left-1/2 top-[-250px] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />
  </div>

  {/* HERO CONTENT */}
  <div
    className="
      relative
      z-10
      flex
      min-h-screen
      items-start
      justify-center
      px-5
      pt-[180px]
      pb-24
      md:items-center
      md:px-6
      md:pt-0
      md:pb-0
    "
  >
    <div className="mx-auto max-w-5xl text-center">
      {/* GOOGLE REVIEW */}
      <div
        className="
          mb-8
          inline-flex
          items-center
          gap-3
          rounded-full
          border
          border-white/15
          bg-white/10
          px-4
          py-2.5
          backdrop-blur-2xl
          shadow-[0_10px_40px_rgba(0,0,0,.15)]
          md:px-5
          md:py-3
        "
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className="fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>

        <span className="text-xs font-medium text-white md:text-sm">
          5 stars on
        </span>

        <div className="text-[20px] font-black md:text-[22px]">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">o</span>
          <span className="text-[#4285F4]">g</span>
          <span className="text-[#34A853]">l</span>
          <span className="text-[#EA4335]">e</span>
        </div>
      </div>

      {/* TITLE */}
      <h1
        className="
          mx-auto
          max-w-5xl
          text-[50px]
          font-black
          leading-[0.92]
          tracking-[-0.06em]
          text-white
          md:text-7xl
          xl:text-[92px]
        "
      >
        Topkwaliteit{" "}
        <span className="bg-gradient-to-r from-white via-[#CACED3] to-[#95AEC1] bg-clip-text text-transparent">
          glasbewassing
        </span>{" "}
        in{" "}
        <span className="bg-gradient-to-r from-white via-[#CACED3] to-[#95AEC1] bg-clip-text text-transparent">
          Limburg
        </span>
      </h1>

      {/* SUBTEXT */}
      <p
        className="
          mx-auto
          mt-7
          max-w-[340px]
          text-base
          font-medium
          leading-relaxed
          tracking-[-0.01em]
          text-white/92
          drop-shadow-[0_4px_20px_rgba(0,0,0,.55)]
          md:mt-8
          md:max-w-3xl
          md:text-xl
        "
      >
        Geniet van helder uitzicht en streeploos resultaat met snelle service
        en reactie binnen 24 uur. Vraag vandaag nog een gratis offerte aan.
      </p>

      {/* BUTTONS */}
      <div className="mt-10 flex flex-col items-center justify-center gap-3 md:mt-12 md:flex-row">
        <Link
          href="/offerte"
          className="
            group
            inline-flex
            w-full
            max-w-[320px]
            items-center
            justify-center
            gap-2
            rounded-[24px]
            bg-gradient-to-r
            from-[#667FB0]
            via-[#95AEC1]
            to-[#4D7EBA]
            px-7
            py-5
            text-lg
            font-semibold
            text-white
            shadow-[0_20px_60px_rgba(77,126,186,.35)]
            transition
            duration-300
            hover:scale-[1.02]
            md:w-auto
            md:max-w-none
          "
        >
          Vraag gratis offerte aan

          <ArrowRight
            size={20}
            className="transition duration-300 group-hover:translate-x-1"
          />
        </Link>

        <Link
          href="/diensten"
          className="
            hidden
            md:inline-flex
            items-center
            gap-2
            rounded-2xl
            border
            border-white/15
            bg-white/10
            px-8
            py-5
            text-lg
            font-medium
            text-white
            backdrop-blur-xl
            transition
            duration-300
            hover:bg-white/20
          "
        >
          Bekijk diensten
        </Link>
      </div>

      {/* TRUST BADGE */}
      <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2 backdrop-blur-xl md:mt-10">
        <div className="h-2 w-2 rounded-full bg-emerald-400" />

        <span className="text-sm text-white/85">
          Binnen 24 uur reactie
        </span>
      </div>
    </div>
  </div>

  {/* SCROLL INDICATOR */}
  <div className="absolute bottom-10 left-1/2 z-20 hidden -translate-x-1/2 md:block">
    <div className="flex h-12 w-7 items-start justify-center rounded-full border border-white/30 p-2">
      <div className="h-3 w-1 animate-pulse rounded-full bg-white" />
    </div>
  </div>
</section>

      {/* ================= STATS ================= */}
      <section className="relative z-20 -mt-24 px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl md:grid-cols-4">
          {[
            ["500+", "Tevreden klanten"],
            ["5.0", "Google beoordeling"],
            ["8+", "Jaar ervaring"],
            ["100%", "Streeploze garantie"],
          ].map(([number, label]) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-black tracking-tight text-[#101536]">
                {number}
              </div>

              <div className="mt-2 text-sm text-[#606774]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <ScrollReveal>
        <section className="px-6 py-36">
        <div className="mx-auto max-w-5xl text-center">
          <span className="rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
            More Clean
          </span>

          <h2 className="mt-8 text-4xl font-black leading-tight tracking-[-0.04em] text-[#101536] md:text-6xl">
            Professionele reiniging{" "}
            <span className="bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] bg-clip-text text-transparent">
              met oog voor detail
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-[#606774]">
            Bij More Clean combineren wij hoogwaardige service met moderne
            technieken voor een perfect resultaat. Van glasbewassing tot het
            professioneel reinigen van zonnepanelen.
          </p>
        </div>

        {/* FEATURES */}
        <div className="mx-auto mt-24 grid max-w-6xl gap-8 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Betrouwbaar",
              text: "Duidelijke afspraken en altijd professionele service.",
            },
            {
              icon: Sparkles,
              title: "Streeploos resultaat",
              text: "Perfect schone ramen en panelen zonder strepen.",
            },
            {
              icon: Clock3,
              title: "Snelle service",
              text: "Flexibel ingepland en snel bereikbaar.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[30px] border border-[#E8EDF2] bg-white p-10 shadow-[0_20px_70px_rgba(0,0,0,.05)] transition duration-300 hover:-translate-y-2"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] text-white">
                <item.icon size={28} />
              </div>

              <h3 className="mt-8 text-2xl font-bold text-[#101536]">
                {item.title}
              </h3>

              <p className="mt-4 leading-relaxed text-[#606774]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        </section>
      </ScrollReveal>

      {/* ================= SERVICES ================= */}
      <section className="px-6 pb-36">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <span className="rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
              Onze diensten
            </span>

            <h2 className="mt-8 text-4xl font-black tracking-[-0.04em] text-[#101536] md:text-6xl">
              Waar wij in uitblinken
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {[
              {
                title: "Glasbewassing",
                icon: Droplets,
                image: "/images/service-glass.jpg",
                text: "Professionele glasbewassing voor woningen, winkels en bedrijfspanden.",
                features: [
                  "Streeploos resultaat",
                  "Inclusief kozijnen",
                  "Particulier & zakelijk",
                ],
              },
              {
                title: "Zonnepanelen reinigen",
                icon: SunMedium,
                image: "/images/service-solar.jpg",
                text: "Meer rendement dankzij professionele reiniging zonder chemicaliën.",
                features: [
                  "Meer rendement",
                  "Veilig gereinigd",
                  "Lange levensduur",
                ],
              },
            ].map((service) => (
              <div
                key={service.title}
                className="group overflow-hidden rounded-[34px] bg-white shadow-[0_20px_80px_rgba(0,0,0,.06)]"
              >
                {/* IMAGE */}
                <div className="relative h-[420px] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#101536]/70 via-[#101536]/10 to-transparent" />
                </div>

                {/* CONTENT */}
                <div className="p-10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] text-white">
                      <service.icon size={24} />
                    </div>

                    <h3 className="text-3xl font-black text-[#101536]">
                      {service.title}
                    </h3>
                  </div>

                  <p className="mt-6 text-lg leading-relaxed text-[#5E6472]">
                    {service.text}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {service.features.map((feature) => (
                      <div
                        key={feature}
                        className="inline-flex items-center gap-2 rounded-full bg-[#EEF3F8] px-4 py-2 text-sm font-medium text-[#101536]"
                      >
                        <Check size={14} />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/diensten"
                    className="mt-10 inline-flex items-center gap-2 font-semibold text-[#4D7EBA]"
                  >
                    Meer informatie
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= REVIEWS ================= */}
      <section className="bg-white px-6 py-36">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
              Reviews
            </span>

            <h2 className="mt-8 text-4xl font-black tracking-[-0.04em] text-[#101536] md:text-6xl">
              Klanten waarderen onze kwaliteit
            </h2>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Mike Peters",
                text: "Professioneel, snel en perfect resultaat. Onze ramen hebben er nog nooit zo goed uitgezien.",
              },
              {
                name: "Sanne Jacobs",
                text: "Zeer tevreden over het reinigen van onze zonnepanelen.",
              },
              {
                name: "Tom Willems",
                text: "Goede communicatie en echt een premium uitstraling.",
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-[30px] border border-[#E8EDF2] bg-[#F8FAFC] p-8"
              >
                <div className="mb-5 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="leading-relaxed text-[#5E6472]">
                  “{review.text}”
                </p>

                <div className="mt-8 font-semibold text-[#101536]">
                  {review.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative overflow-hidden px-6 py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-[#667FB0] via-[#95AEC1] to-[#4D7EBA]" />

        <div className="absolute inset-0 backdrop-blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black leading-tight tracking-[-0.04em] text-white md:text-6xl">
            Klaar voor een perfect schoon resultaat?
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/80">
            Vraag vandaag nog vrijblijvend een offerte aan voor professionele
            glasbewassing of zonnepanelen reiniging.
          </p>

          <Link
            href="/offerte"
            className="mt-12 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-5 text-lg font-semibold text-[#101536] transition duration-300 hover:scale-[1.03]"
          >
            Gratis offerte aanvragen
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </main>
  );
}