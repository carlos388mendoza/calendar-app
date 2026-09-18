# 📅 Calendario de Eventos

Aplicación de calendario tipo dashboard SaaS construida con **Next.js (App Router)**,
**TypeScript estricto**, **Tailwind CSS** y **Zustand**, con persistencia real en una
base de datos **Turso / libSQL**.

Diseñada para manejar **+10.000 eventos en un mismo mes** sin degradar el rendimiento,
mediante carga por rango, agregación por día, patrón "+N más" y virtualización.

---

## ✨ Características

- **CRUD completo de eventos** desde la UI (modal): crear, leer, actualizar y eliminar.
- Cada evento tiene: **título, descripción, fecha/hora de inicio, fecha/hora de fin y color/categoría**.
- **Tres vistas intercambiables**: Día, Semana y Mes, con navegación anterior / siguiente / hoy.
- **Rendimiento con +10.000 eventos**: sólo se piden a la API los eventos del rango visible,
  se agrupan por día y cada celda del mes muestra máximo 3 eventos + un botón **"+N más"**
  que abre una lista **virtualizada** (similar a Google Calendar).
- **Búsqueda** por título/descripción con resultados que navegan a la fecha del evento.
- **Drag & drop**:
  - Mes: arrastra un evento a otro día (HTML5 drag & drop).
  - Día/Semana: mueve eventos entre días y horas, y **redimensiona su duración**
    arrastrando el borde inferior (pointer events + snapping a 30 min).
  - Franja "Todo el día" con arrastre entre columnas.
- **Persistencia en base de datos externa** (Turso/libSQL) a través de API Routes de Next.js.
- **Script de seed** con `@faker-js/faker` que genera **miles de eventos** de prueba
  distribuidos en varios meses (por defecto 12.000 + días "pesados").
- **Diseño responsive**: sidebar colapsable en mobile, vista semanal con scroll horizontal,
  calendario fluido en tablet y desktop.
- **Estados de carga y manejo de errores** con reintento.

---

## 🧱 Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 |
| Lenguaje | TypeScript (modo `strict`) |
| Estilos | Tailwind CSS v4 |
| Estado | Zustand |
| Fechas | date-fns (locale `es`) |
| Base de datos | Turso / libSQL (`@libsql/client`) |
| Virtualización | react-window |
| Iconos | lucide-react |
| Datos falsos | @faker-js/faker + tsx |

> Nota: el proyecto apunta a Next.js 14+; se desarrolló y verificó con Next.js 15.

---

## 📸 Capturas de pantalla

> Reemplaza los placeholders por capturas reales en `docs/screenshots/`.

| Vista | Archivo |
| --- | --- |
| Vista de mes con "+N más" | `![Vista de mes](docs/screenshots/month.png)` |
| Vista de semana con drag & drop | `![Vista de semana](docs/screenshots/week.png)` |
| Vista de día | `![Vista de día](docs/screenshots/day.png)` |
| Modal de evento | `![Modal de evento](docs/screenshots/event-modal.png)` |
| Búsqueda lateral | `![Búsqueda](docs/screenshots/search.png)` |

_(Los archivos de imagen no se incluyen; colócalos en `docs/screenshots/`.)_

---

## 🗂️ Estructura del proyecto

