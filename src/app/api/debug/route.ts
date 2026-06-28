import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    url_length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length ?? 0,
    key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    key_length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
    node_env: process.env.NODE_ENV,
  });
}
