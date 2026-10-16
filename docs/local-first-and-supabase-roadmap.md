# Local-first data and Supabase migration plan

## Current first phase (implemented locally)

- **Collection imports** (card name, quantity, printing, finish, condition, and language) are parsed and stored in the browser. The signed-in import fingerprint/count mutation has been removed from the client and server router. The unused legacy MySQL audit-table definition remains only to avoid an unplanned schema migration; no current route writes to it. Existing rows, if any, have not been deleted.
- **Saved Commander precon snapshots** now save to browser storage without requiring sign-in. The Commander Passport roster, two duel-builder inventories, and up-to-30 valuation snapshots are also browser-local. The Passport no longer inserts example decks as if they were the user's records.
- The Collection page now provides a **versioned JSON backup**, validated restore, individual saved-deck removal, and a confirmed local-data delete. A restore replaces the corresponding local workspace records. Backups intentionally omit sign-in data, analytics preference, UI preferences, and API keys.
- **Optional analytics** defaults off and loads only after a browser-local opt-in. Opting out persists immediately; if an analytics script was already loaded, the user is prompted to reload to apply the opt-out to that page session.
- The auth hook no longer writes a cached name/email profile to `localStorage` and removes the old cache when the app runs. The current Cue OAuth/session implementation is otherwise unchanged. In particular, the app's session-storage bearer-token fallback remains because it supports existing embedded/WebView and cookie-restricted browser paths; changing the token transport without a replacement would risk breaking sign-in. The normal server-issued session cookie remains the primary path.
- Browser storage is **not encrypted** and persists until removed by the user or cleared by the browser. Collection and deck backup files may contain sensitive personal notes and inventory details; keep them private. Custom AI deck generation can transmit the chosen inventory and prompt to Groq when the user invokes that feature.

“Local-first” here describes where personal collection and deck records are stored; it is not a fully offline mode. Public card, image, set, and market-data lookups continue to use the app's configured external services.

## Current production/server data that this phase does not alter

The present Cue OAuth callback still stores an OAuth subject/open ID, name, email when supplied, login method, and sign-in timestamps in the existing MySQL `users` table. The legacy account saved-deck API and existing `saved_decks` table are unchanged for compatibility, but this client no longer uses them for new saves. This phase does not export, migrate, erase, or change retention for previously stored account rows or saved decks. The retired import-audit table may contain historical records; the app no longer exposes a write route, and the data has not been queried or purged. The populated production Supabase project remains untouched.

A separate approved **non-production staging project** now exists for collections/decks schema validation. It contains four owner-scoped tables protected by RLS, synthetic fixtures only, and has passed all 38 isolation checks. It has not received real user data, production credentials, or a production migration. The organization is on Supabase Free; staging success does not establish production capacity or ongoing cost.

## Recommended Supabase phases

### 1. Decide identity and session architecture

- Add Supabase Auth **email/password** with email verification, password reset, generic sign-in errors, rate limits, and abuse monitoring. Keep password hashes exclusively in Supabase Auth; never store passwords in the app database or browser storage.
- Do not silently link current Cue OAuth identities to email/password accounts. Before account migration, define an explicit verified-email linking/recovery process and account-conflict behavior.
- Prefer a backend-for-frontend session boundary: secure, `HttpOnly`, `Secure`, `SameSite=Lax` cookies, CSRF protection on state-changing requests, short session lifetimes with server-controlled refresh, and no long-lived bearer/refresh token in `localStorage`. Keep secrets and any service-role key server-side only. Logout and password reset should revoke server sessions; rotate refresh state after use.
- Add email verification/reset links with single-use, expiring tokens. Avoid returning whether an email address has an account. Record only the minimum auth audit metadata needed for security, with a short documented retention period.

### 2. Design the smallest user-owned Postgres schema

Candidate tables (exact names and fields to be reviewed before implementation):

