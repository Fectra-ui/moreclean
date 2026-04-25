"use client";

import Navbar from "@/components/Navbar";
import AnimatedCounter from "@/components/AnimatedCounter";
import FAQItem from "@/components/FAQItem";
import Link from "next/link";
import {
  Star,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  MapPin,
} from "lucide-react";
import { trackEvent } from "@/lib/gtag";

const stats = [
  { end: 500, suffix: "+", label: "Tevreden klanten" },
  { end: 5, decimals: 1, label: "Beoordeling" },
  { end: 8, suffix: "+", label: "Jaar ervaring" },
  { end: 100, suffix: "%", label: "Streeploos garantie" },
];

const reviews = [
  { name: "Mark", text: "Top service. Ramen perfect schoon en snel geholpen." },
  {
    name: "Sanne",
    text: "Professioneel bedrijf. Zeer tevreden met het resultaat.",
  },
  {
    name: "Patrick",
    text: "Onze zonnepanelen zien er weer als nieuw uit.",
  },
];

const faqs = [
  {
    question: "Hoe snel ontvang ik reactie?",
    answer: "Meestal ontvangt u binnen 24 uur reactie.",
  },
  {
    question: "Werken jullie ook zakelijk?",
    answer: "Ja, wij werken voor bedrijven, winkels en kantoren.",
  },
  {
    question: "Zijn offertes gratis?",
    answer: "Ja, volledig vrijblijvend.",
  },
];

const areas = [
  { name: "Roermond", href: "/roermond" },
  { name: "Limburg", href: "/limburg" },
  { name: "Venlo", href: "/venlo" },
  { name: "Weert", href: "/weert" },
  { name: "Echt", href: "/echt" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="overflow-hidden text-white">
        {/* HERO */}
        <section className="relative flex min-h-screen items-center px-6 pt-28">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/video/hero-video.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101536]/90 via-[#101536]/60 to-transparent" />

          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
            <div>
              <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
                Binnen 24 uur reactie
              </span>

              <h1 className="mt-6 text-5xl font-bold leading-tight md:text-7xl">
                Uw specialist in{" "}
                <span className="gradient-text">
                  glasbewassing & zonnepanelen reinigen
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-white/80">
                Professionele reiniging met oog voor detail, kwaliteit en
                resultaat.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/offerte"
                  onClick={() =>
                    trackEvent("cta_click", {
                      event_category: "Homepage",
                      event_label: "Hero Offerte Klik",
                    })
                  }
                  className="rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
                >
                  Vraag gratis offerte aan
                </Link>

                <Link
                  href="/diensten"
                  onClick={() =>
                    trackEvent("cta_click", {
                      event_category: "Homepage",
                      event_label: "Bekijk Diensten Klik",
                    })
                  }
                  className="glass rounded-full px-8 py-4 font-semibold"
                >
                  Bekijk diensten
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/75">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={18} /> Betrouwbaar
                </span>

                <span className="flex items-center gap-2">
                  <Sparkles size={18} /> Premium service
                </span>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="glass shadow-premium rounded-3xl p-8">
                <div className="grid gap-4">
                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-white/5 p-5 text-center"
                    >
                      <p className="text-3xl font-bold text-[#95AEC1]">
                        <AnimatedCounter
                          end={item.end}
                          suffix={item.suffix || ""}
                          decimals={item.decimals || 0}
                        />
                      </p>

                      <p className="mt-1 text-sm text-white/70">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WERKGEBIED */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-[#95AEC1]">
                Werkgebied
              </p>

              <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                Actief in Limburg & omgeving
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {areas.map((area) => (
                <Link
                  key={area.name}
                  href={area.href}
                  onClick={() =>
                    trackEvent("location_click", {
                      event_category: "Werkgebied",
                      event_label: area.name,
                    })
                  }
                  className="glass rounded-3xl p-6 text-center transition hover:-translate-y-2"
                >
                  <MapPin className="mx-auto mb-3 text-[#95AEC1]" size={22} />
                  <p className="font-semibold">{area.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-[#95AEC1]">
                Reviews
              </p>

              <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                Klanten vertrouwen More Clean
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((review) => (
                <div
                  key={review.name}
                  className="glass rounded-3xl p-6 transition hover:-translate-y-2"
                >
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>

                  <p className="mt-4 text-white/80">{review.text}</p>
                  <p className="mt-5 font-semibold">{review.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold">Veelgestelde vragen</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-28">
          <div className="glass shadow-premium mx-auto max-w-6xl rounded-3xl p-10 text-center">
            <h2 className="text-4xl font-bold">
              Klaar voor een brandschoon resultaat?
            </h2>

            <p className="mt-4 text-white/75">
              Vraag vandaag nog vrijblijvend uw offerte aan.
            </p>

            <Link
              href="/offerte"
              onClick={() =>
                trackEvent("cta_click", {
                  event_category: "Homepage",
                  event_label: "Bottom CTA Klik",
                })
              }
              className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
            >
              Gratis Offerte
            </Link>
          </div>
        </section>

        {/* FLOATING WHATSAPP */}
        <a
          href="https://wa.me/31613672320"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("whatsapp_click", {
              event_category: "Homepage",
              event_label: "Floating WhatsApp",
            })
          }
          className="fixed bottom-6 right-6 z-50 rounded-full bg-green-500 p-4 shadow-2xl transition hover:scale-110"
        >
          <MessageCircle />
        </a>
      </main>
    </>
  );
}