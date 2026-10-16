-- Private per-user workspace backup table.
-- The following migration tightens default authenticated-role grants before the browser feature is enabled.
create table if not exists public.mtg_personal_workspace_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  backup jsonb not null check (jsonb_typeof(backup) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.mtg_personal_workspace_backups enable row level security;

revoke all on table public.mtg_personal_workspace_backups from anon;
grant select, insert, update on table public.mtg_personal_workspace_backups to authenticated;

drop policy if exists "users read their own workspace backup" on public.mtg_personal_workspace_backups;
create policy "users read their own workspace backup"
  on public.mtg_personal_workspace_backups
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert their own workspace backup" on public.mtg_personal_workspace_backups;
create policy "users insert their own workspace backup"
  on public.mtg_personal_workspace_backups
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update their own workspace backup" on public.mtg_personal_workspace_backups;
create policy "users update their own workspace backup"
  on public.mtg_personal_workspace_backups
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
