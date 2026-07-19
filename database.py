"""Cliente Supabase (Postgres + Auth) para el backend.

Usa siempre la service_role key: el backend necesita leer/escribir
`conversions_log`, `users.last_ips` y `api_keys` sin las restricciones de
Row Level Security pensadas para clientes finales. La service_role key NUNCA
debe llegar al frontend (ver .env.example / CLAUDE.md).
"""

import os
from functools import lru_cache

from supabase import Client, create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas. "
            "Copia .env.example a .env y rellena las credenciales del proyecto Supabase."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
