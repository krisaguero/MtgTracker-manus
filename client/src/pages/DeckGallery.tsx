import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { Link } from "wouter";
import {
  buildPublicBrowseHref,
  readPublicBrowseState,
  replacePublicBrowseState,
} from "@/lib/publicBrowseState";
import {
  getDeckGalleryDisplayMeta,
  isDeckGalleryWip,
  loadDeckGallery,
  type DeckGalleryEntry,
  type DeckGalleryPayload,
} from "@/lib/deckGallery";

type GalleryMode = "catalog" | "wip" | "robogles";
type Spotlight = {
  deckTitle: string;
  sourceFacts: string;
  editorialRead: string;
  cards: string[];
};

const ROBERT_SPOTLIGHTS: Spotlight[] = [
  {
    deckTitle: "Tazri's Allies @robogles",
    sourceFacts:
      "The saved main list includes General Tazri, Munda, Ambush Leader, and Ally Encampment.",
    editorialRead:
      "Those named cards point to an Allies-focused package with support across the list. This is a reading of the card choices, not a claim that the list was tested.",
    cards: ["General Tazri", "Munda, Ambush Leader", "Ally Encampment"],
  },
  {
    deckTitle: "ZadaMonored (RoboGles)",
    sourceFacts:
      "The saved main list includes Zada, Hedron Grinder, Akroan Crusader, and Akroan Line Breaker.",
    editorialRead:
      "The title and those source rows suggest a red creature-and-spell package that can reward targeting one creature. That is an editorial interpretation, not playtest evidence.",
    cards: ["Zada, Hedron Grinder", "Akroan Crusader", "Akroan Line Breaker"],
  },
  {
    deckTitle: "Brion Quarterback Club - A Robogles Deck",
    sourceFacts:
      "The main list contains Brion Stoutarm, Act of Treason, and Act of Aggression; the source row count is 100 main copies.",
    editorialRead:
      "The Brion-plus-steal effects suggest a throw-the-opponent’s-creatures-back-at-them theme. The count is compatible with a contextual 100-card assumption, but the archive did not confirm format, completion, or playtesting.",
    cards: ["Brion Stoutarm", "Act of Treason", "Act of Aggression"],
  },
  {
    deckTitle: "Kaseto Smackdown - Robogles",
    sourceFacts:
      "The saved main list includes Kaseto, Orochi Archmage, Seshiro the Anointed, and Shisato, Whispering Hunter, with 95 main copies and a separate 19-card sideboard.",
    editorialRead:
      "The title and legendary-creature choices suggest a Snake/unblockable theme. The sideboard remains separate; no cards have been moved into the main list.",
    cards: [
      "Kaseto, Orochi Archmage",
      "Seshiro the Anointed",
      "Shisato, Whispering Hunter",
    ],
  },
  {
    deckTitle: "Karlov's Lives @robogles",
    sourceFacts:
      "The saved main list includes Karlov of the Ghost Council, Ajani's Mantra, Angelic Accord, and Aetherflux Reservoir.",
    editorialRead:
      "The named cards suggest a life-gain payoff package layered over an Orzhov shell. The highlight describes card choices only; it does not rank the deck’s strength.",
    cards: [
      "Karlov of the Ghost Council",
      "Ajani's Mantra",
      "Angelic Accord",
      "Aetherflux Reservoir",
    ],
  },
  {
    deckTitle: "King's Rides @robogles",
    sourceFacts:
      "The saved main list includes King Macar, the Gold-Cursed, Aradara Express, and Ballista Charger.",
    editorialRead:
      "The title and vehicle names make this one of the more distinctive theme-led builds in the showcase. This is a theme observation, not a performance claim.",
    cards: [
      "King Macar, the Gold-Cursed",
      "Aradara Express",
      "Ballista Charger",
    ],
  },
];

const isRobertEntry = (entry: DeckGalleryEntry) =>
  entry.group === "robert_title_credit";
