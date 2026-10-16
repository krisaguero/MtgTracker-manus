# Optional private workspace backup (local review)

The app remains local-first. Cloud backup is available only after the user explicitly opts in, signs in to a Supabase Auth account, and presses **Back up to cloud** or **Restore from cloud**. There is no automatic upload, background sync, or use of the app's existing sign-in identity.

## Local configuration

For a later app environment, configure only the Supabase project URL and its **publishable/anon client key** as build-time variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never put a service-role key in a `VITE_` variable or browser bundle. The browser client calls Supabase Auth and PostgREST directly with the signed-in user's access token; all table access is constrained by row-level security. Auth tokens are kept in tab-scoped `sessionStorage`, not in the backup payload. Passwords are sent only to Supabase Auth for the requested sign-in/sign-up and are not saved by this app.

## Schema review

`supabase/migrations/20261015000000_create_private_workspace_backups.sql` creates one JSONB backup row per authenticated user. RLS allows only that user to read, insert, and update their own row. Anonymous access is revoked. There is intentionally no client delete policy. Disconnecting or opting out removes the local tab session but does **not** erase a previously uploaded cloud copy.

This is a local code artifact only. The migration has not been run against any Supabase project, and no Supabase data or schema has been read or changed as part of this implementation.

## Data scope and restore behavior

The payload is the app's existing versioned `LocalWorkspaceBackup`: collection printings, Commander notes/deck snapshots, local saved decklists, duel inventories, valuation history, collection planner, and Limited workspace. It excludes passwords, Supabase tokens, analytics credentials, app authentication details, and environment secrets. Backing up replaces the single cloud backup for the signed-in Supabase user. Restoring requires a local confirmation because it replaces the current browser workspace. The existing backup validator must accept the downloaded JSON before it can be restored.

Before enabling this in a deployed environment, review the migration, configure the public client variables, and verify Supabase Auth email-confirmation settings and RLS behavior in a non-production project. No deployment is included here.
