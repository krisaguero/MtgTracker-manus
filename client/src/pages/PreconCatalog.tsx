// Design philosophy: hard-edged MTG editorial interface with full-width card discovery, visible colored status chips, and no hover layer covering card art.
import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowDownUp, ArrowLeft, ArrowUpRight, Minus, Search, Sparkles } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { CardImageZoom } from '@/components/CardImageZoom';
import { isNewCard, useSetDetail, type ScryfallCard } from '@/hooks/useSetDetail';
import priceHistory from '@/data/priceHistorySnapshot.json';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';

type ReleaseFilter = 'all' | 'new' | 'reprint';

export default function PreconCatalog() {
  const { setCode } = useParams<{ setCode: string }>();
  const { data, loading, error } = useSetDetail(setCode);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'collector' | 'name' | 'price'>('collector');
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const cards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...(data?.cards || [])]
      .filter((card) => !normalized || card.name.toLowerCase().includes(normalized) || card.type_line.toLowerCase().includes(normalized) || card.oracle_text?.toLowerCase().includes(normalized))
      .filter((card) => releaseFilter === 'all' || (releaseFilter === 'new' ? isNewCard(card) : !isNewCard(card)))
      .filter((card) => rarityFilter === 'all' || card.rarity === rarityFilter)
      .sort((a, b) => {
        if (sortMode === 'name') return a.name.localeCompare(b.name);
        if (sortMode === 'price') return (Number(b.prices?.usd || 0) - Number(a.prices?.usd || 0)) || a.name.localeCompare(b.name);
        return a.collector_number.localeCompare(b.collector_number, undefined, { numeric: true });
      });
  }, [data?.cards, query, releaseFilter, rarityFilter, sortMode]);

  const sourceCards = data?.cards || [];
  const newCount = sourceCards.filter(isNewCard).length;
  const reprintCount = sourceCards.length - newCount;
  const rarities = ['common', 'uncommon', 'rare', 'mythic'];

  if (loading) return <CatalogShell><CatalogSkeleton kind="catalog" label="Loading the complete Commander product catalog" /></CatalogShell>;
  if (error || !data) return <CatalogShell><div className="mt-10 border-2 border-destructive/50 bg-destructive/10 p-6"><h1 className="text-xl font-bold">Product catalog unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error ?? 'This Commander product could not be loaded.'}</p></div></CatalogShell>;

  return <CatalogShell>
    <header className="border-b border-border bg-card">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8 2xl:px-12">
        <Link href={setCode ? `/${setCode}` : '/'} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to set</Link>
        <div className="mt-4 border-2 border-primary/25 bg-background p-3 sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3 sm:gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-lg font-bold text-primary-foreground">◆</div><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Commander product / in-app catalog</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{data.setName}</h1><p className="mt-1 text-xs text-muted-foreground">{data.uniqueCards.length} unique names · {data.setCode.toUpperCase()} · {data.releasedAt ? formatDate(data.releasedAt) : 'Release date pending'}</p></div></div><div className="border-l-2 border-primary bg-primary/5 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground sm:max-w-[13rem]"><strong className="text-foreground">Collection status.</strong><br />Card imagery, USD fields, and release signals resolve from the live Scryfall index.</div></div></div>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Card catalog / in-app view</p><h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Browse the indexed card list.</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Status chips sit below the art so new releases and reprints remain legible without covering the shelf view.</p></div><div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><span className="border border-border bg-background px-3 py-2">{sourceCards.length} cards</span><span className="border border-border bg-background px-3 py-2">{data.uniqueCards.length} unique names</span></div></div>
      </div>
    </header>

    <main className="w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-8 2xl:px-12">
      <section className="mb-8 border-y border-border py-4" aria-labelledby="catalog-controls">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Product card controls</p><h2 id="catalog-controls" className="mt-2 text-2xl font-bold">Filter the evidence.</h2></div><p className="text-xs text-muted-foreground">Showing {cards.length} of {sourceCards.length} cards.</p></div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cards, types, or rules text" aria-label="Search Commander product cards" className="h-11 w-full border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
          <label className="flex h-11 items-center gap-2 border border-border bg-card px-3 text-sm"><ArrowDownUp className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Sort product cards</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as 'collector' | 'name' | 'price')} className="bg-transparent font-semibold outline-none"><option value="collector">Collector order</option><option value="name">A–Z by name</option><option value="price">Most valuable first</option></select></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Product card filters"><FilterChip active={releaseFilter === 'all'} onClick={() => setReleaseFilter('all')}>All cards ({sourceCards.length})</FilterChip><FilterChip active={releaseFilter === 'new'} tone="indigo" onClick={() => setReleaseFilter('new')}><Sparkles className="mr-1 inline h-3 w-3" /> New ({newCount})</FilterChip><FilterChip active={releaseFilter === 'reprint'} tone="slate" onClick={() => setReleaseFilter('reprint')}>Reprints ({reprintCount})</FilterChip><span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />{(['all', ...rarities] as string[]).map((rarity) => <FilterChip key={rarity} active={rarityFilter === rarity} tone={rarity === 'mythic' ? 'amber' : 'slate'} onClick={() => setRarityFilter(rarity)}>{rarity === 'all' ? 'All rarities' : `${rarity[0].toUpperCase()}${rarity.slice(1)}`}</FilterChip>)}</div>
        <p className="mt-3 text-xs text-muted-foreground"><Sparkles className="inline h-3 w-3 text-primary" /> New-release badges use Scryfall’s reprint field. Price arrows compare against the latest completed refresh when history is available.</p>
      </section>

      {cards.length > 0 ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">{cards.map((card, index) => <CatalogCard key={`${card.id}-${card.collector_number}`} card={card} highlightValue={sortMode === 'price' && index < 5} valueRank={sortMode === 'price' && index < 5 ? index + 1 : undefined} />)}</div> : <div className="border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">No cards match these filters.</div>}
      <div className="mt-10 border-l-2 border-primary bg-primary/5 p-4 text-sm text-muted-foreground">This page keeps the card collection in-app. Retailer links remain available on each card as optional purchase destinations; Scryfall remains the upstream refresh source.</div>
    </main>
  </CatalogShell>;
}

