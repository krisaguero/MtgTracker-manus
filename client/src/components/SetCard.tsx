import { useMemo } from "react";
import {
  Bookmark,
  ExternalLink,
  Layers3,
  ChevronDown,
  ChevronUp,
  Calendar,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  MarketDataCue,
  type MarketDataStatus,
} from "@/components/MarketDataCue";
import type { PreconDeck, ScryfallSet } from "@/hooks/useScryfallSets";
import { slugify } from "@/hooks/useCommanderDeck";
import { loadOwnedCollection } from "@/lib/manaboxParser";
import { CommanderCardFrame } from "@/components/CommanderCardFrame";

interface SetCardProps {
  set: ScryfallSet;
  precons: PreconDeck[];
  knownValue?: number;
  pricedCardCopies?: number;
  totalCardCopies?: number;
  archiveStatus: "idle" | "loading" | "error" | "ready";
  archiveError?: string | null;
  onRetryArchive: () => void;
  marketDataStatus: MarketDataStatus;
  marketPriceSource?: string;
  marketPriceAsOf?: string;
  marketPriceRefreshedAt?: string;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (code: string) => void;
}

export function SetCard({
  set,
  precons,
  knownValue = 0,
  pricedCardCopies = 0,
  totalCardCopies = 0,
  archiveStatus,
  archiveError,
  onRetryArchive,
  marketDataStatus,
  marketPriceSource = "",
  marketPriceAsOf = "",
  marketPriceRefreshedAt = "",
  isExpanded,
  onToggleExpanded,
  isFavorite = false,
  onToggleFavorite,
}: SetCardProps) {
  const ownedCollection = useMemo(() => loadOwnedCollection(), []);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${set.released_at}T00:00:00`));
  const scryfallUrl = `https://scryfall.com/sets/${set.code.toLowerCase()}`;

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-sm transition-all hover:border-primary">
      {/* Set Header Banner */}
      <div className="border-b border-border bg-background p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {set.icon_svg_uri && (
              <img
                src={set.icon_svg_uri}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="mt-1 h-8 w-8 shrink-0 object-contain opacity-80 dark:invert"
              />
            )}
            <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="border border-border bg-card px-2 py-0.5 font-mono text-xs uppercase text-muted-foreground">
                {set.code}
              </span>
              <span className="font-mono text-xs uppercase text-primary font-bold">
                {set.set_type}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              {set.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {formattedDate} · {set.card_count} cards
            </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(set.code)}
                title={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
                className={`inline-flex h-11 w-11 items-center justify-center border transition-colors ${isFavorite ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-primary"}`}
              >
                <Bookmark className="h-4 w-4 fill-current" />
              </button>
            )}
            <a
              href={scryfallUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              title="View on Scryfall"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="min-h-11 font-mono text-xs uppercase font-bold"
            >
              <Link href={`/${set.code.toLowerCase()}`}>
                View Set Catalog ({set.card_count})
              </Link>
            </Button>
          </div>
          {precons.length > 0 && (
            <div
              className="min-w-0 text-left sm:text-right"
              aria-label="Indexed card-list equity"
            >
              {marketDataStatus === "ready" ? (
                <>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase">
                    Indexed card-list equity
                  </p>
                  <p className="font-mono text-xs font-bold text-emerald-600">
                    ${knownValue.toFixed(2)}
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                    {pricedCardCopies.toLocaleString("en-US")}/
                    {totalCardCopies.toLocaleString("en-US")} card copies priced
                  </p>
                  <MarketDataCue
                    status={marketDataStatus}
                    source={marketPriceSource}
                    asOf={marketPriceAsOf}
                    lastRefreshedAt={marketPriceRefreshedAt}
                    className="mt-1 break-words font-mono text-[9px]"
                  />
                </>
              ) : (
                <MarketDataCue
                  status={marketDataStatus}
                  source={marketPriceSource}
                  asOf={marketPriceAsOf}
                  lastRefreshedAt={marketPriceRefreshedAt}
                  className="max-w-52 break-words text-right font-mono text-[9px] font-bold uppercase"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Associated Commander Precons Panel */}
      <div className="border-t border-border bg-card flex flex-col">
        <button
          type="button"
          onClick={() => onToggleExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={`set-precons-${set.code}`}
          aria-label={`${isExpanded ? "Hide" : "Show"} Commander precons for ${set.name}`}
          className="flex min-h-11 w-full items-center justify-between px-3 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground sm:px-4"
        >
          <span className="flex items-center gap-2 font-bold">
            <Layers3 className="h-4 w-4 text-primary" />
            Commander Precons
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[10px] font-bold normal-case tracking-normal">
              {archiveStatus === "ready"
                ? `(${precons.length})`
                : archiveStatus === "loading"
                  ? "Loading"
                  : archiveStatus === "error"
                    ? "Unavailable"
                    : "Load archive"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>

        <div id={`set-precons-${set.code}`} hidden={!isExpanded}>
          {isExpanded && (
            <div className="min-h-0 overflow-hidden">
              <div className="p-3 pt-0 space-y-3 sm:p-4 sm:pt-0">
                {archiveStatus === "loading" || archiveStatus === "idle" ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="space-y-2 border border-border bg-background p-4 text-sm text-muted-foreground"
                  >
                    <p className="font-semibold">
                      Loading the shared Commander decklist archive…
                    </p>
                    <div className="h-2 animate-pulse bg-muted" />
                    <div className="h-2 w-2/3 animate-pulse bg-muted" />
                  </div>
                ) : archiveStatus === "error" ? (
                  <div
                    role="alert"
                    className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-muted-foreground"
                  >
                    <p>
                      {archiveError ||
                        "The Commander decklist archive could not be loaded."}
                    </p>
                    <button
                      type="button"
                      onClick={onRetryArchive}
                      className="mt-2 font-bold text-primary underline"
                    >
                      Retry archive load
                    </button>
                  </div>
                ) : precons.length > 0 ? (
                  precons.map(precon => (
                    <PreconCard
                      key={precon.name}
                      precon={precon}
                      ownedCollection={ownedCollection}
                    />
                  ))
                ) : (
                  <div className="border border-dashed border-border bg-background p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                      The Commander archive loaded successfully; no precons are
                      indexed for {set.name}.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-2 font-mono text-[10px] uppercase"
                    >
                      <Link href="/precons">Browse Precon Archive</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreconCard({
  precon,
  ownedCollection,
}: {
  precon: PreconDeck;
  ownedCollection: ReturnType<typeof loadOwnedCollection>;
}) {
  const allRefCards = [
    ...(precon.commanderCards || []),
    ...(precon.mainCards || []),
  ];
  const deckCardNames = allRefCards.map(c => c.name.toLowerCase());
  const ownedCount = deckCardNames.reduce((acc, name) => {
    const found = ownedCollection.find(
      item => item.name.toLowerCase() === name
    );
    return acc + (found ? Math.min(found.quantity, 1) : 0);
  }, 0);
  const totalCards = precon.card_count || allRefCards.length || 100;
  const ownedPercent =
    totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0;

  const targetRoute = precon.hasDecklist
    ? `/deck/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`
    : `/precon/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`;

  const fallbackImages = [
    precon.productImageUrl,
    precon.image_uris?.normal,
  ].filter((url): url is string => Boolean(url));
  const commanderNamesText =
    precon.commanderCards?.map(c => c.name).join(" & ") || "Commander Deck";

  return (
    <div className="border border-border bg-background p-3 transition-colors hover:border-primary sm:p-4">
      <div className="flex items-start gap-4">
        <div className="w-36 shrink-0 sm:w-40 lg:w-44">
          <CommanderCardFrame
            cardName={precon.commanderCards?.[0]?.name || precon.name}
            alt={`${precon.name} Commander artwork`}
            fallbackSrc={fallbackImages}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm truncate">{precon.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {commanderNamesText}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {precon.set_code.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> {totalCards} Cards
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
              <CheckCircle2 className="h-3 w-3" /> {ownedCount}/{totalCards} (
              {ownedPercent}%)
            </span>
          </div>

          <div className="mt-2 w-full bg-border h-1.5">
            <div
              className="bg-emerald-500 h-1.5 transition-all"
              style={{ width: `${Math.min(100, ownedPercent)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              asChild
              size="sm"
              variant="default"
              className="min-h-11 w-full font-mono text-[10px] uppercase font-bold"
            >
              <Link href={targetRoute}>
                {precon.hasDecklist
                  ? "View Decklist (100 Cards)"
                  : "Browse Product Catalog"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
