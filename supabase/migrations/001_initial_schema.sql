-- =============================================================================
-- Formalize — esquema inicial
-- Aplica con: supabase db push  (o pegando en el SQL editor del proyecto)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- users: perfil de negocio 1:1 con auth.users (id compartido).
-- auth.users es la fuente de verdad de identidad/credenciales (gestionada por
-- Supabase Auth); esta tabla guarda tier de monetización y datos anti-abuso.
-- -----------------------------------------------------------------------------
create table if not exists public.users (
    id          uuid primary key references auth.users (id) on delete cascade,
    email       text not null,
    tier        varchar(20) not null default 'free'
                    check (tier in ('free', 'pro', 'enterprise')),
    last_ips    jsonb not null default '[]'::jsonb,
    created_at  timestamptz not null default now()
);

comment on table public.users is
    'Perfil de negocio del usuario. id = auth.users.id. tier controla límites freemium/pro.';
comment on column public.users.last_ips is
    'Lista JSONB de {ip, ts} de los últimos accesos autenticados, usada para detectar cuentas compartidas (>2 IPs distintas en 24h).';

create index if not exists idx_users_tier on public.users (tier);

-- Auto-crear fila de perfil cuando Supabase Auth crea un usuario nuevo.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- conversions_log: una fila por conversión ejecutada (registrada o anónima).
-- user_id es nullable para poder trackear por IP a usuarios no registrados
-- (necesario para aplicar el límite freemium de 3/semana a anónimos).
-- -----------------------------------------------------------------------------
create table if not exists public.conversions_log (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid references public.users (id) on delete set null,
    ip_address          varchar(64),
    is_custom_template  boolean not null default false,
    created_at          timestamptz not null default now()
);

comment on table public.conversions_log is
    'Auditoría de cada conversión. Usada para el rate-limit freemium (3 por 7 días) por user_id o ip_address.';

create index if not exists idx_conversions_user_created
    on public.conversions_log (user_id, created_at desc);
create index if not exists idx_conversions_ip_created
    on public.conversions_log (ip_address, created_at desc);

-- -----------------------------------------------------------------------------
-- api_keys: claves B2B. Nunca se guarda la clave en texto plano, solo su hash.
-- -----------------------------------------------------------------------------
create table if not exists public.api_keys (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.users (id) on delete cascade,
    key_hash    varchar(128) not null unique,
    is_active   boolean not null default true,
    created_at  timestamptz not null default now()
);

comment on table public.api_keys is
    'Claves de API para el endpoint B2B (/api/v1/b2b/convert). key_hash = sha256 hex de la clave real; la clave en claro solo se muestra una vez al generarla.';

create index if not exists idx_api_keys_user on public.api_keys (user_id);
create index if not exists idx_api_keys_active_hash on public.api_keys (key_hash) where is_active;

-- -----------------------------------------------------------------------------
-- Row Level Security: el backend accede con la service_role key (bypassa RLS),
-- pero se habilita RLS + políticas mínimas por si el frontend llega a leer
-- directamente vía anon/authenticated key en el futuro.
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.conversions_log enable row level security;
alter table public.api_keys enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
    for select using (auth.uid() = id);

drop policy if exists "conversions_select_own" on public.conversions_log;
create policy "conversions_select_own" on public.conversions_log
    for select using (auth.uid() = user_id);

drop policy if exists "api_keys_select_own" on public.api_keys;
create policy "api_keys_select_own" on public.api_keys
    for select using (auth.uid() = user_id);
