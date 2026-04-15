# Mapa de Workflows n8n

## 🚀 Inventario de Workflows
| # | Nombre | ID | Trigger | Estado |
|---|---|---|---|---|
| 01 | Food Logger Main | Xui6wSLHj0aP9cDx | Telegram trigger | ✅ Activo |
| 02 | Confirm Pending | YBOxhz5Svx2VWFj4 | Execute workflow trigger | ✅ Activo |
| 03 | Queries | 3lmsNaaqQamnFOd7 | Execute workflow trigger | ✅ Activo |
---

## Workflow 01: Food Logger Main
Procesa lenguaje natural y decide la ruta de registro (Directo, Confirmación o Estimación).

```mermaid
graph TD
    T1[Telegram Trigger] --> D1[Detect Update Type]
    D1 --> R1{Route by Update Type}

    R1 -- "callback_query" --> WF2[Execute WF02]
    R1 -- "message" --> I1[Detect Intent]
    R1 -- "voice" --> GVF[Get Voice File] --> DVF[Download Voice] --> TV[Transcribe Voice] --> BVM[Build Voice Message] --> I1

    I1 --> R2{Route by Intent}

    R2 -- "REGISTER" --> P1[AI Parser]
    R2 -- "QUERY_DAY / WEEK / DELETE / SET_GOAL / ADD_FOOD / QUERY_CATALOG" --> WF3[Execute WF03]
    R2 -- "UNSUPPORTED (fallback)" --> UN[Send Unsupported]

    P1 --> P2[Parse JSON Response]
    P2 --> IF1{IF Check Parse Error}
    IF1 -- "error" --> ERR[Send Parse Error]
    IF1 -- "ok" --> B1[Split In Batches]
    B1 --> S1[Search Food in DB]
    S1 --> E1[Evaluate Match]
    E1 --> R3{Route by Match Level}

    R3 -- "HIGH" --> C1[Calculate Macros HIGH] --> L1[Insert Food Log]
    L1 --> T2[Get Daily Totals] --> G1[Get Daily Goals] --> S2[Generate Summary] --> RSP[Send Response]

    R3 -- "MEDIUM" --> SP1[Save Pending] --> AC1[Ask Confirmation]

    R3 -- "NONE" --> AI1[AI Macro Estimator] --> PF1[Prepare Food Estimate] --> PF2[Prepare Food Data] --> SP2[Save Pending New Food] --> AF1[Ask Add Food]

    R3 -- "MULTI" --> SPM[Save Pending Multi] --> BPK[Build Pick Keyboard] --> SPK[Send Pick Keyboard]

    AC1 --> B1
    AF1 --> B1
    RSP --> B1
    SPK --> B1
```

## Workflow 02: Confirm Pending
Gestiona callbacks de botones para confirmar registros pendientes o ejecutar borrados.

