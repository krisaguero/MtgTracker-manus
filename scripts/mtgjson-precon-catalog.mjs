export const MTGJSON_API_BASE = 'https://mtgjson.com/api/v5';
export const DECK_LIST_URL = `${MTGJSON_API_BASE}/DeckList.json`;
export const SET_LIST_URL = `${MTGJSON_API_BASE}/SetList.json`;

const DAY_MS = 24 * 60 * 60 * 1000;
const DECK_FILE_NAME_PATTERN = /^[a-z0-9_-]+$/i;

export function commanderDeckIdentity(deck) {
  return `${String(deck?.set_code || deck?.code || '').trim().toLowerCase()}|${String(deck?.name || '').trim().toLowerCase()}`;
}

export function parseCommanderDecksSource(sourceText) {
  const marker = 'export const commanderDecklistsData: RawCommanderDeck[] = ';
  const markerIndex = sourceText.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('Unable to find commanderDecklistsData in the local archive source.');
  }

  const jsonStart = markerIndex + marker.length;
  const jsonEnd = sourceText.indexOf('];', jsonStart);
  if (jsonEnd < 0) {
    throw new Error('Unable to find the end of the local Commander archive JSON array.');
  }

  const decks = JSON.parse(sourceText.slice(jsonStart, jsonEnd + 1));
  if (!Array.isArray(decks)) {
    throw new Error('The local Commander archive source did not contain a JSON array.');
  }
  return decks;
}

