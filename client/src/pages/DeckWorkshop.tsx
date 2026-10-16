import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, FileUp, Loader2, Save, ShieldAlert, ShieldCheck, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { loadLocalSavedDecks, saveLocalDeck } from '@/lib/localSavedDecks';
import { formatWorkshopDecklist, lookupWorkshopCards, parseWorkshopDecklist, validateWorkshopDeck, WORKSHOP_FORMATS, workshopCollectionMatch, type WorkshopCardMetadata, type WorkshopFormat } from '@/lib/deckWorkshop';

function initialSavedDeck() {
  const restoreKey = new URLSearchParams(window.location.search).get('restore');
  if (!restoreKey) return null;
  const saved = loadLocalSavedDecks().find((deck) => deck.deckKey === restoreKey);
  if (!saved) return null;
  try {
    const payload = JSON.parse(saved.deckJson) as { commander?: Array<{ name: string; quantity: number }>; main?: Array<{ name: string; quantity: number }>; sideboard?: Array<{ name: string; quantity: number }>; format?: WorkshopFormat };
    const text = [
      ...(payload.commander?.length ? ['Commander', ...payload.commander.map((card) => `${card.quantity} ${card.name}`), ''] : []),
      'Deck', ...(payload.main || []).map((card) => `${card.quantity} ${card.name}`),
      ...(payload.sideboard?.length ? ['', 'Sideboard', ...payload.sideboard.map((card) => `${card.quantity} ${card.name}`)] : []),
    ].join('\n');
    return { key: saved.deckKey, name: saved.name, format: payload.format || 'commander', text };
  } catch { return null; }
}

function countOwned(name: string, collection: ReturnType<typeof loadOwnedCollection>) {
  return collection.filter((card) => card.name.trim().toLowerCase() === name.trim().toLowerCase()).reduce((total, card) => total + card.quantity, 0);
}

