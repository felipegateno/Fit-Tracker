# STATUS.md — Fit-Tracker Viz

## Estado General: 🟡 En progreso

---

## Tarea 1 — Identificación de schema Supabase

**Estado:** ✅ Completada (2026-04-14)

### Schema — NutriBot

#### `foods`
```
id                uuid PK
name              text NOT NULL
name_aliases      text[]
calories_per_100g numeric
protein_per_100g  numeric
carbs_per_100g    numeric
fat_per_100g      numeric
fiber_per_100g    numeric
source            text
confidence_score  numeric
use_count         integer
created_at        timestamptz
updated_at        timestamptz
```

#### `food_log`
```
id          uuid PK
user_id     text  (Telegram user ID como string, e.g. "8254792740")
food_id     uuid FK → foods.id
quantity_g  numeric
meal_type   text  (breakfast, lunch, dinner, snack)
calories    numeric
protein_g   numeric
carbs_g     numeric
fat_g       numeric
fiber_g     numeric
raw_input   text
logged_at   timestamptz
```
> ⚠️ Nombre real: `food_log` (no `food_logs`)

#### `daily_goals`
```
id              uuid PK
user_id         text
calories_goal   integer
protein_goal_g  integer
carbs_goal_g    integer
fat_goal_g      integer
active_from     date
```
> No tiene `fiber_goal_g` en el schema actual.

#### `pending_confirmations`
```
id                uuid PK
user_id           text
original_text     text
quantity_g        numeric
meal_type         text
suggested_food_id uuid FK → foods.id
status            text  (confirmed, pending, rejected)
expires_at        timestamptz
created_at        timestamptz
extra_data        jsonb
```

---

### Schema — Garmin

> ✅ Todas las tablas existen con datos reales.

#### `garmin_activities`
```
id                         uuid PK
user_id                    text (nullable actualmente)
activity_id                bigint UNIQUE
date                       date
activity_type              text  (ver mapeo abajo)
name                       text
duration_seconds           integer
distance_meters            numeric
avg_hr                     integer
max_hr                     integer
calories                   integer
training_load              numeric
training_effect_aerobic    numeric
training_effect_anaerobic  numeric
vo2max_value               numeric
avg_pace_sec_km            numeric
avg_power_watts            numeric
elevation_gain_m           numeric
synced_at                  timestamptz
```

**Tipos de actividad existentes:**
`cycling`, `hiking`, `indoor_cycling`, `open_water_swimming`, `other`, `running`, `strength_training`, `trail_running`, `treadmill_running`, `walking`, `yoga`

**Mapeo a categorías del dashboard:**
| Garmin type | Categoría UI | Color |
|---|---|---|
| strength_training, yoga, other | Gimnasio | `#534AB7` |
| running, treadmill_running, trail_running | Running | `#D85A30` |
| hiking | Trekking | `#0F6E56` |
| cycling, indoor_cycling | Bicicleta | `#BA7517` |
| walking | Caminata | `#85B7EB` |
| open_water_swimming | Natación | `#4A9CC4` |

#### `garmin_daily_health`
```
id                    uuid PK
user_id               text (nullable actualmente)
date                  date UNIQUE
total_steps           integer
step_goal             integer
active_calories       integer
total_calories        integer
resting_hr            integer
min_hr                integer
max_hr                integer
avg_stress            integer
max_stress            integer
body_battery_charged  integer
body_battery_drained  integer
body_battery_highest  integer
body_battery_lowest   integer
floors_climbed        integer
intensity_minutes     integer
synced_at             timestamptz
```
> ⚠️ Nombre real: `garmin_daily_health` (no `garmin_daily_stats`). Tiene datos desde 2016-04-16.

#### `garmin_sleep`
```
id                   uuid PK
user_id              text (nullable)
date                 date
sleep_start          timestamptz
sleep_end            timestamptz
total_sleep_seconds  integer
deep_sleep_seconds   integer
light_sleep_seconds  integer
rem_sleep_seconds    integer
awake_seconds        integer
sleep_score          integer
avg_spo2             numeric
avg_respiration      numeric
avg_sleeping_hr      numeric
synced_at            timestamptz
```

#### `garmin_hrv`
```
id               uuid PK
user_id          text (nullable)
date             date
hrv_weekly_avg   numeric
hrv_last_night   numeric
hrv_status       text  (BALANCED, UNBALANCED, etc.)
hrv_baseline_low numeric
hrv_baseline_high numeric
synced_at        timestamptz
```

#### `garmin_training_readiness`
```
id              uuid PK
user_id         text (nullable)
date            date
score           integer  (0-100)
level           text  (HIGH, MODERATE, LOW)
hrv_factor      numeric
sleep_factor    numeric
stress_factor   numeric
recovery_factor numeric
synced_at       timestamptz
```

