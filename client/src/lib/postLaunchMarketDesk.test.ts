import { describe, expect, it } from 'vitest';
import { floorStatus, percentChange, postLaunchCards } from './postLaunchMarketDesk';

describe('post-launch market desk', () => {
  it('classifies a three-point decline as still falling', () => {
    expect(floorStatus({ snapshots: [{ date: 'a', usd: 5 }, { date: 'b', usd: 4 }, { date: 'c', usd: 3 }], sellerDepth: 'broad' })).toBe('still-falling');
  });
  it('classifies a stable final observation as a possible floor', () => {
    expect(floorStatus({ snapshots: [{ date: 'a', usd: 5 }, { date: 'b', usd: 3 }, { date: 'c', usd: 3.02 }], sellerDepth: 'broad' })).toBe('possible-floor');
  });
  it('does not call a thin stable signal a confirmed floor', () => {
    expect(floorStatus({ snapshots: [{ date: 'a', usd: 5 }, { date: 'b', usd: 3 }, { date: 'c', usd: 3.02 }], sellerDepth: 'thin' })).toBe('low-liquidity-noise');
  });
  it('calculates baseline movement and ships six launch cards', () => {
    expect(percentChange(10, 7.5)).toBe(-25);
    expect(postLaunchCards).toHaveLength(6);
    expect(postLaunchCards.map(card => card.name)).toContain('Academy Ruins');
  });
});
