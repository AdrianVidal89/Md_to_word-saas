"""FastAPI app: UI estática + API REST de conversión Markdown -> DOCX.

Endpoints:
- GET  /, /pricing, /api-access  páginas estáticas (web/*.html)
- GET  /robots.txt, /sitemap.xml SEO
- GET  /healthz                warm-up / liveness (mitiga cold start de Render)
- GET  /templates               catálogo de plantillas disponibles
- POST /api/convert            conversión genérica: pública, sin login, sin
                                límite de negocio — solo rate-limit por IP
                                anti-abuso (ver auth.check_ip_rate_limit)
- POST /api/v1/b2b/convert     conversión B2B (obligatorio X-API-Key)
- /api/pro/templates/*         plantillas corporativas propias persistentes
                                (muro de pago Pro, ver pro_templates.py)

La conversión (`build_docx`) es CPU-bound y síncrona: se delega siempre a un
threadpool (`run_in_threadpool`) para no bloquear el event loop de asyncio,
tal y como señala el análisis de arquitectura del monolito original.
"""

import hashlib
import os
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from auth import check_ip_rate_limit, get_client_ip, log_conversion, require_api_key, require_user
from converter import build_docx, list_templates, parse, resolve_template
from models import AuthenticatedUser
from pro_templates import router as pro_templates_router

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"

MAX_MARKDOWN_BYTES = 2 * 1024 * 1024  # 2 MB: límite defensivo de payload

app = FastAPI(title="Formalize API")

_frontend_origins = [o.strip() for o in os.environ.get("FRONTEND_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Formalize-Trial-Used"],
)

if (WEB_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(WEB_DIR / "assets")), name="assets")

app.include_router(pro_templates_router)


# --------------------------------------------------------------------------
# UI estática
# --------------------------------------------------------------------------

def _site_url(request: Request) -> str:
    """URL pública absoluta del sitio, para OG tags/canonical/sitemap. Usa
    PUBLIC_SITE_URL si está definida (útil detrás de proxies donde
    request.base_url no refleja el dominio real), si no la deriva del propio
    request — así funciona igual en local, en Render o tras un dominio propio
    sin tener que hardcodear nada."""
    override = os.environ.get("PUBLIC_SITE_URL", "").rstrip("/")
    if override:
        return override
    return str(request.base_url).rstrip("/")


def _asset_version() -> str:
    """Hash corto del contenido de los JS compartidos, usado como query
    `?v=` en los <script> de assets para invalidar la caché del navegador
    en cada deploy que los toque. Sin esto, un usuario con el `shared.js`
    viejo en caché ve el HTML nuevo pero el i18n antiguo lo sobrescribe
    (los textos traducibles revierten a la versión anterior). Se recalcula
    por request: el coste es leer dos ficheros pequeños, despreciable."""
    h = hashlib.sha256()
    for name in ("shared.js", "wizard.js"):
        f = WEB_DIR / "assets" / name
        if f.exists():
            h.update(f.read_bytes())
    return h.hexdigest()[:10]


def _render_page(request: Request, filename: str) -> HTMLResponse:
    html = (WEB_DIR / filename).read_text(encoding="utf-8")
    options_html = "".join(
        f'<option value="{tpl["id"]}">{tpl["name"]}</option>' for tpl in list_templates()
    )
    html = html.replace("<!--TEMPLATE_OPTIONS-->", options_html)
    html = html.replace("__SUPABASE_URL__", os.environ.get("PUBLIC_SUPABASE_URL", ""))
    html = html.replace("__SUPABASE_ANON_KEY__", os.environ.get("PUBLIC_SUPABASE_ANON_KEY", ""))
    html = html.replace("__API_BASE_URL__", os.environ.get("PUBLIC_API_BASE_URL", ""))
    html = html.replace("__SITE_URL__", _site_url(request))
    html = html.replace("__ASSET_VERSION__", _asset_version())
    return HTMLResponse(html)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return _render_page(request, "index.html")


@app.get("/pricing", response_class=HTMLResponse)
async def pricing_page(request: Request) -> HTMLResponse:
    return _render_page(request, "pricing.html")


@app.get("/api-access", response_class=HTMLResponse)
async def api_access_page(request: Request) -> HTMLResponse:
    return _render_page(request, "api-access.html")


@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt(request: Request) -> PlainTextResponse:
    content = f"User-agent: *\nAllow: /\nSitemap: {_site_url(request)}/sitemap.xml\n"
    return PlainTextResponse(content)


@app.get("/sitemap.xml")
async def sitemap_xml(request: Request) -> Response:
    site = _site_url(request)
    urls = "".join(f"<url><loc>{site}{path}</loc></url>" for path in ("/", "/pricing", "/api-access"))
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    return Response(content=xml, media_type="application/xml")


