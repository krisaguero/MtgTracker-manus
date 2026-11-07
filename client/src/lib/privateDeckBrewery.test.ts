import { describe, expect, it, vi } from 'vitest';
import {
  getAuthorizedPrivateBrewerySession,
  importPrivateDeckBrewery,
  PRIVATE_BREWERY_EMAIL,
  PRIVATE_BREWERY_PROJECT_URL,
  requestPrivateBreweryEmailLink,
  validateDeckboxImportBundle,
  type DeckboxImportBundle,
  type PrivateBreweryDependencies,
} from './privateDeckBrewery';
import { SUPABASE_SYNC_SESSION_KEY, type SupabaseWorkspaceSession } from './supabaseWorkspaceSync';

const config = { url: PRIVATE_BREWERY_PROJECT_URL, anonKey: 'publishable-test-key' };
function makeStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}
function installSession(storage: ReturnType<typeof makeStorage>, email = PRIVATE_BREWERY_EMAIL) {
  const session: SupabaseWorkspaceSession = {
    accessToken: 'user-token',
    refreshToken: 'user-refresh-token',
    expiresAt: Date.parse('2026-11-06T21:00:00.000Z'),
    user: { id: 'approved-owner-uuid', email },
  };
  storage.setItem(SUPABASE_SYNC_SESSION_KEY, JSON.stringify(session));
}
function makeDependencies(fetcher: typeof fetch, now = Date.parse('2026-11-06T20:00:00.000Z')) {
  const sessionStorage = makeStorage();
  const dependencies: PrivateBreweryDependencies = { sessionStorage, fetcher, now: () => now, crypto: globalThis.crypto };
  return { dependencies, sessionStorage };
}
const sampleDeck = {
  id: 'deck-17',
  name: 'Original candidate pile',
  parentFolder: 'Old brews',
  folderPath: ['Legacy', 'Old brews'],
  main: [{ name: 'First card', quantity: 2 }, { name: 'First card', quantity: 1 }, { name: 'Second card', quantity: 1 }],
  sideboard: [{ name: 'Side card', quantity: 3 }],
  mainCopiesListed: 4,
  mainCopiesExported: 4,
  status: 'count_compatible_unverified',
};
const sampleBundle: DeckboxImportBundle = {
  schemaVersion: 1,
  title: 'Private Deckbox Brewery Review',
  privacy: 'private-local-only',
  source: 'Private export',
  caveats: ['A source caveat stays intact.'],
  edhrecNotes: [],
  decks: [sampleDeck],
};

describe('private Deck Brewery access and import', () => {
  it('refuses an unapproved Supabase account before reading private tables', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: 'approved-owner-uuid', email: 'other@example.com' }), { status: 200 }));
    const { dependencies, sessionStorage } = makeDependencies(fetcher);
    installSession(sessionStorage, 'other@example.com');
    await expect(getAuthorizedPrivateBrewerySession(config, dependencies)).rejects.toThrow(PRIVATE_BREWERY_EMAIL);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${config.url}/auth/v1/user`);
    expect(sessionStorage.getItem(SUPABASE_SYNC_SESSION_KEY)).toBeNull();
  });

  it('requires both the exact approved email and the same user ID from Supabase Auth', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: 'approved-owner-uuid', email: PRIVATE_BREWERY_EMAIL }), { status: 200 }));
    const { dependencies, sessionStorage } = makeDependencies(fetcher);
    installSession(sessionStorage);
    const verified = await getAuthorizedPrivateBrewerySession(config, dependencies);
    expect(verified.user).toEqual({ id: 'approved-owner-uuid', email: PRIVATE_BREWERY_EMAIL });
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer user-token');
  });

  it('requests a passwordless link only for the existing approved account and local private-page return path', async () => {
    let body: unknown;
    let url = '';
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      url = String(input);
      body = JSON.parse(String(init?.body));
      return new Response(null, { status: 200 });
    });
    const { dependencies } = makeDependencies(fetcher);
    await requestPrivateBreweryEmailLink(config, 'http://localhost:3000/private-deck-brewery', dependencies);
    expect(url).toContain('/auth/v1/otp?redirect_to=');
    expect(decodeURIComponent(url)).toContain('http://localhost:3000/private-deck-brewery');
    expect(body).toEqual({ email: PRIVATE_BREWERY_EMAIL, create_user: false });
    await expect(requestPrivateBreweryEmailLink(config, 'https://evil.example/private-deck-brewery', dependencies)).rejects.toThrow('not an approved app origin');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not send a sign-in request to a different Supabase project', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const { dependencies } = makeDependencies(fetcher);
    await expect(requestPrivateBreweryEmailLink({ ...config, url: 'https://another.supabase.co' }, 'https://example.com/private-deck-brewery', dependencies)).rejects.toThrow('different Supabase project');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('validates the source while retaining duplicate names, original order, main/sideboard separation, and folder hierarchy', () => {
    expect(validateDeckboxImportBundle(sampleBundle)).toBe(true);
    expect(sampleBundle.decks[0].main.map((card) => card.name)).toEqual(['First card', 'First card', 'Second card']);
    expect(sampleBundle.decks[0].sideboard).toEqual([{ name: 'Side card', quantity: 3 }]);
    expect(sampleBundle.decks[0].folderPath).toEqual(['Legacy', 'Old brews']);
    expect(validateDeckboxImportBundle({ ...sampleBundle, decks: [{ ...sampleDeck, main: [{ name: 'bad', quantity: 0 }] }] })).toBe(false);
  });

  it('uploads through the verified user token and round-trip checks every source record before completing', async () => {
    const requestLog: Array<{ url: string; method: string; body: any; headers: Headers }> = [];
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      const headers = new Headers(init?.headers);
      requestLog.push({ url, method, body, headers });
      if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'approved-owner-uuid', email: PRIVATE_BREWERY_EMAIL }), { status: 200 });
      if (url.includes('/rest/v1/mtg_private_deck_brewery_imports') && method === 'POST') return new Response(null, { status: 201 });
      if (url.includes('/rest/v1/mtg_private_deck_brewery?on_conflict=')) return new Response(null, { status: 201 });
      if (url.includes('/rest/v1/mtg_private_deck_brewery?select=')) return new Response(JSON.stringify([{ deckbox_id: 'deck-17', source_record: sampleDeck }]), { status: 200 });
      if (url.includes('/rest/v1/mtg_private_deck_brewery_imports?owner_id=')) return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ message: `Unexpected test request ${method} ${url}` }), { status: 500 });
    });
    const { dependencies, sessionStorage } = makeDependencies(fetcher);
    installSession(sessionStorage);
    const result = await importPrivateDeckBrewery(sampleBundle, JSON.stringify(sampleBundle), config, undefined, dependencies);
    expect(result.imported).toBe(1);
    expect(result.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    const childInsert = requestLog.find((request) => request.url.includes('/rest/v1/mtg_private_deck_brewery?on_conflict='));
    expect(childInsert?.headers.get('Authorization')).toBe('Bearer user-token');
    expect(childInsert?.url.startsWith(PRIVATE_BREWERY_PROJECT_URL)).toBe(true);
    expect(childInsert?.body[0].source_record).toEqual(sampleDeck);
    expect(childInsert?.body[0].source_record.main).toEqual(sampleDeck.main);
    expect(childInsert?.body[0].source_record.sideboard).toEqual(sampleDeck.sideboard);
    expect(requestLog.at(-1)?.method).toBe('PATCH');
  });
});
