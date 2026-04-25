"use client";

import Navbar from "@/components/Navbar";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/gtag";

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-36 md:pt-46 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Contact
          </span>

          <h1 className="mt-6 text-4xl font-bold md:text-6xl xl:text-7xl leading-tight">
            Neem <span className="gradient-text">contact met ons op</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            Heeft u vragen of wilt u direct een offerte aanvragen? Wij helpen u
            graag verder.
          </p>
        </section>

        {/* CONTENT */}
        <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="space-y-6">
            {/* PHONE */}
            <div className="glass shadow-premium rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <Phone className="text-[#95AEC1]" />

                <div>
                  <p className="text-sm text-white/60">Telefoon</p>

                  <a
                    href="tel:+31613672320"
                    className="font-semibold"
                    onClick={() =>
                      trackEvent("phone_click", {
                        event_category: "Contact",
                        event_label: "Telefoon Klik",
                      })
                    }
                  >
                    +31 6 13672320
                  </a>
                </div>
              </div>
            </div>

            {/* EMAIL */}
            <div className="glass shadow-premium rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <Mail className="text-[#95AEC1]" />

                <div>
                  <p className="text-sm text-white/60">E-mail</p>

                  <a
                    href="mailto:info@moreclean.nl"
                    className="font-semibold"
                    onClick={() =>
                      trackEvent("email_click", {
                        event_category: "Contact",
                        event_label: "Email Klik",
                      })
                    }
                  >
                    info@moreclean.nl
                  </a>
                </div>
              </div>
            </div>

            {/* LOCATION */}
            <div className="glass shadow-premium rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <MapPin className="text-[#95AEC1]" />

                <div>
                  <p className="text-sm text-white/60">Werkgebied</p>
                  <p className="font-semibold">Roermond, Limburg & omgeving</p>
                </div>
              </div>
            </div>

            {/* WHATSAPP */}
            <a
              href="https://wa.me/31613672320"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("whatsapp_click", {
                  event_category: "Contact",
                  event_label: "WhatsApp Klik",
                })
              }
              className="flex items-center justify-center gap-3 rounded-full bg-green-500 px-6 py-4 font-semibold transition hover:scale-105"
            >
              <MessageCircle size={20} />
              WhatsApp Direct
            </a>
          </div>

          {/* FORM */}
          <div className="glass shadow-premium rounded-3xl p-8">
            <h2 className="text-3xl font-bold">Stuur een bericht</h2>

            <form
            action="https://formspree.io/f/xnjlwrpv"
            method="POST"
            encType="multipart/form-data"
            className="mt-6 space-y-5"
            onSubmit={() => {
              trackEvent("generate_lead", {
                event_category: "Offerte",
                event_label: "Offerte formulier verzonden",
                value: 1,
              });

              setTimeout(() => {
                window.location.href = "/bedankt";
              }, 500);
            }}
            >
              <input
                type="hidden"
                name="_next"
                value="https://moreclean.nl/bedankt"
              />

              <input
                type="text"
                name="_gotcha"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <input
                type="text"
                name="naam"
                required
                placeholder="Naam"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <input
                type="email"
                name="email"
                required
                placeholder="E-mail"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <input
                type="tel"
                name="telefoon"
                placeholder="Telefoon"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <textarea
                name="bericht"
                rows={5}
                placeholder="Bericht"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <input
                type="hidden"
                name="_subject"
                value="Nieuw contactbericht - More Clean"
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[#4D7EBA] px-6 py-4 font-semibold transition hover:scale-[1.02]"
              >
                Bericht Verzenden
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}