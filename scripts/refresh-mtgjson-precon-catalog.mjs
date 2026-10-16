import { execFile } from 'node:child_process';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  buildMtgjsonPreconCatalog,
  DECK_LIST_URL,
  MTGJSON_API_BASE,
  parseCommanderDecksSource,
  SET_LIST_URL,
  missingCommanderDeckMetadata,
} from './mtgjson-precon-catalog.mjs';

const execFileAsync = promisify(execFile);
const REPO_ROOT = process.cwd();
const LOCAL_ARCHIVE_PATH = path.join(REPO_ROOT, 'client/src/data/commanderDecklistsData.ts');
const OUTPUT_PATH = path.join(REPO_ROOT, 'client/src/data/mtgjsonPreconCatalog.json');
const DECK_OUTPUT_PATH = path.join(REPO_ROOT, 'client/src/data/mtgjsonPreconDecks.json');
const TEMP_OUTPUT_PATH = `${OUTPUT_PATH}.tmp`;
const DECK_TEMP_OUTPUT_PATH = `${DECK_OUTPUT_PATH}.tmp`;
const SCAN_TIMESTAMP = new Date().toISOString();
const SCAN_DATE = SCAN_TIMESTAMP.slice(0, 10);
const SCRYFALL_SEARCH_INTERVAL_MS = 600;
const USER_AGENT = 'MTGTracker-ReleaseCatalog/1.0';

async function fetchJson(url, { allowNotFound = false, allowInvalidJson = false, maxBuffer = 24 * 1024 * 1024 } = {}) {
  const { stdout } = await execFileAsync('curl', [
    '-sS',
    '--location',
    '--max-time', '60',
    '--user-agent', USER_AGENT,
    '--header', 'Accept: application/json',
    '--write-out', '\n%{http_code}',
    url,
  ], { encoding: 'utf8', maxBuffer });

  const statusBoundary = stdout.lastIndexOf('\n');
  if (statusBoundary < 0) throw new Error(`Could not read HTTP status for ${url}`);
  const status = Number(stdout.slice(statusBoundary + 1).trim());
  const body = stdout.slice(0, statusBoundary).trim();
  if (status === 404 && allowNotFound) return { status, json: null };
  if (status !== 200) throw new Error(`Upstream request failed (${status}): ${url}`);

  try {
    return { status, json: JSON.parse(body) };
  } catch (error) {
    if (allowInvalidJson) return { status, json: null };
    throw new Error(`Upstream returned invalid JSON: ${url} (${error.message})`);
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const output = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      output[index] = await mapper(items[index], index);
    }
  }));
  return output;
}

function isValidReleaseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function delay(milliseconds) {
  return new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
}

async function fetchScryfallSetCards(setCode, requestState) {
  const query = new URLSearchParams({ q: `e:${setCode}`, unique: 'prints', order: 'set' });
  let url = `https://api.scryfall.com/cards/search?${query.toString()}`;
  const cards = [];

  while (url) {
    const elapsed = Date.now() - requestState.lastRequestAt;
    if (requestState.lastRequestAt && elapsed < SCRYFALL_SEARCH_INTERVAL_MS) {
      await delay(SCRYFALL_SEARCH_INTERVAL_MS - elapsed);
    }
    requestState.lastRequestAt = Date.now();
    const { json } = await fetchJson(url, { allowNotFound: true, maxBuffer: 24 * 1024 * 1024 });
    if (!json) return cards;
    if (!Array.isArray(json.data)) throw new Error(`Scryfall search did not return a card list for set ${setCode}.`);
    cards.push(...json.data);
    url = json.has_more && typeof json.next_page === 'string' ? json.next_page : '';
  }

  return cards;
}

