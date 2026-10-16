import deckPayloadJson from './mtgjsonPreconDecks.json';
import type { RawCommanderDeck } from './commanderDecklistsData';

const discoveredDeckRecords = deckPayloadJson as RawCommanderDeck[];

function identity(deck: Pick<RawCommanderDeck, 'name' | 'set_code'>) {
  return `${deck.set_code.trim().toLowerCase()}|${deck.name.trim().toLowerCase()}`;
}

/** Merge only full deck records that passed the scanner's Commander completeness gate. */
export function mergeMtgjsonCommanderDecks(existingDecks: readonly RawCommanderDeck[]): RawCommanderDeck[] {
  const merged = [...existingDecks];
  const known = new Set(merged.map(identity));
  for (const discovered of discoveredDeckRecords) {
    const key = identity(discovered);
    if (known.has(key)) continue;
    merged.push(discovered);
    known.add(key);
  }
  return merged;
}
