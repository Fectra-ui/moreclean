import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import BlogOverview from "@/components/BlogOverview";

export const metadata: Metadata = {
  title: "Blog & Kennisbank | More Clean",
  description:
    "Professionele tips en kennis over glasbewassing, zonnepanelen reinigen en schoonmaakdiensten in Limburg. Ontdek onze artikelen en kennisbank.",
  alternates: { canonical: "https://moreclean.nl/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[160px] text-[#121212]">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <span className="rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
            Kennisbank
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-[#101536] md:text-5xl lg:text-6xl">
            Professionele tips over{" "}
            <span className="gradient-text">glasbewassing</span> en schoonmaak
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#606774]">
            Ontdek onze kennisartikelen over glasbewassing, zonnepanelen reinigen
            en professionele schoonmaak. Praktische tips van de experts in Limburg.
          </p>
        </div>

        {/* Blog overview (client component for filtering) */}
        <BlogOverview posts={posts} />
      </div>
    </div>
  );
}