```
calendar-app/
├── app/
│   ├── layout.tsx                 # Layout raíz (metadata, fuente, globals)
│   ├── page.tsx                   # Página principal
│   ├── globals.css                # Tailwind v4 + utilidades
│   └── api/
│       └── events/
│           ├── route.ts           # GET (rango) + POST (crear)
│           ├── [id]/route.ts      # GET / PUT / DELETE por id
│           └── search/route.ts    # GET búsqueda por texto
├── components/
│   ├── CalendarShell.tsx          # Composición general + carga de rango
│   ├── CalendarHeader.tsx         # Título, navegación y selector de vista
│   ├── Sidebar.tsx                # Sidebar responsive
│   ├── SearchBox.tsx              # Buscador con debounce + resultados
│   ├── UpcomingList.tsx           # Próximos eventos
│   ├── EventModal.tsx             # Enrutador de modales
│   ├── EventForm.tsx              # Formulario crear/editar
│   ├── EventDetail.tsx            # Detalle + eliminar
│   ├── OverflowModal.tsx          # Lista virtualizada de un día ("+N más")
│   ├── calendar/
│   │   ├── MonthView.tsx          # Grilla mensual + "+N más" + DnD
│   │   ├── TimeGridView.tsx       # Día/Semana + DnD + resize
│   │   └── EventChip.tsx          # Chip de evento memoizado
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Card.tsx
│       └── Badge.tsx
├── store/
│   └── useCalendarStore.ts        # Estado global (Zustand)
├── lib/
│   ├── api.ts                     # Cliente tipado de la API
│   ├── db.ts                      # Capa de acceso a Turso/libSQL
│   ├── dates.ts                   # Utilidades de fecha
│   ├── colors.ts                  # Paleta pastel por categoría
│   ├── validation.ts              # Validación de payloads (servidor)
│   ├── http.ts                    # Normalización de errores de API
│   └── cn.ts                      # Helper de clases
├── types/
│   └── index.ts                   # Event, CalendarView, EventColor, ModalState…
├── scripts/
│   └── seed.ts                    # Generador de datos falsos
├── docs/screenshots/              # Placeholders de capturas
├── .env.example
└── README.md
```

---

## 🚀 Instalación y uso

### Requisitos

- Node.js **>= 18.18** (probado en Node 24)
- npm (o pnpm/yarn equivalente)

### 1. Instalar dependencias

```bash
cd calendar-app
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env`. Para desarrollo local **no necesitas ninguna cuenta**:
usa una base de datos de archivo.

```bash
cp .env.example .env
```

```dotenv
# ─── Base de datos ────────────────────────────────────────────────────────────
# Desarrollo local (sin cuenta, archivo local):
TURSO_DATABASE_URL=file:./data/calendar.db

# Producción (Turso remoto):
# TURSO_DATABASE_URL=libsql://<tu-db>.<tu-org>.turso.io
# TURSO_AUTH_TOKEN=<tu-token>
```

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Sí | URL de libSQL. `file:...` en local o `libsql://...` en Turso. |
| `TURSO_AUTH_TOKEN` | Sólo en remoto | Token de acceso de Turso. Se ignora en modo archivo. |

El esquema (`events` + índices) se crea automáticamente en la primera petición a la API.

### 3. Generar datos de prueba (seed)

```bash
npm run seed
```

Genera **12.000 eventos** distribuidos en ±6 meses alrededor de hoy, además de varios
días "pesados" (cientos de eventos en una fecha) para poner a prueba el patrón "+N más".
Por defecto **vacía la tabla** antes de insertar.

```bash
# Opciones disponibles
npm run seed -- --count=20000            # más eventos
npm run seed -- --months-back=3 --months-forward=9
npm run seed -- --append                 # no borra los existentes
npm run seed -- --help
```

### 4. Levantar la app

```bash
npm run dev
# http://localhost:3000
```

Build de producción:

```bash
npm run build
npm run start
```

---

## 📜 Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint (config de Next). |
| `npm run typecheck` | `tsc --noEmit` (TypeScript estricto). |
| `npm run seed` | Genera e inserta datos falsos. |

---

## 🔌 API Routes

