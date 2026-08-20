import React, { useState, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Search, Filter, Sparkles, ExternalLink, ShieldCheck, ShoppingBag, Layers, Crown, EyeOff } from 'lucide-react';
import { useSetDetail, isNewCard, ScryfallCard } from '@/hooks/useSetDetail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardImageZoom } from '@/components/CardImageZoom';
import { PreconSection } from '@/components/PreconSection';
import { Link } from 'wouter';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { loadOwnedCollection } from '@/lib/manaboxParser';

export default function SetDetail() {
  const [, params] = useRoute('/set/:setCode');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-sm">
        <div className="text-center space-y-3">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent"></div>
          <p>Loading set catalog &amp; Commander precons from Scryfall...</p>
        </div>
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

  const preconCardsList = useMemo(() => {
    const matchedDecks = commanderDecklistsData.filter((d) => d.set_code.toLowerCase() === code.toLowerCase());
    const list: ScryfallCard[] = [];
    const seen = new Set<string>();
    for (const deck of matchedDecks) {
      for (const entry of [...deck.commander, ...deck.cards]) {
        if (!seen.has(entry.name.toLowerCase())) {
          seen.add(entry.name.toLowerCase());
          list.push({
            id: `precon-${deck.name}-${entry.name}`,
            name: entry.name,
            type_line: (entry as any).type_line || (entry as any).type || 'Card',
            rarity: 'rare',
            set: code,
            collector_number: 'P',
            released_at: releasedAt || '2024-01-01',
            layout: 'normal',
            colors: [],
            color_identity: [],
            prices: { usd: '2.50' },
          });
        }
      }
    }
    return list;
  }, [code, releasedAt]);

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
      const priceA = a.prices?.usd ? parseFloat(a.prices.usd) : 0;
      const priceB = b.prices?.usd ? parseFloat(b.prices.usd) : 0;
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
                return (
                  <Link
                    key={card.id || card.name}
                    href={`/card/${encodeURIComponent(card.name)}`}
                    className="border-2 border-border bg-card p-3 flex flex-col justify-between group hover:border-primary transition-colors cursor-pointer relative"
                  >
                    {ownedQty > 0 && (
                      <span className="absolute top-2 right-2 z-10 bg-emerald-500 text-black font-mono text-[9px] font-bold px-1.5 py-0.5">
                        OWNED ({ownedQty})
                      </span>
                    )}
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