export function missingCommanderDeckMetadata(deckList, existingDecks = []) {
  const existing = new Set(existingDecks.map(commanderDeckIdentity));
  const uniqueByFile = new Map();

  for (const item of Array.isArray(deckList?.data) ? deckList.data : []) {
    if (String(item?.type || '').trim().toLowerCase() !== 'commander deck') continue;
    if (!item.code || !item.name || !item.fileName) continue;
    const identity = commanderDeckIdentity(item);
    if (existing.has(identity)) continue;
    if (!DECK_FILE_NAME_PATTERN.test(item.fileName)) continue;
    if (!uniqueByFile.has(item.fileName)) uniqueByFile.set(item.fileName, item);
  }

  return [...uniqueByFile.values()];
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function deckFileUrl(fileName) {
  return `${MTGJSON_API_BASE}/decks/${encodeURIComponent(fileName)}.json`;
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function mapCard(card, fallbackSetCode) {
  const result = {
    name: card.name.trim(),
    set_code: String(card.setCode || fallbackSetCode).toLowerCase(),
    number: String(card.number),
    count: card.count,
    uuid: card.uuid,
  };
  const scryfallId = card.identifiers?.scryfallId;
  if (isNonEmptyString(scryfallId)) result.scryfall_id = scryfallId;
  if (isNonEmptyString(card.type)) result.type_line = card.type;
  return result;
}

export function validateAndNormalizeCommanderDeck(metadata, payload, options = {}) {
  const scannedAt = options.scanTimestamp || new Date().toISOString();
  const directUrl = deckFileUrl(metadata.fileName);
  const pending = reason => ({ status: 'pending', reason, sourceUrl: directUrl });
  const data = payload?.data;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return pending('MTGJSON lists the product, but no readable full deck record was available.');
  }
  if (String(data.code || '').toLowerCase() !== String(metadata.code || '').toLowerCase()) {
    return pending('The full deck record does not match the set code in MTGJSON DeckList.');
  }
  if (String(data.name || '').trim().toLowerCase() !== String(metadata.name || '').trim().toLowerCase()) {
    return pending('The full deck record does not match the product name in MTGJSON DeckList.');
  }
  if (String(data.type || '').trim().toLowerCase() !== 'commander deck') {
    return pending('The full deck record does not identify this as a Commander Deck.');
  }
  if (metadata.releaseDate && data.releaseDate && metadata.releaseDate !== data.releaseDate) {
    return pending('The release date in the full deck record conflicts with MTGJSON DeckList.');
  }

  const commander = data.commander;
  const mainBoard = data.mainBoard;
  const sideBoard = data.sideBoard;
  if (!Array.isArray(commander) || commander.length === 0) {
    return pending('The Commander record has no verified commander card entries.');
  }
  if (!Array.isArray(mainBoard) || mainBoard.length === 0) {
    return pending('The Commander record has no complete mainboard.');
  }
  if (!Array.isArray(sideBoard)) {
    return pending('The Commander record is missing the sideboard field.');
  }

  const allCards = [...commander, ...mainBoard, ...sideBoard];
  const invalidCard = allCards.find(card =>
    !card ||
    !isNonEmptyString(card.name) ||
    !isNonEmptyString(card.setCode) ||
    !isNonEmptyString(card.number) ||
    !isNonEmptyString(card.uuid) ||
    !Number.isInteger(card.count) ||
    card.count < 1
  );
  if (invalidCard) {
    return pending('One or more card entries are missing a name, positive quantity, set, collector number, or MTGJSON UUID.');
  }

  const totalCardCopies = allCards.reduce((total, card) => total + card.count, 0);
  if (totalCardCopies !== 100) {
    return pending(`The upstream Commander list contains ${totalCardCopies} card copies; exactly 100 are required before import.`);
  }

  const cards = [...mainBoard, ...sideBoard].map(card => mapCard(card, metadata.code));
  const commanderCards = commander.map(card => mapCard(card, metadata.code));
  const sourceUrl = directUrl;
  const deckRecord = {
    name: metadata.name,
    set_code: String(metadata.code).toLowerCase(),
    set_name: options.setName || metadata.code,
    ...(metadata.releaseDate ? { release_date: metadata.releaseDate } : {}),
    cards,
    commander: commanderCards,
    synopsis: `Complete MTGJSON Commander decklist with ${cards.length + commanderCards.length} indexed card entries and ${totalCardCopies} total cards by quantity.`,
    approxValue: 0,
    source_url: sourceUrl,
    ...(Array.isArray(data.sealedProductUuids) && data.sealedProductUuids.length
      ? { sealed_product_uuids: data.sealedProductUuids }
      : {}),
  };

  return {
    status: 'complete',
    sourceUrl,
    ...(isHttpUrl(data.source) ? { upstreamSourceUrl: data.source } : {}),
    totalCardCopies,
    cardEntryCount: allCards.length,
    deckRecord,
    scanTimestamp: scannedAt,
  };
}

function validReleaseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function safeHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function normalizeVerifiedSpoilerCard(card, set, scanTimestamp) {
  const asOf = String(scanTimestamp).slice(0, 10);
  const preview = card?.preview;
  const previewDate = preview?.previewed_at;
  const code = String(set?.code || '').toLowerCase();
  const cardCode = String(card?.set || '').toLowerCase();
  if (!validReleaseDate(set?.releaseDate) || set.releaseDate <= asOf) return null;
  if (!validReleaseDate(previewDate) || previewDate > asOf) return null;
  if (cardCode !== code || !isNonEmptyString(card?.name)) return null;
  if (!isNonEmptyString(preview?.source) || !safeHttpUrl(preview?.source_uri)) return null;

  const firstFace = Array.isArray(card.card_faces)
    ? card.card_faces.find(face => face?.image_uris?.art_crop || face?.image_uris?.normal)
    : null;
  const imageUrl = card.image_uris?.normal || card.image_uris?.art_crop ||
    firstFace?.image_uris?.normal || firstFace?.image_uris?.art_crop || null;
  const scryfallUrl = safeHttpUrl(card.scryfall_uri)
    ? card.scryfall_uri
    : `https://scryfall.com/search?q=${encodeURIComponent(`set:${code} ${card.name}`)}`;
  const rawPrice = card.prices?.usd;
  const priceUsd = rawPrice != null && Number.isFinite(Number(rawPrice)) && Number(rawPrice) >= 0
    ? Number(rawPrice)
    : null;

  return {
    id: isNonEmptyString(card.id) ? card.id : `${code}-${card.collector_number || card.name}`,
    name: card.name,
    setCode: set.code,
    setName: set.name,
    collectorNumber: String(card.collector_number || ''),
    rarity: isNonEmptyString(card.rarity) ? card.rarity : null,
    previewedAt: previewDate,
    previewSource: preview.source,
    previewSourceUrl: preview.source_uri,
    scryfallUrl,
    imageUrl,
    priceUsd,
  };
}

function releaseWindow(now, lookbackDays, futureDays) {
  const current = new Date(now);
  const start = new Date(current.getTime() - lookbackDays * DAY_MS).toISOString().slice(0, 10);
  const end = new Date(current.getTime() + futureDays * DAY_MS).toISOString().slice(0, 10);
  return { start, end };
}

export function buildMtgjsonPreconCatalog({
  deckList,
  setList,
  existingDecks = [],
  deckFilesByFileName = {},
  spoilerCardsBySetCode = {},
  scanTimestamp = new Date().toISOString(),
  lookbackDays = 180,
  futureDays = 365,
}) {
  const deckMetadata = (Array.isArray(deckList?.data) ? deckList.data : [])
    .filter(item => String(item?.type || '').trim().toLowerCase() === 'commander deck')
    .filter(item => item.code && item.name && item.fileName);
  const metadataByFile = new Map();
  for (const item of deckMetadata) {
    if (DECK_FILE_NAME_PATTERN.test(item.fileName) && !metadataByFile.has(item.fileName)) {
      metadataByFile.set(item.fileName, item);
    }
  }

  const existingKeys = new Set(existingDecks.map(commanderDeckIdentity));
  const setsByCode = new Map(
    (Array.isArray(setList?.data) ? setList.data : [])
      .filter(set => set?.code)
      .map(set => [String(set.code).toLowerCase(), set])
  );

  const decks = [];
  const sourceStateByCode = new Map();
  for (const metadata of metadataByFile.values()) {
    const codeKey = String(metadata.code).toLowerCase();
    const state = sourceStateByCode.get(codeKey) || { total: 0, complete: 0, pending: 0 };
    state.total += 1;
    const identity = commanderDeckIdentity(metadata);
    if (existingKeys.has(identity)) {
      state.complete += 1;
      sourceStateByCode.set(codeKey, state);
      continue;
    }

    const setRecord = setsByCode.get(codeKey);
    const validated = validateAndNormalizeCommanderDeck(
      metadata,
      deckFilesByFileName[metadata.fileName],
      { scanTimestamp, setName: setRecord?.name || metadata.code }
    );
    const entry = {
      name: metadata.name,
      code: metadata.code,
      setName: setRecord?.name || metadata.code,
      type: metadata.type,
      releaseDate: validReleaseDate(metadata.releaseDate) ? metadata.releaseDate : null,
      fileName: metadata.fileName,
      sourceUrl: validated.sourceUrl || deckFileUrl(metadata.fileName),
      metadataSourceUrl: DECK_LIST_URL,
      scanTimestamp,
      status: validated.status,
      ...(validated.reason ? { reason: validated.reason } : {}),
      ...(validated.upstreamSourceUrl ? { upstreamSourceUrl: validated.upstreamSourceUrl } : {}),
      ...(validated.totalCardCopies ? { totalCardCopies: validated.totalCardCopies } : {}),
      ...(validated.cardEntryCount ? { cardEntryCount: validated.cardEntryCount } : {}),
      ...(validated.deckRecord ? { deckRecord: validated.deckRecord } : {}),
    };
    decks.push(entry);
    if (entry.status === 'complete') state.complete += 1;
    else state.pending += 1;
    sourceStateByCode.set(codeKey, state);
  }

  const now = new Date(scanTimestamp);
  const window = releaseWindow(now, lookbackDays, futureDays);
  const setReleases = (Array.isArray(setList?.data) ? setList.data : [])
    .filter(set => set?.code && set?.name && validReleaseDate(set.releaseDate))
    .filter(set => set.releaseDate >= window.start && set.releaseDate <= window.end)
    .map(set => {
      const state = sourceStateByCode.get(String(set.code).toLowerCase()) || { total: 0, complete: 0, pending: 0 };
      const sourceUrl = `${MTGJSON_API_BASE}/${encodeURIComponent(set.code)}.json`;
      const spoilerCards = set.releaseDate > scanTimestamp.slice(0, 10)
        ? (Array.isArray(spoilerCardsBySetCode[String(set.code).toLowerCase()])
          ? spoilerCardsBySetCode[String(set.code).toLowerCase()]
          : [])
          .map(card => normalizeVerifiedSpoilerCard(card, set, scanTimestamp))
          .filter(Boolean)
        : [];
      return {
        code: set.code,
        name: set.name,
        type: set.type || 'unknown',
        releaseDate: set.releaseDate,
        sourceUrl,
        metadataSourceUrl: SET_LIST_URL,
        scanTimestamp,
        commanderDeckCount: state.total,
        completeDeckCount: state.complete,
        pendingDeckCount: state.pending,
        status: state.pending === 0 && state.complete > 0 ? 'complete' : 'pending',
        spoilerCount: spoilerCards.length,
        spoilerCards,
      };
    })
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name));

  const completeCount = decks.filter(deck => deck.status === 'complete').length;
  return {
    schemaVersion: 1,
    source: 'MTGJSON',
    sourceBuildDate: deckList?.meta?.date || setList?.meta?.date || null,
    sourceVersion: deckList?.meta?.version || setList?.meta?.version || null,
    sourceUrls: { deckList: DECK_LIST_URL, setList: SET_LIST_URL },
    scanTimestamp,
    statistics: {
      upstreamCommanderDecks: metadataByFile.size,
      existingLocalDecks: existingDecks.length,
      newlyDiscoveredCommanderDecks: decks.length,
      completeDecks: completeCount,
      pendingDecks: decks.length - completeCount,
      recentAndUpcomingSets: setReleases.length,
    },
    decks: decks.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || '') || a.name.localeCompare(b.name)),
    setReleases,
  };
}
