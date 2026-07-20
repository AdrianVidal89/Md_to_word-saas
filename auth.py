"""Autenticación y controles de negocio (rate-limit anti-abuso, anti-abuso pro, API keys).

- JWT nativo de Supabase Auth, verificado localmente (HS256 + SUPABASE_JWT_SECRET),
  sin llamada de red a Supabase en el hot path.
- La conversión genérica (`/api/convert`) es pública, sin login y sin límite de
  negocio: solo lleva un rate-limit anti-abuso por IP (ver check_ip_rate_limit),
  pensado para proteger la capa gratuita de Render de scripts/loops, no para
  frenar al usuario legítimo.
- Anti-abuso de cuentas Pro: un usuario 'pro' que aparece con >PRO_MAX_IPS_24H
  IPs distintas en 24h se bloquea con 403 (posible cuenta compartida).
- Muro de pago Pro (plantillas propias persistentes): un usuario 'free' tiene
  derecho a exactamente 1 descarga real de prueba antes de pagar (ver
  check_custom_template_quota / mark_custom_template_trial_used).
- B2B: X-API-Key validado contra el hash almacenado en api_keys.key_hash.
"""

import hashlib
import hmac
import logging
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Optional

logger = logging.getLogger(__name__)

import jwt
from fastapi import Depends, Header, HTTPException, Request, status

from database import get_supabase
from models import AuthenticatedUser

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
PRO_MAX_IPS_24H = int(os.environ.get("PRO_MAX_IPS_24H", "2"))

# Precio temporalmente en 0€ (validación técnica antes de facturar):
# mientras esté activo, el muro de pago Pro no se aplica (la 2ª+ descarga
# con plantilla propia de un 'free' NO devuelve 402). Sirve para lanzar la
# web, dejar registrarse y medir tracción antes de mover dinero. Para
# empezar a cobrar: FREE_PRICING_MODE=false (o quitar la env var y dejar
# default false) — la política de precios/paywall vuelve intacta, no se ha
# borrado nada. En el frontend, `pricing.html` muestra el precio real
# tachado con "Free for a limited time" mientras esto esté activo (cambio
# manual en el HTML, no hay flag espejo en shared.js — ver CLAUDE.md §5).
FREE_PRICING_MODE = os.environ.get("FREE_PRICING_MODE", "true").lower() in ("1", "true", "yes", "on")

# Cliente JWKS para verificar los JWT ASIMÉTRICOS (ES256/RS256) que emite
# Supabase con las "JWT signing keys" nuevas (hoy el default en proyectos
# recientes). Se cachea: PyJWKClient guarda las claves públicas en memoria, así
# que no hay llamada de red en el hot path salvo el primer token / rotación.
_jwks_client = None
_jwks_lock = Lock()


def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None and SUPABASE_URL:
        with _jwks_lock:
            if _jwks_client is None:
                _jwks_client = jwt.PyJWKClient(
                    f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
                )
    return _jwks_client

RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX_REQUESTS", "20"))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))

# Ventana deslizante en memoria del proceso: suficiente para anti-abuso (no es
# una cuota de negocio que deba sobrevivir a un reinicio) y no añade infra de
# pago (ni Redis ni una tabla de Postgres con throughput de escritura alto).
_rate_limit_lock = Lock()
_rate_limit_hits: dict[str, deque] = defaultdict(deque)


def check_ip_rate_limit(ip: str) -> None:
    """Lanza 429 si la IP supera RATE_LIMIT_MAX_REQUESTS peticiones en los
    últimos RATE_LIMIT_WINDOW_SECONDS. Anti-abuso, no límite de producto."""
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS

    with _rate_limit_lock:
        hits = _rate_limit_hits[ip]
        while hits and hits[0] < cutoff:
            hits.popleft()

        if len(hits) >= RATE_LIMIT_MAX_REQUESTS:
            retry_after = max(1, int(hits[0] + RATE_LIMIT_WINDOW_SECONDS - now))
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Demasiadas conversiones desde esta IP. Reintenta en {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )

        hits.append(now)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _decode_jwt(token: str) -> dict:
    """Verifica el JWT de Supabase Auth. Soporta los dos esquemas de firma:
    - HS256 (legacy): clave simétrica compartida SUPABASE_JWT_SECRET.
    - ES256/RS256 (asimétrico, "JWT signing keys" nuevas): clave pública del
      proyecto, obtenida del JWKS (`/auth/v1/.well-known/jwks.json`).
    El algoritmo se detecta en la cabecera del token, no se asume."""
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Token inválido: {exc}") from exc

    try:
        if alg == "HS256":
            if not SUPABASE_JWT_SECRET:
                raise HTTPException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "SUPABASE_JWT_SECRET no configurado en el backend.",
                )
            key = SUPABASE_JWT_SECRET
        else:
            client = _get_jwks_client()
            if client is None:
                raise HTTPException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "SUPABASE_URL no configurado: no se puede verificar un JWT asimétrico.",
                )
            key = client.get_signing_key_from_jwt(token).key

        return jwt.decode(
            token,
            key,
            algorithms=[alg or "HS256"],
            audience="authenticated",
        )
    except HTTPException:
        raise
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Token inválido: {exc}") from exc
    except Exception as exc:  # p. ej. fallo de red al traer el JWKS
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            f"No se pudo verificar el token (JWKS): {exc}",
        ) from exc


