import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('private Deck Brewery data boundary', () => {
  const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261106000000_private_deck_brewery.sql'), 'utf8');
  const page = readFileSync(resolve(process.cwd(), 'client/src/pages/PrivateDeckBrewery.tsx'), 'utf8');
  const dataLayer = readFileSync(resolve(process.cwd(), 'client/src/lib/privateDeckBrewery.ts'), 'utf8');

  it('requires RLS, the caller UUID, and the approved email on both private tables', () => {
    expect(migration.match(/enable row level security/g)).toHaveLength(2);
    expect(migration.match(/force row level security/g)).toHaveLength(2);
    expect(migration.match(/auth\.uid\(\) = owner_id/g)).toHaveLength(4);
    expect(migration.match(/krisaguero@gmail\.com/g)).toHaveLength(4);
    expect(migration).toContain('revoke all on table public.mtg_private_deck_brewery_imports from anon, public, authenticated');
    expect(migration).toContain('revoke all on table public.mtg_private_deck_brewery from anon, public, authenticated');
    expect(migration).not.toMatch(/grant\s+all\s+.*\s+to\s+anon/i);
  });

  it('loads private records only after the server-verified exact Supabase identity', () => {
    expect(dataLayer).toContain("`${config.url}/auth/v1/user`");
    expect(dataLayer).toContain("email !== PRIVATE_BREWERY_EMAIL");
    expect(dataLayer).toContain('authHeaders(config, session.accessToken)');
    expect(dataLayer.indexOf('const session = await getAuthorizedPrivateBrewerySession(config, dependencies)')).toBeLessThan(dataLayer.indexOf('const [manifestResponse, decksResponse]'));
  });

  it('keeps raw Deckbox records out of client static imports and sends data only to the approved Supabase host', () => {
    expect(page).not.toMatch(/deckbox-review-2026-11-06\.zip|brewery-import-2026-11-06\.json/);
    expect(page).not.toMatch(/import\s+\w+\s+from\s+['"]@\/data\/.*private/i);
    expect(dataLayer).toContain("if (config.url !== PRIVATE_BREWERY_PROJECT_URL)");
    expect(dataLayer).toContain('PRIVATE_BREWERY_PROJECT_URL');
    expect(page).toContain('public endpoint');
    expect(page).toContain('AI service');
  });
});
