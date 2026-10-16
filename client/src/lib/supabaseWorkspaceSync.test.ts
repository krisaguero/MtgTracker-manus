import { describe, expect, it, vi } from 'vitest';
import { EMPTY_COLLECTION_PLANNER } from './collectionPlanner';
import { EMPTY_LIMITED_WORKSPACE } from './limitedDeckBuilder';
import {
  backupWorkspaceToSupabase,
  getSupabasePublicConfig,
  isSupabaseSyncOptedIn,
  loadSupabaseWorkspaceSession,
  restoreWorkspaceFromSupabase,
  setSupabaseSyncOptIn,
  signOutFromSupabase,
  SUPABASE_SYNC_SESSION_KEY,
} from './supabaseWorkspaceSync';
import type { SupabaseSyncDependencies, SupabaseWorkspaceSession } from './supabaseWorkspaceSync';

const config = { url: 'https://sample-project.supabase.co', anonKey: 'public-anon-key' };
const validBackup = {
  format: 'mtg-tracker-local-workspace',
  version: 2,
  exportedAt: '2026-10-15T00:00:00.000Z',
  collection: [{ name: 'Sol Ring', quantity: 1, setCode: 'cmr', collectorNumber: '351' }],
  commanderDecks: [],
  savedDecklists: [],
  duelInventories: { a: '', b: '' },
  valuationHistory: [],
  collectionPlanner: EMPTY_COLLECTION_PLANNER,
  limitedWorkspace: EMPTY_LIMITED_WORKSPACE,
};

function makeStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

function makeDependencies(fetcher: typeof fetch = fetch) {
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  const dependencies: SupabaseSyncDependencies = { localStorage, sessionStorage, fetcher, now: () => Date.parse('2026-10-15T12:00:00.000Z') };
  return { dependencies, localStorage, sessionStorage };
}

function installSession(storage: ReturnType<typeof makeStorage>, expiresAt = Date.parse('2026-10-15T13:00:00.000Z')) {
  const session: SupabaseWorkspaceSession = {
    accessToken: 'user-access-token',
    refreshToken: 'user-refresh-token',
    expiresAt,
    user: { id: 'user-uuid-1', email: 'collector@example.com' },
  };
  storage.setItem(SUPABASE_SYNC_SESSION_KEY, JSON.stringify(session));
}

describe('optional Supabase workspace sync', () => {
  it('accepts only HTTPS project URLs, except local development URLs', () => {
    expect(getSupabasePublicConfig({ VITE_SUPABASE_URL: 'https://sample-project.supabase.co/', VITE_SUPABASE_ANON_KEY: 'anon' }))
      .toEqual({ url: 'https://sample-project.supabase.co', anonKey: 'anon' });
    expect(getSupabasePublicConfig({ VITE_SUPABASE_URL: 'http://example.com', VITE_SUPABASE_ANON_KEY: 'anon' })).toBeNull();
    expect(getSupabasePublicConfig({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'anon' }))
      .toEqual({ url: 'http://127.0.0.1:54321', anonKey: 'anon' });
  });

  it('does not upload unless the user has explicitly opted in', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const { dependencies } = makeDependencies(fetcher);
    await expect(backupWorkspaceToSupabase(validBackup, config, dependencies)).rejects.toThrow('Enable optional cloud backup');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uses the authenticated user id and bearer token to replace only that user’s row', async () => {
    let requestBody: any;
    let requestHeaders: HeadersInit | undefined;
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      requestHeaders = init?.headers;
      return new Response(null, { status: 204 });
    });
    const { dependencies, localStorage, sessionStorage } = makeDependencies(fetcher);
    setSupabaseSyncOptIn(true, dependencies);
    installSession(sessionStorage);

    const savedAt = await backupWorkspaceToSupabase(validBackup, config, dependencies);
    const headers = new Headers(requestHeaders);
    expect(savedAt).toBe('2026-10-15T12:00:00.000Z');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${config.url}/rest/v1/mtg_personal_workspace_backups?on_conflict=user_id`);
    expect(headers.get('Authorization')).toBe('Bearer user-access-token');
    expect(headers.get('apikey')).toBe(config.anonKey);
    expect(requestBody.user_id).toBe('user-uuid-1');
    expect(requestBody.backup.collection).toEqual(validBackup.collection);
    expect(localStorage.getItem('mtg_tracker_supabase_workspace_sync_opt_in_v1')).toBe('true');
  });

  it('restores only validated JSON from the signed-in user row', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toContain('user_id=eq.user-uuid-1');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer user-access-token');
      return new Response(JSON.stringify([{ backup: validBackup, updated_at: '2026-10-14T08:00:00.000Z' }]), { status: 200 });
    });
    const { dependencies, sessionStorage } = makeDependencies(fetcher);
    setSupabaseSyncOptIn(true, dependencies);
    installSession(sessionStorage);

    const restored = await restoreWorkspaceFromSupabase(config, dependencies);
    expect(restored?.backup).toEqual(validBackup);
    expect(restored?.updatedAt).toBe('2026-10-14T08:00:00.000Z');
  });

  it('rejects malformed remote records before the caller can restore them', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([{ backup: { collection: [] }, updated_at: '2026-10-14T08:00:00.000Z' }]), { status: 200 }));
    const { dependencies, sessionStorage } = makeDependencies(fetcher);
    setSupabaseSyncOptIn(true, dependencies);
    installSession(sessionStorage);
    await expect(restoreWorkspaceFromSupabase(config, dependencies)).rejects.toThrow('not a supported workspace backup');
  });

  it('clears the tab session on opt-out and does not persist session state in local storage', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    const { dependencies, localStorage, sessionStorage } = makeDependencies(fetcher);
    setSupabaseSyncOptIn(true, dependencies);
    installSession(sessionStorage);
    expect(loadSupabaseWorkspaceSession(sessionStorage)).not.toBeNull();
    expect(localStorage.values.has(SUPABASE_SYNC_SESSION_KEY)).toBe(false);

    setSupabaseSyncOptIn(false, dependencies);
    await signOutFromSupabase(config, dependencies);
    expect(isSupabaseSyncOptedIn(localStorage)).toBe(false);
    expect(loadSupabaseWorkspaceSession(sessionStorage)).toBeNull();
  });
});
