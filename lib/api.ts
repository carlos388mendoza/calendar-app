import type { Event, EventInput, EventUpdate } from "@/types";

/** Thin typed client for the Next.js API routes. */

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore malformed body */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function fetchEvents(startIso: string, endIso: string): Promise<Event[]> {
  const params = new URLSearchParams({ start: startIso, end: endIso });
  return request<Event[]>(`/api/events?${params.toString()}`);
}

export function fetchEvent(id: string): Promise<Event> {
  return request<Event>(`/api/events/${encodeURIComponent(id)}`);
}

export function createEvent(input: EventInput): Promise<Event> {
  return request<Event>("/api/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(id: string, patch: EventUpdate): Promise<Event> {
  return request<Event>(`/api/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deleteEvent(id: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/api/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function searchEvents(q: string): Promise<Event[]> {
  const params = new URLSearchParams({ q });
  return request<Event[]>(`/api/events/search?${params.toString()}`);
}