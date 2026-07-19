"""Modelos Pydantic para requests/responses de la API (tipado de FastAPI)."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    """Usuario resuelto a partir de un JWT de Supabase Auth válido."""

    id: str
    email: Optional[str] = None
    tier: Literal["free", "pro", "enterprise"] = "free"


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class UpsellResponse(BaseModel):
    """Cuerpo devuelto con HTTP 402 cuando un usuario no-pro sube una
    plantilla personalizada. Nunca contiene el binario real del .docx."""

    error: Literal["upgrade_required"] = "upgrade_required"
    message: str = (
        "Tu documento con formato corporativo está listo. "
        "Pásate a Pro para descargarlo e integrarlo en tu flujo."
    )
    preview_text: str
    checkout_url: str


class RateLimitResponse(BaseModel):
    error: Literal["rate_limit_exceeded"] = "rate_limit_exceeded"
    message: str = "Has alcanzado el límite de conversiones gratuitas de esta semana."
    limit: int
    retry_after_days: int = 7


class TemplateInfo(BaseModel):
    id: str
    name: str


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
