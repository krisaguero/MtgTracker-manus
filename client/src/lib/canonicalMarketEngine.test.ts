import { describe, expect, it } from 'vitest';
import { canonicalMarketRows, canonicalRowsFromSnapshot, loadCanonicalSnapshots } from './canonicalMarketEngine';

describe('canonical market engine', () => {
  it('uses only source-dated rows from the checked-in market snapshot', () => {
    const snapshots = loadCanonicalSnapshots();

    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots[0]).toMatchObject({
      signalSource: 'MTGJSON Aggregate',
      priceSource: 'MTGJSON',
      lastUpdated: expect.stringMatching(/^2026-10-/),
      sourceCount: expect.any(Number),
    });
    expect(snapshots.every((snapshot) => snapshot.currentUsd > 0 && snapshot.lastUpdated.length > 0 && snapshot.priceSource.length > 0)).toBe(true);
  });

  it('exposes dated canonical rows with their source and quote coverage', () => {
    expect(canonicalMarketRows.length).toBeGreaterThan(0);
    expect(canonicalMarketRows[0]).toMatchObject({
      setCode: expect.any(String),
      price: expect.any(Number),
      reason: expect.stringContaining('observation'),
      priceSource: 'MTGJSON',
      lastUpdated: expect.stringMatching(/^2026-10-/),
      sourceCount: expect.any(Number),
    });
  });

  it('returns no invented price rows when the source feed is empty', () => {
    expect(canonicalRowsFromSnapshot({ signalCount: 0, signals: [] })).toEqual([]);
  });
});
