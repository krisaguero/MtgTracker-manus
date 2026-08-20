import React, { useState } from 'react';
import { ExternalLink, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { MoverCard } from '@/lib/dailyMoversEngine';
import { isMarketCardWatched, type MarketWatchlistEntry } from '@/lib/marketWatchlist';

interface MarketCardItemProps {
  mover: MoverCard;
  watchlist: MarketWatchlistEntry[];
  onSelect: (mover: MoverCard) => void;
  onToggleWatchlist: (mover: MoverCard) => void;
}

export function MarketCardItem({ mover, watchlist, onSelect, onToggleWatchlist }: MarketCardItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const isPositive = mover.percentChange >= 0;
  const cleanName = mover.name.replace(/\s*\([^)]*\)/g, '').trim();
  const scryfallImageUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}&set=${encodeURIComponent(mover.setCode.toLowerCase())}&format=image&version=normal`;
  const isWatched = isMarketCardWatched(mover, watchlist);

  return (
    <div 
      onClick={() => onSelect(mover)}
      className="flex flex-col border-2 border-border bg-card p-5 transition-colors hover:border-primary cursor-pointer group/card"
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
      <div className="relative mx-auto w-full max-w-[240px] aspect-[5/7] overflow-hidden border-2 border-border bg-muted shadow-md">
        {!imageLoaded && !imageFailed && (
          <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent animate-[shimmer_1.5s_infinite]" />
            <div className="h-6 w-6 border-2 border-primary border-t-transparent animate-spin mb-2" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider animate-pulse">Loading Art...</span>
          </div>
        )}

        <img
          src={scryfallImageUrl}
          alt={mover.name}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            setImageFailed(true);
            setImageLoaded(true);
            (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336" viewBox="0 0 240 336"><rect fill="%231e293b" width="240" height="336"/><text x="120" y="158" font-family="monospace" font-size="14" fill="%23cbd5e1" text-anchor="middle">MTG Spike Art</text><text x="120" y="182" font-family="monospace" font-size="11" fill="%2394a3b8" text-anchor="middle">' + mover.setCode.toUpperCase() + '</text></svg>';
          }}
          className={`h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
        />
      </div>

      {/* Card Details & Metadata - Arranged Below the Image */}
      <div className="mt-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground uppercase mb-1">
            <span>{mover.setCode.toUpperCase()} · {mover.rarity}</span>
            <span className={`font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
              {isPositive ? `+${mover.percentChange}%` : `${mover.percentChange}%`}
            </span>
          </div>
          <h3 className="font-bold text-sm leading-snug group-hover/card:text-primary transition-colors line-clamp-1" title={mover.name}>{mover.name}</h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground line-clamp-2">{mover.thesis}</p>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-muted-foreground uppercase block">Current USD</span>
            <span className="font-mono text-base font-extrabold text-primary">${mover.currentUsd.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] text-muted-foreground uppercase block">Change</span>
            <span className={`font-mono text-xs font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              {isPositive ? `+$${mover.changeUsd.toFixed(2)}` : `-$${Math.abs(mover.changeUsd).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
