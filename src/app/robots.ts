import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/bedankt"],
      },
    ],
    sitemap: "https://moreclean.nl/sitemap.xml",
  };
}
