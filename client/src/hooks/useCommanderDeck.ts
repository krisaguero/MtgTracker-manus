import { useState, useEffect } from 'react';
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

  const exactCards: ScryfallCard[] = [];
  try {
    for (let index = 0; index < entries.length; index += 75) {
      if (signal.aborted) break;
      const chunk = entries.slice(index, index + 75);
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifiers: chunk.map((ref) => ({ set: ref.set_code.toLowerCase(), collector_number: ref.number })) }),
        signal,
      });
      if (response.ok) {
        const payload = await response.json() as CollectionResponse;
        exactCards.push(...(payload.data ?? []));
      }
    }
  } catch (collectionError) {
    if (collectionError instanceof DOMException && collectionError.name === 'AbortError') throw collectionError;
    console.warn('Exact Commander collection batch lookup warning:', collectionError);
  }

  const collectedKeys = new Set(exactCards.map((card) => `${card.set}:${card.collector_number}`.toLowerCase()));
  const missingRefs = entries.filter((ref) => !collectedKeys.has(`${ref.set_code}:${ref.number}`.toLowerCase()));

  if (missingRefs.length > 0) {
    const setCodes = Array.from(new Set(missingRefs.map((ref) => ref.set_code.toLowerCase())));
    for (const setCode of setCodes) {
      if (signal.aborted) break;
      let nextUrl: string | undefined = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`set:${setCode}`)}&unique=prints&order=set`;
      let pageCount = 0;
      try {
        while (nextUrl && pageCount < 6) {
          if (signal.aborted) break;
          const searchRes = await fetch(nextUrl, { signal });
          if (!searchRes.ok) break;
          const searchData = await searchRes.json() as SearchResponse;
          const items = searchData.data ?? [];
          for (const card of items) {
            const k = `${card.set}:${card.collector_number}`.toLowerCase();
            if (!collectedKeys.has(k)) {
              exactCards.push(card);
              collectedKeys.add(k);
            }
          }
          nextUrl = searchData.has_more ? searchData.next_page : undefined;
          pageCount++;
        }
      } catch (err) {
        // ignore search fallback failure
      }
    }
  }

  // Final fallback: fetch named cards individually for any still missing
  const stillMissingNames = Array.from(new Set(refs.map((r) => r.name.toLowerCase())));
  const collectedNameSet = new Set(exactCards.map((c) => c.name.toLowerCase()));
  const uncollectedNames = stillMissingNames.filter((n) => !collectedNameSet.has(n));

  if (uncollectedNames.length > 0 && uncollectedNames.length <= 25) {
    for (const name of uncollectedNames) {
      if (signal.aborted) break;
      try {
        const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`, { signal });
        if (res.ok) {
          const cardData = await res.json() as ScryfallCard;
          if (cardData && cardData.name) exactCards.push(cardData);
        }
      } catch (err) {
        // ignore individual search failures
      }
    }
  }

  return exactCards;
}

function cardKey(card: ScryfallCard) {
  return `${card.set}:${card.collector_number}`.toLowerCase();
}

function resolveEntry(ref: RawCard | RawCommander, cards: ScryfallCard[], zone: DecklistEntry['zone']): DecklistEntry | null {
  const found = cards.find((item) => cardKey(item) === `${ref.set_code}:${ref.number}`.toLowerCase())
    ?? cards.find((item) => item.name.toLowerCase() === ref.name.toLowerCase());

  const card: ScryfallCard = found ?? {
    id: `fallback-${ref.set_code}-${ref.number}-${ref.name}`,
    name: ref.name,
    type_line: 'Card',
    rarity: 'rare',
    set: ref.set_code,
    collector_number: ref.number,
    released_at: '2024-01-01',
    layout: 'normal',
    colors: [],
    color_identity: [],
    prices: { usd: '1.50' },
    image_uris: {
      normal: `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(ref.name)}&format=image&version=normal`,
      small: `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(ref.name)}&format=image&version=small`,
      png: `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(ref.name)}&format=image&version=png`,
      art_crop: `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(ref.name)}&format=image&version=art_crop`,
      border_crop: `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(ref.name)}&format=image&version=border_crop`,
    },
  };

  return { quantity: ref.count ?? 1, card, zone };
}

function findDeck(decks: RawCommanderDeck[], setCode: string, deckSlug: string) {
  const normalizedSet = setCode.toLowerCase();
  const normalizedSlug = decodeURIComponent(deckSlug).toLowerCase();

  // Tier 1: exact set code and exact slug match
  let matched = decks.find((deck) =>
    deck.set_code.toLowerCase() === normalizedSet && slugify(deck.name) === normalizedSlug,
  );
  if (matched) return matched;

  // Tier 2: slug match regardless of set code (handles set code aliases like m3c vs mar etc)
  matched = decks.find((deck) => slugify(deck.name) === normalizedSlug);
  if (matched) return matched;

  // Tier 3: partial name inclusion
  matched = decks.find((deck) => {
    const deckSlugName = slugify(deck.name);
    return deckSlugName.includes(normalizedSlug) || normalizedSlug.includes(deckSlugName);
  });
  return matched ?? null;
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
          totalCards,
          deckCards,
          primaryCommander: commander[0] ?? null,
        });
        setLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to load commander decklist:', err);
        setError('Failed to load decklist cards from Scryfall API.');
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [setCode, deckSlug]);

  return { data, loading, error };
}