const isOwnerEntry = (entry: DeckGalleryEntry) => !isRobertEntry(entry);

function RouteTabs({ mode }: { mode: GalleryMode }) {
  const items = [
    { mode: "catalog" as const, href: "/deck-gallery", label: "Deck Gallery" },
    { mode: "wip" as const, href: "/deck-gallery/wip", label: "WIP & Offbeat" },
    {
      mode: "robogles" as const,
      href: "/deck-gallery/robogles",
      label: "Robert “Robogles”",
    },
  ];
  return (
    <nav aria-label="Deck Gallery pages" className="mt-7 flex flex-wrap gap-2">
      {items.map(item => (
        <Link
          key={item.mode}
          href={item.href}
          aria-current={mode === item.mode ? "page" : undefined}
          className={`inline-flex min-h-10 items-center border-2 px-4 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${mode === item.mode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary hover:text-primary"}`}
        >
          {item.label}
        </Link>
      ))}
      <Link
        href="/deck-gallery/children"
        className="inline-flex min-h-10 items-center border-2 border-border bg-background px-4 text-xs font-black text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Tuned children
      </Link>
    </nav>
  );
}

function SourceBoundary({ mode }: { mode: GalleryMode }) {
  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-2">
      <aside className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
        <strong>Source and credit:</strong> Deckbox did not show a separate
        owner/author field. Kris’s archive entries are grouped from the personal
        archive; Robert’s entries keep their exact Robogles title credits and
        Kris’s confirmation that he cleared them for publication. The page does
        not claim playtesting, completeness, or authorship beyond those source
        facts.
      </aside>
      <aside className="border-l-4 border-primary bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
        <strong className="text-foreground">List handling:</strong> Card names,
        quantities, row order, and main/sideboard separation are preserved.
        Hidden source sections are not reconstructed; cards are not marked as
        owned, and no collection-derived suggestions or AI-assisted morphs are
        included.
        {mode === "robogles" && (
          <span>
            {" "}
            The spotlight readings below are editorial observations, not claims
            about Robert’s own statements or deck performance.
          </span>
        )}
      </aside>
    </div>
  );
}

function PageIntro({
  mode,
  payload,
}: {
  mode: GalleryMode;
  payload: DeckGalleryPayload | null;
}) {
  const entries = payload?.entries ?? [];
  const ownerCount = entries.filter(isOwnerEntry).length;
  const robertCount = entries.filter(isRobertEntry).length;
  const oversizedCount = entries.filter(
    entry => getDeckGalleryDisplayMeta(entry).vintageOversizeOverride
  ).length;
  const wipCount = entries.filter(isDeckGalleryWip).length;

  if (mode === "robogles") {
    return (
      <header className="mx-auto max-w-5xl border-b-2 border-border pb-6">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
          Public title-credit showcase · source cards kept intact
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Robert “Robogles” · Deckcraft
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          A spotlight on distinctive, theme-led source lists whose original
          Deckbox titles credit Robogles. The saved pages did not show a
          separate author field; the titles and clearance are credited as such.
          No AI-derived morphs are included.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat value={robertCount} label="Robogles title-credit lists" />
          <Stat value={ownerCount} label="other archive lists in the gallery" />
          <Stat
            value={oversizedCount}
            label="Vintage-tagged lists shown as oversized Commander"
          />
        </div>
        <SourceBoundary mode={mode} />
      </header>
    );
  }

  if (mode === "wip") {
    return (
      <header className="mx-auto max-w-5xl border-b-2 border-border pb-6">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
          Work in progress · offbeat source lists
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          WIP &amp; Offbeat
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          Incomplete, over-target, empty, and unusual lists stay visible here
          with honest labels. Nothing is filled in or changed. Count context is
          structural only—not a format, legality, or completion check.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat value={wipCount} label="WIP/offbeat source lists" />
          <Stat
            value={oversizedCount}
            label="Vintage-tagged lists reclassified for display"
          />
          <Stat value={ownerCount} label="Kris archive entries overall" />
        </div>
        <SourceBoundary mode={mode} />
      </header>
    );
  }

  return (
    <header className="mx-auto max-w-5xl border-b-2 border-border pb-6">
      <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
        Public deck shelf · exact source rows
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
        Deck Gallery
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
        A searchable home for the deck lists in Kris’s Deckbox archive,
        including oddball brews and a clearly credited Robert showcase. Original
        source rows remain separate from editorial reading.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat value={entries.length} label="proposed list entries" />
        <Stat value={ownerCount} label="from Kris’s Deckbox archive" />
        <Stat value={robertCount} label="Robogles title-credit showcase" />
        <Stat
          value={oversizedCount}
          label="Vintage-tagged lists shown as oversized Commander"
        />
      </div>
      <SourceBoundary mode={mode} />
    </header>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-2 border-border bg-card p-4 shadow-sm">
      <p className="font-mono text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p>
    </div>
  );
}

