import { describe, expect, it } from 'vitest';
import { getMarketSnapshotMetadata, getMarketSpikes } from './marketIntelligence';

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

  it('exposes the historical source vintage and does not claim a multi-date baseline', () => {
    const metadata = getMarketSnapshotMetadata();
    expect(metadata.source).toBe('https://api.scryfall.com');
    expect(metadata.refreshedAt).toBe('2026-08-15T23:31:56.861Z');
    expect(metadata.productCount).toBe(175);
    expect(metadata.historyObservationCount).toBe(1);
    expect(metadata.latestHistoryObservationAt).toBe(metadata.refreshedAt);
  });
});
