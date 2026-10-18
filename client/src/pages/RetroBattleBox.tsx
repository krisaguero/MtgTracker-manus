import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { battleBoxDeckPath } from '@/lib/battleBoxPaths';
import './battleBoxPrint.css';
import { ArrowDownToLine, ArrowRight, CircleAlert, Copy, Download, ExternalLink, FileJson2, FileUp, FolderOpen, Plus, Printer, RefreshCw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { loadOwnedCollection, parseManaBoxImport, type OwnedCard } from '@/lib/manaboxParser';
import { formatSelectedProxyPrintList, loadProxyPrintSupportEnabled, proxyPrintQuantity, saveProxyPrintSupportEnabled } from '@/lib/proxyPrint';
import {
  battleBoxPullListCsv,
  createBattleBoxPullList,
  deckListText,
  getRetroBattleBoxStats,
  loadLocalBattleBoxDrafts,
  mergeBattleBoxInventorySnapshots,
  parseBattleBoxDeckList,
  retroBattleBoxDecks,
  saveLocalBattleBoxDrafts,
  type LocalBattleBoxDraft,
  type RetroBattleBoxDeck,
} from '@/lib/retroBattleBox';

const colorHex: Record<string, string> = { W: '#c8b879', U: '#4e81b6', B: '#52506d', R: '#b95542', G: '#56836b' };
const colorName: Record<string, string> = { W: 'white', U: 'blue', B: 'black', R: 'red', G: 'green' };
const cardSearch = (name: string) => `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}`;

type InventoryState = { cards: OwnedCard[]; loaded: boolean; source: string };
type DraftDeckInput = { name: string; list: string };

function downloadFile(content: string, filename: string, type = 'text/plain') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function colorGradient(colors: string[]) {
  const hex = colors.map((color) => colorHex[color]).filter(Boolean);
  if (hex.length === 1) return `linear-gradient(140deg, ${hex[0]} 0%, #191c24 85%)`;
  return `linear-gradient(135deg, ${hex[0] || '#394254'} 0%, ${hex[1] || '#20242e'} 80%)`;
}

export default function RetroBattleBox() {
  const initialCollection = useMemo(() => loadOwnedCollection(), []);
  const [inventory, setInventory] = useState<InventoryState>({ cards: initialCollection, loaded: initialCollection.length > 0, source: initialCollection.length ? 'Saved browser collection' : 'No inventory loaded' });
  const [inventoryMessage, setInventoryMessage] = useState('');
  const [mergeMode, setMergeMode] = useState<'deduplicate' | 'add'>('deduplicate');
  const [query, setQuery] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<LocalBattleBoxDraft[]>(() => loadLocalBattleBoxDrafts());
  const [proxyPrintEnabled, setProxyPrintEnabled] = useState(() => loadProxyPrintSupportEnabled());
  const [selectedProxyNames, setSelectedProxyNames] = useState<string[]>([]);
  const [proxyPrintMessage, setProxyPrintMessage] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftAuthorName, setDraftAuthorName] = useState('');
  const [draftSourceCredit, setDraftSourceCredit] = useState('');
  const [draftDecks, setDraftDecks] = useState<DraftDeckInput[]>([{ name: 'Deck 1', list: '' }, { name: 'Deck 2', list: '' }]);
  const [draftError, setDraftError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const stats = useMemo(() => getRetroBattleBoxStats(), []);
  const pullList = useMemo(() => createBattleBoxPullList(retroBattleBoxDecks, inventory.cards), [inventory.cards]);
  const proxyPrintCandidates = proxyPrintEnabled ? pullList.filter((item) => proxyPrintQuantity(item, inventory.loaded) > 0) : [];
  const selectedProxyPrintList = formatSelectedProxyPrintList(proxyPrintCandidates, new Set(selectedProxyNames), inventory.loaded);
  const queuedItems = proxyPrintEnabled
    ? pullList.filter((item) => item.proxyMarked > 0 || (inventory.loaded && item.shortage > 0))
    : inventory.loaded ? pullList.filter((item) => item.shortage > 0) : [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleDecks = retroBattleBoxDecks.filter((deck) => !normalizedQuery || [deck.name, deck.subtitle, deck.summary, deck.archetype, deck.era, ...deck.engines.map((engine) => engine.card), ...deck.groups.flatMap((group) => group.cards.map((card) => card.name))].some((part) => part.toLocaleLowerCase().includes(normalizedQuery)));

  async function handleInventoryFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    try {
      const snapshots = await Promise.all(files.map(async (file) => ({ file, cards: parseManaBoxImport(await file.text()) })));
      const unreadable = snapshots.find((snapshot) => !snapshot.cards.length);
      if (unreadable) {
        setInventoryMessage(`No card rows could be read from ${unreadable.file.name}. No imported inventory was changed.`);
      } else {
        const merged = mergeBattleBoxInventorySnapshots(snapshots.map((snapshot) => snapshot.cards), mergeMode);
        setInventory({ cards: merged, loaded: true, source: `Temporary tab-only import · ${files.length} file${files.length === 1 ? '' : 's'}` });
        const mergeNote = files.length < 2 ? '' : mergeMode === 'deduplicate'
          ? ' Exact matching printings were deduplicated using the larger copy count; other printings remain separate.'
          : ' Scan quantities were added as separate piles.';
        setInventoryMessage(`${merged.length.toLocaleString()} inventory rows matched locally from ${files.length} file${files.length === 1 ? '' : 's'}.${mergeNote} Files were not uploaded or saved.`);
      }
    } catch {
      setInventoryMessage('Could not read that local file. Try exporting a CSV or plain text list.');
    } finally {
      input.value = '';
    }
  }

  function refreshSavedCollection() {
    const cards = loadOwnedCollection();
    setInventory({ cards, loaded: cards.length > 0, source: cards.length ? 'Saved browser collection' : 'No inventory loaded' });
    setInventoryMessage(cards.length ? `Refreshed ${cards.length.toLocaleString()} locally saved inventory rows.` : 'No collection is saved in this browser yet.');
  }

  function printQueue() {
    const cleanup = () => document.body.classList.remove('print-battle-box-queue');
    document.body.classList.add('print-battle-box-queue');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  }

  function updateProxyPrintSupport(enabled: boolean) {
    const saved = saveProxyPrintSupportEnabled(enabled);
    setProxyPrintEnabled(enabled);
    setSelectedProxyNames([]);
    setProxyPrintMessage(saved
      ? enabled ? 'Proxy-print support is enabled in this browser. No list has been shared.' : 'Proxy-print support is off; the ordinary collection and order-gap queue remains available.'
      : 'This browser could not save the preference. The switch applies until you leave this page.');
  }

  function toggleProxyPrintCard(name: string, checked: boolean) {
    setSelectedProxyNames((current) => checked
      ? current.includes(name) ? current : [...current, name]
      : current.filter((selected) => selected !== name));
    setProxyPrintMessage('');
  }

  async function copySelectedProxyList() {
    if (!selectedProxyPrintList) return;
    try {
      await navigator.clipboard.writeText(selectedProxyPrintList);
      setProxyPrintMessage('Selected card names and quantities copied. Paste them into a print service only if you choose.');
    } catch {
      setProxyPrintMessage('Clipboard access is unavailable here. Use Download selected list instead; nothing was sent to a service.');
    }
  }

  function saveDraft() {
    const invalid = draftDecks.map((deck, index) => ({ deck, index, parsed: parseBattleBoxDeckList(deck.list) })).filter(({ parsed }) => !parsed.isSixtyCards);
    if (!draftTitle.trim()) { setDraftError('Add a name for this Battle Box build.'); return; }
    if (draftDecks.length < 2 || draftDecks.length > 8) { setDraftError('A Battle Box draft needs 2–8 decks.'); return; }
    if (invalid.length) {
      const first = invalid[0]!;
      const name = first.deck.name.trim() || `Deck ${first.index + 1}`;
      setDraftError(`${name} needs exactly 60 cards. Current total: ${first.parsed.total}${first.parsed.invalidLines.length ? `; unparsed line: ${first.parsed.invalidLines[0]}` : ''}.`);
      return;
    }
    const newDraft: LocalBattleBoxDraft = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `draft-${Date.now()}`,
      title: draftTitle.trim(),
      description: draftDescription.trim(),
      authorName: draftAuthorName.trim(),
      sourceCredit: draftSourceCredit.trim(),
      createdAt: new Date().toISOString(),
      decks: draftDecks.map((deck, index) => ({ name: deck.name.trim() || `Deck ${index + 1}`, list: deck.list.trim() })),
    };
    const next = [newDraft, ...savedDrafts];
    if (!saveLocalBattleBoxDrafts(next)) { setDraftError('This browser could not save the draft. Exporting a build is still available after the browser storage issue is resolved.'); return; }
    setSavedDrafts(next);
    setDraftError('Saved privately in this browser. Use Export JSON to share the draft manually.');
  }

  function removeDraft(id: string) {
    const next = savedDrafts.filter((draft) => draft.id !== id);
    saveLocalBattleBoxDrafts(next);
    setSavedDrafts(next);
  }

  const fullDeckText = retroBattleBoxDecks.map(deckListText).join('\n\n');

  return <div className="min-h-screen bg-background text-foreground">
    <header className="relative overflow-hidden border-b-2 border-border bg-card">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" style={{ background: 'radial-gradient(circle at 15% 15%, rgba(185,85,66,.25), transparent 35%), radial-gradient(circle at 88% 82%, rgba(78,129,182,.22), transparent 36%)' }} />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-primary">Non-Commander · casual 1v1 · nine-deck library</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">2026 Retro Battle Box</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Nine ready-to-sleeve deck concepts spanning swarm, attrition, burn, ramp, control, tempo, and mono-white lifegain. Browse the visual layouts, inspect every card, then use a private local inventory queue to plan what to pull, order, or proxy.</p>
            <p className="mt-3 max-w-3xl border-l-2 border-primary pl-3 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Site creator &amp; curator: Kris Aguero.</strong> These are static shared lists—the same for every visitor, not tied to a sign-in or local account.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#deck-library" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground hover:opacity-90">Browse decks <ArrowRight className="h-4 w-4" /></a>
              <a href="#inventory-queue" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-background px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary"><FolderOpen className="h-4 w-4" /> Order / proxy queue</a>
              <Link href="/battle-box-method" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-background px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">How this was built <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[[stats.totalDecks, 'decks'], [stats.totalCards, 'cards'], [stats.proxyCopies, 'proxy copies']].map(([value, label]) => <div key={label} className="border-2 border-border bg-background/90 p-3 text-center sm:p-4"><strong className="block text-2xl font-black text-primary sm:text-3xl">{value}</strong><span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[10px]">{label}</span></div>)}
          </div>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-7xl space-y-10 px-4 py-7 sm:px-8 sm:py-10">
      <section className="grid gap-3 md:grid-cols-3" aria-label="Privacy and build summary">
        <div className="flex gap-3 border border-emerald-700/40 bg-emerald-700/5 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Inventory stays local</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">No collection file or ownership record is sent to a server. Optional AI is not used for this page.</p></div></div>
        <div className="flex gap-3 border border-amber-600/50 bg-amber-500/5 p-4"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Proxy total differs from handoff</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The annotated lists contain {stats.proxyDistinctNames} names / {stats.proxyCopies} copies, not the handoff summary of {stats.reportedProxyNames} / {stats.reportedProxyCopies}.</p></div></div>
        <div className="flex gap-3 border border-border bg-card p-4"><ArrowDownToLine className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Print or export</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Download all nine lists, export a CSV pull queue, or print only the queue for sorting.</p></div></div>
      </section>

      <section className="grid gap-4 border-2 border-primary/35 bg-primary/5 p-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:p-5" aria-label="Creator and submission attribution policy">
        <div><h2 className="font-mono text-xs font-black uppercase tracking-widest text-primary">Site creator &amp; curator</h2><p className="mt-2 text-sm leading-6"><strong>Kris Aguero</strong> created MTG Tracker and curates this shared Battle Box feature.</p></div>
        <div><h2 className="font-mono text-xs font-black uppercase tracking-widest text-primary">Community credit policy</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">User-submitted builds may be featured or remixed only with visible author and source credit; every remix keeps the original author credited. Public review/publishing is not enabled yet—the future roadmap calls for a dedicated reviewed backend. For now, drafts and exports stay with the person who creates them.</p><Link href="/roadmap" className="mt-2 inline-flex font-mono text-[10px] font-black uppercase tracking-wider text-primary underline">See the shared-review roadmap</Link></div>
      </section>

      {(stats.copyLimitWarnings.length > 0 || retroBattleBoxDecks.some((deck) => deck.warnings.length > 0)) && <section className="border-2 border-amber-600/50 bg-amber-500/5 p-4 sm:p-5" aria-labelledby="review-notes-heading">
        <h2 id="review-notes-heading" className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-300"><CircleAlert className="h-4 w-4" /> Source-list review notes</h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground md:grid-cols-2">{retroBattleBoxDecks.flatMap((deck) => deck.warnings.map((warning) => <li key={`${deck.id}-${warning}`}><strong className="text-foreground">{deck.name}:</strong> {warning}</li>))}{stats.copyLimitWarnings.map((warning) => <li key={`${warning.deck}-${warning.card}`}><strong className="text-foreground">{warning.deck}:</strong> {warning.copies} copies of {warning.card}; the supplied deck exceeds the usual four-copy constructed limit.</li>)}</ul>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">These notes preserve the supplied card names and quantities; Deck 9’s category correction changes no quantities. Review the original lists on the <Link href="/battle-box-method" className="font-semibold text-primary underline">method page</Link>.</p>
      </section>}

      <section id="deck-library" className="scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4">
          <div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Deck library · 9 layouts</p><h2 className="mt-2 text-3xl font-black">Pick a play pattern</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Each panel shows its color palette, nonlands-to-lands shape, featured engine cards, and a link to its own visual strategy guide. “Makes it hum” highlights are editorial synergy signposts, not playtest claims.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => downloadFile(fullDeckText, '2026-retro-battle-box-9-decks.txt')} className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-card px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"><Download className="h-4 w-4" /> Download all lists</button></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="min-w-[min(100%,18rem)] flex-1"><span className="sr-only">Search decks and cards</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a deck, card, or strategy…" className="min-h-11 w-full border-2 border-border bg-card px-3 text-sm outline-none focus:border-primary" /></label>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {visibleDecks.length} of {retroBattleBoxDecks.length} decks</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{visibleDecks.map((deck) => <DeckLayout key={deck.id} deck={deck} deckNumber={retroBattleBoxDecks.indexOf(deck) + 1} onDownload={() => downloadFile(deckListText(deck), `${deck.id}.txt`)} />)}</div>
        {visibleDecks.length === 0 && <p className="mt-4 border border-border bg-card p-5 text-sm text-muted-foreground">No deck or card matches that search.</p>}
      </section>

      <section id="inventory-queue" className="scroll-mt-20 border-2 border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="max-w-3xl"><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Private inventory tool</p><h2 className="mt-2 text-3xl font-black">{proxyPrintEnabled ? 'Printable pull / order / proxy queue' : 'Printable pull / order queue'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Requirements aggregate across all nine decks. The queue matches by card name while preserving local printing details; physical copies and existing proxies count separately. Imported records are processed in this tab only.</p></div>
          <div className="flex flex-wrap items-end gap-2 print:hidden">
            <label className="w-full max-w-sm text-[10px] font-bold uppercase tracking-wide text-muted-foreground">If importing multiple scans<select value={mergeMode} onChange={(event) => setMergeMode(event.target.value as 'deduplicate' | 'add')} className="mt-1 block min-h-10 w-full border-2 border-border bg-background px-2 text-xs font-medium normal-case text-foreground"><option value="deduplicate">Overlapping snapshots · dedupe exact printing by max</option><option value="add">Distinct piles · add all quantities</option></select></label>
            <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-10 items-center gap-2 border-2 border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground"><Upload className="h-4 w-4" /> Load local scans</button>
            <button type="button" onClick={refreshSavedCollection} className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"><RefreshCw className="h-4 w-4" /> Refresh saved collection</button>
            <button type="button" onClick={printQueue} className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"><Printer className="h-4 w-4" /> Print queue</button>
            <button type="button" onClick={() => downloadFile(battleBoxPullListCsv(pullList, inventory.loaded, proxyPrintEnabled), proxyPrintEnabled ? 'battle-box-order-proxy-queue.csv' : 'battle-box-order-queue.csv', 'text/csv')} className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"><FileUp className="h-4 w-4" /> Export CSV</button>
            <input ref={fileInput} type="file" accept=".csv,.txt,text/csv,text/plain" multiple onChange={(event) => void handleInventoryFile(event)} className="hidden" aria-label="Choose one or more local collection exports" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary bg-muted/30 px-4 py-3">
          <div><p className="text-sm font-bold">Inventory source: {inventory.source}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{inventory.loaded ? `${inventory.cards.length.toLocaleString()} distinct rows available for name matching.` : `No inventory is loaded. ${proxyPrintEnabled ? 'Source proxy-marked cards are listed; ' : ''}Import a collection to calculate additional order shortages.`}</p></div>
          <Link href="/collection" className="font-mono text-[10px] font-black uppercase tracking-wider text-primary underline">Collection tools</Link>
        </div>
        <section className="mt-4 border-2 border-border bg-background p-4 sm:p-5" aria-label="Optional proxy-print support">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h3 className="font-mono text-xs font-black uppercase tracking-widest">Optional proxy-print support · {proxyPrintEnabled ? 'enabled' : 'disabled'}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Off by default. This browser-only preference controls proxy-specific selection and print-service links. Turning it off leaves collection matching, missing-card counts, and the ordinary order queue available.</p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 border-2 border-border bg-card px-3 py-2 font-mono text-[10px] font-black uppercase focus-within:border-primary">
              <input type="checkbox" checked={proxyPrintEnabled} onChange={(event) => updateProxyPrintSupport(event.target.checked)} className="h-5 w-5 accent-primary" />
              Enable proxy-print support
            </label>
          </div>
          {proxyPrintEnabled && <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h4 className="font-bold">Select missing cards to make a print list</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{inventory.loaded ? `${proxyPrintCandidates.length} cards have a remaining print gap after real and held proxy copies.` : `${proxyPrintCandidates.length} source proxy-marked cards are eligible. Load a collection to include additional missing-card gaps.`} Selection starts empty; source proxy annotations alone never export automatically.</p></div>
              <Link href="/battle-box-proxy-print" className="inline-flex min-h-10 items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] font-black uppercase text-primary hover:border-primary">How-to &amp; print help <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={!proxyPrintCandidates.length} onClick={() => { setSelectedProxyNames(proxyPrintCandidates.map((item) => item.name)); setProxyPrintMessage('Eligible cards selected. Review the checked rows before copying or downloading.'); }} className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase disabled:opacity-40">Select all eligible</button>
              <button type="button" disabled={!selectedProxyNames.length} onClick={() => { setSelectedProxyNames([]); setProxyPrintMessage('Selection cleared.'); }} className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase disabled:opacity-40">Clear selection</button>
              <button type="button" disabled={!selectedProxyPrintList} onClick={() => void copySelectedProxyList()} className="inline-flex min-h-10 items-center gap-2 border-2 border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground disabled:opacity-40"><Copy className="h-4 w-4" /> Copy selected list</button>
              <button type="button" disabled={!selectedProxyPrintList} onClick={() => { downloadFile(selectedProxyPrintList, 'battle-box-selected-proxy-cards.txt'); setProxyPrintMessage('Downloaded only the selected card names and quantities.'); }} className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase disabled:opacity-40"><Download className="h-4 w-4" /> Download selected list</button>
              <a href="https://mtgprint.net/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">Open MTG Print <ExternalLink className="h-4 w-4" /></a>
              <a href="https://prox.cc/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">Open prox.cc <ExternalLink className="h-4 w-4" /></a>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-muted-foreground">Both services open without card data in the link. The tracker never auto-uploads: only after you deliberately paste or drop your selected list into a third-party service will that service receive it. The exported lines contain card names and quantities only—not collection rows, deck names, credentials, or AI keys.</p>
            {proxyPrintMessage && <p role="status" className="mt-2 text-xs font-semibold text-primary">{proxyPrintMessage}</p>}
          </div>}
          {!proxyPrintEnabled && proxyPrintMessage && <p role="status" className="mt-2 text-xs font-semibold text-primary">{proxyPrintMessage}</p>}
        </section>
        {inventoryMessage && <p role="status" className="mt-3 text-xs font-semibold text-primary">{inventoryMessage}</p>}
        <div id="battle-box-print-queue" className="mt-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div><h3 className="font-black">Cards that need attention</h3><p className="mt-1 text-xs text-muted-foreground">{queuedItems.length} unique names{proxyPrintEnabled ? ' · source proxy annotations are preserved' : ' · purchase/order gaps only'}.</p></div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{inventory.loaded ? proxyPrintEnabled ? 'Order gap = required − real owned · proxy gap excludes held proxies' : 'Order gap = required − real owned' : 'Load inventory to calculate order gaps'}</p>
          </div>
          {queuedItems.length ? <div className="overflow-x-auto border border-border">
            <table className={`w-full ${proxyPrintEnabled ? 'min-w-[1160px]' : 'min-w-[760px]'} border-collapse text-left text-xs`}>
              <thead className="bg-muted/50 font-mono text-[10px] font-black uppercase tracking-wider"><tr>{proxyPrintEnabled && <th className="p-2.5 print:hidden">Select</th>}<th className="p-2.5">Card</th><th className="p-2.5">Needed</th><th className="p-2.5">Real owned</th>{proxyPrintEnabled && <th className="p-2.5">Proxy held</th>}<th className="p-2.5">Order gap</th>{proxyPrintEnabled && <><th className="p-2.5">To proxy-print</th><th className="p-2.5">Source proxy</th></>}<th className="p-2.5">Matched printings</th><th className="p-2.5">Decks</th><th className="p-2.5 print:hidden">Flag</th></tr></thead>
              <tbody className="divide-y divide-border">{queuedItems.map((item) => {
                const printQuantity = proxyPrintQuantity(item, inventory.loaded);
                const checked = selectedProxyNames.includes(item.name);
                const matchedPrintings = item.matchedPrintings.filter((printing) => proxyPrintEnabled || !printing.proxy);
                return <tr key={item.name} className="odd:bg-background even:bg-muted/20">
                  {proxyPrintEnabled && <td className="p-2.5 print:hidden">{printQuantity > 0 ? <input type="checkbox" checked={checked} onChange={(event) => toggleProxyPrintCard(item.name, event.target.checked)} aria-label={`Select ${printQuantity} ${item.name} for the proxy print list`} className="h-4 w-4 accent-primary" /> : <span aria-label="No proxy print gap">—</span>}</td>}
                  <td className="p-2.5 font-bold"><a href={cardSearch(item.name)} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{item.name}</a></td>
                  <td className="p-2.5 font-mono">{item.quantity}</td><td className="p-2.5 font-mono">{inventory.loaded ? item.owned : '—'}</td>
                  {proxyPrintEnabled && <td className="p-2.5 font-mono">{inventory.loaded ? item.proxyOwned : '—'}</td>}
                  <td className="p-2.5 font-mono font-bold">{inventory.loaded ? item.shortage : '—'}</td>
                  {proxyPrintEnabled && <><td className="p-2.5 font-mono">{printQuantity || '—'}</td><td className="p-2.5 font-mono">{item.proxyMarked || '—'}</td></>}
                  <td className="max-w-64 p-2.5 text-[10px] leading-4 text-muted-foreground">{inventory.loaded && matchedPrintings.length ? matchedPrintings.map((printing) => `${printing.label} ×${printing.quantity}${printing.proxy ? ' (proxy)' : ''}`).join('; ') : inventory.loaded ? 'No matching physical copies' : '—'}</td>
                  <td className="max-w-56 p-2.5 text-muted-foreground">{item.usedBy.join(', ')}</td>
                  <td className="p-2.5 print:hidden">{inventory.loaded && item.shortage > 0 ? <span className="inline-flex border border-rose-700/40 bg-rose-600/10 px-2 py-1 font-mono text-[9px] font-black uppercase text-rose-800 dark:text-rose-300">{proxyPrintEnabled ? 'Order / proxy' : 'Order / obtain'}</span> : item.proxyMarked > 0 && proxyPrintEnabled ? <span className="inline-flex border border-amber-700/40 bg-amber-600/10 px-2 py-1 font-mono text-[9px] font-black uppercase text-amber-800 dark:text-amber-300">Proxy in source</span> : <span className="font-mono text-[9px] uppercase text-emerald-700">Covered</span>}</td>
                </tr>;
              })}</tbody>
            </table>
          </div> : <p className="border border-border bg-muted/20 p-4 text-sm text-muted-foreground">{inventory.loaded ? proxyPrintEnabled ? 'No source proxy-marked cards or additional shortages found for this loaded collection.' : 'No missing cards found for this loaded collection.' : proxyPrintEnabled ? 'No source proxy-marked cards are in the queue.' : 'Load a collection to calculate missing cards. Proxy-specific rows stay hidden while support is disabled.'}</p>}
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">{proxyPrintEnabled ? 'A proxy marker reflects the supplied build plan, not an ownership fact or recommendation to buy. Confirm local rules and printing before ordering; this queue does not make purchases.' : 'Collection gaps and matched physical printings are still shown. This queue does not make purchases.'}</p>
        </div>
      </section>

      <section id="community-builds" className="scroll-mt-20 border-2 border-primary/35 bg-primary/5 p-4 sm:p-6">
        <div className="max-w-4xl"><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Make a box of your own</p><h2 className="mt-2 text-3xl font-black">Create a private build draft</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Draft 2–8 sixty-card lists, save them only in this browser, and export JSON to share manually. Record the author and original source so credit travels with the export. There is no shared submission backend yet; nothing here publishes to the community.</p></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold">Battle Box name<input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="e.g. Kitchen-table throwbacks" className="mt-1.5 min-h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary" /></label>
          <label className="text-xs font-bold">Short description<input value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} placeholder="The play patterns or era you want to revisit" className="mt-1.5 min-h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary" /></label>
          <label className="text-xs font-bold">Author to credit<input value={draftAuthorName} onChange={(event) => setDraftAuthorName(event.target.value)} placeholder="Person or handle" className="mt-1.5 min-h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary" /></label>
          <label className="text-xs font-bold">Original source / source credit<input value={draftSourceCredit} onChange={(event) => setDraftSourceCredit(event.target.value)} placeholder="Source URL, publication, or original-build note" className="mt-1.5 min-h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-primary" /></label>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{draftDecks.map((deck, index) => {
          const parsed = parseBattleBoxDeckList(deck.list);
          return <article key={index} className="border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3"><label className="flex-1 text-xs font-bold">Deck {index + 1} name<input value={deck.name} onChange={(event) => setDraftDecks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className="mt-1.5 min-h-10 w-full border border-border bg-card px-3 text-sm outline-none focus:border-primary" /></label><span className={`mt-5 shrink-0 font-mono text-[10px] font-black uppercase ${parsed.isSixtyCards ? 'text-emerald-700' : 'text-amber-700 dark:text-amber-300'}`}>{parsed.total}/60</span></div>
            <label className="mt-3 block text-xs font-bold">Card list <span className="font-normal text-muted-foreground">(one line per card: <code>4 Lightning Bolt</code>)</span><textarea rows={8} value={deck.list} onChange={(event) => setDraftDecks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, list: event.target.value } : item))} placeholder={'4 Lightning Bolt\n22 Mountain\n…'} className="mt-1.5 w-full border border-border bg-card p-3 font-mono text-xs leading-5 outline-none focus:border-primary" /></label>
            {draftDecks.length > 2 && <button type="button" onClick={() => setDraftDecks((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Remove deck</button>}
          </article>;
        })}</div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" disabled={draftDecks.length >= 8} onClick={() => setDraftDecks((current) => [...current, { name: `Deck ${current.length + 1}`, list: '' }])} className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase disabled:opacity-40"><Plus className="h-4 w-4" /> Add deck</button>
          <button type="button" onClick={saveDraft} className="inline-flex min-h-10 items-center gap-2 border-2 border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground"><FolderOpen className="h-4 w-4" /> Save local draft</button>
          {draftError && <p role="status" className="text-xs font-semibold text-primary">{draftError}</p>}
        </div>
        {!!savedDrafts.length && <div className="mt-6 border-t border-border pt-5"><h3 className="font-black">Saved in this browser · {savedDrafts.length}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{savedDrafts.map((draft) => <article key={draft.id} className="flex items-start justify-between gap-3 border border-border bg-background p-4"><div><h4 className="font-bold">{draft.title}</h4><p className="mt-1 text-xs text-muted-foreground">By {draft.authorName || 'author not recorded'} · Source: {draft.sourceCredit || 'not recorded'}</p><p className="mt-1 text-xs text-muted-foreground">{draft.decks.length} decks · saved {new Date(draft.createdAt).toLocaleDateString()}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => downloadFile(JSON.stringify(draft, null, 2), `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'battle-box'}-draft.json`, 'application/json')} aria-label={`Export ${draft.title} as JSON`} className="border border-border p-2 text-primary hover:border-primary"><FileJson2 className="h-4 w-4" /></button><button type="button" onClick={() => removeDraft(draft.id)} aria-label={`Delete local draft ${draft.title}`} className="border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div></article>)}</div></div>}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <p className="max-w-3xl text-xs leading-5 text-muted-foreground">Static Battle Box lists are separate from personal collection data. Browser-local files and drafts are not included in public datasets. No Supabase schema or settings are required for these local workflows.</p>
        <Link href="/battle-box-method" className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary hover:underline">Read the method record <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </main>
  </div>;
}

function DeckLayout({ deck, deckNumber, onDownload }: { deck: RetroBattleBoxDeck; deckNumber: number; onDownload: () => void }) {
  const landGroup = deck.groups.find((group) => group.label === 'Lands');
  const nonlandCount = deck.groups.filter((group) => group.label !== 'Lands').flatMap((group) => group.cards).reduce((sum, card) => sum + card.quantity, 0);
  const landCount = landGroup?.cards.reduce((sum, card) => sum + card.quantity, 0) || 0;
  const proxyCopies = deck.groups.flatMap((group) => group.cards).filter((card) => card.proxy).reduce((sum, card) => sum + card.quantity, 0);
  const featuredArtwork = 'featuredArtwork' in deck ? deck.featuredArtwork ?? [] : [];
  const houseRule = 'houseRule' in deck ? deck.houseRule : null;
  return <article id={deck.id} className="flex scroll-mt-20 flex-col border-2 border-border bg-card shadow-sm">
    <div className="relative min-h-44 overflow-hidden p-4 text-white" style={{ background: colorGradient(deck.colors) }}>
      <div className="absolute -right-8 -top-6 h-36 w-24 rotate-12 rounded-xl border border-white/30 bg-white/10 shadow-xl" aria-hidden="true" />
      <div className="absolute -right-1 top-2 h-36 w-24 rotate-6 rounded-xl border border-white/40 bg-black/10 shadow-xl" aria-hidden="true" />
      <div className="relative z-10 flex min-h-36 flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-1.5"><span className="border border-white/50 bg-black/20 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest">Deck #{deckNumber}</span><span className="border border-white/50 bg-black/20 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest">{deck.archetype}</span></div><div className="flex gap-1" aria-label={`Colors: ${deck.colors.map((color) => colorName[color]).join(', ')}`}>{deck.colors.map((color) => <span key={color} title={colorName[color]} className="grid h-5 w-5 place-items-center rounded-full border border-white/60 bg-black/30 text-[9px] font-black">{color}</span>)}</div></div>
        <div><p className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/75">{deck.era}</p><h3 className="mt-1 max-w-[85%] text-xl font-black leading-tight"><Link href={battleBoxDeckPath(deck.id)} className="underline-offset-4 hover:underline">{deck.name}</Link></h3><p className="mt-1 text-xs font-semibold text-white/80">{deck.subtitle}</p></div>
      </div>
    </div>
    <div className="flex flex-1 flex-col p-4">
      <p className="min-h-12 text-xs leading-5 text-muted-foreground">{deck.summary}</p>
      {featuredArtwork.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Featured card artwork">{featuredArtwork.map((art) => <a key={art.name} href={cardSearch(art.name)} target="_blank" rel="noreferrer" title={art.name} className="block overflow-hidden border border-border bg-muted"><img src={art.imageUrl} alt={`${art.name} card artwork`} className="aspect-[5/7] w-full object-cover object-top" loading="lazy" decoding="async" /></a>)}</div>}
      <div className="mt-4" aria-label={`${nonlandCount} nonland cards and ${landCount} lands`}>
        <div className="flex h-3 overflow-hidden rounded-sm border border-border" title={`${nonlandCount} nonland cards / ${landCount} lands`}><span className="bg-primary" style={{ width: `${(nonlandCount / 60) * 100}%` }} /><span className="bg-muted-foreground/45" style={{ width: `${(landCount / 60) * 100}%` }} /></div>
        <div className="mt-1.5 flex justify-between font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground"><span>{nonlandCount} nonlands</span><span>{landCount} lands</span><span>60 cards</span></div>
      </div>
      {houseRule && <aside className="mt-4 border-2 border-primary/40 bg-primary/5 p-3" aria-label={`Optional house rule for ${deck.name}`}><h4 className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Optional house-rule overlay · not part of the 60</h4><p className="mt-2 text-xs leading-5"><strong>Boss:</strong> {houseRule.bossCard} (also listed in the main deck)</p><p className="mt-1 text-xs leading-5"><strong>Overlay activation:</strong> {houseRule.activation}</p><p className="mt-2 text-xs leading-5"><strong>Secret objective:</strong> {houseRule.objective}</p><p className="mt-1 text-xs leading-5"><strong>Trigger:</strong> {houseRule.trigger}</p><p className="mt-1 text-xs leading-5"><strong>Reward:</strong> {houseRule.reward}</p><p className="mt-2 border-t border-primary/20 pt-2 text-[10px] leading-4 text-muted-foreground">{houseRule.rulesNote}</p></aside>}
      <div className="mt-4 border-t border-border pt-3"><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Makes it hum · engine cards</p><ul className="mt-2 space-y-1.5">{deck.engines.map((engine) => <li key={engine.card} className="text-xs leading-5"><a href={cardSearch(engine.card)} target="_blank" rel="noreferrer" className="font-bold hover:text-primary hover:underline">{engine.card}</a><span className="text-muted-foreground"> — {engine.reason}</span></li>)}</ul></div>
      <div className="mt-3 flex flex-wrap gap-2"><span className="border border-border px-2 py-1 font-mono text-[9px] font-bold uppercase text-muted-foreground">{deck.groups.flatMap((group) => group.cards).length} card lines</span>{proxyCopies > 0 && <span className="border border-amber-700/40 bg-amber-600/10 px-2 py-1 font-mono text-[9px] font-black uppercase text-amber-800 dark:text-amber-300">{proxyCopies} proxy-marked</span>}</div>
      <Link href={battleBoxDeckPath(deck.id)} className="mt-4 inline-flex min-h-11 items-center justify-between gap-2 border-2 border-primary bg-primary px-3 py-3 font-mono text-[10px] font-black uppercase tracking-wide text-primary-foreground hover:opacity-90">Explore deck & strategy <ArrowRight className="h-4 w-4 shrink-0" /></Link>
      <button type="button" onClick={onDownload} className="mt-2 inline-flex min-h-11 items-center gap-2 border border-border px-3 py-2 font-mono text-[9px] font-black uppercase hover:border-primary"><Download className="h-3.5 w-3.5" /> Download this list</button>
    </div>
  </article>;
}
