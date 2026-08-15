import { blogPosts } from "@/data/blog";
import type { BlogPost } from "@/types/blog";
import { createServiceClient } from "@/lib/supabase/server";

export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = new Map(blogPosts.map(p => [p.slug, { ...p, published: true }]));
  try {
    const { data } = await createServiceClient().from("blog_posts").select("slug,payload,published,deleted");
    for (const row of data ?? []) {
      if (row.deleted) posts.delete(row.slug);
      else posts.set(row.slug, { ...(row.payload as BlogPost), slug: row.slug, published: row.published });
    }
  } catch {}
  return [...posts.values()].filter(p => p.published !== false).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return (await getAllPosts()).find((p) => p.slug === slug);
}

export function getRelatedPosts(post: BlogPost, posts: BlogPost[], limit = 2): BlogPost[] {
  if (!post.related || post.related.length === 0) return [];
  return post.related
    .map((slug) => posts.find(p => p.slug === slug))
    .filter((p): p is BlogPost => p !== undefined)
    .slice(0, limit);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractHeadings(
  html: string
): Array<{ id: string; text: string; level: 2 | 3 }> {
  const headings: Array<{ id: string; text: string; level: 2 | 3 }> = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]) as 2 | 3;
    const rawText = match[2].replace(/<[^>]+>/g, "");
    const id = slugify(rawText);
    headings.push({ id, text: rawText, level });
  }
  return headings;
}

export function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, inner) => {
    const rawText = inner.replace(/<[^>]+>/g, "");
    const id = slugify(rawText);
    // If already has an id, replace it; otherwise inject
    if (/id=["'][^"']*["']/.test(attrs)) {
      const newAttrs = attrs.replace(/id=["'][^"']*["']/, `id="${id}"`);
      return `<h${level}${newAttrs}>${inner}</h${level}>`;
    }
    return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });
}
