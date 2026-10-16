// Design philosophy: hard-edged private collection parser supporting ManaBox CSV exports with exact-printing identity and duplicate-import reporting.

export interface OwnedCard {
  name: string;
  quantity: number;
  setCode?: string;
  collectorNumber?: string;
  finish?: string;
  condition?: string;
  language?: string;
  scryfallId?: string;
  proxy?: boolean;
}

export interface CollectionImportReport {
  incomingEntries: number;
  uniqueIncomingEntries: number;
  duplicateEntries: Array<{ identity: string; name: string; incomingQuantity: number; existingQuantity: number }>;
  addedEntries: number;
  mergedQuantity: number;
  unresolvedPrintingEntries: number;
}

const STORAGE_KEY = 'mtg_tracker_manabox_collection_v2';
const LEGACY_STORAGE_KEY = 'mtg_tracker_manabox_collection_v1';

function clean(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeFinish(value?: string) {
  const normalized = clean(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (['no', 'false', 'n', 'normal', 'nonfoil', 'non-foil', 'regular'].includes(normalized)) return 'normal';
  if (['yes', 'true', 'y', 'foil'].includes(normalized)) return 'foil';
  return normalized;
}

function normalizeLanguage(value?: string) {
  const normalized = clean(value)?.toLowerCase();
  if (!normalized) return undefined;
  const aliases: Record<string, string> = { english: 'en', eng: 'en', french: 'fr', 'français': 'fr', german: 'de', deutsch: 'de', japanese: 'ja', spanish: 'es', italian: 'it', portuguese: 'pt', korean: 'ko', russian: 'ru' };
  return aliases[normalized] || normalized;
}

export function collectionIdentity(card: Pick<OwnedCard, 'name' | 'setCode' | 'collectorNumber' | 'finish' | 'language' | 'scryfallId' | 'proxy'>): string {
  const printing = card.scryfallId
    ? `scryfall:${card.scryfallId}`
    : `name:${card.name}::${card.setCode || ''}::${card.collectorNumber || ''}`;
  return [printing, card.finish || 'normal', card.language || 'en', card.proxy ? 'proxy' : 'owned']
    .map((value) => value.trim().toLowerCase())
    .join('::');
}

/** Find same-name printings for a name-only import without silently assigning one. */
export function possiblePrintingMatches(existing: OwnedCard[], incoming: OwnedCard[]): Map<string, OwnedCard[]> {
  const matches = new Map<string, OwnedCard[]>();
  for (const card of incoming) {
    if (card.setCode || card.collectorNumber) continue;
    const sameName = existing.filter((candidate) => candidate.name.trim().toLowerCase() === card.name.trim().toLowerCase());
    if (sameName.length > 0) matches.set(collectionIdentity(card), sameName);
  }
  return matches;
}

export function saveOwnedCollection(cards: OwnedCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.warn('Failed to save collection to localStorage', err);
  }
}

export function loadOwnedCollection(): OwnedCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    console.warn('Failed to load collection from localStorage', err);
  }
  return [];
}

export function clearOwnedCollection(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear collection', err);
  }
}

/** Merge an import without inflating quantities when the same export is uploaded again. */
export function mergeOwnedCollection(existing: OwnedCard[], incoming: OwnedCard[]): { cards: OwnedCard[]; report: CollectionImportReport } {
  const map = new Map<string, OwnedCard>();
  for (const card of existing) map.set(collectionIdentity(card), { ...card });
  const duplicateEntries: CollectionImportReport['duplicateEntries'] = [];
  let mergedQuantity = 0;
  let addedEntries = 0;
  for (const card of incoming) {
    const identity = collectionIdentity(card);
    const current = map.get(identity);
    if (current) {
      duplicateEntries.push({ identity, name: card.name, incomingQuantity: card.quantity, existingQuantity: current.quantity });
      // Treat an exact-printing re-import as a snapshot refresh: keep the larger quantity.
      const nextQuantity = Math.max(current.quantity, card.quantity);
      mergedQuantity += Math.max(0, nextQuantity - current.quantity);
      map.set(identity, { ...current, quantity: nextQuantity, condition: card.condition || current.condition, language: card.language || current.language, finish: card.finish || current.finish });
    } else {
      map.set(identity, { ...card });
      addedEntries += 1;
      mergedQuantity += card.quantity;
    }
  }
  return {
    cards: Array.from(map.values()),
    report: {
      incomingEntries: incoming.length,
      uniqueIncomingEntries: new Set(incoming.map(collectionIdentity)).size,
      duplicateEntries,
      addedEntries,
      mergedQuantity,
      unresolvedPrintingEntries: incoming.filter((card) => !card.setCode || !card.collectorNumber).length,
    },
  };
}

/**
 * Parses ManaBox CSV exports. Typical headers:
 * Name, Quantity, Set, Collector Number, Foil, Condition, Language, etc.
 * Also supports simple plain text list format: "1x Card Name" or "4 Card Name".
 */
export function parseManaBoxImport(content: string): OwnedCard[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const cards: OwnedCard[] = [];
  const firstLine = lines[0]!.toLowerCase();
  const isCsv = firstLine.includes('name') || firstLine.includes('quantity') || firstLine.includes('set') || firstLine.includes(',');

  if (isCsv) {
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else current += char;
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCsvLine(lines[0]!).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
    const nameIdx = indexOf('name', 'cardname');
    const qtyIdx = indexOf('quantity', 'qty', 'count');
    const setIdx = indexOf('setcode', 'editioncode', 'set');
    const collectorIdx = indexOf('collectornumber', 'cardnumber', 'number', 'collector');
    const finishIdx = indexOf('finish', 'foil', 'treatment');
    const conditionIdx = indexOf('condition', 'cardcondition');
    const languageIdx = indexOf('language', 'lang');
    const proxyIdx = indexOf('proxy', 'isproxy', 'proxycard');
    const scryfallIdIdx = indexOf('scryfallid');
    const startRow = nameIdx !== -1 || qtyIdx !== -1 ? 1 : 0;

    for (let i = startRow; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]!);
      if (cols.length === 0) continue;
      const value = (idx: number) => idx !== -1 ? clean(cols[idx]?.replace(/^['"]|['"]$/g, '')) : undefined;
      const name = value(nameIdx) || clean(cols[0]?.replace(/^['"]|['"]$/g, ''));
      if (!name) continue;
      const parsedQty = Number.parseInt(value(qtyIdx) || '1', 10);
      const proxyValue = value(proxyIdx)?.toLowerCase();
      const proxy = proxyValue ? ['true', '1', 'yes', 'y', 'proxy'].includes(proxyValue) : false;
      cards.push({ name, quantity: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1, setCode: value(setIdx), collectorNumber: value(collectorIdx), finish: normalizeFinish(value(finishIdx)), condition: value(conditionIdx), language: normalizeLanguage(value(languageIdx)), scryfallId: value(scryfallIdIdx), ...(proxy ? { proxy: true } : {}) });
    }
  } else {
    for (const line of lines) {
      const match = line.match(/^(\d+)x?\s+(.+)$/);
      if (match) cards.push({ name: match[2]!.trim(), quantity: Number.parseInt(match[1]!, 10) || 1 });
      else cards.push({ name: line, quantity: 1 });
    }
  }

  const map = new Map<string, OwnedCard>();
  for (const card of cards) {
    const key = collectionIdentity(card);
    const existing = map.get(key);
    if (existing) existing.quantity += card.quantity;
    else map.set(key, { ...card });
  }
  return Array.from(map.values());
}
