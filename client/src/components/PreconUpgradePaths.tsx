import React from 'react';
import { ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react';
import type { OwnedCard } from '@/lib/manaboxParser';
import { getCommanderPreconUpgradeGuide, getUpgradeOwnership, upgradeResearchComplete } from '@/data/commanderPreconUpgradeGuides';

function slugify(value: string) {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function cardUrl(pick: { name: string; slug?: string }) {
  return `https://edhrec.com/cards/${pick.slug || slugify(pick.name)}`;
}

function OwnershipBadge({ cardName, ownedCards, showPrintings = false }: { cardName: string; ownedCards: OwnedCard[]; showPrintings?: boolean }) {
  const match = getUpgradeOwnership(cardName, ownedCards);
  if (match.status === 'owned') {
    const countLabel = `${match.quantity ?? 0}`;
    const visiblePrintings = match.printings?.slice(0, 3) ?? [];
    const moreCount = Math.max(0, (match.printings?.length ?? 0) - visiblePrintings.length);
    return <div className="flex max-w-full flex-wrap items-center gap-1">
      <span className="inline-flex max-w-full flex-wrap items-center border border-emerald-600/35 bg-emerald-600/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-800" title={match.note ?? 'Owned in this viewer’s local collection'}>Owned · {countLabel} {match.quantity === 1 ? 'copy' : 'copies'}{match.printings?.length ? <span className="ml-1 font-normal normal-case">({match.printings.length} local printing{match.printings.length === 1 ? '' : 's'} matched)</span> : null}</span>
      {showPrintings && visiblePrintings.length > 0 && <span className="font-mono text-[9px] text-muted-foreground">Matched printing(s): {visiblePrintings.join(', ')}{moreCount > 0 ? ` +${moreCount} more` : ''}</span>}
    </div>;
  }
  return <span className="inline-flex border border-amber-600/35 bg-amber-600/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-800" title={match.note}>Unknown · not found in local collection</span>;
}

function sortOwnedFirst<T extends { name: string }>(entries: T[], ownedCards: OwnedCard[]): T[] {
  return entries.map((entry, index) => ({ entry, index, owned: getUpgradeOwnership(entry.name, ownedCards).status === 'owned' }))
    .sort((a, b) => Number(b.owned) - Number(a.owned) || a.index - b.index)
    .map(({ entry }) => entry);
}

export function PreconUpgradePaths({
  setCode,
  deckName,
  commanderNames,
  ownedCards = [],
}: {
  setCode: string;
  deckName: string;
  commanderNames: string[];
  ownedCards?: OwnedCard[];
}) {
  const guide = getCommanderPreconUpgradeGuide({ setCode, deckName, commanderNames });
  const picks = guide ? sortOwnedFirst(guide.picks, ownedCards) : [];
  const swaps = guide ? guide.swaps.map((swap, index) => ({ swap, index, owned: swap.cardsIn.some((name) => getUpgradeOwnership(name, ownedCards).status === 'owned') }))
    .sort((a, b) => Number(b.owned) - Number(a.owned) || a.index - b.index).map(({ swap }) => swap) : [];
  const alternatePaths = guide?.alternatePaths ?? [];
  const headingId = `precon-upgrade-paths-${slugify(setCode)}-${slugify(deckName)}`;
  const easyOwned = picks.filter((pick) => getUpgradeOwnership(pick.name, ownedCards).status === 'owned').length;
  const coverageLabel = guide
    ? guide.coverage === 'full' ? 'Sources checked' : guide.coverage === 'partial' ? 'Partial source coverage' : guide.researchStatus === 'pending' && !upgradeResearchComplete ? 'Research pending' : 'No source coverage'
    : upgradeResearchComplete ? 'No source coverage' : 'Research pending';

  return (
    <section className="border-2 border-primary/35 bg-card p-5 sm:p-7" aria-labelledby={`${headingId}-heading`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> {guide ? 'EDHREC-based · curated for this precon' : 'Commander precon research'}
          </div>
          <h2 id={`${headingId}-heading`} className="mt-2 text-2xl font-bold tracking-tight">Easy upgrades &amp; alternate paths</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{guide?.theme || 'No source-verified recommendations are available for this deck yet.'}</p>
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{coverageLabel} · {swaps.length}/25 supported card-in/card-out suggestions · owned additions shown first</p>
        </div>
        {guide?.sourceUrls?.[0] && <a href={guide.sourceUrls[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase text-primary hover:border-primary">
          {guide.sourceLabel || 'EDHREC source'} <ArrowUpRight className="h-3.5 w-3.5" />
        </a>}
      </div>

      <div className="mt-5 space-y-4">
        <details className="group border border-border bg-background">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/5">
            <span>Easy upgrades</span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">{picks.length} picks · {easyOwned} owned <ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></span>
          </summary>
          <div className="border-t border-border p-4 sm:p-5">
            {picks.length > 0 ? <ul className="grid gap-3 md:grid-cols-2">
              {picks.map((pick) => (
                <li key={`${guide?.id}-${pick.slug || pick.name}`} className="border-l-2 border-primary/40 pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={cardUrl(pick)} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline decoration-primary/40 underline-offset-2 hover:text-primary">{pick.name}</a>
                    <OwnershipBadge cardName={pick.name} ownedCards={ownedCards} showPrintings />
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{pick.reason}</p>
                  {pick.budgetNote && <p className="mt-1 text-xs leading-5 text-muted-foreground">Budget note: {pick.budgetNote}</p>}
                  {pick.sourceUrls?.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="mt-1 mr-3 inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase text-primary underline underline-offset-2">Source <ArrowUpRight className="h-3 w-3" /></a>)}
                </li>
              ))}
            </ul> : <p className="text-sm leading-6 text-muted-foreground">{guide?.researchStatus === 'pending' || !upgradeResearchComplete ? 'This deck’s research is still in progress; no unsupported upgrades are shown.' : 'No source-verified easy upgrade picks were found for this deck.'}</p>}
          </div>
        </details>

        <details className="group border border-border bg-background">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/5">
            <span>Top 25 swaps</span>
            <span className="inline-flex items-center gap-2 text-muted-foreground">{swaps.length} / 25 supported <ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></span>
          </summary>
          <div className="border-t border-border p-4 sm:p-5">
            {swaps.length > 0 ? <>
              <p className="mb-4 text-xs leading-5 text-muted-foreground">Curated pairings from source-supported add/cut candidates; these are not EDHREC-authored one-to-one swaps. Owned incoming cards appear first.</p>
              <ol className="space-y-3">
                {swaps.map((swap, index) => (
                  <li key={`${guide?.id}-swap-${index}`} className="grid gap-2 border-b border-border pb-3 last:border-0 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                    <div><span className="font-mono text-[9px] font-bold uppercase text-primary">Add</span><p className="mt-1 font-semibold">{swap.cardsIn.join(', ')}</p>{swap.cardsIn.map((name) => <div key={`in-${name}`} className="mt-1"><OwnershipBadge cardName={name} ownedCards={ownedCards} showPrintings /></div>)}</div>
                    <span className="hidden pt-3 text-muted-foreground sm:block">→</span>
                    <div><span className="font-mono text-[9px] font-bold uppercase text-muted-foreground">Cut</span><p className="mt-1 font-semibold">{swap.cardsOut.join(', ')}</p></div>
                    <p className="text-sm leading-5 text-muted-foreground sm:col-span-3">{swap.rationale}</p>
                    <div className="sm:col-span-3">{swap.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="mr-3 inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase text-primary underline underline-offset-2">Source <ArrowUpRight className="h-3 w-3" /></a>)}</div>
                  </li>
                ))}
              </ol>
            </> : <p className="text-sm leading-6 text-muted-foreground">{guide?.coverageNote || (guide?.researchStatus === 'pending' || !upgradeResearchComplete ? 'This deck’s source research is still in progress. No speculative card-out list is shown.' : 'No source-backed card-in/card-out pairs were found; no swaps have been fabricated.')}</p>}
          </div>
        </details>
      </div>

      <div className="mt-5 border border-primary/25 bg-primary/5 p-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Alternate commander or strategy</p>
        {alternatePaths.length > 0 ? <ul className="mt-3 grid gap-4 md:grid-cols-2">
          {alternatePaths.map((alternate) => <li key={`${guide?.id}-${alternate.title}`} className="border-l-2 border-primary/40 pl-3">
            <h3 className="font-semibold">{alternate.title}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{alternate.description}</p>
            <a href={alternate.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-primary underline underline-offset-2">{alternate.linkLabel}<ArrowUpRight className="h-3.5 w-3.5" /></a>
          </li>)}
        </ul> : <p className="mt-2 text-sm leading-5 text-muted-foreground">No source-supported alternate path is listed for this deck.</p>}
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4">
        <p className="max-w-3xl text-xs leading-5 text-muted-foreground">Ownership is matched only against the collection stored in this browser; cards not found remain unknown. Prices change; check current prices and playgroup fit before buying. Ownership counts do not reserve copies already used in other decks.</p>
        <div className="flex flex-wrap gap-3">{guide?.sourceUrls?.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase text-muted-foreground underline underline-offset-2 hover:text-primary">EDHREC / source <ArrowUpRight className="h-3 w-3" /></a>)}{guide?.preconUrl && <a href={guide.preconUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold uppercase text-muted-foreground underline underline-offset-2 hover:text-primary">Open EDHREC precon page</a>}</div>
      </div>
    </section>
  );
}
