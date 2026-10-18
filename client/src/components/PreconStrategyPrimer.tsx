import React from "react";
import type { ScryfallCard } from "@/hooks/useSetDetail";
import {
  cardExplanation,
  commanderRelationship,
  strategyDisclaimer,
  strategyPackages,
} from "@/lib/preconStrategyEvidence";

interface PreconStrategyPrimerProps {
  deckName: string;
  setName: string;
  commanderNames: string[];
  commanderEntries: Array<{ card: ScryfallCard; quantity: number }>;
  deckEntries: Array<{ card: ScryfallCard; quantity: number }>;
  approxValue: number | null;
}

/** An evidence-led introduction; it deliberately does not infer power from price. */
export function PreconStrategyPrimer({
  deckName,
  setName,
  commanderNames,
  commanderEntries,
  deckEntries,
}: PreconStrategyPrimerProps) {
  const packages = strategyPackages(deckEntries);
  return (
    <section
      className="border-2 border-primary/40 bg-card p-6 sm:p-8"
      aria-labelledby="strategy-primer-heading"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
        Strategy primer · verified Oracle text
      </p>
      <h2 id="strategy-primer-heading" className="mt-3 text-2xl font-extrabold">
        How {deckName} works
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        <strong className="text-foreground">{deckName}</strong> ({setName})
        lists {commanderNames.join(" and ") || "no resolved commander"}. The
        notes below translate actual printed effects into readable jobs; they
        are not a power rating, upgrade recommendation, or unsupported archetype
        label.
      </p>
      {commanderEntries.length > 0 && (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {commanderEntries.map((entry, index) => (
            <article
              key={`${entry.card.id}-${index}`}
              className="border border-primary/30 bg-primary/5 p-4"
            >
              <h3 className="font-bold">{entry.card.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {commanderRelationship(entry, deckEntries)}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {cardExplanation(entry)}
              </p>
            </article>
          ))}
        </div>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {packages.slice(0, 3).map(pkg => (
          <article
            key={pkg.label}
            className="border border-border bg-background p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-bold">{pkg.label}</h3>
              <span className="font-mono text-xs text-primary">
                {pkg.count} copies
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {pkg.intro}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Primary source rows:{" "}
              {pkg.cards
                .slice(0, 3)
                .map(entry => entry.card.name)
                .join(", ")}
              {pkg.cards.length > 3 ? "…" : ""}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        {strategyDisclaimer()}
      </p>
    </section>
  );
}
