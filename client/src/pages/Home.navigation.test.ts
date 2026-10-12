import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('site navigation interactions', () => {
  it('keeps mobile menu controls accessible and dismissible', () => {
    const source = read('client/src/components/SiteNav.tsx');
    expect(source).toContain('aria-label="Toggle navigation menu"');
    expect(source).toContain('href="/"');
    expect(source).toContain('Home');
    expect(source).toContain('aria-expanded={mobileMenuOpen}');
    expect(source).toContain('aria-controls="mobile-navigation"');
    expect(source).toContain('id="mobile-navigation"');
    expect(source).toContain('className="hidden lg:flex items-center');
    expect(source).toContain('<div className="lg:hidden">');
    expect(source).toContain('<nav ref={menuRef}');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain("document.addEventListener('mousedown', handleOutsideClick)");
    expect(source).toContain('pointer-events-none max-h-0');
    expect(source).toContain('onClick={() => setMobileMenuOpen(false)}');
    expect(source).toContain('aria-label="Close navigation menu"');
    expect(source).toContain('fixed inset-0 z-40');
    expect(source).toContain('backdrop-blur-[2px]');
    expect(source).toContain('pointer-events-auto opacity-100');
    expect(source).toContain('pointer-events-none opacity-0');
  });

  it('shows the hamburger menu on every route by rendering SiteNav once at the app level', () => {
    const app = read('client/src/App.tsx');
    expect(app).toContain('<SiteNav />');
    expect(app.indexOf('<SiteNav />')).toBeLessThan(app.indexOf('<Router />'));
    expect(app.match(/<SiteNav \/>/g)).toHaveLength(1);
  });

  it('closes the menu when the route changes', () => {
    const source = read('client/src/components/SiteNav.tsx');
    expect(source).toContain('useLocation');
    expect(source).toContain('}, [location]);');
  });

  it('does not render a second navigation bar on the homepage or internal pages', () => {
    const home = read('client/src/pages/Home.tsx');
    expect(home).not.toContain('aria-label="Main navigation"');
    expect(home).not.toContain('Toggle navigation menu');
    for (const page of [
      'CommanderLibrary',
      'CommanderMarketIndex',
      'CommanderPreconLibrary',
      'MarketMoverDashboards',
      'MarketMoverReportArticle',
      'SpoilerCalendar',
    ]) {
      expect(read(`client/src/pages/${page}.tsx`)).not.toContain('InternalPageNav');
    }
  });

  it('pins page-level sticky headers below the global bar', () => {
    for (const page of ['Collection', 'DupeDecks', 'MarketReport', 'SetDetail', 'LatestMarketReport']) {
      const source = read(`client/src/pages/${page}.tsx`);
      expect(source).toContain('sticky top-[var(--site-nav-height)]');
      expect(source).not.toContain('sticky top-0');
    }
    expect(read('client/src/index.css')).toContain('--site-nav-height');
  });
});
