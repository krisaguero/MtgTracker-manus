import React, { useState, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Search, Filter, Sparkles, ExternalLink, ShieldCheck, ShoppingBag, Layers, Crown, EyeOff, Flame, TrendingUp } from 'lucide-react';
import { useSetDetail, isNewCard, ScryfallCard } from '@/hooks/useSetDetail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardImageZoom } from '@/components/CardImageZoom';
import { PreconSection } from '@/components/PreconSection';
import { Link } from 'wouter';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { SetDetailPageSkeleton } from '@/components/PageSkeletons';
import { moversForCard, moversForSet, suppliedSignalsForSet } from '@/lib/marketMoverLinks';
import { resolveCardPrice } from '@/lib/marketPriceIndex';

export default function SetDetail() {
  // App.tsx registers set pages at /:setCode, so keep this matcher aligned with every SetCard link.
  const [, params] = useRoute('/:setCode');
  const [, navigate] = useLocation();
  const setCode = params?.setCode || '';

  const { data, loading, error } = useSetDetail(setCode);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('');
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [sortMode, setSortMode] = useState<'collector' | 'name' | 'price'>('collector');
  const [viewMode, setViewMode] = useState<'main' | 'precons' | 'all'>('main');
  const [hideOwned, setHideOwned] = useState(false);

  const ownedCollection = useMemo(() => loadOwnedCollection(), []);
  const ownedNamesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of ownedCollection) {
      map.set(item.name.toLowerCase(), item.quantity);
    }
    return map;
  }, [ownedCollection]);

  // This memo must run during loading and error renders too; otherwise the first
  // successful Scryfall response changes the hook count and crashes the route.
  const resolvedSetCode = data?.setCode || setCode;
  const resolvedReleasedAt = data?.releasedAt || '2024-01-01';
  const preconCardsList = useMemo(() => {
    const matchedDecks = commanderDecklistsData.filter((d) => d.set_code.toLowerCase() === resolvedSetCode.toLowerCase());
    const list: ScryfallCard[] = [];
    const seen = new Set<string>();
    for (const deck of matchedDecks) {
      for (const entry of [...deck.commander, ...deck.cards]) {
        if (!seen.has(entry.name.toLowerCase())) {
          seen.add(entry.name.toLowerCase());
          list.push({
            id: entry.scryfall_id || `precon-${deck.name}-${entry.name}`,
            name: entry.name,
            type_line: entry.type_line || 'Card',
            rarity: 'rare',
            set: entry.set_code || resolvedSetCode,
            collector_number: entry.number || 'P',
            released_at: resolvedReleasedAt,
            layout: 'normal',
            colors: [],
            color_identity: [],
            prices: { usd: null },
          });
        }
      }
    }
    return list;
  }, [resolvedReleasedAt, resolvedSetCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-background">
          <div className="w-full px-4 py-3 sm:px-6 lg:px-8 2xl:px-12">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 font-mono text-xs uppercase">
              <ArrowLeft className="w-4 h-4" /> Back to Sets
            </Button>
          </div>
        </header>
        <main className="w-full px-4 py-8 sm:px-6 lg:px-8 2xl:px-12">
          <SetDetailPageSkeleton />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono">
        <main className="container max-w-md py-12 text-center">
          <div className="border-2 border-red-500/50 bg-red-950/20 p-6 space-y-4">
            <h2 className="text-lg font-bold">Set Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1">Unable to load cards for set code [{setCode}]. It may be an invalid code or rate-limited by Scryfall.</p>
            <Button onClick={() => navigate('/')} className="mt-4">Return Home</Button>
          </div>
        </main>
      </div>
    );
  }

  const { setCode: code, setName, releasedAt, cards, precons } = data;
  const setMarketMovers = moversForSet(code);
  const hotSetMovers = setMarketMovers.filter((mover) => mover.percentChange > 0).slice(0, 6);
  const suppliedSetSignals = suppliedSignalsForSet(code);

  const activeCards = viewMode === 'precons' ? preconCardsList : viewMode === 'all' ? [...cards, ...preconCardsList] : cards;

  const filteredCards = activeCards.filter((card: ScryfallCard) => {
    if (hideOwned && (ownedNamesMap.get(card.name.toLowerCase()) || 0) > 0) return false;
    if (filterRarity && card.rarity !== filterRarity && viewMode !== 'precons') return false;
    if (showNewOnly && !isNewCard(card) && viewMode !== 'precons') return false;
    if (searchQuery.trim() && !card.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  }).sort((a: ScryfallCard, b: ScryfallCard) => {
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    if (sortMode === 'price') {
      const priceA = resolveCardPrice(a.name, a.set)?.usd ?? (a.prices?.usd ? parseFloat(a.prices.usd) : 0);
      const priceB = resolveCardPrice(b.name, b.set)?.usd ?? (b.prices?.usd ? parseFloat(b.prices.usd) : 0);
      return priceB - priceA;
    }
    return (parseInt(a.collector_number) || 0) - (parseInt(b.collector_number) || 0);
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="w-full px-4 py-3 sm:px-6 lg:px-8 2xl:px-12 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 font-mono text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Back to Sets
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase text-muted-foreground hidden sm:inline">{code.toUpperCase()} · {releasedAt}</span>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8 sm:px-6 lg:px-8 2xl:px-12 space-y-10">
        {/* Set Header */}
        <div className="border-2 border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary">
              <span>Set Code: {code.toUpperCase()}</span>
              <span>•</span>
              <span>Released: {releasedAt || 'Recent'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">{setName}</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Browsing full card catalog ({cards.length} indexed) and associated Commander precons.
            </p>
          </div>
          <div className="font-mono text-xs border-2 border-border bg-background p-4 shrink-0 space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Main Set Cards:</span>
              <span className="font-bold">{cards.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Commander Decks:</span>
              <span className="font-bold text-primary">{precons.length}</span>
            </div>
          </div>
        </div>

        {hotSetMovers.length > 0 && (
          <section className="border-2 border-amber-500/70 bg-amber-500/5 p-4 sm:p-5" aria-labelledby="set-hot-watch-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <h2 id="set-hot-watch-heading" className="font-mono text-xs font-black uppercase tracking-[0.18em] text-amber-500">Hot market watch · {hotSetMovers.length} signal{hotSetMovers.length === 1 ? '' : 's'}</h2>
              </div>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">Snapshot-linked research, not a guarantee</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hotSetMovers.map((mover) => (
                <Link key={`${mover.setCode}-${mover.name}`} href={mover.articleHref} className="border-2 border-amber-500/60 bg-background p-3 transition-colors hover:border-amber-500">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm leading-snug">{mover.name}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] font-black text-emerald-500"><TrendingUp className="h-3 w-3" /> +{mover.percentChange.toFixed(1)}%</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{mover.reason}</p>
                  <span className="mt-3 inline-flex font-mono text-[10px] font-bold uppercase text-primary">Read mover post →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {suppliedSetSignals.length > 0 && (
          <section className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-5" aria-labelledby="supplied-market-watch-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 pb-3">
              <h2 id="supplied-market-watch-heading" className="font-mono text-xs font-black uppercase tracking-[0.18em] text-primary">Supplied market-watch notes</h2>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">User-provided matrix · {suppliedSetSignals[0].asOf}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {suppliedSetSignals.map((signal) => (
                <div key={`${signal.setCode}-${signal.cardName}`} className="border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2"><span className="font-bold text-sm">{signal.cardName}</span><span className="font-mono text-[10px] uppercase text-primary">{signal.trendType.replace('-', ' ')}</span></div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{signal.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3 font-mono text-[10px] uppercase"><Link href={signal.articleHref} className="font-bold text-primary hover:underline">Read article →</Link><a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">{signal.sourceLabel} <ExternalLink className="h-3 w-3" /></a></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* View Mode Toggle Bar */}
        <div className="border-2 border-border bg-card p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
            <Filter className="h-4 w-4 text-primary" /> View Mode:
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => setViewMode('main')}
              className={`border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'main' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'
              }`}
            >
              Main Set Cards ({cards.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('precons')}
              className={`border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'precons' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'
              }`}
            >
              Commander Precon Cards ({preconCardsList.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'
              }`}
            >
              All Cards Combined ({cards.length + preconCardsList.length})
            </button>

            <button
              type="button"
              onClick={() => setHideOwned(!hideOwned)}
              className={`border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                hideOwned ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-border bg-background text-foreground hover:border-emerald-500'
              }`}
            >
              <EyeOff className="h-4 w-4" /> {hideOwned ? 'Showing Missing Only' : 'Hide Owned Cards'}
            </button>
          </div>
        </div>

        {/* Commander Precon Products Section (shown when viewing main or all) */}
        {precons.length > 0 && viewMode !== 'precons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-border pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Associated Commander Precons ({precons.length})
              </h2>
              <span className="font-mono text-xs text-muted-foreground">Box art &amp; decklist preview</span>
            </div>
            <PreconSection precons={precons} setCode={code} />
          </div>
        )}

        {/* Card Catalog Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-border pb-4">
            <h2 className="text-2xl font-bold capitalize">
              {viewMode === 'main' ? 'Main Set Card Catalog' : viewMode === 'precons' ? 'Commander Precon Card Catalog' : 'Combined Set & Precon Catalog'} ({filteredCards.length} showing)
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter cards by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 font-mono text-xs bg-background border-2 border-border"
                />
              </div>

              {viewMode !== 'precons' && (
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className="bg-background border-2 border-border px-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
                >
                  <option value="">All Rarities</option>
                  <option value="mythic">Mythic</option>
                  <option value="rare">Rare</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="common">Common</option>
                </select>
              )}

              {viewMode !== 'precons' && (
                <button
                  type="button"
                  onClick={() => setShowNewOnly(!showNewOnly)}
                  className={`border-2 px-3 py-2 font-mono text-xs uppercase font-bold transition-colors ${
                    showNewOnly ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground'
                  }`}
                >
                  {showNewOnly ? 'Showing New Only' : 'All Cards'}
                </button>
              )}

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="bg-background border-2 border-border px-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
              >
                <option value="collector">Collector #</option>
                <option value="name">Name (A-Z)</option>
                <option value="price">Price (High-Low)</option>
              </select>
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="border-2 border-border bg-card p-12 text-center space-y-3">
              <p className="font-mono text-sm text-muted-foreground">No cards match your current filters and collection settings.</p>
              {hideOwned && (
                <p className="text-xs text-emerald-400 font-mono">You own all cards matching this filter view!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCards.map((card: ScryfallCard) => {
                const normalImg = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(card.name)}&format=image&version=normal`;
                const ownedQty = ownedNamesMap.get(card.name.toLowerCase()) || 0;
                const cardMovers = moversForCard(card.name, card.set);
                const hotMover = cardMovers.find((mover) => mover.percentChange > 0);
                return (
                  <Link
                    key={card.id || card.name}
                    href={`/card/${encodeURIComponent(card.name)}`}
                    className={`border-2 bg-card p-3 flex flex-col justify-between group transition-colors cursor-pointer relative ${hotMover ? 'border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.12)] hover:border-amber-500' : 'border-border hover:border-primary'}`}
                  >
                    <div className="mb-2 flex min-h-5 items-start justify-between gap-2">
                      {hotMover ? (
                        <span className="inline-flex items-center gap-1 border border-amber-500 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-amber-500"><Flame className="h-3 w-3" /> Hot watch · +{hotMover.percentChange.toFixed(1)}%</span>
                      ) : <span />}
                      {ownedQty > 0 && (
                        <span className="bg-emerald-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-black">
                          OWNED ({ownedQty})
                        </span>
                      )}
                    </div>
                    <div className="aspect-[5/7] w-full overflow-hidden bg-muted border border-border relative">
                      <CardImageZoom src={normalImg} alt={card.name} className="h-full w-full object-cover pointer-events-none" />
                    </div>
                    <div className="mt-3">
                      <p className="font-bold text-xs truncate group-hover:text-primary" title={card.name}>{card.name}</p>
                      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mt-1">
                        <span>#{card.collector_number || 'P'} · {card.rarity || 'rare'}</span>
                        {card.prices?.usd ? <span className="font-bold text-primary">${card.prices.usd}</span> : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
