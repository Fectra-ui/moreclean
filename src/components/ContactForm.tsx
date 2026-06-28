"use client";

import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/gtag";

export default function ContactForm() {
  return (
    <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="space-y-6">
        {/* PHONE */}
        <div className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
          <div className="flex items-center gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#95AEC1]"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.93 5.93l1.79-1.79a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>

            <div>
              <p className="text-sm text-[#606774]">Telefoon</p>

              <a
                href="tel:+31613672320"
                className="font-semibold text-[#101536]"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#95AEC1]"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>

            <div>
              <p className="text-sm text-[#606774]">E-mail</p>

              <a
                href="mailto:info@moreclean.nl"
                className="font-semibold text-[#101536]"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#95AEC1]"
              aria-hidden="true"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>

            <div>
              <p className="text-sm text-[#606774]">Werkgebied</p>
              <p className="font-semibold text-[#101536]">Roermond, Limburg & omgeving</p>
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
        <h2 className="text-3xl font-bold text-[#101536]">Stuur een bericht</h2>

        <form
          action="https://formspree.io/f/xnjlwrpv"
          method="POST"
          className="mt-6 space-y-5"
          onSubmit={() => {
            trackEvent("generate_lead", {
              event_category: "Contact",
              event_label: "Contactformulier verzonden",
              value: 1,
            });

            setTimeout(() => {
              window.location.href = "/bedankt";
            }, 500);
          }}
        >
          <input type="hidden" name="_next" value="https://moreclean.nl/bedankt" />
          <input type="text" name="_gotcha" className="hidden" tabIndex={-1} autoComplete="off" />
          <input type="hidden" name="_subject" value="Nieuw contactbericht - More Clean" />

          <div>
            <label htmlFor="contact-naam" className="mb-1.5 block text-sm font-medium text-[#101536]">
              Naam <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-naam"
              type="text"
              name="naam"
              required
              placeholder="Uw naam"
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-[#101536]">
              E-mail <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              placeholder="uw@email.nl"
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

          <div>
            <label htmlFor="contact-telefoon" className="mb-1.5 block text-sm font-medium text-[#101536]">
              Telefoon
            </label>
            <input
              id="contact-telefoon"
              type="tel"
              name="telefoon"
              placeholder="+31 6 ..."
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

          <div>
            <label htmlFor="contact-bericht" className="mb-1.5 block text-sm font-medium text-[#101536]">
              Bericht
            </label>
            <textarea
              id="contact-bericht"
              name="bericht"
              rows={5}
              placeholder="Uw bericht..."
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

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
            <span className="relative z-10">Bericht Verzenden</span>

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
  );
}
