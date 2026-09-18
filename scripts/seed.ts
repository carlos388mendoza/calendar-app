/**
 * Fake-data generator.
 *
 *   npm run seed                          # 12.000 eventos en ±6 meses
 *   npm run seed -- --count=20000
 *   npm run seed -- --months-back=3 --months-forward=3
 *   npm run seed -- --append              # no borra los eventos existentes
 *
 * Writes to whatever database TURSO_DATABASE_URL points to (local file or Turso).
 */

import { faker } from "@faker-js/faker";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { EVENT_COLOR_LIST } from "../lib/colors";
import { getDb, initSchema } from "../lib/db";
import type { EventColor } from "../types";

const DATE_TIME = "yyyy-MM-dd'T'HH:mm:ss";
const BATCH_SIZE = 500;

interface Options {
  count: number;
  monthsBack: number;
  monthsForward: number;
  reset: boolean;
}

interface Row {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  color: EventColor;
  allDay: boolean;
  createdAt: string;
  updatedAt: string;
}

function loadEnv(): void {
  const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
  try {
    proc.loadEnvFile?.(".env");
  } catch {
    // .env is optional
  }
}

function printHelp(): void {
  console.log(`
Generador de datos de prueba — Calendario de Eventos

Opciones:
  --count=<n>             Número de eventos a generar (default: 12000)
  --months-back=<n>       Meses hacia atrás desde hoy (default: 6)
  --months-forward=<n>    Meses hacia adelante desde hoy (default: 6)
  --append                No vacía la tabla antes de insertar
  --help                  Muestra esta ayuda

Ejemplo:
  npm run seed -- --count=15000 --months-back=4 --months-forward=8
`);
}

function parseArgs(argv: string[]): Options | null {
  const opts: Options = {
    count: 12000,
    monthsBack: 6,
    monthsForward: 6,
    reset: true,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") return null;
    if (arg === "--append") opts.reset = false;
    const [key, value] = arg.split("=");
    const n = Number(value);
    if (key === "--count" && Number.isFinite(n) && n > 0) opts.count = Math.floor(n);
    if (key === "--months-back" && Number.isFinite(n) && n >= 0) opts.monthsBack = Math.floor(n);
    if (key === "--months-forward" && Number.isFinite(n) && n >= 0)
      opts.monthsForward = Math.floor(n);
  }
  return opts;
}

function randomColor(): EventColor {
  return faker.helpers.arrayElement(EVENT_COLOR_LIST);
}

function makeTitle(): string {
  switch (faker.number.int({ min: 0, max: 7 })) {
    case 0:
      return `Reunión de ${faker.helpers.arrayElement([
        "equipo",
        "producto",
        "diseño",
        "marketing",
        "ventas",
        "ingeniería",
      ])}`;
    case 1:
      return `Sesión de ${faker.helpers.arrayElement([
        "planificación",
        "revisión",
        "brainstorming",
        "seguimiento",
      ])}`;
    case 2:
      return `${faker.helpers.arrayElement(["Cita", "Llamada", "Entrevista"])} con ${faker.person.fullName()}`;
    case 3:
      return `Taller de ${faker.helpers.arrayElement([
        "Next.js",
        "TypeScript",
        "Tailwind",
        "Zustand",
        "SQL",
        "React",
      ])}`;
    case 4:
      return `Revisión de ${faker.helpers.arrayElement(["sprint", "código", "diseño", "métricas"])}`;
    case 5:
      return faker.company.name();
    case 6:
      return `Demo: ${faker.commerce.productName()}`;
    default:
      return `Recordatorio: ${faker.company.buzzPhrase()}`;
  }
}

function randomPastIso(now: Date): string {
  const days = faker.number.int({ min: 0, max: 180 });
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

function baseRow(now: Date): Omit<Row, "startTime" | "endTime" | "allDay"> {
  const created = randomPastIso(now);
  return {
    id: crypto.randomUUID(),
    title: makeTitle(),
    description: faker.lorem.sentences({ min: 1, max: 3 }),
    color: randomColor(),
    createdAt: created,
    updatedAt: created,
  };
}

function buildAllDayRow(day: Date, now: Date): Row {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 0, 0);
  return {
    ...baseRow(now),
    allDay: true,
    startTime: format(start, DATE_TIME),
    endTime: format(end, DATE_TIME),
  };
}

