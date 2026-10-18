# Private collection directory security

## Owner-isolated data

The additive `20261018000000_private_collection_directory.sql` migration creates three private tables. It contains no source rows and never reads a CSV.

- `mtg_inventory_imports` retains source metadata, exact UTF-8 CSV text, source SHA-256, and pending/complete status. `(owner_id, source_hash)` is unique.
- `mtg_inventory_cards` stores one owner-scoped normalized identity with positive quantity, bounded optional trade quantity, and source provenance. `(owner_id, identity_key)` is unique.
- `mtg_inventory_import_rows` preserves raw source rows and their normalized identities. Its composite foreign key requires the import and child row to have the same owner.

All three tables enable and force RLS. Anonymous and public roles have no table privileges. Authenticated CRUD policies require `auth.uid() = owner_id` in both USING and WITH CHECK. There are no SECURITY DEFINER helpers, global ownership bypasses, or privileged client keys.

The importer must derive ownership from a verified Supabase Auth session, not an editable owner field. It must use explicit user action, bounded requests, deterministic source/card keys, and pending status until verification succeeds. A pending import blocks primary-inventory restore. Repeating identical sources must not add their quantities twice.

## Private source objects

`20261018000001_private_inventory_sources.sql` adds authenticated owner-prefix policies for the private `mtg-inventory-sources` bucket. Object names are `auth.uid()/sha256.csv`; they have no public or signed URLs. Bucket setup uses a private bucket with a 10 MiB file-size limit and CSV/plain-text MIME types. No scan is part of a migration, repository, build, deployment environment, analytics event, or public deck.

The authenticated upload flow preserves exact bytes in Storage and exact decoded source text in the import record. Only the public Supabase URL and publishable key belong in browser configuration. Access tokens stay in the existing tab-scoped authentication session; Groq BYOK keys remain in memory and require separate opt-in for each request.

## Verification evidence

The table schema was first tested on a separate safety-staging project with synthetic users and rows. The executed rollback-only test returned **26 checks passed, zero failed**. It covered owner CRUD, cross-owner read/mutation denial, forged ownership, owner reassignment, composite ownership enforcement, constraints, anonymous denial, and forced RLS. The checked-in test SQL is a separate expanded regression suite; its larger assertion count is not a claim that it was the originally executed test.

After the approved production schema application, read-only inspection confirmed forced RLS on all three tables and a non-public bucket. An additional transaction inserted only synthetic Storage metadata: owner read/write succeeded, cross-owner insert was rejected, and cross-owner reads returned no rows. The transaction ended in ROLLBACK. No actual source files or real inventory rows were used in this security test.

Production schema verification is not evidence that an inventory import completed. Completion requires owner-session upload, source-byte SHA-256 verification, exact source-row provenance, normalized card/quantity comparison, overlap verification, and unchanged legacy inventory. Stop rather than use a broader key when an owner-authenticated route is unavailable.
