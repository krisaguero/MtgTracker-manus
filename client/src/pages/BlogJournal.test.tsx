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
function headingId(text: string) { return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
function prose(html: string) { return html.match(/<article class="journal-prose"[\s\S]*?<\/article>/)?.[0] ?? ''; }
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
    expect(html).toContain(article.dateLabel);
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
    expect(battle.match(/<img\b/g)).toHaveLength(10);
    expect(battle.match(/>Buy Online /g)).toHaveLength(9);
    expect(brawlProposedDecks).toHaveLength(3);
  });
  it('gives each illustrated article a TOC whose anchors match every h2 id', () => {
    for (const article of articles) {
      const html = page(`/blog/${article.slug}`);
      const headings = Array.from(article.body.matchAll(/^## (.+)$/gm)).map(match => match[1]);
      expect(headings.length).toBeGreaterThan(0);
      for (const heading of headings) {
        const id = headingId(heading);
        expect(html).toContain(`href="#${id}"`);
        expect(html).toContain(`id="${id}"`);
      }
    }
  });
  it('renders remote and Battle article prose as semantic lists', () => {
    const remote = prose(page('/blog/remote-play-shuffle-tests'));
    const battle = prose(page('/blog/battle-box-october-17-recap'));
    expect(remote).toContain('<ol>');
    expect(remote).toContain('<ul>');
    expect(battle).toContain('<ul>');
    expect(battle).not.toContain('<ol>');
  });
  it('keeps the hub illustrated and article pages connected by related links', () => {
    const hub = page('/blog');
    expect(hub.match(/<img\b/g)).toHaveLength(articles.length);
    for (const article of articles) {
      const html = page(`/blog/${article.slug}`);
      expect(html).toContain('aria-label="Keep reading"');
      for (const related of articles.filter(item => item.slug !== article.slug)) {
        expect(html).toContain(`href="/blog/${related.slug}"`);
      }
    }
  });
  it('publishes the Commander’s Quarters feature with its source video and seven chaptered commanders', () => {
    const html = page('/blog/commanders-100-percent-worth-building-around');
    expect(html).toContain('https://www.youtube.com/watch?v=9Zg1zAsXsQ8');
    for (const commander of ['Sakiko, Mother of Summer', 'Meria, Scholar of Antiquity', 'Alaundo the Seer', 'Valduk, Keeper of the Flame', 'Memnarch', 'Denry Klin, Editor in Chief', 'Nikya of the Old Ways']) {
      expect(html).toContain(commander);
    }
    expect(html).toContain('transcript-adjacent');
  });
  it('showcases every commander in the simple-builds companion feature', () => {
    const html = page('/blog/simple-builds-that-dominate-your-playgroup');
    for (const commander of ['Jasmine Boreal of the Seven', 'Yargle and Multani', 'Arcades, the Strategist', 'Edric, Spymaster of Trest', 'Ovika, Enigma Goliath', 'Omnath, Locus of Mana', 'Mr. Orfeo, the Boulder', 'Ruric Thar, the Unbowed']) {
      expect(html).toContain(commander);
    }
    expect(html).toContain('0:17–0:25');
    expect(html).toContain('Source notes and affiliate disclosure');
  });
  it('publishes practical deck blueprints with tests and failure modes', () => {
    const html = page('/blog/eight-simple-commander-deck-blueprints');
    for (const phrase of ['vanilla evasion midrange', 'commander-damage Voltron', 'defender tempo and toughness', 'evasive tempo and combat-damage cards', 'noncreature spells into hasty Phyrexians', 'the mana-bank Voltron deck', 'power doubling and fling damage', 'creature-heavy punishment']) {
      expect(html).toContain(phrase);
    }
    expect(html).toContain('Opening-hand test');
    expect(html).toContain('Main weakness');
    expect(html).toContain('construction briefs');
    expect(html.match(/Budget upgrade guide/g)).toHaveLength(8);
  });
  it('keeps every Battle Box deck link in the article prose, not only the card grid', () => {
    const articleProse = prose(page('/blog/battle-box-october-17-recap'));
    for (const deck of retroBattleBoxDecks) {
      expect(articleProse).toContain(`href="/battle-box/${deck.id}"`);
    }
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
