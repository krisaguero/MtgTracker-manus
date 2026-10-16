import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('shared public daily Commander price refresh', () => {
  it('extends the existing daily workflow without adding private deck uploads', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/daily-movers-morning-refresh.yml'), 'utf8');
    expect(workflow).toContain("cron: '0 8 * * *'");
    expect(workflow).toContain('node scripts/refresh-commander-card-prices.mjs');
    expect(workflow).toContain('client/src/data/commanderCardPriceSnapshot.json');
    expect(workflow).toContain('client/src/data/commanderCardPriceMeta.json');
    expect(workflow).toContain('continue-on-error: true');
    expect(workflow).not.toMatch(/upload.*decklist|collection.*artifact/i);
  });

  it('exposes a quote date separately from the snapshot generation timestamp', () => {
    const index = readFileSync(resolve(process.cwd(), 'client/src/lib/marketPriceIndex.ts'), 'utf8');
    const cue = readFileSync(resolve(process.cwd(), 'client/src/components/MarketDataCue.tsx'), 'utf8');
    expect(index).toContain('commanderPriceSnapshotAsOf');
    expect(index).toContain('commanderPriceSnapshotRefreshedAt');
    expect(cue).toContain('last refreshed');
  });
});
