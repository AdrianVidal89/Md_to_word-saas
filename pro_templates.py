"""Endpoints Pro: subir/mapear/convertir con plantillas corporativas propias.

Muro de pago del producto (ver CLAUDE.md §5.2). Un usuario 'free' tiene
derecho a exactamente 1 descarga real de prueba con su plantilla antes de
pagar (ver auth.check_custom_template_quota) — no hay ofuscación: esa
primera descarga es el .docx real y completo, no una preview difuminada.

La persistencia usa Supabase Storage (bucket `user-templates`, namespaced
por `{user_id}/{template_id}.docx`) + la tabla `public.templates` (ver
supabase/migrations/002_pro_templates.sql). El auto-mapeo de estilos vive en
template_mapping.py, una capa nueva que NO toca converter/ (ver CLAUDE.md):
antes de convertir, se aplica el mapeo sobre una copia en memoria de la
plantilla y esa copia se pasa a build_docx sin modificar el builder.
"""

import os
import tempfile
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse, Response
from starlette.concurrency import run_in_threadpool

from auth import (
    check_custom_template_quota,
    log_conversion,
    mark_custom_template_trial_used,
    require_user,
    require_user_for_conversion,
)
from converter import build_docx, parse
from database import get_supabase
from models import AuthenticatedUser, StyleMapping, TemplateSummary, TemplateUploadResponse
from template_mapping import apply_style_mapping, detect_style_mapping, list_available_styles

router = APIRouter(prefix="/api/pro", tags=["pro-templates"])

BUCKET_NAME = "user-templates"
MAX_TEMPLATE_BYTES = 15 * 1024 * 1024
DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _storage_path(user_id: str, template_id: str) -> str:
    return f"{user_id}/{template_id}.docx"


def _to_summary(row: dict) -> TemplateSummary:
    return TemplateSummary(
        id=row["id"],
        name=row["name"],
        style_mapping=StyleMapping(**(row.get("style_mapping") or {})),
        created_at=row["created_at"],
    )


def _get_owned_template(supabase, template_id: str, user_id: str) -> dict:
    resp = (
        supabase.table("templates")
        .select("*")
        .eq("id", template_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plantilla no encontrada")
    return rows[0]


# --------------------------------------------------------------------------
# Paso 1 del wizard: subir .dotx/.docx sin modificar + auto-mapeo de estilos
# --------------------------------------------------------------------------

@router.post("/templates", response_model=TemplateUploadResponse)
async def upload_template(
    file: UploadFile,
    name: str = Form(default=""),
    user: AuthenticatedUser = Depends(require_user),
):
    if not file.filename or not file.filename.lower().endswith((".docx", ".dotx")):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sube un fichero .docx o .dotx")

    raw = await file.read()
    if len(raw) > MAX_TEMPLATE_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "La plantilla supera el tamaño máximo permitido.")

    try:
        detected = detect_style_mapping(raw)
        available = list_available_styles(raw)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"No se pudo leer la plantilla: {exc}") from exc

    template_id = str(uuid.uuid4())
    storage_path = _storage_path(user.id, template_id)
    template_name = name.strip() or file.filename.rsplit(".", 1)[0]
    supabase = get_supabase()

    supabase.table("templates").insert(
        {
            "id": template_id,
            "user_id": user.id,
            "name": template_name,
            "storage_path": storage_path,
            "style_mapping": detected,
        }
    ).execute()

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            storage_path, raw, {"content-type": DOCX_MEDIA_TYPE, "upsert": "true"}
        )
    except Exception as exc:
        supabase.table("templates").delete().eq("id", template_id).execute()
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"No se pudo guardar la plantilla: {exc}") from exc

    return TemplateUploadResponse(
        id=template_id,
        name=template_name,
        detected_mapping=StyleMapping(**detected),
        available_styles=available,
    )


@router.get("/templates")
async def list_my_templates(user: AuthenticatedUser = Depends(require_user)):
    supabase = get_supabase()
    resp = supabase.table("templates").select("*").eq("user_id", user.id).execute()
    return [_to_summary(row) for row in (resp.data or [])]


# --------------------------------------------------------------------------
# Paso 2 del wizard: pantalla de auto-mapeo con ajuste manual como fallback
# --------------------------------------------------------------------------

@router.put("/templates/{template_id}/mapping", response_model=TemplateSummary)
async def update_mapping(
    template_id: str,
    mapping: StyleMapping,
    user: AuthenticatedUser = Depends(require_user),
):
    supabase = get_supabase()
    row = _get_owned_template(supabase, template_id, user.id)
    updated = (
        supabase.table("templates")
        .update({"style_mapping": mapping.model_dump()})
        .eq("id", row["id"])
        .execute()
    )
    return _to_summary(updated.data[0])


# --------------------------------------------------------------------------
# Paso 3 del wizard: conversión de prueba con preview (y conversión Pro
# recurrente una vez pagada la suscripción).
# --------------------------------------------------------------------------

@router.post("/templates/{template_id}/convert")
async def convert_with_template(
    template_id: str,
    markdown: str = Form(default=""),
    title: Optional[str] = Form(default=None),
    author: Optional[str] = Form(default=None),
    filename: str = Form(default="documento"),
    user: AuthenticatedUser = Depends(require_user_for_conversion),
):
    check_custom_template_quota(user)

    if not markdown.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No hay contenido Markdown.")

    supabase = get_supabase()
    row = _get_owned_template(supabase, template_id, user.id)

    try:
        metadata, blocks = parse(markdown)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"No se pudo interpretar el Markdown: {exc}") from exc

    if title and "title" not in metadata:
        metadata["title"] = title
    if author and "author" not in metadata:
        metadata["author"] = author

    raw_template = supabase.storage.from_(BUCKET_NAME).download(row["storage_path"])
    mapped_bytes = apply_style_mapping(raw_template, row.get("style_mapping") or {})

    tmp = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
    tmp.write(mapped_bytes)
    tmp.close()
    try:
        docx_bytes = await run_in_threadpool(build_docx, blocks, metadata, tmp.name)
    finally:
        os.unlink(tmp.name)

    is_trial = user.tier == "free" and not user.custom_template_trial_used
    log_conversion(user, ip="pro-app", is_custom_template=True, is_trial_download=is_trial)
    if is_trial:
        mark_custom_template_trial_used(user.id)

    safe_name = "".join(ch for ch in (filename or "documento") if ch.isprintable() and ch not in '\r\n"') or "documento"
    return Response(
        content=docx_bytes,
        media_type=DOCX_MEDIA_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}.docx"',
            # Le dice al wizard si esta descarga consumió la prueba gratuita,
            # para que el mensaje de éxito sea preciso (ver CLAUDE.md §5.2).
            "X-Formalize-Trial-Used": "true" if is_trial else "false",
        },
    )


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: AuthenticatedUser = Depends(require_user)):
    supabase = get_supabase()
    row = _get_owned_template(supabase, template_id, user.id)
    supabase.storage.from_(BUCKET_NAME).remove([row["storage_path"]])
    supabase.table("templates").delete().eq("id", row["id"]).execute()
    return JSONResponse({"deleted": True})