function CatalogShell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-background text-foreground">{children}<footer className="mt-12 border-t border-border bg-muted/30 py-8"><div className="w-full px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8 2xl:px-12"><p>In-app catalog powered by Scryfall data. Magic: The Gathering is © Wizards of the Coast.</p></div></footer></div>; }

function FilterChip({ children, active, onClick, tone = 'indigo' }: { children: React.ReactNode; active: boolean; onClick: () => void; tone?: 'indigo' | 'slate' | 'amber' }) { const tones = { indigo: 'border-primary/40 text-primary', slate: 'border-slate-500/40 text-slate-700', amber: 'border-amber-600/50 text-amber-800' }; return <button type="button" onClick={onClick} className={`inline-flex items-center border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : `bg-card hover:bg-muted ${tones[tone]}`}`}>{children}</button>; }

function CatalogCard({ card, highlightValue = false, valueRank }: { card: ScryfallCard; highlightValue?: boolean; valueRank?: number }) {
  const imageUrl = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small;
  const isNew = isNewCard(card);
  const movement = getPriceMovement(card);
  const name = encodeURIComponent(card.name);
  const tcgUrl = `https://www.tcgplayer.com/search/all/product?q=${name}`;
  const ckUrl = `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${name}`;
  return <article className={`group relative overflow-hidden border-2 bg-card transition-colors hover:border-primary ${highlightValue ? 'border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.18)]' : isNew ? 'border-primary/70' : 'border-border'}`}>
    {highlightValue && <div className="absolute right-0 top-0 z-10 border-b border-l border-amber-500 bg-amber-400 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950">Top {valueRank}</div>}
    <div className="relative aspect-[2.5/3.5] bg-muted"><CardImageZoom src={imageUrl} alt={card.name} className="h-full w-full" /></div>
    <div className="p-3"><div className="mb-2 flex flex-wrap gap-1.5"><span className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase ${isNew ? 'border-primary/60 bg-primary/10 text-primary' : 'border-slate-500/40 bg-slate-500/10 text-slate-700'}`}>{isNew ? 'NEW' : 'REPRINT'}</span><span className="border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{card.rarity}</span></div><h2 className="truncate text-sm font-semibold" title={card.name}>{card.name}</h2><p className="mt-1 truncate text-[11px] text-muted-foreground">{card.collector_number} · {card.type_line}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className={`font-semibold ${highlightValue ? 'text-amber-700' : ''}`}>{card.prices?.usd ? `$${card.prices.usd}` : 'Price —'}</span><PriceMovementIndicator movement={movement} /><span className="ml-auto text-muted-foreground">{card.set.toUpperCase()}</span></div><div className="mt-3 flex gap-2 border-t border-border pt-2 text-[10px] font-semibold text-primary"><a href={tcgUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">TCGplayer</a><span className="text-muted-foreground">·</span><a href={ckUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Card Kingdom</a></div></div>
  </article>;
}

type PriceMovement = { direction: 'up' | 'down' | 'neutral'; percent: number | null; previous: number | null };
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`)); }

function getPriceMovement(card: ScryfallCard): PriceMovement { const current = Number(card.prices?.usd); const historicalPrices = (priceHistory.observations.at(-1)?.prices ?? {}) as Record<string, number>; const previous = Number(historicalPrices[card.id]); if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(previous) || previous <= 0) return { direction: 'neutral', percent: null, previous: null }; const percent = ((current - previous) / previous) * 100; if (Math.abs(percent) < 0.05) return { direction: 'neutral', percent: 0, previous }; return { direction: percent > 0 ? 'up' : 'down', percent, previous }; }
function PriceMovementIndicator({ movement }: { movement: PriceMovement }) { if (movement.direction === 'up') return <span className="inline-flex items-center gap-0.5 border border-emerald-600/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700" title={`Up ${movement.percent?.toFixed(1)}% since the previous refresh`} aria-label={`Price up ${movement.percent?.toFixed(1)} percent`}><ArrowUpRight className="h-3 w-3" />{movement.percent?.toFixed(1)}%</span>; if (movement.direction === 'down') return <span className="inline-flex items-center gap-0.5 border border-rose-600/30 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-700" title={`Down ${Math.abs(movement.percent ?? 0).toFixed(1)}% since the previous refresh`} aria-label={`Price down ${Math.abs(movement.percent ?? 0).toFixed(1)} percent`}><ArrowDownRight className="h-3 w-3" />{Math.abs(movement.percent ?? 0).toFixed(1)}%</span>; return <span className="inline-flex items-center gap-0.5 border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground" title="No recent price movement data available" aria-label="No recent price movement data"><Minus className="h-3 w-3" />—</span>; }
