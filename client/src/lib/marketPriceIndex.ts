import { useEffect, useState } from "react";
import type {
  RawCommanderDeck,
  RawDeckCard,
} from "@/data/commanderDecklistsData";

export type PriceMatch = "exact-set" | "name-fallback";

export interface ResolvedCardPrice {
  usd: number;
  match: PriceMatch;
  source: string;
  updatedAt: string;
  sourceId?: string;
  sourceCount?: number;
  tcgplayerUsd?: number;
  cardKingdomUsd?: number;
  cardmarketPrice?: number;
  cardmarketCurrency?: string;
}

export interface DeckMarketValue {
  totalUsd: number;
  pricedCards: number;
  unpricedCards: number;
  coveragePercent: number;
  updatedAt: string;
  source: string;
}

type SnapshotProduct = {
  id?: string;
  set_code?: string;
  name?: string;
  usd?: string | number | null;
  scryfall_uri?: string;
  refreshedAt?: string;
};
type DailySignal = {
  id?: string;
  key?: string;
  name?: string;
  setCode?: string;
  currentUsd?: number;
  lastUpdated?: string;
  source?: string;
  sourceCount?: number;
};
type CommanderPriceRecord = {
  id?: string;
  uuid?: string;
  name?: string;
  set_code?: string;
  collector_number?: string;
  usd?: number | null;
  source?: string;
  updated_at?: string | null;
  prices?: {
    tcgplayer?: number | null;
    tcgplayerCurrency?: string | null;
    cardkingdom?: number | null;
    cardkingdomCurrency?: string | null;
    cardmarket?: number | null;
    cardmarketCurrency?: string | null;
  };
};

type PriceIndexState = "idle" | "loading" | "ready" | "error";

const exactIndex = new Map<string, ResolvedCardPrice>();
const collectorIndex = new Map<string, ResolvedCardPrice>();
const uuidIndex = new Map<string, ResolvedCardPrice>();
const nameIndex = new Map<string, ResolvedCardPrice>();
const unpricedExactKeys = new Set<string>();

let indexState: PriceIndexState = "idle";
let loadPromise: Promise<typeof api> | null = null;
let dailyUpdatedAt = "";
let refreshUpdatedAt = "";
let commanderUpdatedAt = "";

export let commanderPriceSnapshotAsOf = "";
export let commanderPriceSnapshotRefreshedAt = "";
export let commanderPriceSnapshotCoverage: unknown = null;
export let commanderPriceSnapshotSource = "Card-price index";

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function numericPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function buildIndexes(
  dailySnapshot: any,
  scryfallSnapshot: any,
  commanderCardPriceSnapshot: any
) {
  exactIndex.clear();
  collectorIndex.clear();
  uuidIndex.clear();
  nameIndex.clear();
  unpricedExactKeys.clear();

  const dailySignals = (dailySnapshot?.signals || []) as DailySignal[];
  const refreshProducts = (scryfallSnapshot?.products || []) as SnapshotProduct[];
  const commanderPrices = (commanderCardPriceSnapshot?.records ||
    []) as CommanderPriceRecord[];
  dailyUpdatedAt = dailySnapshot?.generatedAt || "";
  refreshUpdatedAt = scryfallSnapshot?.refreshedAt || "";
  commanderPriceSnapshotAsOf = commanderCardPriceSnapshot?.priceDate || "";
  commanderPriceSnapshotRefreshedAt = commanderCardPriceSnapshot?.generatedAt || "";
  commanderPriceSnapshotCoverage = commanderCardPriceSnapshot?.coverage || null;
  commanderPriceSnapshotSource = commanderCardPriceSnapshot?.source || "Card-price index";
  commanderUpdatedAt =
    commanderCardPriceSnapshot?.generatedAt || commanderPriceSnapshotAsOf;

  for (const signal of dailySignals) {
    const price = numericPrice(signal.currentUsd);
    if (!signal.name || price === null) continue;
    const record: ResolvedCardPrice = {
      usd: price,
      match: "exact-set",
      source: signal.source || "MTGJSON daily snapshot",
      updatedAt: signal.lastUpdated || dailyUpdatedAt,
      sourceId: signal.id || signal.key,
      sourceCount: signal.sourceCount,
    };
    const name = normalized(signal.name);
    const setCode = normalized(signal.setCode || "");
    if (setCode) exactIndex.set(`${setCode}::${name}`, record);
    if (!nameIndex.has(name) || nameIndex.get(name)!.updatedAt < record.updatedAt)
      nameIndex.set(name, record);
  }

  for (const product of refreshProducts) {
    const price = numericPrice(product.usd);
    if (!product.name || price === null) continue;
    const record: ResolvedCardPrice = {
      usd: price,
      match: "exact-set",
      source: "Scryfall refresh snapshot",
      updatedAt: product.refreshedAt || refreshUpdatedAt,
      sourceId: product.id,
    };
    const name = normalized(product.name);
    const setCode = normalized(product.set_code || "");
    if (setCode && !exactIndex.has(`${setCode}::${name}`))
      exactIndex.set(`${setCode}::${name}`, record);
    if (!nameIndex.has(name)) nameIndex.set(name, record);
  }

  for (const product of commanderPrices) {
    const price = numericPrice(product.usd);
    if (!product.name) continue;
    const name = normalized(product.name);
    const setCode = normalized(product.set_code || "");
    const exactKey = setCode ? `${setCode}::${name}` : "";
    if (price === null) {
      if (exactKey) {
        exactIndex.delete(exactKey);
        unpricedExactKeys.add(exactKey);
      }
      continue;
    }
    const record: ResolvedCardPrice = {
      usd: price,
      match: "exact-set",
      source: product.source || "MTGJSON AllPricesToday",
      updatedAt: product.updated_at || commanderUpdatedAt,
      sourceId: product.id,
      tcgplayerUsd: numericPrice(product.prices?.tcgplayer) ?? undefined,
      cardKingdomUsd: numericPrice(product.prices?.cardkingdom) ?? undefined,
      cardmarketPrice: numericPrice(product.prices?.cardmarket) ?? undefined,
      cardmarketCurrency: product.prices?.cardmarketCurrency || "EUR",
    };
    if (exactKey) {
      exactIndex.set(exactKey, record);
      unpricedExactKeys.delete(exactKey);
    }
    if (product.uuid) uuidIndex.set(normalized(product.uuid), record);
    if (setCode && product.collector_number) {
      collectorIndex.set(
        `${setCode}::${normalized(product.collector_number)}`,
        record
      );
    }
    nameIndex.set(name, record);
  }
}

