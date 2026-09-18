import { NextResponse } from "next/server";
import { initSchema, insertEvent, listEventsInRange } from "@/lib/db";
import { apiError } from "@/lib/http";
import { validateEventInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/events?start=<ISO>&end=<ISO> — events overlapping the range. */
export async function GET(request: Request) {
  try {
    await initSchema();
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (!start || !end) {
      return NextResponse.json(
        { error: "Parámetros 'start' y 'end' (ISO) son obligatorios." },
        { status: 400 }
      );
    }
    const events = await listEventsInRange(start, end);
    return NextResponse.json(events);
  } catch (e) {
    return apiError(e);
  }
}

/** POST /api/events — create an event. */
export async function POST(request: Request) {
  try {
    await initSchema();
    const body = await request.json().catch(() => null);
    const validated = validateEventInput(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const event = await insertEvent(validated.value);
    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    return apiError(e);
  }
}