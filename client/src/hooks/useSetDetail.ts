import { useState, useEffect } from 'react';
import { productAssetFor } from '@/data/preconProductAssets';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';

function scryfallNamedImage(name: string, version: 'normal' | 'small' = 'normal') {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=${version}`;
}

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

interface SetListResponse {
  data?: SetSummary[];
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

export function useSetDetail(setCode?: string) {
  const [data, setData] = useState<SetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = setCode?.trim().toLowerCase();
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 15000);
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
        const [cardsResponse, setInfo, setList] = await Promise.all([
          getJson<SearchResponse>(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`e:${code}`)}&unique=prints&order=set`, controller.signal),
          getJson<SetSummary>(`https://api.scryfall.com/sets/${code}`, controller.signal),
          getJson<SetListResponse>('https://api.scryfall.com/sets', controller.signal),
        ]);

        const relatedCodes = new Set([
          code,
          ...(setList.data || [])
            .filter((set) => set.set_type === 'commander' && set.parent_set_code?.toLowerCase() === code)
            .map((set) => set.code.toLowerCase()),
        ]);
        const directDecks = commanderDecklistsData.filter((d: any) => relatedCodes.has(d.set_code.toLowerCase()));
        const initialPrecons: PreconDeck[] = directDecks.map((deck: any) => {
          const productAsset = productAssetFor(deck.name);
          return {
            id: `${code}-${deck.name}`,
            name: deck.name,
            set_code: code.toUpperCase(),
            colors: deck.colors || ['W', 'U'],
            card_count: 100,
            image_uris: {
              normal: scryfallNamedImage(deck.commander?.[0]?.name || deck.name),
              small: scryfallNamedImage(deck.commander?.[0]?.name || deck.name, 'small'),
            },
            productImageUrl: productAsset?.imageUrl,
            productImageSourceUrl: productAsset?.sourceUrl,
            productImageSourceLabel: productAsset?.sourceLabel,
            hasDecklist: true,
            synopsis: deck.synopsis,
            approxValue: deck.approxValue,
          };
        });
        const firstPage = cardsResponse.data || [];
        setData({
          setCode: code.toUpperCase(),
          setName: setInfo.name || code.toUpperCase(),
          releasedAt: setInfo.released_at,
          cards: firstPage,
          uniqueCards: uniqueByName(firstPage),
          precons: initialPrecons,
        });
        setLoading(false);

        let allCards = firstPage;
        let nextPage = cardsResponse.has_more ? cardsResponse.next_page : undefined;
        let pageCount = 0;
        while (active && nextPage && pageCount < 10) {
          const page = await getJson<SearchResponse>(nextPage, controller.signal);
          allCards = [...allCards, ...(page.data || [])];
          setData((current: SetDetailData | null) => current ? { ...current, cards: allCards, uniqueCards: uniqueByName(allCards) } : current);
          nextPage = page.has_more ? page.next_page : undefined;
          pageCount += 1;
        }

        if (initialPrecons.length > 0) {
          const enrichedPrecons = initialPrecons.map((precon) => {
            const matchingDeckData = directDecks.find((d: any) => d.name === precon.name);
            const primaryCommanderName = matchingDeckData?.commander?.[0]?.name;
            const foundCard = allCards.find((c) => c.name.toLowerCase() === primaryCommanderName?.toLowerCase());
            const image = foundCard?.image_uris || foundCard?.card_faces?.[0]?.image_uris;
            return {
              ...precon,
              image_uris: image ? { normal: image.normal, small: image.small } : precon.image_uris,
              scryfall_uri: foundCard?.scryfall_uri,
            };
          });
          setData((current: SetDetailData | null) => current ? { ...current, precons: enrichedPrecons } : current);
        }
      } catch (err: any) {
        if (!active) return;
        if (err.name === 'AbortError') {
          setError('The set catalog took too long to respond. Please retry.');
        } else {
          setError(err.message || 'Failed to load set details');
        }
      } finally {
        window.clearTimeout(requestTimeout);
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(requestTimeout);
    };
  }, [setCode]);

  return { data, loading, error };
}
