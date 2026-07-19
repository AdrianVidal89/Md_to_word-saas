-- =============================================================================
-- MD2Docx SaaS — plantillas Pro persistentes + prueba gratuita de 1 descarga
-- Aplica con: supabase db push  (o pegando en el SQL editor del proyecto)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Free trial: 1 descarga real con plantilla propia antes de pagar. NULL =
-- prueba disponible; se rellena la primera (y única) vez que un usuario
-- 'free' completa una conversión con una plantilla propia persistida.
-- -----------------------------------------------------------------------------
alter table public.users
    add column if not exists custom_template_trial_used_at timestamptz;

comment on column public.users.custom_template_trial_used_at is
    'Cuándo consumió el usuario su única descarga de prueba gratuita con plantilla propia. NULL = prueba aún disponible. No aplica a tier pro/enterprise (sin límite).';

-- -----------------------------------------------------------------------------
-- templates: plantillas .dotx/.docx corporativas subidas y persistidas por
-- el usuario (wizard de 3 pasos). style_mapping guarda, por cada "slot" que
-- el builder necesita (heading_1/2/3, table), el nombre de estilo de Word
-- detectado automáticamente o ajustado a mano como fallback.
-- -----------------------------------------------------------------------------
create table if not exists public.templates (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references public.users (id) on delete cascade,
    name           text not null,
    storage_path   text not null,
    style_mapping  jsonb not null default '{}'::jsonb,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

comment on table public.templates is
    'Plantillas corporativas propias persistidas en Supabase Storage (bucket user-templates). style_mapping: {"heading_1": "Nombre de estilo detectado", ...}.';

create index if not exists idx_templates_user on public.templates (user_id);

alter table public.templates enable row level security;

drop policy if exists "templates_all_own" on public.templates;
create policy "templates_all_own" on public.templates
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- conversions_log: distingue si una conversión con plantilla propia consumió
-- la prueba gratuita (útil para auditoría/soporte, no para el rate-limit).
-- -----------------------------------------------------------------------------
alter table public.conversions_log
    add column if not exists is_trial_download boolean not null default false;

comment on column public.conversions_log.is_trial_download is
    'true si esta conversión fue la única descarga de prueba gratuita con plantilla propia de un usuario no-pro.';

-- -----------------------------------------------------------------------------
-- Storage: bucket privado para las plantillas subidas, namespaced por
-- usuario (ruta "{user_id}/{template_id}.docx"). El backend siempre opera
-- con la service_role key (bypassa estas políticas); se definen igualmente
-- por si en el futuro el frontend accede directo con el JWT del usuario.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('user-templates', 'user-templates', false)
on conflict (id) do nothing;

drop policy if exists "user_templates_owner_rw" on storage.objects;
create policy "user_templates_owner_rw" on storage.objects
    for all using (
        bucket_id = 'user-templates'
        and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
        bucket_id = 'user-templates'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