#### `garmin_activity_hr_zones`
```
id             uuid PK
user_id        text (nullable)
activity_id    bigint FK → garmin_activities.activity_id
date           date
zone1_seconds  numeric
zone2_seconds  numeric
zone3_seconds  numeric
zone4_seconds  numeric
zone5_seconds  numeric
synced_at      timestamptz
```

#### `garmin_health_status`
```
id             uuid PK
user_id        text (nullable)
date           date
overall_status text (nullable, raramente poblado)
synced_at      timestamptz
```

#### `garmin_training_status`
```
id        uuid PK
user_id   text (nullable)
date      date
status    text (nullable, raramente poblado)
synced_at timestamptz
```

#### `garmin_calories`
```
-- Tabla existe pero está vacía actualmente.
```

---

### Funciones RPC existentes

| Función | Parámetros | Retorna | Notas |
|---|---|---|---|
| `get_daily_totals` | `p_user_id text, p_date date` | `[{total_calories, total_protein, total_carbs, total_fat, entry_count}]` | ⚠️ No retorna fiber. Sin filtro_fiber_g en tabla daily_goals |
| `search_food` | `query text` | `foods[]` | Para búsqueda de alimentos |

> ⚠️ `get_daily_totals` retorna: `total_calories, total_protein, total_carbs, total_fat, entry_count` — los nombres difieren de lo documentado anteriormente.

### Hallazgos

1. **`food_log`** (no `food_logs`) — nombre de tabla diferente al wireframe.
2. **`garmin_daily_health`** (no `garmin_daily_stats`) — tabla existe con datos reales desde 2016.
3. Todas las tablas Garmin tienen `user_id` nullable actualmente (sync externo no lo setea).
4. **256 actividades** registradas con 11 tipos distintos.
5. `garmin_health_status` y `garmin_training_status` tienen `status = null` mayoritariamente.
6. `garmin_calories` está vacía — usar `garmin_daily_health.active_calories` y `total_calories`.
7. `daily_goals` no tiene `fiber_goal_g` — fibra no tiene meta configurada.
8. **`get_daily_totals` no retorna fiber** — calcular desde `food_log` directamente si se necesita.
9. Datos de sueño (SpO₂, score) disponibles en `garmin_sleep` — tabla separada de salud diaria.
10. **Training Readiness** disponible (`score 0-100`, `level HIGH/MODERATE/LOW`) — dato extra valioso para el dashboard.

### Decisiones

- `garmin_daily_health` → usar para KPIs de pasos, calorías quemadas, FC en reposo, estrés y body battery.
- `garmin_sleep` → usar para KPI de sueño y SpO₂.
- `garmin_hrv` → mostrar en HealthGrid.
- `garmin_training_readiness` → mostrar como métrica extra en HealthGrid.
- Para fibra en MacroCard: calcular con `SUM(fiber_g)` desde `food_log` directamente.
- Para balance energético 7 días: `food_log` (consumidas) vs `garmin_daily_health.active_calories` (quemadas).
- `user_id` en NutriBot es string `"8254792740"` → pasar siempre como texto en queries.

---

## Tarea 2 — Implementación del wireframe con datos reales

**Estado:** 🟡 En progreso

### Subtareas

#### 2.1 — Setup del proyecto
**Estado:** ✅ Completada

#### 2.2 — TopNav + DateBar
**Estado:** ✅ Completada

#### 2.3 — KPIs y tarjeta de balance
**Estado:** ✅ Completada

#### 2.4 — Macros
**Estado:** ✅ Completada

#### 2.5 — Balance energético 7 días
**Estado:** ✅ Completada

#### 2.6 — Pasos diarios
**Estado:** ✅ Completada

#### 2.7 — Calendario de entrenamientos
**Estado:** ✅ Completada

#### 2.8 — Datos de salud
**Estado:** ✅ Completada

#### 2.9 — Deploy y QA
**Estado:** ⬜ Pendiente

### Hallazgos
> Completar durante la implementación.

### URL de Deploy
> Pendiente.

---

## Decisiones Técnicas

| Decisión | Razonamiento |
|---|---|
| Next.js App Router | Server Components para fetch seguro sin exponer keys |
| Recharts | Librería más madura para este tipo de charts, buen soporte con Tailwind |
| Supabase Auth | Ya es el auth de NutriBot, evita duplicar sistema |
| Mobile-first (max-width: 480px centrado) | Usuario principal accede desde celular |
| Mock tipado si Garmin no existe | No bloquear UI por datos faltantes, schema queda listo para cuando se integre |
| Sin auth en dashboard | Dashboard personal, proteger con Supabase RLS o Vercel password si se necesita |
