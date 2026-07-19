"""FastAPI app: UI estática + API REST de conversión Markdown -> DOCX.

Endpoints:
- GET  /                       SPA (web/index.html)
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

import os
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from auth import check_ip_rate_limit, get_client_ip, log_conversion, require_api_key
from converter import build_docx, list_templates, parse, resolve_template
from models import AuthenticatedUser
from pro_templates import router as pro_templates_router

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"

MAX_MARKDOWN_BYTES = 2 * 1024 * 1024  # 2 MB: límite defensivo de payload

app = FastAPI(title="MD2Docx SaaS")

_frontend_origins = [o.strip() for o in os.environ.get("FRONTEND_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-MD2Docx-Trial-Used"],
)

if (WEB_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(WEB_DIR / "assets")), name="assets")

app.include_router(pro_templates_router)


# --------------------------------------------------------------------------
# UI estática
# --------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    html = (WEB_DIR / "index.html").read_text(encoding="utf-8")
    options_html = "".join(
        f'<option value="{tpl["id"]}">{tpl["name"]}</option>' for tpl in list_templates()
    )
    html = html.replace("<!--TEMPLATE_OPTIONS-->", options_html)
    html = html.replace("__SUPABASE_URL__", os.environ.get("PUBLIC_SUPABASE_URL", ""))
    html = html.replace("__SUPABASE_ANON_KEY__", os.environ.get("PUBLIC_SUPABASE_ANON_KEY", ""))
    html = html.replace("__API_BASE_URL__", os.environ.get("PUBLIC_API_BASE_URL", ""))
    return HTMLResponse(html)


@app.get("/templates")
async def get_templates():
    return JSONResponse(list_templates())


@app.get("/healthz")
async def healthz():
    """Warm-up / liveness. El frontend hace ping aquí al cargar la página
    para mitigar el cold start del free tier de Render (spin-down tras
    inactividad)."""
    return JSONResponse({"status": "ok"})


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