function CardRows({
  heading,
  cards,
}: {
  heading: string;
  cards: DeckGalleryEntry["main"];
}) {
  return (
    <section aria-label={heading}>
      <h4 className="font-mono text-xs font-black uppercase tracking-[0.16em] text-primary">
        {heading}
      </h4>
      <ul className="mt-2 divide-y divide-border border-2 border-border bg-background">
        {cards.map((card, index) => (
          <li
            key={`${card.name}-${index}`}
            className="flex items-start justify-between gap-4 px-3 py-2 text-sm"
          >
            <span className="min-w-0 break-words">{card.name}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {card.quantity}×
            </span>
          </li>
        ))}
        {!cards.length && (
          <li className="px-3 py-3 text-sm text-muted-foreground">
            No exported rows.
          </li>
        )}
      </ul>
    </section>
  );
}

function DeckCard({
  entry,
  detailHref,
  open,
  onToggle,
}: {
  entry: DeckGalleryEntry;
  detailHref: string;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = getDeckGalleryDisplayMeta(entry);
  const isRobert = isRobertEntry(entry);
  return (
    <article
      id={entry.id}
      className="scroll-mt-24 border-2 border-border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
            <span
              className={`border px-2 py-1 ${isRobert ? "border-violet-400 bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-100" : "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"}`}
            >
              {isRobert ? "Robogles title credit" : "Kris archive"}
            </span>
            <span className="border border-border bg-background px-2 py-1">
              {meta.displayStatus}
            </span>
            <span className="border border-border bg-background px-2 py-1">
              {meta.formatLabel}
            </span>
          </div>
          <h3 className="mt-3 break-words text-xl font-bold tracking-tight">
            {entry.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={detailHref}
            className="inline-flex min-h-10 items-center gap-2 border-2 border-primary bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-90"
            aria-label={`Open visual deck page for ${entry.title}`}
          >
            Visual deck page <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href={`#${entry.id}`}
            className="inline-flex min-h-9 items-center border border-border px-3 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            aria-label={`Direct link to ${entry.title}`}
          >
            Direct link
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Main: {entry.mainCopies} copies · {entry.mainRows} rows
        </span>
        <span>
          Sideboard: {entry.sideboardCopies} copies · {entry.sideboardRows} rows
        </span>
        {meta.contextualTarget !== null && (
          <span>Contextual target: {meta.contextualTarget} main copies</span>
        )}
      </div>
      {meta.formatNote && (
        <p className="mt-3 border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          {meta.formatNote}
        </p>
      )}
      {entry.sourceSectionsOmitted && (
        <p className="mt-3 border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          One or more source sections were unavailable in the export and are
          omitted here. This is not the complete Deckbox record.
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {entry.creditLine}
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`list-${entry.id}`}
        className="mt-4 inline-flex min-h-10 items-center gap-2 border-2 border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {open
          ? "Hide exact card list"
          : `Review exact card list · ${entry.mainCopies} main copies`}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={`list-${entry.id}`}
          className="mt-5 grid gap-5 border-t-2 border-border pt-5 lg:grid-cols-2"
        >
          <CardRows
            heading={`Main · ${entry.mainCopies} copies`}
            cards={entry.main}
          />
          <CardRows
            heading={`Sideboard · ${entry.sideboardCopies} copies`}
            cards={entry.sideboard}
          />
          <p className="text-xs leading-5 text-muted-foreground lg:col-span-2">
            Card rows follow the saved source order. Printings are not pinned as
            specific physical copies. Contextual count labels are not legality
            or completion checks.
          </p>
        </div>
      )}
    </article>
  );
}

