// Design philosophy: hard-edged MTG archive navigation with live Scryfall provenance, explicit release chronology, and filters that never hide card/product imagery.
import { useEffect, useState } from 'react';

export interface CommanderArchiveSet {
  id: string;
  code: string;
  name: string;
  released_at: string;
  card_count: number;
  parent_set_code?: string;
  scryfall_uri?: string;
  products: CommanderProduct[];
}

export interface CommanderProduct {
  id: string;
  name: string;
  imageUrl?: string;
  scryfall_uri?: string;
  cardCount?: number;
}

interface ScryfallSetSummary {
  id: string;
  code: string;
  name: string;
  released_at?: string;
  card_count: number;
  parent_set_code?: string;
  scryfall_uri?: string;
  set_type: string;
}

interface ScryfallCardSearch {
  data?: Array<{
    id: string;
    name: string;
    image_uris?: { normal?: string };
    scryfall_uri?: string;
    card_count?: number;
  }>;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function classifySet(entry: CommanderArchiveSet) {
  const name = entry.name.toLowerCase();
  if (name.includes('warhammer') || name.includes('doctor who') || name.includes('fallout') || name.includes('lord of the rings') || name.includes('marvel') || name.includes('final fantasy') || name.includes('universes')) return 'universes';
  if (name.includes('starter')) return 'starter';
  return 'set';
}

export { classifySet };

export function useCommanderLibrary() {
  const [sets, setSets] = useState<CommanderArchiveSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://api.scryfall.com/sets', { signal: controller.signal });
        if (!response.ok) throw new Error(`Scryfall returned ${response.status}`);
        const payload = await response.json() as { data?: ScryfallSetSummary[] };
        const today = new Date().toISOString().slice(0, 10);
        const historical = (payload.data || [])
          .filter((set) => set.set_type === 'commander' && Boolean(set.released_at) && set.released_at! >= '2022-01-01' && set.released_at! <= today)
          .sort((a, b) => new Date(b.released_at!).getTime() - new Date(a.released_at!).getTime())
          .map((set) => ({
            id: set.id,
            code: set.code,
            name: set.name,
            released_at: set.released_at!,
            card_count: set.card_count,
            parent_set_code: set.parent_set_code,
            scryfall_uri: set.scryfall_uri,
            products: [],
          } satisfies CommanderArchiveSet));

        if (!active) return;
        setSets(historical);
        setLoading(false);
        setProductsLoading(true);

        const withProducts: CommanderArchiveSet[] = [];
        for (const set of historical) {
          if (!active) return;
          let products: CommanderProduct[] = [];
          try {
            const productResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`is:deck set:${set.code}`)}&unique=prints`, { signal: controller.signal });
            if (productResponse.ok) {
              const productPayload = await productResponse.json() as ScryfallCardSearch;
              products = (productPayload.data || []).map((card) => ({
                id: card.id,
                name: card.name,
                imageUrl: card.image_uris?.normal,
                scryfall_uri: card.scryfall_uri,
                cardCount: card.card_count,
              }));
            }
          } catch (productError) {
            if (isAbortError(productError)) return;
          }
          withProducts.push({ ...set, products });
          setSets([...withProducts, ...historical.slice(withProducts.length)]);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        if (active) setProductsLoading(false);
      } catch (loadError) {
        if (!active || isAbortError(loadError)) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load Commander archive');
        setLoading(false);
        setProductsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { sets, loading, productsLoading, error };
}
