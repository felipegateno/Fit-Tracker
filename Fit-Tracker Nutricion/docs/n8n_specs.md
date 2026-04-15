# Especificaciones Técnicas

## Infraestructura

| Componente | Detalle |
|---|---|
| n8n | 1.120.4 (fijado en docker-compose) |
| Bot Telegram | `TELEGRAM_NUTRIBOT_TOKEN` (8778955751) |
| Credencial n8n | `Nutribot` (id: `gXMQPWn0qTg7E1zn`) |
| Supabase proyecto | `zynzkxlgvfmjoayeiscv` |
| Credencial Supabase | `Supabase Nutricion` (id: `683sdgt13bwfK0WI`) |
| Credencial OpenAI | `OpenAi account` (id: `cclrFMWTouIgrz1d`) |

## ⚙️ Configuración n8n (v1.120.4)
Para evitar el icono "?" en los nodos, usar estas versiones exactas:
- **Switch**: typeVersion **3** (No 3.4).
- **HTTP Request**: typeVersion **4** (No 4.4).
- **Condiciones (IF/Switch)**: `options.version: 1`.
- **Telegram**: typeVersion **1.2**.

## 🗄️ Base de Datos & RPC
- **Migraciones**: En `/supabase` se encuentran las DB.
- **Credencial**: `Supabase Nutricion`.
- **search_food**: Requiere `fullResponse: true` en el nodo HTTP para manejar arrays vacíos.
- **RPC de Supabase (`search_food`, `get_daily_totals`)**: via HTTP Request → POST `/rest/v1/rpc/<funcion>`
- **pending_confirmations**: Tabla intermedia para flujos MEDIUM/NONE.
  - `id`: UUID (usado en `callback_data`).
  - `extra_data`: JSONB con `{ newFoodData, logData }`.

## 🧮 Fórmulas de Macros
```javascript
calorias = (kcal_100g * gramos) / 100;
proteina = (prot_100g * gramos) / 100; // Aplica igual a HC, Grasas, Fibra.
```

## 🔘 Formato Callback Telegram
[prefijo]_[uuid_pending]
* Prefijos: confirm_yes_, confirm_no_, new_yes_, new_no_.