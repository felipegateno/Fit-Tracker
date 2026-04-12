PROYECTO: 
Fit-tracker

OBJETIVO: 
Ecosistema automatizado para centralizar nutrición (vía Telegram/n8n) y actividad física (vía Garmin/Python) en Supabase. El objetivo es la eficiencia de datos y visualización unificada.

STACK: 
Supabase (DB), n8n (orquestacion), Python (extraccion garmin), Vercel (visualizacion)

Estructura del repositorio:
/.claude/: Contexto e instrucciones (claude.md, skills/).
/supabase/: Migraciones SQL y esquemas.
/workflows/: Exportaciones JSON de n8n.
/scripts/: Código de sincronización Garmin.
/dashboard/: Código de visualización.

REGLAS DE INTERACCION:
- CONCISIÓN EXTREMA: Responde de forma directa. Evita introducciones corteses, explicaciones obvias o "yapping". Ve al grano del código o la lógica.

- TOKEN SAVING: No repitas código que no ha cambiado. Solo muestra los fragmentos modificados o relevantes.

- IDIOMA: Variables/Código en Inglés. Explicaciones en Español.