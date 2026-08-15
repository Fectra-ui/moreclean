import { NextRequest, NextResponse } from "next/server";
import { getApiIdentity } from "@/lib/auth/apiAuth";
import { createServiceClient } from "@/lib/supabase/server";

const TYPES: Record<string,string> = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp" };
export async function POST(req: NextRequest) {
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const file = (await req.formData()).get("file") as File | null;
  const ext = file && TYPES[file.type];
  if (!file || !ext || file.size > 5*1024*1024) return NextResponse.json({ error: "Gebruik JPG, PNG of WEBP tot 5MB" }, { status: 400 });
  const service = createServiceClient();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await service.storage.from("blog-images").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: service.storage.from("blog-images").getPublicUrl(path).data.publicUrl });
}