@app.get("/templates")
async def get_templates():
    return JSONResponse(list_templates())


@app.get("/healthz")
async def healthz():
    """Warm-up / liveness. El frontend hace ping aquí al cargar la página
    para mitigar el cold start del free tier de Render (spin-down tras
    inactividad)."""
    return JSONResponse({"status": "ok"})


@app.get("/api/me", response_model=AuthenticatedUser)
async def get_me(user: AuthenticatedUser = Depends(require_user)):
    """El tier real vive en public.users.tier, no en el JWT de Supabase Auth
    — el frontend usa esto para mostrar el badge de tier correctamente."""
    return user


# --------------------------------------------------------------------------
# Helpers compartidos
# --------------------------------------------------------------------------

def _safe_filename(name: str) -> str:
    """Descarta separadores de ruta y caracteres de control para el header
    Content-Disposition (evita path traversal / header injection)."""
    stem = Path(name or "documento").name.rsplit(".", 1)[0]
    cleaned = "".join(ch for ch in stem if ch.isprintable() and ch not in '\r\n"')
    return cleaned or "documento"


def _read_upload_text(raw: bytes) -> str:
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"El fichero no es UTF-8 válido: {exc}") from exc


def _parse_markdown_source(markdown: str, file: Optional[UploadFile], raw_file_bytes: Optional[bytes]):
    if markdown.strip():
        return markdown
    if raw_file_bytes:
        return _read_upload_text(raw_file_bytes)
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "No hay contenido Markdown.")


# --------------------------------------------------------------------------
# POST /api/convert — conversión genérica: pública, sin login, ilimitada.
# Es el lead magnet del producto (ver CLAUDE.md §5.1): solo lleva un
# rate-limit anti-abuso por IP, nunca una cuota de negocio. La plantilla es
# siempre la del catálogo whitelisted (converter.resolve_template) — subir y
# persistir una plantilla propia es una feature Pro y vive en un módulo aparte.
# --------------------------------------------------------------------------

@app.post("/api/convert")
async def api_convert(
    request: Request,
    markdown: str = Form(default=""),
    template: str = Form(default=""),
    title: Optional[str] = Form(default=None),
    author: Optional[str] = Form(default=None),
    filename: str = Form(default="documento"),
    file: Optional[UploadFile] = None,
):
    ip = get_client_ip(request)
    check_ip_rate_limit(ip)

    raw_file_bytes = await file.read() if file is not None and file.filename else None
    if raw_file_bytes and len(raw_file_bytes) > MAX_MARKDOWN_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "El fichero Markdown supera el tamaño máximo permitido.")
    md_text = _parse_markdown_source(markdown, file, raw_file_bytes)

    try:
        metadata, blocks = parse(md_text)
    except Exception as exc:  # Markdown malformado no debe tumbar el server con 500 opaco
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"No se pudo interpretar el Markdown: {exc}") from exc

    if title and "title" not in metadata:
        metadata["title"] = title
    if author and "author" not in metadata:
        metadata["author"] = author

    template_path = resolve_template(template)
    docx_bytes = await run_in_threadpool(build_docx, blocks, metadata, template_path)

    log_conversion(user=None, ip=ip, is_custom_template=False)

    safe_name = _safe_filename((file.filename if file and file.filename else filename))
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.docx"'},
    )


# --------------------------------------------------------------------------
# POST /api/v1/b2b/convert — B2B (obligatorio X-API-Key)
# --------------------------------------------------------------------------

@app.post("/api/v1/b2b/convert")
async def api_b2b_convert(
    markdown: str = Form(default=""),
    template: str = Form(default=""),
    title: Optional[str] = Form(default=None),
    author: Optional[str] = Form(default=None),
    filename: str = Form(default="documento"),
    file: Optional[UploadFile] = None,
    user: AuthenticatedUser = Depends(require_api_key),
):
    raw_file_bytes = await file.read() if file is not None and file.filename else None
    if raw_file_bytes and len(raw_file_bytes) > MAX_MARKDOWN_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "El fichero Markdown supera el tamaño máximo permitido.")
    md_text = _parse_markdown_source(markdown, file, raw_file_bytes)

    try:
        metadata, blocks = parse(md_text)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"No se pudo interpretar el Markdown: {exc}") from exc

    if title and "title" not in metadata:
        metadata["title"] = title
    if author and "author" not in metadata:
        metadata["author"] = author

    template_path = resolve_template(template)
    docx_bytes = await run_in_threadpool(build_docx, blocks, metadata, template_path)

    log_conversion(user, "b2b-api", False)

    safe_name = _safe_filename((file.filename if file and file.filename else filename))
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.docx"'},
    )
