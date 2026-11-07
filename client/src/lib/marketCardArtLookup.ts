const COLLECTION_ENDPOINT = "https://api.scryfall.com/cards/collection";
const STORAGE_KEY = "mtg-market-card-art-v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BATCH_WINDOW_MS = 80;
const DEFAULT_REQUEST_GAP_MS = 550;
const DEFAULT_MAX_BATCH_SIZE = 75;

export interface MarketCardImageUrls {
  small?: string;
  normal?: string;
}

interface ScryfallCard {
  name: string;
  set?: string;
  collector_number?: string;
  image_uris?: MarketCardImageUrls;
  card_faces?: Array<{ image_uris?: MarketCardImageUrls }>;
}

interface PendingLookup {
  key: string;
  lookupName: string;
  nameKey: string;
  setCode?: string;
  collectorNumber?: string;
  resolvers: Array<(urls: MarketCardImageUrls | null) => void>;
}

interface CollectionResponse {
  data?: ScryfallCard[];
}

interface CacheStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface MarketCardArtLookupOptions {
  fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  batchWindowMs?: number;
  requestGapMs?: number;
  maxBatchSize?: number;
  storage?: CacheStorage | null;
  now?: () => number;
}

function cleanCardName(name: string) {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

function frontFaceName(name: string) {
  const cleaned = cleanCardName(name);
  return cleaned.split(/\s*\/\/\s*/)[0]?.trim() || cleaned;
}

function normalizedSetCode(value?: string) {
  const code = value?.trim().toLowerCase();
  return code && !["all", "unknown", "—", "-", "n/a"].includes(code)
    ? code
    : undefined;
}

function cacheKey(name: string, setCode?: string) {
  return `${setCode || "*"}|${frontFaceName(name).toLowerCase()}`;
}

function getDefaultStorage(): CacheStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readCache(storage: CacheStorage | null, now: () => number) {
  const cache = new Map<string, MarketCardImageUrls | null>();
  if (!storage) return cache;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return cache;
    const stored = JSON.parse(raw) as {
      savedAt?: number;
      images?: Record<string, MarketCardImageUrls>;
    };
    if (
      typeof stored.savedAt !== "number" ||
      now() - stored.savedAt >= CACHE_TTL_MS ||
      !stored.images
    ) {
      storage.removeItem(STORAGE_KEY);
      return cache;
    }
    for (const [key, urls] of Object.entries(stored.images)) {
      if (urls && (urls.small || urls.normal)) cache.set(key, urls);
    }
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }
  return cache;
}

function imageUrlsFor(card: ScryfallCard): MarketCardImageUrls | null {
  const firstFace = card.card_faces?.find(face => face.image_uris)?.image_uris;
  const imageUris = card.image_uris || firstFace;
  if (!imageUris?.small && !imageUris?.normal) return null;
  return {
    ...(imageUris.small ? { small: imageUris.small } : {}),
    ...(imageUris.normal ? { normal: imageUris.normal } : {}),
  };
}

function cardMatches(item: PendingLookup, card: ScryfallCard, nameOnly: boolean) {
  if (nameOnly) {
    return frontFaceName(card.name).toLowerCase() === item.nameKey;
  }
  if (item.setCode && item.collectorNumber) {
    return (
      card.set?.toLowerCase() === item.setCode &&
      card.collector_number === item.collectorNumber
    );
  }
  if (item.setCode && card.set?.toLowerCase() !== item.setCode) return false;
  return frontFaceName(card.name).toLowerCase() === item.nameKey;
}

function identifierFor(item: PendingLookup, nameOnly: boolean) {
  if (nameOnly || !item.setCode) return { name: item.lookupName };
  if (item.collectorNumber) {
    return { set: item.setCode, collector_number: item.collectorNumber };
  }
  return { name: item.lookupName, set: item.setCode };
}

