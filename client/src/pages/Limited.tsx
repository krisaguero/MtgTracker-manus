import { useMemo, useState } from 'react';
import { ArrowLeft, Download, RotateCcw, Save } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { EMPTY_LIMITED_WORKSPACE, formatLimitedDeck, limitedDeckTotal, loadLimitedWorkspace, parseLimitedPool, saveLimitedWorkspace, setLimitedDeckQuantity, type LimitedColor, type LimitedWorkspace } from '@/lib/limitedDeckBuilder';

const COLORS: LimitedColor[] = ['W', 'U', 'B', 'R', 'G'];
const BASIC_LAND: Record<LimitedColor, string> = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' };

export default function Limited() {
  const [workspace, setWorkspace] = useState<LimitedWorkspace>(() => loadLimitedWorkspace());
  const [poolInput, setPoolInput] = useState(() => workspace.pool.map((card) => `${card.quantity} ${card.name}`).join('\n'));
  const [status, setStatus] = useState('');
  const total = useMemo(() => limitedDeckTotal(workspace), [workspace]);
  const selectedPool = workspace.pool.reduce((sum, card) => sum + card.deckQuantity, 0);
  const remainingPool = workspace.pool.reduce((sum, card) => sum + card.quantity - card.deckQuantity, 0);
  const colors = COLORS.filter((color) => workspace.pool.some((card) => card.deckQuantity > 0 && card.colors.includes(color)) || workspace.basicLands[color] > 0);

  function update(next: LimitedWorkspace, message?: string) {
    setWorkspace(next); saveLimitedWorkspace(next); if (message) setStatus(message);
  }

  function importPool() {
    const parsed = parseLimitedPool(poolInput);
    if (!parsed.length) { setStatus('No card rows were recognized. Use one card per line, such as “1 Lightning Bolt” or “2 Island”.'); return; }
    const previous = new Map(workspace.pool.map((card) => [card.name.toLowerCase(), card]));
    const preserved = parsed.map((card) => {
      const old = previous.get(card.name.toLowerCase());
      return old ? { ...card, deckQuantity: Math.min(card.quantity, old.deckQuantity), colors: old.colors } : card;
    });
    update({ ...workspace, pool: preserved }, `Imported ${preserved.length} distinct card names. Choose colors and the copies you want in your deck.`);
  }

  function setColor(cardName: string, color: LimitedColor, checked: boolean) {
    update({ ...workspace, pool: workspace.pool.map((card) => card.name === cardName ? { ...card, colors: checked ? Array.from(new Set([...card.colors, color])) : card.colors.filter((item) => item !== color) } : card) });
  }

  function setLand(color: LimitedColor, quantity: number) {
    update({ ...workspace, basicLands: { ...workspace.basicLands, [color]: Math.max(0, Math.min(40, Math.floor(quantity))) } });
  }

  function exportDeck() {
    const blob = new Blob([formatLimitedDeck(workspace)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `limited-${workspace.mode}-deck.txt`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function resetPool() {
    if (!window.confirm('Clear this browser-local Limited pool and deck selections?')) return;
    const reset = { ...EMPTY_LIMITED_WORKSPACE, basicLands: { ...EMPTY_LIMITED_WORKSPACE.basicLands } };
    setPoolInput(''); update(reset, 'Limited pool cleared.');
  }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Browse releases</Link><nav className="flex gap-2"><Link href="/deck-workshop" className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary">Deck Workshop</Link><Link href="/collection" className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary">Collection</Link></nav></div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
      <header className="border-b-2 border-primary pb-5"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Limited · sealed pool &amp; draft</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Turn a pool into a playable 40.</h1><p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">Paste your sealed pool or draft picks, mark colors yourself, choose how many copies to play, add basic lands, and export a draft decklist. This tool does not infer card text, color identity, rarity, or Limited strategy; no pool data leaves this browser.</p></header>
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,.8fr)_minmax(0,1.2fr)]">
        <section className="space-y-4 border-2 border-border bg-card p-4 sm:p-6" aria-labelledby="pool-input-title"><div className="flex items-start justify-between gap-3"><div><h2 id="pool-input-title" className="text-xl font-black">1. Save the pool</h2><p className="mt-1 text-xs text-muted-foreground">One card per line, optionally with a quantity. Re-import preserves your selections for names that remain in the pool.</p></div><select aria-label="Limited pool mode" value={workspace.mode} onChange={(event) => update({ ...workspace, mode: event.target.value as LimitedWorkspace['mode'] })} className="min-h-10 border border-border bg-background px-2 text-xs font-bold uppercase"><option value="sealed">Sealed pool</option><option value="draft">Draft picks</option></select></div><textarea value={poolInput} onChange={(event) => setPoolInput(event.target.value)} rows={14} placeholder={'1 Lightning Bolt\n2 Island\n1 Inspiring Overseer'} aria-label="Sealed pool or draft picks" className="w-full border border-border bg-background p-3 font-mono text-xs leading-5 outline-none focus:border-primary" /><div className="flex flex-wrap gap-2"><Button onClick={importPool} className="min-h-11 gap-2"><Save className="h-4 w-4" /> Import &amp; save pool</Button><Button variant="outline" onClick={resetPool} className="min-h-11 gap-2"><RotateCcw className="h-4 w-4" /> Clear pool</Button></div>{status && <p role="status" className="border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">{status}</p>}<p className="border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">Cards and picks save locally as you work. Use Collection → Export local backup to keep a private backup; browser storage is not encrypted.</p></section>

        <section className="space-y-4 border-2 border-border bg-card p-4 sm:p-6" aria-labelledby="deck-builder-title"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4"><div><h2 id="deck-builder-title" className="text-xl font-black">2. Build the Limited deck</h2><p className="mt-1 text-xs text-muted-foreground">Select up to the quantity in your saved pool. Color tags are your own notes.</p></div><div className="text-right"><p className="font-mono text-2xl font-black text-primary">{total}<span className="text-xs font-normal text-muted-foreground"> / 40</span></p><p className="text-[10px] uppercase text-muted-foreground">{remainingPool} pool copies unselected</p></div></div>
          {workspace.pool.length ? <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">{workspace.pool.map((card) => <article key={card.name} className="grid gap-2 border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_110px]"><div className="min-w-0"><p className="truncate font-semibold">{card.name}</p><p className="text-[10px] text-muted-foreground">{card.quantity} in pool · {card.quantity - card.deckQuantity} left in sideboard</p><div className="mt-2 flex flex-wrap gap-2">{COLORS.map((color) => <label key={color} className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><input type="checkbox" checked={card.colors.includes(color)} onChange={(event) => setColor(card.name, color, event.target.checked)} aria-label={`${color} color tag for ${card.name}`} className="accent-primary" />{color}</label>)}</div></div><label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">Deck<select aria-label={`Copies of ${card.name} in deck`} value={card.deckQuantity} onChange={(event) => update(setLimitedDeckQuantity(workspace, card.name, Number(event.target.value)))} className="min-h-10 flex-1 border border-border bg-card px-2 text-sm text-foreground">{Array.from({ length: card.quantity + 1 }, (_, count) => <option key={count} value={count}>{count}</option>)}</select></label></article>)}</div> : <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Import a sealed or draft pool to start selecting cards.</p>}
          <div className="border-t border-border pt-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-bold">Add basic lands</h3><p className="mt-1 text-xs text-muted-foreground">Land copies are added to the exported deck, not the opened pool.</p></div><p className={`font-mono text-xs font-bold ${total === 40 ? 'text-emerald-700' : total > 40 ? 'text-destructive' : 'text-muted-foreground'}`}>{total === 40 ? '40 cards selected' : total > 40 ? `${total - 40} over target` : `${40 - total} slots remaining`}</p></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{COLORS.map((color) => <label key={color} className="border border-border bg-background p-2 text-[10px] font-bold uppercase text-muted-foreground">{BASIC_LAND[color]}<input type="number" min="0" max="40" value={workspace.basicLands[color]} onChange={(event) => setLand(color, Number(event.target.value))} aria-label={`Basic ${BASIC_LAND[color]} count`} className="mt-1 min-h-9 w-full border border-border bg-card px-2 text-sm text-foreground" /></label>)}</div></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs text-muted-foreground">Tagged colors: {colors.length ? colors.join(' · ') : 'none tagged'}{selectedPool ? ` · ${selectedPool} selected from pool` : ''}</p><Button type="button" variant="outline" onClick={exportDeck} disabled={!selectedPool && !total} className="min-h-11 gap-2"><Download className="h-4 w-4" /> Export selected deck</Button></div>
        </section>
      </div>

      <section className="border border-border bg-card p-4 sm:p-6"><h2 className="text-lg font-black">Sideboard / unselected pool</h2><p className="mt-1 text-xs text-muted-foreground">Unselected copies remain in your recorded pool for sideboard decisions or later edits.</p>{workspace.pool.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{workspace.pool.filter((card) => card.quantity > card.deckQuantity).map((card) => <p key={card.name} className="border border-border bg-background p-3 text-sm"><span className="font-bold">{card.name}</span><span className="ml-2 font-mono text-xs text-muted-foreground">×{card.quantity - card.deckQuantity}</span></p>)}</div> : <p className="mt-3 text-xs text-muted-foreground">No imported pool yet.</p>}</section>
    </main>
  </div>;
}
