import React, { useState } from 'react';
import { ExternalLink, Star, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { MoverCard } from '@/lib/dailyMoversEngine';
import { isMarketCardWatched, type MarketWatchlistEntry } from '@/lib/marketWatchlist';
import { marketMoverArticleHref } from '@/lib/marketMoverHref';
import { Link } from 'wouter';

interface MarketCardItemProps {
  mover: MoverCard;
  watchlist: MarketWatchlistEntry[];
  onSelect: (mover: MoverCard) => void;
  onToggleWatchlist: (mover: MoverCard) => void;
}

export function MarketCardItem({ mover, watchlist, onSelect, onToggleWatchlist }: MarketCardItemProps) {
  const cleanName = mover.name.replace(/\s*\([^)]*\)/g, '').trim();
  const scryfallImageUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}&set=${encodeURIComponent(mover.setCode.toLowerCase())}&format=image&version=normal`;
  const fallbackScryfallImageUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}&format=image&version=normal`;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageSrc, setImageSrc] = useState(scryfallImageUrl);

  const isPositive = mover.percentChange > 0;
  const isNegative = mover.percentChange < 0;
  const changeTone = isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-destructive' : 'text-muted-foreground';
  const isWatched = isMarketCardWatched(mover, watchlist);

  return (
    <div 
      onClick={() => onSelect(mover)}
      className="group/card flex cursor-pointer flex-col border border-border bg-card p-4 transition-colors hover:border-primary sm:p-5"
    >
      {/* Category & Catalyst / Watchlist Badge Header - Completely Outside Image */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary truncate">
          {mover.signalSource}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {mover.isCatalyst && (
            <span className="border border-primary bg-primary text-primary-foreground px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-widest shadow-xs">
              Catalyst
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(mover);
            }}
            aria-pressed={isWatched}
            aria-label={`${isWatched ? 'Remove' : 'Add'} ${mover.name} ${isWatched ? 'from' : 'to'} watchlist`}
            title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`inline-flex h-7 w-7 items-center justify-center border transition-colors ${
              isWatched ? 'border-amber-500 bg-amber-500 text-black font-bold' : 'border-border bg-background text-foreground hover:border-amber-500 hover:text-amber-600'
            }`}
          >
            <Star className="h-3.5 w-3.5" fill={isWatched ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Hero Card Image Display - Clean, Non-Overlaid, with Border & Subtle Hover Zoom */}
      <div className="relative mx-auto w-full max-w-[240px] aspect-[5/7] overflow-hidden border-2 border-border bg-[#171a24] shadow-md">
        {!imageLoaded && !imageFailed && (
          <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent animate-[shimmer_1.5s_infinite]" />
            <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin mb-2" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider animate-pulse">Loading Art...</span>
          </div>
        )}

        <img
          src={imageSrc}
          alt={mover.name}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            if (imageSrc !== fallbackScryfallImageUrl) {
              setImageSrc(fallbackScryfallImageUrl);
              return;
            }
            setImageFailed(true);
            setImageLoaded(true);
            (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336" viewBox="0 0 240 336"><rect fill="%231e293b" width="240" height="336"/><text x="120" y="158" font-family="monospace" font-size="14" fill="%23cbd5e1" text-anchor="middle">MTG Spike Art</text><text x="120" y="182" font-family="monospace" font-size="11" fill="%2394a3b8" text-anchor="middle">' + mover.setCode.toUpperCase() + '</text></svg>';
          }}
          referrerPolicy="no-referrer"
          className={`h-full w-full object-contain transition-transform duration-300 group-hover/card:scale-[1.02] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
      </div>

      {/* Card Details & Metadata - Arranged Below the Image */}
      <div className="mt-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground uppercase mb-1">
            <span>{mover.setCode.toUpperCase()} · {mover.rarity}</span>
            <span className={`flex items-center gap-0.5 font-bold ${changeTone}`}>
              {isPositive ? <TrendingUp className="h-3 w-3 inline" /> : isNegative ? <TrendingDown className="h-3 w-3 inline" /> : null}
              {mover.percentChange > 0 ? `+${mover.percentChange}%` : `${mover.percentChange}%`}
            </span>
          </div>
          <h3 className="font-bold text-sm leading-snug group-hover/card:text-primary transition-colors line-clamp-1" title={mover.name}>{mover.name}</h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground line-clamp-2">{mover.thesis}</p>
          {mover.pricingDate && <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">Related report date: {mover.pricingDate}</p>}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-muted-foreground uppercase block">Snapshot USD</span>
            <span className="font-mono text-base font-extrabold text-foreground">${mover.currentUsd.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] text-muted-foreground uppercase block">Source change</span>
            <span className={`font-mono text-xs font-bold ${changeTone}`}>
              {mover.changeUsd > 0 ? `+$${mover.changeUsd.toFixed(2)}` : mover.changeUsd < 0 ? `-$${Math.abs(mover.changeUsd).toFixed(2)}` : '$0.00'}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Link href={`/card/${encodeURIComponent(cleanName)}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-primary hover:underline">
            Card profile <ExternalLink className="h-3 w-3" />
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href={marketMoverArticleHref(cleanName)} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-primary hover:underline">
            <Flame className="h-3 w-3" /> Mover post
          </Link>
          {mover.pricingReportHref && <><span className="text-muted-foreground">·</span><Link href={mover.pricingReportHref} onClick={(e) => e.stopPropagation()} className="font-mono text-[10px] font-bold uppercase text-primary hover:underline">Dated report</Link></>}
        </div>
      </div>
    </div>
  );
}
