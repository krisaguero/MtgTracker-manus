import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { CommanderHelmPanel } from "@/components/CommanderHelmPanel";
import { CardImageZoom } from "@/components/CardImageZoom";
import { DeckGalleryRoleReading } from "@/components/DeckGalleryRoleReading";
import {
  getDeckGalleryDisplayMeta,
  isDeckGalleryWip,
  loadDeckGallery,
  type DeckGalleryCard as GalleryCard,
  type DeckGalleryEntry,
} from "@/lib/deckGallery";

function galleryIndexHref(entry: DeckGalleryEntry): string {
  if (entry.group === "robert_title_credit") return "/deck-gallery/robogles";
  if (isDeckGalleryWip(entry)) return "/deck-gallery/wip";
  return "/deck-gallery";
}

function cardImageUrl(name: string): string {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

function CardGallery({
  heading,
  cards,
  copies,
}: {
  heading: string;
  cards: GalleryCard[];
  copies: number;
}) {
  return (
    <section aria-label={heading} className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-border pb-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Source order preserved
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{heading}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {copies} copies · {cards.length} rows
        </p>
      </div>
      {cards.length ? (
        <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card, index) => (
            <li
              key={`${card.name}-${index}`}
              className="min-w-0 border-2 border-border bg-card p-2 shadow-sm"
            >
              <div className="aspect-[488/680] overflow-hidden bg-muted">
                <CardImageZoom
                  src={cardImageUrl(card.name)}
                  alt={`${card.name} representative card image`}
                  className="h-full w-full"
                />
              </div>
              <div className="mt-2 flex items-start justify-between gap-2 text-xs leading-5">
                <span className="min-w-0 break-words font-semibold">
                  {card.name}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                  {card.quantity}×
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 border-2 border-dashed border-border p-5 text-sm text-muted-foreground">
          No exported rows in this section.
        </p>
      )}
    </section>
  );
}

function ExactTextList({ entry }: { entry: DeckGalleryEntry }) {
  const rows = (heading: string, cards: GalleryCard[]) => (
    <section aria-label={heading}>
      <h3 className="font-mono text-xs font-black uppercase tracking-[0.16em] text-primary">
        {heading}
      </h3>
      <ol className="mt-2 divide-y divide-border border-2 border-border bg-background">
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
      </ol>
    </section>
  );

  return (
    <details className="mt-8 border-2 border-border bg-card p-4 sm:p-5">
      <summary className="min-h-11 cursor-pointer content-center text-lg font-black">
        Exact text list · main and sideboard
      </summary>
      <div className="mt-4 grid gap-5 border-t-2 border-border pt-5 lg:grid-cols-2">
        {rows(`Main · ${entry.mainCopies} copies`, entry.main)}
        {rows(`Sideboard · ${entry.sideboardCopies} copies`, entry.sideboard)}
        <p className="text-xs leading-5 text-muted-foreground lg:col-span-2">
          Card rows follow the saved source order. Printings are not pinned as
          specific physical copies. Contextual count labels are not legality or
          completion checks.
        </p>
      </div>
    </details>
  );
}

export function DeckGalleryDetailView({ entry }: { entry: DeckGalleryEntry }) {
  const meta = getDeckGalleryDisplayMeta(entry);
  const isRobert = entry.group === "robert_title_credit";
  const backHref = galleryIndexHref(entry);

  return (
    <main className="container min-h-[75vh] py-8 sm:py-12">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-xs font-bold"
      >
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backHref === "/deck-gallery/robogles"
            ? "Robogles showcase"
            : backHref === "/deck-gallery/wip"
              ? "WIP & Offbeat"
              : "Deck Gallery"}
        </Link>
        <span aria-hidden="true">/</span>
        <span
          aria-current="page"
          className="max-w-[min(70vw,42rem)] truncate text-muted-foreground"
        >
          {entry.title}
        </span>
      </nav>

      <header className="mx-auto mt-5 max-w-7xl border-2 border-border bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="p-5 sm:p-8">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
              Individual deck page · visual source-list view
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
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
            <h1 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-5xl">
              {entry.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              A precon-inspired visual layout for this saved list—not an
              official preconstructed deck, format certification, or claim that
              the source is complete. Card names, quantities, order, and
              main/sideboard separation stay as saved.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Main deck"
                value={`${entry.mainCopies} copies`}
                detail={`${entry.mainRows} rows`}
              />
              <Stat
                label="Sideboard"
                value={`${entry.sideboardCopies} copies`}
                detail={`${entry.sideboardRows} rows`}
              />
              <Stat
                label="Saved format"
                value={entry.savedFormat || "Not specified"}
                detail="Source label retained"
              />
              <Stat
                label="List status"
                value={meta.displayStatus}
                detail={
                  meta.contextualTarget === null
                    ? "No target implied"
                    : `Contextual target: ${meta.contextualTarget}`
                }
              />
            </div>
          </div>
          <div className="border-t-2 border-border bg-muted/40 p-5 sm:p-7 lg:border-l-2 lg:border-t-0">
            <CommanderHelmPanel
              helm={entry.helm}
              className="border-0 bg-transparent p-0"
            />
          </div>
        </div>
        {meta.formatNote && (
          <p className="border-t-2 border-amber-500 bg-amber-50 px-5 py-3 text-xs leading-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100 sm:px-8">
            {meta.formatNote}
          </p>
        )}
        {entry.sourceSectionsOmitted && (
          <p className="border-t-2 border-amber-500 bg-amber-50 px-5 py-3 text-xs leading-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100 sm:px-8">
            One or more source sections were unavailable in the export and are
            omitted here. This is not the complete Deckbox record.
          </p>
        )}
        <p className="border-t border-border px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-8">
          {entry.creditLine}
        </p>
      </header>

      <div className="mx-auto max-w-7xl">
        <DeckGalleryRoleReading entry={entry} />
        <CardGallery
          heading="Main deck"
          cards={entry.main}
          copies={entry.mainCopies}
        />
        <CardGallery
          heading="Sideboard"
          cards={entry.sideboard}
          copies={entry.sideboardCopies}
        />
        <ExactTextList entry={entry} />

        <footer className="mt-8 border-t-2 border-border pt-4 text-xs leading-5 text-muted-foreground">
          Representative card images are loaded from{" "}
          <a
            href="https://scryfall.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Scryfall
          </a>
          ; card imagery © Wizards of the Coast. Images do not identify a
          specific printing or imply ownership. The saved source rows remain the
          reference for the exact list. No collection matches or
          collection-derived suggestions appear here.
        </footer>

        <nav
          aria-label="More Deck Gallery pages"
          className="mt-8 flex flex-wrap gap-3 border-t-2 border-border pt-5"
        >
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to{" "}
            {backHref === "/deck-gallery/robogles"
              ? "Robogles showcase"
              : backHref === "/deck-gallery/wip"
                ? "WIP & Offbeat"
                : "Deck Gallery"}
          </Link>
          <Link
            href="/deck-gallery"
            className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary"
          >
            Browse all decks{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-border bg-background p-3">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function DeckGalleryDetail({
  params,
}: {
  params: { deckId: string };
}) {
  const [entries, setEntries] = useState<DeckGalleryEntry[] | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Loading deck page · Deck Gallery | MTG Tracker";
    let active = true;
    loadDeckGallery()
      .then(payload => {
        if (active) setEntries(payload.entries);
      })
      .catch((reason: unknown) => {
        if (active) {
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Deck Gallery is temporarily unavailable."
          );
        }
      });
    return () => {
      active = false;
      document.title = previousTitle;
    };
  }, [params.deckId]);

  const entry = entries?.find(candidate => candidate.id === params.deckId);
  useEffect(() => {
    if (entry) document.title = `${entry.title} · Deck Gallery | MTG Tracker`;
  }, [entry?.title]);

  if (loadError) {
    return (
      <main className="container min-h-[60vh] py-12">
        <h1 className="text-3xl font-black">Deck page unavailable</h1>
        <p
          className="mt-3 text-sm leading-6 text-muted-foreground"
          role="alert"
        >
          {loadError}
        </p>
        <Link
          href="/deck-gallery"
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Deck Gallery
        </Link>
      </main>
    );
  }
  if (!entries) {
    return (
      <main className="container min-h-[60vh] py-12">
        <p
          className="border-2 border-border bg-card p-5 text-sm text-muted-foreground"
          role="status"
        >
          Loading approved public deck list…
        </p>
      </main>
    );
  }
  if (!entry) {
    return (
      <main className="container min-h-[60vh] py-12">
        <h1 className="text-3xl font-black">Deck page not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This list is not in the public Deck Gallery.
        </p>
        <Link
          href="/deck-gallery"
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Deck Gallery
        </Link>
      </main>
    );
  }
  return <DeckGalleryDetailView entry={entry} />;
}
