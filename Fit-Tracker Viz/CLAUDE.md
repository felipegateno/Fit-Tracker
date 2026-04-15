# CLAUDE.md — Fit-Tracker Viz

## Contexto
Dashboard web para visualización de datos nutricionales y de actividad física.
Stack: Next.js 14 (App Router) + Supabase + Vercel.
Los datos vienen de dos fuentes ya pobladas en Supabase:
- **NutriBot** (Telegram bot): registros de alimentos, metas calóricas, catálogo de foods.
- **Garmin**: actividades, pasos, métricas de salud (sync externo).

Proyecto Supabase: `zynzkxlgvfmjoayeiscv`

## Guía de Referencia
- **Estado del proyecto:** `STATUS.md` — tareas, progreso y decisiones.
- **Wireframe de referencia:** Ver conversación con Claude (claude.ai) — layout mobile-first con 6 secciones.
- **Schema Supabase:** Documentado en `STATUS.md` tras completar Tarea 1.

## Reglas de Oro

1. **Sin preámbulos:** Respuestas directas y técnicas.
2. **Mobile-first siempre:** Todos los componentes se diseñan para 375px y escalan hacia arriba.
3. **Leer STATUS.md primero:** Antes de cualquier implementación, verificar el estado actual de cada tarea.
4. **No inventar schema:** Nunca asumir nombres de tablas o columnas — consultar el schema documentado en `STATUS.md` → Tarea 1.
5. **Server Components por defecto:** Fetch de datos en Server Components. Solo usar `"use client"` cuando se necesite interactividad (charts, date picker).
6. **Variables de entorno:** Nunca hardcodear URLs o keys. Usar siempre `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. **Un archivo por componente:** Cada chart o sección del dashboard es su propio componente en `/components`.
8. **Mantenimiento:** Al completar cada subtarea, actualizar `STATUS.md` con el estado y cualquier hallazgo relevante.

## Stack Técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| UI / estilos | Tailwind CSS + shadcn/ui |
| Deploy | Vercel |

## Estructura de Carpetas

```
fit-tracker-viz/
├── app/
│   ├── page.tsx                  # Dashboard principal
│   ├── layout.tsx                # Layout con TopNav
│   └── api/
│       ├── nutrition/route.ts    # Endpoint calorías + macros
│       ├── activity/route.ts     # Endpoint Garmin actividades + pasos
│       └── health/route.ts       # Endpoint métricas de salud
├── components/
│   ├── TopNav.tsx
│   ├── DateBar.tsx               # Pills Hoy / 7 días / 30 días + date picker
│   ├── KpiGrid.tsx               # 4 tarjetas KPI + tarjeta balance
│   ├── MacroCard.tsx             # Barras + donuts de macros
│   ├── EnergyBalanceChart.tsx    # Bar chart consumidas vs quemadas
│   ├── StepsChart.tsx            # Bar chart pasos 7 días
│   ├── WorkoutCalendar.tsx       # Calendario con colores por tipo
│   └── HealthGrid.tsx            # Grid métricas Garmin
├── lib/
│   ├── supabase.ts               # Client singleton (server + browser)
│   └── utils.ts                  # Formatters de fecha, números
├── types/
│   └── index.ts                  # Tipos TypeScript del schema
├── .env.local                    # Variables de entorno (no commitear)
└── STATUS.md
```

## Variables de Entorno Requeridas

Ubicadas en .env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zynzkxlgvfmjoayeiscv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>   # Solo para API routes server-side
```

## Convenciones de Código

- Fechas: siempre en ISO 8601 (`YYYY-MM-DD`). Usar `date-fns` para manipulación.
- Números en pantalla: siempre con `toLocaleString('es-CL')` o `Math.round()`.
- Colores de actividad (consistentes con wireframe):
  - Gimnasio: `#534AB7`
  - Running: `#D85A30`
  - Trekking: `#0F6E56`
  - Bicicleta: `#BA7517`
  - Caminata: `#85B7EB`
- Colores de macros:
  - Proteína: `#1D9E75`
  - Carbohidratos: `#378ADD`
  - Grasas: `#EF9F27`
  - Fibra: `#97C459`

## Notas Operativas

- El proyecto Supabase ya tiene datos reales — no crear datos de prueba en producción.
- Las funciones RPC existentes (`search_food`, `get_daily_totals`) pueden reutilizarse desde el dashboard.
- Si una tabla de Garmin no existe aún, documentarlo en `STATUS.md` y usar datos mock tipados para no bloquear la implementación del UI.
- Vercel preview deploys se usan para revisar cada tarea antes de merge a `main`.
