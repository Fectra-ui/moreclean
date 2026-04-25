"use client";

import Navbar from "@/components/Navbar";
import AnimatedCounter from "@/components/AnimatedCounter";
import FAQItem from "@/components/FAQItem";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  MapPin,
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
        <section className="relative flex min-h-screen items-center px-6 pt-28">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover scale-105"
          >
            <source src="/video/hero-video.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101536]/95 via-[#101536]/70 to-transparent" />

          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
            {/* LEFT */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.8 }}
            >
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
                resultaat. Voor woningen, bedrijven en panden in Limburg.
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
                  className="group rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105 hover:shadow-2xl"
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
                  className="glass rounded-full px-8 py-4 font-semibold transition hover:scale-105"
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
                      className="rounded-2xl bg-white/5 p-5 text-center hover:bg-white/10"
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
        </section>

        {/* WERKGEBIED */}
        <section className="px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-7xl"
          >
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    href={area.href}
                    className="glass block rounded-3xl p-6 text-center transition hover:-translate-y-2"
                  >
                    <MapPin className="mx-auto mb-3 text-[#95AEC1]" size={22} />
                    <p className="font-semibold">{area.name}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* REVIEWS */}
        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
            {reviews.map((review, index) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-6 hover:-translate-y-2"
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

        {/* FLOATING WHATSAPP */}
        <motion.a
          href="https://wa.me/31613672320"
          target="_blank"
          rel="noopener noreferrer"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="hidden md:flex fixed bottom-6 right-6 z-50 rounded-full bg-green-500 p-4 shadow-2xl transition duration-300 hover:scale-110"
        >
          <MessageCircle />
        </motion.a>
      </main>
    </>
  );
}