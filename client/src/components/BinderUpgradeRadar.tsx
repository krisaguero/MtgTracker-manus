import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ArrowUpRight, BookOpen, Search, Sparkles, Wallet } from 'lucide-react';
import type { OwnedCard } from '@/lib/manaboxParser';
import {
  commanderPreconUpgradeGuides,
  getUpgradeOwnership,
  normalizeUpgradeCardName,
  type CommanderPreconUpgradeGuide,
  type PreconUpgradePick,
} from '@/data/commanderPreconUpgradeGuides';

type RadarFilter = 'owned' | 'budget' | 'all';

export interface BinderUpgradeRadarItem {
  guide: CommanderPreconUpgradeGuide;
  pick: PreconUpgradePick;
  ownership: ReturnType<typeof getUpgradeOwnership>;
  guideHref: string;
  sourceUrl?: string;
}

function deckSlug(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function buildBinderUpgradeRadarItems(
  guides: CommanderPreconUpgradeGuide[],
  cards: OwnedCard[],
): BinderUpgradeRadarItem[] {
  return guides.flatMap((guide) => guide.picks.map((pick) => ({
    guide,
    pick,
    ownership: getUpgradeOwnership(pick.name, cards),
    guideHref: `/deck/${guide.setCode.toLowerCase()}/${deckSlug(guide.deckName)}`,
    sourceUrl: pick.sourceUrls?.[0] || guide.sourceUrls[0],
  })));
}

const FILTERS: Array<{ id: RadarFilter; label: string; description: string }> = [
  { id: 'owned', label: 'Already in my binder', description: 'Owned recommendations' },
  { id: 'budget', label: 'Budget-tagged by source', description: 'Picks with source budget notes' },
  { id: 'all', label: 'All researched picks', description: 'Every curated guide pick' },
];

export function BinderUpgradeRadar({ cards, onOpenImportModal }: { cards: OwnedCard[]; onOpenImportModal: () => void }) {
  const [filter, setFilter] = useState<RadarFilter>(() => cards.length > 0 ? 'owned' : 'all');
  const [query, setQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(12);
  const items = useMemo(() => buildBinderUpgradeRadarItems(commanderPreconUpgradeGuides, cards), [cards]);
  const ownedItems = items.filter((item) => item.ownership.status === 'owned');
  const budgetItems = items.filter((item) => Boolean(item.pick.budgetNote));
  const matchingGuideCount = new Set(ownedItems.map((item) => item.guide.id)).size;
  const binderCopies = cards.reduce((total, card) => total + card.quantity, 0);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredItems = items
    .filter((item) => {
      if (filter === 'owned' && item.ownership.status !== 'owned') return false;
      if (filter === 'budget' && !item.pick.budgetNote) return false;
      if (!normalizedQuery) return true;
      return [item.pick.name, item.guide.deckName, ...item.guide.commanderNames, item.guide.theme, item.pick.reason]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => {
      const ownedFirst = Number(b.ownership.status === 'owned') - Number(a.ownership.status === 'owned');
      const budgetFirst = Number(Boolean(b.pick.budgetNote)) - Number(Boolean(a.pick.budgetNote));
      return ownedFirst || (filter !== 'owned' ? budgetFirst : 0) || a.guide.deckName.localeCompare(b.guide.deckName) || a.pick.name.localeCompare(b.pick.name);
    });
  const visibleItems = filteredItems.slice(0, visibleLimit);

  return (
    <section className="my-8 border-2 border-primary/35 bg-gradient-to-br from-primary/5 via-card to-emerald-500/5 p-4 sm:p-7" aria-labelledby="binder-upgrade-radar-title">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.19em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Binder Upgrade Radar · browser-local</p>
          <h2 id="binder-upgrade-radar-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Your collection already has a few upgrades in it.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Find source-linked, theme-first ideas across the Commander guides. Start with cards you already own, or browse budget-labeled picks—without treating an old budget note as a current price.</p>
        </div>
        <div className="grid min-w-[12rem] grid-cols-2 gap-2 font-mono text-[10px] uppercase">
          <div className="border border-emerald-600/30 bg-emerald-600/5 p-3"><span className="text-muted-foreground">Binder matches</span><strong className="mt-1 block text-xl text-emerald-800">{ownedItems.length}</strong><span className="text-muted-foreground">guide picks · {matchingGuideCount} decks</span></div>
          <div className="border border-border bg-background p-3"><span className="text-muted-foreground">Budget notes</span><strong className="mt-1 block text-xl">{budgetItems.length}</strong><span className="text-muted-foreground">source-labeled picks</span></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter upgrade recommendations">
        {FILTERS.map((option) => {
          const count = option.id === 'owned' ? ownedItems.length : option.id === 'budget' ? budgetItems.length : items.length;
          const active = filter === option.id;
          return <button key={option.id} type="button" aria-pressed={active} title={option.description} onClick={() => { setFilter(option.id); setVisibleLimit(12); }} className={`min-h-10 border px-3 py-2 text-left font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground'}`}>
            {option.label} <span className={active ? 'opacity-75' : 'text-primary'}>· {count}</span>
          </button>;
        })}
        <label className="relative ml-0 flex min-w-[15rem] flex-1 items-center sm:ml-auto sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(12); }} placeholder="Search card, deck, commander, theme…" aria-label="Search Commander upgrade picks" className="min-h-10 w-full border border-border bg-background pl-9 pr-3 text-sm" />
        </label>
      </div>

      {cards.length === 0 && <div className="mt-4 flex flex-col gap-3 border border-amber-600/30 bg-amber-600/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-5 text-muted-foreground"><strong className="text-foreground">No collection imported yet.</strong> Browse all guide picks, or import a ManaBox list to reveal which upgrades are already hiding in your binder.</p>
        <button type="button" onClick={onOpenImportModal} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/90">Import ManaBox</button>
      </div>}

      {cards.length > 0 && <p className="mt-3 font-mono text-[10px] uppercase text-muted-foreground">Matching against {binderCopies.toLocaleString()} imported copies across {cards.length.toLocaleString()} printing records · collection data stays in this browser</p>}

      {visibleItems.length > 0 ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map(({ guide, pick, ownership, guideHref, sourceUrl }) => <article key={`${guide.id}:${normalizeUpgradeCardName(pick.name)}`} className="flex flex-col border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-wider text-primary">{guide.deckName} · {guide.setCode.toUpperCase()}</p><h3 className="mt-1 text-lg font-black leading-tight">{pick.name}</h3></div>
            <span className={`shrink-0 border px-2 py-1 font-mono text-[9px] font-black uppercase ${ownership.status === 'owned' ? 'border-emerald-600/35 bg-emerald-600/10 text-emerald-800' : 'border-amber-600/35 bg-amber-600/10 text-amber-800'}`} title={ownership.note}>{ownership.status === 'owned' ? `Owned · ${ownership.quantity}` : 'Unknown · check binder'}</span>
          </div>
          <p className="mt-3 flex-1 text-xs leading-5 text-muted-foreground">{pick.reason}</p>
          {pick.budgetNote && <div className="mt-3 border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2"><p className="inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-wider text-amber-800"><Wallet className="h-3 w-3" /> Source budget note</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{pick.budgetNote}</p></div>}
          <details className="group mt-3 border-t border-border pt-2">
            <summary className="cursor-pointer list-none font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary">Theme brief &amp; alternate path <span className="float-right group-open:rotate-180">⌄</span></summary>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{guide.theme}</p>
            {guide.alternatePaths[0] && <p className="mt-2 border-l-2 border-primary/30 pl-2 text-[11px] leading-5"><strong>{guide.alternatePaths[0].title}</strong><span className="text-muted-foreground"> — {guide.alternatePaths[0].description}</span></p>}
          </details>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <Link href={guideHref} className="inline-flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary hover:underline">Open guide <ArrowRight className="h-3 w-3" /></Link>
            {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary">Source <ArrowUpRight className="h-3 w-3" /></a>}
          </div>
        </article>)}
      </div> : <div className="mt-4 border border-dashed border-border bg-background p-6 text-center">
        <BookOpen className="mx-auto h-5 w-5 text-primary" />
        <p className="mt-2 font-semibold">{filter === 'owned' ? 'No binder matches in the current view.' : 'No guide picks match that search.'}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{filter === 'owned' ? cards.length ? 'That only means the imported list did not match these card names—verify your binder before buying.' : 'The binder-match view needs a local collection; use “All researched picks” to browse without importing.' : 'Try a different card, commander, deck, or theme term.'}</p>
      </div>}

      {filteredItems.length > visibleItems.length && <div className="mt-4 text-center"><button type="button" onClick={() => setVisibleLimit((limit) => limit + 12)} className="inline-flex min-h-10 items-center gap-2 border border-border bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary hover:text-primary">Show 12 more <span className="text-muted-foreground">({filteredItems.length - visibleItems.length} remaining)</span></button></div>}
      <p className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-[10px] leading-5 text-muted-foreground"><span className="mt-0.5 font-mono font-black text-primary">NOTE</span><span>Guide recommendations are tied to each precon’s game plan and cited source. Budget labels reflect source wording, not live prices. “Unknown” is not proof you do not own a card, and owned copies are not reserved across decks.</span></p>
    </section>
  );
}
