import { CalendarDays, ExternalLink, Eye, Package, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { InternalPageNav } from '@/components/InternalPageNav';
import { VerifiedSpoilerGallery } from '@/components/VerifiedSpoilerGallery';
import { mtgjsonPreconCatalog } from '@/data/mtgjsonPreconCatalog';

const events = [
  {
    date: 'Oct 19, 2026',
    sort: '2026-10-19',
    title: 'Festival in a Box: Atlanta 2026 goes on sale',
    type: 'Sale date',
    detail: 'The Festival in a Box package includes a Mystery Booster Commander Edition box. Wizards lists it at $249.99, while supplies last. This is a draft-booster product, not a preconstructed deck.',
    source: 'Official announcement',
    href: 'https://magic.wizards.com/en/news/announcements/secret-lair-heads-south-with-festival-in-a-box-atlanta-2026-and-mystery-booster-commander-edition',
    tone: 'amber',
  },
  {
    date: 'Nov 13, 2026',
    sort: '2026-11-13',
    title: 'Magic: The Gathering | Star Trek tabletop release',
    type: 'Set release',
    detail: 'Four ready-to-play Commander decks are confirmed: Federation Fleet, Landing Party, Klingon Fury, and We Are the Borg. Collector’s Edition versions release with the set as well.',
    source: 'Official product details and dates',
    href: 'https://magic.wizards.com/en/news/feature/collecting-star-trek',
    tone: 'primary',
  },
  {
    date: 'Nov 13–15, 2026',
    sort: '2026-11-13',
    title: 'Mystery Booster Commander Edition at MagicCon: Atlanta',
    type: 'Event availability',
    detail: 'Wizards says the product will also be available at future Magic events. It is a Commander Draft booster product, not a precon. New-to-Magic cards become Commander-legal on Nov 13.',
    source: 'Official details',
    href: 'https://magic.wizards.com/en/news/feature/whats-inside-mystery-booster-commander-edition',
    tone: 'amber',
  },
  {
    date: 'Feb 5, 2027',
    sort: '2027-02-05',
    title: 'Nauctis: The Sunken Realm',
    type: 'Set release',
    detail: 'The first dated 2027 set in the announced Magic multiverse calendar. Commander precon names and dates have not been announced yet.',
    source: 'Wizards’ 2027 announcement',
    href: 'https://magic.wizards.com/en/news/announcements/everything-announced-for-the-magic-multiverse-in-2027',
    tone: 'primary',
  },
  {
    date: 'Jun 4, 2027',
    sort: '2027-06-04',
    title: 'Kamigawa: Titanbreach',
    type: 'Set release',
    detail: 'A dated 2027 release. Treat any Commander product information as unconfirmed until Wizards publishes product details.',
    source: 'Wizards’ 2027 announcement',
    href: 'https://magic.wizards.com/en/news/announcements/everything-announced-for-the-magic-multiverse-in-2027',
    tone: 'primary',
  },
  {
    date: 'Oct 1, 2027',
    sort: '2027-10-01',
    title: 'Zhalfir',
    type: 'Set release',
    detail: 'A dated 2027 release. No Commander precon names or dates are confirmed at this time.',
    source: 'Wizards’ 2027 announcement',
    href: 'https://magic.wizards.com/en/news/announcements/everything-announced-for-the-magic-multiverse-in-2027',
    tone: 'primary',
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function formatScanTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  }).format(new Date(value));
}

