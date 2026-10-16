export interface LocalSavedDeck {
  deckKey: string;
  name: string;
  source: string;
  href: string;
  deckJson: string;
  updatedAt: number;
}

export const LOCAL_SAVED_DECKS_STORAGE_KEY = 'mtg_tracker_local_saved_decks_v1';

function isLocalSavedDeck(value: unknown): value is LocalSavedDeck {
  if (!value || typeof value !== 'object') return false;
  const deck = value as Partial<LocalSavedDeck>;
  return typeof deck.deckKey === 'string'
    && deck.deckKey.length > 0 && deck.deckKey.length <= 160
    && typeof deck.name === 'string'
    && deck.name.length > 0 && deck.name.length <= 255
    && typeof deck.source === 'string'
    && typeof deck.href === 'string' && (/^\/deck\/[a-z0-9-]+\/[a-z0-9-]+$/i.test(deck.href) || /^\/deck-workshop(?:\?restore=[a-z0-9-]+)?$/i.test(deck.href))
    && typeof deck.deckJson === 'string'
    && typeof deck.updatedAt === 'number' && Number.isFinite(deck.updatedAt);
}

export function loadLocalSavedDecks(): LocalSavedDeck[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SAVED_DECKS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLocalSavedDeck) : [];
  } catch {
    return [];
  }
}

export function replaceLocalSavedDecks(decks: LocalSavedDeck[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_SAVED_DECKS_STORAGE_KEY, JSON.stringify(decks));
}

export function saveLocalDeck(deck: Omit<LocalSavedDeck, 'updatedAt'>): LocalSavedDeck[] {
  const decks = loadLocalSavedDecks();
  const saved: LocalSavedDeck = { ...deck, updatedAt: Date.now() };
  const next = [saved, ...decks.filter((item) => item.deckKey !== deck.deckKey)];
  replaceLocalSavedDecks(next);
  return next;
}

export function removeLocalDeck(deckKey: string): LocalSavedDeck[] {
  const next = loadLocalSavedDecks().filter((deck) => deck.deckKey !== deckKey);
  replaceLocalSavedDecks(next);
  return next;
}
