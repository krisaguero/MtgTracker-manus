import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, CircleAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { BrawlDeckCard } from '@/components/BrawlDeckCard';
import { brawlDecks as decks } from '@/lib/brawlDecks';

export default function BrawlBox() {
  useEffect(() => {
    document.title = 'Brawlternatives · Custom Brawl Alternatives | MTG Sets Tracker';
    const description = 'Precon-themed and custom non-precon, self-built 60-card Commander-preview decks as a casual alternative to official Brawl. This is a custom house concept, not official Magic Brawl.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = description;
    return () => { if (created && meta?.parentNode) meta.parentNode.removeChild(meta); };
  }, []);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <div className="mt-6 max-w-4xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-primary">Kris Aguero’s personal deck shelf · custom alternatives to Brawl</p>
          <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">Brawlternatives</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Precon-themed and custom non-precon, self-built, non-tuned 60-card Commander-preview decks: casual alternatives to official Brawl, not official Magic Brawl lists. Dr. Madison Li is the first entry; Araumi follows, then Marchesa, the Black Rose as a custom non-precon Brawlternative. This custom house concept is not a claim of tuned or tournament-ready lists.</p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="flex gap-3 border border-primary/40 bg-primary/5 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Personal data omitted</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The source’s Owned counts and proxy annotations are not part of this shared list. Treat any collection or proxy planning as local and provisional while scans are incomplete.</p></div></div>
          <div className="flex gap-3 border border-amber-600/50 bg-amber-500/5 p-4"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Not official Brawl</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The commanders’ Scryfall format statuses are shown with each entry. Brawlternatives are custom Commander-preview builds—not official Brawl lists or regulation 100-card Commander decks. Marchesa is a non-precon build.</p></div></div>
          <div className="border border-border bg-card p-4"><h2 className="font-mono text-xs font-black uppercase tracking-widest">Separate from Retro Battle Box</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The Retro Battle Box remains its own shared set of nine non-Commander 60-card duel decks.</p><Link href="/battle-box" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-wider text-primary underline">Open Retro Battle Box <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        </div>
        <p className="mt-4 text-[10px] leading-5 text-muted-foreground">Card names, color identity, and legality checked against <a className="underline" href="https://scryfall.com/" target="_blank" rel="noopener noreferrer">Scryfall</a>: existing entries on October 16, 2026; Marchesa on October 17, 2026. Madison’s added basic lands and the cards moved to its optional sideboard are disclosed in its list audit. Marchesa’s notes clarify card interactions without changing the supplied card copies.</p>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-8 sm:py-10">
      <nav className="flex flex-wrap gap-2" aria-label="Brawlternatives entries">{decks.map((deck) => <a key={deck.id} href={`#${deck.id}`} className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-card px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">{String(deck.rank).padStart(2, '0')} · {deck.commander} <ArrowRight className="h-4 w-4" /></a>)}</nav>
      {decks.map((deck) => <BrawlDeckCard key={deck.id} deck={deck} />)}
      <section className="border-t-2 border-border pt-5">
        <h2 className="text-xl font-black">Keep the boxes distinct</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">Brawlternatives holds personal, precon-themed and custom non-precon Commander-preview experiments as an alternative to official Brawl. The Retro Battle Box is still the separate, shared non-Commander duel set. Use the Battle Box’s local inventory queue for its nine public lists; this page does not publish scan-derived ownership or proxy flags.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link href="/battle-box" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">Retro Battle Box <ArrowRight className="h-4 w-4" /></Link><Link href="/battle-box-proxy-print" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">Proxy-print how-to <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </main>
  </div>;
}
