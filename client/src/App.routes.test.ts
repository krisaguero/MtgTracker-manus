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

  it('mounts the new player-goal and market hub routes before the dynamic set route', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    const dynamicSetIndex = source.indexOf("path={'/:setCode'}");
    for (const route of ['/deck-workshop', '/limited', '/markets']) {
      const routeIndex = source.indexOf(`path={'${route}'}`);
      expect(routeIndex).toBeGreaterThan(-1);
      expect(routeIndex).toBeLessThan(dynamicSetIndex);
    }
  });
});
