import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, ExternalLink, FileUp, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import {
  clearPrivateDeckBreweryBundle,
  countBreweryCopies,
  formatOriginalBreweryDecklist,
  loadPrivateDeckBreweryBundle,
  parseDeckBreweryBundle,
  savePrivateDeckBreweryBundle,
  type BreweryCard,
  type BreweryDeck,
  type DeckBreweryBundle,
} from '@/lib/deckBreweryStorage';

const statusLabels: Record<string, string> = {
  count_compatible_unverified: 'Count-compatible · unverified',
  under_target: 'Below contextual target',
  over_target_candidate_pool: 'Over target · possible pool',
  empty: 'No main-deck cards',
  reference: 'Reference / other purpose',
};

const filterOptions = [
  { value: 'candidates', label: 'Potential work first' },
  { value: 'all', label: 'All exported entries' },
  { value: 'no-lands', label: 'No main-deck lands' },
  { value: 'under_target', label: 'Below target' },
  { value: 'over_target_candidate_pool', label: 'Over-target candidate pools' },
  { value: 'count_compatible_unverified', label: 'Count-compatible, unverified' },
  { value: 'reference', label: 'Reference / other purpose' },
  { value: 'empty', label: 'Empty lists' },
];

function statusStyle(status: string) {
  if (status === 'count_compatible_unverified') return 'border-emerald-700/40 bg-emerald-600/5 text-emerald-800 dark:text-emerald-300';
  if (status === 'over_target_candidate_pool') return 'border-amber-700/40 bg-amber-500/10 text-amber-900 dark:text-amber-200';
  if (status === 'empty') return 'border-red-700/40 bg-red-500/5 text-red-800 dark:text-red-300';
  return 'border-border bg-muted/40 text-muted-foreground';
}

function slug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'brewery-deck';
}

