import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { October11MarketReportBody } from './October11MarketReport';

const pageSource = readFileSync(resolve(process.cwd(), 'client/src/pages/October11MarketReport.tsx'), 'utf8');
const archiveSource = readFileSync(resolve(process.cwd(), 'client/src/pages/MarketReportArchive.tsx'), 'utf8');

describe('October 11 historical market report', () => {
  it('keeps its October 10 data window and the October 11/15/16 reports separate', () => {
    expect(pageSource).toContain('October 11, 2026 · historical report');
    expect(pageSource).toContain('through October 10');
    expect(pageSource).toContain('not a verified 250-mover feed');
    expect(pageSource).toContain('not unique-printing counts');
    expect(pageSource).toContain('title="Top 8 cards to watch"');
    expect(pageSource).toContain('/market-report/october-05-daily-market-movers');
    expect(pageSource).toContain('/market-report/october-15-30-signal-brief');
    expect(pageSource).toContain('/market-watch#source-market-watch-heading');
    expect(archiveSource).toContain('October 11, 2026');
    expect(archiveSource).toContain('October 15, 2026');
    expect(archiveSource).toContain('October 16, 2026');
  });

  it('keeps source confidence/risk claims and public citations, but omits workflow prompt text and URLs', () => {
    const html = renderToStaticMarkup(<October11MarketReportBody />);
    expect(html).toContain('Price: ~');
    expect(html).toContain('Confidence: Developing');
    expect(html).toContain('Risk: Reprint risk');
    expect(html).toContain('href="https://www.mtgstocks.com/interests"');
    expect(html).toContain('href="https://mtgdecks.net/prices/ink-treader-nephilim"');
    expect(html).toContain('Related workflow document');
    expect(html).not.toContain('Run a quick daily search task');
    expect(html).not.toContain('5c70ce21-0645-46d5-a076-a87bd7a21503');
    expect(html).not.toContain('0af907a6-a2f4-4cf3-8c63-74c5f86b310a');
    expect(html).toContain('historical spike, not single-day move');
  });
});
