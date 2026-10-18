import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { Link } from "wouter";
import { CardImageZoom } from "@/components/CardImageZoom";
import {
  deckListText,
  getRetroBattleBoxStats,
  retroBattleBoxDecks,
} from "@/lib/retroBattleBox";
import {
  battleBoxDeckPath,
  battleBoxOracleText,
  battleBoxPackageRows,
  battleBoxReferences,
  battleBoxStrategy,
  findBattleBoxDeck,
} from "@/lib/battleBoxStrategy";

export default function BattleBoxDeckDetail({
  params,
}: {
  params: { deckId: string };
}) {
  const deck = findBattleBoxDeck(params.deckId);
  const [view, setView] = useState<"visual" | "list">("visual");
  useEffect(() => {
    setView("visual");
  }, [params.deckId]);
  useEffect(() => {
    const title = document.title;
    document.title = `${deck?.name ?? "Deck not found"} · Retro Battle Box | MTG Sets Tracker`;
    return () => {
      document.title = title;
    };
  }, [deck]);
  if (!deck)
    return (
      <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-black">Battle Box deck not found</h1>
        <p className="mt-4 text-muted-foreground">
          Choose one of the shared lists from the Retro Battle Box.
        </p>
        <Link
          href="/battle-box"
          className="mt-6 inline-flex min-h-11 items-center text-primary underline"
        >
          Back to the Battle Box
        </Link>
      </main>
    );
  const strategy = battleBoxStrategy(deck);
  const total = deck.groups
    .flatMap(group => group.cards)
    .reduce((sum, card) => sum + card.quantity, 0);
  const copyWarnings = getRetroBattleBoxStats([deck]).copyLimitWarnings;
  const houseRule = "houseRule" in deck ? deck.houseRule : null;
  function download() {
    if (!deck) return;
    const url = URL.createObjectURL(
      new Blob([deckListText(deck)], { type: "text/plain;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${deck.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8 sm:py-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-bold"
        >
          <Link
            href="/"
            className="min-h-11 content-center text-primary hover:underline"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/battle-box#deck-library"
            className="inline-flex min-h-11 items-center gap-1 text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retro Battle Box
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{deck.name}</span>
        </nav>
        <article className="border-2 border-border bg-card">
          <header className="border-b border-border bg-primary/5 p-5 sm:p-7">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">
              Shared Battle Box · casual 1v1 · non-Commander
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {deck.name}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {deck.subtitle} · {deck.era}
            </p>
            <div className="mt-5 border-l-4 border-primary bg-background p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                The game plan
              </p>
              <p className="mt-2 max-w-4xl text-sm leading-7">
                {strategy?.plan ?? deck.summary}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="border border-border bg-background px-3 py-2">
                <strong>{total}</strong> card copies
              </span>
              <span className="border border-border bg-background px-3 py-2">
                {deck.colorLabel}
              </span>
              <span className="border border-border bg-background px-3 py-2">
                {deck.archetype}
              </span>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              <strong className="text-foreground">
                Site creator &amp; curator: Kris Aguero.
              </strong>{" "}
              Shared source: {deck.sourceTitle}. This is the same static list
              for every visitor; it does not describe anyone’s collection or
              ownership.
            </p>
            {(deck.warnings.length > 0 || copyWarnings.length > 0) && (
              <aside
                className="mt-4 border-l-4 border-amber-600 bg-amber-500/10 p-4 text-sm leading-6"
                aria-label="Source-list review notes"
              >
                <h2 className="font-bold">Source-list review notes</h2>
                {deck.warnings.map(warning => (
                  <p key={warning} className="mt-2">
                    {warning}
                  </p>
                ))}
                {copyWarnings.map(warning => (
                  <p key={warning.card} className="mt-2">
                    {warning.copies} copies of {warning.card}; the supplied list
                    exceeds the usual four-copy constructed limit.
                  </p>
                ))}
                <p className="mt-2">
                  Names, quantities, and source proxy annotations are preserved,
                  not silently corrected.
                </p>
              </aside>
            )}
            {houseRule && (
              <aside
                className="mt-4 border-2 border-primary/40 bg-background p-4 text-sm leading-6"
                aria-label="Optional house-rule overlay"
              >
                <h2 className="font-bold">
                  Optional house-rule overlay · not card text or part of the{" "}
                  {total}
                </h2>
                <p className="mt-2">
                  <strong>Boss:</strong> {houseRule.bossCard}
                </p>
                <p>
                  <strong>Overlay activation:</strong> {houseRule.activation}
                </p>
                <p>
                  <strong>Secret objective:</strong> {houseRule.objective}
                </p>
                <p>
                  <strong>Trigger:</strong> {houseRule.trigger}
                </p>
                <p>
                  <strong>Reward:</strong> {houseRule.reward}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {houseRule.rulesNote}
                </p>
              </aside>
            )}
          </header>
          <div className="border-b border-border p-4 sm:p-6">
            <div className="flex flex-wrap justify-between gap-3">
              <div
                role="group"
                aria-label={`${deck.name} deck view`}
                className="flex flex-wrap gap-2"
              >
                {(["visual", "list"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={view === mode}
                    aria-controls="battle-box-cards"
                    onClick={() => setView(mode)}
                    className={`min-h-11 border-2 px-4 py-2 font-mono text-xs font-black uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${view === mode ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                  >
                    {mode === "visual" ? "Visual spoiler" : "Readable decklist"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={download}
                className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-3 py-2 text-xs font-bold hover:border-primary"
              >
                <Download className="h-4 w-4" /> Download source list
              </button>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Strategy packages explain how the supplied cards work together.
              Every source row appears once; repeated rows retain their
              quantities and proxy labels. Representative Scryfall editions are
              not a claim about the submitted printing or ownership. Select art
              to enlarge it; open rules evidence for exact card text.
            </p>
            <nav
              aria-label="Strategy packages"
              className="mt-4 flex flex-wrap gap-2"
            >
              {strategy?.packages.map(group => (
                <a
                  key={group.id}
                  href={`#package-${group.id}`}
                  className="inline-flex min-h-11 items-center border border-border px-3 py-2 text-xs font-bold hover:border-primary"
                >
                  {group.title}
                </a>
              ))}
              <a
                href="#source-list"
                className="inline-flex min-h-11 items-center border border-border px-3 py-2 text-xs font-bold hover:border-primary"
              >
                Original list order
              </a>
            </nav>
          </div>
          <div
            id="battle-box-cards"
            data-view={view}
            className="space-y-8 p-4 sm:p-6"
          >
            {strategy?.packages.map((group, packageIndex) => {
              const rows = battleBoxPackageRows(deck, group);
              return (
                <section
                  key={group.id}
                  id={`package-${group.id}`}
                  className="scroll-mt-24"
                  aria-labelledby={`heading-${group.id}`}
                >
                  <header className="border-b-2 border-border pb-4">
                    <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                      Package {String(packageIndex + 1).padStart(2, "0")} ·{" "}
                      {rows.reduce((sum, card) => sum + card.quantity, 0)}{" "}
                      copies
                    </p>
                    <h2
                      id={`heading-${group.id}`}
                      className="mt-2 text-2xl font-black"
                    >
                      {group.title}
                    </h2>
                    <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
                      {group.intro}
                    </p>
                  </header>
                  <div
                    className={
                      view === "visual"
                        ? "mt-4 grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
                        : "mt-4 divide-y divide-border"
                    }
                  >
                    {rows.map(card => {
                      const ref = battleBoxReferences[card.name];
                      const image =
                        ref?.image_uris?.normal ??
                        ref?.card_faces?.[0]?.image_uris?.normal;
                      return (
                        <article
                          key={card.sourceKey}
                          data-source-row={card.sourceKey}
                          className={
                            view === "visual"
                              ? "min-w-0 border border-border bg-background"
                              : "grid min-w-0 grid-cols-[48px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[64px_minmax(0,1fr)]"
                          }
                        >
                          <div
                            className={
                              view === "visual"
                                ? "aspect-[488/680] bg-muted"
                                : "aspect-[488/680] self-start"
                            }
                          >
                            <CardImageZoom src={image} alt={card.name} />
                          </div>
                          <div
                            className={
                              view === "visual" ? "min-w-0 p-3" : "min-w-0"
                            }
                          >
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                              <span className="border border-border px-1.5 py-0.5">
                                {card.quantity}×
                              </span>
                              {card.proxy && (
                                <span className="border border-amber-700/40 bg-amber-500/10 px-1.5 py-0.5 text-amber-800 dark:text-amber-300">
                                  Source proxy
                                </span>
                              )}
                            </div>
                            <h3 className="mt-2 break-words text-sm font-black leading-5">
                              {card.name}
                            </h3>
                            <p className="mt-2 text-xs leading-6 text-muted-foreground">
                              {card.role}
                            </p>
                            <a
                              href={
                                ref?.scryfall_uri ??
                                `https://scryfall.com/search?q=${encodeURIComponent(`!\"${card.name}\"`)}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex min-h-9 items-center text-[10px] font-semibold text-primary underline"
                            >
                              {ref
                                ? `${ref.set.toUpperCase()} #${ref.collector_number} · Scryfall`
                                : "Card reference unavailable · search Scryfall"}
                            </a>
                            <details className="mt-1 text-xs leading-6">
                              <summary className="min-h-9 cursor-pointer content-center font-bold text-primary">
                                Rules evidence
                              </summary>
                              <p className="mt-2 whitespace-pre-line break-words text-muted-foreground">
                                {battleBoxOracleText(ref) ||
                                  (ref?.type_line.includes("Basic Land")
                                    ? "Basic land · intrinsic mana ability follows its land subtype."
                                    : "Rules text unavailable. No ability inferred.")}
                              </p>
                            </details>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          <section
            id="source-list"
            className="scroll-mt-24 border-t-2 border-border p-4 sm:p-6"
          >
            <h2 className="text-2xl font-black">Original list order</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              An unchanged reference for the source categories, quantities, and
              annotations. Strategy grouping above is editorial, not a deck
              modification.
            </p>
            <details className="mt-4">
              <summary className="min-h-11 cursor-pointer content-center font-bold text-primary">
                Show original source list · {total} copies
              </summary>
              <pre className="mt-3 overflow-x-auto border border-border bg-background p-4 text-xs leading-6">
                {deckListText(deck)}
              </pre>
            </details>
          </section>
        </article>
        <section
          className="border-2 border-border bg-card p-5 text-sm leading-7"
          aria-label="Sources and credit"
        >
          <h2 className="text-xl font-black">About this shared deck</h2>
          <p className="mt-3">
            Strategy notes are editorial explanations of the supplied list based
            on the linked Scryfall Oracle text, not playtest claims, upgrades,
            or official format endorsements. Optional house rules are separate
            from card abilities.
          </p>
          <p className="mt-3">
            Kris Aguero created and curates the shared Battle Box feature.
            Community submissions and remixes must retain their original author
            and source credit. No personal scans or private ownership records
            are used on this page.
          </p>
          <p className="mt-3">
            Card text and representative imagery:{" "}
            <a
              className="text-primary underline"
              href="https://scryfall.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Scryfall
            </a>
            . Card imagery © Wizards of the Coast.{" "}
            <Link href="/battle-box-method" className="text-primary underline">
              Read the original Battle Box method and source notes.
            </Link>
          </p>
        </section>
        <nav
          aria-label="Explore shared Battle Box decks"
          className="border-t-2 border-border pt-5"
        >
          <h2 className="text-xl font-black">Pick another play pattern</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {retroBattleBoxDecks
              .filter(entry => entry.id !== deck.id)
              .map(entry => (
                <Link
                  key={entry.id}
                  href={battleBoxDeckPath(entry.id)}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary"
                >
                  {entry.name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
