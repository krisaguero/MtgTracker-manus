import { describe, expect, it } from 'vitest';
import brawlBoxData from '@/data/brawlBox2026.json';

describe('personal Brawlternatives source lists', () => {
  const allGroups = (deck: (typeof brawlBoxData.decks)[number]) => [...deck.groups, ...(deck.sideboardGroups ?? [])];

  it('keeps Dr. Madison Li first and Araumi second without merging the Retro Battle Box', () => {
    expect(brawlBoxData.decks.map((deck) => deck.commander)).toEqual(['Dr. Madison Li', 'Araumi of the Dead Tide']);
    expect(brawlBoxData.decks.map((deck) => deck.id)).toEqual(['dr-madison-li', 'araumi-of-the-dead-tide']);
    expect(brawlBoxData.officialBrawlWarning).toContain('not official Magic Brawl');
  });

  it('records the source discrepancy and gives Madison a 60-card main deck plus seven optional swaps', () => {
    const [madison, araumi] = brawlBoxData.decks;
    expect(madison?.groups.flatMap((group) => group.cards).reduce((sum, card) => sum + card.quantity, 0)).toBe(60);
    expect(madison?.sideboardGroups?.flatMap((group) => group.cards).reduce((sum, card) => sum + card.quantity, 0)).toBe(7);
    expect(madison).toMatchObject({ visibleTotal: 64, sourceStatedTotal: 65, sourceStatedCuts: 5, targetSize: 60 });
    expect(madison?.sourceCountNote).toContain('visible list contains 64 card copies');
    expect(madison?.sourceCountNote).toContain('67 copies across both zones');
    const landBase = madison?.groups.find((group) => group.label === 'MANA BASE')?.cards ?? [];
    expect(landBase.reduce((sum, card) => sum + card.quantity, 0)).toBe(26);
    expect(landBase.filter((card) => ['Island', 'Plains', 'Mountain'].includes(card.name)).reduce((sum, card) => sum + card.quantity, 0)).toBe(21);
    expect(landBase.find((card) => card.name === 'Mountain')?.quantity).toBe(3);
    expect(araumi?.groups.flatMap((group) => group.cards).reduce((sum, card) => sum + card.quantity, 0)).toBe(60);
    expect(araumi).toMatchObject({ visibleTotal: 60, sourceStatedTotal: 60, targetSize: 60 });
  });

  it('records Scryfall identity/legalities and flags the supplied off-identity Ghoultree without removing it', () => {
    expect(brawlBoxData.decks.map((deck) => [deck.commanderColorIdentityLabel, deck.commanderCommanderLegal, deck.commanderBrawlLegal])).toEqual([
      ['Jeskai (WUR)', true, false],
      ['Dimir (UB)', true, false],
    ]);
    const araumi = brawlBoxData.decks[1]!;
    const ghoultree = araumi.groups.flatMap((group) => group.cards).find((card) => card.name === 'Ghoultree');
    expect(ghoultree?.colorIdentity).toEqual(['G']);
    expect(araumi.offColorCards).toEqual(['Ghoultree']);
    expect(ghoultree).toHaveProperty('commanderLegal', true);
  });

  it('has a color-identity fact for every listed card and only flags actual out-of-identity cards', () => {
    for (const deck of brawlBoxData.decks) {
      const allowed = new Set(deck.commanderColorIdentity);
      for (const group of allGroups(deck)) {
        for (const card of group.cards) {
          expect(brawlBoxData.cardIdentityAudit[card.name]).toEqual(card.colorIdentity);
          expect(card.commanderLegal).toBe(true);
          const fitsIdentity = card.colorIdentity.every((color) => allowed.has(color));
          expect(deck.offColorCards.includes(card.name)).toBe(!fitsIdentity);
        }
      }
    }
  });

  it('does not publish the source attachment’s personal ownership or proxy annotations', () => {
    const serialized = JSON.stringify(brawlBoxData);
    expect(serialized).not.toMatch(/Owned:/i);
    expect(serialized).not.toMatch(/\[PROXY\]/i);
    for (const deck of brawlBoxData.decks) {
      for (const group of allGroups(deck)) {
        for (const card of group.cards) {
          expect(card).not.toHaveProperty('owned');
          expect(card).not.toHaveProperty('proxy');
        }
      }
    }
  });
});
