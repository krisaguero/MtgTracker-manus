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

function scryfallNamedImage(name: string) {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
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

function buildLocalPreconIndex(allSets: ScryfallSet[], decklists: RawCommanderDeck[]): Map<string, PreconDeck[]> {
  if (decklists.length === 0 || allSets.length === 0) return new Map();

  const recentMainSets = allSets
    .filter((set) => set.set_type === 'expansion' || set.set_type === 'core' || set.set_type === 'masters')
    .filter((set) => set.released_at)
    .sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime())
    .slice(0, 60);
  const index = new Map<string, PreconDeck[]>();

  for (const set of recentMainSets) {
    const localDecks = localDecksForParentSet(set.code, allSets, decklists);
    if (localDecks.length > 0) index.set(set.code, localDecks.map(mapLocalDeck));
  }

  return index;
}

export function useScryfallSets() {
  const [sets, setSets] = useState<ScryfallSet[]>([]);
  const [allSets, setAllSets] = useState<ScryfallSet[]>([]);
  const [precons, setPrecons] = useState<Map<string, PreconDeck[]>>(new Map());
  const [localDecklists, setLocalDecklists] = useState<RawCommanderDeck[] | null>(null);
  const [localDecklistError, setLocalDecklistError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localDecklistsRef = useRef<RawCommanderDeck[] | null>(null);
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
    // The archive is the single homepage source for precon counts and values; do not crawl each set's Scryfall cards.
    setPrecons(buildLocalPreconIndex(allSets, localDecklists));
  }, [allSets, localDecklists]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadSets() {
      try {
        setLoading(true);
        setError(null);

        const timeout = window.setTimeout(() => controller.abort(), 12000);
        let setsResponse: Response;
        try {
          setsResponse = await fetch('https://api.scryfall.com/sets', { signal: controller.signal });
        } finally {
          window.clearTimeout(timeout);
        }
        if (!setsResponse.ok) throw new Error('Failed to fetch sets');
        const setsData = await setsResponse.json();
        if (!Array.isArray(setsData.data)) throw new Error('Invalid Scryfall set catalog response');

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
      } catch (err) {
        if (!cancelled) {
          const timedOut = err instanceof DOMException && err.name === 'AbortError';
          setError(timedOut ? 'The Scryfall set catalog took too long to respond. Please retry.' : err instanceof Error ? err.message : 'Failed to load sets');
          setLoading(false);
        }
      }
    }

    void loadSets();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { sets, precons, localDecklists, localDecklistError, loadLocalDecklists, loading, error };
}
