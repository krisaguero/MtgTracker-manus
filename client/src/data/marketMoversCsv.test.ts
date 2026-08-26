import { describe, expect, it } from 'vitest';
import { csvMarketMovers, csvMarketMoversAsOf } from './marketMoversCsv';

describe('CSV market movers snapshot', () => {
  it('contains the complete attached 250-card snapshot in rank order', () => {
    expect(csvMarketMovers).toHaveLength(250);
    expect(csvMarketMovers[0]).toMatchObject({
      rank: 1,
      name: 'Sonic Screwdriver (0186)',
      currentUsd: 2.63,
      percentChange: 155.3,
    });
    expect(csvMarketMovers.at(-1)?.rank).toBe(250);
    expect(csvMarketMoversAsOf).toBe('2026-08-25');
  });

  it('normalizes incomplete historical prices without dropping rows', () => {
    expect(csvMarketMovers.every((mover) => Number.isFinite(mover.currentUsd))).toBe(true);
    expect(csvMarketMovers.every((mover) => Number.isFinite(mover.previousUsd))).toBe(true);
    expect(csvMarketMovers.every((mover) => Number.isFinite(mover.changeUsd))).toBe(true);
  });

  it('assigns filter-compatible categories across the imported snapshot', () => {
    expect(csvMarketMovers.some((mover) => mover.category === 'high-spikes')).toBe(true);
    expect(csvMarketMovers.some((mover) => mover.category === 'reprint-squashes')).toBe(true);
    expect(csvMarketMovers.some((mover) => mover.category === 'standard-breakouts')).toBe(true);
  });
});
