import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import evidence from '@/data/verifiedHistoricalEvidence.json';
import { VerifiedHistoricalEvidence } from './VerifiedHistoricalEvidence';

describe('verified historical evidence', () => {
  it('reconciles every displayed point and exact printing to dated production artifacts', () => {
    for (const dip of evidence.dips) {
      expect(dip.points.length).toBeGreaterThanOrEqual(2);
      expect(dip.points.map((point) => point.date)).toEqual(dip.points.map((point) => point.date).sort());
      const first = dip.points[0];
      const last = dip.points.at(-1)!;
      expect(dip.percentChange).toBe(Number(((last.usd / first.usd - 1) * 100).toFixed(2)));
      expect(dip.percentChange).toBeLessThan(0);
      for (const point of [...dip.points, dip.latest]) {
        const raw = readFileSync(point.artifact, 'utf8');
        expect(createHash('sha256').update(raw).digest('hex')).toBe(point.artifactSha256);
        const row = JSON.parse(raw).signals.find((signal: { id: string }) => signal.id === dip.uuid);
        expect(row.name).toBe(dip.name);
        expect(row.setCode).toBe(dip.setCode);
        expect(row.collectorNumber).toBe(dip.collectorNumber);
        expect(row.source).toBe('MTGJSON');
        expect(row.tcgplayerMarketUsd).toBe(point.usd);
        expect(row.currentUsd).toBe(point.usd);
      }
    }
  });
  it('publishes the same auditable JSON used by the page', () => {
    expect(JSON.parse(readFileSync('client/public/verified-history-evidence.json', 'utf8'))).toEqual(evidence);
  });
  it('keeps pending source reviews unresolved and separate from backtests', () => {
    expect(evidence.notionReviewCheck.records).toHaveLength(11);
    for (const review of evidence.notionReviewCheck.records) {
      expect(review.resolution).toBe('pending');
      expect(review.actualOutcome).toBe('Pending review.');
      expect(review.reviewDate > evidence.checkedAt.slice(0, 10)).toBe(true);
    }
    expect(evidence.studies).toHaveLength(2);
    expect(evidence.studies.every((study) => study.kind === 'External academic backtest')).toBe(true);
  });
  it('exposes no workspace identifiers, private account details, or credentials', () => {
    expect(JSON.stringify(evidence)).not.toMatch(/collection:\/\/|app\.notion\.com|notion\.so|@gmail\.com|api[_-]?key|Bearer |supabase/i);
  });
  it('renders real replay controls and the essential limitations', () => {
    const html = renderToStaticMarkup(<VerifiedHistoricalEvidence />);
    expect((html.match(/type="range"/g) || [])).toHaveLength(3);
    for (const expected of ['-32.15%', '-15.69%', '-4.45%', 'No verified wins yet', 'N/A', 'not a current quote', 'finish fallback', 'not documented contemporaneous public winning calls', '11% classification error', '1.06% MAPE', '/verified-history-evidence.json']) expect(html).toContain(expected);
    expect(html).not.toContain('100% accuracy');
  });
});
