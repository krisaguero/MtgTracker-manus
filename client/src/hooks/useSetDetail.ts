import { useEffect, useState } from 'react';
import { productAssetFor } from '@/data/preconProductAssets';
import { commanderDecklists } from '@/data/commanderDecklists';

export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  colors: string[];
  color_identity: string[];
  image_uris?: {
    normal: string;
    small: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    name: string;
    image_uris?: {
      normal: string;
      small: string;
      png: string;
    };
  }>;
  rarity: string;
  set: string;
  collector_number: string;
  released_at: string;
  layout: string;
  reprint?: boolean;
  scryfall_uri?: string;
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
  };
}

export interface PreconDeck {
  id: string;
  name: string;
  set_code: string;
  colors: string[];
  card_count: number;
  image_uris?: { normal?: string; small?: string };
  productImageUrl?: string;
  productImageSourceUrl?: string;
  productImageSourceLabel?: string;
  scryfall_uri?: string;
  hasDecklist: boolean;
  synopsis?: string;
  approxValue?: number;
}

export interface SetDetailData {
  setCode: string;
  setName: string;
  releasedAt?: string;
  cards: ScryfallCard[];
  uniqueCards: ScryfallCard[];
  precons: PreconDeck[];
}

interface SearchResponse {
  data?: ScryfallCard[];
  has_more?: boolean;
  next_page?: string;
}

interface SetSummary {
  code: string;
  name: string;
  set_type: string;
  released_at?: string;
  card_count: number;
  parent_set_code?: string;
  scryfall_uri?: string;
}

function uniqueByName(cards: ScryfallCard[]) {
  const result = new Map<string, ScryfallCard>();
  cards.forEach((card) => {
    if (!result.has(card.name)) result.set(card.name, card);
  });
  return Array.from(result.values());
}

