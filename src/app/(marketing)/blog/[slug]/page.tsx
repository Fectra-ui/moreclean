import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getRelatedPosts, extractHeadings, injectHeadingIds } from "@/lib/blog";
import BlogTOC from "@/components/BlogTOC";
import BlogCard from "@/components/BlogCard";
import ShareCopyButton from "@/components/ShareCopyButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.description;

  return {
    title,
    description,
    keywords: post.keywords,
    alternates: { canonical: `https://moreclean.nl/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `https://moreclean.nl/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}

function formatDateDutch(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const contentWithIds = injectHeadingIds(post.content);
  const headings = extractHeadings(contentWithIds);
  const relatedPosts = getRelatedPosts(post);

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `https://moreclean.nl${post.image}`,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "More Clean",
      url: "https://moreclean.nl",
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: `https://moreclean.nl/blog/${post.slug}`,
  };

  const faqSchema = post.faq && post.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <div className="relative bg-[#F3F5F7] text-[#121212]">
      {/* HERO */}
      <div className="relative h-[55vh] min-h-[400px] overflow-hidden">
        <Image
          fill
          src={post.image}
          alt={post.title}
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,21,54,.25), rgba(16,21,54,.72))",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-6 text-center">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span className="text-white/50">{post.category}</span>
          </nav>

          {/* Category badge */}
          <span className="mb-4 rounded-full bg-[#4D7EBA]/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="max-w-3xl text-3xl font-bold text-white md:text-4xl lg:text-5xl leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/80">
            <span>{post.author}</span>
            <span>·</span>
            <span>{formatDateDutch(post.date)}</span>
            <span>·</span>
            <span>{post.readTime} min lezen</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
          {/* MAIN ARTICLE */}
          <article>
            {/* Glass card with content */}
            <div className="glass rounded-[32px] p-8 md:p-12 -mt-20 relative z-10">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
              />
            </div>

            {/* FAQ block */}
            {post.faq && post.faq.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-[#101536] mb-6">
                  Veelgestelde vragen
                </h2>
                <div className="space-y-4">
                  {post.faq.map((item, i) => (
                    <div
                      key={i}
                      className="glass rounded-[24px] p-6"
                    >
                      <p className="font-semibold text-[#101536] mb-3">
                        {item.question}
                      </p>
                      <p className="text-[#606774] leading-relaxed text-sm">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA block */}
            <div className="mt-10 glass rounded-[32px] p-8 md:p-10 text-center">
              <span className="rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
                Vrijblijvende offerte
              </span>
              <h3 className="mt-4 text-2xl font-bold text-[#101536]">
                Klaar voor een stralend resultaat?
              </h3>
              <p className="mt-3 text-[#606774] max-w-md mx-auto">
                Vraag vandaag nog een vrijblijvende offerte aan. Wij nemen binnen 24 uur contact met u op.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link href="/offerte" className="btn-premium">
                  Gratis offerte aanvragen
                </Link>
                <Link href="/contact" className="btn-premium-light">
                  Neem contact op
                </Link>
              </div>
            </div>
          </article>

          {/* SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {/* TOC */}
              <BlogTOC headings={headings} />

              {/* Author card */}
              <div className="glass rounded-[24px] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA] mb-3">
                  Over de auteur
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667FB0] to-[#4D7EBA] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    MC
                  </div>
                  <div>
                    <p className="font-semibold text-[#101536] text-sm">{post.author}</p>
                    <p className="text-xs text-[#606774]">
                      Glasbewassing & schoonmaakexperts
                    </p>
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <div className="glass rounded-[24px] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA] mb-4">
                  Deel dit artikel
                </p>
                <div className="flex flex-col gap-2">
                  <ShareCopyButton slug={post.slug} />

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      post.title + " — https://moreclean.nl/blog/" + post.slug
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Deel via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-20">
            <div className="mb-8 text-center">
              <span className="rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
                Gerelateerde artikelen
              </span>
              <h2 className="mt-4 text-2xl font-bold text-[#101536]">
                Meer lezen?
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {relatedPosts.map((related) => (
                <BlogCard key={related.slug} post={related} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </div>
  );
}

