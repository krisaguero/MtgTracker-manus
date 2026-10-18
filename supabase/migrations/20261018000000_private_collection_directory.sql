-- Additive private collection directory schema.
-- Schema only: imports use explicit authenticated owner actions, never migrations.

create table if not exists public.mtg_inventory_imports (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  source_name text not null,
  source_hash text not null,
  source_csv text not null,
  row_count integer not null check (row_count > 0),
  copy_count integer not null check (copy_count >= 0),
  status text not null default 'pending' check (status in ('pending', 'complete')),
  imported_at timestamptz not null default now(),
  primary key (id),
  unique (owner_id, source_hash),
  unique (id, owner_id)
);

create table if not exists public.mtg_inventory_cards (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  identity_key text not null,
  name text not null,
  quantity integer not null check (quantity > 0),
  set_code text,
  collector_number text,
  scryfall_id text,
  finish text,
  language text,
  condition text,
  proxy boolean not null default false,
  trade_quantity integer not null default 0,
  provenance jsonb not null,
  merge_status text not null default 'conservative_max',
  primary key (id),
  unique (owner_id, identity_key),
  check (trade_quantity >= 0 and trade_quantity <= quantity),
  check (
    jsonb_typeof(provenance) = 'object'
    and provenance ?& array['source', 'identity', 'count', 'row_indices']
  )
);

create table if not exists public.mtg_inventory_import_rows (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  import_id uuid not null,
  source_row integer not null check (source_row > 0),
  quantity integer not null check (quantity > 0),
  identity_key text not null,
  raw_row jsonb not null,
  primary key (id),
  unique (import_id, source_row),
  foreign key (import_id, owner_id)
    references public.mtg_inventory_imports (id, owner_id)
    on delete cascade
);

create index if not exists mtg_inventory_imports_owner_id_idx
  on public.mtg_inventory_imports (owner_id);
create index if not exists mtg_inventory_cards_owner_id_idx
  on public.mtg_inventory_cards (owner_id);
create index if not exists mtg_inventory_import_rows_owner_id_idx
  on public.mtg_inventory_import_rows (owner_id);
create index if not exists mtg_inventory_import_rows_import_id_idx
  on public.mtg_inventory_import_rows (import_id);

alter table public.mtg_inventory_imports enable row level security;
alter table public.mtg_inventory_imports force row level security;
alter table public.mtg_inventory_cards enable row level security;
alter table public.mtg_inventory_cards force row level security;
alter table public.mtg_inventory_import_rows enable row level security;
alter table public.mtg_inventory_import_rows force row level security;

revoke all on table public.mtg_inventory_imports from anon, public, authenticated;
revoke all on table public.mtg_inventory_cards from anon, public, authenticated;
revoke all on table public.mtg_inventory_import_rows from anon, public, authenticated;
grant select, insert, update, delete on table public.mtg_inventory_imports to authenticated;
grant select, insert, update, delete on table public.mtg_inventory_cards to authenticated;
grant select, insert, update, delete on table public.mtg_inventory_import_rows to authenticated;

drop policy if exists "owners CRUD inventory imports" on public.mtg_inventory_imports;
create policy "owners CRUD inventory imports"
  on public.mtg_inventory_imports
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners CRUD inventory cards" on public.mtg_inventory_cards;
create policy "owners CRUD inventory cards"
  on public.mtg_inventory_cards
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners CRUD inventory import rows" on public.mtg_inventory_import_rows;
create policy "owners CRUD inventory import rows"
  on public.mtg_inventory_import_rows
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
