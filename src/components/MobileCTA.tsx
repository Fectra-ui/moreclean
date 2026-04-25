"use client";

import Link from "next/link";
import { Phone, MessageCircle, FileText } from "lucide-react";
import { trackEvent } from "@/lib/gtag";

export default function MobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#101536]/95 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-3">
        <a
          href="tel:+31613672320"
          onClick={() =>
            trackEvent("phone_click", {
              event_category: "Mobile CTA",
              event_label: "Bel Nu",
            })
          }
          className="flex flex-col items-center gap-1 py-3 text-sm font-medium text-white"
        >
          <Phone size={18} />
          Bel Nu
        </a>

        <a
          href="https://wa.me/31613672320"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("whatsapp_click", {
              event_category: "Mobile CTA",
              event_label: "WhatsApp",
            })
          }
          className="flex flex-col items-center gap-1 py-3 text-sm font-medium text-white"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>

        <Link
          href="/offerte"
          onClick={() =>
            trackEvent("cta_click", {
              event_category: "Mobile CTA",
              event_label: "Offerte",
            })
          }
          className="flex flex-col items-center gap-1 py-3 text-sm font-medium text-white"
        >
          <FileText size={18} />
          Offerte
        </Link>
      </div>
    </div>
  );
}