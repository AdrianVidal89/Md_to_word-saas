# CLAUDE.md — AI to Word

Instrucciones de sistema para cualquier agente (Claude Code u otro) que trabaje
en este repositorio. Léelo antes de tocar código.

> **Nombre del producto**: "AI to Word" de cara al usuario (julio 2026 —
> nombre más simple para un público no técnico que no necesita saber qué es
> "Markdown" o ".docx"). Antes se llamó "Formalize", y antes de eso
> "MD2Docx" durante el desarrollo inicial — si ves cualquiera de esos
> nombres en código viejo, identificadores internos (p. ej. el header
> `X-Formalize-Trial-Used`, el prefijo de API keys `formalize_live_`, o el
> título de la app FastAPI), capturas de pantalla o conversaciones
> anteriores, es el mismo producto. No hace falta renombrar esos
> identificadores internos solo por consistencia cosmética — coordínalo
> explícitamente si el usuario lo pide.

## 1. Qué es esto

Formalize es un conversor **Markdown → DOCX** que nació como herramienta
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

- **Frontend**: 3 páginas HTML estáticas sin framework ni bundler —
  `web/index.html` (home: hero conversor + wizard Pro), `web/pricing.html`,
  `web/api-access.html` —, servidas por `main.py` (que rellena por request
  los placeholders `__SUPABASE_URL__`/`__SUPABASE_ANON_KEY__`/
  `__API_BASE_URL__`/`__SITE_URL__`/`<!--TEMPLATE_OPTIONS-->`; ver
  `_render_page()`). Lógica común factorizada en `web/assets/shared.js`
  (i18n, sesión de Supabase, modales de login/signup) y `web/assets/wizard.js`
  (wizard Pro), incluidos como `<script src="/assets/...">` en cada página —
  nunca dupliques esa lógica inline de nuevo. Tailwind se carga vía CDN (sin
  build step); todo lo que dependa de un CDN externo (Supabase, marked.js,
  Tailwind) debe ir siempre guardado con `try/catch`/`typeof` — un CDN caído
  no puede tumbar el conversor gratuito (ver el bug real documentado en el
  commit de QA de la Fase 5).
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

> **Reorientación (posicionamiento actual, sustituye al modelo original):** el
> free ya no es una versión limitada del producto — es el lead magnet. El
> muro de pago se movió de "cuántas veces conviertes" a "puedes usar tu
> propia plantilla corporativa de forma persistente". Si encuentras código o
> docs que hablen de un límite de 3/semana o de un flujo de "upsell/caramelo"
> con `HTTP 402` + blur, es rastro del modelo anterior — no lo reintroduzcas.

### 5.1 Free (anzuelo): conversión genérica ilimitada, sin registro

- `POST /api/convert` es **público, sin JWT y sin cuota de negocio**. Cualquiera
  pega Markdown y descarga el `.docx` al instante, sin crear cuenta.
- Solo lleva un **rate-limit anti-abuso por IP** (`auth.check_ip_rate_limit`,
  ventana deslizante en memoria — ver `RATE_LIMIT_MAX_REQUESTS`/
  `RATE_LIMIT_WINDOW_SECONDS`), pensado para proteger la capa gratuita de
  Render de scripts/loops, **no** para frenar al usuario legítimo. No es una
  cuota de producto: no distingue tiers ni usuarios, solo IP.
- La plantilla usada en este endpoint es siempre una del catálogo whitelisted
  (`converter.resolve_template`) — nunca una subida por el cliente.

### 5.2 Pro: plantillas corporativas propias persistentes (con 1 prueba gratis)

El muro de pago es la posibilidad de subir una plantilla `.dotx`/`.docx`
propia, que el sistema **persiste** (Supabase Storage, tabla
`public.templates` — ver `supabase/migrations/002_pro_templates.sql`) y
reutiliza en conversiones futuras, con auto-mapeo de estilos Markdown →
estilos Word (`template_mapping.py`, best-effort con dropdown manual como
fallback siempre disponible) y reglas condicionales (p. ej. Pass/Fail, ya
cubierto por el builder). Esto vive en `pro_templates.py` (`/api/pro/...`),
aparte del `/api/convert` genérico: wizard de 3 pasos — subir → mapear
estilos con fallback manual → conversión de prueba con preview.

**Free trial de 1 descarga real**: un usuario `free` (requiere cuenta, no
anónimo) puede completar el wizard entero y descargar **un** `.docx` real y
completo con su propia plantilla antes de pagar — no es una preview
difuminada ni una ofuscación, es el fichero final de verdad. Se controla con
`users.custom_template_trial_used_at` (NULL = prueba disponible) y
`auth.check_custom_template_quota`: la 2ª descarga con plantilla propia de un
`free` devuelve `HTTP 402`. No aplica a `pro`/`enterprise` (sin límite). El
CTA de upgrade en la UI es contextual (aparece junto al resultado,
comparando genérico vs. con plantilla propia) y nunca bloqueante.

### 5.3 B2B API

`POST /api/v1/b2b/convert` es un endpoint machine-to-machine independiente
del login de usuario final: se autentica exclusivamente con un header
`X-API-Key`, validado contra `api_keys.key_hash` (hash, nunca texto plano).
Pensado para integraciones (CI/CD, otros SaaS) con cuota/facturación propia.

### 5.4 Anti-abuso de cuentas Pro

Al validar un JWT de un usuario `pro`, se registra la IP de origen en
`users.last_ips` (JSONB, lista de `{ip, ts}` acotada a las últimas 24h). Si en
esa ventana aparecen **más de 2 IPs distintas**, se asume uso compartido de
cuenta y se responde `HTTP 403` en vez de procesar la conversión. Esto es
independiente del rate-limit por IP del endpoint público (§5.1): aquel
protege infraestructura, este protege contra compartir una suscripción Pro.

## 6. Convenciones de desarrollo

- No añadas dependencias de cola de trabajos (Celery/RQ) sin discutirlo antes
  — el diseño actual asume conversión síncrona en threadpool, suficiente para
  el volumen freemium/B2B actual.
- Cualquier endpoint nuevo que toque `conversions_log` o `users` debe usar
  `database.get_supabase()` (service role) — nunca expongas la
  `service_role key` al frontend; el frontend solo usa `anon key`.
- Los tests manuales de conversión deben verificarse contra `sample.md` y,
  si aplica, contra una plantilla en `templates/`.
