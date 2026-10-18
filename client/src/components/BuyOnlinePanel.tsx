import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, ShoppingCart } from 'lucide-react';
import { validExportEntries, type DeckExportEntry } from '@/lib/deckExport';

export function BuyOnlinePanel({ cards, sourceLabel, proxyHelpHref }: { cards: DeckExportEntry[]; sourceLabel?: string; proxyHelpHref?: string }) {
  const entries = validExportEntries(cards);
  const text = entries.map(card => `${card.quantity} ${card.name}`).join('\n');
  const [selected, setSelected] = useState(entries[0]?.name ?? '');
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => { setSelected(entries[0]?.name ?? ''); setStatus('idle'); }, [text]);
  const name = entries.some(card => card.name === selected) ? selected : entries[0]?.name;
  const searchUrl = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(name ?? '')}`;
  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch { setStatus('failed'); }
  }
  return <section id="buy-online" className="scroll-mt-24 border-2 border-primary bg-primary/5 p-5 sm:p-6" aria-label="Buy Online">
    <div className="flex items-start gap-3"><ShoppingCart className="mt-1 h-6 w-6 shrink-0 text-primary" /><div className="min-w-0 flex-1">
      <h2 className="text-2xl font-black">Prefer physical cards? Buy Online.</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{sourceLabel ? `${sourceLabel} ` : ''}Copy the full shopping list, or choose a card to search on TCGplayer. Review the printing, condition, price, and shipping on the retailer's site.</p>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="min-w-0 text-xs font-bold">Card to search<select className="mt-2 min-h-11 w-full min-w-0 max-w-full border-2 border-border bg-background px-2 py-2 text-sm" aria-label="Card to buy online" value={name ?? ''} onChange={event => setSelected(event.target.value)}>{entries.map((card,index) => <option key={`${card.name}-${index}`} value={card.name}>{card.quantity}× {card.name}</option>)}</select></label>
        {name && <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-center gap-2 self-end bg-primary px-6 py-4 text-base font-black text-primary-foreground hover:opacity-90">Buy Online <ExternalLink className="h-5 w-5" /></a>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4"><button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-bold"><Copy className="h-4 w-4" /> Copy shopping list</button>{proxyHelpHref && <a href={proxyHelpHref} className="text-xs text-muted-foreground underline">Optional proxy-print help</a>}</div>
      <p role="status" aria-live="polite" className="mt-2 text-xs">{status === 'copied' ? 'Shopping list copied.' : status === 'failed' ? 'Clipboard unavailable. Open the full shopping list below and copy manually.' : ''}</p>
      <details className="mt-2 text-xs"><summary className="min-h-9 cursor-pointer content-center font-bold">View full shopping list</summary><pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap border border-border bg-background p-3 leading-5">{text}</pre></details>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">This opens a single-card search, not a prefilled cart or deck checkout. No stock, live total, or retailer integration is promised. This list is not an assessment of what you own or need.</p>
    </div></div>
  </section>;
}