function downloadOriginal(deck: BreweryDeck) {
  const blob = new Blob([formatOriginalBreweryDecklist(deck)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slug(deck.name)}-original.txt`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function DeckRows({ cards, label }: { cards: BreweryCard[]; label: string }) {
  const copies = countBreweryCopies(cards);
  return <section className="border border-border bg-background p-3 sm:p-4" aria-label={label}>
    <h4 className="flex items-center justify-between gap-2 border-b border-border pb-2 font-mono text-[10px] font-black uppercase tracking-widest"><span>{label}</span><span>{copies} copies · {cards.length} rows</span></h4>
    {cards.length ? <ul className="mt-2 divide-y divide-border/70">
      {cards.map((card, index) => <li key={`${card.name}-${index}`} className="py-1.5 text-xs leading-5">
        <span className="mr-2 font-mono font-bold text-muted-foreground">{card.quantity}×</span><span>{card.name}</span>
        {card.notes?.map((note, noteIndex) => <p key={`${card.name}-note-${noteIndex}`} className="ml-8 text-[11px] text-muted-foreground">Source note: {note}</p>)}
      </li>)}
    </ul> : <p className="mt-3 text-xs text-muted-foreground">No cards were exported in this section.</p>}
  </section>;
}

function DeckRecord({ deck, bundle }: { deck: BreweryDeck; bundle: DeckBreweryBundle }) {
  const edhrecNotes = bundle.edhrecNotes.filter((note) => note.deckIds.includes(deck.id));
  const mismatch = deck.mainCopiesListed !== null && deck.mainCopiesListed !== deck.mainCopiesExported;
  return <article id={`deck-${deck.id}`} className="scroll-mt-24 border-2 border-border bg-card">
    <header className="border-b border-border bg-primary/[0.035] p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        <span className={`border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider ${statusStyle(deck.status)}`}>{statusLabels[deck.status] || deck.status}</span>
        {deck.focusLabel && <span className="border border-primary/40 bg-primary/5 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">Review first · {deck.focusLabel}</span>}
        {deck.mainLandCopies === 0 && <span className="border border-amber-700/40 bg-amber-500/10 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">No lands listed in main</span>}
      </div>
      <h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{deck.name}</h2>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="border border-border bg-background px-2.5 py-1.5"><strong>Original folder:</strong> {deck.parentFolder}</span>
        <span className="border border-border bg-background px-2.5 py-1.5"><strong>Exported main:</strong> {deck.mainCopiesExported}</span>
        <span className="border border-border bg-background px-2.5 py-1.5"><strong>Sideboard:</strong> {deck.sideboardCopiesExported}</span>
        <span className="border border-border bg-background px-2.5 py-1.5"><strong>Main lands:</strong> {deck.mainLandCopies}</span>
        {deck.contextualTarget !== null && <span className="border border-border bg-background px-2.5 py-1.5"><strong>Review target:</strong> {deck.contextualTarget}</span>}
        <span className="border border-border bg-background px-2.5 py-1.5"><strong>Stored format:</strong> {deck.storedFormat}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground"><strong>Source type:</strong> {deck.displayedType} · <strong>Authorship:</strong> {deck.ownerAuthorDisplayed || deck.authorNote || 'Not shown in the saved page'}</p>
      {mismatch && <p className="mt-3 border-l-4 border-amber-600 bg-amber-500/5 p-3 text-xs leading-5"><strong>Partial-export warning:</strong> the index lists {deck.mainCopiesListed} main copies, but {deck.mainCopiesExported} were included here. Do not treat the extracted list as complete.</p>}
      {deck.reviewNote && <p className="mt-3 border-l-4 border-primary bg-primary/5 p-3 text-xs leading-5">{deck.reviewNote}</p>}
      {deck.reviewFlags.map((flag, index) => <p key={`${deck.id}-flag-${index}`} className="mt-2 text-xs leading-5 text-muted-foreground">Review flag: {flag}</p>)}
      {deck.notesText.map((note, index) => <p key={`${deck.id}-note-${index}`} className="mt-2 border-l-2 border-border pl-3 text-xs leading-5 text-muted-foreground">Source note: {note}</p>)}
      {deck.notesLinks.map((link, index) => <a key={`${deck.id}-link-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" className="mt-2 mr-3 inline-flex items-center gap-1 text-xs text-primary underline">{link.text || 'Source note link'} <ExternalLink className="h-3 w-3" /></a>)}
      <a href={deck.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-1 border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-primary">Open original Deckbox page <ExternalLink className="h-3.5 w-3.5" /></a>
    </header>
    {edhrecNotes.length > 0 && <section className="border-b border-dashed border-primary/50 bg-primary/[0.025] p-4 sm:p-5" aria-label="Separate EDHREC reference notes">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-mono text-xs font-black uppercase tracking-widest">EDHREC baseline · separate from original</h3><a href={edhrecNotes[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline">{edhrecNotes[0].commander} average deck <ExternalLink className="h-3 w-3" /></a></div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px]">{edhrecNotes[0].themes.map((theme) => <span key={theme} className="border border-primary/30 bg-background px-2 py-1">{theme}</span>)}<span className="border border-primary/30 bg-background px-2 py-1">EDHREC sample: {edhrecNotes[0].averageSampleLandCount} lands</span></div>
      <p className="mt-3 max-w-5xl text-xs leading-5 text-muted-foreground">{edhrecNotes[0].note} No EDHREC card or land has been inserted into the source list.</p>
    </section>}
    <details className="border-b border-border">
      <summary className="cursor-pointer px-4 py-3 text-xs font-bold hover:text-primary sm:px-5">Open original cardlists · {deck.mainCopiesExported} main + {deck.sideboardCopiesExported} sideboard · kept separate</summary>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <DeckRows cards={deck.main} label="Original main list" />
        <DeckRows cards={deck.sideboard} label="Original sideboard · kept separate" />
      </div>
    </details>
    <footer className="flex flex-wrap items-center gap-2 border-t border-border p-4 sm:px-5">
      <button type="button" onClick={() => downloadOriginal(deck)} className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"><Download className="h-4 w-4" /> Download original .txt</button>
      <span className="text-[11px] text-muted-foreground">Download preserves main and sideboard separately; it does not add suggested cards.</span>
    </footer>
  </article>;
}

export default function DeckBrewery() {
  const [bundle, setBundle] = useState<DeckBreweryBundle | null>(() => loadPrivateDeckBreweryBundle());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('candidates');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const decks = useMemo(() => {
    if (!bundle) return [];
    const query = search.trim().toLowerCase();
    return bundle.decks.filter((deck) => {
      const textMatch = !query || [deck.name, deck.parentFolder, deck.reviewNote || '', ...deck.notesText].join(' ').toLowerCase().includes(query);
      if (!textMatch) return false;
      if (filter === 'candidates') return ['under_target', 'over_target_candidate_pool', 'empty'].includes(deck.status);
      if (filter === 'no-lands') return deck.mainLandCopies === 0 && deck.contextualTarget === 100;
      if (filter === 'all') return true;
      return deck.status === filter;
    }).sort((a, b) => {
      const priorityA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const distanceA = a.contextualTarget === null ? Number.MAX_SAFE_INTEGER : Math.abs(a.contextualTarget - a.mainCopiesExported);
      const distanceB = b.contextualTarget === null ? Number.MAX_SAFE_INTEGER : Math.abs(b.contextualTarget - b.mainCopiesExported);
      return distanceA - distanceB || a.name.localeCompare(b.name);
    });
  }, [bundle, filter, search]);

  const underCount = bundle?.decks.filter((deck) => deck.status === 'under_target').length ?? 0;
  const overCount = bundle?.decks.filter((deck) => deck.status === 'over_target_candidate_pool').length ?? 0;
  const noLandCount = bundle?.decks.filter((deck) => deck.mainLandCopies === 0 && deck.contextualTarget === 100).length ?? 0;

  async function importBundle(file?: File) {
    if (!file) return;
    setBusy(true);
    setStatus('Reading the file in this browser…');
    try {
      const parsed = parseDeckBreweryBundle(await file.text());
      savePrivateDeckBreweryBundle(parsed);
      setBundle(parsed);
      setSearch('');
      setFilter('candidates');
      setStatus(`Loaded ${parsed.decks.length} deck records into this browser’s private Brewery view. No decklist was sent to an app API.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The private import could not be loaded.');
    } finally {
      setBusy(false);
    }
  }

  function clearBundle() {
    clearPrivateDeckBreweryBundle();
    setBundle(null);
    setStatus('The private Brewery import was removed from this browser. Your original private JSON file remains unchanged.');
  }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-10">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <p className="mt-6 font-mono text-xs font-black uppercase tracking-[0.22em] text-primary">Private local workspace · no shared deck content</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Deck Brewery</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">A place to inspect older, partial, and candidate decklists before deciding what to keep, tune, or set aside. Original main lists and sideboards stay unchanged. EDHREC ideas are shown separately and never inserted automatically.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="border border-border bg-background p-3"><strong className="block text-xl">{bundle?.decks.length ?? 0}</strong><span className="text-xs text-muted-foreground">private imported entries</span></div>
          <div className="border border-border bg-background p-3"><strong className="block text-xl">{underCount}</strong><span className="text-xs text-muted-foreground">below contextual count target</span></div>
          <div className="border border-border bg-background p-3"><strong className="block text-xl">{overCount} / {noLandCount}</strong><span className="text-xs text-muted-foreground">over-target pools / Commander lists with no main lands</span></div>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
      <section className="flex flex-wrap items-center justify-between gap-4 border-2 border-primary/35 bg-primary/[0.035] p-4 sm:p-5" aria-label="Public Deck Brewery recommendations">
        <div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Open to everyone · no sign-in</p><h2 className="mt-1 text-lg font-black">Browse the public proposal shelf</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">166 individual review pages, with card art, proposed changes, count notes, and source links. Public proposals are separate from this browser-local workspace.</p></div>
        <Link href="/deck-brewery/reviews" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90">Open public reviews <ArrowRight className="h-4 w-4" /></Link>
      </section>
      <section className="border-2 border-primary/40 bg-primary/[0.035] p-4 sm:p-5" aria-label="Private data handling">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Local-only data handling</h2><p className="mt-2 max-w-5xl text-xs leading-5 text-muted-foreground">The import is read in your browser and stored under a dedicated browser-local key excluded from cloud-workspace backup. Browser storage is not encrypted, and scripts running on this site origin may be able to read it, so import only on a device/browser you trust. The decklist is not sent to an app API or added to this repository, public deck content, Supabase, or Notion. Keep friends’ lists here unless authorship and permission are clear. Clear this browser’s copy any time; the source JSON file is not changed.</p></div></div>
      </section>

      <section className="grid gap-4 border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5" aria-label="Import private review bundle">
        <div><h2 className="text-lg font-black">Load the private review bundle</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Choose a local JSON file containing exported lists and source notes. Separate reference notes stay distinct from the original lists.</p>
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground hover:opacity-90"><FileUp className="h-4 w-4" /> {busy ? 'Loading…' : 'Choose private JSON'}<input type="file" accept="application/json,.json" className="sr-only" disabled={busy} onChange={(event) => { void importBundle(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} /></label>
        </div>
        <button type="button" onClick={clearBundle} disabled={!bundle || busy} className="inline-flex min-h-10 items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-xs font-bold hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4" /> Clear browser copy</button>
        {status && <p role="status" className="border-l-4 border-primary bg-primary/5 p-3 text-xs leading-5 text-muted-foreground sm:col-span-2">{status}</p>}
      </section>

      <section className="border border-border bg-card p-4 sm:p-5" aria-labelledby="next-use-heading">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="next-use-heading" className="text-lg font-black">Possible next uses · not conversions</h2><p className="mt-1 max-w-4xl text-xs leading-5 text-muted-foreground">These routes are places to work on a separate draft. Nothing here changes a shared list, moves cards, or publishes a deck.</p></div><ArrowRight className="h-5 w-5 text-primary" /></div>
        <div className="mt-3 flex flex-wrap gap-2"><Link href="/deck-workshop" className="min-h-10 border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary">Deck Workshop · test a separate draft</Link><Link href="/brawl-box" className="min-h-10 border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary">Brawlternatives · 60-card Commander preview</Link><Link href="/battle-box" className="min-h-10 border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary">Retro Battle Box · non-Commander duel lists</Link><Link href="/dupe-decks" className="min-h-10 border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary">Themed 60-card decks</Link></div>
      </section>

      {bundle ? <>
        <section className="grid gap-3 border-y border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" aria-label="Filter deck entries">
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Search deck or source folder
            <span className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full border border-border bg-background pl-9 pr-3 text-sm font-normal normal-case text-foreground" placeholder="Deck name or folder…" /></span>
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Show
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 border border-border bg-background px-3 text-sm font-normal normal-case text-foreground">{filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          </label>
          <p className="pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{decks.length} shown · review order first</p>
        </section>
        {decks.length ? <div className="space-y-5">{decks.map((deck) => <DeckRecord key={deck.id} deck={deck} bundle={bundle} />)}</div> : <div className="border border-border bg-card p-8 text-center"><h2 className="font-black">No matching deck entries</h2><p className="mt-2 text-sm text-muted-foreground">Try another filter or clear the search.</p></div>}
        <section className="border-t-2 border-border pt-5"><h2 className="text-lg font-black">Export limitations and review cautions</h2><ul className="mt-2 max-w-5xl list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">{bundle.caveats.map((caveat, index) => <li key={`caveat-${index}`}>{caveat}</li>)}</ul><p className="mt-3 text-[11px] leading-5 text-muted-foreground">Bundle source: {bundle.source}</p></section>
      </> : <section className="border-2 border-dashed border-border bg-card p-8 text-center"><h2 className="text-lg font-black">Your private Brewery shelf is empty</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Load the private review bundle when you are ready. The page contains no hard-coded decklists and will not fetch any deck content by itself.</p></section>}
    </main>
  </div>;
}
