import { isSameDay, parseISO } from "date-fns";
import { EVENT_COLOR_LIST } from "@/lib/colors";
import type { EventColor, EventInput } from "@/types";

export type ValidationResult =
  | { ok: true; value: EventInput }
  | { ok: false; error: string };

/** Shared server-side validation for event payloads. */
export function validateEventInput(body: unknown): ValidationResult {
  const b = (body ?? {}) as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const startTime = typeof b.startTime === "string" ? b.startTime : "";
  const endTime = typeof b.endTime === "string" ? b.endTime : "";
  const color = typeof b.color === "string" ? b.color : "";
  const allDay = Boolean(b.allDay);

  const start = startTime ? parseISO(startTime) : null;
  const end = endTime ? parseISO(endTime) : null;

  if (!title) {
    return { ok: false, error: "El título es obligatorio." };
  }
  if (title.length > 200) {
    return { ok: false, error: "El título no puede exceder 200 caracteres." };
  }
  if (description.length > 2000) {
    return { ok: false, error: "La descripción no puede exceder 2000 caracteres." };
  }
  if (!start || Number.isNaN(start.getTime())) {
    return { ok: false, error: "Fecha/hora de inicio inválida." };
  }
  if (!end || Number.isNaN(end.getTime())) {
    return { ok: false, error: "Fecha/hora de fin inválida." };
  }
  if (!EVENT_COLOR_LIST.includes(color as EventColor)) {
    return { ok: false, error: "Color de categoría inválido." };
  }
  if (end.getTime() <= start.getTime()) {
    return { ok: false, error: "El fin debe ser posterior al inicio." };
  }
  // Timed events must happen within a single day (keeps the grid layout simple).
  if (!allDay && !isSameDay(start, end)) {
    return { ok: false, error: "Los eventos con hora deben ocurrir dentro de un mismo día." };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      startTime,
      endTime,
      color: color as EventColor,
      allDay,
    },
  };
}