export function resolveCardPrice(
  name: string,
  setCode?: string,
  collectorNumber?: string,
  uuid?: string
): ResolvedCardPrice | null {
  const normalizedName = normalized(name);
  const exactUuid = uuid ? uuidIndex.get(normalized(uuid)) : undefined;
  if (exactUuid) return exactUuid;
  const normalizedSetCode = setCode ? normalized(setCode) : "";
  const exactCollector =
    normalizedSetCode && collectorNumber
      ? collectorIndex.get(
          `${normalizedSetCode}::${normalized(collectorNumber)}`
        )
      : undefined;
  if (exactCollector) return exactCollector;
  // A deck record with an explicit UUID or collector number identifies a
  // specific treatment. Never substitute a same-name regular printing when
  // that exact treatment is not present in the price snapshot.
  if (uuid || collectorNumber) return null;
  const exactKey = normalizedSetCode
    ? `${normalizedSetCode}::${normalizedName}`
    : "";
  const exact = exactKey ? exactIndex.get(exactKey) : undefined;
  if (exact) return exact;
  if (exactKey && unpricedExactKeys.has(exactKey)) return null;
  const fallback = nameIndex.get(normalizedName);
  return fallback ? { ...fallback, match: "name-fallback" } : null;
}

export function resolveDeckMarketValue(deck: RawCommanderDeck): DeckMarketValue {
  const entries = [...deck.commander, ...deck.cards];
  let totalUsd = 0;
  let pricedCards = 0;
  let unpricedCards = 0;
  let updatedAt = "";
  const sources = new Set<string>();

  for (const card of entries) {
    const quantity = Math.max(1, Number(card.count || 1));
    const resolved = resolveCardPrice(
      card.name,
      card.set_code || deck.set_code,
      card.number,
      card.uuid
    );
    if (!resolved) {
      unpricedCards += quantity;
      continue;
    }
    totalUsd += resolved.usd * quantity;
    pricedCards += quantity;
    if (resolved.updatedAt > updatedAt) updatedAt = resolved.updatedAt;
    sources.add(resolved.source);
  }

  const totalCards = pricedCards + unpricedCards;
  return {
    totalUsd: Number(totalUsd.toFixed(2)),
    pricedCards,
    unpricedCards,
    coveragePercent: totalCards
      ? Math.round((pricedCards / totalCards) * 100)
      : 0,
    updatedAt:
      updatedAt || dailyUpdatedAt || refreshUpdatedAt || "Price index unavailable",
    source: Array.from(sources).join(" + ") || "Price index unavailable",
  };
}

export function resolveCardListPrices(cards: RawDeckCard[], setCode: string) {
  return cards.map(card => ({
    card,
    price: resolveCardPrice(
      card.name,
      card.set_code || setCode,
      card.number,
      card.uuid
    ),
  }));
}

export async function loadMarketPriceIndex(): Promise<typeof api> {
  if (indexState === "ready") return api;
  if (loadPromise) return loadPromise;
  indexState = "loading";
  loadPromise = Promise.all([
    import("@/data/dailyMarketSnapshot.json"),
    import("@/data/scryfallRefreshSnapshot.json"),
    import("@/data/commanderCardPriceSnapshot.json"),
  ])
    .then(([daily, scryfall, commander]) => {
      buildIndexes(daily.default, scryfall.default, commander.default);
      indexState = "ready";
      return api;
    })
    .catch(error => {
      indexState = "error";
      loadPromise = null;
      throw error;
    });
  return loadPromise;
}

export function useMarketPriceIndex() {
  const [state, setState] = useState<PriceIndexState>(indexState);
  useEffect(() => {
    let active = true;
    if (indexState === "ready") {
      setState("ready");
      return () => {
        active = false;
      };
    }
    void loadMarketPriceIndex()
      .then(() => {
        if (active) setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);
  return {
    ...api,
    loading: state === "idle" || state === "loading",
    ready: state === "ready",
    error: state === "error",
  };
}

const api = {
  loadMarketPriceIndex,
  resolveCardPrice,
  resolveDeckMarketValue,
  resolveCardListPrices,
};
