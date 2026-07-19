# CLAUDE.md — MD2Docx SaaS

Instrucciones de sistema para cualquier agente (Claude Code u otro) que trabaje
en este repositorio. Léelo antes de tocar código.

## 1. Qué es esto

MD2Docx es un conversor **Markdown → DOCX** que nació como herramienta
monolítica de un solo usuario y ha sido migrado a un **SaaS multi-tenant
freemium/B2B** sobre Supabase. El valor de producto sigue siendo el mismo que
en el origen:

1. Un parser Markdown → AST propio (basado en `mistune`, `renderer=None`) que
   traduce a una lista de "bloques tipados" (`heading`, `paragraph`, `table`,
   `list`).
2. Un builder `python-docx` que traduce esos bloques a un `.docx`, con dos
   modos: estilos propios (documento en blanco) o herencia de una plantilla
   `.docx` de referencia subida previamente (equivalente al `--reference-doc`
   de Pandoc, pero manipulando OOXML directamente).
3. Un coloreado automático Pass/Fail en celdas de tabla (lógica de negocio de
   dominio: documentos de testing/QA).

## 2. Regla inquebrantable: no tocar el core del parser/builder

`converter/parser.py`, `converter/builder.py`, `converter/template.py` y
`converter/styles.py` son la **lógica de negocio central** y deben permanecer
**funcionalmente intactos**. Esto incluye comportamientos que parecen "bugs"
pero son decisiones de producto ya conocidas y documentadas — **no los
arregles a menos que el usuario lo pida explícitamente**:

- Los headings se truncan a nivel 3 (`min(level, 3)`): un `####` se renderiza
  como Heading 3.
- Los blockquotes (`> cita`) se aplanan a un párrafo normal con la clave
  `quote: True`, pero el builder **no lee esa clave** — no hay sangría ni
  borde en el Word (sí lo hay en el preview HTML del cliente; es una
  divergencia conocida).
- Las celdas de tabla solo admiten texto plano (nunca bold/italic/code).
- Los links (`[texto](url)`) se simulan visualmente (subrayado + azul) pero
  **no son hyperlinks OOXML reales**. Además, un link con bold anidado
  (`**[x](url)**`) pierde el bold.
- Las listas no soportan anidamiento (todos los ítems quedan planos).
- `thematic_break` (`---`, `***`, `___`) se descarta, no genera nada en el
  documento.
- El coloreado Pass/Fail (`PASS`/`OK`/`✓` → verde `#C6EFCE`, `FAIL`/`KO`/
  `NOK`/`✗` → rojo `#FFC7CE`) se aplica en ambos modos (con y sin plantilla)
  vía shading XML manual (`_set_cell_bg`), no hay API de alto nivel para esto
  en `python-docx`.

Si se necesita corregir o extender alguno de estos comportamientos, coordínalo
explícitamente con el usuario primero — son decisiones de producto, no
descuidos.

`resolve_template()` **nunca** debe aceptar una ruta de filesystem arbitraria
proveniente de un cliente. Solo puede resolver contra IDs registrados en el
almacén de plantillas (hoy: carpeta `templates/` local + catálogo whitelisted;
a futuro: storage de objetos namespaced por tenant). Esto es una superficie de
path-traversal / arbitrary file read si se relaja.

## 3. Arquitectura

```
Frontend (Vercel, HTML/CSS/JS vanilla, sin build step)
   │  fetch() con JWT de Supabase Auth en Authorization: Bearer <token>
   ▼
Backend (Render, FastAPI, Python 3.11)
   │  supabase-py (service_role) para leer/escribir Postgres
   ▼
Supabase (PostgreSQL managed + Auth + JWT)
```

- **Frontend**: SPA estática (`web/index.html`), sin framework ni bundler.
  Se despliega en Vercel como sitio estático. Usa el SDK `@supabase/supabase-js`
  vía CDN para login/signup y para adjuntar el JWT a las llamadas al backend.
