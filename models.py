"""Modelos Pydantic para requests/responses de la API (tipado de FastAPI)."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    """Usuario resuelto a partir de un JWT de Supabase Auth válido."""

    id: str
    email: Optional[str] = None
    tier: Literal["free", "pro", "enterprise"] = "free"
    custom_template_trial_used: bool = False


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class RateLimitResponse(BaseModel):
    """Cuerpo devuelto con HTTP 429 por el rate-limit anti-abuso por IP del
    endpoint público de conversión. No es un límite de negocio (el free es
    ilimitado) — protege la capa gratuita de Render de scripts/loops."""

    error: Literal["rate_limited"] = "rate_limited"
    message: str
    retry_after_seconds: int


class TemplateInfo(BaseModel):
    id: str
    name: str


class StyleMapping(BaseModel):
    """Mapeo Markdown -> estilo de Word detectado (o ajustado a mano) para
    una plantilla Pro. Un slot en None significa "sin detectar": la UI debe
    ofrecer siempre el dropdown manual con la lista de estilos disponibles
    en la plantilla como fallback (ver template_mapping.py)."""

    heading_1: Optional[str] = None
    heading_2: Optional[str] = None
    heading_3: Optional[str] = None
    table: Optional[str] = None


class TemplateUploadResponse(BaseModel):
    id: str
    name: str
    detected_mapping: StyleMapping
    available_styles: list[str]


class TemplateSummary(BaseModel):
    id: str
    name: str
    style_mapping: StyleMapping
    created_at: str


class TemplateDetailResponse(TemplateSummary):
    """TemplateSummary + los estilos disponibles en el .docx/.dotx guardado,
    para poder reabrir el paso 2 (mapeo) de una plantilla ya subida sin
    obligar a resubir el fichero."""

    available_styles: list[str]


class TemplateRenameRequest(BaseModel):
    name: str = Field(..., min_length=1)


class ApiKeyCreated(BaseModel):
    """Devuelto una única vez al crear una API key: la clave en claro no se
    persiste, solo su hash (ver supabase/migrations/001_initial_schema.sql)."""

    id: str
    api_key: str = Field(..., description="Guárdala ahora: no se puede recuperar de nuevo.")


class B2BConvertMeta(BaseModel):
    filename: str = "documento"
    title: Optional[str] = None
    author: Optional[str] = None
    template: Optional[str] = None
