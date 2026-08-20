import { useEffect, useState } from 'react';
import { commanderDecklistsData, type RawDeckCard } from '@/data/commanderDecklistsData';
import { productAssetFor } from '@/data/preconProductAssets';

export interface ScryfallSet {
  id: string;
  code: string;
  name: string;
  released_at: string;
  icon_svg_uri?: string;
  parent_set_code?: string;
  set_type: string;
  card_count: number;
}

export interface PreconDeck {
  id: string;
  name: string;
  set_code: string;
  colors?: string[];
  card_count?: number;
  image_uris?: {
    normal?: string;
  };
  productImageUrl?: string;
  productImageSourceUrl?: string;
  productImageSourceLabel?: string;
  scryfall_uri?: string;
  hasDecklist?: boolean;
  synopsis?: string;
  approxValue?: number;
  commanderCards?: RawDeckCard[];
  mainCards?: RawDeckCard[];
}

function normalizedName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function localDeckFor(setCode: string, productName: string) {
  const normalizedProduct = normalizedName(productName);
  return commanderDecklistsData.find((deck) => {
    if (deck.set_code.toLowerCase() !== setCode.toLowerCase()) return false;
    const normalizedDeck = normalizedName(deck.name);
    return normalizedDeck === normalizedProduct || normalizedProduct.includes(normalizedDeck) || normalizedDeck.includes(normalizedProduct);
  });
}

export function commanderProductCodesForParent(parentSetCode: string, allSets: ScryfallSet[]): string[] {
  const normalizedParentCode = parentSetCode.toLowerCase();
  const childCommanderCodes = allSets
    .filter((set) => set.set_type === 'commander' && set.parent_set_code?.toLowerCase() === normalizedParentCode)
    .map((set) => set.code.toLowerCase());
  return Array.from(new Set([normalizedParentCode, ...childCommanderCodes]));
}

export function localDecksForParentSet(parentSetCode: string, allSets: ScryfallSet[]) {
  const productSetCodes = new Set(commanderProductCodesForParent(parentSetCode, allSets));
  return commanderDecklistsData.filter((deck) => productSetCodes.has(deck.set_code.toLowerCase()));
}

function mapLocalDeck(deck: (typeof commanderDecklistsData)[number]): PreconDeck {
  const productAsset = productAssetFor(deck.name);
  return {
    id: `${deck.set_code}-${deck.name}`,
    name: deck.name,
    set_code: deck.set_code,
    colors: [],
    card_count: 100,
    image_uris: undefined,
    productImageUrl: productAsset?.imageUrl,
    productImageSourceUrl: productAsset?.sourceUrl,
    productImageSourceLabel: productAsset?.sourceLabel,
    hasDecklist: true,
    synopsis: deck.synopsis,
    approxValue: deck.approxValue,
    commanderCards: deck.commander,
    mainCards: deck.cards,
  };
}

export function useScryfallSets() {
  const [sets, setSets] = useState<ScryfallSet[]>([]);
  const [precons, setPrecons] = useState<Map<string, PreconDeck[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSets() {
      try {
        setLoading(true);
        setError(null);

        const setsResponse = await fetch('https://api.scryfall.com/sets');
        if (!setsResponse.ok) throw new Error('Failed to fetch sets');
        const setsData = await setsResponse.json();

        const allSets = setsData.data as ScryfallSet[];
        const mainSets = allSets
          .filter((set) => set.set_type === 'expansion' || set.set_type === 'core' || set.set_type === 'masters')
          .filter((set) => set.released_at)
          .sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime())
          .slice(0, 60);

        if (cancelled) return;
        setSets(mainSets);

        const preconMap = new Map<string, PreconDeck[]>();
        // Attach Commander child products (for example, EOC → EOE) to their parent release.
        for (const set of mainSets) {
          const localDecks = localDecksForParentSet(set.code, allSets);
          if (localDecks.length > 0) {
            preconMap.set(set.code, localDecks.map(mapLocalDeck));
          }
        }

        if (!cancelled) {
          setPrecons(new Map(preconMap));
          setLoading(false);
        }

        // Query only unresolved sets after local Commander joins are visible.
        for (const set of mainSets) {
          if (preconMap.has(set.code)) continue;
          try {

            const productSetCodes = commanderProductCodesForParent(set.code, allSets);
            const resultGroups = await Promise.all(productSetCodes.map(async (productSetCode) => {
              const query = `is:deck set:${productSetCode}`;
              const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`);
              if (!response.ok) return [] as Array<{ card: Record<string, any>; productSetCode: string }>;
              const data = await response.json();
              return (data.data as Array<Record<string, any>>).map((card) => ({ card, productSetCode }));
            }));
            const seenProducts = new Set<string>();
            const preconDecks = resultGroups
              .reduce<Array<{ card: Record<string, any>; productSetCode: string }>>((allCards, group) => allCards.concat(group), [])
              .filter(({ card }) => card.type_line && (card.type_line.includes('Deck') || card.name.includes('Commander') || card.name.includes('Precon')))
              .map(({ card, productSetCode }) => {
                const localDeck = localDeckFor(productSetCode, card.name);
                const productAsset = productAssetFor(card.name as string);
                return {
                  id: card.id as string,
                  name: card.name as string,
                  set_code: productSetCode,
                  colors: card.color_identity || card.colors || [],
                  card_count: card.card_count || 100,
                  image_uris: card.image_uris,
                  productImageUrl: productAsset?.imageUrl,
                  productImageSourceUrl: productAsset?.sourceUrl,
                  productImageSourceLabel: productAsset?.sourceLabel,
                  scryfall_uri: card.scryfall_uri,
                  hasDecklist: Boolean(localDeck),
                  synopsis: localDeck?.synopsis || card.flavor_text || 'Commander precon release product.',
                  approxValue: localDeck?.approxValue || 45,
                  commanderCards: localDeck?.commander,
                  mainCards: localDeck?.cards,
                };
              })
              .filter((deck) => {
                const productKey = `${deck.set_code}:${normalizedName(deck.name)}`;
                if (seenProducts.has(productKey)) return false;
                seenProducts.add(productKey);
                return true;
              });

            if (preconDecks.length > 0) {
              preconMap.set(set.code, preconDecks);
            }
          } catch {
            // skip set precon fetch error
          }
        }

        if (!cancelled) {
          setPrecons(new Map(preconMap));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load sets');
          setLoading(false);
        }
      }
    }

    loadSets();

    return () => {
      cancelled = true;
    };
  }, []);

  return { sets, precons, loading, error };
}
