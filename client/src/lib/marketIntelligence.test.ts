import { describe, expect, it } from 'vitest';
import { getMarketSpikes } from './marketIntelligence';

describe('market intelligence feed', () => {
  it('returns indexed cards from the snapshot instead of deck-catalog-only placeholders', () => {
    const movers = getMarketSpikes();
    expect(movers.length).toBeGreaterThan(0);
    expect(movers.every((item) => item.currentUsd > 0)).toBe(true);
    expect(movers.every((item) => item.scryfallUri.startsWith('https://'))).toBe(true);
  });

  it('deduplicates same-name printings in the visible feed', () => {
    const names = getMarketSpikes().map((item) => item.cardName.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
});
