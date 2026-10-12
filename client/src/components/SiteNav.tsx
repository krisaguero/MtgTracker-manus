import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';

// Design philosophy: one hard-edged site-wide navigation bar. Desktop shows inline links; mobile collapses into a hamburger dropdown.
// Pages that need their own sticky header should pin it at top-[var(--site-nav-height)] so it sits below this bar.

interface SiteNavLink {
  href: string;
  label: string;
  mobileLabel?: string;
  /** Tailwind classes for the link chrome (shared by desktop and mobile). */
  tone: string;
  /** Desktop-only visibility override for extra links that would crowd the bar on narrower desktops. */
  desktopClass?: string;
}

const NEUTRAL = 'border-border bg-background text-primary hover:border-primary';
const PRIMARY = 'border-primary bg-primary text-primary-foreground hover:opacity-90';
const MUTED = 'border-border bg-background text-muted-foreground hover:text-primary';
const ARCHIVE = 'border-border bg-card text-muted-foreground hover:text-primary';
const AMBER = 'border-amber-500 bg-amber-500 text-black hover:opacity-90';

const LINKS: SiteNavLink[] = [
  { href: '/', label: 'Home', tone: NEUTRAL },
  { href: '/movers', label: 'Daily Movers', tone: PRIMARY },
  { href: '/market-report', label: 'Market Report', tone: NEUTRAL },
  { href: '/dupe-decks', label: 'Dupe-Decks', mobileLabel: 'Dupe-Decks (1v1)', tone: NEUTRAL },
  { href: '/collection', label: 'Collection', tone: MUTED },
  { href: '/commander', label: 'Archive', mobileLabel: 'Commander Archive', tone: ARCHIVE },
  { href: '/precons', label: 'Precons', mobileLabel: 'Precon Library', tone: AMBER },
  { href: '/commander-market', label: 'Demand Index', tone: NEUTRAL, desktopClass: 'hidden xl:inline-block' },
  { href: '/spoiler-calendar', label: 'Spoilers', mobileLabel: 'Spoiler Calendar', tone: NEUTRAL, desktopClass: 'hidden xl:inline-block' },
];

function isActivePath(href: string, location: string) {
  if (href === '/') return location === '/';
  return location === href || location.startsWith(`${href}/`);
}

export function SiteNav() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // The bar persists across pages, so close the menu whenever the route changes (including back/forward).
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      {/* Compact Top Navigation Bar with Left Logo and Mobile Hamburger */}
      <nav ref={menuRef} className="sticky top-0 z-[60] border-b border-border bg-card/95 backdrop-blur-md" aria-label="Main navigation">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="MTG Sets Tracker home" className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <img src="/mtg-mark.svg" alt="MTG" className="h-8 w-8 transition-transform group-hover:scale-105" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider hidden sm:inline">MTG Tracker</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActivePath(link.href, location) ? 'page' : undefined}
                className={`border px-2.5 py-1.5 ${link.tone} ${link.desktopClass ?? ''} ${isActivePath(link.href, location) ? 'ring-1 ring-primary ring-offset-1 ring-offset-card' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
              data-menu-toggle="true"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-In Dropdown Menu with Transition */}
        <div
          id="mobile-navigation"
          aria-hidden={!mobileMenuOpen}
          className={`overflow-hidden transition-[max-height,opacity,padding] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] lg:hidden border-b border-border bg-card ${
            mobileMenuOpen ? 'pointer-events-auto max-h-[34rem] opacity-100 py-4' : 'pointer-events-none max-h-0 opacity-0 py-0 border-transparent'
          }`}
        >
          <div className="container flex flex-col gap-2 font-mono text-xs font-bold uppercase">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                tabIndex={mobileMenuOpen ? 0 : -1}
                aria-current={isActivePath(link.href, location) ? 'page' : undefined}
                className={`border px-3 py-2 text-center transition-colors ${link.tone} ${isActivePath(link.href, location) ? 'ring-1 ring-primary ring-offset-1 ring-offset-card' : ''}`}
              >
                {link.mobileLabel ?? link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Dimming backdrop keeps the open mobile menu in focus without hiding the page context. */}
      <button
        type="button"
        aria-label="Close navigation menu"
        aria-hidden={!mobileMenuOpen}
        tabIndex={mobileMenuOpen ? 0 : -1}
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
    </>
  );
}
