import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  metadataBase: new URL("https://moreclean.nl"),

  title: {
    default: "More Clean | Glasbewassing & Schoonmaakbedrijf Limburg",
    template: "%s | More Clean",
  },

  description:
    "Professionele glasbewassing, zonnepanelen reinigen en schoonmaakdiensten in Roermond, Limburg en omgeving. Vraag direct vrijblijvend een offerte aan.",

  keywords: [
    "glasbewassing Roermond",
    "zonnepanelen reinigen Roermond",
    "schoonmaakbedrijf Roermond",
    "glazenwasser Limburg",
    "schoonmaakdiensten Limburg",
  ],

  openGraph: {
    title: "More Clean",
    description:
      "Premium schoonmaakdiensten in Limburg. Glasbewassing, zonnepanelen reinigen en meer.",
    url: "https://moreclean.nl",
    siteName: "More Clean",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "More Clean — Professionele glasbewassing in Limburg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "More Clean",
    description:
      "Professionele glasbewassing en schoonmaakdiensten in Limburg.",
    images: ["/images/hero-bg.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "More Clean",
    url: "https://moreclean.nl",
    telephone: "+31613672320",
    email: "info@moreclean.nl",

    address: {
      "@type": "PostalAddress",
      addressLocality: "Roermond",
      addressRegion: "Limburg",
      addressCountry: "NL",
    },

    areaServed: ["Roermond", "Venlo", "Weert", "Echt", "Limburg"],

    openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-16:00"],

    image: "https://moreclean.nl/images/hero-bg.jpg",

    description:
      "Professionele glasbewassing, zonnepanelen reinigen en schoonmaakdiensten in Roermond, Limburg en omgeving.",

    priceRange: "€€",
  };

  return (
    <html
      lang="nl"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F3F5F7] text-[#121212]">
        {/* NAVBAR */}
        <Navbar />

        {/* PAGE CONTENT */}
        <main className="flex-1">
          {children}
        </main>

        {/* FOOTER */}
        <Footer />

        {/* MOBILE CTA */}
        <MobileCTA />

        {/* GOOGLE ANALYTICS */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K5064BTGGY"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag(){
              dataLayer.push(arguments);
            }

            gtag('js', new Date());

            gtag('config', 'G-K5064BTGGY');
          `}
        </Script>

        {/* LOCAL BUSINESS SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </body>
    </html>
  );
}