- **Backend**: FastAPI (`main.py` + módulos `converter/`, `database.py`,
  `auth.py`, `models.py`), desplegado en Render como servicio web Python.
  Es **stateless** salvo por las lecturas/escrituras a Supabase — no persiste
  documentos generados en disco (siguen viviendo solo en la respuesta HTTP,
  igual que en la versión monolítica original).
- **Base de datos**: Supabase Postgres. `auth.users` (gestionada por Supabase
  Auth) es la fuente de verdad de identidad; `public.users` es una tabla de
  perfil/negocio (tier, IPs, cuotas) enlazada 1:1 por `id`. Ver
  `supabase/migrations/001_initial_schema.sql`.
- **CPU-bound work**: `build_docx()` es síncrono y CPU-intensivo. Los
  endpoints lo ejecutan en threadpool (`starlette.concurrency.run_in_threadpool`)
  para no bloquear el event loop de `asyncio`, tal y como se señaló como riesgo
  en el análisis del monolito original.

## 4. Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML/CSS/JS vanilla + `@supabase/supabase-js` (CDN) |
| Hosting frontend | Vercel (estático) |
| Backend | FastAPI + Uvicorn |
| Hosting backend | Render (web service) |
| Base de datos | Supabase Postgres |
| Auth | Supabase Auth (JWT nativo, verificado localmente con `SUPABASE_JWT_SECRET`) |
| Conversión | `mistune` (AST) + `python-docx` (OOXML) |
| Pagos | Stripe (checkout externo, no se procesa tarjeta en este repo) |

## 5. Modelo de monetización

### 5.1 Freemium (usuarios web, tier `free`)

- Límite: **3 conversiones por 7 días**, contadas por `user_id` (si hay JWT
  válido) o por `ip_address` (anónimo, sin cuenta). Se consulta
  `conversions_log` antes de procesar. Al superar el límite: `HTTP 429`.
- El límite **no aplica** a usuarios con `tier = 'pro'`.

### 5.2 El "caramelo" (upsell de plantillas personalizadas)

Si un usuario sin `tier = 'pro'` sube una plantilla `.docx` personalizada
(campo `template_file` en `/api/convert`), el backend:

1. Procesa el documento igualmente (usa la lógica de builder normal).
2. **No devuelve el `.docx` binario.** Devuelve `HTTP 402 Payment Required`
   con un JSON que incluye una muestra de texto de la previsualización (no
   el archivo), invitando a hacer upgrade.
3. El frontend captura el 402, difumina visualmente un contenedor de
   "documento listo" (`filter: blur(5px); pointer-events: none;`) y superpone
   un modal con CTA a Stripe.

### 5.3 B2B API

`POST /api/v1/b2b/convert` es un endpoint machine-to-machine independiente
del login de usuario final: se autentica exclusivamente con un header
`X-API-Key`, validado contra `api_keys.key_hash` (hash, nunca texto plano).
Pensado para integraciones (CI/CD, otros SaaS) con cuota/facturación propia.

### 5.4 Anti-abuso

Al validar un JWT de un usuario `pro`, se registra la IP de origen en
`users.last_ips` (JSONB, lista de `{ip, ts}` acotada a las últimas 24h). Si en
esa ventana aparecen **más de 2 IPs distintas**, se asume uso compartido de
cuenta / abuso de cuota y se responde `HTTP 403` en vez de procesar la
conversión.

## 6. Convenciones de desarrollo

- No añadas dependencias de cola de trabajos (Celery/RQ) sin discutirlo antes
  — el diseño actual asume conversión síncrona en threadpool, suficiente para
  el volumen freemium/B2B actual.
- Cualquier endpoint nuevo que toque `conversions_log` o `users` debe usar
  `database.get_supabase()` (service role) — nunca expongas la
  `service_role key` al frontend; el frontend solo usa `anon key`.
- Los tests manuales de conversión deben verificarse contra `sample.md` y,
  si aplica, contra una plantilla en `templates/`.
