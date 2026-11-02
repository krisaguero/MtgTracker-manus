import { useMemo, useState } from 'react';
import { Check, ClipboardList, ExternalLink, Upload } from 'lucide-react';
import { Link } from 'wouter';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import type { OwnedCard } from '@/lib/manaboxParser';
import { appendUpgradeLedgerEntry } from '@/lib/upgradeLedger';
import { bridgePackageSummary, planBridgeTransfers, type BridgePackage } from '@/lib/bridgeTransferPlanning';

const packageLabels: Record<BridgePackage, string> = { A: 'A · Prove the plan', B: 'B · Stabilize the shell', C: 'C · Finish the conversion' };
const statusLabels = { transferable: 'Transfer candidate', conditional: 'Conditional', buy: 'Buy candidate', unresolved: 'Printing review' } as const;

export function BridgeTransferPlanner({ inventory, sourceDeck }: { inventory: OwnedCard[]; sourceDeck?: RawCommanderDeck }) {
  const [packageId, setPackageId] = useState<BridgePackage>('A');
  const [planned, setPlanned] = useState<string[]>([]);
  const rows = useMemo(() => planBridgeTransfers(inventory, sourceDeck), [inventory, sourceDeck]);
  const summary = useMemo(() => bridgePackageSummary(rows, packageId), [rows, packageId]);
  const visible = rows.filter(row => row.package === packageId);

  const planCard = (name: string, status: string) => {
    if (planned.includes(name) || status !== 'transferable') return;
    appendUpgradeLedgerEntry({
      id: `borrow-msc-invisible-woman-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      deckSlug: 'the-fantastic-four-msc',
      deckName: 'The Fantastic Four',
      cardName: name,
      action: 'borrow',
      status: 'planned',
      sourceDeckSlug: 'abzan-armor-tdc',
      sourceLabel: 'Abzan Armor',
      createdAt: new Date().toISOString(),
      note: 'Planned from the Wall conversion bridge; verify exact printing and physical reservation before moving.',
    });
    setPlanned(current => [...current, name]);
  };

  return <section className="mt-6 border-2 border-violet-700/40 bg-violet-50/50 p-5 dark:bg-violet-950/10 sm:p-7" aria-label="ManaBox bridge verification">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-violet-700/20 pb-5">
      <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-violet-800 dark:text-violet-300">Phase 5 · import verification</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Wall bridge transfer planner</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">This panel never treats sealed ownership as card ownership. It reserves copies needed by Abzan Armor, then exposes only genuine surplus copies as transfer candidates.</p></div><ClipboardList className="h-8 w-8 shrink-0 text-violet-800 dark:text-violet-300" aria-hidden="true" />
    </div>
    <div className="mt-5 flex flex-wrap gap-2">{(['A', 'B', 'C'] as BridgePackage[]).map(id => { const s = bridgePackageSummary(rows, id); return <button key={id} type="button" onClick={() => setPackageId(id)} className={`border px-3 py-2 text-left ${packageId === id ? 'border-violet-800 bg-violet-800 text-white' : 'border-violet-700/30 bg-background hover:border-violet-800'}`}><span className="block font-mono text-[10px] font-black uppercase">{packageLabels[id]}</span><span className="mt-1 block font-mono text-[10px] uppercase opacity-80">{s.transferable}/{s.total} transferable</span></button>; })}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-emerald-700/30 bg-emerald-700/10 p-3"><p className="font-mono text-[10px] font-black uppercase text-emerald-800">Transferable</p><p className="mt-1 text-2xl font-black text-emerald-800">{summary.transferable}</p></div><div className="border border-amber-700/30 bg-amber-700/10 p-3"><p className="font-mono text-[10px] font-black uppercase text-amber-800">Conditional</p><p className="mt-1 text-2xl font-black text-amber-800">{summary.conditional}</p></div><div className="border border-border bg-background p-3"><p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Buy candidates</p><p className="mt-1 text-2xl font-black">{summary.buy}</p></div></div>
    <div className="mt-5 divide-y divide-violet-700/15 border-y border-violet-700/20">{visible.map(row => <div key={row.name} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.role}</p></div><div className="font-mono text-[10px] uppercase text-muted-foreground">Owned <strong className="text-foreground">{row.totalOwned}</strong></div><div className="font-mono text-[10px] uppercase text-muted-foreground">Reserved <strong className="text-foreground">{row.reservedForSource}</strong></div><div className="flex flex-wrap items-center gap-2 sm:justify-end"><span className={`border px-2 py-1 font-mono text-[9px] font-black uppercase ${row.status === 'transferable' ? 'border-emerald-600/35 bg-emerald-600/10 text-emerald-800' : row.status === 'conditional' ? 'border-amber-600/35 bg-amber-600/10 text-amber-800' : 'border-border text-muted-foreground'}`}>{statusLabels[row.status]}</span>{row.status === 'transferable' && <button type="button" onClick={() => planCard(row.name, row.status)} className="inline-flex items-center gap-1 border border-violet-700/40 px-2 py-1 font-mono text-[9px] font-black uppercase text-violet-800 hover:bg-violet-800 hover:text-white">{planned.includes(row.name) ? <><Check className="h-3 w-3" /> Planned</> : 'Plan borrow'}</button>}</div></div>)}</div>
    <div className="mt-5 flex flex-wrap gap-2"><Link href="/collection" className="inline-flex items-center gap-2 border border-violet-700/40 bg-background px-3 py-2 font-mono text-[10px] font-black uppercase text-violet-800"><Upload className="h-3.5 w-3.5" /> Import ManaBox</Link><a href="https://edhrec.com/precons/the-fantastic-four/invisible-woman" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase"><ExternalLink className="h-3.5 w-3.5" /> Compare EDHREC lane</a></div>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">A zero-card view is expected before a ManaBox import. The planner will not invent ownership from a sealed precon record.</p>
  </section>;
}
