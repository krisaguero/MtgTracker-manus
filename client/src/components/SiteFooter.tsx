import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-border bg-muted/20 px-4 py-4 sm:px-8" aria-label="Site footer">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong className="text-foreground">MTG Tracker</strong> · created by Kris Aguero · collection data stays browser-local by default.
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] font-black uppercase tracking-wider">
          <Link href="/battle-box" className="hover:text-primary hover:underline">Battle Box</Link>
          <Link href="/deck-brewery/reviews" className="hover:text-primary hover:underline">Deck Brewery</Link>
          <Link href="/deck-brewery/matchups" className="hover:text-primary hover:underline">Brewery Showdowns</Link>
          <Link href="/roadmap" className="inline-flex items-center gap-1 text-primary hover:underline">Roadmap <ArrowRight className="h-3 w-3" /></Link>
        </nav>
      </div>
    </footer>
  );
}
