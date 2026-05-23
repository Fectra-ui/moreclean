"use client";

import Navbar from "@/components/Navbar";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/gtag";

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[220px] text-[#121212]">
        {/* BACKGROUND GLOW */}
<div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />
        {/* HERO */}
        <section className="relative z-10 mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Contact
          </span>

          <h1 className="mt-6 text-4xl font-bold md:text-6xl xl:text-7xl leading-tight">
            Neem <span className="gradient-text">contact met ons op</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#606774]">
            Heeft u vragen of wilt u direct een offerte aanvragen? Wij helpen u
            graag verder.
          </p>
        </section>

        {/* CONTENT */}
        <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="space-y-6">
            {/* PHONE */}
            <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
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
            <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
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
            <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
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
              className="
                group
                relative
                overflow-hidden
                flex
                items-center
                justify-center
                gap-3
                rounded-[22px]
                bg-gradient-to-r
                from-[#25D366]
                via-[#2BE070]
                to-[#1ebe5d]
                px-6
                py-5
                font-semibold
                text-white
                shadow-[0_20px_60px_rgba(37,211,102,.28)]
                transition-all
                duration-500
                hover:-translate-y-1
                hover:shadow-[0_30px_80px_rgba(37,211,102,.38)]
                "
            >
              <MessageCircle
                size={20}
                className="transition duration-300 group-hover:scale-110"
            />
              WhatsApp Direct
            </a>
          </div>

          {/* FORM */}
          <div className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
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
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <input
                type="email"
                name="email"
                required
                placeholder="E-mail"
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <input
                type="tel"
                name="telefoon"
                placeholder="Telefoon"
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <textarea
                name="bericht"
                rows={5}
                placeholder="Bericht"
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <input
                type="hidden"
                name="_subject"
                value="Nieuw contactbericht - More Clean"
              />

              <button
            type="submit"
            className="
              group
              relative
              w-full
              overflow-hidden
              rounded-[22px]
              bg-gradient-to-r
              from-[#667FB0]
              via-[#95AEC1]
              to-[#4D7EBA]
              px-6
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
              Bericht Verzenden
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
            </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}