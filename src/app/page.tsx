"use client";

import Navbar from "@/components/Navbar";
import AnimatedCounter from "@/components/AnimatedCounter";
import FAQItem from "@/components/FAQItem";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  MessageCircle,
  ArrowRight,
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

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="overflow-hidden text-white">
        {/* HERO */}
        <section className="relative min-h-[100svh] overflow-hidden">
          {/* VIDEO */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/video/hero-video.mp4" type="video/mp4" />
          </video>

          {/* OVERLAYS */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#101536]/30 via-[#101536]/45 to-[#101536]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(77,126,186,0.22),transparent_30%)]" />

          {/* CONTENT */}
          <div className="relative z-10 flex min-h-[100svh] items-start px-6 pt-36 pb-28 md:items-center md:pt-32">
            <div className="mx-auto grid w-full max-w-7xl gap-12 md:grid-cols-2 md:items-center">
              {/* LEFT */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.8 }}
              >
                <span className="inline-flex mt-4 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur-xl md:mt-0">
                  Binnen 24 uur reactie
                </span>

                <h1 className="mt-6 text-5xl font-bold leading-[0.95] sm:text-6xl md:text-7xl">
                  Uw specialist in <br />
                  glasbewassing &{" "}
                  <span className="text-[#95AEC1]">
                    zonnepanelen reinigen
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-lg text-white/80">
                  Professionele reiniging met oog voor detail, kwaliteit en
                  resultaat. Voor woningen, bedrijven en panden in Limburg.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/offerte"
                    onClick={() =>
                      trackEvent("cta_click", {
                        event_category: "Homepage",
                        event_label: "Hero Offerte Klik",
                      })
                    }
                    className="group rounded-full bg-[#4D7EBA] px-8 py-4 text-center font-semibold shadow-xl transition hover:scale-105"
                  >
                    <span className="inline-flex items-center gap-2">
                      Vraag gratis offerte aan
                      <ArrowRight
                        size={18}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </Link>

                  <Link
                    href="/diensten"
                    onClick={() =>
                      trackEvent("cta_click", {
                        event_category: "Homepage",
                        event_label: "Bekijk Diensten Klik",
                      })
                    }
                    className="rounded-full border border-white/15 bg-white/10 px-8 py-4 text-center font-semibold backdrop-blur-xl transition hover:bg-white/15"
                  >
                    Bekijk diensten
                  </Link>
                </div>
              </motion.div>

              {/* RIGHT */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="hidden md:block"
              >
                <div className="glass shadow-premium rounded-3xl p-8">
                  <div className="grid gap-4">
                    {stats.map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="rounded-2xl bg-white/5 p-5 text-center transition hover:bg-white/10"
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
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
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
              {areas.map((area, index) => (
                <motion.div
                  key={area.name}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    href={area.href}
                    onClick={() =>
                      trackEvent("location_click", {
                        event_category: "Werkgebied",
                        event_label: area.name,
                      })
                    }
                    className="glass block rounded-3xl p-6 text-center transition hover:-translate-y-2 hover:bg-white/10"
                  >
                    <p className="font-semibold">{area.name}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold md:text-5xl">
                Klanten vertrouwen More Clean
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.name}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-3xl p-6 transition hover:-translate-y-2 hover:bg-white/10"
                >
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>

                  <p className="mt-4 text-white/80">{review.text}</p>
                  <p className="mt-5 font-semibold">{review.name}</p>
                </motion.div>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass shadow-premium mx-auto max-w-6xl rounded-3xl p-10 text-center"
          >
            <h2 className="text-4xl font-bold">
              Klaar voor een brandschoon resultaat?
            </h2>

            <p className="mt-4 text-white/75">
              Vraag vandaag nog vrijblijvend uw offerte aan.
            </p>

            <Link
              href="/offerte"
              className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
            >
              Gratis Offerte
            </Link>
          </motion.div>
        </section>

        {/* FLOATING WHATSAPP DESKTOP */}
        <motion.a
          href="https://wa.me/31613672320"
          target="_blank"
          rel="noopener noreferrer"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="fixed bottom-6 right-6 z-50 hidden rounded-full bg-green-500 p-4 shadow-2xl transition hover:scale-110 md:flex"
        >
          <MessageCircle />
        </motion.a>
      </main>
    </>
  );
}