# Workflow n8n — Bot de presupuestos de laboratorio

> **Estado**: construido en n8n como un único workflow, "Laboratorio - Bot WhatsApp".
> Esta spec queda como referencia de diseño, el workflow real vive en n8n.

Spec lista para armar el workflow. Cada sección es un nodo. Pegar el prompt y el código
tal cual - ya están redactados siguiendo las convenciones de agentes de n8n (rol primero,
salida estructurada, contexto dinámico al final).

## Arquitectura: por qué Turnos es un subagente y Presupuesto no

El workflow tiene **un solo Agente Principal**, con **un subagente real** (Turnos,
nodo `agentTool`, con su propio modelo y sus propias tools de Airtable) y **una rama
determinística** (Presupuesto), no dos subagentes simétricos. No es por preferencia de
estilo — es un límite real de n8n:

- Una *tool* de un agente siempre es **un solo nodo**. El pipeline de Presupuesto
  necesita varios pasos encadenados con espera (bajar imagen → OCR → esperar →
  consultar resultado → interpretar → matchear → guardar) — eso no entra en un solo
  nodo-tool salvo que sea un **Code Tool**, y el Code Tool **no tiene acceso a HTTP**
  (no puede llamar a Evolution ni a Azure), solo sirve para cálculo puro.
- Aunque se pudiera, pasarle la imagen en base64 a una tool como parámetro significaría
  meter el archivo entero (decenas de miles de caracteres) en el contexto del LLM —
  carísimo en tokens y nada confiable. Los datos binarios tienen que fluir por las
  conexiones normales del workflow, no por el razonamiento de un agente.
- La única forma de que Presupuesto fuera un subagente-tool de verdad sería que llame
  a un subworkflow (`toolWorkflow`) — decisión consciente de no hacerlo, para mantener
  todo en un único workflow.

Turnos sí es un subagente real porque su tarea (interpretar fecha/hora en lenguaje
natural, decidir si hay que ofrecer otro horario, confirmar) es genuinamente
conversacional — ahí un LLM aporta algo que la lógica no. Presupuesto es un pipeline
fijo sin decisiones que tomar, así que un IF determinístico (`¿Trae imagen?`) alcanza
y es más barato y confiable que envolverlo en un agente.

## 1. Trigger — Webhook de Evolution API

Se simplificó el diseño original (que pasaba por Chatwoot) para ir más rápido en la
demo: n8n escucha directo el webhook que Evolution API dispara por cada mensaje
entrante, sin una capa de inbox en el medio. Si más adelante el labo quiere manejo de
conversaciones con handoff a un humano, ahí sí se suma Chatwoot entre Evolution y n8n
sin tener que rehacer el resto del workflow.

- Configurar en Evolution API (por instancia) el webhook apuntando a la URL del nodo
  Webhook de n8n, evento `messages.upsert` (o el nombre equivalente según la versión
  de Evolution API que tengan corriendo en RedmiWay — confirmar en su panel).
- Filtrar en el primer nodo (IF), **con lógica, no con IA**:
  - `data.key.fromMe === false` (mensaje entrante, no un eco de lo que mandó el bot)
  - `data.message.imageMessage` existe (vino una imagen)
- Todo lo que no cumpla esto corta el flujo acá. No hace falta gastar un LLM en decidir esto.

## 2. HTTP Request — Descargar la imagen

Evolution API expone un endpoint para bajar el media en base64 a partir del mensaje:

```
POST {{EVOLUTION_URL}}/chat/getBase64FromMediaMessage/{{instance}}
Header: apikey: {{EVOLUTION_API_KEY}}
Body: { "message": { "key": { "id": "{{ $json.data.key.id }}" } } }
```

La respuesta trae el campo `base64` — convertirlo a binario con un nodo "Move Binary
Data" (o `Function`/`Code` con `Buffer.from(base64, 'base64')`) antes de mandarlo al OCR.

## 3. HTTP Request — OCR con Azure Document Intelligence

Modelo `prebuilt-read` (lectura general, multilenguaje, buen manejo de manuscrita en español).

**Paso A — enviar el documento:**
```
POST {{AZURE_ENDPOINT}}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30
Content-Type: application/octet-stream
Ocp-Apim-Subscription-Key: {{AZURE_KEY}}
Body: <binario de la imagen>
```
La respuesta no trae el resultado — trae un header `Operation-Location` con la URL para consultarlo (es un proceso async).

