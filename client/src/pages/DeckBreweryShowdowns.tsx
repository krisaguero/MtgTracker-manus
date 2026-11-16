import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, FlaskConical, ShieldAlert, Swords } from 'lucide-react';
import { Link } from 'wouter';
import { getPublicCardImageUri } from '@/lib/deckGalleryImageUris';
import {
  breweryReviewPath,
  breweryShowdownPath,
  deckBreweryShowdowns,
  findBreweryReview,
  type DeckBreweryComboSpotlight,
  type DeckBreweryMatchup,
  type ShowdownCard,
  type ShowdownSource,
} from '@/lib/deckBreweryShowdowns';
import { loadDeckBreweryReviews, type BreweryReviewEntry, type BreweryReviewPayload } from '@/lib/deckBreweryReviews';

type ReviewProps = { initialReviews?: BreweryReviewPayload; params?: Record<string, string | undefined> };

function useReviews(initialReviews?: BreweryReviewPayload) {
  const [payload, setPayload] = useState<BreweryReviewPayload | null>(initialReviews ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialReviews) {
      setPayload(initialReviews);
      return;
    }
    let active = true;
    loadDeckBreweryReviews()
      .then((result) => { if (active) setPayload(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'The public review data could not be loaded.'); });
    return () => { active = false; };
  }, [initialReviews]);

  return { payload, error };
}

function CardArtwork({ name, className = '' }: { name: string; className?: string }) {
  const imageUri = getPublicCardImageUri(name, 'art_crop');
  const [failed, setFailed] = useState(!imageUri);
  return <div className={`relative overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-amber-500/20 ${className}`} aria-label={`${name} card art`}>
    {imageUri && !failed ? <img src={imageUri} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <div className="flex h-full items-center justify-center p-3 text-center font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">{name}</div>}
  </div>;
}

