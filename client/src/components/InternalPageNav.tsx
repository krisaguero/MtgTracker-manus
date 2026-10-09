import { Link } from 'wouter';

const links = [
  { href: '/', label: 'Sets' },
  { href: '/commander', label: 'Commander archive' },
  { href: '/precons', label: 'Precons' },
  { href: '/commander-market', label: 'Demand index' },
  { href: '/movers', label: 'Market movers' },
  { href: '/collection', label: 'Collection' },
];

export function InternalPageNav({ active }: { active?: string }) {
  return <nav className="sticky top-0 z-40 border-b-2 border-border bg-background/95 backdrop-blur-sm" aria-label="Internal site navigation">
    <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-8">
      <Link href="/" className="mr-2 shrink-0 border-r border-border pr-3 font-mono text-xs font-black uppercase tracking-widest text-primary">MTG / tracker</Link>
      {links.map((link) => <Link key={link.href} href={link.href} className={`shrink-0 border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${active === link.href ? 'border-primary bg-primary text-primary-foreground' : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'}`}>{link.label}</Link>)}
    </div>
  </nav>;
}
