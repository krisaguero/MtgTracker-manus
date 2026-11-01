import { ArrowUpRight, ChevronDown, GitBranch } from 'lucide-react';
import type { OwnedCard } from '@/lib/manaboxParser';
import { getUpgradeOwnership } from '@/data/commanderPreconUpgradeGuides';
import { getPreconUpgradeBridges } from '@/data/preconUpgradeBridges';

export function PreconUpgradeBridges({ setCode, deckName, ownedCards = [] }: { setCode: string; deckName: string; ownedCards?: OwnedCard[] }) {
  const bridges = getPreconUpgradeBridges(setCode, deckName);
  if (!bridges.length) return null;
  return <section className="mt-5 border-2 border-violet-700/35 bg-violet-50/50 p-5 dark:bg-violet-950/10" aria-label="Cross-deck upgrade bridges">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-violet-700/20 pb-4">
      <div>
        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-violet-800 dark:text-violet-300"><GitBranch className="h-3.5 w-3.5" /> Collection-aware upgrade architecture</div>
        <h2 className="mt-2 text-2xl font-black">Cross-deck bridge packages</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">These are not generic staples. They are reusable packages that connect this precon to another deck in the ecosystem. Owned status is checked against the local ManaBox layer; sealed precon ownership does not imply an individual card scan.</p>
      </div>
      <span className="border border-violet-700/30 px-3 py-2 font-mono text-[10px] font-black uppercase text-violet-800 dark:text-violet-300">{bridges.length} bridge lanes</span>
    </div>
    <div className="mt-4 space-y-3">
      {bridges.map(bridge => <details key={bridge.id} className="group border border-violet-700/20 bg-background">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 hover:bg-violet-500/5">
          <span><span className="font-mono text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-300">{bridge.lane}</span><strong className="mt-1 block text-base">{bridge.headline}</strong><span className="mt-1 block text-sm text-muted-foreground">From: {bridge.sourceDecks.join(' · ')}</span></span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-violet-700/20 p-4 sm:p-5">
          <p className="text-sm leading-6 text-muted-foreground">{bridge.description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {bridge.cards.map(card => {
              const ownership = getUpgradeOwnership(card.name, ownedCards);
              return <div key={card.name} className="border-l-2 border-violet-700/40 pl-3">
                <div className="flex flex-wrap items-center gap-2"><a href={`https://edhrec.com/cards/${card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-violet-500/40 underline-offset-2 hover:text-violet-700">{card.name}</a><span className={`border px-2 py-0.5 font-mono text-[9px] font-black uppercase ${ownership.status === 'owned' ? 'border-emerald-600/35 bg-emerald-600/10 text-emerald-800' : 'border-amber-600/35 bg-amber-600/10 text-amber-800'}`}>{ownership.status === 'owned' ? `Owned · ${ownership.quantity ?? 0}` : 'Buy / conditional transfer'}</span></div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.role} · {card.budgetTier}</p>
              </div>;
            })}
          </div>
          <div className="mt-4 border-t border-violet-700/15 pt-3"><p className="text-xs leading-5 text-muted-foreground"><strong>Transfer rule:</strong> {bridge.transferRule}</p><a href={bridge.edhrecUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase text-violet-800 underline underline-offset-2 dark:text-violet-300">Open EDHREC lane <ArrowUpRight className="h-3 w-3" /></a></div>
        </div>
      </details>)}
    </div>
  </section>;
}
