import { ArrowUpRight, CheckCircle2, CircleHelp, ShieldCheck } from 'lucide-react';
import { buildPrivateDeckReview } from '@/lib/privateDeckReview';
import type { DeckboxSourceRecord } from '@/lib/privateDeckBrewery';
import React, { type ReactNode } from 'react';

interface PrivateDeckReviewTemplateProps {
  deck: DeckboxSourceRecord;
  edhrecUrl: string | null;
}

const packageRoles = [
  ['Setup & enablers', 'What starts the engine, supplies material, or makes the first key play?'],
  ['Payoffs & value', 'What turns the setup into cards, board advantage, tempo, or pressure?'],
  ['Ramp & card flow', 'Which cards accelerate mana or replace themselves, and do they fit the curve?'],
  ['Interaction & protection', 'What answers opposing plans and keeps the core engine alive?'],
  ['Finishers & recovery', 'How does the deck close, and what is the backup if the first plan is answered?'],
] as const;

const testSteps = [
  'Can the opening hand make its colors and cast an early play?',
  'Does the deck show its main theme without needing one exact card?',
  'Are setup cards followed by useful payoffs, or do pieces sit idle?',
  'Can it interact with a fast threat and recover after a board reset?',
  'Does the chosen finish close games without crowding out the theme?',
  'After each game, record the stuck cards, missed colors, and cards that overperformed.',
] as const;

