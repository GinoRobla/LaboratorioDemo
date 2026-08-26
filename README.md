# Demo — Bot de presupuestos de laboratorio

Ver el plan completo en `C:\Users\ginor\.claude\plans\te-puse-en-modo-immutable-sphinx.md`.

## Qué hay acá

- `backend/` — API Node/Express que actúa de proxy hacia Airtable (catálogo e historial).
  El frontend nunca ve la API key de Airtable directamente.
- `frontend/` — Panel React para que el laboratorio edite el catálogo (nombre, código,
  precio, sinónimos) y consulte el historial de recetas procesadas.
- `n8n/WORKFLOW_SPEC.md` — spec nodo por nodo del workflow de WhatsApp (vía Evolution
  API directo, sin Chatwoot en el medio), con el prompt del paso de interpretación y
  el código de matching, listos para pegar en n8n.

El bot de WhatsApp (n8n) todavía no está construido — está bloqueado hasta autorizar
el conector MCP de n8n (correr `/mcp` en una sesión interactiva de Claude Code). El
panel admin sí está armado y probado localmente.

## Deploy — ya levantado

Todo vive en el proyecto **Demos** de Railway + un proyecto en Vercel:

| Servicio | Rol | URL |
|---|---|---|
| `n8n` | Motor de automatización — ahí vive (cuando se construya) el workflow completo del bot: recibe el WhatsApp, hace OCR, interpreta con IA, calcula presupuesto, responde. | `n8n-production-37a9.up.railway.app` |
| `evolution-api` | Puente con WhatsApp — manda/recibe los mensajes. n8n le habla a este servicio. | `evolution-api-production-81570.up.railway.app` |
| `Postgres` | Base interna de n8n (credenciales, historial de ejecuciones). No tiene relación con el catálogo del labo — eso vive en Airtable. | — |
| `laboratorio-backend` | API de este proyecto — proxy hacia Airtable para el panel admin. Servicio nuevo, separado del bot. | `laboratorio-backend-production-0a1e.up.railway.app` |
| Frontend (Vercel) | Panel React, consume `laboratorio-backend`. | `laboratorio-demo.vercel.app` |

Repo: [github.com/GinoRobla/LaboratorioDemo](https://github.com/GinoRobla/LaboratorioDemo)

Variables cargadas en `laboratorio-backend` (Railway): `AIRTABLE_CATALOGO_TABLE`,
`AIRTABLE_HISTORIAL_TABLE`, `FRONTEND_ORIGIN` (apuntando a la URL de Vercel de arriba).
**Pendientes**: `AIRTABLE_API_KEY` y `AIRTABLE_BASE_ID` (cargarlas Gino directo en
Railway, nunca por chat).

## Cómo correrlo

**Backend:**
```bash
cd backend
cp .env.example .env   # completar AIRTABLE_API_KEY y AIRTABLE_BASE_ID
npm install
npm run dev
```

**Frontend** (en otra terminal):
```bash
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`. Si el 5173 está ocupado (pasó en la prueba local,
lo tenía tomado Docker), Vite usa el puerto que le pases por `PORT` o el próximo libre.

## Tablas de Airtable esperadas

**Catalogo**: `Nombre` (texto), `Codigo` (texto), `Precio` (número), `Sinonimos` (texto,
separados por coma — mejora el matching contra letra de médico difícil de leer).

**Historial**: `Fecha` (fecha), `Paciente` (texto), `TextoOCR` (texto largo),
`EstudiosMatcheados` (texto), `NoReconocidos` (texto), `Total` (número), `Imagen`
(adjunto).

## Verificado

- Backend levanta y responde en `/api/health`.
- Frontend renderiza el panel (tabs Catálogo/Historial, tabla, formulario de alta) y
  maneja el error de conexión sin romperse cuando el backend no tiene credenciales
  de Airtable todavía.
- Falta probar el flujo con datos reales de Airtable una vez que Gino complete el `.env`.
