import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { October5MarketReportBody } from './October5MarketReport';

const pageSource = readFileSync(resolve(process.cwd(), 'client/src/pages/October5MarketReport.tsx'), 'utf8');
const archiveSource = readFileSync(resolve(process.cwd(), 'client/src/pages/MarketReportArchive.tsx'), 'utf8');
const markdown = readFileSync(resolve(process.cwd(), 'client/src/data/marketBriefs/2026-10-05-daily-mtg-market-movers.md'), 'utf8');

describe('October 5 historical market report', () => {
  it('keeps the Sep 19–Oct 1 window and all ten report categories separate from later reports', () => {
    expect(pageSource).toContain('October 5, 2026 · historical report');
    expect(pageSource).toContain('September 19–October 1, 2026');
    expect(pageSource).toContain('not a current price feed');
    expect(pageSource).toContain('not unique-card counts');
    expect(pageSource).toContain('title="Top 10 cards to watch"');
    expect(pageSource).toContain('/market-report/october-11-daily-market-movers');
    expect(pageSource).toContain('/market-report/october-15-30-signal-brief');
    expect(pageSource).toContain('/market-watch#source-market-watch-heading');
    expect(archiveSource).toContain('October 5, 2026');
    expect(archiveSource).toContain('October 11, 2026');
    expect(archiveSource).toContain('October 15, 2026');
    expect(archiveSource).toContain('October 16, 2026');
    for (let i = 1; i <= 10; i += 1) expect(markdown).toMatch(new RegExp(`^## ${i}\\.`, 'm'));
  });

  it('retains source links and confidence/risk notes without the closing template copy', () => {
    const html = renderToStaticMarkup(<October5MarketReportBody />);
    expect(html).toContain('href="https://www.mtgstocks.com/interests"');
    expect(html).toContain('href="https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026"');
    expect(html).toContain('Confidence: Confirmed');
    expect(html).toContain('Risk: Reprint');
    expect(html).not.toContain('If you’d like, I can next help you turn this into a tighter daily Notion template');
    expect(html).not.toContain('your MTG Market Intelligence database once you connect it to an API');
    expect(markdown).toContain('source confidence labels below are retained as reported');
  });
});