**Paso B — hacer polling (nodo HTTP Request + nodo Wait en loop, 2-3 intentos con 2s de espera):**
```
GET {{Operation-Location del paso A}}
Ocp-Apim-Subscription-Key: {{AZURE_KEY}}
```
Repetir hasta que `status === "succeeded"`. El texto crudo queda en `analyzeResult.content`.

## 4. LLM call — Interpretar el texto OCR (sin tools, sin memoria)

Este paso **no es un agente** — es una llamada suelta de LLM con salida estructurada
(Basic LLM Chain + Structured Output Parser, o el modo "Structured Output" del nodo
AI Agent sin tools conectadas). No necesita memoria: cada receta es independiente.

**Prompt (Message a system):**

```
# Rol
Sos un asistente que interpreta el resultado de un OCR aplicado a una receta médica
argentina, para identificar qué estudios de laboratorio pide el médico. No hablás
con el paciente ni el médico — tu única salida es el JSON estructurado que se pide
abajo.

# Reglas
- El texto de entrada viene de un OCR sobre letra manuscrita: puede tener errores de
  reconocimiento, palabras cortadas o mal separadas. Usá tu conocimiento de estudios
  de laboratorio habituales (hemograma, urea, glucemia, hepatograma, orina completa,
  colesterol total, HDL, LDL, triglicéridos, TSH, T4, PSA, etc.) para inferir la
  intención aunque el texto esté distorsionado.
- No inventes estudios que no tengan ninguna base en el texto. Si una línea es
  ilegible o no se corresponde con ningún estudio de laboratorio conocido, incluila
  en "no_interpretados" tal cual aparece, en vez de forzar un nombre.
- No interpretes datos del paciente (nombre, diagnóstico, domicilio) salvo los campos
  pedidos explícitamente abajo — no son necesarios para el presupuesto y no hay que
  exponerlos de más.

# Objetivo
Devolver un JSON con esta forma exacta, sin texto adicional antes ni después:

{
  "medico": string | null,
  "estudios_detectados": string[],
  "no_interpretados": string[]
}

- "estudios_detectados": nombres de estudios normalizados (ej. "Hemograma", no
  "hemogrma"), uno por línea/ítem detectado en la receta.
- "no_interpretados": fragmentos de texto que no se pudieron asociar a ningún estudio.

# Texto OCR crudo de la receta
{{ $json.analyzeResult.content }}
```

- Configurar Structured Output Parser con el JSON Schema de arriba (`medico`,
  `estudios_detectados: string[]`, `no_interpretados: string[]`).
- Modelo: cualquiera con buen soporte de español y JSON mode confiable (GPT-4o /
  Claude). No hace falta un modelo con visión acá — ya trabajamos sobre texto plano
  que salió del OCR (paso 3), no sobre la imagen directamente.

## 5. Airtable — Traer el catálogo

- Nodo Airtable, operación **List**, tabla `Catalogo`. Traer todos los registros
  (Nombre, Codigo, Precio, Sinonimos) antes del matching.

## 6. Code — Matching difuso contra el catálogo

Lógica determinística (no usar IA acá — es un lookup con tolerancia a errores, el
tipo de caso que un Code node resuelve mejor y más barato que un LLM):

```javascript
// Input: $json.estudios_detectados (del paso 4) y los items de Airtable (paso 5)
function normalizar(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // saca acentos
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function distancia(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function similitud(a, b) {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return 0;
  const dist = distancia(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
}

const catalogo = items.map(i => ({
  id: i.json.id,
  nombre: i.json.fields.Nombre,
  precio: i.json.fields.Precio,
  codigo: i.json.fields.Codigo,
  alias: [i.json.fields.Nombre, ...(i.json.fields.Sinonimos || "").split(",")]
    .map(s => s.trim()).filter(Boolean),
}));

const UMBRAL = 0.72; // ajustar en pruebas con la receta real
const detectados = $('LLM_Interpretacion').first().json.output.estudios_detectados;

const matcheados = [];
const noReconocidos = [];

for (const estudio of detectados) {
  let mejor = null, mejorScore = 0;
  for (const item of catalogo) {
    for (const alias of item.alias) {
      const score = similitud(estudio, alias);
      if (score > mejorScore) { mejorScore = score; mejor = item; }
    }
  }
  if (mejor && mejorScore >= UMBRAL) {
    matcheados.push({ estudio_original: estudio, ...mejor, score: mejorScore });
  } else {
    noReconocidos.push(estudio);
  }
}

const total = matcheados.reduce((sum, m) => sum + Number(m.precio || 0), 0);

return [{ json: { matcheados, noReconocidos, total } }];
```

