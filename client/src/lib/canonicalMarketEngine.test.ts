import { describe, expect, it } from 'vitest';
import { canonicalMarketRows, loadCanonicalSnapshots } from './canonicalMarketEngine';

describe('canonical market engine', () => {
  it('uses the generated daily MTGJSON snapshot when it contains signals', () => {
    const snapshots = loadCanonicalSnapshots();

    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots[0]?.signalSource).toBe('MTGJSON Aggregate');
    expect(snapshots.every((snapshot) => snapshot.currentUsd > 0)).toBe(true);
  });

  it('exposes generated rows to the market-report text wall', () => {
    expect(canonicalMarketRows.length).toBeGreaterThan(0);
    expect(canonicalMarketRows[0]).toMatchObject({
      setCode: expect.any(String),
      price: expect.any(Number),
      reason: expect.stringContaining('observation'),
    });
  });
});
