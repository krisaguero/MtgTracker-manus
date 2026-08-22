import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CollectionOverview', () => {
  it('retains collection equity, historical value, and coverage-ranked recommendation sections', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/CollectionOverview.tsx'), 'utf8');

    expect(source).toContain('Real Market Equity');
    expect(source).toContain('Historical Collection Value Over Time');
    expect(source).toContain('Commander Decks Ranked by Your Collection Match');
    expect(source).toContain('coveragePercentage');
  });
});
