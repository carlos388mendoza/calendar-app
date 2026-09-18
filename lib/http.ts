import { NextResponse } from "next/server";

/** Normalizes an unknown thrown value into a JSON error response. */
export function apiError(e: unknown, fallbackStatus = 500): NextResponse {
  const message = e instanceof Error ? e.message : "Error interno del servidor";
  console.error("[api]", message, e);
  return NextResponse.json({ error: message }, { status: fallbackStatus });
}