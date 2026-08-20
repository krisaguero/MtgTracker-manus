import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rawDeckFile = resolve(root, 'client/src/data/commanderDecklistsData.ts');
const matrixFile = resolve(root, 'client/src/lib/canonicalMarketEngine.ts');
const latestOutputFile = resolve(root, 'client/src/data/dailyMarketSnapshot.json');
const archiveDirectory = resolve(root, 'data/market/daily');
const historyFile = resolve(root, 'data/market/daily-movers-history.json');
const MAX_HISTORY_DAYS = 30;
const USER_AGENT = 'mtg-sets-tracker-daily-movers/1.0 (+https://github.com/krisaguero/MtgTracker-manus)';
const SET_CODE_ALIASES = {
  ppblb: 'pblb',
  ppdsk: 'pdsk',
};

function sourceSetCode(setCode) {
  return SET_CODE_ALIASES[setCode.toLowerCase()] || setCode.toLowerCase();
}

export function normalize(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function dateKey(isoString = new Date().toISOString()) {
  return isoString.slice(0, 10);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

function parseDeckReferences(source) {
  const refs = new Map();
  const pattern = /\{\s*name:\s*["']([^"']+)["']\s*,\s*set_code:\s*["']([^"']+)["']\s*,\s*number:\s*["']([^"']+)["']\s*,\s*count:\s*(\d+)\s*\}/g;
  for (const match of source.matchAll(pattern)) {
    const [, name, setCode, number, count] = match;
    const key = `${setCode.toLowerCase()}:${number}`;
    refs.set(key, { name, setCode: setCode.toLowerCase(), number, count: Number(count), origin: 'Commander decklist' });
  }
  return [...refs.values()];
}

function parseMatrixReferences(source) {
  const refs = new Map();
  const pattern = /\{\s*cat:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,\s*set:\s*'([^']+)'/g;
  for (const match of source.matchAll(pattern)) {
    const [, category, name, setCode] = match;
    const key = `${setCode.toLowerCase()}:${normalize(name)}`;
    refs.set(key, { name, setCode: setCode.toLowerCase(), category, origin: 'Market signal matrix' });
  }
  return [...refs.values()];
}

function latestNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  if (typeof value !== 'object') return null;
  const datedValues = Object.entries(value)
    .filter(([key, nested]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(Number(nested)) && Number(nested) > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (datedValues.length > 0) return Number(datedValues.at(-1)[1]);
  for (const nested of Object.values(value)) {
    const found = latestNumber(nested);
    if (found !== null) return found;
  }
  return null;
}

export function priceForCard(priceRecord) {
  const paper = priceRecord?.paper || {};
  const tcgplayerMarketUsd = latestNumber(paper?.tcgplayer?.retail?.normal)
    ?? latestNumber(paper?.tcgplayer?.retail?.foil)
    ?? latestNumber(paper?.tcgplayer);
  const cardKingdomUsd = latestNumber(paper?.cardkingdom?.retail?.normal)
    ?? latestNumber(paper?.cardkingdom?.retail?.foil)
    ?? latestNumber(paper?.cardkingdom);
  const marketUsd = tcgplayerMarketUsd ?? cardKingdomUsd;
  return { marketUsd, tcgplayerMarketUsd, cardKingdomUsd };
}

function cardIndex(setPayload) {
  const byNumber = new Map();
  const byName = new Map();
  for (const card of setPayload?.data?.cards || []) {
    if (card.number) byNumber.set(String(card.number), card);
    const name = normalize(card.name);
    if (name && !byName.has(name)) byName.set(name, card);
  }
  return { byNumber, byName };
}

function categoryFor({ price, percentChange, existingCategory, origin }) {
  if (existingCategory) return existingCategory;
  if (percentChange <= -15) return 'reprint-squashes';
  if (price >= 25 && percentChange >= 10) return 'high-spikes';
  if (price <= 2 && percentChange >= 15) return 'penny-risers';
  if (origin === 'Commander decklist') return 'commander-picks';
  return 'watchlist';
}

function reasonFor({ percentChange, sourceCount, origin }) {
  const direction = percentChange > 0 ? 'rose' : percentChange < 0 ? 'fell' : 'held flat';
  return `${origin}; ${direction} ${Math.abs(percentChange).toFixed(1)}% since the prior saved observation across ${sourceCount} available price source${sourceCount === 1 ? '' : 's'}.`;
}

export function createSnapshot({ cards, previousPrices, generatedAt }) {
  const signals = cards
    .filter((item) => item.price.marketUsd !== null)
    .map((item) => {
      const previous = previousPrices[item.key];
      const currentUsd = Number(item.price.marketUsd.toFixed(2));
      const previousUsd = typeof previous === 'number' && previous > 0 ? previous : currentUsd;
      const percentChange = previousUsd > 0 ? Number((((currentUsd - previousUsd) / previousUsd) * 100).toFixed(2)) : 0;
      const sourceCount = [item.price.tcgplayerMarketUsd, item.price.cardKingdomUsd].filter((value) => value !== null).length;
      const category = categoryFor({ price: currentUsd, percentChange, existingCategory: item.reference.category, origin: item.reference.origin });
      return {
        id: item.card.uuid || item.key,
        key: item.key,
        name: item.card.name,
        setCode: item.reference.setCode,
        setName: item.card.setName || item.reference.setCode.toUpperCase(),
        collectorNumber: item.card.number || item.reference.number || null,
        rarity: item.card.rarity || 'unknown',
        format: item.reference.origin === 'Commander decklist' ? 'Commander' : 'Market',
        category,
        currentUsd,
        previousUsd: Number(previousUsd.toFixed(2)),
        percentChange,
        trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'flat',
        tcgplayerMarketUsd: item.price.tcgplayerMarketUsd === null ? null : Number(item.price.tcgplayerMarketUsd.toFixed(2)),
        cardKingdomUsd: item.price.cardKingdomUsd === null ? null : Number(item.price.cardKingdomUsd.toFixed(2)),
        sourceCount,
        imageUrl: `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(item.card.name)}&format=image&version=normal`,
        reason: reasonFor({ percentChange, sourceCount, origin: item.reference.origin }),
        source: 'MTGJSON',
        isCatalyst: Math.abs(percentChange) >= 25,
        lastUpdated: generatedAt,
      };
    })
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange) || b.currentUsd - a.currentUsd || a.name.localeCompare(b.name));

  return {
    schemaVersion: 1,
    generatedAt,
    sources: ['MTGJSON set data', 'MTGJSON paper price data', 'Scryfall image endpoint'],
    methodology: 'Signals compare the current normalized MTGJSON paper price with the prior local daily snapshot. A flat first observation establishes a baseline rather than fabricating movement.',
    signalCount: signals.length,
    signals,
  };
}

