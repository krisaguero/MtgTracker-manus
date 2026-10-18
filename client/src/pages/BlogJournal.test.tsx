import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router, Route } from 'wouter';
import { describe, expect, it } from 'vitest';
import BlogJournal from './BlogJournal';
import articles from '@/data/journalArticles.json';
import marketReports from '@/data/marketJournalReports.json';
import { brawlDecks, brawlProposedDecks } from '@/lib/brawlDecks';
import { retroBattleBoxDecks } from '@/lib/retroBattleBox';
import { BuyOnlinePanel } from '@/components/BuyOnlinePanel';

function page(path: string) { return renderToStaticMarkup(<Router ssrPath={path}><Route path="/blog/:slug?" component={BlogJournal} /></Router>); }
describe('published journal', () => {
  it('separates text posts from charts and preserves every verified posted report date', () => {
    const html = page('/blog');
    expect(html).toContain('Published article / journal');
    expect(html).toContain('October 18, 2026 · Published');
    expect(html).not.toContain('Local review draft');
    expect(html).not.toContain('not published');
    expect(html).toContain('Chronological daily Market Watch articles');
    expect(html).toContain('Separate chart dashboards');
    for (const date of ['2026-09-14','2026-10-05','2026-10-11','2026-10-15','2026-10-16']) expect(html).toContain(date);
    for (const report of marketReports) expect(html).toContain(`href="/blog/market-watch-${report.date}"`);
    expect(html).not.toContain('href="/market-watch?date=');
  });
  it.each(articles)('renders complete prose and one title for $slug', article => {
    const html = page(`/blog/${article.slug}`);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('Published article / journal');
    expect(html).toContain('October 18, 2026 · Published');
    expect(html).not.toContain('Local review draft');
    expect(html).not.toContain('not published');
    expect(article.body.length).toBeGreaterThan(2000);
    expect(html).not.toMatch(/Phantasy Codex|aura0\.com|aura\.gg|room=mtg-/);
  });
  it.each(marketReports)('keeps $date as a dated narrative rather than a chart feed', report => {
    const html = page(`/blog/market-watch-${report.date}`);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain(report.date);
    expect(html).toContain('Original report source');
    expect(html).toContain('Published journal source copy');
    expect(html).toContain('historical source claims');
    expect(html).toContain('Open chart dashboards');
  });
  it('links all seven brews and nine visual Battle Box cards with buying primary', () => {
    const brawl = page('/blog/brawlternative-shelf-roundup');
    for (const d of brawlDecks) expect(brawl).toContain(`href="/brawl-box/${d.id}#buy-online"`);
    const battle = page('/blog/battle-box-october-17-recap');
    for (const d of retroBattleBoxDecks) expect(battle).toContain(`href="/battle-box/${d.id}#buy-online"`);
    expect(battle.match(/<img\b/g)).toHaveLength(9);
    expect(battle.match(/>Buy Online /g)).toHaveLength(9);
    expect(brawlProposedDecks).toHaveLength(3);
  });
  it('offers a transparent search rather than a cart or ownership inference', () => {
    const html = renderToStaticMarkup(<BuyOnlinePanel cards={[{name:"Fire // Ice, Test's",quantity:2}]} proxyHelpHref="/battle-box-proxy-print" />);
    expect(html).toContain('id="buy-online"');
    expect(html).toContain('https://www.tcgplayer.com/search/magic/product?');
    expect(html).toContain(encodeURIComponent("Fire // Ice, Test's").replaceAll("'", '&#x27;'));
    expect(html).toContain('single-card search, not a prefilled cart');
    expect(html).toContain('Optional proxy-print help');
  });
});
