import { describe, expect, it } from 'vitest';
import type { OwnedCard } from '@/lib/manaboxParser';
import { buildDirectory, buildSetCoverage, emptyDirectoryState, exportTradeList, withPolicy } from './collectionDirectory';

const cards: OwnedCard[] = [
  { name: 'Swiftfoot Boots', quantity: 2, setCode: 'M12', collectorNumber: '213', scryfallId: 'a' },
  { name: 'Swiftfoot Boots', quantity: 3, setCode: 'C21', collectorNumber: '240', scryfallId: 'b', finish: 'foil' },
  { name: 'Plains', quantity: 10, setCode: 'DMU', collectorNumber: '277' },
];

describe('collection directory', () => {
  it('aggregates copies by name while retaining exact printing identities', () => {
    const boots = buildDirectory(cards).find(entry => entry.name === 'Swiftfoot Boots');
    expect(boots?.copies).toBe(5);
    expect(boots?.printings).toBe(2);
    expect(boots?.identities).toHaveLength(2);
  });
  it('subtracts protected and reserved copies before flagging trade extras', () => {
    const state = withPolicy(emptyDirectoryState(), 'name:swiftfoot boots', { keep: 2, reserve: 1, disposition: 'trade' });
    const boots = buildDirectory(cards, state).find(entry => entry.name === 'Swiftfoot Boots');
    expect(boots?.keep).toBe(2);
    expect(boots?.reserved).toBe(1);
    expect(boots?.availableToTrade).toBe(2);
    expect(exportTradeList(buildDirectory(cards, state))).toContain('2x Swiftfoot Boots');
  });
  it('never calls a partial import complete and treats absent cards as unknown', () => {
    const sets = buildSetCoverage(cards);
    expect(sets.find(set => set.setCode === 'M12')?.complete).toBe(false);
    expect(sets.find(set => set.setCode === 'M12')?.note).toMatch(/unknown, not unowned/);
  });
});

import { buildCasualRecipes } from './collectionDirectory';
describe('safe productive extras', () => {
  it('exports no unflagged extras and preserves imported trade choices with an explicit opt-out', () => {
    expect(exportTradeList(buildDirectory(cards))).toBe('');
    const flagged = [{ name: 'Trade card', quantity: 1, tradeQuantity: 1 }];
    expect(buildDirectory(flagged)[0].flaggedTradeQuantity).toBe(1);
    const optedOut = withPolicy(emptyDirectoryState(), 'name:trade card', { keep: 0, disposition: 'keep' });
    expect(exportTradeList(buildDirectory(flagged, optedOut))).toBe('');
  });
  it('has exactly 60 template slots and never spends protected or proxy copies', () => {
    const pool = [{ name: 'Lightning Bolt', quantity: 8 }, { name: 'Mountain', quantity: 40 }, { name: 'Shock', quantity: 99, proxy: true }];
    const state = withPolicy(emptyDirectoryState(), 'name:lightning bolt', { keep: 2, reserve: 5 });
    const recipes = buildCasualRecipes(buildDirectory(pool, state));
    for (const recipe of recipes) {
      expect(recipe.cards.reduce((sum, card) => sum + card.required, 0)).toBe(60);
      expect(recipe.cards.filter(card => !card.isLand).every(card => card.required <= 4)).toBe(true);
      expect(recipe.coveredSlots + recipe.landGap + recipe.spellGap).toBe(60);
    }
    const burn = recipes.find(recipe => recipe.theme === 'Mono-red burn')!;
    expect(burn.cards.find(card => card.name === 'Lightning Bolt')?.owned).toBe(1);
    expect(burn.cards.find(card => card.name === 'Shock')?.owned).toBe(0);
  });
  it('sanitizes fractional and infinite reserve policies', () => {
    const state = withPolicy(emptyDirectoryState(), 'name:swiftfoot boots', { keep: 2.8, reserve: Infinity });
    const boots = buildDirectory(cards, state).find(entry => entry.name === 'Swiftfoot Boots')!;
    expect(boots.keep).toBe(2); expect(boots.reserved).toBe(0);
  });
});
