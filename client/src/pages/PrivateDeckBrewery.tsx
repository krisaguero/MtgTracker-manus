import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpenText, FileUp, LockKeyhole, Search, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { PrivateDeckReviewTemplate } from '@/components/PrivateDeckReviewTemplate';
import { getPrivateDeckStatusLabel, buildPrivateBreweryIdeas } from '@/lib/privateBreweryIdeas';
import {
  consumePrivateBreweryAuthRedirect,
  importPrivateDeckBrewery,
  loadPrivateDeckBrewery,
  PRIVATE_BREWERY_EMAIL,
  PRIVATE_BREWERY_PROJECT_URL,
  requestPrivateBreweryEmailLink,
  validateDeckboxImportBundle,
  type DeckboxSourceCard,
  type DeckboxSourceRecord,
  type PrivateBreweryImportRecord,
  type PrivateBrewerySnapshot,
} from '@/lib/privateDeckBrewery';
import { getSupabasePublicConfig, type SupabasePublicConfig } from '@/lib/supabaseWorkspaceSync';

type PagePhase = 'loading' | 'unconfigured' | 'signed-out' | 'wrong-account' | 'ready' | 'error';
const config = getSupabasePublicConfig();

function totalCopies(cards: DeckboxSourceCard[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

function folderLabel(deck: DeckboxSourceRecord): string {
  const path = deck.folderPath;
  if (Array.isArray(path) && path.length) return path.map(String).join(' / ');
  return typeof deck.parentFolder === 'string' && deck.parentFolder ? deck.parentFolder : '_Unfiled';
}

function countToLabel(value: number): string {
  return `${value.toLocaleString()} ${value === 1 ? 'copy' : 'copies'}`;
}

function SourceCardRows({ cards, label }: { cards: DeckboxSourceCard[]; label: string }) {
  const copies = totalCopies(cards);
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-label={label}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold">{label}</h2>
        <span className="text-xs text-muted-foreground">{countToLabel(copies)} · {cards.length.toLocaleString()} source rows</span>
      </header>
      {cards.length ? (
        <ol className="divide-y divide-border/70">
          {cards.map((card, index) => (
            <li key={`${index}-${card.name}`} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 px-4 py-2.5 text-sm sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:px-6">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{card.quantity}×</span>
              <span>{card.name}</span>
            </li>
          ))}
        </ol>
      ) : <p className="px-4 py-5 text-sm text-muted-foreground sm:px-6">No source rows were exported for this section.</p>}
    </section>
  );
}

function importCaveats(record: PrivateBreweryImportRecord | null): string[] {
  const caveats = record?.bundle_metadata?.caveats;
  return Array.isArray(caveats) ? caveats.filter((item): item is string => typeof item === 'string') : [];
}

function AccessGate({
  phase,
  configValue,
  status,
  sent,
  busy,
  onRequestLink,
}: {
  phase: PagePhase;
  configValue: SupabasePublicConfig | null;
  status: string | null;
  sent: boolean;
  busy: boolean;
  onRequestLink: () => void;
}) {
  const unconfigured = phase === 'unconfigured' || !configValue;
  const wrongAccount = phase === 'wrong-account';
  return (
    <main className="mx-auto min-h-[75vh] max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole size={24} /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Private Deck Brewery</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your private brew shelf</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          The page is not protected by a hidden URL. It checks your Supabase sign-in and the database applies owner-only row-level security before any deck rows can be read.
        </p>
        {unconfigured ? (
          <div className="mt-7 rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
            This local preview is not connected to the approved private Supabase project. No deck data was requested. Configure the project’s public URL and publishable key for this preview; never put a service-role key in the browser.
          </div>
        ) : wrongAccount ? (
          <div className="mt-7 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm leading-6">
            This page is limited to the signed-in <strong>{PRIVATE_BREWERY_EMAIL}</strong> account. The other session was cleared from this tab; no deck rows were requested.
          </div>
        ) : sent ? (
          <div className="mt-7 rounded-2xl border border-emerald-600/30 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100">
            A one-time sign-in link was requested for <strong>{PRIVATE_BREWERY_EMAIL}</strong>. Open it in this same browser, then this page will verify the account before loading any deck data. No deck data has been uploaded.
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-border bg-background p-4 sm:p-5">
            <p className="text-sm font-semibold">Sign in to continue</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">A one-time email link signs in to the existing Supabase account; this page will not create a new account.</p>
            <Button type="button" onClick={onRequestLink} disabled={busy} className="mt-4 min-h-11 gap-2">
              <LockKeyhole size={16} /> {busy ? 'Requesting link…' : `Email a sign-in link to ${PRIVATE_BREWERY_EMAIL}`}
            </Button>
          </div>
        )}
        {status && <p role="status" className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-sm leading-6">{status}</p>}
        <div className="mt-7 grid gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
          <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Private rows stay in Supabase and are released only to the verified account.</p>
          <p className="flex gap-2"><BookOpenText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Recommendations are separate ideas. They never rewrite the imported source rows.</p>
        </div>
      </div>
    </main>
  );
}

function ImportPanel({
  configValue,
  snapshot,
  busy,
  status,
  onImport,
}: {
  configValue: SupabasePublicConfig;
  snapshot: PrivateBrewerySnapshot;
  busy: boolean;
  status: string | null;
  onImport: (file: File) => void;
}) {
  const inputId = 'private-deckbox-bundle';
  const canImport = !snapshot.importRecord || snapshot.importRecord.status !== 'complete';
  return (
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-7" aria-labelledby="private-import-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Private import</p>
      <h2 id="private-import-heading" className="mt-2 text-xl font-semibold">{snapshot.importRecord?.status === 'importing' ? 'Resume the interrupted import' : 'Load the reviewed Deckbox bundle'}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Choose the original reviewed JSON bundle. It is sent only to {new URL(configValue.url).host} using your verified user token; the browser does not send it to GitHub, a public endpoint, or an AI service. The source records are stored unchanged and verified before the import is marked complete.
      </p>
      {canImport ? (
        <div className="mt-4">
          <label htmlFor={inputId} className="sr-only">Choose reviewed Deckbox JSON bundle</label>
          <input id={inputId} type="file" accept=".json,application/json" disabled={busy} onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onImport(file);
            event.currentTarget.value = '';
          }} className="block w-full max-w-xl rounded-xl border border-border bg-background px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Source lists, main/sideboard separation, row order, title, folder data, counts, and caveats remain in their original fields. No list is changed or merged.</p>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><BadgeCheck size={17} />Import verified: {snapshot.importRecord?.record_count.toLocaleString()} source entries.</p>
      )}
      {status && <p role="status" className="mt-4 rounded-xl border border-border bg-background p-3 text-sm leading-6">{status}</p>}
    </section>
  );
}

