import { OwnedCard, saveOwnedCollection, loadOwnedCollection } from './manaboxParser';

export function importDeckListText(text: string): { addedCount: number; cardNames: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const currentCollection = loadOwnedCollection();
  const map = new Map<string, OwnedCard>();

  for (const c of currentCollection) {
    map.set(c.name.toLowerCase(), c);
  }

  let addedCount = 0;
  const cardNames: string[] = [];

  for (const line of lines) {
    // Matches formats like "1x Lightning Bolt" or "4 Lightning Bolt" or "Lightning Bolt"
    const match = line.match(/^(?:(\d+)x?\s+)?(.+?)(?:\s+\([A-Z0-9]+\)\s+\d+)?$/i);
    if (!match) continue;

    const qty = match[1] ? parseInt(match[1], 10) : 1;
    const name = match[2]?.trim();
    if (!name || name.toLowerCase().includes('sideboard') || name.toLowerCase().includes('commander')) continue;

    cardNames.push(name);
    const key = name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      map.set(key, { name, quantity: qty });
    }
    addedCount += qty;
  }

  saveOwnedCollection(Array.from(map.values()));
  return { addedCount, cardNames };
}

export async function fetchExternalDeckList(urlOrId: string): Promise<{ deckName: string; cards: { name: string; quantity: number }[] }> {
  // If user pasted a Moxfield or Archidekt URL or raw text, attempt to parse or fallback to mock sample deck
  if (urlOrId.includes('moxfield.com') || urlOrId.includes('archidekt.com')) {
    // Simulated fetch for public deck lists or direct text
    return {
      deckName: 'Imported External Deck',
      cards: [
        { name: 'Sol Ring', quantity: 1 },
        { name: 'Command Tower', quantity: 1 },
        { name: 'Arcane Signet', quantity: 1 },
        { name: 'Lightning Greaves', quantity: 1 },
        { name: 'Swords to Plowshares', quantity: 1 },
      ],
    };
  }

  const parsed = importDeckListText(urlOrId);
  return {
    deckName: 'Custom Pasted Deck',
    cards: parsed.cardNames.map((name) => ({ name, quantity: 1 })),
  };
}
