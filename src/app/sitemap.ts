import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const lastModified = new Date("2026-06-28");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.moreclean.nl";
  const posts = await getAllPosts();

  return [
    { url: `${base}/`, priority: 1, lastModified, changeFrequency: "weekly" },
    { url: `${base}/diensten`, priority: 0.9, lastModified, changeFrequency: "monthly" },
    { url: `${base}/over-ons`, priority: 0.8, lastModified, changeFrequency: "monthly" },
    { url: `${base}/contact`, priority: 0.8, lastModified, changeFrequency: "monthly" },
    { url: `${base}/offerte`, priority: 0.9, lastModified, changeFrequency: "monthly" },

    { url: `${base}/roermond`, priority: 0.8, lastModified, changeFrequency: "monthly" },
    { url: `${base}/limburg`, priority: 0.8, lastModified, changeFrequency: "monthly" },
    { url: `${base}/venlo`, priority: 0.7, lastModified, changeFrequency: "monthly" },
    { url: `${base}/weert`, priority: 0.7, lastModified, changeFrequency: "monthly" },
    { url: `${base}/echt`, priority: 0.7, lastModified, changeFrequency: "monthly" },

    { url: `${base}/privacy`, priority: 0.3, lastModified, changeFrequency: "yearly" },
    { url: `${base}/algemene-voorwaarden`, priority: 0.3, lastModified, changeFrequency: "yearly" },

    { url: `${base}/blog`, priority: 0.8, lastModified, changeFrequency: "weekly" },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      priority: 0.7,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
    })),
  ];
}