function DeckIndex({ decks }: { decks: PrivateBrewerySnapshot['decks'] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const statuses = useMemo(() => Array.from(new Set(decks.map((row) => getPrivateDeckStatusLabel(row.source_record)))).sort(), [decks]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return decks.filter(({ source_record: deck }) => {
      const matchesSearch = !query || `${deck.name} ${folderLabel(deck)} ${String(deck.storedFormat || '')}`.toLocaleLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || getPrivateDeckStatusLabel(deck) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [decks, search, statusFilter]);
  return (
    <>
      <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
        <label className="relative block">
          <span className="sr-only">Search private decklists</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, folder, or saved format" className="min-h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-medium">Source status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm">
            <option value="all">All source statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Showing {filtered.length.toLocaleString()} of {decks.length.toLocaleString()} private source entries. Source counts are not a legality check or proof a deck is finished.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ deckbox_id: deckboxId, source_record: deck }) => (
          <Link key={deckboxId} href={`/private-deck-brewery/${encodeURIComponent(deckboxId)}`} className="group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{folderLabel(deck)}</p>
                <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-6 group-hover:text-primary">{deck.name}</h2>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-muted px-2.5 py-1">{getPrivateDeckStatusLabel(deck)}</span>
              {typeof deck.storedFormat === 'string' && <span className="rounded-full bg-muted px-2.5 py-1">{deck.storedFormat}</span>}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{totalCopies(deck.main).toLocaleString()} main · {totalCopies(deck.sideboard).toLocaleString()} sideboard · ID {deckboxId}</p>
          </Link>
        ))}
      </div>
      {!filtered.length && <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No private source entries match that search.</p>}
    </>
  );
}

