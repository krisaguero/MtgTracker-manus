import { describe, expect, it, vi } from 'vitest';
import {
  loadPublicDeckSnapshots,
  validatePublicDeckSnapshotPayload,
  type PublicDeckSnapshotPayload,
} from './publicDeckSnapshots';

const payload: PublicDeckSnapshotPayload = {
  schema_version: 1,
  kind: 'generated',
  title: 'Shared route',
  format_label: 'Commander',
  summary: 'Approved public summary.',
  status: 'ready for review',
  main: [{ name: 'Sol Ring', quantity: 1 }],
  sideboard: [{ name: 'Negate', quantity: 1 }],
  warnings: ['Review before playing.'],
  references: [{ label: 'Scryfall', url: 'https://scryfall.com' }],
};

function snapshot() {
  return {
    share_id: '37f1e322-f4d7-4d35-bf52-63dc21820c5d',
    content_hash: 'a'.repeat(64),
    payload,
    published_at: '2026-11-07T12:00:00Z',
  };
}

describe('public deck snapshots', () => {
  it('accepts the sanitized payload and rejects every extra payload key', () => {
    expect(validatePublicDeckSnapshotPayload(payload)).toBe(true);
    expect(validatePublicDeckSnapshotPayload({ ...payload, source_id: 'private' })).toBe(false);
    expect(validatePublicDeckSnapshotPayload({ ...payload, holdings: [] })).toBe(false);
    expect(validatePublicDeckSnapshotPayload({ ...payload, source_difference: 'private' })).toBe(false);
    expect(validatePublicDeckSnapshotPayload({ ...payload, commander: [{ name: 'Hidden', quantity: 1 }] })).toBe(false);
  });

  it('uses the anonymous RPC with anon apikey and bearer authorization only', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([snapshot()]), { status: 200 }));
    const result = await loadPublicDeckSnapshots({ url: 'https://public.example', anonKey: 'anon-key' }, { fetcher });
    expect(result[0]?.payload.title).toBe('Shared route');
    expect(result[0]?.payload.main[0]).toEqual({ name: 'Sol Ring', quantity: 1 });
    expect(result[0]?.payload.sideboard[0]).toEqual({ name: 'Negate', quantity: 1 });
    expect(fetcher).toHaveBeenCalledWith(
      'https://public.example/rest/v1/rpc/list_public_deck_brewery_shares',
      expect.objectContaining({
        method: 'POST',
        body: '{}',
        headers: {
          apikey: 'anon-key',
          Authorization: 'Bearer anon-key',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('does not display malformed or private-shaped rows', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([{ ...snapshot(), payload: { ...payload, owner_user_id: 'private' } }]), { status: 200 }));
    await expect(loadPublicDeckSnapshots({ url: 'https://public.example', anonKey: 'anon-key' }, { fetcher }))
      .rejects.toThrow('did not pass validation');
  });
});
