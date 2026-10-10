import { describe, expect, it } from 'vitest';
import { manusMoverDashboards, manusMoverReport } from './marketMoverManusReport';

describe('imported Manus market mover report', () => {
  it('keeps the four signal lenses separate', () => {
    expect(manusMoverDashboards.map((dashboard) => dashboard.slug)).toEqual([
      'confirmed',
      'penny',
      'buyout-risk',
      'supply-clock',
    ]);
    expect(manusMoverDashboards.every((dashboard) => dashboard.cards.length > 0)).toBe(true);
  });

  it('preserves the defensive distinction between demand and inventory risk', () => {
    const confirmed = manusMoverDashboards.find((dashboard) => dashboard.slug === 'confirmed');
    const risk = manusMoverDashboards.find((dashboard) => dashboard.slug === 'buyout-risk');
    expect(confirmed?.cards.some((card) => card.name === 'Chrome Mox')).toBe(true);
    expect(risk?.cards.some((card) => card.name === 'Vronos, Masked Inquisitor' && card.tone === 'risk')).toBe(true);
  });

  it('records the report provenance and publication date', () => {
    expect(manusMoverReport.updated).toBe('2026-10-09');
    expect(manusMoverReport.metrics).toHaveLength(4);
    expect(manusMoverReport.dek).toContain('signal-first');
  });
});
