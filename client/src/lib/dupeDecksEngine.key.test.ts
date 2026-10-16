import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCustomGroqDeck, loadGroqApiKey, saveGroqApiKey } from '@/lib/dupeDecksEngine';

function createStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, String(value)); },
    removeItem: (key: string) => { items.delete(key); },
  };
}

describe('Groq BYOK storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saves keys in tab session storage only and clears them when the field is emptied', () => {
    const sessionStorage = createStorage();
    const localStorage = createStorage();
    vi.stubGlobal('window', { sessionStorage, localStorage });

    saveGroqApiKey('  gsk-example  ');
    expect(sessionStorage.getItem('mtg-groq-api-key')).toBe('gsk-example');
    expect(localStorage.getItem('mtg-groq-api-key')).toBeNull();
    expect(loadGroqApiKey()).toBe('gsk-example');

    saveGroqApiKey('');
    expect(sessionStorage.getItem('mtg-groq-api-key')).toBeNull();
  });

  it('migrates a legacy persistent key to the tab and removes the persistent copy', () => {
    const sessionStorage = createStorage();
    const localStorage = createStorage({ 'mtg-groq-api-key': 'legacy-key' });
    vi.stubGlobal('window', { sessionStorage, localStorage });

    expect(loadGroqApiKey()).toBe('legacy-key');
    expect(sessionStorage.getItem('mtg-groq-api-key')).toBe('legacy-key');
    expect(localStorage.getItem('mtg-groq-api-key')).toBeNull();
  });

  it('sends only the inventory count to Groq, never card names or collection rows', async () => {
    const privateCardName = 'PrivateCollectionCard-DoNotTransmit';
    const responsePayload = {
      title: 'Test deck',
      theme: 'test',
      archetype: 'Aggro',
      description: 'test response',
      colors: ['R'],
      cards: [{ name: 'Lightning Bolt', quantity: 60, type: 'Sorcery' }],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(responsePayload) } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await generateCustomGroqDeck('Red spells', [{ name: privateCardName, quantity: 7 }], 'gsk-test-sentinel');

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(body.messages[1].content).toContain('Available inventory size: 7 cards');
    expect(JSON.stringify(body)).not.toContain(privateCardName);
    expect(request.headers).toMatchObject({ Authorization: 'Bearer gsk-test-sentinel' });
  });
});
