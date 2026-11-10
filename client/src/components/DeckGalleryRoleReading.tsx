import React, { useState } from "react";
import { CardImageZoom } from "@/components/CardImageZoom";
import {
  getDeckGalleryCardImageUri,
  getPublicCardImageSrcSet,
} from "@/lib/deckGalleryImageUris";
import {
  getDeckGalleryRoleReading,
  getDeckGalleryRemainderCards,
  type DeckGalleryCategory,
  type DeckGalleryCategoryCard,
  type DeckGalleryRoleReading as Reading,
} from "@/lib/deckGalleryRoles";
import type { DeckGalleryEntry } from "@/lib/deckGallery";

type DeckSourceView = Pick<
  DeckGalleryEntry,
  "id" | "main" | "sideboard" | "mainCopies" | "sideboardCopies"
>;
type ViewMode = "categories" | "saved-order";

function CardGrid({
  cards,
  view,
}: {
  cards: DeckGalleryCategoryCard[];
  view: "category" | "remainder";
}) {
  if (!cards.length) return null;
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map(card => (
        <li
          key={card.name}
          data-gallery-card-name={card.name}
          data-gallery-card-view={view}
          className="min-w-0 border border-border bg-background p-2"
        >
          <div className="aspect-[488/680] overflow-hidden bg-muted">
              <CardImageZoom
                src={getDeckGalleryCardImageUri(card.name, "normal")}
                srcSet={getPublicCardImageSrcSet(card.name)}
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                alt={`${card.name} representative card image`}
              className="h-full w-full"
            />
          </div>
          <div className="mt-2 flex items-start justify-between gap-1 text-[11px] leading-4">
            <span className="min-w-0 break-words font-semibold">{card.name}</span>
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              {card.quantity}×
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CategoryGroup({ category }: { category: DeckGalleryCategory }) {
  return (
    <article className="min-w-0 border-2 border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-lg font-black">{category.title}</h4>
        <span className="shrink-0 border border-border bg-background px-2 py-1 font-mono text-[10px] font-bold">
          {category.copies} copies · {category.rows} cards
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {category.description}
      </p>
      <CardGrid cards={category.cards} view="category" />
    </article>
  );
}

function CategorySection({
  title,
  categories,
}: {
  title: string;
  categories: DeckGalleryCategory[];
}) {
  if (!categories.length) return null;
  return (
    <section aria-label={title} className="mt-6">
      <h3 className="border-b-2 border-border pb-2 text-xl font-black tracking-tight">
        {title}
      </h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {categories.map(category => (
          <CategoryGroup key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}

function RemainderSection({
  title,
  sourceRows,
  categories,
}: {
  title: string;
  sourceRows: DeckSourceView["main"];
  categories: DeckGalleryCategory[];
}) {
  const cards = getDeckGalleryRemainderCards(sourceRows, categories);
  if (!cards.length) return null;
  const copies = cards.reduce((total, card) => total + card.quantity, 0);
  return (
    <section aria-label={title} className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-border pb-2">
        <h3 className="text-xl font-black tracking-tight">{title}</h3>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {copies} remaining copies · {cards.length} cards
        </p>
      </div>
      <CardGrid cards={cards} view="remainder" />
    </section>
  );
}

function SectionCountReconciliation({
  section,
  sourceRows,
  categories,
}: {
  section: "Main" | "Sideboard";
  sourceRows: DeckSourceView["main"];
  categories: DeckGalleryCategory[];
}) {
  const categoryCopies = categories.reduce(
    (total, category) =>
      total + category.cards.reduce((copies, card) => copies + card.quantity, 0),
    0
  );
  const remainderCopies = getDeckGalleryRemainderCards(sourceRows, categories)
    .reduce((total, card) => total + card.quantity, 0);
  const sourceCopies = sourceRows.reduce((total, card) => total + card.quantity, 0);
  const reconciled = categoryCopies + remainderCopies === sourceCopies;
  return (
    <p
      data-count-reconciliation={section.toLocaleLowerCase()}
      aria-label={`${section} category count reconciliation`}
      className="mt-4 border border-border bg-background px-3 py-2 text-xs leading-5"
    >
      <strong>{section}:</strong> {categoryCopies} functional category copies + {remainderCopies} {section.toLocaleLowerCase()} fallback copies = {sourceCopies} saved {section.toLocaleLowerCase()} copies
      <span className={`ml-1 font-bold ${reconciled ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
        {reconciled ? "· balances with saved list" : "· count mismatch"}
      </span>
    </p>
  );
}

function ExactSavedOrderList({ entry }: { entry: DeckSourceView }) {
  const rows = (title: string, cards: DeckSourceView["main"]) => (
    <section aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
        <h4 className="font-mono text-xs font-black uppercase tracking-[0.16em] text-primary">
          {title}
        </h4>
        <span className="text-xs text-muted-foreground">
          {cards.reduce((total, card) => total + card.quantity, 0)} copies · {cards.length} source rows
        </span>
      </div>
      {cards.length ? (
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
        </ol>
      ) : (
        <p className="mt-2 border-2 border-dashed border-border p-4 text-sm text-muted-foreground">
          No exported rows in this section.
        </p>
      )}
    </section>
  );

  return (
    <div className="mt-6 grid gap-5 border-t-2 border-border pt-5 lg:grid-cols-2">
      {rows(`Main deck · ${entry.mainCopies} copies`, entry.main)}
      {rows(`Sideboard · ${entry.sideboardCopies} copies`, entry.sideboard)}
      <p className="text-xs leading-5 text-muted-foreground lg:col-span-2">
        This is the complete list in the saved source order, with original rows and quantities unchanged. Main deck and sideboard remain separate. Contextual counts are not legality or completion checks.
      </p>
    </div>
  );
}

/** Exported for focused tests of the two mutually exclusive presentation modes. */
export function DeckGalleryCardPresentation({
  entry,
  reading,
  view,
}: {
  entry: DeckSourceView;
  reading?: Reading;
  view: ViewMode;
}) {
  if (view === "saved-order") return <ExactSavedOrderList entry={entry} />;

  const mainCategories = reading?.main ?? [];
  const sideboardCategories = reading?.sideboard ?? [];
  return (
    <>
      {!mainCategories.length && !sideboardCategories.length && (
        <p className="mt-5 border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
          No clear theme or named package was identified for categories. The saved cards remain in the main-deck and sideboard sections below.
        </p>
      )}
      <SectionCountReconciliation
        section="Main"
        sourceRows={entry.main}
        categories={mainCategories}
      />
      <CategorySection title="Main deck categories" categories={mainCategories} />
      <RemainderSection
        title="Main (functional fallback)"
        sourceRows={entry.main}
        categories={mainCategories}
      />
      <SectionCountReconciliation
        section="Sideboard"
        sourceRows={entry.sideboard}
        categories={sideboardCategories}
      />
      <CategorySection title="Sideboard categories" categories={sideboardCategories} />
      <RemainderSection
        title="Sideboard (functional fallback)"
        sourceRows={entry.sideboard}
        categories={sideboardCategories}
      />
    </>
  );
}

export function DeckGalleryRoleReading({ entry }: { entry: DeckGalleryEntry }) {
  const [view, setView] = useState<ViewMode>("categories");
  const reading = getDeckGalleryRoleReading(entry.id);
  const commanderNames = entry.helm.commanders.map(card => card.name);

  return (
    <section
      className="mt-8 border-2 border-primary/35 bg-primary/5 p-4 sm:p-6"
      aria-labelledby={`role-reading-${entry.id}`}
    >
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Editorial theme and package view
            </p>
            <h2
              id={`role-reading-${entry.id}`}
              className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
            >
              Categories
            </h2>
          </div>
          <button
            type="button"
            aria-pressed={view === "saved-order"}
            onClick={() => setView(current => current === "categories" ? "saved-order" : "categories")}
            className="inline-flex min-h-11 items-center justify-center border-2 border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
          >
            {view === "saved-order" ? "Show categories" : "Show exact saved-order list"}
          </button>
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Categories combine clear deck themes with EDHREC-style functional roles such as lands, ramp, draw, removal, protection, recursion, and tokens. Each card name appears in at most one category within its zone. These are editorial groupings, not categories supplied by the Deckbox list’s author. Switch views to see the complete source list in its exact saved order.
        </p>
      </header>
      {commanderNames.length > 0 && (
        <div
          className="mt-4 border-l-4 border-primary bg-primary/10 px-4 py-3 sm:px-5"
          aria-label="Commander focus"
        >
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            Commander focus
          </p>
          <p className="mt-1 text-base font-black">
            {commanderNames.join(" · ")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Named mechanic and commander packages stay primary. Functional roles below explain the supporting shell around this helm rather than replacing the deck’s identity.
          </p>
        </div>
      )}
      <DeckGalleryCardPresentation entry={entry} reading={reading} view={view} />
    </section>
  );
}