async function main() {
  const [deckListResult, setListResult] = await Promise.all([
    fetchJson(DECK_LIST_URL),
    fetchJson(SET_LIST_URL),
  ]);
  const deckList = deckListResult.json;
  const setList = setListResult.json;
  if (!Array.isArray(deckList?.data) || !Array.isArray(setList?.data)) {
    throw new Error('MTGJSON DeckList or SetList did not contain a data array; existing generated data was retained.');
  }
  if (deckList?.meta?.version && setList?.meta?.version && deckList.meta.version !== setList.meta.version) {
    throw new Error(`MTGJSON archive versions do not match (${deckList.meta.version} vs ${setList.meta.version}); retry on the next scan.`);
  }

  const archiveSource = await readFile(LOCAL_ARCHIVE_PATH, 'utf8');
  const existingDecks = parseCommanderDecksSource(archiveSource);
  const missingDecks = missingCommanderDeckMetadata(deckList, existingDecks);
  console.log(`MTGJSON: ${missingDecks.length} Commander products are not in the local baseline.`);

  const deckEntries = await mapWithConcurrency(missingDecks, 6, async metadata => {
    const url = `${MTGJSON_API_BASE}/decks/${encodeURIComponent(metadata.fileName)}.json`;
    const { json } = await fetchJson(url, { allowNotFound: true, allowInvalidJson: true, maxBuffer: 24 * 1024 * 1024 });
    return [metadata.fileName, json];
  });
  const deckFilesByFileName = Object.fromEntries(deckEntries);

  const releaseWindowEnd = new Date(new Date(`${SCAN_DATE}T00:00:00.000Z`).getTime() + 365 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  const futureSets = setList.data
    .filter(set => isValidReleaseDate(set?.releaseDate) && set.releaseDate > SCAN_DATE && set.releaseDate <= releaseWindowEnd)
    .filter(set => typeof set.code === 'string' && /^[a-z0-9_-]+$/i.test(set.code));
  const requestState = { lastRequestAt: 0 };
  const spoilerEntries = [];

  for (const set of futureSets) {
    const cards = await fetchScryfallSetCards(set.code, requestState);
    spoilerEntries.push([set.code.toLowerCase(), cards]);
  }
  const spoilerCardsBySetCode = Object.fromEntries(spoilerEntries);

  const catalog = buildMtgjsonPreconCatalog({
    deckList,
    setList,
    existingDecks,
    deckFilesByFileName,
    spoilerCardsBySetCode,
    scanTimestamp: SCAN_TIMESTAMP,
  });
  catalog.sources = {
    ...catalog.sourceUrls,
    scryfallCards: 'https://api.scryfall.com/cards/search',
    scryfallSpoilerPolicy: 'https://scryfall.com/docs/faqs/what-is-scryfall-s-spoiler-policy-9',
  };

  const deckRecords = catalog.decks
    .filter(item => item.status === 'complete' && item.deckRecord)
    .map(item => item.deckRecord);
  const catalogMetadata = {
    ...catalog,
    decks: catalog.decks.map(({ deckRecord, ...metadata }) => metadata),
  };
  await Promise.all([
    writeFile(TEMP_OUTPUT_PATH, `${JSON.stringify(catalogMetadata, null, 2)}\n`, 'utf8'),
    writeFile(DECK_TEMP_OUTPUT_PATH, `${JSON.stringify(deckRecords, null, 2)}\n`, 'utf8'),
  ]);
  await rename(DECK_TEMP_OUTPUT_PATH, DECK_OUTPUT_PATH);
  await rename(TEMP_OUTPUT_PATH, OUTPUT_PATH);
  console.log(JSON.stringify({
    scanTimestamp: catalog.scanTimestamp,
    mtgjsonBuildDate: catalog.sourceBuildDate,
    commanderProductsScanned: missingDecks.length,
    completeDecklists: catalog.statistics.completeDecks,
    pendingDecklists: catalog.statistics.pendingDecks,
    futureSetsScannedForScryfallPreviews: futureSets.length,
    verifiedPreviewCards: catalog.setReleases.reduce((sum, set) => sum + set.spoilerCount, 0),
    recentAndUpcomingSetEntries: catalog.statistics.recentAndUpcomingSets,
    output: path.relative(REPO_ROOT, OUTPUT_PATH),
    completeDeckPayload: path.relative(REPO_ROOT, DECK_OUTPUT_PATH),
  }, null, 2));
}

main().catch(error => {
  console.error(`MTGJSON catalog refresh failed; existing generated catalog was retained. ${error.stack || error}`);
  process.exitCode = 1;
});
