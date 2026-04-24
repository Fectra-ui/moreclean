import Navbar from "@/components/Navbar";
import AnimatedCounter from "@/components/AnimatedCounter";
import FAQItem from "@/components/FAQItem";
import { Star, MessageCircle } from "lucide-react";

const stats = [
  { end: 500, suffix: "+", label: "Tevreden klanten" },
  { end: 5, decimals: 1, label: "Beoordeling" },
  { end: 8, suffix: "+", label: "Jaar ervaring" },
  { end: 100, suffix: "%", label: "Streeploos garantie" },
];

const reviews = [
  {
    name: "Mark",
    text: "Top service. Ramen perfect schoon en snel geholpen.",
  },
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
    answer: "Meestal ontvangt u binnen 24 uur een reactie op werkdagen.",
  },
  {
    question: "Werken jullie ook zakelijk?",
    answer: "Ja, wij bedienen ook kantoren, winkels en bedrijfspanden.",
  },
  {
    question: "Reinigen jullie ook zonnepanelen?",
    answer: "Ja, veilig en professioneel voor maximaal rendement.",
  },
  {
    question: "Zijn offertes gratis?",
    answer: "Ja, volledig vrijblijvend en kosteloos.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="bg-[#101536] text-white overflow-hidden">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-28">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/video/hero-video.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#101536]/55 via-black/20 to-[#4D7EBA]/30" />
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4D7EBA]/20 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <span className="mb-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-xl">
              Binnen 24 uur reactie
            </span>

            <h1 className="text-5xl font-bold leading-tight md:text-7xl">
              Uw specialist in glasbewassing en zonnepanelen reinigen
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              Professionele reiniging met oog voor detail, kwaliteit en resultaat.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a
                href="/offerte"
                className="rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold shadow-2xl transition hover:scale-105"
              >
                Vraag gratis offerte aan
              </a>

              <a
                href="/diensten"
                className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-semibold backdrop-blur-xl"
              >
                Bekijk diensten
              </a>
            </div>
          </div>
        </section>

        {/* COUNTERS */}
        <section className="relative z-20 -mt-14 px-6">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-xl shadow-xl"
              >
                <p className="text-3xl font-bold text-[#95AEC1]">
                  <AnimatedCounter
                    end={item.end}
                    suffix={item.suffix || ""}
                    decimals={item.decimals || 0}
                  />
                </p>

                <p className="mt-2 text-sm text-white/70">{item.label}</p>
              </div>
            ))}
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
                Klanten over More Clean
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((review) => (
                <div
                  key={review.name}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>

                  <p className="mt-4 text-white/80">{review.text}</p>
                  <p className="mt-4 font-semibold">{review.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-[#95AEC1]">
                FAQ
              </p>
              <h2 className="mt-4 text-4xl font-bold">
                Veelgestelde vragen
              </h2>
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

        {/* FOOTER */}
        <footer className="border-t border-white/10 px-6 py-12 text-white/70">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-xl font-bold text-white">More Clean</h3>
              <p className="mt-3">
                Professionele glasbewassing en schoonmaakdiensten in Limburg.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white">Contact</h4>
              <p className="mt-3">06 12345678</p>
              <p>info@moreclean.nl</p>
            </div>

            <div>
              <h4 className="font-semibold text-white">Snelle Links</h4>
              <p className="mt-3">Home</p>
              <p>Diensten</p>
              <p>Contact</p>
            </div>
          </div>
        </footer>

        {/* WHATSAPP */}
        <a
          href="https://wa.me/31612345678"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-green-500 p-4 shadow-2xl transition hover:scale-110"
        >
          <MessageCircle />
        </a>

        {/* MOBILE CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#101536]/90 p-4 backdrop-blur-xl md:hidden">
          <a
            href="/offerte"
            className="block rounded-full bg-[#4D7EBA] px-6 py-4 text-center font-semibold"
          >
            Gratis Offerte
          </a>
        </div>
      </main>
    </>
  );
}