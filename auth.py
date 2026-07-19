"""Autenticación y controles de negocio (freemium, anti-abuso, API keys).

- JWT nativo de Supabase Auth, verificado localmente (HS256 + SUPABASE_JWT_SECRET),
  sin llamada de red a Supabase en el hot path.
- Freemium: 3 conversiones / 7 días por user_id (autenticado) o ip_address (anónimo).
- Anti-abuso: un usuario 'pro' que aparece con >PRO_MAX_IPS_24H IPs distintas
  en 24h se bloquea con 403 (posible cuenta compartida).
- B2B: X-API-Key validado contra el hash almacenado en api_keys.key_hash.
"""

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, Request, status

from database import get_supabase
from models import AuthenticatedUser

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
PRO_MAX_IPS_24H = int(os.environ.get("PRO_MAX_IPS_24H", "2"))
FREE_TIER_WEEKLY_LIMIT = int(os.environ.get("FREE_TIER_WEEKLY_LIMIT", "3"))


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _decode_jwt(token: str) -> dict:
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "SUPABASE_JWT_SECRET no configurado en el backend.",
        )
    try:
        return jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Token inválido: {exc}") from exc


def _load_or_create_profile(supabase, user_id: str, email: Optional[str]) -> dict:
    resp = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    rows = resp.data or []
    if rows:
        return rows[0]
    # El trigger on_auth_user_created debería haber creado ya la fila; esto
    # es un fallback defensivo (p.ej. usuarios creados antes de la migración).
    inserted = supabase.table("users").insert({"id": user_id, "email": email or ""}).execute()
    return inserted.data[0]


def _check_ip_abuse(supabase, profile: dict, ip: str) -> None:
    if profile.get("tier") != "pro":
        return

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=24)

    recent = []
    for entry in profile.get("last_ips") or []:
        try:
            ts = datetime.fromisoformat(entry["ts"])
        except (KeyError, ValueError, TypeError):
            continue
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if ts >= cutoff:
            recent.append(entry)

    recent.append({"ip": ip, "ts": now.isoformat()})
    distinct_ips = {entry["ip"] for entry in recent}

    supabase.table("users").update({"last_ips": recent}).eq("id", profile["id"]).execute()

    if len(distinct_ips) > PRO_MAX_IPS_24H:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=(
                f"Se han detectado {len(distinct_ips)} IPs distintas en 24h para esta cuenta "
                "Pro. Conversión bloqueada por posible cuenta compartida."
            ),
        )


async def get_current_user_optional(
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> Optional[AuthenticatedUser]:
    """None si la request es anónima (no hay endpoint freemium que deba
    rechazar tráfico anónimo: se limita por IP en su lugar)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    payload = _decode_jwt(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sin claim 'sub'")

    supabase = get_supabase()
    profile = _load_or_create_profile(supabase, user_id, payload.get("email"))
    _check_ip_abuse(supabase, profile, get_client_ip(request))

    return AuthenticatedUser(id=profile["id"], email=profile.get("email"), tier=profile.get("tier", "free"))


async def require_user(
    user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> AuthenticatedUser:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Se requiere iniciar sesión")
    return user


def check_freemium_quota(user: Optional[AuthenticatedUser], ip: str) -> None:
    """Lanza 429 si el usuario/IP ya agotó las FREE_TIER_WEEKLY_LIMIT
    conversiones de los últimos 7 días. No aplica a tiers != 'free'."""
    if user and user.tier != "free":
        return

    supabase = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    query = supabase.table("conversions_log").select("id", count="exact").gte("created_at", cutoff)
    query = query.eq("user_id", user.id) if user else query.eq("ip_address", ip)
    resp = query.execute()
    count = resp.count if resp.count is not None else len(resp.data or [])

    if count >= FREE_TIER_WEEKLY_LIMIT:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Límite de {FREE_TIER_WEEKLY_LIMIT} conversiones gratuitas por semana alcanzado. "
                "Hazte Pro para conversiones ilimitadas."
            ),
        )


def log_conversion(user: Optional[AuthenticatedUser], ip: str, is_custom_template: bool) -> None:
    supabase = get_supabase()
    supabase.table("conversions_log").insert(
        {
            "user_id": user.id if user else None,
            "ip_address": ip,
            "is_custom_template": is_custom_template,
        }
    ).execute()


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


async def require_api_key(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
) -> AuthenticatedUser:
    """Autenticación B2B: obligatoria vía header X-API-Key, validada contra
    el hash almacenado (nunca se guarda la clave en texto plano)."""
    if not x_api_key:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falta el header X-API-Key")

    key_hash = hash_api_key(x_api_key)
    supabase = get_supabase()
    resp = (
        supabase.table("api_keys")
        .select("id, user_id, is_active, key_hash")
        .eq("key_hash", key_hash)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows or not hmac.compare_digest(rows[0]["key_hash"], key_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "API key inválida o inactiva")

    user_id = rows[0]["user_id"]
    profile_resp = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    profile_rows = profile_resp.data or []
    profile = profile_rows[0] if profile_rows else {"id": user_id, "email": None, "tier": "enterprise"}

    return AuthenticatedUser(id=profile["id"], email=profile.get("email"), tier=profile.get("tier", "enterprise"))