function EvidenceLabel({ kind }: { kind: 'Source' | 'Analysis' | 'Unverified' }) {
  const classes = kind === 'Source'
    ? 'bg-sky-500/10 text-sky-800 dark:text-sky-200'
    : kind === 'Analysis'
      ? 'bg-violet-500/10 text-violet-800 dark:text-violet-200'
      : 'bg-amber-500/10 text-amber-900 dark:text-amber-200';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${classes}`}>{kind}</span>;
}

function ReviewCard({ title, kind, children }: { title: string; kind: 'Source' | 'Analysis' | 'Unverified'; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <EvidenceLabel kind={kind} />
      </div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  );
}

export function PrivateDeckReviewTemplate({ deck, edhrecUrl }: PrivateDeckReviewTemplateProps) {
  const review = buildPrivateDeckReview(deck);
  const partial = deck.exportStatus === 'partial_paginated_source' || deck.exportStatus === 'partial_hidden_scratchpad';
  const commanderLabel = review.commander ?? 'Not marked in the imported source';
  const identityLabel = review.colorIdentity ?? 'Not recorded; verify from the chosen commander’s current card text';
  const landsLabel = review.landCopies === null ? 'Not recorded in the source metadata' : `${review.landCopies.toLocaleString()} land copies recorded in the source`;

  return (
    <section className="mt-8" aria-labelledby="private-deck-review-heading">
      <header className="rounded-3xl border border-primary/25 bg-primary/5 p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Repeatable precon-style build sheet</p>
        <h2 id="private-deck-review-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Deck review & upgrade plan</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          This read-only template is generated for each private entry. It does not edit the imported list or save recommendations into it. “Source” is imported metadata; “Analysis” is a planning read; “Unverified” means check before relying on it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border bg-background px-3 py-1.5">Source status: {review.sourceStatus}</span>
          <span className="rounded-full border border-border bg-background px-3 py-1.5">{review.mainCopies.toLocaleString()} main · {review.sideboardCopies.toLocaleString()} sideboard copies</span>
          <span className="rounded-full border border-border bg-background px-3 py-1.5">Commander: {commanderLabel}</span>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ReviewCard title="Commander & color identity" kind="Source">
          <p><strong className="text-foreground">Commander:</strong> {commanderLabel}</p>
          <p><strong className="text-foreground">Identity:</strong> {identityLabel}</p>
          <p className="text-xs">Only explicit source fields are shown here. A legend in the list is not automatically treated as the commander; confirm eligibility, identity, and any partner/background rules separately.</p>
          <p className="flex items-start gap-2 text-xs"><CircleHelp className="mt-1 h-4 w-4 shrink-0" />If either field is missing, choose and verify it in a separate draft before making color or legality claims.</p>
        </ReviewCard>

        <ReviewCard title="List status & count" kind="Source">
          <p><strong className="text-foreground">Status:</strong> {review.sourceStatus}</p>
          <p>{review.mainCopies.toLocaleString()} main-deck copies and {review.sideboardCopies.toLocaleString()} sideboard copies are present in the imported rows.</p>
          {partial ? <p className="text-xs">The export is marked partial. Do not treat missing rows as cuts or slots to fill; reconcile the source first.</p> : <p className="text-xs">A compatible count is not proof that the list is complete, legal, or intended for a particular format.</p>}
        </ReviewCard>

        <ReviewCard title="Subtype, tribe & theme" kind="Analysis">
          <p><strong className="text-foreground">Working theme signal:</strong> {review.themeLabel}</p>
          <p>{review.themeFrame}.</p>
          <p className="text-xs">{review.themeEvidence} Treat this as a hypothesis, not a card-type or Oracle-text check. Confirm creature subtypes and theme support from current card text before naming a tribe.</p>
        </ReviewCard>

        <ReviewCard title="Card bundles & strategic jobs" kind="Analysis">
          <p>Group cards by what they do in the plan, then check whether each group has enough setup, payoff, and overlap to function. The source rows are not auto-classified by name.</p>
          <ul className="space-y-2">
            {packageRoles.map(([title, purpose]) => <li key={title}><strong className="text-foreground">{title}:</strong> {purpose}</li>)}
          </ul>
        </ReviewCard>

        <ReviewCard title="Game plan & turn sequence" kind="Analysis">
          <ol className="list-decimal space-y-2 pl-5">
            <li><strong className="text-foreground">Early turns:</strong> fix colors, develop mana, and play low-cost enablers without giving up needed interaction.</li>
            <li><strong className="text-foreground">Middle turns:</strong> connect the theme’s enablers to repeatable value or board pressure; protect the most important piece.</li>
            <li><strong className="text-foreground">Closing turns:</strong> convert the established advantage into a clear finish, with a recovery line if the main engine is removed.</li>
          </ol>
          <p className="text-xs">These are sequencing prompts, not claims that the current source already contains each role.</p>
        </ReviewCard>

        <ReviewCard title="Mana base & land reasoning" kind="Analysis">
          <p><strong className="text-foreground">Source land count:</strong> {landsLabel}</p>
          <p>Set the land target only after commander identity, curve, speed, and ramp are known. Check colored sources against early colored costs; count tapped lands and utility lands as trade-offs, not free fixing.</p>
          <p className="text-xs">If the source is partial or the commander is not confirmed, leave the mana-base verdict open. Do not infer colors from a deck title.</p>
        </ReviewCard>

        <ReviewCard title="Role balance: ramp, draw, answers & finishers" kind="Unverified">
          <p>The imported rows are not automatically classified into these roles. In the separate draft, record the actual cards and counts for:</p>
          <p className="text-foreground">Ramp · card draw/selection · removal/counters · protection · board recovery · finishers · lands.</p>
          <p className="text-xs">Use the chosen format, curve, and playtests to adjust counts; no universal quota is asserted here.</p>
        </ReviewCard>

        <ReviewCard title="Notable synergies & backup lines" kind="Analysis">
          <p>For each proposed synergy, write the enabler → payoff → what happens when either piece is answered. Favor cards that do more than one job and name a backup route to victory.</p>
          <p className="text-xs">Verify interactions against current Oracle text and rules. A card-name match alone is not proof that a combo works.</p>
        </ReviewCard>

        <ReviewCard title="Optional EDHREC alternatives" kind={edhrecUrl ? 'Source' : 'Unverified'}>
          {edhrecUrl ? <>
            <p>A saved EDHREC link is an optional comparison source, not evidence of ownership, intent, legality, or a required upgrade.</p>
            <a className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={edhrecUrl} target="_blank" rel="noopener noreferrer">Open saved EDHREC reference <ArrowUpRight size={15} /></a>
            <p className="text-xs">Keep any alternative in a separate draft and record why it fits this build.</p>
          </> : <p>No EDHREC reference is attached to this entry. If one is added later, cite it as optional context and keep alternatives separate from the source.</p>}
        </ReviewCard>

        <ReviewCard title="Playtest checklist" kind="Unverified">
          <ul className="space-y-2">
            {testSteps.map((step) => <li key={step} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{step}</li>)}
          </ul>
          <p className="text-xs">No games are recorded by this page. Mark testing complete only after real plays.</p>
        </ReviewCard>

        <ReviewCard title="Separate build directions" kind="Analysis">
          <ul className="space-y-2">
            <li><strong className="text-foreground">Full Commander:</strong> make a separate 100-card draft: one eligible commander plus 99 other cards, with lands included in the 99 and Commander singleton/color-identity rules checked.</li>
            <li><strong className="text-foreground">Custom Brawlternative:</strong> a separate 60-card direction, normally one commander plus 59 other cards under this collection’s stated house rules; it is not official Arena Brawl.</li>
            <li><strong className="text-foreground">Battle Box:</strong> a separate 60-card non-Commander duel deck, balanced against the other box decks.</li>
          </ul>
          <p className="flex items-start gap-2 text-xs"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />Never cut, move, or add cards to the imported source. Keep each direction as its own version.</p>
        </ReviewCard>
      </div>

      <p className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-5 text-muted-foreground">
        <strong className="text-foreground">Unverified unless separately checked:</strong> card ownership, current legality, budget/prices, card text/rules interactions, and playtesting. This template does not claim any of those are confirmed.
      </p>
    </section>
  );
}