export function updateHistorySnapshots(existingSnapshots, { generatedAt, prices }) {
  const currentDate = dateKey(generatedAt);
  const snapshots = Array.isArray(existingSnapshots) ? existingSnapshots : [];
  const priorSnapshots = snapshots
    .filter((snapshot) => typeof snapshot?.date === 'string' && snapshot.date < currentDate)
    .sort((a, b) => a.date.localeCompare(b.date));
  const updatedSnapshots = [
    ...snapshots.filter((snapshot) => snapshot?.date !== currentDate),
    { date: currentDate, generatedAt, prices },
  ]
    .sort((a, b) => a.date.localeCompare(b.date) || a.generatedAt.localeCompare(b.generatedAt))
    .slice(-MAX_HISTORY_DAYS);

  return {
    previousPrices: priorSnapshots.at(-1)?.prices || {},
    snapshots: updatedSnapshots,
  };
}

export async function runDailyMarketMovers({ now = new Date(), dryRun = false } = {}) {
  const generatedAt = now.toISOString();
  const [deckSource, matrixSource, history] = await Promise.all([
    readFile(rawDeckFile, 'utf8'),
    readFile(matrixFile, 'utf8'),
    readJson(historyFile, { snapshots: [] }),
  ]);

  const references = [...parseDeckReferences(deckSource), ...parseMatrixReferences(matrixSource)];
  const setCodes = [...new Set(references.map((reference) => sourceSetCode(reference.setCode)))];
  const setPayloads = new Map();
  const warnings = [];
  let allPrices = {};

  try {
    const payload = await fetchJson('https://mtgjson.com/api/v5/AllPricesToday.json');
    allPrices = payload?.data || {};
  } catch (error) {
    throw new Error(`Unable to retrieve MTGJSON AllPricesToday data: ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const setCode of setCodes) {
    try {
      const payload = await fetchJson(`https://mtgjson.com/api/v5/${setCode.toUpperCase()}.json`);
      setPayloads.set(setCode, cardIndex(payload));
    } catch (error) {
      warnings.push({ setCode, message: error instanceof Error ? error.message : String(error) });
    }
  }

  const cards = [];
  for (const reference of references) {
    const index = setPayloads.get(sourceSetCode(reference.setCode));
    if (!index) continue;
    const card = reference.number ? index.byNumber.get(String(reference.number)) : undefined;
    const matchedCard = card || index.byName.get(normalize(reference.name));
    if (!matchedCard) {
      warnings.push({ setCode: reference.setCode, name: reference.name, message: 'Card not found in MTGJSON set payload' });
      continue;
    }
    const price = priceForCard(allPrices[matchedCard.uuid]);
    if (price.marketUsd === null) continue;
    cards.push({
      key: matchedCard.uuid || `${reference.setCode}:${matchedCard.number || normalize(matchedCard.name)}`,
      reference,
      card: matchedCard,
      price,
    });
  }

  if (cards.length === 0) {
    throw new Error(`No priced cards were collected. Set payload failures: ${warnings.length}.`);
  }

  const priceMap = Object.fromEntries(cards.map((item) => [item.key, Number(item.price.marketUsd.toFixed(2))]));
  const historyUpdate = updateHistorySnapshots(history.snapshots, { generatedAt, prices: priceMap });
  const snapshot = createSnapshot({ cards, previousPrices: historyUpdate.previousPrices, generatedAt });
  snapshot.warnings = warnings;

  const nextHistory = {
    schemaVersion: 1,
    snapshots: historyUpdate.snapshots,
  };

  if (!dryRun) {
    const archiveFile = resolve(archiveDirectory, `${dateKey(generatedAt)}.json`);
    await Promise.all([
      mkdir(dirname(latestOutputFile), { recursive: true }),
      mkdir(archiveDirectory, { recursive: true }),
      mkdir(dirname(historyFile), { recursive: true }),
    ]);
    await Promise.all([
      writeFile(latestOutputFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8'),
      writeFile(archiveFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8'),
      writeFile(historyFile, `${JSON.stringify(nextHistory, null, 2)}\n`, 'utf8'),
    ]);
  }

  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runDailyMarketMovers()
    .then((snapshot) => {
      console.log(`Daily market movers complete: ${snapshot.signalCount} priced cards at ${snapshot.generatedAt}.`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
