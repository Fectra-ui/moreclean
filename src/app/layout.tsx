import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  },

  twitter: {
    card: "summary_large_image",
    title: "More Clean",
    description:
      "Professionele glasbewassing en schoonmaakdiensten in Limburg.",
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
    telephone: "+31612345678",
    email: "info@moreclean.nl",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Roermond",
      addressRegion: "Limburg",
      addressCountry: "NL",
    },
    areaServed: ["Roermond", "Limburg"],
    priceRange: "€€",
  };

  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

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