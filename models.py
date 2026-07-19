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