export function isNewCard(card: ScryfallCard) {
  if (typeof card.reprint === 'boolean') return !card.reprint;
  return false;
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Scryfall returned ${response.status}`);
  return response.json() as Promise<T>;
}

function getImage(cards: ScryfallCard[]) {
  const card = cards.find((item) => item.image_uris?.normal || item.card_faces?.[0]?.image_uris?.normal);
  return card?.image_uris || card?.card_faces?.[0]?.image_uris;
}

export function useSetDetail(setCode?: string) {
  const [data, setData] = useState<SetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = setCode?.trim().toLowerCase();
    const controller = new AbortController();
    let active = true;

    if (!code) {
      setData(null);
      setError('No set code provided');
      setLoading(false);
      return () => controller.abort();
    }

    const load = async () => {
      setData(null);
      setError(null);
      setLoading(true);

      try {
        const [cardsResponse, setInfo] = await Promise.all([
          getJson<SearchResponse>(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`e:${code}`)}&unique=prints&order=set`, controller.signal),
          getJson<SetSummary>(`https://api.scryfall.com/sets/${code}`, controller.signal),
        ]);

        if (!active) return;

        const firstPage = cardsResponse.data || [];
        setData({
          setCode: code.toUpperCase(),
          setName: setInfo.name || code.toUpperCase(),
          releasedAt: setInfo.released_at,
          cards: firstPage,
          uniqueCards: uniqueByName(firstPage),
          precons: [],
        });
        // The first page is enough to render the page. Do not wait for every card.
        setLoading(false);

        let allCards = firstPage;
        let nextPage = cardsResponse.has_more ? cardsResponse.next_page : undefined;
        let pageCount = 0;
        while (active && nextPage && pageCount < 10) {
          const page = await getJson<SearchResponse>(nextPage, controller.signal);
          allCards = [...allCards, ...(page.data || [])];
          setData((current) => current ? { ...current, cards: allCards, uniqueCards: uniqueByName(allCards) } : current);
          nextPage = page.has_more ? page.next_page : undefined;
          pageCount += 1;
        }

        // Commander products are represented by child sets in Scryfall's set catalog.
        // This lookup is additive and never blocks the card grid.
        try {
          const setCatalog = await getJson<{ data?: SetSummary[] }>('https://api.scryfall.com/sets', controller.signal);
          const childSets = (setCatalog.data || [])
            .filter((item) => item.parent_set_code?.toLowerCase() === code && item.set_type === 'commander')
            .slice(0, 8);

          const preconGroups = await Promise.all(childSets.map(async (child): Promise<PreconDeck[]> => {
            try {
              const childCards = await getJson<SearchResponse>(
                `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`e:${child.code}`)}&unique=prints&order=set`,
                controller.signal,
              );
              const cards = childCards.data || [];
              let matchingDecks = commanderDecklists.filter((deck) => deck.set_code.toLowerCase() === child.code.toLowerCase());
              if (matchingDecks.length === 0) {
                const parentDecks = commanderDecklists.filter((deck) => deck.set_code.toLowerCase() === code);
                const matchedDeck = parentDecks.find((deck) => {
                  const normalizedDeckName = deck.name.toLowerCase();
                  const normalizedChildName = child.name.toLowerCase();
                  return normalizedChildName.includes(normalizedDeckName) || normalizedDeckName.includes(normalizedChildName);
                });
                if (matchedDeck) {
                  matchingDecks = [matchedDeck];
                } else if (childSets.length === parentDecks.length) {
                  const index = childSets.indexOf(child);
                  if (parentDecks[index]) {
                    matchingDecks = [parentDecks[index]];
                  }
                }
              }
              if (matchingDecks.length > 0) {
                return matchingDecks.map((deck) => {
                  const commanderCard = cards.find((card) => card.name.toLowerCase() === deck.commander[0]?.name.toLowerCase());
                  const fallbackImage = getImage(cards);
                  const image = commanderCard?.image_uris || fallbackImage;
                  const colors = commanderCard?.color_identity?.length
                    ? commanderCard.color_identity
                    : Array.from(new Set(cards.flatMap((card) => card.color_identity || [])));
                  const productAsset = productAssetFor(deck.name);
                  return {
                    id: `${child.code}-${deck.name}`,
                    name: deck.name,
                    set_code: child.code,
                    colors,
                    card_count: 100,
                    image_uris: image ? { normal: image.normal, small: image.small } : undefined,
                    productImageUrl: productAsset?.imageUrl,
                    productImageSourceUrl: productAsset?.sourceUrl,
                    productImageSourceLabel: productAsset?.sourceLabel,
                    scryfall_uri: commanderCard?.scryfall_uri || child.scryfall_uri,
                    hasDecklist: true,
                    synopsis: deck.synopsis,
                    approxValue: deck.approxValue,
                  } satisfies PreconDeck;
                });
              }
              const image = getImage(cards);
              const colors = Array.from(new Set(cards.flatMap((card) => card.color_identity || [])));
              const productAsset = productAssetFor(child.name);
              return [{
                id: child.code,
                name: child.name,
                set_code: child.code,
                colors,
                card_count: child.card_count,
                image_uris: image ? { normal: image.normal, small: image.small } : undefined,
                productImageUrl: productAsset?.imageUrl,
                productImageSourceUrl: productAsset?.sourceUrl,
                productImageSourceLabel: productAsset?.sourceLabel,
                scryfall_uri: child.scryfall_uri,
                hasDecklist: false,
              } satisfies PreconDeck];
            } catch {
              return [];
            }
          }));
          if (active) {
            setData((current) => current ? {
              ...current,
              precons: preconGroups.flat(),
            } : current);
          }
        } catch (preconError) {
          if (active) console.warn('Commander product lookup unavailable', preconError);
        }
      } catch (loadError) {
        if (!active || (loadError instanceof DOMException && loadError.name === 'AbortError')) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this set');
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [setCode]);

  return { data, loading, error };
}

export type { SetSummary };
void useSetDetail;
