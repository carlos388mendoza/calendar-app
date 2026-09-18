import { NextResponse } from "next/server";
import { initSchema, searchEvents } from "@/lib/db";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/events/search?q= — full-text-ish search over title/description. */
export async function GET(request: Request) {
  try {
    await initSchema();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return NextResponse.json([]);
    }
    const results = await searchEvents(q);
    return NextResponse.json(results);
  } catch (e) {
    return apiError(e);
  }
}