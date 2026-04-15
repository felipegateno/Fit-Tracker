# Estado del Proyecto — NutriBot

# Estado del Proyecto

## ✅ Completado
- WF01: Dispatcher único (message + callback_query). Rutas: REGISTER → log, QUERY_DAY/WEEK/DELETE_FOOD/SET_GOAL/ADD_FOOD/QUERY_CATALOG → WF03 vía Execute Workflow, callback_query → WF02 vía Execute Workflow.
- WF02: Confirmaciones (confirm_yes/no, new_yes/no) + borrado por callback (delete_pick/yes/no/cancel). Trigger: Execute Workflow (no Telegram).
- WF03: Consultas diarias/semanales, eliminación flexible, SET_GOAL, ADD_FOOD, QUERY_CATALOG. Trigger: Execute Workflow.
- DB: Migración de 518 alimentos y funciones RPC.
- WF01 Bug Fix: Parse JSON Response ahora retorna objeto de error en lugar de lanzar excepción; IF Check Parse Error intercepta y envía mensaje Telegram al usuario.
- WF01 Bug Fix: Evaluate Match detecta `matchLevel = 'MULTI'` cuando hay más de 1 resultado con score ≥ 0.4; Save Pending Multi + Build Pick Keyboard + Send Pick Keyboard envían inline keyboard con hasta 4 opciones + "No es ninguna".
- WF02: Nuevos callbacks `pick_food_<pendingId>_<foodId>` y `pick_none_<pendingId>` — rutas completas de registro y cancelación implementadas.
- WF02 Bug Fix: `Extract Candidate Food` y `PATCH Pending Rejected PICK NONE` desconectadas de output 0 (confirm_yes) y reconectadas a outputs 4 (pick_food) y 5 (pick_none) correctamente.
- WF02 Bug Fix: `Route by Delete Action` output 3 (delete_cancel) conectado a `Send Delete Cancelled` (antes sin conexión).
- Bug Fix SET_GOAL: WF03 ahora maneja intent SET_GOAL — `AI Parse Goal` → `Build Goal Body` → `Upsert Daily Goal` (POST con Prefer: resolution=merge-duplicates) → `Send Goal Confirmation`. WF01 pasa `text` a WF03 vía Resolve Date.
- Mejora: WF01 maneja mensajes no-texto (foto, audio, sticker, etc.) — `Detect Intent` detecta ausencia de texto y retorna intent `UNSUPPORTED`; `Route by Intent` (fallback output 7) lo despacha a `Send Unsupported`.
- Mejora: ADD_FOOD — usuario puede agregar alimentos al catálogo indicando nombre y macros opcionales. WF01 detecta intent `ADD_FOOD`; WF03 maneja con `AI Parse Add Food` → `Build Food Insert` → `Insert Food Catalog` (Supabase) → `Send Food Added`.
- Mejora: QUERY_CATALOG — usuario puede buscar alimentos en el catálogo. WF01 detecta intent `QUERY_CATALOG`; WF03 extrae el término de búsqueda y llama a `search_food` RPC → formatea y envía resultados.
- WF02 Bug Fix: `Route by Action Type` y `Route by Delete Action` corregidos para usar `$('Parse Callback').first().json.action` en lugar de `$json.action` (que se perdía tras los nodos HTTP intermedios).
- WF01 Bug Fix: Prompt del AI Parser actualizado para reconocer marcas comerciales como parte del nombre del alimento (no como ítems separados); agrega reglas para "once" = snack y quantity por defecto.
- WF03 Bug Fix: `AI Parse Add Food` corregido para generar `"source": "manual"` en vez de `"user_provided"` (violaba constraint `foods_source_check`). `Build Food Insert` agrega guard de normalización de source.

- Mejora: Soporte de registros en fechas pasadas — `Detect Intent` extrae `dateRef` a partir de "ayer", "antier", "el DD de MES" (e.g. "el 13 de abril") y nombres de día (e.g. "el lunes"). Nuevo nodo `Prep Log Date` calcula `logged_at` antes de `Insert Food Log` (evita IIFE en fieldsUi de Supabase que fallaba silenciosamente). WF01 `Get Daily Totals` usa la fecha correcta. WF03 `Resolve Date` acepta ISO date strings directas; labels de `Generate Day Report` y `Send No Items` calculan "hoy"/"ayer"/fecha según el `date` resuelto.
- Bug Fix: `Insert Food Log` — `logged_at` no se aplicaba porque el IIFE en `fieldsUi` de Supabase fallaba silenciosamente → se registraba `NOW()`. Solución: nodo Code `Prep Log Date` intermedio calcula `logged_at` como campo simple `$json.logged_at`.
- Bug Fix: `Get Food Log Detail` y `Get Food Log Delete` — dos params `logged_at` con mismo nombre eran deduplicados por n8n (solo quedaba `lte`, sin lower bound) → `QUERY_DAY` mostraba todos los registros históricos. Solución: reemplazados por operador `and=(logged_at.gte...,logged_at.lte...)` de PostgREST.
- Mejora: Soporte de entrada vía audio — WF01 `Detect Update Type` detecta mensajes de voz (Telegram `voice`); `Route by Update Type` tiene output 2 (voice) que despacha a: `Get Voice File` (Telegram getFile API) → `Download Voice` (descarga binaria) → `Transcribe Voice` (OpenAI Whisper whisper-1, es) → `Build Voice Message` (reconstruye objeto `message`) → `Detect Intent`. El audio transcripto sigue el mismo flujo que texto.
- Bug Fix: Paths MEDIUM/MULTI/NONE en WF02 registraban siempre con `NOW()` aunque el mensaje original fuera para una fecha pasada. Solución: WF01 guarda `dateRef` en `extra_data` de los 3 nodos Save Pending; WF02 lee `extra_data.dateRef` en `Calculate Macros`, `Calculate Macros PICK` y `Extract New Food Data` para calcular `logged_at` y `p_date` correctos; `Insert Food Log YES/PICK/NEW` y `Get Daily Totals YES/PICK/NEW` usan estos valores.

## ⬜ Pendiente

**Mejoras**:
  1. Agregar a foods columna de "g_por_porcion". Luego, ajustar parser de cantidad para que mensajes donde no se explicita gramos o volumen ("1 yogurt", "1 porcion de arroz", "1 lamina de jamon") utilicen esta columna para calcular gramaje.
  2. Manejo de mensajes con imagen (foto de tabla nutricional o alimento) → ADD_FOOD vía visión IA.