function DeckDetail({ deck, manifest }: { deck: DeckboxSourceRecord; manifest: PrivateBreweryImportRecord | null }) {
  const ideas = useMemo(() => buildPrivateBreweryIdeas(deck), [deck]);
  const id = String(deck.id);
  const notes = Array.isArray(manifest?.bundle_metadata?.edhrecNotes) ? manifest.bundle_metadata.edhrecNotes as Array<Record<string, unknown>> : [];
  const reference = notes.find((note) => Array.isArray(note.deckIds) && note.deckIds.map(String).includes(id));
  const referenceUrl = typeof reference?.url === 'string' && /^https:\/\//.test(reference.url) ? reference.url : null;
  useEffect(() => {
    const old = document.title;
    document.title = `${deck.name} · Private Deck Brewery`;
    return () => { document.title = old; };
  }, [deck.name]);
  const exportedMain = typeof deck.mainCopiesExported === 'number' ? deck.mainCopiesExported : totalCopies(deck.main);
  const listedMain = typeof deck.mainCopiesListed === 'number' ? deck.mainCopiesListed : exportedMain;
  const exportStatus = deck.exportStatus === 'partial_hidden_scratchpad'
    ? 'This source has premium-hidden scratchpad rows that were not exported. Suggestions below use only the exported rows.'
    : deck.exportStatus === 'partial_paginated_source'
      ? `Partial paginated source: ${exportedMain.toLocaleString()} main copies were exported while the source metadata lists ${listedMain.toLocaleString()}. No missing rows have been invented.`
      : null;
  return (
    <>
      <Link href="/private-deck-brewery" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft size={16} />All private source entries</Link>
      <header className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Private source record · Deckbox ID {id}</p>
        <h1 className="mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl">{deck.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Folder: {folderLabel(deck)}{typeof deck.storedFormat === 'string' ? ` · Saved format: ${deck.storedFormat}` : ''}{typeof deck.displayedType === 'string' ? ` · Saved type: ${deck.displayedType}` : ''}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1.5">{getPrivateDeckStatusLabel(deck)}</span>
          {typeof deck.contextualTarget === 'number' && <span className="rounded-full bg-muted px-3 py-1.5">Contextual target: {deck.contextualTarget} · unverified</span>}
          <span className="rounded-full bg-muted px-3 py-1.5">{totalCopies(deck.main).toLocaleString()} main copies</span>
          <span className="rounded-full bg-muted px-3 py-1.5">{totalCopies(deck.sideboard).toLocaleString()} sideboard copies</span>
        </div>
        {exportStatus && <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">{exportStatus}</p>}
        {typeof deck.sourceUrl === 'string' && /^https:\/\//.test(deck.sourceUrl) && <p className="mt-4 text-xs text-muted-foreground">Original source URL is retained in the private record; it is not opened or shared automatically.</p>}
      </header>
      <section className="mt-8" aria-labelledby="private-suggestions-heading">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpenText size={19} /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Separate from source rows</p>
            <h2 id="private-suggestions-heading" className="mt-1 text-2xl font-bold">Three ways this brew could go</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">These are locally generated starting points based on the title, card-name signals, counts, and export status—not card adds, ownership matches, legality checks, or claims about the original author’s intent.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {ideas.map((idea) => (
            <article key={idea.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-base font-semibold">{idea.title}</h3>
              <p className="mt-3 text-sm leading-6">{idea.lead}</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {idea.steps.map((step) => <li key={step} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{step}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <PrivateDeckReviewTemplate deck={deck} edhrecUrl={referenceUrl} />
      <div className="mt-8 grid gap-4">
        <SourceCardRows cards={deck.main} label="Original main list · source order preserved" />
        <SourceCardRows cards={deck.sideboard} label="Original sideboard · kept separate" />
      </div>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">Raw source metadata, original main rows, sideboard rows, quantities, and order are kept as imported. Recommendations are not saved into the source record and nothing is automatically edited, moved, or merged.</p>
    </>
  );
}

export default function PrivateDeckBrewery() {
  const { deckboxId } = useParams<{ deckboxId?: string }>();
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [snapshot, setSnapshot] = useState<PrivateBrewerySnapshot | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  async function refreshSnapshot(configValue: SupabasePublicConfig) {
    const loaded = await loadPrivateDeckBrewery(configValue);
    setSnapshot(loaded);
    setPhase('ready');
  }

  useEffect(() => {
    let alive = true;
    async function start() {
      if (!config) {
        if (alive) setPhase('unconfigured');
        return;
      }
      try {
        await consumePrivateBreweryAuthRedirect(config);
        const loaded = await loadPrivateDeckBrewery(config);
        if (alive) {
          setSnapshot(loaded);
          setPhase('ready');
        }
      } catch (error) {
        if (!alive) return;
        const message = error instanceof Error ? error.message : 'Private Deck Brewery could not be opened.';
        if (message.startsWith('Sign in to the')) setPhase('signed-out');
        else if (message.includes(PRIVATE_BREWERY_EMAIL)) setPhase('wrong-account');
        else {
          setPhase('error');
          setStatus(message);
        }
      }
    }
    void start();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'ready' || !snapshot?.importRecord || snapshot.importRecord.status !== 'complete') return;
    const old = document.title;
    document.title = deckboxId ? 'Private Deck · Deck Brewery' : 'Private Deck Brewery';
    return () => { document.title = old; };
  }, [deckboxId, phase, snapshot?.importRecord]);

  async function requestLink() {
    if (!config) return;
    setBusy(true);
    setStatus(null);
    try {
      const path = window.location.pathname.startsWith('/private-deck-brewery') ? window.location.pathname : '/private-deck-brewery';
      await requestPrivateBreweryEmailLink(config, `${window.location.origin}${path}`);
      setSent(true);
      setStatus('Check the inbox for the one-time link. No data has been uploaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The sign-in link could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(file: File) {
    if (!config || !snapshot) return;
    setBusy(true);
    setImportStatus(null);
    try {
      const rawText = await file.text();
      let bundle: unknown;
      try { bundle = JSON.parse(rawText); }
      catch { throw new Error('The selected file is not valid JSON. Nothing was imported.'); }
      if (!validateDeckboxImportBundle(bundle)) throw new Error('The selected file is not the reviewed Deckbox bundle format. Nothing was imported.');
      const result = await importPrivateDeckBrewery(bundle, rawText, config, (message) => setImportStatus(message));
      setImportStatus(`Verified all ${result.imported.toLocaleString()} source entries (SHA-256 ${result.sourceHash.slice(0, 12)}…).`);
      await refreshSnapshot(config);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'The private import failed.');
    } finally {
      setBusy(false);
    }
  }

  if (phase !== 'ready' || !snapshot) {
    if (phase === 'error') {
      return <AccessGate phase="signed-out" configValue={config} status={status} sent={sent} busy={busy} onRequestLink={() => void requestLink()} />;
    }
    if (phase !== 'loading') {
      return <AccessGate phase={phase} configValue={config} status={status} sent={sent} busy={busy} onRequestLink={() => void requestLink()} />;
    }
    return <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-14"><p role="status" className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">Checking the private account session… No deck rows are requested until that check succeeds.</p></main>;
  }

  const complete = snapshot.importRecord?.status === 'complete'
    && snapshot.decks.length === snapshot.importRecord.record_count;
  const selected = deckboxId ? snapshot.decks.find((row) => row.deckbox_id === decodeURIComponent(deckboxId)) : null;
  const caveats = importCaveats(snapshot.importRecord);

  return (
    <main className="mx-auto min-h-[75vh] max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><LockKeyhole size={21} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Private · owner-locked</p><p className="mt-1 text-xs text-muted-foreground">Verified account: {PRIVATE_BREWERY_EMAIL}</p></div>
          </div>
          <span className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground">Supabase project: {new URL(PRIVATE_BREWERY_PROJECT_URL).host}</span>
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Deck Brewery · private shelves</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">All the sketches, not just the nearly finished ones</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Browse each saved list on its own page—including empty stubs, candidate pools, and half-built ideas. The original source stays intact; each detail page offers separate Commander, custom Brawlternative, and Battle Box directions.</p>
        {complete && <p className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-600/25 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100"><ShieldCheck size={17} />{snapshot.decks.length.toLocaleString()} source entries · source rows verified against the imported bundle</p>}
      </header>

      {!complete ? (
        <div className="mt-6">
          <ImportPanel configValue={config!} snapshot={snapshot} busy={busy} status={importStatus} onImport={(file) => void handleImport(file)} />
        </div>
      ) : selected ? (
        <div className="mt-7">
          <DeckDetail deck={selected.source_record} manifest={snapshot.importRecord} />
        </div>
      ) : deckboxId ? (
        <section className="mt-7 rounded-2xl border border-border bg-card p-6">
          <Link href="/private-deck-brewery" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><ArrowLeft size={16} />Back to all source entries</Link>
          <h2 className="mt-4 text-xl font-semibold">That private deck page was not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">Only imported Deckbox IDs are addressable in this signed-in account.</p>
        </section>
      ) : (
        <div className="mt-6">
          {caveats.length > 0 && <details className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
            <summary className="cursor-pointer font-semibold">Important source and export caveats</summary>
            <ul className="mt-3 list-disc space-y-2 pl-5">{caveats.map((caveat, index) => <li key={`${index}-${caveat}`}>{caveat}</li>)}</ul>
          </details>}
          <DeckIndex decks={snapshot.decks} />
        </div>
      )}
      <footer className="mt-10 flex flex-wrap items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
        <FileUp className="mt-0.5 h-4 w-4 shrink-0" />The page reads and writes only the approved Supabase project at {PRIVATE_BREWERY_PROJECT_URL}. Importing is a user-scoped request; RLS still checks the owner and account email on the server.
      </footer>
    </main>
  );
}
