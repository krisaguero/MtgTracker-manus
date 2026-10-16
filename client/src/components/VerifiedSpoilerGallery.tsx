import { ExternalLink, Eye, Sparkles } from 'lucide-react';
import type { CatalogSetRelease, VerifiedSpoilerCard } from '@/data/mtgjsonPreconCatalog';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}

function SpoilerCard({ card, scanTimestamp }: { card: VerifiedSpoilerCard; scanTimestamp: string }) {
  return (
    <article className="group overflow-hidden border-2 border-border bg-card transition-colors hover:border-primary">
      <a href={card.scryfallUrl} target="_blank" rel="noopener noreferrer" className="relative block bg-muted">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={`${card.name} Magic card image`}
            loading="lazy"
            decoding="async"
            className="aspect-[5/7] w-full object-contain bg-gradient-to-b from-muted to-background"
          />
        ) : (
          <div className="flex aspect-[5/7] items-center justify-center bg-gradient-to-br from-primary/20 via-muted to-background p-4 text-center">
            <span className="font-mono text-xs font-bold uppercase text-muted-foreground">Card image not available yet</span>
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 border-2 border-amber-500 bg-amber-500 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-black shadow">
          <Sparkles className="h-3 w-3" /> Spoiler
        </span>
      </a>
      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-bold leading-snug">{card.name}</h3>
            <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
              {card.collectorNumber ? `#${card.collectorNumber} · ` : ''}{card.rarity || 'Card'}
            </p>
          </div>
          <span className="shrink-0 border border-amber-500/60 bg-amber-500/10 px-1.5 py-1 font-mono text-[9px] font-black uppercase text-amber-700 dark:text-amber-300">Verified</span>
        </div>
        <div className="border-l-2 border-primary bg-muted/50 p-2.5 text-xs leading-relaxed">
          <p className="font-semibold">Previewed {formatDate(card.previewedAt)}</p>
          <p className="mt-0.5 text-muted-foreground">Credited to {card.previewSource}</p>
          <a href={card.previewSourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-primary hover:underline" onClick={(event) => event.stopPropagation()}>
            Open original preview <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2 font-mono text-[10px]">
          <span className="text-muted-foreground">Scryfall USD estimate</span>
          <span className="font-bold text-foreground">{card.priceUsd == null ? 'No quote yet' : `$${card.priceUsd.toFixed(2)}`}</span>
        </div>
        <p className="text-[9px] leading-relaxed text-muted-foreground">Price field checked {formatDate(scanTimestamp)}; not a sale price or recommendation.</p>
      </div>
    </article>
  );
}

export function VerifiedSpoilerGallery({ set, showEmpty = true }: { set: CatalogSetRelease; showEmpty?: boolean }) {
  if (!showEmpty && set.spoilerCards.length === 0) return null;
  const updatedAt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(set.scanTimestamp));

  return (
    <section className="overflow-hidden border-2 border-primary/40 bg-card" aria-labelledby={`spoilers-${set.code.toLowerCase()}`}>
      <header className="border-b border-primary/25 bg-gradient-to-r from-primary/10 via-amber-500/5 to-transparent p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 border border-amber-500/60 bg-amber-500/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Eye className="h-3.5 w-3.5" /> Partial release · verified previews
            </div>
            <h2 id={`spoilers-${set.code.toLowerCase()}`} className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{set.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {set.spoilerCount} previewed card{set.spoilerCount === 1 ? '' : 's'} with Scryfall preview date, source name, and original-source link. This is a partial preview—not a complete set list.
            </p>
          </div>
          <div className="shrink-0 border border-border bg-background p-3 font-mono text-xs">
            <span className="block text-[9px] font-bold uppercase text-muted-foreground">Set release</span>
            <strong className="mt-1 block">{formatDate(set.releaseDate)}</strong>
            <span className="mt-1 block text-[9px] text-muted-foreground">Scanned {updatedAt}</span>
          </div>
        </div>
      </header>
      {set.spoilerCards.length ? (
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:gap-4 sm:p-5 lg:grid-cols-4 xl:grid-cols-5">
          {set.spoilerCards.map(card => <SpoilerCard key={card.id} card={card} scanTimestamp={set.scanTimestamp} />)}
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">No card currently meets the verified-preview criteria in this scan. That does not mean no previews exist; this page simply does not label cards as spoilers without Scryfall preview attribution.</p>
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 font-mono text-[10px] uppercase">
        <span className="text-muted-foreground">Card images and preview attribution: Scryfall · prices may be absent</span>
        <a href={set.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">MTGJSON set data <ExternalLink className="h-3 w-3" /></a>
      </footer>
    </section>
  );
}
