import { describe, expect, it } from 'vitest';
import { formatWorkshopDecklist, parseWorkshopDecklist, validateWorkshopDeck, workshopCollectionMatch } from './deckWorkshop';

describe('Deck Workshop', () => {
  it('round-trips commander, main, and sideboard sections', () => {
    const text = 'Commander\n1 Queen Marchesa\n\nDeck\n1 Sol Ring\n\nSideboard\n2 Duress';
    const parsed = parseWorkshopDecklist(text);
    expect(parsed.map((entry) => [entry.zone, entry.name, entry.quantity])).toEqual([
      ['commander', 'Queen Marchesa', 1], ['main', 'Sol Ring', 1], ['sideboard', 'Duress', 2],
    ]);
    expect(parseWorkshopDecklist(formatWorkshopDecklist(parsed))).toEqual(parsed);
  });

  it('matches printing-specific entries exactly and name-only entries by name', () => {
    const deck = parseWorkshopDecklist('1 Sol Ring (CMR) 351\n1 Island');
    const collection = [
      { name: 'Sol Ring', quantity: 1, setCode: 'm21', collectorNumber: '250' },
      { name: 'Island', quantity: 1, setCode: 'm21', collectorNumber: '265' },
    ];
    const result = workshopCollectionMatch(deck, collection);
    expect(result[0]?.missing).toBe(1);
    expect(result[1]?.missing).toBe(0);
  });

  it('checks Commander color identity and only marks legality for matched Scryfall cards', () => {
    const deck = { name: 'Test', format: 'commander' as const, cards: [
      { name: 'Queen Marchesa', quantity: 1, zone: 'commander' as const },
      { name: 'Island', quantity: 1, zone: 'main' as const },
    ] };
    const metadata = new Map([
      ['queen marchesa', { id: 'q', name: 'Queen Marchesa', color_identity: ['W', 'B', 'R'], legalities: { commander: 'legal' } }],
      ['island', { id: 'i', name: 'Island', color_identity: ['U'], legalities: { commander: 'legal' }, type_line: 'Basic Land — Island' }],
    ]);
    const result = validateWorkshopDeck(deck, metadata);
    expect(result.offColor).toEqual(['Island']);
    expect(result.errors.some((error) => error.includes('color identity'))).toBe(true);
  });
});
