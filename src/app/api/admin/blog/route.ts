import { NextRequest, NextResponse } from "next/server";
import { getApiIdentity } from "@/lib/auth/apiAuth";
import { createServiceClient } from "@/lib/supabase/server";
import { blogPosts } from "@/data/blog";
import { sanitizeBlogHtml } from "@/lib/blogHtml";
import type { BlogPost } from "@/types/blog";

export async function GET() {
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const { data } = await createServiceClient().from("blog_posts").select("slug,payload,published,deleted");
  const posts = new Map(blogPosts.map((p) => [p.slug, { ...p, published: true }]));
  for (const row of data ?? []) {
    if (row.deleted) posts.delete(row.slug);
    else posts.set(row.slug, { ...(row.payload as BlogPost), slug: row.slug, published: row.published });
  }
  return NextResponse.json([...posts.values()]);
}

export async function PUT(req: NextRequest) {
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const post = await req.json().catch(() => null) as BlogPost | null;
  if (!post?.slug || !post.title?.trim() || !post.description?.trim() || !post.content?.trim() || !post.image) return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
  if (!/^[a-z0-9-]{3,100}$/.test(post.slug)) return NextResponse.json({ error: "Ongeldige slug" }, { status: 400 });
  const published = post.published !== false;
  const sanitizedPost = { ...post, content: sanitizeBlogHtml(post.content) };
  const { error } = await createServiceClient().from("blog_posts").upsert({ slug: post.slug, payload: sanitizedPost, published, deleted: false, updated_at: new Date().toISOString(), updated_by: auth.identity.userId });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Slug ontbreekt" }, { status: 400 });
  const { error } = await createServiceClient().from("blog_posts").upsert({ slug, payload: {}, published: false, deleted: true, updated_by: auth.identity.userId });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
