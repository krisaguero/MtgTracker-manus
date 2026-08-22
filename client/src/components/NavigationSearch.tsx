import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ExternalLink, Star, X, TrendingUp } from 'lucide-react';
import { MoverCard } from '@/lib/dailyMoversEngine';
import { loadCanonicalSnapshots } from '@/lib/canonicalMarketEngine';
import { loadMarketWatchlist, toggleMarketWatchlist, isMarketCardWatched } from '@/lib/marketWatchlist';

export function NavigationSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<MoverCard | null>(null);
  const [watchlist, setWatchlist] = useState(() => loadMarketWatchlist());
  const containerRef = useRef<HTMLDivElement>(null);

  const allCards = useMemo(() => {
    const snaps = loadCanonicalSnapshots();
    const byName = new Map<string, MoverCard>();
    snaps.forEach((snap) => {
      if (!byName.has(snap.name.toLowerCase())) {
        byName.set(snap.name.toLowerCase(), {
          id: snap.id,
          name: snap.name,
          setCode: snap.setCode,
          setName: snap.setCode.toUpperCase(),
          rarity: snap.rarity,
          currentUsd: snap.currentUsd,
          previousUsd: snap.previousUsd,
          changeUsd: Number((snap.currentUsd - snap.previousUsd).toFixed(2)),
          percentChange: snap.percentChange,
          recentPrices: snap.recentPrices,
          category: snap.category,
          signalSource: snap.signalSource,
          thesis: snap.thesis,
          cardKingdomUsd: snap.cardKingdomUsd,
          tcgplayerMarketUsd: snap.tcgplayerMarketUsd,
          mtgGoldfishUsd: snap.mtgGoldfishUsd,
          isCatalyst: snap.isCatalyst,
        });
      }
    });
    return Array.from(byName.values());
  }, []);

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return allCards
      .filter((card) => card.name.toLowerCase().includes(q) || card.setCode.toLowerCase().includes(q) || card.thesis.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allCards, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isWatched = selectedCard ? isMarketCardWatched(selectedCard, watchlist) : false;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search any MTG card for live stats..."
          className="w-full bg-card border-2 border-border pl-9 pr-8 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
          aria-label="Search any MTG card"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 border-2 border-border bg-card shadow-xl max-h-96 overflow-y-auto">
          <div className="p-2 border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex justify-between">
            <span>Matching Cards</span>
            <span>{searchResults.length} results</span>
          </div>
          <div className="divide-y divide-border">
            {searchResults.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedCard(card);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full text-left p-3 hover:bg-muted/60 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-8 flex-shrink-0 border border-border overflow-hidden bg-muted">
                    <img
                      src={`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(card.name.replace(/\s*\([^)]*\)/g, '').trim())}&set=${encodeURIComponent(card.setCode.toLowerCase())}&format=image&version=small`}
                      alt={card.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44"><rect fill="%231e293b" width="32" height="44"/></svg>';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate group-hover:text-primary">{card.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase">{card.setCode} · {card.rarity} · {card.signalSource}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-sm font-extrabold text-primary">${card.currentUsd.toFixed(2)}</span>
                  <span className={`block font-mono text-[10px] ${card.percentChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                    {card.percentChange >= 0 ? `+${card.percentChange}%` : `${card.percentChange}%`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Card Stats Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl border-2 border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center border border-border bg-background hover:bg-muted"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <TrendingUp className="h-4 w-4" /> Global Card Intelligence &amp; Stats
            </div>
            <h2 className="mt-2 text-2xl font-extrabold">{selectedCard.name}</h2>
            <p className="font-mono text-xs text-muted-foreground uppercase">{selectedCard.setCode} Set · Rarity: {selectedCard.rarity} · Source: {selectedCard.signalSource}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-[240px] aspect-[5/7] overflow-hidden border-2 border-border bg-muted shadow-md">
                  {selectedCard.isCatalyst && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="border-2 border-primary bg-primary text-primary-foreground px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-widest shadow">
                        Catalyst
                      </span>
                    </div>
                  )}
                  <img
                    src={`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(selectedCard.name.replace(/\s*\([^)]*\)/g, '').trim())}&set=${encodeURIComponent(selectedCard.setCode.toLowerCase())}&format=image&version=normal`}
                    alt={selectedCard.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336" viewBox="0 0 240 336"><rect fill="%231e293b" width="240" height="336"/><text x="120" y="168" font-family="monospace" font-size="14" fill="%23cbd5e1" text-anchor="middle">MTG Art</text></svg>';
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setWatchlist(toggleMarketWatchlist(selectedCard))}
                    className={`flex-1 inline-flex items-center justify-center gap-2 border-2 border-border px-3 py-2 font-mono text-xs font-bold uppercase ${isWatched ? 'bg-amber-500 text-black border-amber-600' : 'bg-background hover:bg-muted'}`}
                  >
                    <Star className="h-4 w-4" fill={isWatched ? 'currentColor' : 'none'} />
                    {isWatched ? 'Watched' : 'Watch Card'}
                  </button>
                  <a
                    href={`https://scryfall.com/search?q=${encodeURIComponent(selectedCard.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-border bg-primary px-3 py-2 font-mono text-xs font-bold uppercase text-primary-foreground hover:opacity-90"
                  >
                    Scryfall <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 border-2 border-border bg-muted/40 p-3 font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">Current USD</span>
                    <span className="text-xl font-extrabold">${selectedCard.currentUsd.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">7-Day Momentum</span>
                    <span className={`text-xl font-extrabold ${selectedCard.percentChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {selectedCard.percentChange >= 0 ? `+${selectedCard.percentChange}%` : `${selectedCard.percentChange}%`}
                    </span>
                  </div>
                </div>

                <div className="border border-border p-3 bg-card font-mono text-xs space-y-2">
                  <span className="font-bold text-muted-foreground uppercase block">Multi-Outlet Pricing</span>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">Card Kingdom</span>
                      <span className="font-bold">${selectedCard.cardKingdomUsd?.toFixed(2) ?? selectedCard.currentUsd.toFixed(2)}</span>
                    </div>
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">TCGplayer</span>
                      <span className="font-bold">${selectedCard.tcgplayerMarketUsd?.toFixed(2) ?? selectedCard.currentUsd.toFixed(2)}</span>
                    </div>
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">MTGGoldfish</span>
                      <span className="font-bold">${selectedCard.mtgGoldfishUsd?.toFixed(2) ?? selectedCard.currentUsd.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-border p-3 bg-card text-xs space-y-1">
                  <span className="font-mono font-bold text-muted-foreground uppercase block">Market Thesis</span>
                  <p className="leading-relaxed">{selectedCard.thesis}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="border-2 border-border bg-card px-5 py-2 font-mono text-xs font-bold uppercase hover:bg-muted"
              >
                Close Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
