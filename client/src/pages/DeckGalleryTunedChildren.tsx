import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import {
  loadDeckGalleryTunedChildren,
  type DeckGalleryTunedChildrenPayload,
} from "@/lib/deckGalleryTunedChildren";

export default function DeckGalleryTunedChildren() {
  const [payload, setPayload] = useState<DeckGalleryTunedChildrenPayload | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Tuned child revisions · Deck Gallery | MTG Tracker";
    let active = true;
    loadDeckGalleryTunedChildren()
      .then(value => {
        if (active) setPayload(value);
      })
      .catch((reason: unknown) => {
        if (active)
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Tuned-child suggestions are temporarily unavailable."
          );
      });
    return () => {
      active = false;
      document.title = previousTitle;
    };
  }, []);

  if (loadError) {
    return (
      <main className="container min-h-[60vh] py-12">
        <h1 className="text-3xl font-black">Tuned children unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground" role="alert">
          {loadError}
        </p>
        <Link href="/deck-gallery" className="mt-6 inline-flex min-h-11 items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Deck Gallery
        </Link>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="container min-h-[60vh] py-12">
        <p className="border-2 border-border bg-card p-5 text-sm text-muted-foreground" role="status">
          Loading tuned child revisions…
        </p>
      </main>
    );
  }

  return (
    <main className="container min-h-[75vh] py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl">
        <Link href="/deck-gallery" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Deck Gallery
        </Link>
      </nav>

      <header className="mx-auto mt-4 max-w-6xl border-b-2 border-border pb-6">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
          Separate child revisions · original rows kept intact
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Tuned Commander Children
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          These are proposed, unplayed tuned-casual builds based on public Deckbox parent lists. Each child is a separate revision: the parent list stays unchanged, no collection match is made, and no ownership is claimed.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat value={payload.children.length} label="separate child builds" />
          <Stat value="99 + commander" label="cards in each checked list" />
          <Stat value="Tuned casual" label="not cEDH; unplayed proposals" />
        </div>
        <p className="mt-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          Card identity, format legality, singleton count, source differences, and list totals were checked as noted on each page. Mana-source balance is not playtested, and no cards are marked as owned.
        </p>
      </header>

      <section aria-label="Tuned Commander child revisions" className="mx-auto mt-7 grid max-w-6xl gap-4">
        {payload.children.map(child => (
          <article key={child.childSlug} className="border-2 border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="border border-emerald-500 bg-emerald-50 px-2 py-1 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">Proposed · unplayed</span>
                  <span className="border border-border bg-background px-2 py-1">Tuned casual · not cEDH</span>
                  {child.parentSectionsOmitted && <span className="border border-amber-500 bg-amber-50 px-2 py-1 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">Parent export incomplete</span>}
                </div>
                <h2 className="mt-3 break-words text-xl font-black tracking-tight sm:text-2xl">{child.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Commander: {child.commanders.map(card => card.name).join(" + ")} · {child.validation.mainCount} main + {child.validation.commanderCount} command-zone card = {child.validation.totalCount}
                </p>
              </div>
              <Link href={`/deck-gallery/child/${child.childSlug}`} className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                Open child <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs">
              <Link href={child.parentHref} className="font-semibold text-primary underline-offset-4 hover:underline">
                Parent source: {child.sourceTitle}
              </Link>
              <span className="text-muted-foreground">{child.validation.scryfallLandCount} land cards by Scryfall type line</span>
              <span className="text-muted-foreground">{child.exactChanges.cuts.reduce((sum, row) => sum + row.quantity, 0)} cut copies · {child.exactChanges.adds.reduce((sum, row) => sum + row.quantity, 0)} added copies</span>
            </div>
            {child.parentSectionsOmitted && (
              <p className="mt-3 text-xs leading-5 text-amber-900 dark:text-amber-100">{child.sourceNote}</p>
            )}
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{child.attributionNote}</p>
          </article>
        ))}
      </section>

      <footer className="mx-auto mt-8 flex max-w-6xl flex-wrap gap-3 border-t-2 border-border pt-5">
        <Link href="/deck-gallery" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Browse original lists
        </Link>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border-2 border-border bg-card p-4 shadow-sm">
      <p className="font-mono text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p>
    </div>
  );
}
