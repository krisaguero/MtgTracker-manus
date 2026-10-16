export type WorkshopFormat = 'commander' | 'standard' | 'pioneer' | 'modern' | 'legacy' | 'vintage' | 'pauper' | 'casual-60';
export type WorkshopZone = 'commander' | 'main' | 'sideboard';
export interface WorkshopCardEntry { name: string; quantity: number; zone: WorkshopZone; setCode?: string; collectorNumber?: string }
export interface WorkshopCardMetadata { id: string; name: string; type_line?: string; color_identity?: string[]; legalities?: Record<string, string>; prices?: { usd?: string | null }; oracle_text?: string }
export interface WorkshopDeck { name: string; format: WorkshopFormat; cards: WorkshopCardEntry[] }
export interface WorkshopReport { cardCount: number; errors: string[]; warnings: string[]; unverified: string[]; notLegal: string[]; offColor: string[] }

export const WORKSHOP_FORMATS: Array<{ id: WorkshopFormat; label: string; kind: 'constructed' | 'commander' | 'casual'; note: string }> = [
  { id: 'commander', label: 'Commander', kind: 'commander', note: 'Scryfall Commander legality + 100-card/singleton/color-identity checks' },
  { id: 'standard', label: 'Standard', kind: 'constructed', note: 'Card legality from Scryfall; check current event rules' },
  { id: 'pioneer', label: 'Pioneer', kind: 'constructed', note: 'Card legality from Scryfall; check current event rules' },
  { id: 'modern', label: 'Modern', kind: 'constructed', note: 'Card legality from Scryfall; check current event rules' },
  { id: 'legacy', label: 'Legacy', kind: 'constructed', note: 'Card legality from Scryfall; check current event rules' },
  { id: 'vintage', label: 'Vintage', kind: 'constructed', note: 'Scryfall legality and restricted status; check current event rules' },
  { id: 'pauper', label: 'Pauper', kind: 'constructed', note: 'Card legality from Scryfall; check current event rules' },
  { id: 'casual-60', label: 'Casual / themed 60-card', kind: 'casual', note: 'Deck size and collection checks only; no official format legality' },
];

function normalize(value: string) { return value.trim().toLowerCase(); }
function parseEntry(line: string, zone: WorkshopZone): WorkshopCardEntry | null {
  const match = line.match(/^(?:(\d+)\s*x?\s+)?(.+?)(?:\s+\(([A-Z0-9]{2,8})\)\s+([A-Z0-9*\-]+))?$/i);
  if (!match) return null;
  const quantity = Number.parseInt(match[1] || '1', 10);
  let name = match[2]?.trim();
  if (!name || !Number.isSafeInteger(quantity) || quantity < 1) return null;
  name = name.replace(/\s+\[[^\]]+\]$/, '').trim();
  return { name, quantity, zone, setCode: match[3]?.toLowerCase(), collectorNumber: match[4] };
}

export function parseWorkshopDecklist(text: string): WorkshopCardEntry[] {
  const byIdentity = new Map<string, WorkshopCardEntry>();
  let zone: WorkshopZone = 'main';
  for (const sourceLine of text.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;
    const section = line.replace(/[:\[\]]/g, '').trim().toLowerCase();
    if (['commander', 'commanders'].includes(section)) { zone = 'commander'; continue; }
    if (['deck', 'main', 'mainboard'].includes(section)) { zone = 'main'; continue; }
    if (['sideboard', 'side board', 'sb'].includes(section)) { zone = 'sideboard'; continue; }
    const entry = parseEntry(line, zone);
    if (!entry || /^(total|cards|commander)$/i.test(entry.name)) continue;
    const key = `${entry.zone}|${normalize(entry.name)}|${entry.setCode || ''}|${entry.collectorNumber || ''}`;
    const current = byIdentity.get(key);
    if (current) current.quantity += entry.quantity;
    else byIdentity.set(key, entry);
  }
  return Array.from(byIdentity.values());
}

export function formatWorkshopDecklist(cards: WorkshopCardEntry[]): string {
  const byZone = (zone: WorkshopZone) => cards.filter((card) => card.zone === zone).map((card) => `${card.quantity} ${card.name}${card.setCode && card.collectorNumber ? ` (${card.setCode.toUpperCase()}) ${card.collectorNumber}` : ''}`);
  const commander = byZone('commander');
  const main = byZone('main');
  const sideboard = byZone('sideboard');
  const lines: string[] = [];
  if (commander.length) lines.push('Commander', ...commander, '');
  lines.push('Deck', ...main);
  if (sideboard.length) lines.push('', 'Sideboard', ...sideboard);
  return lines.join('\n').trim();
}

export function workshopCollectionMatch(cards: WorkshopCardEntry[], collection: Array<{ name: string; quantity: number; setCode?: string; collectorNumber?: string }>) {
  return cards.map((entry) => {
    const exactPrinting = Boolean(entry.setCode && entry.collectorNumber);
    const owned = collection.filter((card) => normalize(card.name) === normalize(entry.name)
      && (!exactPrinting || (card.setCode?.toLowerCase() === entry.setCode?.toLowerCase() && card.collectorNumber?.toLowerCase() === entry.collectorNumber?.toLowerCase())))
      .reduce((total, card) => total + card.quantity, 0);
    return { ...entry, owned: Math.min(entry.quantity, owned), missing: Math.max(0, entry.quantity - owned), matchType: exactPrinting ? 'printing' as const : 'name' as const };
  });
}

