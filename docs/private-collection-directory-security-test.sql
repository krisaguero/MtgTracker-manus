-- Private collection directory security test (staging only).
-- Target: Supabase project uhtfzsqocwcdebajtdhm (MTG Tracker Safety Staging).
-- Run as a privileged SQL session. This is DML-only, synthetic-data-only, and always rolls back.
-- Every assertion is scoped to the IDs below; existing fixtures cannot affect row counts.

BEGIN;

INSERT INTO auth.users (id, aud, role, email)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'pcd-security-a@example.invalid'),
  ('00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'pcd-security-b@example.invalid')
ON CONFLICT (id) DO NOTHING;

-- Anonymous has no table privileges. Each expected denial must be exactly SQLSTATE 42501;
-- an unexpected error is a test failure, not a passing denial.
SET LOCAL ROLE anon;
DO $anon$
DECLARE
  ok integer := 0;
BEGIN
  BEGIN PERFORM 1 FROM public.mtg_inventory_imports LIMIT 1; RAISE EXCEPTION 'anon imports SELECT unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN INSERT INTO public.mtg_inventory_imports (owner_id, source_name, source_hash, source_csv, row_count, copy_count)
    VALUES ('00000000-0000-0000-0000-0000000000a1', 'anon.csv', 'anon', 'x', 1, 1);
    RAISE EXCEPTION 'anon imports INSERT unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN UPDATE public.mtg_inventory_imports SET source_name = 'x' WHERE false;
    RAISE EXCEPTION 'anon imports UPDATE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN DELETE FROM public.mtg_inventory_imports WHERE false;
    RAISE EXCEPTION 'anon imports DELETE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;

  BEGIN PERFORM 1 FROM public.mtg_inventory_cards LIMIT 1; RAISE EXCEPTION 'anon cards SELECT unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN INSERT INTO public.mtg_inventory_cards (owner_id, identity_key, name, quantity, provenance)
    VALUES ('00000000-0000-0000-0000-0000000000a1', 'anon', 'Anon', 1, '{"source":"anon","identity":"anon","count":1,"row_indices":[1]}'::jsonb);
    RAISE EXCEPTION 'anon cards INSERT unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN UPDATE public.mtg_inventory_cards SET name = 'x' WHERE false;
    RAISE EXCEPTION 'anon cards UPDATE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN DELETE FROM public.mtg_inventory_cards WHERE false;
    RAISE EXCEPTION 'anon cards DELETE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;

  BEGIN PERFORM 1 FROM public.mtg_inventory_import_rows LIMIT 1; RAISE EXCEPTION 'anon rows SELECT unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN INSERT INTO public.mtg_inventory_import_rows (owner_id, import_id, source_row, quantity, identity_key, raw_row)
    VALUES ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', 1, 1, 'anon', '{}'::jsonb);
    RAISE EXCEPTION 'anon rows INSERT unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN UPDATE public.mtg_inventory_import_rows SET identity_key = 'x' WHERE false;
    RAISE EXCEPTION 'anon rows UPDATE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  BEGIN DELETE FROM public.mtg_inventory_import_rows WHERE false;
    RAISE EXCEPTION 'anon rows DELETE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN ok := ok + 1; WHEN OTHERS THEN RAISE; END;
  ASSERT ok = 12, format('anonymous denial checks: %s/12', ok);
END
$anon$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

-- Owner A: CRUD on all three tables. Row counts are captured immediately after every DML.
DO $owner$
DECLARE row_count integer;
BEGIN
  INSERT INTO public.mtg_inventory_imports (id, owner_id, source_name, source_hash, source_csv, row_count, copy_count, status)
    VALUES ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'a.csv', 'a-hash', 'Name,Qty\nIsland,2', 1, 2, 'complete');
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A import INSERT row count';
  INSERT INTO public.mtg_inventory_cards (id, owner_id, identity_key, name, quantity, trade_quantity, provenance)
    VALUES ('20000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'a|island', 'Island', 2, 1, '{"source":"a.csv","identity":"a|island","count":2,"row_indices":[2]}'::jsonb);
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A card INSERT row count';
  INSERT INTO public.mtg_inventory_import_rows (id, owner_id, import_id, source_row, quantity, identity_key, raw_row)
    VALUES ('30000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', 2, 2, 'a|island', '{"Name":"Island","Qty":"2"}');
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A row INSERT row count';

  PERFORM 1 FROM public.mtg_inventory_imports WHERE id = '10000000-0000-0000-0000-0000000000a1'; ASSERT FOUND, 'owner A can read import';
  PERFORM 1 FROM public.mtg_inventory_cards WHERE id = '20000000-0000-0000-0000-0000000000a1'; ASSERT FOUND, 'owner A can read card';
  PERFORM 1 FROM public.mtg_inventory_import_rows WHERE id = '30000000-0000-0000-0000-0000000000a1'; ASSERT FOUND, 'owner A can read row';

  UPDATE public.mtg_inventory_imports SET source_name = 'a-updated.csv' WHERE id = '10000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A import UPDATE row count';
  UPDATE public.mtg_inventory_cards SET trade_quantity = 2 WHERE id = '20000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A card UPDATE row count';
  UPDATE public.mtg_inventory_import_rows SET identity_key = 'a|island-updated' WHERE id = '30000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A row UPDATE row count';
END
$owner$;

-- Owner B cannot read, update, or delete A rows: RLS makes these operations affect zero rows.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
DO $other$
DECLARE row_count integer;
BEGIN
  PERFORM 1 FROM public.mtg_inventory_imports WHERE id = '10000000-0000-0000-0000-0000000000a1'; ASSERT NOT FOUND, 'B cannot read A import';
  PERFORM 1 FROM public.mtg_inventory_cards WHERE id = '20000000-0000-0000-0000-0000000000a1'; ASSERT NOT FOUND, 'B cannot read A card';
  PERFORM 1 FROM public.mtg_inventory_import_rows WHERE id = '30000000-0000-0000-0000-0000000000a1'; ASSERT NOT FOUND, 'B cannot read A row';
  UPDATE public.mtg_inventory_imports SET source_name = 'forged.csv' WHERE id = '10000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 0, 'B cannot update A import';
  UPDATE public.mtg_inventory_cards SET trade_quantity = 0 WHERE id = '20000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 0, 'B cannot update A card';
  UPDATE public.mtg_inventory_import_rows SET identity_key = 'forged' WHERE id = '30000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 0, 'B cannot update A row';
  DELETE FROM public.mtg_inventory_imports WHERE id = '10000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 0, 'B cannot delete A import';
  DELETE FROM public.mtg_inventory_cards WHERE id = '20000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 0, 'B cannot delete A card';
  DELETE FROM public.mtg_inventory_import_rows WHERE id = '30000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 0, 'B cannot delete A row';
END
$other$;

-- Forged owner inserts and owner reassignment must fail specifically with insufficient_privilege (42501).
DO $policy$
BEGIN
  BEGIN
    INSERT INTO public.mtg_inventory_cards (owner_id, identity_key, name, quantity, provenance)
      VALUES ('00000000-0000-0000-0000-0000000000a1', 'b-forged', 'Forged', 1, '{"source":"b","identity":"b-forged","count":1,"row_indices":[1]}'::jsonb);
    RAISE EXCEPTION 'B forged card owner unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL; WHEN OTHERS THEN RAISE; END;
  BEGIN
    INSERT INTO public.mtg_inventory_imports (owner_id, source_name, source_hash, source_csv, row_count, copy_count)
      VALUES ('00000000-0000-0000-0000-0000000000a1', 'b-forged.csv', 'b-forged', 'x', 1, 1);
    RAISE EXCEPTION 'B forged import owner unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL; WHEN OTHERS THEN RAISE; END;
END
$policy$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
DO $reassign$
BEGIN
  BEGIN
    UPDATE public.mtg_inventory_imports SET owner_id = '00000000-0000-0000-0000-0000000000b1'
      WHERE id = '10000000-0000-0000-0000-0000000000a1';
    RAISE EXCEPTION 'A owner reassignment unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL; WHEN OTHERS THEN RAISE; END;
END
$reassign$;

-- A child owned by B cannot reference A's parent (composite FK must fail with 23503).
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
BEGIN
  INSERT INTO public.mtg_inventory_import_rows (owner_id, import_id, source_row, quantity, identity_key, raw_row)
    VALUES ('00000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-0000000000a1', 99, 1, 'b|cross-owner', '{}'::jsonb);
  RAISE EXCEPTION 'cross-owner parent insert unexpectedly succeeded';
EXCEPTION WHEN SQLSTATE '23503' THEN NULL; WHEN OTHERS THEN RAISE;
END;

-- Constraint checks must reject invalid quantity, trade quantity, and provenance (23514).
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
DO $checks$
BEGIN
  BEGIN
    INSERT INTO public.mtg_inventory_cards (owner_id, identity_key, name, quantity, provenance)
      VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad-quantity', 'Bad', 0, '{"source":"x","identity":"bad-quantity","count":0,"row_indices":[1]}'::jsonb);
    RAISE EXCEPTION 'non-positive quantity unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '23514' THEN NULL; WHEN OTHERS THEN RAISE; END;
  BEGIN
    INSERT INTO public.mtg_inventory_cards (owner_id, identity_key, name, quantity, trade_quantity, provenance)
      VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad-trade', 'Bad', 1, 2, '{"source":"x","identity":"bad-trade","count":1,"row_indices":[1]}'::jsonb);
    RAISE EXCEPTION 'trade quantity bound unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '23514' THEN NULL; WHEN OTHERS THEN RAISE; END;
  BEGIN
    INSERT INTO public.mtg_inventory_cards (owner_id, identity_key, name, quantity, provenance)
      VALUES ('00000000-0000-0000-0000-0000000000a1', 'bad-provenance', 'Bad', 1, '{"source":"x"}'::jsonb);
    RAISE EXCEPTION 'incomplete provenance unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '23514' THEN NULL; WHEN OTHERS THEN RAISE; END;
END
$checks$;

-- Owner A deletes all three synthetic rows; capture counts so the old RLS-invisible
-- false failure cannot recur. The final SELECT is the only returned result.
DO $delete$
DECLARE row_count integer;
BEGIN
  DELETE FROM public.mtg_inventory_import_rows WHERE id = '30000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A row DELETE row count';
  DELETE FROM public.mtg_inventory_cards WHERE id = '20000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A card DELETE row count';
  DELETE FROM public.mtg_inventory_imports WHERE id = '10000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS row_count = ROW_COUNT; ASSERT row_count = 1, 'owner A import DELETE row count';
END
$delete$;

SELECT 40 AS total_checks, 40 AS passed_checks, 0 AS failed_checks, 'PASS' AS result;
ROLLBACK;
