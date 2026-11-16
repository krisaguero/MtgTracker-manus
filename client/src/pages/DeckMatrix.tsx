import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, Share2 } from 'lucide-react';
import {
  loadPublicDeckSnapshots,
  type PublicDeckSnapshot,
} from '@/lib/publicDeckSnapshots';
import { PublicCommanderBrews } from '@/components/PublicCommanderBrews';

function formatPublishedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function DeckList({ heading, cards }: { heading: string; cards: PublicDeckSnapshot['payload']['main'] }) {
  return (
    <section aria-label={heading}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{heading}</h3>
      <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-background">
        {cards.map((card, index) => (
          <li key={`${card.name}-${index}`} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
            <span className="min-w-0 break-words">{card.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{card.quantity}×</span>
          </li>
        ))}
        {!cards.length && <li className="px-3 py-3 text-sm text-muted-foreground">None published.</li>}
      </ul>
    </section>
  );
}

function SnapshotCard({ snapshot, open, onToggle }: { snapshot: PublicDeckSnapshot; open: boolean; onToggle: () => void }) {
  const { payload } = snapshot;
  const mainCopies = payload.main.reduce((total, card) => total + card.quantity, 0);
  return (
    <article id={snapshot.share_id} className="scroll-mt-24 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Approved public snapshot</p>
          <h3 className="mt-2 break-words text-2xl font-bold tracking-tight">{payload.title}</h3>
        </div>
        <a href={`#${snapshot.share_id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary" aria-label={`Direct link to ${payload.title}`}>
          <Share2 size={15} /> Direct link
        </a>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-muted px-3 py-1.5">{mainCopies} main cards</span>
        <span className="rounded-full bg-muted px-3 py-1.5">{payload.status || 'Published'}</span>
        <span className="rounded-full bg-muted px-3 py-1.5">{payload.format_label || 'Format not specified'}</span>
        <span className="rounded-full bg-muted px-3 py-1.5">Published {formatPublishedDate(snapshot.published_at)}</span>
      </div>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">{payload.summary}</p>
      <button type="button" onClick={onToggle} aria-expanded={open} className="mt-5 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
        {open ? 'Hide full route' : 'View full route'}
      </button>
      {open && (
        <div className="mt-6 grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
          <DeckList heading="Main" cards={payload.main} />
          <DeckList heading="Sideboard" cards={payload.sideboard} />
          {!!payload.warnings.length && (
            <section className="rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100 lg:col-span-2" aria-label="Warnings">
              <h4 className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Review notes</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">{payload.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>
            </section>
          )}
          {!!payload.references?.length && (
            <section className="lg:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">References</h4>
              <ul className="mt-2 flex flex-wrap gap-2">{payload.references.map((reference, index) => <li key={`${reference.url}-${index}`}><a className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-primary hover:border-primary" href={reference.url} target="_blank" rel="noreferrer">{reference.label}<ExternalLink size={13} /></a></li>)}</ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

export default function DeckMatrix() {
  const [snapshots, setSnapshots] = useState<PublicDeckSnapshot[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Commander Matrix · Public Brews & Shared Routes | MTG Tracker';
    let active = true;
    loadPublicDeckSnapshots().then((rows) => {
      if (!active) return;
      setSnapshots(rows);
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash && rows.some((row) => row.share_id === hash)) setOpenIds(new Set([hash]));
      setStatus('ready');
    }).catch((reason: unknown) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : 'Public deck snapshots are temporarily unavailable.');
      setStatus('error');
    });
    return () => { active = false; };
  }, []);

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <main className="container min-h-[75vh] py-8 sm:py-12">
      <header className="mx-auto max-w-4xl border-b-2 border-border pb-6">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Public deck shelf · art, color identity &amp; direct links</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Commander Matrix</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">Find a build by its commander and color identity, then jump straight to its public deck page. The matrix combines a curated public brew shelf with approved, sanitized shared-route snapshots.</p>
      </header>

      <PublicCommanderBrews />

      <section className="mx-auto mt-12 max-w-5xl" aria-label="Approved shared route snapshots" aria-live="polite">
        <div className="mb-5 border-b border-border pb-4">
          <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-primary">Shared routes · public snapshots</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Approved decklist snapshots</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">These approved snapshots show only their published summary, status, format, card lists, warnings, references, and publication date.</p>
        </div>
        {status === 'loading' && <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={17} /> Loading published snapshots…</div>}
        {status === 'error' && <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm leading-6">{error}</div>}
        {status === 'ready' && !snapshots.length && <div className="rounded-2xl border border-dashed border-border p-7 text-sm text-muted-foreground">No approved public snapshots are published yet.</div>}
        {status === 'ready' && <div className="grid gap-5">{snapshots.map((snapshot) => <SnapshotCard key={snapshot.share_id} snapshot={snapshot} open={openIds.has(snapshot.share_id)} onToggle={() => toggle(snapshot.share_id)} />)}</div>}
      </section>
    </main>
  );
}