Todas las rutas usan el runtime de Node.js y validan los datos en el servidor.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/events?start=<ISO>&end=<ISO>` | Eventos que solapan el rango. |
| `POST` | `/api/events` | Crea un evento. |
| `GET` | `/api/events/:id` | Obtiene un evento. |
| `PUT` | `/api/events/:id` | Actualiza parcialmente un evento. |
| `DELETE` | `/api/events/:id` | Elimina un evento. |
| `GET` | `/api/events/search?q=<texto>` | Busca por título/descripción (LIKE, límite 60). |

**Payload de evento**

```jsonc
{
  "title": "Reunión de equipo",
  "description": "Sprint planning",
  "startTime": "2026-09-20T10:00:00",
  "endTime": "2026-09-20T11:00:00",
  "color": "emerald",   // sky|rose|amber|emerald|violet|cyan|orange|lime
  "allDay": false
}
```

---

## 🧠 Decisiones técnicas

### ¿Por qué Turso / libSQL?

- Es **SQLite serverless**: sintaxis SQL familiar, sin servidor que administrar y con **plan gratuito**.
- El cliente `@libsql/client` acepta tanto `file:./data/calendar.db` (desarrollo local sin
  cuenta ni red) como `libsql://...` (producción). **El mismo código y el mismo seed**
  funcionan en ambos entornos, cambiando sólo las variables de entorno.
- Evita atarse a un proveedor pesado; migrar o borrar la base es trivial.

### Cómo se resuelven los +10.000 eventos

1. **Carga por rango visible**: el cliente calcula el rango (mes/semana/día), y
   `GET /api/events?start&end` devuelve **sólo** los eventos que solapan ese rango.
   La tabla tiene **índices** en `startTime` y `endTime`.
2. **Agregación por día** en un `Map` en memoria (`MonthView`), memoizada: se recorre una
   sola vez el rango cargado, no se renderizan los 10.000 eventos.
3. **Tope por celda + "+N más"**: cada celda muestra 3 eventos y un botón con el resto.
   Con ~42 celdas como máximo se montan ~126 chips, sin importar cuántos eventos haya.
4. **Virtualización** (`react-window`) en el modal que lista **todos** los eventos de un día:
   un día con 600+ eventos sólo renderiza las filas visibles.
5. **Día/Semana** con layout de columnas greedy y tope de columnas; el excedente se
   colapsa en un chip **"+N"**.
6. **Estado eficiente**: Zustand con un `Map<id, Event>` (lookup O(1)), selectores por
   slice para minimizar re-renders y `EventChip` memoizado.
7. **Caché por rango**: `rangeKey` evita refetch al alternar vistas dentro del mismo rango.
8. **Actualizaciones optimistas** con *rollback* si la API falla.

### Drag & drop

- **Mes y franja "Todo el día"**: HTML5 drag & drop nativo (simple y accesible).
- **Día/Semana**: implementación propia con **pointer events** para poder mover en dos
  ejes (día + hora) y **redimensionar** la duración, con *snapping* a 30 minutos y
  preview en vivo. Se evita así una dependencia extra y se obtiene semántica de calendario
  precisa (`clientX/clientY` → columna/día y minuto).

### Otras decisiones

- **TypeScript estricto** y tipos de dominio (`Event`, `CalendarView`, `EventColor`,
  `ModalState`).
- **Validación doble** (cliente y servidor): título obligatorio, fin > inicio y, para
  eventos con hora, mismo día.
- **Fechas locales** con `date-fns` (locale `es`).
- **Tailwind v4** con clases literales en el mapa de colores para que el scanner las detecte.

---

## ⚠️ Limitaciones conocidas

- Los eventos **con hora** deben ocurrir dentro de un **mismo día** (regla aplicada en el
  formulario y en la API). Los eventos de **todo el día** sí pueden abarcar varios días.
- El seed es **reproducible** (semilla fija): cada ejecución genera el mismo dataset.
- No hay autenticación ni multiusuario (es un ejercicio técnico).

## 🔮 Mejoras futuras

- Recurrencia de eventos (RRULE) y zonas horarias.
- WebSockets / suscripciones en tiempo real.
- Tests E2E (Playwright) y de integración de la API.
- Paginación o keyset en el endpoint de rango para rangos muy grandes.

---

## 🧾 Licencia

Uso libre para fines de evaluación técnica.