- `profiles`: `id uuid primary key references auth.users(id) on delete cascade`; only non-sensitive preferences that cannot be derived from Auth.
- `collections`: `id uuid`, `owner_id uuid`, display name, created/updated timestamps, optional optimistic-lock version.
- `collection_cards`: `id uuid`, `collection_id`, `owner_id`, card identity fields (normalized name or trusted card identifier, set/collector number, finish, condition, language), positive integer quantity, timestamps. Use uniqueness constraints for the chosen printing identity and a composite relationship that prevents cross-owner collection IDs.
- `decks`: `id uuid`, `owner_id`, name, format, optional description, timestamps/version.
- `deck_cards`: `deck_id`, `owner_id`, card identity, zone, positive quantity, optional position; constrain the deck/owner pair.

Do not cloud-store raw import files, source fingerprints, source URLs, or per-import counts unless a later, explicit product need is approved. Use `auth.users.id` as the stable owner key; avoid duplicating email in user data tables.

### 3. Enforce row-level ownership and test it negatively

- Enable RLS on **every** user-owned table. Add `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies requiring `owner_id = auth.uid()`; for child rows also verify the parent belongs to the same `auth.uid()`.
- Add database checks for positive quantity, valid zones/statuses, and unique card identities. Use restrictive foreign keys and cascading deletion from the account root.
- Never expose the Supabase service-role key to the browser. If a server/API is used, pass the authenticated user context through to Postgres so RLS still applies, or perform equally strict owner checks in the API and retain RLS as defense in depth.
- Test with at least two users: each must be unable to select, insert, update, delete, or infer the other's collection/deck rows, including by changing UUIDs and parent IDs. Test anonymous access, expired sessions, and direct REST calls as well as UI flows.

### 4. Add cloud sync as an explicit, reversible choice

- Keep local-only use as the default, including for signed-in users. Present a separate **Turn on cloud backup** choice that enumerates the exact data to upload; do not treat sign-in as sync consent.
- Before first sync, create a downloadable local backup, show record counts, explain cloud retention/deletion, and let the user choose which collections/decks to sync. Require a final explicit start-sync action after the preview.
- Use stable local record IDs, an idempotent upsert key, per-record update versions, and a documented conflict strategy (for example, prompt when both copies changed rather than silently overwrite). Maintain an offline queue and show sync status/errors without exposing card data in logs.
- Provide a local-only mode switch that stops future uploads and a user-accessible way to remove the cloud copy without erasing the local copy.

### 5. Ship export, deletion, and retention before general availability

- Support complete account export in machine-readable JSON and collection CSV; include timestamps/version, but exclude authentication secrets and server-only fields.
- Provide separate actions for **delete cloud collection/decks**, **disable cloud sync**, and **delete account**. Show the exact data scope and consequences; require confirmation for permanent deletion. Make delete idempotent and verify that all child rows and derived caches are removed.
- Publish retention periods for security logs, backups, queued sync operations, and support diagnostics. Ensure logs never contain passwords, auth tokens, raw import contents, or collection card lists. Define backup/purge timing for provider-managed database backups.
- Decide how long legacy MySQL account records, saved decks, and import-audit rows are retained; only purge/migrate them after an explicit cutover plan, verifiable export, and approved maintenance window.

### 6. Roll out and verify

1. Build against a non-production Supabase project with synthetic accounts and data only.
2. Review schema, RLS, password reset, session/CSRF behavior, import/export, conflict resolution, deletion, and retention with security tests.
3. Release auth without cloud sync first; confirm local-only behavior still works when signed out, offline, and with cookies restricted.
4. Offer opt-in cloud sync to a small test cohort with clear status and a one-click rollback to local-only.
5. Before any production migration, obtain approval, back up existing data, map accounts only through verified linking, run a dry-run, and publish a recovery/rollback plan. The approved staging project is validation-only; no production migration, configuration change, or data transfer is part of this phase.
