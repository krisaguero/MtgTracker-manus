import React, { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";
import { CardImageZoom } from "@/components/CardImageZoom";
import { DeckGalleryRoleReading } from "@/components/DeckGalleryRoleReading";
import { getDeckboxBattleBoxEntries, type DeckboxBattleBoxEntry } from "@/lib/deckboxBattleBox";
import { loadDeckGallery } from "@/lib/deckGallery";

function cardImageUrl(name: string): string {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

function downloadSourceList(entry: DeckboxBattleBoxEntry) {
  const sections = [
    `Source title: ${entry.sourceTitle}`,
    `Source credit: ${entry.sourceCredit}`,
    `Saved format label: ${entry.savedFormat || "Not specified"}`,
    `Main deck: ${entry.mainCopies} copies`,
    ...entry.main.map(card => `${card.quantity} ${card.name}`),
    `Sideboard: ${entry.sideboardCopies} copies`,
    ...entry.sideboard.map(card => `${card.quantity} ${card.name}`),
  ];
  const blob = new Blob([sections.join("\n") + "\n"], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${entry.id}-saved-list.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SavedListSection({
  title,
  sectionName,
  cards,
  copies,
}: {
  title: string;
  sectionName: string;
  cards: DeckboxBattleBoxEntry["main"];
  copies: number;
}) {
  return (
    <section className="mt-8 border-2 border-border bg-card p-4 sm:p-6" aria-label={sectionName}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border pb-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            Original saved order
          </p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>
        <span className="border border-border bg-background px-3 py-2 font-mono text-xs font-bold">
          {copies} copies · {cards.length} rows
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        This visual list follows the saved row order. Role groups above are a separate editorial view and do not reorder or edit these source rows.
      </p>
      {cards.length ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cards.map((card, index) => (
            <li key={`${card.name}-${index}`} className="min-w-0 border border-border bg-background p-2">
              <div className="aspect-[488/680] overflow-hidden bg-muted">
                <CardImageZoom
                  src={cardImageUrl(card.name)}
                  alt={`${card.name} card image in original saved order`}
                  className="h-full w-full"
                />
              </div>
              <div className="mt-2 flex items-start justify-between gap-1 text-[11px] leading-4">
                <span className="min-w-0 break-words font-semibold">{card.name}</span>
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{card.quantity}×</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border border-dashed border-border p-4 text-sm text-muted-foreground">
          No rows were saved in this section.
        </p>
      )}
      <details className="mt-5 border border-border bg-background p-4">
        <summary className="cursor-pointer font-mono text-xs font-bold">
          Exact text list · {sectionName} · {copies} copies
        </summary>
        {cards.length ? (
          <ol className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <li key={`${card.name}-${index}`} className="flex gap-2 py-1">
                <span className="w-8 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                  {card.quantity}×
                </span>
                <span>{card.name}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No saved rows.</p>
        )}
      </details>
    </section>
  );
}

export function DeckboxBattleBoxDetailView({ entry }: { entry: DeckboxBattleBoxEntry }) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Battle Box navigation" className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/battle-box#deckbox-60-card-archive"
            className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Battle Box
          </Link>
          <button
            type="button"
            onClick={() => downloadSourceList(entry)}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Download saved list
          </button>
        </nav>

        <header className="border-2 border-border bg-card">
          <div className="p-5 sm:p-8">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Separate Deckbox archive reference · non-Commander
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {entry.sourceTitle}
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-muted-foreground">
              {entry.strategySummary}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Main deck" value={`${entry.mainCopies} copies`} detail={`${entry.mainRows} saved rows`} />
              <Stat label="Sideboard" value={`${entry.sideboardCopies} copies`} detail={`${entry.sideboardRows} saved rows`} />
              <Stat label="Saved format label" value={entry.savedFormat || "Not specified"} detail="Archive label retained" />
              <Stat label="Commander status" value="Non-Commander" detail="60-card constructed list" />
            </div>
          </div>
          <div className="border-t-2 border-border bg-muted/30 p-5 sm:p-8">
            <h2 className="text-xl font-black">Format and source credit</h2>
            <p className="mt-2 max-w-5xl text-sm leading-6">{entry.formatStatus}</p>
            <p className="mt-3 text-sm leading-6">
              <strong>Original source title:</strong> {entry.sourceTitle}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {entry.sourceCredit}
            </p>
            <p className="mt-3 max-w-5xl text-xs leading-5 text-muted-foreground">
              The title and source credit are shown as recorded. This page does not claim card ownership, playtesting, or authorship beyond that title-level source credit. Saved source rows are not rewritten; format legality is not implied.
            </p>
          </div>
        </header>

        <DeckGalleryRoleReading entry={entry} />
        <SavedListSection
          title={`Main deck · ${entry.mainCopies} copies`}
          sectionName="Main deck"
          cards={entry.main}
          copies={entry.mainCopies}
        />
        <SavedListSection
          title={`Sideboard · ${entry.sideboardCopies} copies`}
          sectionName="Sideboard"
          cards={entry.sideboard}
          copies={entry.sideboardCopies}
        />

        <footer className="mt-8 border-t-2 border-border pt-4 text-xs leading-5 text-muted-foreground">
          Card images are served by Scryfall; card imagery © Wizards of the Coast. Image art does not identify a specific printing. Role groupings are editorial and based on card types and Oracle text, not on source-author intent.
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-border bg-background p-3">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function DeckboxBattleBoxDetail({ params }: { params: { deckId: string } }) {
  const [entry, setEntry] = useState<DeckboxBattleBoxEntry | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    loadDeckGallery()
      .then(payload => {
        if (!active) return;
        const candidate = getDeckboxBattleBoxEntries(payload).find(item => item.id === params.deckId);
        if (candidate) setEntry(candidate);
        else setLoadError("This Deckbox source list is not available in the public Battle Box archive.");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLoadError(reason instanceof Error ? reason.message : "The saved source list could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [params.deckId]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = entry ? `${entry.sourceTitle} · Deckbox Battle Box | MTG Tracker` : "Deckbox Battle Box | MTG Tracker";
    return () => {
      document.title = previousTitle;
    };
  }, [entry]);

  if (!entry) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-foreground">
        <div className="mx-auto max-w-2xl border-2 border-border bg-card p-6 text-center">
          <h1 className="text-2xl font-black">Deckbox Battle Box list</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {loadError || "Loading the public source list…"}
          </p>
          <Link href="/battle-box#deckbox-60-card-archive" className="mt-5 inline-flex min-h-11 items-center border-2 border-border px-4 py-2 text-xs font-bold hover:border-primary">
            Back to Battle Box
          </Link>
        </div>
      </main>
    );
  }
  return <DeckboxBattleBoxDetailView entry={entry} />;
}
