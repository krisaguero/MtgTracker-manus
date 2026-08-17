// Design philosophy: hard-edged MTG editorial interface with indigo wayfinding, paper-like surfaces, and compact catalog signals.
import { useEffect, useState } from 'react';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
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

export function useScryfallSets() {
  const [sets, setSets] = useState<ScryfallSet[]>([]);
  const [precons, setPrecons] = useState<Map<string, PreconDeck[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const setsResponse = await fetch('https://api.scryfall.com/sets');
        if (!setsResponse.ok) throw new Error('Failed to fetch sets');
        const setsData = await setsResponse.json();

        const mainSets = (setsData.data as ScryfallSet[])
          .filter((set) => set.set_type === 'expansion' || set.set_type === 'core' || set.set_type === 'masters')
          .filter((set) => set.released_at)
          .sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime())
          .slice(0, 24);

        if (cancelled) return;
        setSets(mainSets);
        setLoading(false);

        const preconMap = new Map<string, PreconDeck[]>();
        // Preload local decklists that match this set code
        for (const set of mainSets) {
          try {
            const localDecks = commanderDecklistsData.filter((d) => d.set_code.toLowerCase() === set.code.toLowerCase());
            if (localDecks.length > 0) {
              const mappedDecks: PreconDeck[] = localDecks.map((deck) => {
                const productAsset = productAssetFor(deck.name);
                return {
                  id: `${set.code}-${deck.name}`,
                  name: deck.name,
                  set_code: set.code,
                  colors: [],
                  card_count: 100,
                  image_uris: undefined,
                  productImageUrl: productAsset?.imageUrl,
                  productImageSourceUrl: productAsset?.sourceUrl,
                  productImageSourceLabel: productAsset?.sourceLabel,
                  hasDecklist: true,
                  synopsis: deck.synopsis,
                  approxValue: deck.approxValue,
                };
              });
              preconMap.set(set.code, mappedDecks);
              continue;
            }

            const query = `is:deck set:${set.code.toLowerCase()}`;
            const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`);
            if (!response.ok) continue;
            const data = await response.json();
            const preconDecks = (data.data as Array<Record<string, any>>)
              .filter((card) => card.type_line && (card.type_line.includes('Deck') || card.name.includes('Commander') || card.name.includes('Precon')))
              .map((card) => {
                const localDeck = localDeckFor(set.code, card.name);
                const productAsset = productAssetFor(card.name as string);
                return {
                  id: card.id as string,
                  name: card.name as string,
                  set_code: set.code,
                  colors: (card.color_identity || []) as string[],
                  card_count: (card.card_count || 100) as number,
                  image_uris: card.image_uris || {},
                  productImageUrl: productAsset?.imageUrl,
                  productImageSourceUrl: productAsset?.sourceUrl,
                  productImageSourceLabel: productAsset?.sourceLabel,
                  scryfall_uri: card.scryfall_uri as string | undefined,
                  hasDecklist: Boolean(localDeck),
                  synopsis: localDeck?.synopsis,
                  approxValue: localDeck?.approxValue,
                } satisfies PreconDeck;
              });

            if (!cancelled && preconDecks.length > 0) preconMap.set(set.code, preconDecks);
          } catch {
            // One set failing should not block the rest of the timeline.
          }

          await new Promise((resolve) => setTimeout(resolve, 75));
        }

        if (!cancelled) setPrecons(preconMap);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { sets, precons, loading, error };
}
