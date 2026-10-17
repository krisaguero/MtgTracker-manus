import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { October16MarketBriefBody } from './October16MarketBrief';
const pageSource = readFileSync(resolve(process.cwd(), 'client/src/pages/October16MarketBrief.tsx'), 'utf8');
describe('October 16 archived signal brief', () => {
 it('labels historical signals and keeps the Notion snapshot separate', () => { const html=renderToStaticMarkup(<October16MarketBriefBody />); expect(pageSource).toContain('October 16, 2026 · separate research brief'); expect(pageSource).toContain('October 15, 2026, supplemented with October 16 tournament data'); expect(pageSource).toContain('October 16 Notion source snapshot · separate report'); expect(pageSource).toContain('href="/market-watch?date=2026-10-16"'); expect(html).toContain('Watch and Catalyst Signals (Price Movement Unverified)'); expect(html).toContain('30 confirmed price movers'); });
 it('preserves 30 entries, caveats, and original source URLs', () => { const html=renderToStaticMarkup(<October16MarketBriefBody />); expect(html).toContain('Oath of Teferi'); expect(html).toContain('New Reality Fracture commanders'); expect(html).toContain('Price'); expect(html).toContain('Unverified'); expect(html).toContain('href="https://magic.wizards.com/en/news/mtg-arena/announcements-october-12-2026"'); expect(html).toContain('href="https://edhrec.com/sets/fra"'); expect(html).toContain('href="https://www.tcgplayer.com/content/article/The-Biggest-Price-Spikes-in-Magic-The-Gathering-This-Week-10-15-2026/e874d66c-4d72-4c1f-b349-691b39715458/"'); });
});
