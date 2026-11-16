import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearScryfallRequestCache, getScryfallJson } from './scryfallRequest';

function makeStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() { return values.size; },
  };
}

describe('scryfall request cache', () => {
  const storage = makeStorage();

  afterEach(() => {
    vi.restoreAllMocks();
    clearScryfallRequestCache();
    vi.unstubAllGlobals();
  });

  it('caches successful responses so a second read does not call Scryfall again', async () => {
    vi.stubGlobal('window', { localStorage: storage, setTimeout, clearTimeout });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: ['cached'] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const url = 'https://api.scryfall.com/sets/msc';
    await expect(getScryfallJson<{ data: string[] }>(url)).resolves.toMatchObject({ data: { data: ['cached'] }, stale: false });
    await expect(getScryfallJson<{ data: string[] }>(url)).resolves.toMatchObject({ data: { data: ['cached'] }, stale: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent cold reads for the same URL', async () => {
    vi.stubGlobal('window', { localStorage: storage, setTimeout, clearTimeout });
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    vi.stubGlobal('fetch', fetchMock);

    const url = 'https://api.scryfall.com/sets/pip';
    const first = getScryfallJson<{ code: string }>(url);
    const second = getScryfallJson<{ code: string }>(url);
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch(new Response(JSON.stringify({ code: 'pip' }), { status: 200 }));
    await expect(first).resolves.toMatchObject({ data: { code: 'pip' } });
    await expect(second).resolves.toMatchObject({ data: { code: 'pip' } });
  });

  it('returns stale data immediately and refreshes it in the background', async () => {
    vi.stubGlobal('window', { localStorage: storage, setTimeout, clearTimeout });
    const url = 'https://api.scryfall.com/sets/soc';
    storage.setItem(`mtg:scryfall-cache:v1:${url}`, JSON.stringify({ savedAt: Date.now() - 31 * 60 * 1000, data: { version: 1 } }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ version: 2 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getScryfallJson<{ version: number }>(url);
    expect(result).toMatchObject({ data: { version: 1 }, stale: true });
    await expect(result.revalidate).resolves.toEqual({ version: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('backs off and retries a rate-limited response', async () => {
    vi.stubGlobal('window', { localStorage: storage, setTimeout, clearTimeout });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ recovered: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getScryfallJson<{ recovered: boolean }>('https://api.scryfall.com/sets/woe'))
      .resolves.toMatchObject({ data: { recovered: true }, stale: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
