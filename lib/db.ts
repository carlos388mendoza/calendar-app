import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Event, EventColor, EventInput, EventUpdate } from "@/types";

/**
 * Database access for this project.
 *
 * Uses Turso / libSQL: a free, serverless SQLite database.
 *  - Local development:  TURSO_DATABASE_URL=file:./data/calendar.db
 *  - Production:         TURSO_DATABASE_URL=libsql://<db>.<org>.turso.io
 *                        TURSO_AUTH_TOKEN=<token>
 *
 * A single shared client is cached for the lifetime of the process.
 */

interface EventRow extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  color: string;
  allDay: number | boolean;
  createdAt: string;
  updatedAt: string;
}

let client: Client | null = null;
let cachedUrl: string | null = null;
let cachedToken: string | undefined;

/** Make sure the parent folder exists for local file-based databases. */
function ensureFileDirectory(url: string): void {
  if (!url.startsWith("file:")) return;
  const raw = url.slice("file:".length);
  const filePath = resolve(process.cwd(), raw);
  mkdirSync(dirname(filePath), { recursive: true });
}

export function getDb(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/calendar.db";
  const token = process.env.TURSO_AUTH_TOKEN || undefined;

  if (!client || cachedUrl !== url || cachedToken !== token) {
    ensureFileDirectory(url);
    client = createClient({ url, authToken: token });
    cachedUrl = url;
    cachedToken = token;
  }
  return client;
}

export async function initSchema(): Promise<void> {
  const db = getDb();
  await db.executeMultiple(
    `CREATE TABLE IF NOT EXISTS events (
       id          TEXT PRIMARY KEY,
       title       TEXT NOT NULL,
       description TEXT NOT NULL DEFAULT '',
       startTime   TEXT NOT NULL,
       endTime     TEXT NOT NULL,
       color       TEXT NOT NULL DEFAULT 'sky',
       allDay      INTEGER NOT NULL DEFAULT 0,
       createdAt   TEXT NOT NULL,
       updatedAt   TEXT NOT NULL
     );
     CREATE INDEX IF NOT EXISTS idx_events_start ON events (startTime);
     CREATE INDEX IF NOT EXISTS idx_events_end   ON events (endTime);`
  );
}

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.startTime,
    endTime: row.endTime,
    color: row.color as EventColor,
    allDay: Boolean(row.allDay),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const COLUMNS =
  "id, title, description, startTime, endTime, color, allDay, createdAt, updatedAt";

export async function listEventsInRange(
  startIso: string,
  endIso: string
): Promise<Event[]> {
  const db = getDb();
  const rs = await db.execute({
    sql: `SELECT ${COLUMNS} FROM events
          WHERE startTime < ? AND endTime > ?
          ORDER BY startTime ASC`,
    args: [endIso, startIso],
  });
  return rs.rows.map((r) => toEvent(r as unknown as EventRow));
}

export async function getEvent(id: string): Promise<Event | null> {
  const db = getDb();
  const rs = await db.execute({
    sql: `SELECT ${COLUMNS} FROM events WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const row = rs.rows[0];
  return row ? toEvent(row as unknown as EventRow) : null;
}

export async function insertEvent(input: EventInput): Promise<Event> {
  const now = new Date().toISOString();
  const event: Event = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO events (id, title, description, startTime, endTime, color, allDay, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      event.id,
      event.title,
      event.description,
      event.startTime,
      event.endTime,
      event.color,
      event.allDay ? 1 : 0,
      event.createdAt,
      event.updatedAt,
    ],
  });
  return event;
}

const UPDATABLE: Record<keyof EventInput, string> = {
  title: "title",
  description: "description",
  startTime: "startTime",
  endTime: "endTime",
  color: "color",
  allDay: "allDay",
};

function serializeValue(key: string, value: unknown): string | number {
  return key === "allDay" ? (value ? 1 : 0) : String(value);
}

export async function updateEvent(
  id: string,
  patch: EventUpdate
): Promise<Event> {
  const db = getDb();
  const keys = Object.keys(patch) as (keyof EventInput)[];
  if (keys.length > 0) {
    const sets = keys.map((k) => `${UPDATABLE[k]} = ?`);
    const args = keys.map((k) => serializeValue(k, patch[k]));
    await db.execute({
      sql: `UPDATE events SET ${sets.join(", ")}, updatedAt = ? WHERE id = ?`,
      args: [...args, new Date().toISOString(), id],
    });
  }
  const updated = await getEvent(id);
  if (!updated) throw new Error(`Event ${id} no encontrado tras actualizar`);
  return updated;
}

export async function deleteEvent(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: "DELETE FROM events WHERE id = ?", args: [id] });
}

export async function searchEvents(q: string, limit = 60): Promise<Event[]> {
  const db = getDb();
  const like = `%${q.trim().toLowerCase()}%`;
  const rs = await db.execute({
    sql: `SELECT ${COLUMNS} FROM events
          WHERE lower(title) LIKE ? OR lower(description) LIKE ?
          ORDER BY startTime ASC
          LIMIT ?`,
    args: [like, like, limit],
  });
  return rs.rows.map((r) => toEvent(r as unknown as EventRow));
}

export async function totalCount(): Promise<number> {
  const db = getDb();
  const rs = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM events",
    args: [],
  });
  return Number(rs.rows[0]?.n ?? 0);
}