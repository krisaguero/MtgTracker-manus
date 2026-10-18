import React, { useMemo, useState } from "react";
import { Info, LayoutGrid, List } from "lucide-react";
import { CardImageZoom } from "@/components/CardImageZoom";
import type { ScryfallCard } from "@/hooks/useSetDetail";
import type { DecklistEntry } from "@/hooks/useCommanderDeck";
import type { DeckEntryLike } from "@/lib/preconStrategyEvidence";
import {
  cardExplanation,
  preconOracleText,
  strategyDisclaimer,
  strategyPackages,
} from "@/lib/preconStrategyEvidence";

const packageId = (label: string) =>
  `precon-package-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
function imageFor(card: ScryfallCard) {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal;
}
function scryfallFor(card: ScryfallCard) {
  return (
    card.scryfall_uri ??
    `https://scryfall.com/card/${encodeURIComponent(card.set.toLowerCase())}/${encodeURIComponent(card.collector_number)}`
  );
}
function printingLabel(card: ScryfallCard) {
  return `${card.set.toUpperCase()} #${card.collector_number}`;
}

export function PreconVisualSpoiler({
  commander,
  deck,
}: {
  commander: DecklistEntry[];
  deck: DecklistEntry[];
}) {
  const [mode, setMode] = useState<"visual" | "list">("visual");
  const packages = useMemo(() => strategyPackages(deck), [deck]);
  const total = deck.reduce((sum, entry) => sum + entry.quantity, 0);
  const commandCount = commander.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  );
  return (
    <section
      className="space-y-7"
      aria-labelledby="decklist-heading"
      data-precon-view={mode}
    >
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Official precon · {total + commandCount} cards · {total} main +{" "}
            {commandCount} commander
          </p>
          <h2 id="decklist-heading" className="mt-1 text-3xl font-bold">
            The deck in action
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Every source row stays visible. Strategy bundles assign each
            main-deck row one primary job; quantities and duplicates are
            preserved. Cards may have other jobs too.
          </p>
        </div>
        <div
          className="inline-flex flex-wrap border border-border bg-card p-1"
          role="group"
          aria-label="Deck list presentation"
        >
          <button
            type="button"
            aria-pressed={mode === "visual"}
            aria-controls="precon-deck-cards"
            onClick={() => setMode("visual")}
            className={`inline-flex min-h-11 items-center gap-2 px-3 py-2 text-xs font-bold ${mode === "visual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" /> Visual spoiler
          </button>
          <button
            type="button"
            aria-pressed={mode === "list"}
            aria-controls="precon-deck-cards"
            onClick={() => setMode("list")}
            className={`inline-flex min-h-11 items-center gap-2 px-3 py-2 text-xs font-bold ${mode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <List className="h-4 w-4" /> Readable source order
          </button>
        </div>
      </div>
      <div className="border border-primary/30 bg-primary/5 p-4 text-xs leading-6 text-muted-foreground">
        <div className="flex gap-2">
          <Info className="mt-1 h-4 w-4 shrink-0 text-primary" />
          <p>
            {strategyDisclaimer()} Images use indexed printing references, not
            proof of ownership. Card imagery © Wizards of the Coast.
          </p>
        </div>
      </div>
      {mode === "visual" && (
        <nav
          aria-label="Precon strategy bundles"
          className="flex flex-wrap gap-2"
        >
          {packages.map(pkg => (
            <a
              key={pkg.label}
              href={`#${packageId(pkg.label)}`}
              className="inline-flex min-h-11 items-center border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary"
            >
              {pkg.label}
            </a>
          ))}
        </nav>
      )}
      <div id="precon-deck-cards" className="space-y-8">
        {commander.length > 0 && (
          <section aria-labelledby="spoiler-commanders">
            <h3 id="spoiler-commanders" className="text-xl font-bold">
              Commander
            </h3>
            {mode === "visual" ? (
              <div className="mt-3 grid max-w-3xl grid-cols-2 items-start gap-3 sm:grid-cols-4">
                {commander.map((entry, index) => (
                  <VisualCard
                    key={`${entry.card.id}-commander-${index}`}
                    entry={entry}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <ReadableList entries={commander} />
              </div>
            )}
          </section>
        )}
        {mode === "visual" ? (
          <div className="space-y-8">
            {packages.map(pkg => (
              <section
                key={pkg.label}
                id={packageId(pkg.label)}
                className="scroll-mt-24"
                data-strategy-package={pkg.label}
                aria-labelledby={`${packageId(pkg.label)}-heading`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-border pb-4">
                  <div>
                    <h3
                      id={`${packageId(pkg.label)}-heading`}
                      className="text-2xl font-black"
                    >
                      {pkg.label}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                      {pkg.intro}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-primary">
                    {pkg.count} copies · {pkg.cards.length} source rows
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {pkg.cards.map((entry, index) => (
                    <VisualCard
                      key={`${entry.card.id}-${pkg.label}-${index}`}
                      entry={entry}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section aria-labelledby="source-order-heading">
            <h3 id="source-order-heading" className="text-xl font-bold">
              Original readable source order
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The indexed source order and quantities, without editorial
              regrouping.
            </p>
            <div className="mt-3">
              <ReadableList entries={deck} />
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

function RulesEvidence({ card }: { card: ScryfallCard }) {
  const text = preconOracleText(card);
  return (
    <details className="mt-2 text-xs leading-6">
      <summary className="min-h-11 cursor-pointer content-center font-bold text-primary">
        Rules evidence
      </summary>
      <p className="mt-2 whitespace-pre-line break-words text-muted-foreground">
        {text || "Rules text unavailable. No ability inferred."}
      </p>
    </details>
  );
}
function VisualCard({ entry }: { entry: DeckEntryLike }) {
  const card = entry.card;
  return (
    <article
      data-source-row={`${card.set}:${card.collector_number}:${card.name}`}
      className="min-w-0 border border-border bg-card"
    >
      <div className="aspect-[488/680] bg-muted">
        <CardImageZoom src={imageFor(card)} alt={card.name} />
      </div>
      <div className="min-w-0 p-3">
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
          <span className="border border-border px-1.5 py-0.5">
            {entry.quantity}×
          </span>
          <span className="border border-border px-1.5 py-0.5">
            {card.type_line.split(" — ")[0] || "Card"}
          </span>
        </div>
        <h4 className="mt-2 break-words text-sm font-black leading-5">
          {card.name}
        </h4>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          {cardExplanation(entry)}
        </p>
        <a
          href={scryfallFor(card)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-[10px] font-semibold text-primary underline"
        >
          {printingLabel(card)} · Scryfall
        </a>
        <RulesEvidence card={card} />
      </div>
    </article>
  );
}
function ReadableList({ entries }: { entries: DecklistEntry[] }) {
  return (
    <div className="divide-y divide-border border border-border bg-card">
      {entries.map((entry, index) => {
        const card = entry.card;
        return (
          <div
            key={`${card.id}-${index}`}
            data-source-row={`${card.set}:${card.collector_number}:${card.name}`}
            className="grid min-w-0 gap-2 p-3 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start"
          >
            <span className="font-mono text-sm font-bold text-primary">
              {entry.quantity}×
            </span>
            <div className="min-w-0">
              <div className="break-words font-semibold">{card.name}</div>
              <div className="text-xs text-muted-foreground">
                {card.type_line}
              </div>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                {cardExplanation(entry)}
              </p>
              <a
                href={scryfallFor(card)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-xs font-semibold text-primary underline"
              >
                {printingLabel(card)} · Scryfall
              </a>
              <RulesEvidence card={card} />
            </div>
            <span className="text-right font-mono text-[10px] uppercase text-muted-foreground">
              {card.set}:{card.collector_number}
            </span>
          </div>
        );
      })}
    </div>
  );
}
