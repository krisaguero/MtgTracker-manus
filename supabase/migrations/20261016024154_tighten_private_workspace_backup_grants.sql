-- Supabase defaults can grant extra table-level privileges to authenticated.
-- RLS does not protect TRUNCATE, so explicitly remove inherited privileges first.
revoke all on table public.mtg_personal_workspace_backups from anon, authenticated;
grant select, insert, update on table public.mtg_personal_workspace_backups to authenticated;
