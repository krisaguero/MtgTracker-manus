import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleAlert,
  ExternalLink,
  FlaskConical,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { CommanderHelmPanel } from "@/components/CommanderHelmPanel";
import {
  getReviewArtName,
  loadDeckBreweryReviews,
  type BreweryReviewAction,
  type BreweryReviewEntry,
  type BreweryReviewPayload,
  type BreweryReviewProposal,
} from "@/lib/deckBreweryReviews";

const statusClass: Record<string, string> = {
  conditional:
    "border-amber-700/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  "count-balanced":
    "border-emerald-700/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  partial:
    "border-amber-700/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  proposal: "border-primary/40 bg-primary/5 text-primary",
  "section-alignment":
    "border-sky-700/40 bg-sky-500/10 text-sky-900 dark:text-sky-200",
  reference: "border-border bg-muted/50 text-muted-foreground",
  "needs-context":
    "border-rose-700/40 bg-rose-500/10 text-rose-900 dark:text-rose-200",
  "no-change": "border-border bg-background text-muted-foreground",
};

const cardImageUrl = (name: string) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=art_crop`;

function CardArtwork({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-amber-500/20 ${className}`}
      aria-label={`${name} card art`}
    >
      {!failed && (
        <img
          src={cardImageUrl(name)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="flex h-full items-center justify-center p-3 text-center font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {name}
        </div>
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}

function StatusBadge({ proposal }: { proposal: BreweryReviewProposal }) {
  return (
    <span
      className={`inline-flex border px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider ${statusClass[proposal.status] || statusClass.reference}`}
    >
      {proposal.statusLabel}
    </span>
  );
}

function visibleSearchText(entry: BreweryReviewEntry) {
  const proposalText = (proposal: BreweryReviewProposal) =>
    [
      proposal.statusLabel,
      proposal.formatLens,
      proposal.commander || "",
      ...proposal.adds.flatMap(item => [item.name, item.role || ""]),
      ...proposal.cuts.flatMap(item => [item.name, item.role || ""]),
      ...proposal.moves.map(move => move.name),
    ].join(" ");
  const helmText = [
    entry.helm.label,
    entry.helm.note,
    ...entry.helm.commanders.map(card => card.name),
    entry.helm.separateChildGuess?.name || "",
    entry.helm.separateChildGuess?.note || "",
  ].join(" ");
  return [
    entry.title,
    entry.savedFormatLabel || "",
    entry.reviewLens,
    helmText,
    proposalText(entry.proposal),
    entry.alternateV2 ? proposalText(entry.alternateV2) : "",
  ]
    .join(" ")
    .toLocaleLowerCase();
}

export function DeckBreweryReviewIndexView({
  payload,
}: {
  payload: BreweryReviewPayload;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visibleEntries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return payload.entries.filter(entry => {
      const matchesText =
        !normalized || visibleSearchText(entry).includes(normalized);
      const status = entry.proposal.status;
      const matchesFilter =
        filter === "all" ||
        (filter === "proposals" &&
          [
            "conditional",
            "count-balanced",
            "partial",
            "proposal",
            "section-alignment",
          ].includes(status)) ||
        (filter === "references" &&
          ["reference", "needs-context", "no-change"].includes(status)) ||
        status === filter;
      return matchesText && matchesFilter;
    });
  }, [payload.entries, query, filter]);
  const revisedCount = payload.entries.filter(
    entry => entry.alternateV2
  ).length;
  const proposalCount = payload.entries.filter(entry =>
    [
      "conditional",
      "count-balanced",
      "partial",
      "proposal",
      "section-alignment",
    ].includes(entry.proposal.status)
  ).length;
  const referenceCount = payload.entries.length - proposalCount;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-11">
          <Link
            href="/deck-brewery"
            className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Deck Brewery
          </Link>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
                <FlaskConical className="h-4 w-4" /> Open proposal shelf · no
                sign-in
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">
                Deck Brewery
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Browse independent, untested ideas attached to 166 source lists.
                Additions, cuts, and section moves stay separate from each
                original list, and every review keeps its own count and format
                caveats.
              </p>
            </div>
            <Link
              href="/deck-gallery"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary"
            >
              Open Deck Gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <div className="border border-border bg-background p-3">
              <strong className="block text-2xl font-black">
                {payload.entries.length}
              </strong>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                source lists with a review page
              </span>
            </div>
            <div className="border border-border bg-background p-3">
              <strong className="block text-2xl font-black">
                {proposalCount}
              </strong>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                pages with proposed changes
              </span>
            </div>
            <div className="border border-border bg-background p-3">
              <strong className="block text-2xl font-black">
                {revisedCount}
              </strong>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                separate v2 branches · {referenceCount} reference/clarification
                pages
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-9">
        <section
          className="flex flex-wrap items-center justify-between gap-4 border-2 border-primary/35 bg-primary/[0.035] p-4"
          aria-label="Public Brewery matchups and combos"
        >
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">
              A different way into the shelf
            </p>
            <h2 className="mt-1 text-lg font-black">Matchups & combo lab</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              Three lore-aware pairings and three card-interaction spotlights,
              with source counts, exact titles, and caveats kept visible.
            </p>
          </div>
          <Link
            href="/deck-brewery/matchups"
            className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90"
          >
            Open Showdowns <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section
          className="flex flex-wrap items-center justify-between gap-4 border-2 border-amber-600/40 bg-amber-500/5 p-4"
          aria-label="Separate public Brawlternative child"
        >
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-300">
              Separate public child · untested WIP
            </p>
            <h2 className="mt-1 text-lg font-black">
              Gisa and Geralf — Graveyard Mashup
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              A custom 60-card Commander-preview child using only the public
              source main. Its Vintage-labeled parent remains 110 main + 33
              sideboard with a best-fit / inferred helm; this child’s Gisa and
              Geralf choice is separate and does not edit the parent.
            </p>
          </div>
          <Link
            href="/brawl-box/deck-gisa-and-geralf-graveyard-mashup-preview"
            className="inline-flex min-h-11 items-center gap-2 border-2 border-amber-700/50 bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary"
          >
            Open the 60-card child <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section
          className="grid gap-3 border-2 border-primary/30 bg-primary/[0.035] p-4 md:grid-cols-3"
          aria-label="Proposal handling notes"
        >
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">
                Original lists stay unchanged.
              </strong>{" "}
              These are separate proposal children, not source-list edits.
            </p>
          </div>
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <p className="text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">
                Not final or legally certified.
              </strong>{" "}
              Count balance is not a complete legality check, and none of these
              proposals has been playtested.
            </p>
          </div>
          <div className="flex gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">No sign-in required.</strong>{" "}
              Suggestions are not ownership-matched; nothing is marked as owned.
              Saved format tags are context, not proof of intended format.
            </p>
          </div>
        </section>

        <section
          className="border border-border bg-card p-4 sm:p-5"
          aria-label="Find a deck review"
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
            <label className="relative">
              <span className="sr-only">
                Search titles, cards, roles, and review statuses
              </span>
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.currentTarget.value)}
                placeholder="Search a title, card, role, or status…"
                className="min-h-11 w-full border-2 border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Browse
              <select
                value={filter}
                onChange={event => setFilter(event.currentTarget.value)}
                className="mt-1 block min-h-11 w-full border-2 border-border bg-background px-3 text-xs font-semibold normal-case text-foreground outline-none focus:border-primary"
              >
                <option value="all">All 166 reviews</option>
                <option value="proposals">Proposed changes</option>
                <option value="conditional">Conditional candidates</option>
                <option value="partial">Partial / count-unbalanced</option>
                <option value="count-balanced">
                  Count-balanced · not legal-checked
                </option>
                <option value="references">
                  Reference / no-change / needs context
                </option>
              </select>
            </label>
          </div>
          <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Showing {visibleEntries.length} of {payload.entries.length} reviews
          </p>
        </section>

        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Deck review catalog"
        >
          {visibleEntries.map(entry => {
            const artName =
              getReviewArtName(entry.proposal) ||
              (entry.alternateV2 ? getReviewArtName(entry.alternateV2) : null);
            return (
              <Link
                key={entry.slug}
                href={`/deck-brewery/reviews/${entry.slug}`}
                className="group overflow-hidden border-2 border-border bg-card transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {artName ? (
                  <CardArtwork name={artName} className="h-44 w-full sm:h-48" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/.22),transparent_42%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))] sm:h-48">
                    <FlaskConical className="h-10 w-10 text-primary/60" />
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge proposal={entry.proposal} />
                    {entry.alternateV2 && (
                      <span className="border border-primary/30 bg-primary/[0.04] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">
                        v2 available
                      </span>
                    )}
                  </div>
                  <h2 className="line-clamp-2 text-lg font-black leading-snug group-hover:text-primary">
                    {entry.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="border border-border px-2 py-1">
                      {entry.reviewLens}
                    </span>
                    <span className="border border-border px-2 py-1">
                      {entry.helm.label}
                    </span>
                    {entry.savedFormatLabel && (
                      <span className="border border-border px-2 py-1">
                        Saved tag: {entry.savedFormatLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {entry.helm.commanders.length
                      ? `At the helm: ${entry.helm.commanders.map(card => card.name).join(" + ")}`
                      : entry.helm.label}
                  </p>
                  {entry.helm.separateChildGuess && (
                    <p className="border-l-2 border-amber-600 pl-2 text-[10px] leading-4 text-muted-foreground">
                      Separate child guess: {entry.helm.separateChildGuess.name}
                    </p>
                  )}
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {entry.proposal.adds.length
                      ? `+${entry.proposal.addCopies} proposed card copies`
                      : "No proposed additions"}{" "}
                    ·{" "}
                    {entry.proposal.cuts.length
                      ? `−${entry.proposal.cutCopies} proposed cut copies`
                      : "no proposed cuts"}{" "}
                    ·{" "}
                    {entry.proposal.moves.length
                      ? `${entry.proposal.moves.length} section/zone moves`
                      : "no section move"}
                  </p>
                  {entry.titleCredit && (
                    <p className="border-l-2 border-primary pl-2 text-[10px] leading-4 text-muted-foreground">
                      {entry.titleCredit}; not an authorship or endorsement
                      claim.
                    </p>
                  )}
                  <span className="inline-flex items-center gap-2 pt-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">
                    Open review{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
        {visibleEntries.length === 0 && (
          <p className="border border-border bg-card p-5 text-sm text-muted-foreground">
            No reviews match those filters.
          </p>
        )}
      </main>
    </div>
  );
}

function groupByRole(
  actions: BreweryReviewAction[]
): Array<[string, BreweryReviewAction[]]> {
  const groups = new Map<string, BreweryReviewAction[]>();
  for (const action of actions) {
    const role = action.role || "Role not specified in the review";
    groups.set(role, [...(groups.get(role) || []), action]);
  }
  return Array.from(groups.entries());
}

function ActionGroups({
  title,
  actions,
  sign,
  tone,
}: {
  title: string;
  actions: BreweryReviewAction[];
  sign: "+" | "−";
  tone: "add" | "cut";
}) {
  const groups = groupByRole(actions);
  return (
    <section
      className="border border-border bg-background p-3 sm:p-4"
      aria-label={title}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest">
          {title}
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {actions.reduce((sum, action) => sum + action.quantity, 0)} copies ·{" "}
          {actions.length} cards
        </span>
      </div>
      {groups.length ? (
        <div className="mt-3 space-y-4">
          {groups.map(([role, group]) => (
            <div key={role}>
              <h4 className="mb-2 border-l-2 border-primary pl-2 font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                {role}
              </h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {group.map((action, index) => (
                  <li
                    key={`${action.name}-${index}`}
                    className="flex min-w-0 items-center gap-3 border border-border/70 bg-card p-2"
                  >
                    <CardArtwork
                      name={action.name}
                      className="h-16 w-12 shrink-0"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold leading-5 ${tone === "cut" ? "text-rose-800 dark:text-rose-300" : "text-foreground"}`}
                      >
                        <span className="mr-1 font-mono">
                          {sign}
                          {action.quantity}
                        </span>
                        {action.name}
                      </p>
                      {action.role && (
                        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                          Role: {action.role}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          No {title.toLocaleLowerCase()} are proposed in this branch.
        </p>
      )}
    </section>
  );
}

function ProposalPanel({
  entry,
  proposal,
}: {
  entry: BreweryReviewEntry;
  proposal: BreweryReviewProposal;
}) {
  const hasActions =
    proposal.adds.length + proposal.cuts.length + proposal.moves.length > 0;
  const separateProposalCommander =
    proposal.commander &&
    !entry.helm.commanders.some(card => card.name === proposal.commander);
  return (
    <article
      className="overflow-hidden border-2 border-border bg-card"
      aria-label={proposal.versionLabel}
    >
      <header className="border-b border-border bg-primary/[0.035] p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge proposal={proposal} />
          <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider">
            {proposal.formatLens}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">
              {proposal.versionLabel}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              {entry.title}
            </h2>
          </div>
          {separateProposalCommander && (
            <div className="flex items-center gap-3 border border-amber-700/30 bg-background p-2.5">
              <CardArtwork name={proposal.commander!} className="h-16 w-12" />
              <div>
                <p className="font-mono text-[9px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Proposal-only commander candidate
                </p>
                <p className="mt-1 max-w-48 text-xs font-bold">
                  {proposal.commander}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Not the Gallery helm assignment.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="border border-border bg-background p-2.5">
            <strong className="block text-lg">
              {proposal.sourceMainCopies}
            </strong>
            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
              source main copies
            </span>
          </div>
          <div className="border border-border bg-background p-2.5">
            <strong className="block text-lg">
              {proposal.sourceSideboardCopies}
            </strong>
            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
              source sideboard copies
            </span>
          </div>
          <div className="border border-border bg-background p-2.5">
            <strong className="block text-lg">
              +{proposal.addCopies} / −{proposal.cutCopies}
            </strong>
            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
              proposed add / cut copies
            </span>
          </div>
          <div className="border border-border bg-background p-2.5">
            <strong className="block text-lg">{proposal.moves.length}</strong>
            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
              explicit section / zone moves
            </span>
          </div>
        </div>
      </header>
      <div className="space-y-4 p-4 sm:p-6">
        {!hasActions && (
          <p className="border-l-4 border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
            No adds, cuts, or section moves are proposed. This page records a
            no-change, reference, or clarification status rather than inventing
            a card package.
          </p>
        )}
        {(proposal.adds.length > 0 || proposal.cuts.length > 0) && (
          <div className="grid gap-4 xl:grid-cols-2">
            <ActionGroups
              title="Proposed adds"
              actions={proposal.adds}
              sign="+"
              tone="add"
            />
            <ActionGroups
              title="Proposed cuts"
              actions={proposal.cuts}
              sign="−"
              tone="cut"
            />
          </div>
        )}
        {proposal.moves.length > 0 && (
          <section
            className="border border-sky-700/30 bg-sky-500/[0.035] p-3 sm:p-4"
            aria-label="Proposed section and zone moves"
          >
            <h3 className="font-mono text-xs font-black uppercase tracking-widest">
              Proposed section / zone moves
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {proposal.moves.map((move, index) => (
                <li
                  key={`${move.name}-${index}`}
                  className="flex items-center gap-3 border border-border bg-card p-2"
                >
                  <CardArtwork
                    name={move.name}
                    className="h-16 w-12 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold">
                      {move.quantity}× {move.name}
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                      {move.from === "unspecified section" ||
                      move.to === "unspecified section"
                        ? "Specific source or destination section is not stated in the review."
                        : `${move.from} → ${move.to}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="border-l-4 border-amber-600 bg-amber-500/[0.06] p-3 sm:p-4">
          <h3 className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-200">
            Count &amp; format caveat
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {proposal.countNote}
          </p>
          {proposal.caveat && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {proposal.caveat}
            </p>
          )}
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            This is an untested proposal, not a final deck or a full format,
            color-identity, banned-list, printing, curve, or legality review.
            The saved format tag is source context, not proof of the intended
            format.
          </p>
        </section>
        {proposal.evidence.length > 0 && (
          <section
            className="border border-border p-3 sm:p-4"
            aria-label="Public evidence"
          >
            <h3 className="font-mono text-xs font-black uppercase tracking-widest">
              Public evidence &amp; context
            </h3>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              EDHREC links are current aggregate context, not proof of the
              source list’s intent or a promise of performance.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {proposal.evidence.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold hover:border-primary hover:text-primary"
                >
                  {item.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

export function DeckBreweryReviewDetailView({
  entry,
}: {
  entry: BreweryReviewEntry;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-9">
          <Link
            href="/deck-brewery/reviews"
            className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> All Brewery reviews
          </Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">
                Public Deck Brewery review · no sign-in
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
                {entry.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A separate proposal attached to the source title. The original
                source list remains unchanged.
              </p>
            </div>
            <Link
              href={entry.sourceGalleryHref}
              className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-background px-3 py-2 font-mono text-[9px] font-black uppercase tracking-wider hover:border-primary"
            >
              <BookOpen className="h-4 w-4" /> Open unchanged source list{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {entry.savedFormatLabel && (
            <p className="mt-4 inline-flex border border-border bg-background px-2.5 py-1.5 text-[10px] text-muted-foreground">
              Saved format tag: {entry.savedFormatLabel} · context only
            </p>
          )}
          {entry.titleCredit && (
            <p className="mt-3 max-w-3xl border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground">
              {entry.titleCredit}. This is title-level credit only—not a
              verified author byline, endorsement, or claim of playtesting.
            </p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8 sm:py-9">
        <section
          className="border-2 border-primary/30 bg-primary/[0.035] p-4"
          aria-label="Review rules"
        >
          <p className="text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">
              Independent proposal, not a merged deck.
            </strong>{" "}
            Suggestions are not ownership-matched and none is marked as owned.
            Additions, cuts, and explicit section or command-zone moves below
            are proposed changes only; they do not update the Gallery list.
          </p>
        </section>
        <CommanderHelmPanel helm={entry.helm} />
        <ProposalPanel entry={entry} proposal={entry.proposal} />
        {entry.alternateV2 && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
              Separate revision branch · not merged with the original proposal
            </p>
            <ProposalPanel entry={entry} proposal={entry.alternateV2} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/deck-brewery/reviews"
            className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary"
          >
            <ArrowLeft className="h-4 w-4" /> All reviews
          </Link>
          <Link
            href="/deck-gallery"
            className="inline-flex min-h-10 items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
          >
            Deck Gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function DeckBreweryReviews() {
  const [payload, setPayload] = useState<BreweryReviewPayload | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadDeckBreweryReviews()
      .then(result => {
        if (active) setPayload(result);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "The public review catalog could not be loaded."
          );
      });
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p
          role="alert"
          className="border border-rose-600/40 bg-rose-500/5 p-4 text-sm"
        >
          {error}
        </p>
      </div>
    );
  if (!payload)
    return (
      <div
        className="flex min-h-[45vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        Loading public Brewery reviews…
      </div>
    );
  return <DeckBreweryReviewIndexView payload={payload} />;
}

export function DeckBreweryReviewDetail() {
  const [match, params] = useRoute("/deck-brewery/reviews/:reviewSlug");
  const [payload, setPayload] = useState<BreweryReviewPayload | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadDeckBreweryReviews()
      .then(result => {
        if (active) setPayload(result);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "The public review could not be loaded."
          );
      });
    return () => {
      active = false;
    };
  }, []);
  if (!match) return null;
  if (error)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p
          role="alert"
          className="border border-rose-600/40 bg-rose-500/5 p-4 text-sm"
        >
          {error}
        </p>
      </div>
    );
  if (!payload)
    return (
      <div
        className="flex min-h-[45vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        Loading this Brewery review…
      </div>
    );
  const entry = payload.entries.find(
    candidate => candidate.slug === params?.reviewSlug
  );
  if (!entry)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-black">Review not found</h1>
        <Link
          href="/deck-brewery/reviews"
          className="mt-3 inline-flex text-sm text-primary underline"
        >
          Browse all reviews
        </Link>
      </div>
    );
  return <DeckBreweryReviewDetailView entry={entry} />;
}
