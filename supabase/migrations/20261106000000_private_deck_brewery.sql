-- Private Deckbox Brewery records and source metadata.
-- The tables hold no baked-in Deckbox data; imports use the signed-in user's
-- token and are protected by per-owner RLS plus the approved account email.
create table if not exists public.mtg_private_deck_brewery_imports (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  source_hash text not null check (source_hash ~ '^[a-f0-9]{64}$'),
  bundle_metadata jsonb not null check (jsonb_typeof(bundle_metadata) = 'object'),
  record_count integer not null check (record_count > 0),
  status text not null default 'importing' check (status in ('importing', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mtg_private_deck_brewery (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references public.mtg_private_deck_brewery_imports (owner_id) on delete cascade,
  deckbox_id text not null,
  source_record jsonb not null check (
    jsonb_typeof(source_record) = 'object'
    and source_record ? 'id'
    and source_record ? 'main'
    and source_record ? 'sideboard'
    and source_record ->> 'id' = deckbox_id
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id),
  unique (owner_id, deckbox_id)
);

create index if not exists mtg_private_deck_brewery_owner_id_idx
  on public.mtg_private_deck_brewery (owner_id);

alter table public.mtg_private_deck_brewery_imports enable row level security;
alter table public.mtg_private_deck_brewery_imports force row level security;
alter table public.mtg_private_deck_brewery enable row level security;
alter table public.mtg_private_deck_brewery force row level security;

revoke all on table public.mtg_private_deck_brewery_imports from anon, public, authenticated;
revoke all on table public.mtg_private_deck_brewery from anon, public, authenticated;
grant select, insert, update, delete on table public.mtg_private_deck_brewery_imports to authenticated;
grant select, insert, update, delete on table public.mtg_private_deck_brewery to authenticated;

drop policy if exists "approved owner CRUD private brewery imports" on public.mtg_private_deck_brewery_imports;
create policy "approved owner CRUD private brewery imports"
  on public.mtg_private_deck_brewery_imports
  for all to authenticated
  using (
    auth.uid() = owner_id
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'krisaguero@gmail.com'
  )
  with check (
    auth.uid() = owner_id
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'krisaguero@gmail.com'
  );

drop policy if exists "approved owner CRUD private brewery decks" on public.mtg_private_deck_brewery;
create policy "approved owner CRUD private brewery decks"
  on public.mtg_private_deck_brewery
  for all to authenticated
  using (
    auth.uid() = owner_id
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'krisaguero@gmail.com'
  )
  with check (
    auth.uid() = owner_id
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'krisaguero@gmail.com'
  );
