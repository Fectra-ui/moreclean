import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://moreclean.nl";

  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/diensten`, priority: 0.9 },
    { url: `${base}/over-ons`, priority: 0.8 },
    { url: `${base}/contact`, priority: 0.8 },
    { url: `${base}/offerte`, priority: 0.9 },

    { url: `${base}/roermond`, priority: 0.8 },
    { url: `${base}/limburg`, priority: 0.8 },
    { url: `${base}/venlo`, priority: 0.7 },
    { url: `${base}/weert`, priority: 0.7 },
    { url: `${base}/echt`, priority: 0.7 },
  ];
}