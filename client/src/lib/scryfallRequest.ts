const CACHE_VERSION = 1;
const STORAGE_PREFIX = `mtg:scryfall-cache:v${CACHE_VERSION}:`;
const FRESH_TTL_MS = 30 * 60 * 1000;
const STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 110;
const MAX_RETRIES = 3;
const MAX_RETRY_DELAY_MS = 12_000;

type JsonValue = unknown;

type CacheEnvelope<T> = {
  savedAt: number;
  data: T;
};

export type ScryfallCacheResult<T> = {
  data: T;
  stale: boolean;
  revalidate?: Promise<T>;
};

const memoryCache = new Map<string, CacheEnvelope<JsonValue>>();
const inFlight = new Map<string, Promise<JsonValue>>();
const queue: Array<{
  url: string;
  resolve: (value: JsonValue) => void;
  reject: (reason?: unknown) => void;
}> = [];
let queueRunning = false;
let lastRequestAt = 0;
let rateLimitedUntil = 0;

function storageKey(url: string) {
  return `${STORAGE_PREFIX}${url}`;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readCache<T>(url: string): CacheEnvelope<T> | null {
  const memory = memoryCache.get(url) as CacheEnvelope<T> | undefined;
  if (memory) return memory;

  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.savedAt !== 'number' || !('data' in parsed)) return null;
    memoryCache.set(url, parsed as CacheEnvelope<JsonValue>);
    return parsed;
  } catch {
    return null;
  }
}

function writeCache<T>(url: string, data: T) {
  const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data };
  memoryCache.set(url, envelope as CacheEnvelope<JsonValue>);
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(storageKey(url), JSON.stringify(envelope));
  } catch {
    // Quota errors should never prevent the catalog from using its memory cache.
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get('Retry-After');
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
  return Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

async function fetchWithBackoff(url: string): Promise<JsonValue> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const now = Date.now();
    if (rateLimitedUntil > now) await wait(rateLimitedUntil - now);

    const sinceLastRequest = Date.now() - lastRequestAt;
    if (sinceLastRequest < MIN_REQUEST_INTERVAL_MS) await wait(MIN_REQUEST_INTERVAL_MS - sinceLastRequest);
    lastRequestAt = Date.now();

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) return response.json() as Promise<JsonValue>;

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const delay = retryDelay(response, attempt);
      rateLimitedUntil = Date.now() + delay;
      await wait(delay);
      continue;
    }

    throw new Error(`Scryfall returned ${response.status}`);
  }

  throw new Error('Scryfall request failed after retries');
}

function drainQueue() {
  if (queueRunning || queue.length === 0) return;
  queueRunning = true;
  const item = queue.shift()!;
  fetchWithBackoff(item.url)
    .then(item.resolve, item.reject)
    .finally(() => {
      queueRunning = false;
      drainQueue();
    });
}

function requestJson<T>(url: string): Promise<T> {
  const existing = inFlight.get(url) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = new Promise<JsonValue>((resolve, reject) => {
    queue.push({ url, resolve, reject });
    drainQueue();
  })
    .then((data) => {
      writeCache(url, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(url);
    }) as Promise<T>;

  inFlight.set(url, promise as Promise<JsonValue>);
  return promise;
}

/**
 * Read a cached Scryfall response immediately when possible and refresh it in
 * the background. A cold miss is queued and fetched normally. The returned
 * revalidate promise is present for stale entries so callers can update their
 * view after the background refresh completes.
 */
export function getScryfallJson<T>(url: string, signal?: AbortSignal): Promise<ScryfallCacheResult<T>> {
  const cached = readCache<T>(url);
  if (cached) {
    const age = Date.now() - cached.savedAt;
    if (age <= FRESH_TTL_MS) return Promise.resolve({ data: cached.data, stale: false });
    if (age <= STALE_TTL_MS) {
      const revalidate = requestJson<T>(url);
      return Promise.resolve({ data: cached.data, stale: true, revalidate });
    }
  }

  if (signal?.aborted) return Promise.reject(new DOMException('The request was aborted', 'AbortError'));
  return requestJson<T>(url).then((data) => ({ data, stale: false }));
}

export function clearScryfallRequestCache() {
  memoryCache.clear();
  if (!canUseStorage()) return;
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

export const scryfallRequestConfig = {
  freshTtlMs: FRESH_TTL_MS,
  staleTtlMs: STALE_TTL_MS,
  minRequestIntervalMs: MIN_REQUEST_INTERVAL_MS,
  maxRetries: MAX_RETRIES,
};