export default function SpoilerCalendar() {
  const today = new Date().toISOString().slice(0, 10);
  const scanDate = mtgjsonPreconCatalog.scanTimestamp.slice(0, 10);
  const upcomingSets = mtgjsonPreconCatalog.setReleases
    .filter(set => set.releaseDate > scanDate && set.releaseDate > today)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate) || a.name.localeCompare(b.name));
  const spoilerSets = upcomingSets.filter(set => set.spoilerCount > 0);
  const verifiedCardCount = spoilerSets.reduce((total, set) => total + set.spoilerCount, 0);
  const pricedCardCount = spoilerSets.reduce((total, set) => total + set.spoilerCards.filter(card => card.priceUsd != null).length, 0);
  const nextSet = upcomingSets[0];
  const completeDecks = mtgjsonPreconCatalog.statistics.completeDecks;
  const pendingDecks = mtgjsonPreconCatalog.statistics.pendingDecks;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <InternalPageNav active="/spoiler-calendar" />
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Release desk · data scan {formatScanTimestamp(mtgjsonPreconCatalog.scanTimestamp)}</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Upcoming releases, precons, and verified card previews.</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">Confirmed product dates stay separate from set metadata. Spoiler cards appear only when a future set, Scryfall preview date, named source, original source link, and card record all agree.</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Release and value snapshot">
          <article className="border-2 border-primary bg-primary/5 p-5">
            <CalendarDays className="h-5 w-5 text-primary" />
            <p className="mt-4 font-mono text-xs font-black uppercase tracking-widest text-primary">Next MTGJSON release</p>
            <p className="mt-2 text-xl font-black">{nextSet ? formatDate(nextSet.releaseDate) : 'No dated release'}</p>
            <p className="mt-1 text-sm text-muted-foreground">{nextSet?.name || 'No upcoming set found in the current window'}</p>
          </article>
          <article className="border-2 border-amber-500 bg-amber-500/5 p-5">
            <Eye className="h-5 w-5 text-amber-600" />
            <p className="mt-4 font-mono text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Verified preview cards</p>
            <p className="mt-2 text-3xl font-black">{verifiedCardCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Across {spoilerSets.length} upcoming set{spoilerSets.length === 1 ? '' : 's'} · partial only</p>
          </article>
          <article className="border-2 border-border bg-card p-5">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="mt-4 font-mono text-xs font-black uppercase tracking-widest text-muted-foreground">Preview price coverage</p>
            <p className="mt-2 text-3xl font-black">{pricedCardCount}/{verifiedCardCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Cards with a Scryfall USD estimate; missing prices are not inferred.</p>
          </article>
          <article className="border-2 border-border bg-card p-5">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="mt-4 font-mono text-xs font-black uppercase tracking-widest text-muted-foreground">Commander decklist scan</p>
            <p className="mt-2 text-3xl font-black">{completeDecks} complete</p>
            <p className="mt-1 text-sm text-muted-foreground">{pendingDecks} pending · no invented cardlists</p>
          </article>
        </section>

        {spoilerSets.length > 0 ? (
          <section className="space-y-5" aria-labelledby="verified-spoiler-gallery-heading">
            <div className="flex flex-col gap-3 border-b-2 border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Scryfall-attributed only</p>
                <h2 id="verified-spoiler-gallery-heading" className="mt-2 text-3xl font-black tracking-tight">New cards, with their original preview credits.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">A card is flagged as a spoiler only for an upcoming set and only when all Scryfall preview-credit fields are present. Open a source link to read the original reveal.</p>
              </div>
              <a href={mtgjsonPreconCatalog.sources?.scryfallSpoilerPolicy || 'https://scryfall.com/docs/faqs/what-is-scryfall-s-spoiler-policy-9'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-primary hover:underline">Scryfall spoiler policy <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="space-y-6">
              {spoilerSets.map(set => <VerifiedSpoilerGallery key={set.code} set={set} />)}
            </div>
          </section>
        ) : (
          <section className="border-2 border-border bg-card p-6">
            <h2 className="text-2xl font-black">No verified previews in this scan.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Upcoming sets can appear here before any cards are previewed. No card is labelled a spoiler without Scryfall’s date, source name, and source URI for a future-release set.</p>
          </section>
        )}

        <section className="space-y-4" aria-labelledby="mtgjson-upcoming-set-feed">
          <div className="flex flex-col gap-3 border-b-2 border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">MTGJSON set feed</p>
              <h2 id="mtgjson-upcoming-set-feed" className="mt-2 text-2xl font-black">Upcoming set records and what is not known yet.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Set records are release metadata, not evidence of a Commander product. A decklist is added only from a complete MTGJSON Commander Deck record.</p>
            </div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">MTGJSON build {mtgjsonPreconCatalog.sourceBuildDate || 'date unavailable'} · scan {formatScanTimestamp(mtgjsonPreconCatalog.scanTimestamp)}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcomingSets.map(set => (
              <article key={set.code} className="border-2 border-border bg-card p-4 transition-colors hover:border-primary">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="font-bold leading-snug">{set.name}</h3><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{set.code} · {set.type}</p></div>
                  <span className={`shrink-0 border px-2 py-1 font-mono text-[9px] font-black uppercase ${set.spoilerCount > 0 ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-border bg-muted text-muted-foreground'}`}>
                    {set.spoilerCount > 0 ? `${set.spoilerCount} verified spoiler${set.spoilerCount === 1 ? '' : 's'}` : 'No verified previews'}
                  </span>
                </div>
                <p className="mt-4 font-mono text-sm font-black text-primary">{formatDate(set.releaseDate)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {set.completeDeckCount > 0 ? `${set.completeDeckCount} complete Commander decklist${set.completeDeckCount === 1 ? '' : 's'} indexed.` : set.pendingDeckCount > 0 ? `${set.pendingDeckCount} Commander product record${set.pendingDeckCount === 1 ? '' : 's'} pending a complete list.` : 'MTGJSON has no Commander Deck metadata for this set in the current scan.'}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 font-mono text-[10px] uppercase"><span className="text-muted-foreground">Set metadata · MTGJSON</span><a href={set.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">Open source <ExternalLink className="h-3 w-3" /></a></div>
              </article>
            ))}
            {upcomingSets.length === 0 && <p className="border border-dashed border-border p-6 text-sm text-muted-foreground">No upcoming set records are in the configured look-ahead window.</p>}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="official-date-calendar">
          <div className="flex items-end justify-between gap-4 border-b-2 border-border pb-4">
            <div><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Editorially reviewed dates</p><h2 id="official-date-calendar" className="mt-2 text-2xl font-black">Confirmed product and event calendar</h2></div>
            <Package className="hidden h-6 w-6 text-amber-600 sm:block" />
          </div>
          <div className="space-y-3" aria-label="Upcoming official dates">
            {events.map(event => (
              <article key={`${event.sort}-${event.title}`} className={`border-2 p-5 sm:p-6 ${event.tone === 'amber' ? 'border-amber-500/60 bg-amber-500/5' : 'border-border bg-card'}`}>
                <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-start">
                  <div><p className="font-mono text-lg font-black text-primary">{event.date}</p><p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{event.type}</p></div>
                  <div><h3 className="text-xl font-black tracking-tight">{event.title}</h3><p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">{event.detail}</p></div>
                  <a href={event.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary hover:text-primary">{event.source} <ExternalLink className="h-3 w-3" /></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-2 border-primary/30 bg-primary/5 p-6 sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Editorial and value policy</p>
          <h2 className="mt-3 text-2xl font-black">Useful context, without pretending a preview is a full set or a price is a promise.</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            <p>Preview credit comes from Scryfall’s structured card data. Scryfall says previews are usually entered within 24 hours and explicitly excludes stolen or maliciously leaked products; the tracker does not scrape leaks or label uncredited cards as spoilers.</p>
            <p>Market estimates are shown only when a source provides a quote. Missing price data is marked as missing—not converted to zero, a made-up value, or a buying recommendation. Price coverage is shown so readers can judge how much evidence is available.</p>
            <p>Use the <Link href="/precons" className="font-bold text-primary hover:underline">Commander precon archive</Link> for complete deck coverage and the <Link href="/commander-market" className="font-bold text-primary hover:underline">Commander demand index</Link> for market context. Confirmed event details remain separate from MTGJSON set records.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 font-mono text-xs font-black uppercase"><a href="https://scryfall.com/docs/api/cards" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Scryfall card fields <ExternalLink className="h-3 w-3" /></a><a href="https://scryfall.com/docs/api/images" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Scryfall image docs <ExternalLink className="h-3 w-3" /></a></div>
        </section>
      </main>
    </div>
  );
}