def _load_or_create_profile(supabase, user_id: str, email: Optional[str]) -> dict:
    resp = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    rows = resp.data or []
    if rows:
        return rows[0]
    # El trigger on_auth_user_created debería haber creado ya la fila; esto
    # es un fallback defensivo (p.ej. usuarios creados antes de la migración).
    inserted = supabase.table("users").insert({"id": user_id, "email": email or ""}).execute()
    return inserted.data[0]


def _check_ip_abuse(supabase, profile: dict, ip: str) -> int:
    """Registra la IP de origen en la ventana deslizante de 24h y devuelve el
    nº de IPs distintas observadas. NO lanza 403: la resolución de identidad
    (/api/me, listar plantillas, etc.) debe funcionar SIEMPRE, aunque el pro
    aparezca desde muchas IPs (típico en móvil/5G, donde la IP cambia sola).
    El bloqueo por posible cuenta compartida (§5.4) lo decide únicamente el
    endpoint de conversión (ver require_user_for_conversion)."""
    if profile.get("tier") != "pro":
        return 0

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

    return len(distinct_ips)


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
    # Registramos la IP y guardamos el nº de IPs distintas en request.state,
    # pero NO bloqueamos aquí: solo el endpoint de conversión lo enforcea.
    # Best-effort: un fallo al escribir last_ips no puede tumbar la identidad
    # (/api/me debe responder siempre que el JWT sea válido).
    try:
        request.state.pro_ip_count = _check_ip_abuse(supabase, profile, get_client_ip(request))
    except Exception:
        request.state.pro_ip_count = 0

    return AuthenticatedUser(
        id=profile["id"],
        email=profile.get("email"),
        tier=profile.get("tier", "free"),
        custom_template_trial_used=bool(profile.get("custom_template_trial_used_at")),
    )


async def require_user(
    user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
) -> AuthenticatedUser:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Se requiere iniciar sesión")
    return user


async def require_user_for_conversion(
    request: Request,
    user: AuthenticatedUser = Depends(require_user),
) -> AuthenticatedUser:
    """Igual que require_user pero aplica el anti-abuso de cuentas Pro (§5.4):
    si en 24h se han visto más de PRO_MAX_IPS_24H IPs distintas, se bloquea
    SOLO la conversión con 403 (no la identidad ni las lecturas). El conteo lo
    dejó get_current_user_optional en request.state.pro_ip_count."""
    if getattr(request.state, "pro_ip_count", 0) > PRO_MAX_IPS_24H:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=(
                f"Se han detectado {request.state.pro_ip_count} IPs distintas en 24h para esta "
                "cuenta Pro. Conversión bloqueada por posible cuenta compartida."
            ),
        )
    return user


def log_conversion(
    user: Optional[AuthenticatedUser],
    ip: str,
    is_custom_template: bool,
    is_trial_download: bool = False,
) -> None:
    """Best-effort: es un registro de auditoría/analítica, no debe tumbar
    una conversión que ya se generó correctamente si Supabase está caído o
    inalcanzable (evita un 500 opaco por un problema ajeno a la conversión)."""
    try:
        supabase = get_supabase()
        supabase.table("conversions_log").insert(
            {
                "user_id": user.id if user else None,
                "ip_address": ip,
                "is_custom_template": is_custom_template,
                "is_trial_download": is_trial_download,
            }
        ).execute()
    except Exception:
        logger.warning("No se pudo registrar la conversión en conversions_log", exc_info=True)


def check_custom_template_quota(user: AuthenticatedUser) -> None:
    """Muro de pago Pro (ver CLAUDE.md §5.2), con una prueba gratuita: deja
    pasar sin límite a tiers pro/enterprise; para 'free' permite exactamente
    1 descarga real con plantilla propia y bloquea las siguientes con 402
    hasta que el usuario se haga Pro. No hay ofuscación aquí — la primera
    descarga es el fichero real completo, no una preview difuminada."""
    if FREE_PRICING_MODE:
        return  # Precio temporalmente en 0€: sin muro de pago, todo ilimitado (ver flag arriba).
    if user.tier != "free":
        return
    if not user.custom_template_trial_used:
        return
    raise HTTPException(
        status.HTTP_402_PAYMENT_REQUIRED,
        detail=(
            "Ya usaste tu descarga de prueba gratuita con tu plantilla propia. "
            "Hazte Pro para conversiones ilimitadas con tu plantilla corporativa."
        ),
    )


def mark_custom_template_trial_used(user_id: str) -> None:
    supabase = get_supabase()
    supabase.table("users").update(
        {"custom_template_trial_used_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", user_id).execute()


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