```mermaid
graph TD
    T2[Execute Workflow Trigger] --> P2[Parse Callback]
    P2 --> A2[Answer Callback Query]
    A2 --> E2[Edit Message Reply Markup]
    E2 --> RT{Route by Action Type}

    
    RT -- "delete_*" --> RD{Route by Delete Action}
    RT -- "otros" --> GP[GET Pending] --> RA{Route by Action}

    
    RA -- "confirm_yes" --> GF[GET Food] --> CM[Calculate Macros] --> IFY[Insert Food Log YES]
    IFY --> PCY[PATCH Pending Confirmed YES] --> TTY[Get Daily Totals YES] --> GDY[Get Daily Goals YES] --> SY[Generate Summary YES] --> SSY[Send Summary YES]

    
    RA -- "confirm_no" --> PRN[PATCH Pending Rejected NO] --> SR[Send Rejected]

    
    RA -- "new_yes" --> EX[Extract New Food Data] --> IF[Insert Food] --> AFI[Attach Food ID] --> IFN[Insert Food Log NEW]
    IFN --> PCN[PATCH Pending Confirmed NEW] --> TTN[Get Daily Totals NEW] --> GDN[Get Daily Goals NEW] --> SN[Generate Summary NEW] --> SSN[Send Summary NEW]

    
    RA -- "new_no" --> PRNN[PATCH Pending Rejected NEW NO] --> SC[Send Cancelled]

    
    RA -- "pick_food" --> GFP[GET Food PICK] --> CMP[Calculate Macros PICK] --> IFP[Insert Food Log PICK]
    IFP --> PCP[PATCH Pending Confirmed PICK] --> TTP[Get Daily Totals PICK] --> GDP[Get Daily Goals PICK] --> SP[Generate Summary PICK] --> SSP[Send Summary PICK]

    
    RA -- "pick_none" --> PRPN[PATCH Pending Rejected PICK NONE] --> SPN[Send Pick None]

    
    RD -- "delete_pick" --> GLP[GET Food Log for Pick] --> PDC[Prepare Delete Confirm] --> SDKB[Send Delete Confirm KB]

    
    RD -- "delete_yes" --> GLY[GET Food Log for Yes] --> DL[DELETE Food Log] --> TTD[Get Totals Delete] --> FD[Format Delete Confirm] --> SDC[Send Delete Confirmed]

    
    RD -- "delete_no / cancel" --> SDCN[Send Delete Cancelled]
```

## Workflow 03: Queries
Gestiona consultas de historial, eliminación, metas, catálogo y alta de alimentos.

Entrada (Execute Workflow Trigger): `{ intent, userId, chatId, dateRef, foodHint, text }`

```mermaid
graph TD
    T3[Execute Workflow Trigger] --> RD[Resolve Date]
    RD --> SI{Switch by Intent}

    SI -- "QUERY_DAY" --> GFD[Get Food Log Detail] --> FFL[Format Food Log] --> GDT[Get Daily Totals QD] --> GDG[Get Daily Goals QD] --> GR[Generate Day Report] --> SDR[Send Day Report]

    SI -- "QUERY_WEEK" --> GFW[Get Food Log Week] --> AGG[Aggregate by Day] --> SWR[Send Week Report]

    SI -- "DELETE_FOOD" --> GFL[Get Food Log Delete] --> FH[Filter by foodHint] --> BDK[Build Delete Keyboard] --> SNI{noItems?}
    SNI -- "true" --> SNM[Send No Items]
    SNI -- "false" --> SDK[Send Delete Keyboard HTTP]

    SI -- "SET_GOAL" --> APG[AI Parse Goal] --> BGB[Build Goal Body] --> UDG[Upsert Daily Goal] --> SGC[Send Goal Confirmation]

    SI -- "ADD_FOOD" --> APF[AI Parse Add Food] --> BFI[Build Food Insert] --> IFC[Insert Food Catalog] --> SFA[Send Food Added]

    SI -- "QUERY_CATALOG" --> PCQ[Parse Catalog Query] --> SC[Search Catalog] --> FCR[Format Catalog Results] --> SCR[Send Catalog Results]
```

**Intents recibidos:** `QUERY_DAY` · `QUERY_WEEK` · `DELETE_FOOD` · `SET_GOAL` · `ADD_FOOD` · `QUERY_CATALOG`

**dateRef:** `"today"` | `"yesterday"` → resuelto a fecha ISO en Resolve Date.

**Delete keyboard callbacks** que WF02 maneja:
| callback_data | Acción |
|---|---|
| `delete_pick_<id>` | Mostrar confirm de un item |
| `delete_yes_<id>` | Eliminar food_log y notificar |
| `delete_no_<id>` | Cancelar |
| `delete_cancel_x` | Cancelar (sin id) |

---

## Notas de operacion

* Identificación: El nodo Identify Intent filtra ruidos para no procesar mensajes que no sean comida.

* Búsqueda: Usa la función RPC search_food de Supabase con el alias del alimento.

* Ahorro de Tokens: No subir archivos JSON enteros a Claude; usar este mapa y el MCP de n8n para inspeccionar nodos específicos.

* Regla: Consultar docs/n8n_specs.md antes de modificar versiones de nodos.