function PageHeader({ detail = false }: { detail?: boolean }) {
  return <header className="border-b-2 border-border bg-card">
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-11">
      <Link href="/deck-brewery/reviews" className="inline-flex min-h-10 items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Public Deck Brewery</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-4xl">
          <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><Swords className="h-4 w-4" /> Open to everyone · no sign-in</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Brewery Showdowns</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Lore-aware pairings and card-interaction spotlights built from the approved public lists. Source pages stay untouched; every format/count warning stays visible. These are editorial ideas, not tested or final decks.</p>
        </div>
        {!detail && <div className="flex flex-wrap gap-2">
          <Link href="/deck-gallery" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-background px-3 py-2 font-mono text-[9px] font-black uppercase tracking-wider hover:border-primary">Public Deck Gallery <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/brawl-box" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-3 py-2 font-mono text-[9px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90">Brawlternatives <ArrowRight className="h-4 w-4" /></Link>
        </div>}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="flex gap-3 border border-primary/40 bg-primary/5 p-3"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-[11px] leading-5 text-muted-foreground"><strong className="text-foreground">Theme, not canon.</strong> None of these pairings is presented as a story-confirmed duel.</p></div>
        <div className="flex gap-3 border border-amber-700/40 bg-amber-500/5 p-3"><FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" /><p className="text-[11px] leading-5 text-muted-foreground"><strong className="text-foreground">Not playtested.</strong> Verified card text can show an interaction; it does not prove the deck assembles it.</p></div>
        <div className="border border-border bg-background p-3 text-[11px] leading-5 text-muted-foreground"><strong className="text-foreground">No source edits or ownership claims.</strong> Proposed command-zone choices remain separate from the original Gallery record.</div>
      </div>
    </div>
  </header>;
}

function SourceLinks({ entry }: { entry: BreweryReviewEntry }) {
  return <div className="mt-4 flex flex-wrap gap-2">
    <Link href={entry.sourceGalleryHref} className="inline-flex min-h-10 items-center gap-1.5 border border-border bg-background px-3 py-2 text-[10px] font-bold hover:border-primary">Original public list <ExternalLink className="h-3 w-3" /></Link>
    <Link href={breweryReviewPath(entry.slug)} className="inline-flex min-h-10 items-center gap-1.5 border border-primary/40 bg-primary/5 px-3 py-2 text-[10px] font-bold text-primary hover:border-primary">Review & current-build evidence <ArrowRight className="h-3 w-3" /></Link>
  </div>;
}

function SourceCard({ entry, cards }: { entry: BreweryReviewEntry; cards: ShowdownCard[] }) {
  const commandZoneMoves = entry.proposal.moves.filter((move) => move.kind === 'command-zone');
  const proposalCommanders = Array.from(new Set([
    ...(entry.proposal.commander ? [entry.proposal.commander] : []),
    ...commandZoneMoves.map((move) => move.name),
  ]));
  return <article className="overflow-hidden border-2 border-border bg-card">
    <header className="border-b border-border bg-primary/[0.035] p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
        <span className="border border-primary/40 bg-primary/5 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">Proposal · untested</span>
        <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider">Saved tag: {entry.savedFormatLabel || 'Not specified'}</span>
        <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider">{entry.proposal.statusLabel}</span>
        {entry.titleCredit && <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider">Title credit</span>}
        {(entry.helm.confidence === 'best_fit_inferred' || entry.helm.confidence === 'strongly_supported_partner_pair' || entry.helm.status === 'unconfirmed' || entry.helm.separateChildGuess) && <span className="border border-amber-700/40 bg-amber-500/10 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">Helm inferred</span>}
      </div>
      <h3 className="mt-3 break-words text-xl font-black leading-snug">{entry.title}</h3>
      {entry.titleCredit && <p className="mt-2 border-l-2 border-primary pl-3 text-[11px] leading-5 text-muted-foreground">Exact source credit: <strong>{entry.titleCredit}</strong>. This is title-level credit only, not a separate authorship, playtest, or endorsement claim.</p>}
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Saved source: {entry.sourceMainCopies} main copies · {entry.sourceSideboardCopies} sideboard copies. Review lens: {entry.reviewLens}.</p>
      <p className="mt-2 border-l-4 border-amber-600 bg-amber-500/5 p-3 text-xs leading-5"><strong>Count note:</strong> {entry.proposal.countNote}</p>
      {entry.proposal.caveat && <p className="mt-2 text-xs leading-5 text-muted-foreground">Review caveat: {entry.proposal.caveat}</p>}
      <p className="mt-2 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Source commander:</strong> Not confirmed on the saved Gallery record. This page does not assign one from the title or card list.</p>
      {proposalCommanders.length > 0 && <p className="mt-2 border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Separate review branch:</strong> {proposalCommanders.join(', ')} {proposalCommanders.length === 1 ? 'is' : 'are'} proposed for the command zone. That untested branch does not confirm the original source list's commander.</p>}
    </header>
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      {cards.map((card) => <div key={card.name} className="flex min-w-0 gap-3 border border-border bg-background p-2.5">
        <CardArtwork name={card.name} className="h-24 w-16 shrink-0 sm:h-28 sm:w-[4.65rem]" />
        <div className="min-w-0 self-center"><p className="break-words text-xs font-black leading-5">{card.name}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{card.role}</p><p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">{card.where}</p></div>
      </div>)}
    </div>
    <footer className="border-t border-border px-4 pb-4 sm:px-5"><SourceLinks entry={entry} /></footer>
  </article>;
}

function CitationList({ sources }: { sources: ShowdownSource[] }) {
  return <ul className="mt-3 space-y-2">
    {sources.map((source) => <li key={source.url} className="border-l-2 border-border pl-3 text-xs leading-5">
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">{source.title} <ExternalLink className="inline h-3 w-3" /></a>
      <p className="text-muted-foreground">{source.supports}</p>
    </li>)}
  </ul>;
}

function MatchupTile({ matchup, left, right }: { matchup: DeckBreweryMatchup; left: BreweryReviewEntry; right: BreweryReviewEntry }) {
  const leftCard = matchup.leftCards[0];
  const rightCard = matchup.rightCards[0];
  return <Link href={breweryShowdownPath(matchup.slug)} className="group block overflow-hidden border-2 border-border bg-card transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
    <div className="grid grid-cols-2 gap-px bg-border">
      <CardArtwork name={leftCard.name} className="h-40 bg-card sm:h-52" />
      <CardArtwork name={rightCard.name} className="h-40 bg-card sm:h-52" />
    </div>
    <div className="space-y-3 p-4 sm:p-5">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-primary">Lore-inspired matchup · not canon</p>
      <h3 className="text-lg font-black leading-snug group-hover:text-primary">{matchup.headline}</h3>
      <p className="text-xs leading-5 text-muted-foreground">{left.title} <span className="text-primary">vs.</span> {right.title}</p>
      <div className="flex flex-wrap gap-2 text-[9px] font-bold"><span className="border border-border px-2 py-1">{left.savedFormatLabel || 'Format not specified'}</span><span className="border border-border px-2 py-1">{right.savedFormatLabel || 'Format not specified'}</span></div>
      <span className="inline-flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-wider text-primary">Open matchup <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
    </div>
  </Link>;
}

function ComboCard({ combo, entry }: { combo: DeckBreweryComboSpotlight; entry: BreweryReviewEntry }) {
  return <article id={`combo-${combo.slug}`} className="scroll-mt-24 overflow-hidden border-2 border-border bg-card">
    <header className="border-b border-border bg-primary/[0.035] p-4 sm:p-5">
      <div className="flex flex-wrap gap-2"><span className="border border-primary/40 bg-primary/5 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">{combo.typeLabel}</span><span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider">{entry.proposal.statusLabel}</span></div>
      <h3 className="mt-3 text-lg font-black leading-snug">{combo.comboName}</h3>
      <p className="mt-1 text-xs text-muted-foreground">From the public source titled <strong>{entry.title}</strong></p>
    </header>
    <div className="p-4 sm:p-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {combo.cards.map((card) => <div key={card.name} className="flex min-w-0 gap-3 border border-border bg-background p-2">
          <CardArtwork name={card.name} className="h-24 w-16 shrink-0" />
          <div className="min-w-0 self-center"><p className="break-words text-xs font-black">{card.name}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{card.role}</p><p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">{card.where}</p></div>
        </div>)}
      </div>
      <div className="mt-4 border-l-4 border-primary bg-primary/[0.035] p-3 text-xs leading-6"><strong>How the line works:</strong> {combo.sequence}</div>
      <p className="mt-3 border-l-4 border-amber-600 bg-amber-500/5 p-3 text-xs leading-5"><strong>Limit:</strong> {combo.caveat}</p>
      <details className="mt-4 border border-border bg-background p-3">
        <summary className="min-h-10 cursor-pointer content-center text-xs font-black">Open card-text and rules sources</summary>
        <CitationList sources={combo.sources} />
      </details>
      <SourceLinks entry={entry} />
    </div>
  </article>;
}

function LoadingState({ error }: { error: string }) {
  return <main className="mx-auto max-w-3xl px-4 py-12">
    {error ? <p role="alert" className="border border-rose-600/40 bg-rose-500/5 p-4 text-sm">{error}</p> : <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Loading the public Brewery notes…</p>}
  </main>;
}

export default function DeckBreweryShowdowns({ initialReviews }: ReviewProps) {
  const { payload, error } = useReviews(initialReviews);
  if (!payload) return <><PageHeader /><LoadingState error={error} /></>;
  const matchups = deckBreweryShowdowns.matchups.flatMap((matchup) => {
    const left = findBreweryReview(payload, matchup.leftReviewSlug);
    const right = findBreweryReview(payload, matchup.rightReviewSlug);
    return left && right ? [{ matchup, left, right }] : [];
  });
  const combos = deckBreweryShowdowns.comboSpotlights.flatMap((combo) => {
    const entry = findBreweryReview(payload, combo.sourceReviewSlug);
    return entry ? [{ combo, entry }] : [];
  });

  return <div className="min-h-screen bg-background text-foreground">
    <PageHeader />
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-7 sm:px-8 sm:py-10">
      <section aria-labelledby="showdown-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Three story-aware pairings</p><h2 id="showdown-heading" className="mt-1 text-2xl font-black">Pick a side of the table</h2></div><p className="max-w-xl text-xs leading-5 text-muted-foreground">Each source list has its own page, title, credit, format tag, review status, and count warning. Commander status is not inferred from titles.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{matchups.map(({ matchup, left, right }) => <MatchupTile key={matchup.slug} matchup={matchup} left={left} right={right} />)}</div>
      </section>
      <section aria-labelledby="combo-heading" className="border-t-2 border-border pt-7">
        <div className="mb-4"><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Card-text checked · not playtested</p><h2 id="combo-heading" className="mt-1 text-2xl font-black">Combo lab</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">One repeatable loop, one conditional tutor engine, and one finite copy burst. Proposed additions and sideboard cards are labeled where they appear; none is treated as a final deck edit.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">{combos.map(({ combo, entry }) => <ComboCard key={combo.slug} combo={combo} entry={entry} />)}</div>
      </section>
      <section className="flex flex-wrap items-center justify-between gap-4 border-2 border-primary/35 bg-primary/[0.035] p-4 sm:p-5" aria-label="Related public shelves">
        <div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Keep browsing</p><h2 className="mt-1 text-lg font-black">The sources are still the originals</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Open every saved list, review child, or Brawlternative from its own page. No source card row or private collection match is folded into this feature.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/deck-brewery/reviews" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-background px-4 py-2 font-mono text-[9px] font-black uppercase tracking-wider hover:border-primary">All public reviews <ArrowRight className="h-4 w-4" /></Link><Link href="/deck-gallery" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-background px-4 py-2 font-mono text-[9px] font-black uppercase tracking-wider hover:border-primary">Deck Gallery <ArrowRight className="h-4 w-4" /></Link><Link href="/brawl-box/deck-gisa-and-geralf-graveyard-mashup-preview" className="inline-flex min-h-11 items-center gap-2 border-2 border-amber-700/50 bg-background px-4 py-2 font-mono text-[9px] font-black uppercase tracking-wider hover:border-primary">Gisa child WIP <ArrowRight className="h-4 w-4" /></Link><Link href="/brawl-box" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-[9px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90">Brawlternatives <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </main>
  </div>;
}

export function DeckBreweryShowdownDetail({ params, initialReviews }: { params: { matchupSlug: string }; initialReviews?: BreweryReviewPayload }) {
  const { payload, error } = useReviews(initialReviews);
  if (!payload) return <><PageHeader detail /><LoadingState error={error} /></>;
  const matchup = deckBreweryShowdowns.matchups.find((candidate) => candidate.slug === params.matchupSlug);
  if (!matchup) return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-2xl font-black">Matchup not found</h1><Link href="/deck-brewery/matchups" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary underline"><ArrowLeft className="h-4 w-4" /> Browse Brewery Showdowns</Link></main>;
  const left = findBreweryReview(payload, matchup.leftReviewSlug);
  const right = findBreweryReview(payload, matchup.rightReviewSlug);
  if (!left || !right) return <LoadingState error="A source review for this matchup is unavailable." />;

  return <div className="min-h-screen bg-background text-foreground">
    <PageHeader detail />
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-bold"><Link href="/deck-brewery/matchups" className="inline-flex min-h-10 items-center gap-2 text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> All matchups</Link><span aria-hidden="true">/</span><span aria-current="page" className="text-muted-foreground">{matchup.headline}</span></nav>
      <header className="border-2 border-border bg-card p-5 sm:p-7">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-primary">Lore-aware theme pairing · no canonical duel claimed</p>
        <h2 className="mt-2 max-w-5xl text-2xl font-black tracking-tight sm:text-4xl">{matchup.headline}</h2>
        <p className="mt-4 max-w-5xl text-sm leading-7 text-muted-foreground">{matchup.narrativeAngle}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2"><div className="border border-border bg-background p-3"><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Official lore sources</p><CitationList sources={matchup.loreSources} /></div><div className="border-l-4 border-amber-600 bg-amber-500/5 p-3 text-xs leading-6"><strong>Source boundary:</strong> These are saved list titles and editorial themes. None of the source rows have been edited; no playtest, final build, ownership match, or creator endorsement is claimed.</div></div>
      </header>
      <div className="grid gap-5 xl:grid-cols-2">
        <SourceCard entry={left} cards={matchup.leftCards} />
        <SourceCard entry={right} cards={matchup.rightCards} />
      </div>
      <section className="border-2 border-amber-600/40 bg-amber-500/5 p-4 sm:p-5" aria-label="Pairing count and format caveats">
        <h2 className="font-mono text-xs font-black uppercase tracking-widest">Keep the source caveats in view</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{matchup.sourceCaveat}</p>
      </section>
      <section className="border-t-2 border-border pt-5">
        <h2 className="text-xl font-black">Browse more matchups</h2>
        <div className="mt-3 flex flex-wrap gap-2">{deckBreweryShowdowns.matchups.filter((item) => item.slug !== matchup.slug).map((item) => <Link key={item.slug} href={breweryShowdownPath(item.slug)} className="inline-flex min-h-10 items-center gap-2 border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary">{item.headline}<ArrowRight className="h-3.5 w-3.5" /></Link>)}<Link href="/deck-brewery/matchups#combo-heading" className="inline-flex min-h-10 items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:border-primary">Open combo lab <ArrowRight className="h-3.5 w-3.5" /></Link></div>
      </section>
    </main>
  </div>;
}
