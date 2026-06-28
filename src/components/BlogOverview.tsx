"use client";

import { useState } from "react";
import type { BlogPost, BlogCategory } from "@/types/blog";
import BlogCard from "@/components/BlogCard";

const CATEGORIES: Array<BlogCategory | "Alles"> = [
  "Alles",
  "Glasbewassing",
  "Zonnepanelen",
  "Schoonmaak",
  "Bedrijven",
];

interface BlogOverviewProps {
  posts: BlogPost[];
}

export default function BlogOverview({ posts }: BlogOverviewProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "Alles">("Alles");

  const featuredPost = posts.find((p) => p.featured);
  const nonFeatured = posts.filter((p) => !p.featured);

  const filtered = nonFeatured.filter((post) => {
    const matchesSearch =
      search === "" ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "Alles" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const showFeatured =
    featuredPost &&
    (search === "" ||
      featuredPost.title.toLowerCase().includes(search.toLowerCase()) ||
      featuredPost.description.toLowerCase().includes(search.toLowerCase())) &&
    (activeCategory === "Alles" || featuredPost.category === activeCategory);

  const totalVisible = (showFeatured ? 1 : 0) + filtered.length;

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95AEC1]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Zoek artikelen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/60 bg-white/75 backdrop-blur-sm text-[#121212] placeholder-[#CACED3] text-sm focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/30"
          />
        </div>

        {/* Count */}
        <p className="text-sm text-[#606774] flex-shrink-0">
          <span className="font-semibold text-[#101536]">{totalVisible}</span> artikelen
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
              activeCategory === cat
                ? "bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA] text-white shadow-lg shadow-[#4D7EBA]/20"
                : "bg-[#E8EDF3] text-[#4D7EBA] hover:bg-[#D8E2EC]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured post */}
      {showFeatured && (
        <div className="mb-10 blog-card-enter" style={{ animationDelay: "0ms" }}>
          <BlogCard post={featuredPost} featured />
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => (
            <div
              key={post.slug}
              className="blog-card-enter"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      ) : totalVisible === 0 ? (
        <div className="glass rounded-[32px] p-16 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-semibold text-[#101536] mb-2">Geen artikelen gevonden</p>
          <p className="text-[#606774]">
            Probeer een andere zoekopdracht of categorie.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory("Alles");
            }}
            className="mt-6 btn-primary inline-block"
          >
            Reset filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
