import { useParams, useLocation } from 'wouter';
import { useSetDetail, ScryfallCard, isNewCard } from '@/hooks/useSetDetail';
import { PreconSection } from '@/components/PreconSection';
import { CardImageZoom } from '@/components/CardImageZoom';
import { signalsForSet } from '@/data/marketSignals';
import { AlertCircle, ArrowDownUp, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';

/**
 * MTG Set Detail Page
 * 
 * Design: Minimalist Card Collector Interface
 * - Hard edges (no rounded corners)
 * - Card grid with image display
 * - Highlight new/recent cards
 * - Commander precon section
 */
export default function SetDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const setCode = params?.setCode?.toLowerCase();
  const { data, loading, error } = useSetDetail(setCode);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'collector' | 'name' | 'price'>('collector');

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
          <div className="w-full px-4 py-2 sm:px-6 lg:px-8 2xl:px-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sets
            </Button>
          </div>
        </header>
        <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 2xl:px-12"><CatalogSkeleton kind="detail" label="Loading set details" /></main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
          <div className="w-full px-4 py-2 sm:px-6 lg:px-8 2xl:px-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sets
            </Button>
          </div>
        </header>
        <div className="container py-12">
          <div className="border border-destructive bg-destructive/10 p-6 flex gap-4">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Error Loading Set</h3>
              <p className="text-sm text-destructive/80">{error || 'Set not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  let filteredCards = (data?.uniqueCards || []).filter((card) => {
    const matchesSearch = !normalizedSearch || card.name.toLowerCase().includes(normalizedSearch) || card.type_line.toLowerCase().includes(normalizedSearch) || card.oracle_text?.toLowerCase().includes(normalizedSearch);
    const matchesRarity = !filterRarity || card.rarity === filterRarity;
    const matchesNew = !showNewOnly || isNewCard(card);
    return matchesSearch && matchesRarity && matchesNew;
  });

  filteredCards = [...filteredCards].sort((a, b) => {
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    if (sortMode === 'price') return (Number(b.prices?.usd || 0) - Number(a.prices?.usd || 0)) || a.name.localeCompare(b.name);
    return a.collector_number.localeCompare(b.collector_number, undefined, { numeric: true });
  });

  const rarities = ['common', 'uncommon', 'rare', 'mythic'];
  const signals = signalsForSet(setCode || '');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="w-full px-4 py-2 sm:px-6 lg:px-8 2xl:px-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sets
          </Button>
          <div className="border-2 border-primary/25 bg-card p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-lg font-bold text-primary-foreground">◆</div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Set archive / live index</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{data.setName}</h1><p className="mt-1 text-xs text-muted-foreground">{data.uniqueCards.length} unique cards · {data.setCode.toUpperCase()} · {data.releasedAt ? formatReleaseDate(data.releasedAt) : 'Release date pending'}</p></div></div>
              <div className="border-l-2 border-primary bg-primary/5 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground sm:max-w-[13rem]"><strong className="text-foreground">Collection status.</strong><br />Scryfall card index is live; card images and prices resolve from the current upstream record.</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="set-overview" className="w-full scroll-mt-32 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 2xl:px-12">
        <SetAnchorBar hasPrecons={data.precons.length > 0} hasSignals={signals.length > 0} />

        {/* Filters */}
        {data && data.uniqueCards && (
          <div id="set-filters" className="mb-8 scroll-mt-32 border-y border-border py-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search card names, types, or rules text" aria-label="Search cards in this set" className="h-10 w-full border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </label>
              <label className="flex h-10 items-center gap-2 border border-border bg-card px-3 text-sm"><ArrowDownUp className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Sort cards</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as 'collector' | 'name' | 'price')} className="bg-transparent font-semibold outline-none"><option value="collector">Collector order</option><option value="name">A–Z by name</option><option value="price">Highest USD price</option></select></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant={filterRarity === null ? 'default' : 'outline'} size="sm" onClick={() => setFilterRarity(null)}>All Cards ({data.uniqueCards.length})</Button>
              {rarities.map((rarity) => <Button key={rarity} variant={filterRarity === rarity ? 'default' : 'outline'} size="sm" onClick={() => setFilterRarity(rarity)}>{rarity.charAt(0).toUpperCase() + rarity.slice(1)} ({data.uniqueCards.filter((card) => card.rarity === rarity).length})</Button>)}
              <Button variant={showNewOnly ? 'default' : 'outline'} size="sm" onClick={() => setShowNewOnly(!showNewOnly)} className="gap-2"><Sparkles className="h-4 w-4" /> New Cards ({data.uniqueCards.filter(isNewCard).length})</Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Showing {filteredCards.length} of {data.uniqueCards.length} unique cards. Price sorting uses Scryfall’s USD field when available.</p>
          </div>
        )}

        {/* Precons Section */}
        {data && data.precons && data.precons.length > 0 && (
          <div id="set-precons" className="scroll-mt-32"><PreconSection precons={data.precons} setCode={data.setCode} /></div>
        )}

        {/* Market Signals & Speculation Watch */}
        {(() => {
          if (signals.length === 0) return null;
          return (
            <section id="set-market" className="my-10 scroll-mt-32 border-2 border-primary/40 bg-card p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Market Intelligence & Speculation Watch</p>
                  <h2 className="text-xl font-bold tracking-tight">Observed Momentum & External Trends</h2>
                </div>
                <span className="text-xs text-muted-foreground">Sourced from TCGplayer, EDHREC & MTGStocks as-of August 2026</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {signals.map((item) => (
                  <div key={item.cardName} className="border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{item.cardName}</span>
                      <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase ${item.trendType === 'observed-spike' ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700' : item.trendType === 'format-demand' ? 'border-blue-600/40 bg-blue-500/10 text-blue-700' : 'border-amber-600/40 bg-amber-500/10 text-amber-700'}`}>
                        {item.trendType === 'observed-spike' ? 'Observed Spike' : item.trendType === 'format-demand' ? 'Format Demand' : 'Speculation Watch'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px]">
                      <span className="text-muted-foreground">{item.sourceLabel}</span>
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">View source →</a>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">Disclaimer: Market intelligence and external speculation notes are for research and reference only; MTG singles carry market risk and are not guaranteed investments.</p>
            </section>
          );
        })()}

        {/* Cards Grid */}
        <section id="set-cards" className="scroll-mt-32">
          <h2 className="mb-6 text-2xl font-bold">All Cards</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {filteredCards && filteredCards.map(card => (
              <CardGridItem key={card.id} card={card} isNew={isNewCard(card)} />
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No cards found for this filter.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SetAnchorBar({ hasPrecons, hasSignals }: { hasPrecons: boolean; hasSignals: boolean }) {
  const linkClass = 'shrink-0 border border-border bg-card px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary hover:text-primary';
  return <nav className="sticky top-[88px] z-40 -mx-4 mb-4 overflow-x-auto border-y border-border bg-background/95 px-4 py-1 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 2xl:-mx-12 2xl:px-12" aria-label="Set page quick navigation"><div className="flex min-w-max items-center gap-1.5"><a href="#set-overview" className="shrink-0 border border-primary bg-primary px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary-foreground">Overview</a><a href="#set-filters" className={linkClass}>Filters</a>{hasPrecons && <a href="#set-precons" className={linkClass}>Precons</a>}{hasSignals && <a href="#set-market" className={linkClass}>Signals</a>}<a href="#set-cards" className={linkClass}>Cards</a><a href="/" className={`${linkClass} ml-1`}>Sets</a></div></nav>;
}

function formatReleaseDate(value: string) { return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`)); }

function CardGridItem({ card, isNew }: { card: ScryfallCard; isNew: boolean }) {
  const imageUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;

  const rarityColors: Record<string, string> = {
    common: 'border-gray-400',
    uncommon: 'border-blue-400',
    rare: 'border-yellow-400',
    mythic: 'border-red-500',
  };

  return (
    <article className={`group relative overflow-hidden border-2 bg-card transition-colors hover:border-primary ${rarityColors[card.rarity] || 'border-gray-300'} ${isNew ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      <div className="aspect-[2.5/3.5] bg-muted"><CardImageZoom src={imageUrl} alt={card.name} className="h-full w-full" /></div>
      <div className="p-3"><div className="mb-2 flex flex-wrap gap-1.5"><span className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase ${isNew ? 'border-primary/60 bg-primary/10 text-primary' : 'border-slate-500/40 bg-slate-500/10 text-slate-700'}`}>{isNew ? 'NEW' : 'REPRINT'}</span><span className="border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{card.rarity}</span></div><p className="truncate text-sm font-semibold" title={card.name}>{card.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{card.collector_number} · {card.type_line}</p>{card.prices?.usd && <p className="mt-2 text-xs font-semibold text-primary">${card.prices.usd} USD</p>}</div>
    </article>
  );
}
