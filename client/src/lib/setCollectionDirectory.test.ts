import { describe, expect, it, vi } from 'vitest';
import { catalogScopeFor, fetchSetCatalog, loadChecklist, ownedQuantityForPrint, saveChecklist, type ScryfallPrint } from './setCollectionDirectory';

const print = (id: string, collector_number: string): ScryfallPrint => ({ id, name: `Card ${id}`, set: 'abc', set_name: 'ABC', collector_number });

describe('set collection directory', () => {
  it('fetches all pages with extras/variations and deduplicates by Scryfall id', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [print('one', '1'), print('two', '2')], has_more: true, next_page: 'https://api.scryfall.com/cards/search?page=2' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [print('two', '2'), print('three', '3')], has_more: false }), { status: 200 }));
    const result = await fetchSetCatalog('ABC', fetcher);
    expect(result.prints.map(card => card.id)).toEqual(['one', 'two', 'three']);
    expect(fetcher.mock.calls[0]?.[0]).toContain('include_extras=true&include_variations=true');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('matches only local exact printing coordinates or Scryfall id, never names alone', () => {
    const target = print('one', '1');
    expect(ownedQuantityForPrint(target, [{ name: 'Card one', quantity: 2, setCode: 'abc', collectorNumber: '1' }])).toBe(2);
    expect(ownedQuantityForPrint(target, [{ name: 'Card one', quantity: 2, setCode: 'xyz', collectorNumber: '1' }])).toBe(0);
    expect(ownedQuantityForPrint(target, [{ name: 'Anything', quantity: 1, scryfallId: 'one' }])).toBe(1);
    expect(ownedQuantityForPrint(target, [{ name: 'Conflict', quantity: 9, scryfallId: 'other', setCode: 'abc', collectorNumber: '1' }])).toBe(0);
  });

  it('rejects has_more without a valid Scryfall search next page', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [], has_more: true }), { status: 200 }));
    await expect(fetchSetCatalog('a-b', fetcher)).rejects.toThrow('malformed pagination');
    expect(fetcher.mock.calls[0]?.[0]).toContain('unique=prints&order=set');
  });

  it('invalidates checklist data when catalog scope changes', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value) } });
    const first = catalogScopeFor('abc', [print('one', '1')]);
    const second = catalogScopeFor('abc', [print('one', '1'), print('two', '2')]);
    saveChecklist('abc', first, { one: true });
    expect(loadChecklist('abc', first)).toEqual({ one: true });
    expect(loadChecklist('abc', second)).toEqual({});
    vi.unstubAllGlobals();
  });
});