export default function DeckWorkshop() {
  const [initialSnapshot] = useState(initialSavedDeck);
  const [deckName, setDeckName] = useState(initialSnapshot?.name || 'My deck');
  const [format, setFormat] = useState<WorkshopFormat>(initialSnapshot?.format || 'commander');
  const [deckText, setDeckText] = useState(initialSnapshot?.text || '');
  const [metadata, setMetadata] = useState<Map<string, WorkshopCardMetadata>>(new Map());
  const [lookupStatus, setLookupStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedDeckKey, setSavedDeckKey] = useState(initialSnapshot?.key || '');
  const [budgetPerCard, setBudgetPerCard] = useState('5');
  const [swapCut, setSwapCut] = useState('');
  const [swapIn, setSwapIn] = useState('');
  const [swapStatus, setSwapStatus] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);

  const cards = useMemo(() => parseWorkshopDecklist(deckText), [deckText]);
  const deck = useMemo(() => ({ name: deckName, format, cards }), [deckName, format, cards]);
  const report = useMemo(() => validateWorkshopDeck(deck, metadata), [deck, metadata]);
  const collection = useMemo(() => loadOwnedCollection(), [deckText]);
  const matches = useMemo(() => workshopCollectionMatch(cards, collection), [cards, collection]);
  const missing = matches.filter((entry) => entry.missing > 0 && entry.zone !== 'sideboard');
  const unitPrices = missing.map((entry) => ({ ...entry, price: Number(metadata.get(entry.name.trim().toLowerCase())?.prices?.usd) })).filter((entry) => Number.isFinite(entry.price) && entry.price > 0);
  const missingEstimate = unitPrices.reduce((sum, entry) => sum + entry.price * entry.missing, 0);
  const maxPerCard = Number(budgetPerCard);
  const inBudget = Number.isFinite(maxPerCard) ? unitPrices.filter((entry) => entry.price <= maxPerCard) : [];
  const savedDecks = loadLocalSavedDecks().filter((item) => item.source === 'deck-workshop');

  async function checkLegality(names: string[] = []) {
    setLoading(true); setLookupStatus('Looking up card identities and format legality from Scryfall…');
    try {
      const extra = names.map((name) => ({ name, quantity: 1, zone: 'main' as const }));
      const updated = await lookupWorkshopCards([...cards, ...extra]);
      setMetadata((current) => new Map([...Array.from(current.entries()), ...Array.from(updated.entries())]));
      const unknownCount = cards.filter((card) => !updated.has(card.name.trim().toLowerCase()) && !metadata.has(card.name.trim().toLowerCase())).length;
      setLookupStatus(`Scryfall lookup complete for ${updated.size} matched card names${unknownCount ? `; ${unknownCount} remain unmatched` : ''}. This is not a tournament event ruling.`);
    } catch (error) {
      setLookupStatus(error instanceof Error ? error.message : 'Could not reach Scryfall. Existing deck text was not changed.');
    } finally { setLoading(false); }
  }

  function handleSave() {
    if (!cards.length) { setLookupStatus('Add a decklist before saving.'); return; }
    const slug = deckName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'saved-deck';
    const key = `workshop-${slug}`;
    const zone = (id: 'commander' | 'main' | 'sideboard') => cards.filter((card) => card.zone === id).map(({ name, quantity }) => ({ name, quantity }));
    saveLocalDeck({ deckKey: key, name: deckName.trim(), source: 'deck-workshop', href: `/deck-workshop?restore=${key}`, deckJson: JSON.stringify({ commander: zone('commander'), main: zone('main'), sideboard: zone('sideboard'), format }) });
    setSavedDeckKey(key); setLookupStatus(`“${deckName}” saved locally. It will be included in your Collection backup.`);
  }

  function restoreDeck(key: string) {
    const saved = loadLocalSavedDecks().find((item) => item.deckKey === key);
    if (!saved) return;
    try {
      const payload = JSON.parse(saved.deckJson) as { commander?: Array<{ name: string; quantity: number }>; main?: Array<{ name: string; quantity: number }>; sideboard?: Array<{ name: string; quantity: number }>; format?: WorkshopFormat };
      setDeckName(saved.name); setFormat(payload.format || 'commander');
      setDeckText([
        ...(payload.commander?.length ? ['Commander', ...payload.commander.map((card) => `${card.quantity} ${card.name}`), ''] : []),
        'Deck', ...(payload.main || []).map((card) => `${card.quantity} ${card.name}`),
        ...(payload.sideboard?.length ? ['', 'Sideboard', ...payload.sideboard.map((card) => `${card.quantity} ${card.name}`)] : []),
      ].join('\n'));
      setSavedDeckKey(key); setLookupStatus(`Restored “${saved.name}” from this browser. Re-run card lookup to refresh legality and price data.`);
    } catch { setLookupStatus('That saved deck snapshot could not be read.'); }
  }

  function downloadDeck() {
    const blob = new Blob([formatWorkshopDecklist(cards)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${deckName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'deck'}.txt`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function checkSwap() {
    if (!swapCut.trim() || !swapIn.trim()) { setSwapStatus('Enter both the card to cut and the proposed replacement.'); return; }
    setSwapLoading(true); setSwapStatus('Checking the proposed swap…');
    try {
      const updated = await lookupWorkshopCards([...cards, { name: swapCut.trim(), quantity: 1, zone: 'main' }, { name: swapIn.trim(), quantity: 1, zone: 'main' }]);
      setMetadata((current) => new Map([...Array.from(current.entries()), ...Array.from(updated.entries())]));
      const oldCard = updated.get(swapCut.trim().toLowerCase()); const newCard = updated.get(swapIn.trim().toLowerCase());
      if (!oldCard || !newCard) { setSwapStatus('One or both names were not matched by Scryfall; no legality or savings conclusion is available.'); return; }
      const legality = format === 'casual-60' ? 'casual rules not evaluated' : `replacement is ${newCard.legalities?.[format] || 'not verified'} in ${format}`;
      const commanders = cards.filter((entry) => entry.zone === 'commander').map((entry) => updated.get(entry.name.toLowerCase()) || metadata.get(entry.name.toLowerCase())).filter(Boolean) as WorkshopCardMetadata[];
      const allowed = new Set(commanders.flatMap((card) => card.color_identity || []));
      const offColor = format === 'commander' && newCard.color_identity?.some((color) => !allowed.has(color));
      const oldPrice = Number(oldCard.prices?.usd); const newPrice = Number(newCard.prices?.usd);
      const delta = Number.isFinite(oldPrice) && Number.isFinite(newPrice) ? oldPrice - newPrice : null;
      const owned = countOwned(newCard.name, collection);
      setSwapStatus(`${newCard.name}: ${legality}${offColor ? ' · outside Commander color identity' : ''}${delta !== null ? ` · estimated savings $${delta.toFixed(2)} per copy (dated/variable prices)` : ' · price comparison unavailable'} · ${owned} owned in your local collection. This checks legality, colors, price, and ownership—not deck synergy.`);
    } catch (error) { setSwapStatus(error instanceof Error ? error.message : 'Swap lookup failed.'); }
    finally { setSwapLoading(false); }
  }

  const activeFormat = WORKSHOP_FORMATS.find((item) => item.id === format)!;
  const cardLegality = (name: string) => metadata.get(name.toLowerCase())?.legalities?.[format];

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Browse releases</Link><nav className="flex gap-2"><Link href="/collection" className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary">Collection</Link><Link href="/dupe-decks" className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary">Themed 60-card</Link><Link href="/limited" className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary">Limited</Link></nav></div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
      <header className="border-b-2 border-primary pb-5"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Deck Workshop · Commander &amp; constructed</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Build, check, tune, and take your list with you.</h1><p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">Paste a decklist to check supported format legality and Commander color identity, compare exact quantities with your browser-local collection, review priced missing cards, test a budget swap, and save or export the list. Scryfall receives the card names only when you run the lookup; your collection is not uploaded.</p></header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <section className="space-y-4 border-2 border-border bg-card p-4 sm:p-6" aria-label="Deck list editor">
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold uppercase text-muted-foreground">Deck name<input value={deckName} onChange={(event) => setDeckName(event.target.value)} className="mt-1 min-h-11 w-full border border-border bg-background px-3 text-sm normal-case text-foreground" maxLength={100} /></label><label className="text-xs font-bold uppercase text-muted-foreground">Format<select value={format} onChange={(event) => setFormat(event.target.value as WorkshopFormat)} className="mt-1 min-h-11 w-full border border-border bg-background px-3 text-sm normal-case text-foreground">{WORKSHOP_FORMATS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
          <p className="border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground">{activeFormat.note}. Legality follows Scryfall’s record and may not capture event-specific rules, recent announcements, companion conditions, or judge interpretation.</p>
          <textarea value={deckText} onChange={(event) => { setDeckText(event.target.value); setMetadata(new Map()); setLookupStatus('Deck changed; re-run lookup to refresh legality.'); }} rows={18} aria-label="Decklist text" placeholder={'Commander\n1 Queen Marchesa\n\nDeck\n1 Sol Ring\n1 Arcane Signet\n\nSideboard\n1 Example card'} className="w-full border border-border bg-background p-3 font-mono text-xs leading-5 outline-none focus:border-primary" />
          <p className="font-mono text-xs text-muted-foreground">{report.cardCount} main + commander cards · {cards.filter((card) => card.zone === 'sideboard').reduce((sum, card) => sum + card.quantity, 0)} sideboard · {cards.length} distinct entries</p>
          <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => void checkLegality()} disabled={loading || !cards.length} className="min-h-11 gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Check with Scryfall</Button><Button type="button" variant="outline" onClick={handleSave} className="min-h-11 gap-2"><Save className="h-4 w-4" /> Save local snapshot</Button><Button type="button" variant="outline" onClick={downloadDeck} disabled={!cards.length} className="min-h-11 gap-2"><Download className="h-4 w-4" /> Export .txt</Button></div>
          {lookupStatus && <p role="status" className="border border-primary/30 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">{lookupStatus}</p>}
          {savedDecks.length > 0 && <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3"><label htmlFor="restore-local-deck" className="text-xs font-bold uppercase text-muted-foreground">Restore local deck</label><select id="restore-local-deck" value={savedDeckKey} onChange={(event) => setSavedDeckKey(event.target.value)} className="min-h-10 flex-1 border border-border bg-background px-2 text-sm"> <option value="">Choose a saved snapshot</option>{savedDecks.map((item) => <option key={item.deckKey} value={item.deckKey}>{item.name}</option>)}</select><Button type="button" variant="outline" className="min-h-10 gap-2" disabled={!savedDeckKey} onClick={() => restoreDeck(savedDeckKey)}><Upload className="h-4 w-4" /> Restore</Button></div>}
        </section>

        <div className="space-y-5">
          <section className="border-2 border-border bg-card p-4" aria-labelledby="legality-report-heading"><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /><h2 id="legality-report-heading" className="text-lg font-black">Legality &amp; color identity</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Every name needs a Scryfall match before its status can be assessed. A green status is not a substitute for current event rules.</p>
            {!cards.length ? <p className="mt-3 border border-dashed border-border p-3 text-xs text-muted-foreground">Paste or import a decklist to begin.</p> : <div className="mt-3 space-y-2">{report.errors.map((item) => <p key={item} className="border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">{item}</p>)}{report.warnings.map((item) => <p key={item} className="border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-800 dark:text-amber-300">{item}</p>)}{report.errors.length === 0 && report.warnings.length === 0 && metadata.size > 0 && <p className="flex items-center gap-2 border border-emerald-600/30 bg-emerald-600/5 p-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> No issues detected in the checks performed.</p>}{report.unverified.slice(0, 8).map((name) => <p key={name} className="text-xs text-muted-foreground">Not verified: {name}</p>)}{report.notLegal.map((name) => <p key={`illegal-${name}`} className="text-xs font-bold text-destructive">Not legal: {name}</p>)}{report.offColor.map((name) => <p key={`color-${name}`} className="text-xs font-bold text-destructive">Outside commander identity: {name}</p>)}</div>}
            <div className="mt-4 max-h-64 overflow-auto border-t border-border pt-3"><ul className="space-y-1">{cards.slice(0, 80).map((entry) => { const legality = cardLegality(entry.name); const owned = countOwned(entry.name, collection); return <li key={`${entry.zone}-${entry.name}-${entry.setCode}-${entry.collectorNumber}`} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate">{entry.quantity} × {entry.name}<span className="ml-1 text-[9px] uppercase text-muted-foreground">{entry.zone}</span></span><span className="shrink-0 font-mono text-[9px] text-muted-foreground">{format === 'casual-60' ? 'casual' : legality || 'unverified'} · {owned} owned</span></li>; })}</ul>{cards.length > 80 && <p className="mt-2 text-xs text-muted-foreground">Showing the first 80 rows. All {cards.length} entries are included in calculations.</p>}</div>
          </section>

          <section className="border-2 border-border bg-card p-4" aria-labelledby="collection-match-heading"><h2 id="collection-match-heading" className="text-lg font-black">Your collection match</h2><p className="mt-1 text-xs text-muted-foreground">Name-level matching when no printing is specified; exact printing match when set and collector number are present. This stays local.</p><p className="mt-2 font-mono text-sm font-bold text-primary">{matches.reduce((sum, entry) => sum + entry.owned, 0)} owned · {missing.reduce((sum, entry) => sum + entry.missing, 0)} missing</p>{missing.length > 0 && <div className="mt-2 max-h-36 overflow-auto space-y-1">{missing.slice(0, 20).map((item) => <p key={`${item.name}-${item.zone}`} className="flex justify-between gap-2 text-xs"><span>{item.name} <span className="text-muted-foreground">({item.owned}/{item.quantity})</span></span><span className="shrink-0">−{item.missing}</span></p>)}</div>}</section>

          <section className="border-2 border-border bg-card p-4" aria-labelledby="budget-heading"><h2 id="budget-heading" className="text-lg font-black">Missing-card budget</h2><p className="mt-1 text-xs text-muted-foreground">Estimated cost uses Scryfall USD printing references where available; it is not a live quote and excludes shipping, taxes, and unavailable prices.</p><p className="mt-2 text-2xl font-black text-primary">${missingEstimate.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">priced missing cards</span></p><label className="mt-2 block text-xs font-bold uppercase text-muted-foreground">Show missing singles at or under USD<input type="number" min="0" step="0.01" value={budgetPerCard} onChange={(event) => setBudgetPerCard(event.target.value)} className="mt-1 min-h-10 w-full border border-border bg-background px-3 text-sm normal-case text-foreground" /></label><p className="mt-2 text-xs">{inBudget.length} missing card entries currently meet that per-card ceiling.</p></section>
        </div>
      </div>

      <section className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-6" aria-labelledby="budget-swap-heading"><h2 id="budget-swap-heading" className="text-xl font-black">Commander / constructed budget swap checker</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Compare a cut with a proposed replacement for legality, Commander color identity, indexed price, and your local owned count. The tool does not evaluate synergy or claim that the new card is strategically better.</p><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input value={swapCut} onChange={(event) => setSwapCut(event.target.value)} placeholder="Card to cut" aria-label="Card to cut" className="min-h-11 border border-border bg-background px-3 text-sm" /><input value={swapIn} onChange={(event) => setSwapIn(event.target.value)} placeholder="Proposed replacement" aria-label="Proposed replacement" className="min-h-11 border border-border bg-background px-3 text-sm" /><Button type="button" onClick={() => void checkSwap()} disabled={swapLoading} className="min-h-11 gap-2">{swapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Check swap</Button></div>{swapStatus && <p role="status" className="mt-3 border border-border bg-card p-3 text-xs leading-5">{swapStatus}</p>}</section>

      <section className="border border-border bg-card p-4"><h2 className="font-bold">Supported checks</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{WORKSHOP_FORMATS.map((item) => <article key={item.id} className="border border-border bg-background p-3"><p className="font-mono text-xs font-black uppercase text-primary">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p></article>)}</div></section>
    </main>
  </div>;
}
