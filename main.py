"""FastAPI app: UI estática + API REST de conversión Markdown -> DOCX.

Endpoints:
- GET  /                       SPA (web/index.html)
- GET  /templates              catálogo de plantillas disponibles
- POST /api/convert            conversión freemium (JWT opcional + límite por IP/usuario)
- POST /api/v1/b2b/convert     conversión B2B (obligatorio X-API-Key)

La conversión (`build_docx`) es CPU-bound y síncrona: se delega siempre a un
threadpool (`run_in_threadpool`) para no bloquear el event loop de asyncio,
tal y como señala el análisis de arquitectura del monolito original.
"""

import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from auth import (
    check_freemium_quota,
    get_client_ip,
    get_current_user_optional,
    log_conversion,
    require_api_key,
)
from converter import build_docx, list_templates, parse, resolve_template
from models import AuthenticatedUser

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"

MAX_MARKDOWN_BYTES = 2 * 1024 * 1024  # 2 MB: límite defensivo de payload
MAX_TEMPLATE_BYTES = 15 * 1024 * 1024  # 15 MB: plantillas .docx de referencia
UPSELL_PREVIEW_CHARS = 400

STRIPE_CHECKOUT_URL = os.environ.get("STRIPE_CHECKOUT_URL", "https://buy.stripe.com/test_xxx")

app = FastAPI(title="MD2Docx SaaS")

_frontend_origins = [o.strip() for o in os.environ.get("FRONTEND_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if (WEB_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(WEB_DIR / "assets")), name="assets")


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


def _preview_text(blocks: list, max_chars: int = UPSELL_PREVIEW_CHARS) -> str:
    parts = []
    for block in blocks:
        if block["type"] == "heading":
            parts.append(block["text"])
        elif block["type"] == "paragraph":
            parts.append("".join(r.get("text", "") for r in block.get("children", [])))
        if sum(len(p) for p in parts) >= max_chars:
            break
    text = "\n".join(p for p in parts if p.strip())
    return (text[:max_chars] + "…") if len(text) > max_chars else text


async def _resolve_custom_template(template_file: Optional[UploadFile]) -> Optional[str]:
    """Guarda la plantilla subida por el usuario en un fichero temporal y
    devuelve su ruta. None si no se subió ninguna plantilla custom."""
    if template_file is None or not template_file.filename:
        return None

    raw = await template_file.read()
    if len(raw) > MAX_TEMPLATE_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "La plantilla supera el tamaño máximo permitido.")

    tmp = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
    tmp.write(raw)
    tmp.close()
    return tmp.name


def _parse_markdown_source(markdown: str, file: Optional[UploadFile], raw_file_bytes: Optional[bytes]):
    if markdown.strip():
        return markdown
    if raw_file_bytes:
        return _read_upload_text(raw_file_bytes)
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "No hay contenido Markdown.")


# --------------------------------------------------------------------------
# POST /api/convert — freemium (web, JWT opcional)
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
    template_file: Optional[UploadFile] = None,
    user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
):
    ip = get_client_ip(request)

    # 1. Cuota freemium: 3 conversiones / 7 días por user_id o ip_address
    #    (no aplica a tiers distintos de 'free').
    check_freemium_quota(user, ip)

    # 2. Fuente del Markdown: el editor tiene prioridad sobre el fichero subido.
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

    # 3. Plantilla: subida custom (upsell) vs. catálogo whitelisted.
    custom_template_path = await _resolve_custom_template(template_file)
    is_custom_template = custom_template_path is not None
    template_path = custom_template_path or resolve_template(template)

    try:
        docx_bytes = await run_in_threadpool(build_docx, blocks, metadata, template_path)
    finally:
        if custom_template_path:
            os.unlink(custom_template_path)

    log_conversion(user, ip, is_custom_template)

    # 4. El "caramelo": plantilla custom + tier no-pro -> 402 con preview, sin binario.
    if is_custom_template and (user is None or user.tier != "pro"):
        return JSONResponse(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            content={
                "error": "upgrade_required",
                "message": (
                    "Tu documento con formato corporativo está listo. "
                    "Pásate a Pro para descargarlo e integrarlo en tu flujo."
                ),
                "preview_text": _preview_text(blocks),
                "checkout_url": STRIPE_CHECKOUT_URL,
            },
        )

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
