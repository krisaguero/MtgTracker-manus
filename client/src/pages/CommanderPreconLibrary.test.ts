import { beforeAll, describe, it, expect } from 'vitest';
import { loadMarketPriceIndex, resolveDeckMarketValue } from '../lib/marketPriceIndex';
import { commanderDecklistsData } from '../data/commanderDecklistsData';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Commander valuation matrix and pricing provenance', () => {
  beforeAll(async () => {
    await loadMarketPriceIndex();
  });

  it('resolves market value across all catalog decks with coverage percentages', () => {
    expect(commanderDecklistsData.length).toBeGreaterThan(0);
    for (const deck of commanderDecklistsData.slice(0, 5)) {
      const val = resolveDeckMarketValue(deck);
      expect(typeof val.totalUsd).toBe('number');
      expect(typeof val.coveragePercent).toBe('number');
      expect(val.coveragePercent).toBeGreaterThanOrEqual(0);
      expect(val.coveragePercent).toBeLessThanOrEqual(100);
    }
  });

  it('exposes a quick sealed-precon ownership toggle in the main list', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/CommanderPreconLibrary.tsx'), 'utf8');
    expect(source).toContain('aria-pressed={isManuallyOwned}');
    expect(source).toContain('Quick-toggle sealed precon ownership');
    expect(source).toContain('Quick-Mark Sealed Owned');
  });
});
