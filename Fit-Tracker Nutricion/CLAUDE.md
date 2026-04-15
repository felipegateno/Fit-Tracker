# CLAUDE.md — Fit-Tracker Nutricion

## 📌 Contexto
Bot de Telegram para registro nutricional personal. 
Stack: n8n (1.120.4) + Supabase + OpenAI + Telegram.

## 🗂️ Guía de Referencia
- **Mapa de Workflows:** `n8n/README.md` (IDs y estructura de nodos).
- **Especificaciones Técnicas:** `docs/n8n_specs.md` (Versiones de nodos y reglas de DB).
- **Estado del Proyecto:** `docs/status.md` (Progreso y tareas pendientes).
- **Lógica IA:** Carpeta `/prompts` (Parser, Estimador, Resumen).
- **Migraciones Supabase:** Carpeta `/supabase` (4 migraciones)

## 🛠️ Reglas de Oro
0. **Aceptar permisos**: Cada vez que otorgue el permiso de un comando, agregalo a `.claude/settings.local.json`.
1. **Sin preámbulos:** Respuestas directas y técnicas sin verbosidad.
2. **n8n MCP:** Úsalo para leer/editar código en los nodos, pero consulta `n8n/README.md` primero para ubicar el nodo correcto y minimizar el uso de este MCP.
3. **No imprimir JSON:** No subir archivos JSON enteros a Claude
4. **Versiones:** Respeta estrictamente las versiones de nodos en `docs/n8n_specs.md` para evitar errores visuales en n8n.
5. **Mantenimiento:** Al completar un hito, actualiza `docs/status.md`. Al modificar un flujo, actualiza el mermaid respectivo en `n8n/README.md`.
6. **Hallazgos:** Si identificas una mejora o posible bug, actualiza `docs/status.md`.