function buildTimedRow(day: Date, now: Date): Row {
  const businessHours = Math.random() < 0.72;
  const hour = businessHours
    ? faker.number.int({ min: 8, max: 17 })
    : faker.number.int({ min: 0, max: 22 });
  const minute = faker.helpers.arrayElement([0, 15, 30, 45]);
  const duration = faker.helpers.arrayElement([15, 30, 45, 60, 60, 90, 120, 180]);

  const start = new Date(day);
  start.setHours(hour, minute, 0, 0);
  let end = new Date(start.getTime() + duration * 60_000);
  if (end.getDate() !== start.getDate() || end.getTime() <= start.getTime()) {
    end = new Date(start);
    end.setHours(23, 59, 0, 0);
  }

  return {
    ...baseRow(now),
    allDay: false,
    startTime: format(start, DATE_TIME),
    endTime: format(end, DATE_TIME),
  };
}

async function main(): Promise<void> {
  loadEnv();
  const opts = parseArgs(process.argv.slice(2));
  if (!opts) {
    printHelp();
    return;
  }

  const db = getDb();
  await initSchema();

  if (opts.reset) {
    await db.execute("DELETE FROM events");
    console.log("· Tabla 'events' vaciada.");
  }

  const now = new Date();
  const rangeStart = startOfMonth(addMonths(now, -opts.monthsBack));
  const rangeEnd = endOfMonth(addMonths(now, opts.monthsForward));
  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;

  console.log(
    `· Generando ${opts.count} eventos entre ${format(rangeStart, "dd/MM/yyyy")} y ${format(
      rangeEnd,
      "dd/MM/yyyy"
    )}…`
  );

  const rows: Row[] = [];
  for (let i = 0; i < opts.count; i++) {
    const day = addDays(rangeStart, faker.number.int({ min: 0, max: totalDays - 1 }));
    rows.push(faker.datatype.boolean(0.03) ? buildAllDayRow(day, now) : buildTimedRow(day, now));
  }

  // Días "pesados" para ejercitar la UI de "+N más".
  const heavyMonths = Math.min(2, opts.monthsBack);
  for (let m = -heavyMonths; m <= 0; m++) {
    const month = addMonths(now, m);
    const heavyDay = faker.date.between({ from: startOfMonth(month), to: endOfMonth(month) });
    const heavyCount = faker.number.int({ min: 120, max: 400 });
    for (let i = 0; i < heavyCount; i++) {
      rows.push(
        faker.datatype.boolean(0.05)
          ? buildAllDayRow(heavyDay, now)
          : buildTimedRow(heavyDay, now)
      );
    }
  }

  // Un día extremo (cientos de eventos en una sola fecha) en el mes actual.
  const extremeDay = faker.date.between({ from: startOfMonth(now), to: endOfMonth(now) });
  for (let i = 0; i < 600; i++) rows.push(buildTimedRow(extremeDay, now));

  console.log(`· Insertando ${rows.length} eventos en lotes de ${BATCH_SIZE}…`);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await db.batch(
      chunk.map((r) => ({
        sql: `INSERT INTO events (id, title, description, startTime, endTime, color, allDay, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          r.id,
          r.title,
          r.description,
          r.startTime,
          r.endTime,
          r.color,
          r.allDay ? 1 : 0,
          r.createdAt,
          r.updatedAt,
        ],
      })),
      "write"
    );
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
  process.stdout.write("\n");

  const totalRes = await db.execute("SELECT COUNT(*) AS n FROM events");
  const monthStart = format(startOfMonth(now), DATE_TIME);
  const monthEnd = format(addDays(endOfMonth(now), 1), DATE_TIME);
  const monthRes = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM events WHERE startTime >= ? AND startTime < ?",
    args: [monthStart, monthEnd],
  });

  console.log("✔ Seed completado");
  console.log(`  · Eventos totales:  ${Number(totalRes.rows[0]?.n ?? 0)}`);
  console.log(`  · En el mes actual: ${Number(monthRes.rows[0]?.n ?? 0)}`);
  console.log(`  · Rango:            ${format(rangeStart, "dd/MM/yyyy")} → ${format(rangeEnd, "dd/MM/yyyy")}`);
}

main().catch((err) => {
  console.error("\n✖ Error ejecutando el seed:", err);
  process.exitCode = 1;
});