export function createMarketCardArtLookup(options: MarketCardArtLookupOptions = {}) {
  const fetcher = options.fetcher || ((input, init) => fetch(input, init));
  const batchWindowMs = options.batchWindowMs ?? DEFAULT_BATCH_WINDOW_MS;
  const requestGapMs = options.requestGapMs ?? DEFAULT_REQUEST_GAP_MS;
  const maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
  const now = options.now ?? Date.now;
  const storage = options.storage === undefined ? getDefaultStorage() : options.storage;
  const cache = readCache(storage, now);
  const pending = new Map<string, PendingLookup>();
  const inFlight = new Map<string, PendingLookup>();
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let isFlushing = false;
  let nextRequestAt = 0;

  const persistCache = () => {
    if (!storage) return;
    try {
      const images: Record<string, MarketCardImageUrls> = {};
      cache.forEach((urls, key) => {
        if (urls) images[key] = urls;
      });
      storage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: now(), images }));
    } catch {
      // The lookup still works when browser storage is full or unavailable.
    }
  };

  const waitForRequestSlot = async () => {
    const current = now();
    const scheduledAt = Math.max(current, nextRequestAt);
    nextRequestAt = scheduledAt + requestGapMs;
    const delay = Math.max(0, scheduledAt - current);
    if (delay > 0) await new Promise<void>(resolve => setTimeout(resolve, delay));
  };

  const requestBatch = async (items: PendingLookup[], nameOnly: boolean) => {
    await waitForRequestSlot();
    const response = await fetcher(COLLECTION_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifiers: items.map(item => identifierFor(item, nameOnly)),
      }),
    });
    if (!response.ok) throw new Error(`Scryfall collection lookup failed: ${response.status}`);
    const payload = (await response.json()) as CollectionResponse;
    const cards = Array.isArray(payload.data) ? payload.data : [];
    const matches = new Map<string, MarketCardImageUrls | null>();

    for (const item of items) {
      const card = cards.find(candidate => cardMatches(item, candidate, nameOnly));
      if (card) matches.set(item.key, imageUrlsFor(card));
    }
    return matches;
  };

  const resolveBatch = async (items: PendingLookup[]) => {
    try {
      const matches = await requestBatch(items, false);
      const unresolved = items.filter(item => {
        const urls = matches.get(item.key);
        return !urls?.small && !urls?.normal;
      });
      if (unresolved.length) {
        const fallbackMatches = await requestBatch(unresolved, true);
        fallbackMatches.forEach((urls, key) => matches.set(key, urls));
      }

      for (const item of items) {
        const urls = matches.get(item.key) || null;
        cache.set(item.key, urls);
        for (const resolve of item.resolvers) resolve(urls);
      }
      persistCache();
    } catch {
      for (const item of items) {
        for (const resolve of item.resolvers) resolve(null);
      }
    } finally {
      for (const item of items) inFlight.delete(item.key);
    }
  };

  const scheduleFlush = () => {
    if (flushTimer !== null || isFlushing) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushPending();
    }, batchWindowMs);
  };

  async function flushPending() {
    if (isFlushing) return;
    isFlushing = true;
    try {
      while (pending.size) {
        const items: PendingLookup[] = [];
        pending.forEach(item => {
          if (items.length < maxBatchSize) items.push(item);
        });
        for (const item of items) {
          pending.delete(item.key);
          inFlight.set(item.key, item);
        }
        await resolveBatch(items);
      }
    } finally {
      isFlushing = false;
      if (pending.size) scheduleFlush();
    }
  }

  return function getMarketCardImageUrls(
    name: string,
    setCode?: string,
    collectorNumber?: string | number | null,
  ): Promise<MarketCardImageUrls | null> {
    const lookupName = frontFaceName(name);
    const set = normalizedSetCode(setCode);
    const key = cacheKey(lookupName, set);
    const cached = cache.get(key);
    if (cache.has(key)) return Promise.resolve(cached || null);

    return new Promise(resolve => {
      const existing = pending.get(key) || inFlight.get(key);
      if (existing) {
        if (!existing.collectorNumber && collectorNumber != null) {
          existing.collectorNumber = String(collectorNumber);
        }
        existing.resolvers.push(resolve);
        return;
      }

      pending.set(key, {
        key,
        lookupName,
        nameKey: lookupName.toLowerCase(),
        setCode: set,
        collectorNumber: collectorNumber == null ? undefined : String(collectorNumber),
        resolvers: [resolve],
      });
      scheduleFlush();
    });
  };
}

export const getMarketCardImageUrls = createMarketCardArtLookup();
