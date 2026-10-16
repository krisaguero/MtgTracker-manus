import { describe, expect, it } from 'vitest';
import {
  battleBoxPullListCsv,
  createBattleBoxPullList,
  getRetroBattleBoxStats,
  mergeBattleBoxInventorySnapshots,
  parseBattleBoxDeckList,
  retroBattleBoxDecks,
} from '@/lib/retroBattleBox';

describe('2026 retro Battle Box', () => {
  it('preserves the original eight lists, adds a ninth, and reports source proxy-count conflicts', () => {
    const stats = getRetroBattleBoxStats();
    expect(stats).toMatchObject({
      totalDecks: 9,
      totalCards: 540,
      allDecksAreSixty: true,
      proxyDistinctNames: 21,
      proxyCopies: 62,
      reportedProxyNames: 35,
      reportedProxyCopies: 40,
      proxyCountDisagrees: true,
    });
  });

  it('keeps Deck 9 quantities intact, corrects Heliod’s Pilgrim to creatures, and isolates house rules', () => {
    const deck = retroBattleBoxDecks.find((entry) => entry.id === 'mono-white-lifegain-sunbond-heroic');
    expect(deck).toBeDefined();
    expect(deck?.groups.map((group) => [group.label, group.expected])).toEqual([
      ['Creatures', 20],
      ['Auras & Spells', 17],
      ['Lands', 23],
    ]);
    expect(deck?.groups.flatMap((group) => group.cards).reduce((sum, card) => sum + card.quantity, 0)).toBe(60);

    const quantityByName = Object.fromEntries(deck!.groups.flatMap((group) => group.cards).map(({ name, quantity }) => [name, quantity]));
    expect(quantityByName).toEqual({
      Soulmender: 4,
      "Ajani's Pridemate": 3,
      'Wall of Essence': 2,
      'Phalanx Leader': 2,
      'Sungrace Pegasus': 1,
      'Tethmos High Priest': 1,
      'Archetype of Courage': 1,
      'Dawnbringer Charioteers': 1,
      'Evangel of Heliod': 1,
      'Paragon of New Dawns': 1,
      'Silent Sentinel': 1,
      'Soul of Theros': 1,
      "Heliod's Pilgrim": 1,
      Sunbond: 4,
      "Mortal's Ardor": 3,
      'Divine Favor': 2,
      'Oppressive Rays': 2,
      Excoriate: 2,
      'Glimpse the Sun God': 1,
      'Launch the Fleet': 1,
      'Pillar of Light': 1,
      'Solemn Offering': 1,
      Plains: 23,
    });
    expect(deck?.groups[0]?.cards.some((card) => card.name === "Heliod's Pilgrim")).toBe(true);
    expect(deck?.groups[1]?.cards.some((card) => card.name === "Heliod's Pilgrim")).toBe(false);
    expect(deck?.warnings.join(' ')).toContain('source headings say 17 creatures and 20 Auras & Spells');
    expect(deck?.warnings.join(' ')).toContain('two different Celestial Resurgence triggers');
    expect(deck).toHaveProperty('houseRule.objective', 'Celestial Resurgence');
    expect(deck).toHaveProperty('houseRule.reward', 'Unlock Soul of Theros into your hand or the Command Zone, and gain 3 life.');
    expect(JSON.stringify(deck)).not.toMatch(/100% owned|0 proxies/i);
  });

  it('surfaces the supplied five-copy Monastery Swiftspear list instead of rewriting it', () => {
    expect(getRetroBattleBoxStats().copyLimitWarnings).toEqual([
      { deck: 'Lightning Burn', card: 'Monastery Swiftspear', copies: 5 },
      { deck: 'Simic Evasive Tempo & Midrange', card: 'Peregrine Drake', copies: 5 },
    ]);
    expect(retroBattleBoxDecks.find((deck) => deck.id === 'lightning-burn')?.groups.flatMap((group) => group.cards).filter((card) => card.name === 'Monastery Swiftspear').map((card) => [card.quantity, card.proxy])).toEqual([[2, false], [3, true]]);
  });

  it('aggregates repeated requirements across all lists and compares inventory by card name only', () => {
    const list = createBattleBoxPullList(retroBattleBoxDecks, [
      { name: 'Lightning Bolt', quantity: 2, setCode: 'M11' },
      { name: 'lightning bolt', quantity: 1, setCode: '4ED' },
      { name: 'Lightning Bolt', quantity: 3, setCode: 'M11', proxy: true },
    ]);
    expect(list.find((card) => card.name === 'Lightning Bolt')).toMatchObject({ quantity: 12, owned: 3, proxyOwned: 3, shortage: 9, proxyPrintGap: 6, usedBy: expect.arrayContaining(['Lightning Burn', 'RG Eldrazi Ramp & Stompy', 'Theros Boros Soldiers']) });
    const csv = battleBoxPullListCsv(list);
    expect(csv).toContain('Lightning Bolt');
    expect(csv).toContain('Proxy print gap');
  });

  it('exports an order-only CSV with no proxy rows or proxy fields when support is disabled', () => {
    const list = createBattleBoxPullList(retroBattleBoxDecks, [
      { name: 'Lightning Bolt', quantity: 2, proxy: true },
    ]);
    const csv = battleBoxPullListCsv(list, true, false);
    expect(csv.split('\n')[0]).toBe('Card,Required across box,Real copies owned,Order gap,Matched local printings,Decks');
    expect(csv).not.toMatch(/proxy/i);
    expect(csv).toContain('Lightning Bolt');
  });

  it('deduplicates overlapping exports by exact printing or adds independent piles when selected', () => {
    const first = [
      { name: 'Lightning Bolt', quantity: 2, setCode: 'M10', collectorNumber: '146' },
      { name: 'Lightning Bolt', quantity: 1, setCode: 'M11', collectorNumber: '149' },
    ];
    const second = [{ name: 'Lightning Bolt', quantity: 3, setCode: 'M10', collectorNumber: '146' }];
    expect(mergeBattleBoxInventorySnapshots([first, second], 'deduplicate').reduce((sum, card) => sum + card.quantity, 0)).toBe(4);
    expect(mergeBattleBoxInventorySnapshots([first, second], 'add').reduce((sum, card) => sum + card.quantity, 0)).toBe(6);
  });

  it('parses local draft lists without relaxing the 60-card check', () => {
    expect(parseBattleBoxDeckList('4 Lightning Bolt\n22 Mountain\n// comment').total).toBe(26);
    expect(parseBattleBoxDeckList('4 Lightning Bolt\n56 Mountain').isSixtyCards).toBe(true);
    expect(parseBattleBoxDeckList('4 Lightning Bolt\n55 Mountain').isSixtyCards).toBe(false);
    expect(parseBattleBoxDeckList('not a card line').invalidLines).toEqual(['not a card line']);
  });
});
