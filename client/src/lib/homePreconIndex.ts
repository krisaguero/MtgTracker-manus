import { productAssetFor } from "@/data/preconProductAssets";
import type { RawCommanderDeck } from "@/data/commanderDecklistsData";
import type { PreconDeck, ScryfallSet } from "@/hooks/useScryfallSets";

export interface HomePreconIndexEntry {
  id: string;
  name: string;
  set_code: string;
  set_name?: string;
  parent_set_name?: string;
  release_date?: string;
  commanderName: string;
  fallbackImages: string[];
  hasDecklist: boolean;
  cardCount?: number;
}

function normalizedName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function homePreconProductKey(setCode: string, name: string) {
  return `${setCode.toLowerCase()}:${normalizedName(name)}`;
}

/** Combines the complete bundled decklist archive with live Scryfall-only products, deduped by set and product name. */
export function buildHomePreconIndex(
  localDecklists: RawCommanderDeck[],
  livePrecons: Map<string, PreconDeck[]> = new Map(),
  sets: ScryfallSet[] = []
): HomePreconIndexEntry[] {
  const indexed = new Map<string, HomePreconIndexEntry>();
  const parentSetNameByProductKey = new Map<string, string>();

  livePrecons.forEach((decks, parentCode) => {
    const parentSet = sets.find(
      entry => entry.code.toLowerCase() === parentCode.toLowerCase()
    );
    if (!parentSet) return;
    for (const deck of decks) {
      const productCode = deck.set_code || parentCode;
      parentSetNameByProductKey.set(
        homePreconProductKey(productCode, deck.name),
        parentSet.name
      );
    }
  });

  for (const deck of localDecklists) {
    const asset = productAssetFor(deck.name);
    indexed.set(homePreconProductKey(deck.set_code, deck.name), {
      id: `${deck.set_code}-${normalizedName(deck.name)}`,
      name: deck.name,
      set_code: deck.set_code,
      set_name: deck.set_name,
      parent_set_name: parentSetNameByProductKey.get(
        homePreconProductKey(deck.set_code, deck.name)
      ),
      release_date: deck.release_date,
      commanderName: deck.commander[0]?.name || deck.name,
      fallbackImages: asset?.imageUrl ? [asset.imageUrl] : [],
      hasDecklist: true,
      cardCount: deck.commander.length + deck.cards.length,
    });
  }

  livePrecons.forEach((decks, parentCode) => {
    for (const deck of decks) {
      const code = deck.set_code || parentCode;
      const key = homePreconProductKey(code, deck.name);
      if (indexed.has(key)) continue;
      const set = sets.find(
        entry =>
          entry.code.toLowerCase() === parentCode.toLowerCase() ||
          entry.code.toLowerCase() === code.toLowerCase()
      );
      const fallbackImages = [
        deck.productImageUrl,
        deck.image_uris?.normal,
      ].filter((value): value is string => Boolean(value));
      indexed.set(key, {
        id: deck.id,
        name: deck.name,
        set_code: code,
        set_name: set?.name,
        parent_set_name: parentSetNameByProductKey.get(
          homePreconProductKey(code, deck.name)
        ),
        release_date: set?.released_at,
        commanderName: deck.commanderCards?.[0]?.name || deck.name,
        fallbackImages: Array.from(new Set(fallbackImages)),
        hasDecklist: Boolean(deck.hasDecklist),
        cardCount: deck.card_count,
      });
    }
  });

  return Array.from(indexed.values()).sort((a, b) => {
    const aDate = a.release_date ? new Date(a.release_date).getTime() : 0;
    const bDate = b.release_date ? new Date(b.release_date).getTime() : 0;
    return bDate - aDate || a.name.localeCompare(b.name);
  });
}
