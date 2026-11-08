import React from "react";
import { CardImageZoom } from "@/components/CardImageZoom";
import { getDeckGalleryRoleReading } from "@/lib/deckGalleryRoles";
import type { DeckGalleryEntry } from "@/lib/deckGallery";

function cardImageUrl(name: string): string {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

export function DeckGalleryRoleReading({ entry }: { entry: DeckGalleryEntry }) {
  const reading = getDeckGalleryRoleReading(entry.id);
  if (!reading) return null;

  const section = (
    title: string,
    groups: typeof reading.main,
    expectedCopies: number
  ) => (
    <section aria-label={title} className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-border pb-2">
        <h3 className="text-xl font-black tracking-tight">{title}</h3>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {expectedCopies} copies · role view
        </p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map(group => (
          <article
            key={group.id}
            className="min-w-0 border-2 border-border bg-card p-4 sm:p-5"
            aria-labelledby={`role-${entry.id}-${title.replace(/\W+/g, "-")}-${group.id}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4
                id={`role-${entry.id}-${title.replace(/\W+/g, "-")}-${group.id}`}
                className="text-lg font-black"
              >
                {group.title}
              </h4>
              <span className="shrink-0 border border-border bg-background px-2 py-1 font-mono text-[10px] font-bold">
                {group.copies} copies · {group.rows} rows
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {group.description}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.cards.map((card, index) => (
                <li
                  key={`${card.name}-${index}`}
                  className="min-w-0 border border-border bg-background p-2"
                >
                  <div className="aspect-[488/680] overflow-hidden bg-muted">
                    <CardImageZoom
                      src={cardImageUrl(card.name)}
                      alt={`${card.name} representative card image`}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-1 text-[11px] leading-4">
                    <span className="min-w-0 break-words font-semibold">
                      {card.name}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                      {card.quantity}×
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {!groups.length && (
        <p className="mt-3 border border-dashed border-border p-4 text-sm text-muted-foreground">
          No cards were saved in this section.
        </p>
      )}
    </section>
  );

  return (
    <section
      className="mt-8 border-2 border-primary/35 bg-primary/5 p-4 sm:p-6"
      aria-labelledby={`role-reading-${entry.id}`}
    >
      <header className="border-b border-border pb-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
          Editorial role/theme reading
        </p>
        <h2
          id={`role-reading-${entry.id}`}
          className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
        >
          Precon-style card categories
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          These groups are a reading of the saved cards’ types and Oracle text—not categories supplied by the Deckbox list’s author. Each source row is placed in one role group. The exact main and sideboard lists remain separate below in saved order.
        </p>
      </header>
      {section("Main deck roles", reading.main, entry.mainCopies)}
      {reading.sideboard.length > 0 &&
        section("Sideboard roles", reading.sideboard, entry.sideboardCopies)}
    </section>
  );
}
