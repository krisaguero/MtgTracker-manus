import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { October15MarketBriefBody } from './October15MarketBrief';

const pageSource = readFileSync(resolve(process.cwd(), 'client/src/pages/October15MarketBrief.tsx'), 'utf8');

describe('October 15 archived signal brief', () => {
  it('labels the research as signals rather than verified price movers and keeps October 16 separate', () => {
    const html = renderToStaticMarkup(<October15MarketBriefBody />);
    expect(pageSource).toContain('October 15, 2026 · separate research brief');
    expect(pageSource).toContain('30-signal catalyst and metagame research brief—not 30 verified price movers');
    expect(pageSource).toContain('could not independently verify a complete prior-day card-price feed');
    expect(pageSource).toContain('October 16 Notion source snapshot · separate report');
    expect(pageSource).toContain('href="/market-watch#source-market-watch-heading"');
    expect(html).toContain('Important limitation');
  });

  it('preserves individual unverified labels and exposes the original public sources as links', () => {
    const html = renderToStaticMarkup(<October15MarketBriefBody />);
    expect(html).toContain('Confirmed Competitive Signals (Price Movement Unverified)');
    expect(html).toContain('Price:</strong> Unverified.');
    expect(html).toContain('Pompous Battlemage');
    expect(html).toContain('Giant’s Boulder');
    expect(html).toContain('href="https://magic.wizards.com/en/news/mtg-arena/announcements-october-12-2026"');
    expect(html).toContain('href="https://edhrec.com/precon/doom-prevails"');
  });
});
