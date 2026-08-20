import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dataFile = resolve(root, 'client/src/data/commanderDecklistsData.ts');
const outputFile = resolve(root, 'client/src/data/scryfallRefreshSnapshot.json');
const historyFile = resolve(root, 'client/src/data/priceHistorySnapshot.json');

async function readJsonIfPresent(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

const source = await readFile(dataFile, 'utf8');
const deckCodes = [...source.matchAll(/set_code:\s*["']([^"']+)["']/g)].map((match) => match[1].toLowerCase());
const uniqueCodes = [...new Set(deckCodes)];

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'mtg-sets-tracker-refresh/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

const refreshedAt = new Date().toISOString();
const previousSnapshot = await readJsonIfPresent(outputFile);
const previousHistory = await readJsonIfPresent(historyFile);
const sets = [];
const products = [];

for (const code of uniqueCodes) {
  try {
    const set = await getJson(`https://api.scryfall.com/sets/${code}`);
    sets.push({ code: set.code, name: set.name, set_type: set.set_type, released_at: set.released_at, card_count: set.card_count });
  } catch (error) {
    console.warn(`Skipping set ${code}: ${error.message}`);
  }

  try {
    const search = await getJson(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`is:deck set:${code}`)}&unique=prints`);
    for (const card of search.data || []) {
      products.push({
        id: card.id,
        set_code: code,
        name: card.name,
        released_at: card.released_at,
        usd: card.prices?.usd ?? null,
        usd_foil: card.prices?.usd_foil ?? null,
        scryfall_uri: card.scryfall_uri,
      });
    }
  } catch (error) {
    console.warn(`Skipping products for ${code}: ${error.message}`);
  }

  await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
}

const snapshot = {
  refreshedAt,
  source: 'https://api.scryfall.com',
  deckCodes: uniqueCodes,
  sets,
  products,
};

const priorObservation = previousSnapshot?.refreshedAt && Array.isArray(previousSnapshot.products)
  ? {
      observedAt: previousSnapshot.refreshedAt,
      prices: Object.fromEntries(
        previousSnapshot.products
          .filter((product) => product.id && product.usd !== null && product.usd !== undefined && Number.isFinite(Number(product.usd)))
          .map((product) => [product.id, Number(product.usd)]),
      ),
    }
  : null;

const existingObservations = Array.isArray(previousHistory?.observations) ? previousHistory.observations : [];
const observations = priorObservation && !existingObservations.some((item) => item.observedAt === priorObservation.observedAt)
  ? [...existingObservations, priorObservation].slice(-30)
  : existingObservations.slice(-30);

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
await writeFile(historyFile, `${JSON.stringify({ observations, source: 'https://api.scryfall.com', notes: 'Each observation is captured from a completed refresh before the next snapshot replaces it.' }, null, 2)}\n`, 'utf8');
console.log(`Wrote ${sets.length} set records, ${products.length} current price observations, and ${observations.length} historical snapshots.`);
