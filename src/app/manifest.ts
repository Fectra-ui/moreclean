import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "More Clean",
    short_name: "More Clean",
    description: "More Clean — glasbewassing en schoonmaakdiensten in Limburg.",
    lang: "nl-NL",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F3F5F7",
    theme_color: "#101536",
    icons: [
      { src: "/icons/more-clean-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/more-clean-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
