import { useEffect, useState } from 'react';
import type { RawCommanderDeck, RawDeckCard } from '@/data/commanderDecklists';
import type { ScryfallCard } from './useSetDetail';

export interface DecklistEntry {
  quantity: number;
  card: ScryfallCard;
  zone: 'commander' | 'deck';
}

export interface CommanderDeckData {
  name: string;
  setCode: string;
  setName: string;
  releaseDate?: string;
  synopsis?: string;
  approxValue?: number;
  commander: DecklistEntry[];
  deck: DecklistEntry[];
  totalCards: number;
  deckCards: number;
  primaryCommander: DecklistEntry | null;
}

interface SearchResponse {
  data?: ScryfallCard[];
  has_more?: boolean;
  next_page?: string;
}

interface CollectionResponse {
  data?: ScryfallCard[];
  not_found?: Array<{ set?: string; collector_number?: string }>;
}

type RawDeck = RawCommanderDeck;
type RawCard = RawDeckCard;
type RawCommander = RawDeckCard;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Scryfall returned ${response.status}`);
  return response.json() as Promise<T>;
}

async function getCollection(refs: Array<RawCard | RawCommander>, signal: AbortSignal) {
  const unique = new Map<string, RawCard | RawCommander>();
  refs.forEach((ref) => unique.set(`${ref.set_code}:${ref.number}`, ref));
  const entries = Array.from(unique.values());

  try {
    const exactCards: ScryfallCard[] = [];
    for (let index = 0; index < entries.length; index += 75) {
      const chunk = entries.slice(index, index + 75);
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifiers: chunk.map((ref) => ({ set: ref.set_code.toLowerCase(), collector_number: ref.number })) }),
        signal,
      });
      if (!response.ok) throw new Error(`Scryfall collection returned ${response.status}`);
      const payload = await response.json() as CollectionResponse;
      exactCards.push(...(payload.data ?? []));
    }
    if (exactCards.length > 0) return exactCards;
  } catch (collectionError) {
    if (collectionError instanceof DOMException && collectionError.name === 'AbortError') throw collectionError;
    console.warn('Exact Commander collection lookup unavailable; falling back to set galleries.', collectionError);
  }

  const setCodes = Array.from(new Set(entries.map((ref) => ref.set_code.toLowerCase())));
  const cards: ScryfallCard[] = [];
  for (const setCode of setCodes) {
    let nextUrl: string | undefined = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`set:${setCode}`)}&unique=prints&order=set`;
    let pageCount = 0;
    while (nextUrl && pageCount < 8) {
      const response: SearchResponse = await getJson<SearchResponse>(nextUrl, signal);
      cards.push(...(response.data ?? []));
      nextUrl = response.has_more ? response.next_page : undefined;
      pageCount += 1;
    }
  }

  return cards;
}

function cardKey(card: ScryfallCard) {
  return `${card.set}:${card.collector_number}`.toLowerCase();
}

function resolveEntry(ref: RawCard | RawCommander, cards: ScryfallCard[], zone: DecklistEntry['zone']): DecklistEntry | null {
  const card = cards.find((item) => cardKey(item) === `${ref.set_code}:${ref.number}`.toLowerCase())
    ?? cards.find((item) => item.name.toLowerCase() === ref.name.toLowerCase());
  return card ? { quantity: ref.count ?? 1, card, zone } : null;
}

function findDeck(decks: RawCommanderDeck[], setCode: string, deckSlug: string) {
  const normalizedSet = setCode.toLowerCase();
  const normalizedSlug = decodeURIComponent(deckSlug).toLowerCase();
  return decks.find((deck) =>
    deck.set_code.toLowerCase() === normalizedSet && slugify(deck.name) === normalizedSlug,
  ) ?? null;
}

export function useCommanderDeck(setCode?: string, deckSlug?: string) {
  const [data, setData] = useState<CommanderDeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const load = async () => {
      setData(null);
      setError(null);
      setLoading(true);
      try {
        const { commanderDecklists } = await import('@/data/commanderDecklists');
        const rawDeck = setCode && deckSlug ? findDeck(commanderDecklists, setCode, deckSlug) : null;
        if (!rawDeck) {
          setError('Commander precon not found in the decklist index.');
          setLoading(false);
          return;
        }
        const refs = [...rawDeck.commander, ...rawDeck.cards];
        const cards = await getCollection(refs, controller.signal);
        if (!active) return;

        const commander = rawDeck.commander
          .map((ref) => resolveEntry(ref, cards, 'commander'))
          .filter((entry): entry is DecklistEntry => entry !== null);
        const deck = rawDeck.cards
          .map((ref) => resolveEntry(ref, cards, 'deck'))
          .filter((entry): entry is DecklistEntry => entry !== null);
        const deckCards = deck.reduce((sum, entry) => sum + entry.quantity, 0);
        const totalCards = deckCards + commander.reduce((sum, entry) => sum + entry.quantity, 0);

        setData({
          name: rawDeck.name,
          setCode: rawDeck.set_code.toUpperCase(),
          setName: rawDeck.set_name,
          releaseDate: rawDeck.release_date,
          synopsis: rawDeck.synopsis,
          approxValue: rawDeck.approxValue,
          commander,
          deck,
          deckCards,
          totalCards,
          primaryCommander: commander[0] ?? null,
        });
        setLoading(false);
      } catch (loadError) {
        if (!active || (loadError instanceof DOMException && loadError.name === 'AbortError')) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this decklist');
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [setCode, deckSlug]);

  return { data, loading, error };
}

void getJson;
