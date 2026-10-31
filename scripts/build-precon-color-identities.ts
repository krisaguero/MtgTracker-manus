import { writeFileSync } from 'node:fs';
import { commanderDecklistsData } from '../client/src/data/commanderDecklistsData';

const ORDER = ['W', 'U', 'B', 'R', 'G'];
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const headers = { 'User-Agent': 'MTG-Sets-Tracker/1.0 (precon color identity refresh)', Accept: 'application/json' };

function classify(colors: string[], commanderCount: number) {
  const sorted = [...new Set(colors)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  if (commanderCount > 1) return { category: 'PARTNER', label: 'Partner / Friends', short: 'PARTNER' };
  if (sorted.length === 0) return { category: 'COLORLESS', label: 'Colorless', short: 'C' };
  if (sorted.length === 1) return { category: `MONO-${sorted[0]}`, label: `Mono-${sorted[0]}`, short: sorted[0] };
  if (sorted.length === 2) return { category: sorted.join(''), label: `${sorted.join('')} pair`, short: sorted.join('') };
  if (sorted.length === 3) return { category: `TRI-${sorted.join('')}`, label: `${sorted.join('')} tri-color`, short: sorted.join('') };
  if (sorted.length === 4) return { category: `QUAD-${sorted.join('')}`, label: `${sorted.join('')} four-color`, short: sorted.join('') };
  return { category: 'FIVE', label: 'Five-color', short: 'WUBRG' };
}

const records: Record<string, unknown> = {};
const commanders = commanderDecklistsData.flatMap((deck) => deck.commander.map((card) => ({ deck, card })));
const uniqueIds = [...new Set(commanders.map(({ card }) => card.scryfall_id).filter((id): id is string => Boolean(id)))];
const identityById = new Map<string, { colors: string[]; name: string; oracleId?: string }>();
for (let index = 0; index < uniqueIds.length; index += 1) {
  const id = uniqueIds[index];
  const response = await fetch(`https://api.scryfall.com/cards/${id}`, { headers });
  let card: { name: string; color_identity?: string[]; oracle_id?: string };
  if (response.ok) {
    card = await response.json() as { name: string; color_identity?: string[]; oracle_id?: string };
  } else {
    const source = commanders.find(({ card: commander }) => commander.scryfall_id === id)?.card;
    if (!source) throw new Error(`Scryfall lookup failed for ${id}: ${response.status}`);
    const fallback = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(source.name)}`, { headers });
    if (!fallback.ok) throw new Error(`Scryfall lookup failed for ${source.name}: ${fallback.status}`);
    card = await fallback.json() as { name: string; color_identity?: string[]; oracle_id?: string };
  }
  identityById.set(id, { colors: card.color_identity ?? [], name: card.name, oracleId: card.oracle_id });
  if (index < uniqueIds.length - 1) await wait(110);
}
for (const deck of commanderDecklistsData) {
  const identities = deck.commander.map((commander) => identityById.get(commander.scryfall_id ?? '')).filter((value): value is NonNullable<typeof value> => Boolean(value));
  const colors = [...new Set(identities.flatMap((identity) => identity.colors))];
  const classification = classify(colors, deck.commander.length);
  const identityKey = `${slugify(deck.name)}-${deck.set_code.toLowerCase()}`;
  records[identityKey] = {
    deckName: deck.name,
    setCode: deck.set_code,
    identityKey,
    commanderNames: identities.map((identity) => identity.name),
    commanderScryfallIds: deck.commander.map((commander) => commander.scryfall_id).filter(Boolean),
    colorIdentity: colors.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)),
    ...classification,
    source: 'Scryfall card.color_identity',
    fetchedAt: new Date().toISOString(),
  };
}
writeFileSync('client/src/data/preconColorIdentities.json', JSON.stringify({ schemaVersion: 1, source: 'Scryfall', generatedAt: new Date().toISOString(), records }, null, 2) + '\n');
console.log(`Wrote ${Object.keys(records).length} authoritative precon color identities from ${uniqueIds.length} unique Scryfall commander printings.`);
