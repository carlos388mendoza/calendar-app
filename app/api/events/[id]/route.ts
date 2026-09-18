import { NextResponse, type NextRequest } from "next/server";
import { deleteEvent, getEvent, initSchema, updateEvent } from "@/lib/db";
import { apiError } from "@/lib/http";
import { validateEventInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/events/:id */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSchema();
    const { id } = await params;
    const event = await getEvent(id);
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (e) {
    return apiError(e);
  }
}

/** PUT /api/events/:id — partial update. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSchema();
    const { id } = await params;
    const existing = await getEvent(id);
    if (!existing) {
      return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const merged = validateEventInput({ ...existing, ...(body ?? {}) });
    if (!merged.ok) {
      return NextResponse.json({ error: merged.error }, { status: 400 });
    }

    const updated = await updateEvent(id, merged.value);
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    return apiError(e);
  }
}

/** DELETE /api/events/:id */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSchema();
    const { id } = await params;
    await deleteEvent(id);
    return NextResponse.json({ id });
  } catch (e) {
    return apiError(e);
  }
}