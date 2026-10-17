import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('application route map', () => {
  it('registers Dupe-Decks before the dynamic set-code route', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    const dupeDecksIndex = source.indexOf('path="/dupe-decks"');
    const dynamicSetIndex = source.indexOf("path={'/:setCode'}");
    expect(dupeDecksIndex).toBeGreaterThan(-1);
    expect(dynamicSetIndex).toBeGreaterThan(-1);
    expect(dupeDecksIndex).toBeLessThan(dynamicSetIndex);
  });

  it('mounts one shared navigation and resets scroll on route changes', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    expect(source).toContain('<InternalPageNav />');
    expect(source).toContain('function RouteScrollReset()');
    expect(source).toContain('window.scrollTo({ top: 0, left: 0, behavior: \'auto\' })');
    expect(source).toContain('window.history.scrollRestoration = \'manual\'');
  });

  it('loads the homepage as its own route chunk', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    expect(source).toContain("const Home = lazy(() => import('./pages/Home'))");
  });

  it('keeps the market-today route connected to the chronological brief page', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    expect(source).toContain('<Route path="/market-today" component={TodayMarketBrief} />');
    expect(readFileSync(resolve(process.cwd(), 'client/src/pages/TodayMarketBrief.tsx'), 'utf8')).toContain('getChronologicalMarketPosts');
  });

  it('serves the October 5, 11, and 15 historical reports separately from dated price-report routes', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    const genericReportRoute = source.indexOf('path="/market-report/:dateKey"');
    expect(genericReportRoute).toBeGreaterThan(-1);
    for (const route of ['/market-report/october-05-daily-market-movers', '/market-report/october-11-daily-market-movers', '/market-report/october-15-30-signal-brief']) {
      const routeIndex = source.indexOf(`path="${route}"`);
      expect(routeIndex).toBeGreaterThan(-1);
      expect(routeIndex).toBeLessThan(genericReportRoute);
    }
  });

  it('mounts the new player-goal and market hub routes before the dynamic set route', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    const dynamicSetIndex = source.indexOf("path={'/:setCode'}");
    for (const route of ['/deck-workshop', '/limited', '/markets']) {
      const routeIndex = source.indexOf(`path={'${route}'}`);
      expect(routeIndex).toBeGreaterThan(-1);
      expect(routeIndex).toBeLessThan(dynamicSetIndex);
    }
  });

  it('registers the retro Battle Box output and its separate method article', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    const dynamicSetIndex = source.indexOf("path={'/:setCode'}");
    for (const route of ['/battle-box', '/brawl-box', '/battle-box-method', '/battle-box-proxy-print']) {
      const routeIndex = source.indexOf(`path="${route}"`);
      expect(routeIndex).toBeGreaterThan(-1);
      expect(routeIndex).toBeLessThan(dynamicSetIndex);
    }
    expect(source).toContain('<SiteFooter />');
  });

  it('features the shared static Battle Box on the homepage with creator and credit rules', () => {
    const home = readFileSync(resolve(process.cwd(), 'client/src/pages/Home.tsx'), 'utf8');
    const battleBox = readFileSync(resolve(process.cwd(), 'client/src/pages/RetroBattleBox.tsx'), 'utf8');
    const navigation = readFileSync(resolve(process.cwd(), 'client/src/components/InternalPageNav.tsx'), 'utf8');
    expect(home).toContain('Featured shared build');
    expect(home).toContain('one shared build for every visitor');
    expect(home).toContain('Kris Aguero');
    expect(home).toContain('User-submitted builds may be featured or remixed only with visible author/source credit');
    expect(battleBox).toContain('same for every visitor');
    expect(battleBox).toContain('every remix keeps the original author credited');
    expect(navigation).toContain("href: '/battle-box', label: 'Battle Box'");
  });

  it('features Brawlternatives separately and lists both local how-to resources', () => {
    const home = readFileSync(resolve(process.cwd(), 'client/src/pages/Home.tsx'), 'utf8');
    const brawlPage = readFileSync(resolve(process.cwd(), 'client/src/pages/BrawlBox.tsx'), 'utf8');
    const navigation = readFileSync(resolve(process.cwd(), 'client/src/components/InternalPageNav.tsx'), 'utf8');
    expect(home).toContain('featured-brawl-box-heading');
    expect(home).toContain('Precon-themed, 60-card Commander-preview decks');
    expect(home).toContain('Dr. Madison Li leads the shelf, followed by Araumi of the Dead Tide');
    expect(brawlPage).toContain('not official Magic Brawl');
    expect(brawlPage).toContain('Brawlternatives');
    expect(navigation).toContain("href: '/brawl-box', label: 'Brawlternatives'");
    expect(navigation).toContain("href: '/battle-box-proxy-print', label: 'Battle Box proxy-print how-to'");
  });
});
