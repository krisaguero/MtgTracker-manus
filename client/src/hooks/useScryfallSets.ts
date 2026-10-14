import { useCallback, useEffect, useRef, useState } from 'react';
import type { RawCommanderDeck, RawDeckCard } from '@/data/commanderDecklistsData';
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

function scryfallNamedImage(name: string) {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

function localDeckFor(setCode: string, productName: string, decklists: RawCommanderDeck[]) {
  const normalizedProduct = normalizedName(productName);
  return decklists.find((deck) => {
    if (deck.set_code.toLowerCase() !== setCode.toLowerCase()) return false;
    const normalizedDeck = normalizedName(deck.name);
    return normalizedDeck === normalizedProduct || normalizedProduct.includes(normalizedDeck) || normalizedDeck.includes(normalizedProduct);
  });
}

function matchesLocalDeckName(productName: string, decklists: RawCommanderDeck[]) {
  const normalizedProduct = normalizedName(productName);
  return decklists.some((deck) => {
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

export function localDecksForParentSet(parentSetCode: string, allSets: ScryfallSet[], decklists: RawCommanderDeck[]) {
  const productSetCodes = new Set(commanderProductCodesForParent(parentSetCode, allSets));
  return decklists.filter((deck) => productSetCodes.has(deck.set_code.toLowerCase()));
}

function mapLocalDeck(deck: RawCommanderDeck): PreconDeck {
  const productAsset = productAssetFor(deck.name);
  return {
    id: `${deck.set_code}-${deck.name}`,
    name: deck.name,
    set_code: deck.set_code,
    colors: [],
    card_count: 100,
    image_uris: { normal: scryfallNamedImage(deck.commander[0]?.name || deck.name) },
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

function mergeLocalDecklistsIntoPrecons(
  preconMap: Map<string, PreconDeck[]>,
  allSets: ScryfallSet[],
  decklists: RawCommanderDeck[],
): Map<string, PreconDeck[]> {
  if (decklists.length === 0 || allSets.length === 0) return preconMap;

  const mainSets = allSets
    .filter((set) => set.set_type === 'expansion' || set.set_type === 'core' || set.set_type === 'masters')
    .filter((set) => set.released_at)
    .sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime())
    .slice(0, 60);
  const merged = new Map(preconMap);

  for (const set of mainSets) {
    const localDecks = localDecksForParentSet(set.code, allSets, decklists);
    if (localDecks.length === 0) continue;

    const existingProducts = merged.get(set.code) || [];
    const unmatchedLiveProducts = existingProducts.filter((product) => !matchesLocalDeckName(product.name, localDecks));
    merged.set(set.code, [...localDecks.map(mapLocalDeck), ...unmatchedLiveProducts]);
  }

  return merged;
}

export function useScryfallSets() {
  const [sets, setSets] = useState<ScryfallSet[]>([]);
  const [allSets, setAllSets] = useState<ScryfallSet[]>([]);
  const [precons, setPrecons] = useState<Map<string, PreconDeck[]>>(new Map());
  const [localDecklists, setLocalDecklists] = useState<RawCommanderDeck[] | null>(null);
  const [localDecklistError, setLocalDecklistError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrichingPrecons, setEnrichingPrecons] = useState(false);
  const localDecklistsRef = useRef<RawCommanderDeck[] | null>(null);
  const preconsRef = useRef<Map<string, PreconDeck[]>>(new Map());
  const loadingLocalArchiveRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadLocalDecklists = useCallback(async () => {
    if (localDecklistsRef.current !== null || loadingLocalArchiveRef.current) return;
    loadingLocalArchiveRef.current = true;
    setLocalDecklistError(null);

    try {
      // The archive's multi-megabyte module is fetched only when the user opens precons or requests value sorting.
      const decklistModule = await import('@/data/commanderDecklistsData');
      if (!mountedRef.current) return;
      localDecklistsRef.current = decklistModule.commanderDecklistsData;
      setLocalDecklists(decklistModule.commanderDecklistsData);
    } catch {
      if (mountedRef.current) setLocalDecklistError('The Commander decklist archive could not be loaded.');
    } finally {
      loadingLocalArchiveRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (localDecklists === null || allSets.length === 0) return;
    const merged = mergeLocalDecklistsIntoPrecons(preconsRef.current, allSets, localDecklists);
    preconsRef.current = merged;
    setPrecons(merged);
  }, [allSets, localDecklists]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadSets() {
      try {
        setLoading(true);
        setError(null);

        // Keep the initial catalog request bounded, but do not abort deferred product enrichment.
        const initialController = new AbortController();
        const initialTimeout = window.setTimeout(() => initialController.abort(), 12000);
        let setsResponse: Response;
        try {
          setsResponse = await fetch('https://api.scryfall.com/sets', { signal: initialController.signal });
        } finally {
          window.clearTimeout(initialTimeout);
        }
        if (!setsResponse.ok) throw new Error('Failed to fetch sets');
        const setsData = await setsResponse.json();

        const allSets = setsData.data as ScryfallSet[];
        const mainSets = allSets
          .filter((set) => set.set_type === 'expansion' || set.set_type === 'core' || set.set_type === 'masters')
          .filter((set) => set.released_at)
          .sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime())
          .slice(0, 60);

        if (cancelled) return;
        setAllSets(allSets);
        setSets(mainSets);
        setLoading(false);

        // Do not import the full local archive while rendering the ordinary recent-set view.
        const decklists = localDecklistsRef.current ?? [];
        const publishPrecons = (nextPrecons: Map<string, PreconDeck[]>) => {
          const merged = mergeLocalDecklistsIntoPrecons(nextPrecons, allSets, localDecklistsRef.current ?? []);
          preconsRef.current = merged;
          setPrecons(merged);
        };

        const preconMap = new Map<string, PreconDeck[]>();
        // Attach local Commander products when the archive was requested before the sets response completed.
        for (const set of mainSets) {
          const localDecks = localDecksForParentSet(set.code, allSets, decklists);
          if (localDecks.length > 0) {
            preconMap.set(set.code, localDecks.map(mapLocalDeck));
          }
        }

        publishPrecons(preconMap);
        setEnrichingPrecons(true);

        // Keep the homepage responsive while resolving non-local products in parallel.
        const unresolvedSets = mainSets.filter((set) => !preconMap.has(set.code));
        let nextSetIndex = 0;
        const enrichNextSet = async () => {
          while (!cancelled) {
            const set = unresolvedSets[nextSetIndex++];
            if (!set) return;
            try {
              const productSetCodes = commanderProductCodesForParent(set.code, allSets);
              const resultGroups = await Promise.all(productSetCodes.map(async (productSetCode) => {
                const query = `is:deck set:${productSetCode}`;
                const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`, { signal: controller.signal });
                if (!response.ok) return [] as Array<{ card: Record<string, any>; productSetCode: string }>;
                const data = await response.json();
                return (data.data as Array<Record<string, any>>).map((card) => ({ card, productSetCode }));
              }));
              const seenProducts = new Set<string>();
              const preconDecks = resultGroups
                .reduce<Array<{ card: Record<string, any>; productSetCode: string }>>((allCards, group) => allCards.concat(group), [])
                .filter(({ card }) => card.type_line && (card.type_line.includes('Deck') || card.name.includes('Commander') || card.name.includes('Precon')))
                .map(({ card, productSetCode }) => {
                  const localDeck = localDeckFor(productSetCode, card.name, decklists);
                  const productAsset = productAssetFor(card.name as string);
                  return {
                    id: card.id as string,
                    name: card.name as string,
                    set_code: productSetCode,
                    colors: card.color_identity || card.colors || [],
                    card_count: card.card_count || 100,
                    image_uris: card.image_uris || { normal: scryfallNamedImage(localDeck?.commander?.[0]?.name || card.name) },
                    productImageUrl: productAsset?.imageUrl,
                    productImageSourceUrl: productAsset?.sourceUrl,
                    productImageSourceLabel: productAsset?.sourceLabel,
                    scryfall_uri: card.scryfall_uri,
                    hasDecklist: Boolean(localDeck),
                    synopsis: localDeck?.synopsis || card.flavor_text || 'Commander precon release product.',
                    approxValue: localDeck?.approxValue,
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
                if (!cancelled) publishPrecons(preconMap);
              }
            } catch {
              // Keep any available local and previously resolved products when one set fails.
            }
          }
        };
        await Promise.all(Array.from({ length: Math.min(4, unresolvedSets.length) }, () => enrichNextSet()));

        if (!cancelled) {
          setEnrichingPrecons(false);
          publishPrecons(preconMap);
        }
      } catch (err) {
        if (!cancelled) {
          setEnrichingPrecons(false);
          const timedOut = err instanceof DOMException && err.name === 'AbortError';
          setError(timedOut ? 'The Scryfall set catalog took too long to respond. Please retry.' : err instanceof Error ? err.message : 'Failed to load sets');
          setLoading(false);
        }
      }
    }

    loadSets();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { sets, precons, localDecklists, localDecklistError, loadLocalDecklists, loading, enrichingPrecons, error };
}
