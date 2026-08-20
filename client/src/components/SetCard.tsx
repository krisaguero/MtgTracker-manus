// Design philosophy: hard-edged MTG editorial interface with square catalog cards, indigo wayfinding, and transparent value signals.
import { ArrowUpRight, Bookmark, ExternalLink, Layers3 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import type { PreconDeck, ScryfallSet } from '@/hooks/useScryfallSets';
import { slugify } from '@/hooks/useCommanderDeck';

interface SetCardProps {
  set: ScryfallSet;
  precons: PreconDeck[];
  knownValue?: number;
  valuedDecks?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function SetCard({ set, precons, knownValue = 0, valuedDecks = 0, isFavorite = false, onToggleFavorite }: SetCardProps) {
  const [, navigate] = useLocation();
  const formattedDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${set.released_at}T00:00:00`));
  const scryfallUrl = `https://scryfall.com/sets/${set.code.toLowerCase()}`;
  const valueCoverage = precons.length > 0 ? Math.round((valuedDecks / precons.length) * 100) : 0;

  return (
    <article className="relative border-b border-border py-6 sm:py-12">
      <div className="grid gap-4 md:grid-cols-[112px_minmax(0,1fr)] md:gap-8">
        <div className="border-l-2 border-primary/30 pl-4 md:border-l-0 md:pl-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Release</p>
          <time dateTime={set.released_at} className="mt-2 block text-lg font-bold leading-tight">{formattedDate}</time>
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">{set.code}</p>
        </div>
        <div>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <button type="button" onClick={() => navigate(`/${set.code.toLowerCase()}`)} className="group flex min-w-0 items-start gap-4 text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary/30 bg-primary/5 p-2 transition-colors group-hover:bg-primary/10 sm:h-16 sm:w-16 sm:p-3">
                {set.icon_svg_uri ? <img src={set.icon_svg_uri} alt={`${set.name} set symbol`} className="h-full w-full" loading="lazy" /> : <span className="text-2xl font-bold text-primary">◆</span>}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-primary sm:text-3xl">{set.name}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{set.card_count} cards</span><span aria-hidden="true">•</span><span className="border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{set.set_type}</span>
                </div>
              </div>
            </button>
            <div className="flex flex-wrap gap-2 xl:pt-1">
              <Button variant="default" size="sm" onClick={() => navigate(`/${set.code.toLowerCase()}`)} className="gap-2">View cards <ArrowUpRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" asChild className="gap-2"><a href={scryfallUrl} target="_blank" rel="noopener noreferrer">Scryfall <ExternalLink className="h-4 w-4" /></a></Button>
              {onToggleFavorite && (
                <button type="button" onClick={onToggleFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? `Remove ${set.name} from saved sets` : `Save ${set.name} to saved sets`} title={isFavorite ? 'Remove from saved sets' : 'Save set'} className={`inline-flex h-9 w-9 items-center justify-center border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isFavorite ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'}`}>
                  <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-3 sm:grid-cols-3">
            <Signal label="Commander products" value={precons.length ? `${precons.length}` : 'None indexed'} detail={precons.length ? 'Product cards linked below' : 'No deck products returned'} />
            <Signal label="Known value" value={knownValue > 0 ? `~$${Math.round(knownValue)}` : 'Not indexed'} detail={knownValue > 0 ? 'Approximate USD total' : 'Awaiting local price coverage'} />
            <div className="border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><span>Value coverage</span><span>{precons.length ? `${valueCoverage}%` : '—'}</span></div>
              <div className="mt-4 h-2 bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${valueCoverage}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground">{valuedDecks} of {precons.length} products priced</p>
            </div>
          </div>

          {precons.length > 0 && (
            <div className="mt-5 sm:mt-8">
              <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold"><Layers3 className="h-4 w-4 text-primary" /> Commander precons</h3>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Select a product to inspect</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {precons.map((precon) => (
                  <PreconCard key={precon.id} precon={precon} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Signal({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-3 text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function PreconCard({ precon }: { precon: PreconDeck }) {
  const colorNames: Record<string, string> = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' };
  const colorClasses: Record<string, string> = { W: 'bg-yellow-100 text-yellow-900', U: 'bg-blue-100 text-blue-900', B: 'bg-gray-800 text-white', R: 'bg-red-100 text-red-900', G: 'bg-green-100 text-green-900' };
  const cardMarkup = (
    <div>
      <div className="flex h-28 items-center justify-center bg-muted/40 p-2 sm:h-36 sm:p-3" title={precon.productImageSourceLabel || 'Commander product artwork'}>
        {precon.productImageUrl || precon.image_uris?.normal ? (
          <img 
            src={precon.productImageUrl || precon.image_uris?.normal} 
            alt={`${precon.name} boxed Commander product`} 
            className="h-full w-full object-contain" 
            loading="lazy" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%231e293b" width="200" height="200"/><text x="100" y="95" font-family="monospace" font-size="12" fill="%23cbd5e1" text-anchor="middle">${encodeURIComponent(precon.name)}</text><text x="100" y="115" font-family="monospace" font-size="10" fill="%2394a3b8" text-anchor="middle">Commander Deck</text></svg>`;
            }}
          />
        ) : (
          <span className="px-4 text-center text-sm text-muted-foreground">{precon.name}</span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="line-clamp-2 font-semibold">{precon.name}</h4>
          {precon.approxValue ? <span className="shrink-0 border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">~${precon.approxValue}</span> : null}
        </div>
        {precon.colors && precon.colors.length > 0 && (
          <div className="mt-2 flex gap-1">
            {precon.colors.map((color) => (
              <span key={color} title={colorNames[color] || color} className={`flex h-5 w-5 items-center justify-center text-[9px] font-bold ${colorClasses[color] || 'bg-gray-200 text-gray-900'}`}>
                {color}
              </span>
            ))}
          </div>
        )}
        {precon.synopsis && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{precon.synopsis}</p>}
        <p className="mt-3 text-xs text-muted-foreground">{precon.card_count || 100} cards · {precon.hasDecklist ? 'Full decklist available' : 'Product view'}</p>
      </div>
      <div className="border-t border-border bg-primary/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary sm:px-4 sm:py-3 sm:text-xs">
        {precon.hasDecklist ? 'Open decklist →' : 'Browse product catalog →'}
      </div>
    </div>
  );

  if (precon.hasDecklist) {
    return (
      <Link href={`/deck/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`} className="group block overflow-hidden border-2 border-border transition-colors hover:border-primary">
        {cardMarkup}
      </Link>
    );
  }

  return (
    <Link href={`/precon/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`} className="group block overflow-hidden border-2 border-border transition-colors hover:border-primary">
      {cardMarkup}
    </Link>
  );
}
