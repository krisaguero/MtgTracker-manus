import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, Menu, X } from 'lucide-react';

type SiteLink = { href: string; label: string };
type SiteItem =
  | ({ type: 'link' } & SiteLink)
  | { type: 'group'; id: string; label: string; links: SiteLink[] };

const navigation: SiteItem[] = [
  { type: 'link', href: '/', label: 'Sets' },
  { type: 'link', href: '/battle-box', label: 'Battle Box' },
  { type: 'link', href: '/brawl-box', label: 'Brawlternatives' },
  {
    type: 'group',
    id: 'commander',
    label: 'Commander',
    links: [
      { href: '/commander', label: 'Commander archive' },
      { href: '/commander-market', label: 'Commander demand index' },
      { href: '/deck-workshop', label: 'Build & check a deck' },
    ],
  },
  { type: 'link', href: '/precons', label: 'Precons' },
  {
    type: 'group',
    id: 'play-collect',
    label: 'Play & collect',
    links: [
      { href: '/collection', label: 'Collection goals & imports' },
      { href: '/dupe-decks', label: 'Themed 60-card decks' },
      { href: '/limited', label: 'Sealed & draft pool' },
      { href: '/duel-battle-box', label: 'Duel battle box' },
      { href: '/battle-box-method', label: 'Battle Box build record' },
      { href: '/battle-box-proxy-print', label: 'Battle Box proxy-print how-to' },
    ],
  },
  {
    type: 'group',
    id: 'markets',
    label: 'Markets',
    links: [
      { href: '/movers', label: 'Dated market movers' },
      { href: '/market-reports', label: 'Report archive' },
      { href: '/market-watch', label: 'Market watch feed' },
      { href: '/markets', label: 'All market research & tools' },
    ],
  },
  { type: 'link', href: '/roadmap', label: 'Product roadmap' },
  { type: 'link', href: '/spoiler-calendar', label: 'Releases' },
];

function routeIsActive(path: string, href: string) {
  return path === href || (href !== '/' && path.startsWith(`${href}/`));
}

function linkClass(active: boolean, compact = false) {
  return `block border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compact ? 'w-full' : ''} ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground'}`;
}

/** Shared navigation used by every route. Legacy per-page instances are intentionally suppressed. */
export function InternalPageNav({ active: _legacyActive }: { active?: string } = {}) {
  const [location] = useLocation();
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openDesktopMenu && !openMobileMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDesktopMenu(null);
        setOpenMobileMenu(false);
        setOpenMobileGroup(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDesktopMenu(null);
        setOpenMobileMenu(false);
        setOpenMobileGroup(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openDesktopMenu, openMobileMenu]);

  // Pages migrated to the app-level shell still pass their old active prop; suppress those duplicates.
  if (_legacyActive !== undefined) return null;

  const closeMenus = () => {
    setOpenDesktopMenu(null);
    setOpenMobileMenu(false);
    setOpenMobileGroup(null);
  };

  return (
    <nav ref={navRef} className="sticky top-0 z-[60] border-b-2 border-border bg-background/95 shadow-sm backdrop-blur-md" aria-label="Main site navigation">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-8">
        <Link href="/" onClick={closeMenus} aria-label="MTG Tracker home" className="shrink-0 border-r border-border pr-3 font-mono text-xs font-black uppercase tracking-widest text-primary sm:pr-5">
          MTG <span className="text-foreground">Tracker</span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 xl:flex">
          {navigation.map((item) => {
            if (item.type === 'link') {
              const selected = routeIsActive(location, item.href);
              return <Link key={item.href} href={item.href} aria-current={selected ? 'page' : undefined} className={linkClass(selected)}>{item.label}</Link>;
            }
            const selected = item.links.some((link) => routeIsActive(location, link.href));
            const isOpen = openDesktopMenu === item.id;
            return (
              <div key={item.id} className="relative">
                <button type="button" onClick={() => setOpenDesktopMenu(isOpen ? null : item.id)} aria-expanded={isOpen} aria-haspopup="true" aria-controls={`desktop-submenu-${item.id}`} className={`${linkClass(selected)} inline-flex items-center gap-1.5`}>
                  {item.label}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <div id={`desktop-submenu-${item.id}`} className="absolute right-0 top-full z-[70] mt-2 max-h-[min(70vh,34rem)] w-72 overflow-y-auto border-2 border-border bg-background p-2 shadow-xl" role="menu" aria-label={`${item.label} pages`}>
                  {item.links.map((link) => {
                    const linkActive = routeIsActive(location, link.href);
                    return <Link key={link.href} role="menuitem" href={link.href} onClick={closeMenus} aria-current={linkActive ? 'page' : undefined} className={`block px-3 py-2 text-xs font-semibold transition-colors ${linkActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted hover:text-primary'}`}>{link.label}</Link>;
                  })}
                </div>}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => { setOpenMobileMenu((open) => !open); setOpenDesktopMenu(null); }} aria-label={openMobileMenu ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={openMobileMenu} aria-controls="mobile-site-navigation" className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-border bg-background text-foreground hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary xl:hidden">
          {openMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {openMobileMenu && <div id="mobile-site-navigation" className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-border bg-background px-3 py-3 shadow-lg xl:hidden" aria-label="Mobile site navigation">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 sm:px-2">
          {navigation.map((item) => {
            if (item.type === 'link') {
              const selected = routeIsActive(location, item.href);
              return <Link key={item.href} href={item.href} onClick={closeMenus} aria-current={selected ? 'page' : undefined} className={linkClass(selected, true)}>{item.label}</Link>;
            }
            const selected = item.links.some((link) => routeIsActive(location, link.href));
            const isOpen = openMobileGroup === item.id;
            return <section key={item.id} className="border border-border bg-card">
              <button type="button" onClick={() => setOpenMobileGroup(isOpen ? null : item.id)} aria-expanded={isOpen} aria-controls={`mobile-submenu-${item.id}`} className={`flex w-full items-center justify-between px-3 py-2.5 font-mono text-[10px] font-black uppercase tracking-wider ${selected ? 'text-primary' : 'text-foreground'}`}>
                {item.label}<ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <div id={`mobile-submenu-${item.id}`} className="grid gap-1 border-t border-border p-2 sm:grid-cols-2">
                {item.links.map((link) => {
                  const linkActive = routeIsActive(location, link.href);
                  return <Link key={link.href} href={link.href} onClick={closeMenus} aria-current={linkActive ? 'page' : undefined} className={`px-3 py-2 text-xs font-semibold transition-colors ${linkActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-primary'}`}>{link.label}</Link>;
                })}
              </div>}
            </section>;
          })}
        </div>
      </div>}
    </nav>
  );
}
