import { describe, expect, it, vi, afterEach } from 'vitest';
import { loadPrivatePrimaryInventory } from './privateInventory';
import { getAuthorizedSupabaseSession } from './supabaseWorkspaceSync';
vi.mock('./supabaseWorkspaceSync', () => ({ getAuthorizedSupabaseSession: vi.fn() }));
const config = { url: 'https://test.supabase.co', anonKey: 'public-only' };
const row = { id: 'row', name: 'Synthetic Boots', quantity: 6, set_code: 'test', collector_number: '1', scryfall_id: 'print', finish: 'normal', language: 'en', condition: 'near_mint', proxy: false, merge_status: 'conservative_max', trade_quantity: 2 };
const session = { accessToken: 'user-token', refreshToken: 'refresh', expiresAt: Date.now()+100000, user: { id: 'owner-a' } };
const response = (data: unknown) => ({ ok: true, json: async () => data });
afterEach(() => vi.resetAllMocks());
describe('private primary inventory', () => {
  it('requires the explicit cloud opt-in session before any network request', async () => {
    vi.mocked(getAuthorizedSupabaseSession).mockRejectedValue(new Error('Enable optional cloud backup'));
    const fetcher = vi.fn();
    await expect(loadPrivatePrimaryInventory(config, { fetcher, localStorage: {} as Storage, sessionStorage: {} as Storage })).rejects.toThrow('Enable optional');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('reads owner-filtered limited pages with the user token and keeps trade provenance separate', async () => {
    vi.mocked(getAuthorizedSupabaseSession).mockResolvedValue(session);
    const fetcher = vi.fn().mockResolvedValueOnce(response([])).mockResolvedValueOnce(response(Array.from({ length: 500 }, () => row))).mockResolvedValueOnce(response([row]));
    const result = await loadPrivatePrimaryInventory(config, { fetcher, localStorage: {} as Storage, sessionStorage: {} as Storage });
    expect(result.cards).toHaveLength(501);
    expect(result.cards[0].tradeQuantity).toBe(2);
    expect(result.conservativeEntries).toBe(501);
    expect(fetcher.mock.calls[2][0]).toContain('offset=500');
    expect(fetcher.mock.calls[1][0]).toContain('owner_id=eq.owner-a');
    expect(fetcher.mock.calls[1][0]).toContain('limit=500');
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer user-token');
  });
  it('rejects an invalid page before returning a partial restore', async () => {
    vi.mocked(getAuthorizedSupabaseSession).mockResolvedValue(session);
    const fetcher = vi.fn().mockResolvedValueOnce(response([])).mockResolvedValueOnce(response([{ ...row, quantity: -1 }]));
    await expect(loadPrivatePrimaryInventory(config, { fetcher, localStorage: {} as Storage, sessionStorage: {} as Storage })).rejects.toThrow('Nothing was restored');
  });
  it('blocks an incomplete import before reading any cards', async () => {
    vi.mocked(getAuthorizedSupabaseSession).mockResolvedValue(session);
    const fetcher = vi.fn().mockResolvedValueOnce(response([{ id: 'pending' }]));
    await expect(loadPrivatePrimaryInventory(config, { fetcher, localStorage: {} as Storage, sessionStorage: {} as Storage })).rejects.toThrow('incomplete');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain('status=eq.pending');
  });
});
