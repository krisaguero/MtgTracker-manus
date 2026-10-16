import { describe, expect, it } from 'vitest';
import type { ResolvedCardPrice } from './marketPriceIndex';
import {
  resolveSetPrintingPrice,
  summarizeSetPricing,
} from './setCatalogPricing';

function price(
  match: ResolvedCardPrice['match'],
  usd: number
): ResolvedCardPrice {
  return {
    usd,
    match,
    source: match === 'exact-set' ? 'Daily set snapshot' : 'Name fallback',
    updatedAt: '2026-10-15',
  };
}

describe('set catalog printing prices', () => {
  it('prefers a dated set-plus-name index match over the Scryfall field', () => {
    const resolved = resolveSetPrintingPrice(
      { name: 'Example Card', set: 'abc', prices: { usd: '3.25' } },
      () => price('exact-set', 2.5)
    );
    expect(resolved).toEqual({
      usd: 2.5,
      sourceLabel: 'Set + name index',
      updatedAt: '2026-10-15',
      source: 'Daily set snapshot',
    });
  });

  it('does not use a name-only price from another printing; it falls back to the requested printing quote', () => {
    const resolved = resolveSetPrintingPrice(
      { name: 'Example Card', set: 'abc', prices: { usd: '3.25' } },
      () => price('name-fallback', 99)
    );
    expect(resolved.usd).toBe(3.25);
    expect(resolved.sourceLabel).toBe('Scryfall printing USD');
  });

  it('leaves a printing unpriced when neither exact-set data nor its own quote exists', () => {
    const resolved = resolveSetPrintingPrice(
      { name: 'Example Card', set: 'abc' },
      () => null
    );
    expect(resolved).toEqual({
      usd: null,
      sourceLabel: 'Price unavailable',
      updatedAt: null,
      source: null,
    });
  });

  it('counts exact-index, per-printing fallback, and unavailable prices separately', () => {
    const records = [
      { name: 'Exact', set: 'a', prices: { usd: null } },
      { name: 'Fallback', set: 'b', prices: { usd: '1.5' } },
      { name: 'Missing', set: 'c', prices: { usd: null } },
    ];
    const summary = summarizeSetPricing(records, (_name, setCode) =>
      setCode === 'a'
        ? price('exact-set', 2)
        : setCode === 'b'
          ? price('name-fallback', 20)
          : null
    );
    expect(summary).toEqual({
      setNameIndexCount: 1,
      scryfallFallbackCount: 1,
      unavailableCount: 1,
    });
  });
});