function SpotlightCards({ payload }: { payload: DeckGalleryPayload | null }) {
  const publishedTitles = new Set(
    (payload?.entries ?? []).filter(isRobertEntry).map(entry => entry.title)
  );
  const highlights = ROBERT_SPOTLIGHTS.filter(item =>
    publishedTitles.has(item.deckTitle)
  );
  if (!highlights.length) return null;
  return (
    <section
      className="mx-auto mt-8 max-w-5xl"
      aria-labelledby="craftsmanship-heading"
    >
      <div className="border-l-4 border-primary bg-muted/50 p-4 text-sm leading-6">
        <strong>Editorial note:</strong> The spotlights separate observed
        source-list facts from a curator’s interpretation. They do not claim
        Robert stated those strategies, that a list was tested, or that a card
        choice proves a power level or endorsement.
      </div>
      <h2
        id="craftsmanship-heading"
        className="mt-7 text-2xl font-black tracking-tight"
      >
        Craftsmanship spotlights
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {highlights.map(item => (
          <article
            key={item.deckTitle}
            className="border-2 border-border bg-card p-5 shadow-sm"
          >
            <h3 className="break-words text-lg font-bold">{item.deckTitle}</h3>
            <p className="mt-3 border-l-4 border-emerald-600 pl-3 text-sm leading-6">
              <strong>Source facts:</strong> {item.sourceFacts}
            </p>
            <p className="mt-3 border-l-4 border-primary pl-3 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Editorial read:</strong>{" "}
              {item.editorialRead}
            </p>
            <div
              className="mt-3 flex flex-wrap gap-2"
              aria-label="Cards mentioned in this spotlight"
            >
              {item.cards.map(card => (
                <span
                  key={card}
                  className="border border-border bg-background px-2 py-1 text-xs"
                >
                  {card}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeckGalleryPage({ mode }: { mode: GalleryMode }) {
  const [payload, setPayload] = useState<DeckGalleryPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState(() =>
    readPublicBrowseState(
      typeof window === "undefined" ? "" : window.location.search,
      "status"
    ).query
  );
  const [statusFilter, setStatusFilter] = useState(() =>
    readPublicBrowseState(
      typeof window === "undefined" ? "" : window.location.search,
      "status"
    ).filter
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const title =
      mode === "robogles"
        ? "Robert “Robogles” Deckcraft Showcase | MTG Tracker"
        : mode === "wip"
          ? "WIP & Offbeat Decks | MTG Tracker"
          : "Deck Gallery | MTG Tracker";
    document.title = title;
    let active = true;
    loadDeckGallery()
      .then(data => {
        if (active) setPayload(data);
      })
      .catch((reason: unknown) => {
        if (active)
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Deck Gallery is temporarily unavailable."
          );
      });
    return () => {
      active = false;
    };
  }, [mode]);

  useEffect(() => {
    replacePublicBrowseState({ query: search, filter: statusFilter }, "status");
  }, [search, statusFilter, mode]);

  const baseEntries = useMemo(() => {
    const entries = payload?.entries ?? [];
    if (mode === "robogles") return entries.filter(isRobertEntry);
    if (mode === "wip") return entries.filter(isDeckGalleryWip);
    return entries;
  }, [payload, mode]);

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(
          baseEntries.map(
            entry => getDeckGalleryDisplayMeta(entry).displayStatus
          )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [baseEntries]
  );

  useEffect(() => {
    if (payload && statusFilter !== "all" && !statuses.includes(statusFilter))
      setStatusFilter("all");
  }, [payload, statusFilter, statuses]);

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return baseEntries.filter(entry => {
      const meta = getDeckGalleryDisplayMeta(entry);
      if (statusFilter !== "all" && meta.displayStatus !== statusFilter)
        return false;
      if (!query) return true;
      return [
        entry.title,
        entry.creditLine,
        entry.savedFormat ?? "",
        meta.formatLabel,
        meta.displayStatus,
      ]
        .concat(
          entry.main.map(card => card.name),
          entry.sideboard.map(card => card.name)
        )
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [baseEntries, search, statusFilter]);

  function toggleExpanded(id: string) {
    setExpandedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const listLabel =
    mode === "robogles"
      ? "Robogles title-credit source lists"
      : mode === "wip"
        ? "WIP and offbeat source lists"
        : "Deck Gallery source lists";

  return (
    <main className="container min-h-[75vh] py-8 sm:py-12">
      <PageIntro mode={mode} payload={payload} />
      <RouteTabs mode={mode} />
      {mode === "robogles" && <SpotlightCards payload={payload} />}

      <section
        className="mx-auto mt-7 max-w-7xl"
        aria-label={listLabel}
        aria-live="polite"
      >
        <div className="mb-4 grid gap-3 border-2 border-border bg-muted/40 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-4">
          <label className="flex min-h-11 items-center gap-2 border-2 border-border bg-background px-3 focus-within:border-primary">
            <Search
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="sr-only">
              Search titles, cards, and saved formats
            </span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search titles, cards, or saved format"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 border-2 border-border bg-background px-3 text-sm">
            <span className="shrink-0 text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="min-w-32 bg-transparent py-2 outline-none"
            >
              <option value="all">All statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mb-3 text-xs text-muted-foreground" role="status">
          Showing {visibleEntries.length} of {baseEntries.length} proposed
          source lists · original lists are not modified.
        </p>

        {loadError && (
          <div
            className="border-2 border-destructive/40 bg-destructive/5 p-5 text-sm leading-6"
            role="alert"
          >
            {loadError}
          </div>
        )}
        {!payload && !loadError && (
          <div
            className="border-2 border-border bg-card p-5 text-sm text-muted-foreground"
            role="status"
          >
            Loading approved public source lists…
          </div>
        )}
        {payload && visibleEntries.length === 0 && (
          <div className="border-2 border-dashed border-border p-7 text-sm text-muted-foreground">
            No lists match this search.
          </div>
        )}
        {payload && visibleEntries.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleEntries.map(entry => (
              <DeckCard
                key={entry.id}
                entry={entry}
                detailHref={buildPublicBrowseHref(
                  `/deck-gallery/${entry.id}`,
                  { query: search, filter: statusFilter },
                  "status"
                )}
                open={expandedIds.has(entry.id)}
                onToggle={() => toggleExpanded(entry.id)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto mt-9 max-w-7xl border-t-2 border-border pt-4 text-xs leading-5 text-muted-foreground">
        Counts and target labels are structural context only. A count-compatible
        list is not confirmed complete; over-target labels are not legal or
        format checks. Twenty Vintage-tagged lists with more than 100 main
        copies are displayed as oversized Commander brews per Kris’s
        clarification; their saved Vintage source label remains noted and no
        rows were changed. Three exports omit unavailable source sections, which
        are marked on their entries. No Deckbox record IDs, source archive,
        collection ownership matches, or collection-derived recommendations are
        included.
      </footer>
    </main>
  );
}

export default function DeckGallery() {
  return <DeckGalleryPage mode="catalog" />;
}

export function DeckGalleryWip() {
  return <DeckGalleryPage mode="wip" />;
}

export function RoboglesDeckShowcase() {
  return <DeckGalleryPage mode="robogles" />;
}