export function validateWorkshopDeck(deck: WorkshopDeck, metadata: Map<string, WorkshopCardMetadata>): WorkshopReport {
  const mainAndCommander = deck.cards.filter((card) => card.zone !== 'sideboard');
  const cardCount = mainAndCommander.reduce((sum, card) => sum + card.quantity, 0);
  const errors: string[] = [];
  const warnings: string[] = [];
  const unverified: string[] = [];
  const notLegal: string[] = [];
  const offColor: string[] = [];
  const isCommander = deck.format === 'commander';
  const commanderEntries = deck.cards.filter((card) => card.zone === 'commander');
  const commanderMetadata = commanderEntries.map((entry) => metadata.get(normalize(entry.name))).filter((card): card is WorkshopCardMetadata => Boolean(card));
  const allowedIdentity = new Set(commanderMetadata.flatMap((card) => card.color_identity || []));

  if (isCommander) {
    if (commanderEntries.length === 0) warnings.push('Add a commander section to check color identity.');
    if (commanderEntries.length > 2) errors.push('Commander decks can have at most two commander cards.');
    if (cardCount !== 100) warnings.push(`Commander deck size is ${cardCount}/100; a finished deck has exactly 100 cards including commander(s).`);
    for (const entry of mainAndCommander) {
      if (entry.zone === 'sideboard') continue;
      const card = metadata.get(normalize(entry.name));
      if (!card) { unverified.push(entry.name); continue; }
      const identity = card.color_identity || [];
      if (entry.zone !== 'commander' && identity.some((color) => !allowedIdentity.has(color))) offColor.push(entry.name);
      const isBasic = /^Basic Land\b/i.test(card.type_line || '');
      const allowsDuplicates = /a deck can have any number of cards named/i.test(card.oracle_text || '');
      if (entry.zone === 'main' && entry.quantity > 1 && !isBasic && !allowsDuplicates) warnings.push(`${entry.name} has ${entry.quantity} copies; Commander is normally singleton.`);
    }
    if (offColor.length) errors.push(`${offColor.length} card(s) have color identity outside the commander(s).`);
  } else if (deck.format !== 'casual-60') {
    if (cardCount < 60) warnings.push(`Deck has ${cardCount} cards; constructed decks usually require at least 60 in the main deck.`);
    const sideboardCount = deck.cards.filter((card) => card.zone === 'sideboard').reduce((sum, card) => sum + card.quantity, 0);
    if (sideboardCount > 15) warnings.push(`Sideboard has ${sideboardCount} cards; the typical constructed sideboard limit is 15.`);
  } else {
    if (cardCount !== 60) warnings.push(`Casual deck has ${cardCount}/60 cards.`);
    const sideboardCount = deck.cards.filter((card) => card.zone === 'sideboard').reduce((sum, card) => sum + card.quantity, 0);
    if (sideboardCount > 15) warnings.push(`Sideboard has ${sideboardCount} cards; a common 60-card tabletop convention is up to 15.`);
  }

  if (deck.format !== 'casual-60') {
    for (const entry of deck.cards) {
      const card = metadata.get(normalize(entry.name));
      if (!card) { if (!unverified.includes(entry.name)) unverified.push(entry.name); continue; }
      const legality = card.legalities?.[deck.format];
      if (legality === 'banned' || legality === 'not_legal') notLegal.push(entry.name);
      if (legality === 'restricted' && entry.quantity > 1) warnings.push(`${entry.name} is restricted in ${deck.format}; verify quantity limits.`);
    }
    if (notLegal.length) errors.push(`${notLegal.length} card(s) are banned or not legal in ${deck.format}.`);
  }
  if (unverified.length) warnings.push(`${unverified.length} card(s) could not be matched to Scryfall; legality is not verified for them.`);
  return { cardCount, errors, warnings, unverified, notLegal, offColor };
}

export async function lookupWorkshopCards(entries: WorkshopCardEntry[], signal?: AbortSignal): Promise<Map<string, WorkshopCardMetadata>> {
  const identifiers = new Map<string, { name: string } | { set: string; collector_number: string }>();
  for (const entry of entries) {
    const key = entry.setCode && entry.collectorNumber
      ? `${entry.setCode.toLowerCase()}:${entry.collectorNumber.toLowerCase()}`
      : `name:${normalize(entry.name)}`;
    if (entry.setCode && entry.collectorNumber) identifiers.set(key, { set: entry.setCode.toLowerCase(), collector_number: entry.collectorNumber });
    else identifiers.set(key, { name: entry.name });
  }
  const metadata = new Map<string, WorkshopCardMetadata>();
  const uniqueIdentifiers = Array.from(identifiers.values());
  for (let index = 0; index < uniqueIdentifiers.length; index += 75) {
    if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
    const response = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifiers: uniqueIdentifiers.slice(index, index + 75) }), signal,
    });
    if (!response.ok) throw new Error(`Scryfall card lookup returned ${response.status}`);
    const payload = await response.json() as { data?: WorkshopCardMetadata[] };
    for (const card of payload.data || []) metadata.set(normalize(card.name), card);
  }
  return metadata;
}
