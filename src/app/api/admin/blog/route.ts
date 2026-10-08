import { NextRequest, NextResponse } from "next/server";
import { getApiIdentity } from "@/lib/auth/apiAuth";
import { createServiceClient } from "@/lib/supabase/server";
import { blogPosts } from "@/data/blog";
import { sanitizeBlogHtml } from "@/lib/blogHtml";
import type { BlogPost } from "@/types/blog";

function validBlogImage(image: unknown): image is string {
  if (typeof image !== "string" || !image || image !== image.trim()) return false;
  if (/^\/images\/(?!\/)[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp)$/i.test(image) && !image.split("/").includes("..")) return true;
  try {
    const url = new URL(image);
    const configured = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    return url.origin === configured.origin &&
      (process.env.NODE_ENV !== "production" || (url.protocol === "https:" && url.hostname.endsWith(".supabase.co"))) &&
      /^\/storage\/v1\/object\/public\/blog-images\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname) &&
      !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function blogUnavailable() {
  return NextResponse.json({ error: "Bloggegevens tijdelijk niet beschikbaar" }, { status: 503 });
}

export async function GET() {
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  try {
    const { data, error } = await createServiceClient().from("blog_posts").select("slug,payload,published,deleted");
    if (error || !data) {
      console.error("Admin blog query failed", { code: error?.code ?? "no_data" });
      return blogUnavailable();
    }
    const posts = new Map(blogPosts.map((p) => [p.slug, { ...p, published: true }]));
    for (const row of data) {
      if (row.deleted) posts.delete(row.slug);
      else posts.set(row.slug, { ...(row.payload as BlogPost), slug: row.slug, published: row.published });
    }
    return NextResponse.json([...posts.values()]);
  } catch {
    console.error("Admin blog request failed", { kind: "network" });
    return blogUnavailable();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const post = await req.json().catch(() => null) as BlogPost | null;
  if (!post?.slug || !post.title?.trim() || !post.description?.trim() || !post.content?.trim() || !post.image) return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
  if (!/^[a-z0-9-]{3,100}$/.test(post.slug)) return NextResponse.json({ error: "Ongeldige slug" }, { status: 400 });
  if (!validBlogImage(post.image)) return NextResponse.json({ error: "Ongeldige afbeeldings-URL" }, { status: 400 });
  const published = post.published !== false;
  const sanitizedPost = { ...post, content: sanitizeBlogHtml(post.content) };
  try {
    const { error } = await createServiceClient().from("blog_posts").upsert({ slug: post.slug, payload: sanitizedPost, published, deleted: false, updated_at: new Date().toISOString(), updated_by: auth.identity.userId });
    if (error) {
      console.error("Admin blog save failed", { code: error.code });
      return blogUnavailable();
    }
    return NextResponse.json({ ok: true });
  } catch {
    console.error("Admin blog save request failed", { kind: "network" });
    return blogUnavailable();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Slug ontbreekt" }, { status: 400 });
  try {
    const { error } = await createServiceClient().from("blog_posts").upsert({ slug, payload: {}, published: false, deleted: true, updated_by: auth.identity.userId });
    if (error) {
      console.error("Admin blog delete failed", { code: error.code });
      return blogUnavailable();
    }
    return NextResponse.json({ ok: true });
  } catch {
    console.error("Admin blog delete request failed", { kind: "network" });
    return blogUnavailable();
  }
}