> Nota: probar el `UMBRAL` con la receta real ya compartida — la letra del médico es
> difícil, puede necesitar bajarse a ~0.65 para que "Hepatograma" matchee aunque el
> OCR lo lea distinto. Si baja demasiado empiezan los falsos positivos: mejor pecar
> de mostrar algo como "no reconocido" que cobrar un estudio equivocado.

## 7. Code — Armar el mensaje de presupuesto

```javascript
const { matcheados, noReconocidos, total } = $json;

let msg = "📋 *Presupuesto de tu receta*\n\n";
for (const m of matcheados) {
  msg += `✅ ${m.nombre} (${m.codigo}) — $${Number(m.precio).toLocaleString("es-AR")}\n`;
}
if (noReconocidos.length) {
  msg += "\n⚠️ No pudimos identificar estos ítems, te contactamos para confirmarlos:\n";
  for (const n of noReconocidos) msg += `- ${n}\n`;
}
msg += `\n*Total: $${total.toLocaleString("es-AR")}*`;

return [{ json: { mensaje: msg, total, matcheados, noReconocidos } }];
```

## 8. HTTP Request — Responder por Evolution API

```
POST {{EVOLUTION_URL}}/message/sendText/{{instance}}
Header: apikey: {{EVOLUTION_API_KEY}}
Body: {
  "number": "{{ $('Trigger_Evolution').item.json.data.key.remoteJid }}",
  "text": "{{ $json.mensaje }}"
}
```

## 9. Airtable — Guardar en Historial

Crear registro en tabla `Historial`:
- `Fecha`: ahora
- `Paciente`: (si se pidió en el paso 4, opcional)
- `TextoOCR`: `{{ $('OCR_Azure').item.json.analyzeResult.content }}`
- `EstudiosMatcheados`: `{{ $json.matcheados.map(m => m.nombre).join(', ') }}`
- `NoReconocidos`: `{{ $json.noReconocidos.join(', ') }}`
- `Total`: `{{ $json.total }}`
- `Imagen`: adjuntar la imagen original (attachment field)

## Manejo de errores (obligatorio, no opcional para la demo)

Siguiendo la convención de fallback tanto técnico como de negocio:
- Si el nodo de OCR o el LLM fallan (excepción técnica) → rama de error que responde
  al paciente "Hubo un problema leyendo la receta, un miembro del equipo te va a
  contactar" y notifica al labo (mensaje aparte por WhatsApp a un número interno, o
  email — a definir con Gino según qué tengan más a mano para la demo).
- Si **todos** los estudios caen en `no_interpretados`/`noReconocidos` (error de
  negocio, no técnico) → no devolver un presupuesto de $0, avisar explícitamente que
  no se pudo leer la receta y pedir que la reenvíen con mejor luz/foco.

## Credenciales necesarias antes de construir

- [ ] Evolution API: URL, nombre de instancia y `apikey` (Railway — ya está corriendo,
      solo falta configurar el webhook hacia n8n)
- [ ] Azure Document Intelligence: endpoint + subscription key (Azure Portal → crear
      recurso "Document Intelligence", tier gratuito alcanza para la demo)
- [ ] Airtable: ya lista (confirmado por Gino)
- [ ] Credencial del modelo LLM para el paso 4 (la que ya use n8n para los otros
      agentes de ROBU)

## Dónde vive cada pieza (deploy)

- **n8n + Evolution API + Postgres**: Railway (entorno de demos ya existente) — no se
  toca nada de infraestructura ahí, solo se agrega el workflow nuevo y se configura el
  webhook de la instancia de Evolution API apuntando a él.
- **Backend (`LaboratorioDemo/backend`)**: Railway — deploy por git push, variables de
  entorno (`AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, etc.) cargadas ahí, no en el repo.
- **Frontend (`LaboratorioDemo/frontend`)**: Vercel — apuntando `VITE_API_URL` a la URL
  pública que Railway le asigne al backend.
