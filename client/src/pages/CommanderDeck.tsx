import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { AlertCircle, ArrowLeft, Check, Clipboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommanderDeck, type DecklistEntry } from '@/hooks/useCommanderDeck';
import type { ScryfallCard } from '@/hooks/useSetDetail';
import { formatArenaDecklist, formatArchidektDecklist, formatMoxfieldDecklist, formatMtgoDecklist } from '@/lib/decklistExport';
import { ManaBoxImportModal } from '@/components/ManaBoxImportModal';
import { DeckCompletionCard } from '@/components/DeckCompletionCard';
import { ShoppingListModal } from '@/components/ShoppingListModal';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { getPreconMarketContext, type PreconMarketHighlight } from '@/lib/preconMarketContext';
import { formatArenaVariantDecklist, calculateArenaMorphWildcardCosts } from '@/lib/arenaLegality';
import { PreconStrategyPrimer } from '@/components/PreconStrategyPrimer';
import { MissingCardsSinglesSection } from '@/components/MissingCardsSinglesSection';
import { DecklistSkeleton } from '@/components/DecklistSkeleton';
import { PreconStickyHeader } from '@/components/PreconStickyHeader';
import { ValuationComparisonSection } from '@/components/ValuationComparisonSection';
import { resolveCardPrice } from '@/lib/marketPriceIndex';
import { DeckCardRow } from '@/components/DeckCardRow';

const GROUPS = [
  { label: 'Creatures', test: (card: ScryfallCard) => card.type_line.includes('Creature') },
  { label: 'Planeswalkers', test: (card: ScryfallCard) => card.type_line.includes('Planeswalker') },
  { label: 'Artifacts', test: (card: ScryfallCard) => card.type_line.includes('Artifact') },
  { label: 'Enchantments', test: (card: ScryfallCard) => card.type_line.includes('Enchantment') },
  { label: 'Instants', test: (card: ScryfallCard) => card.type_line.includes('Instant') },
  { label: 'Sorceries', test: (card: ScryfallCard) => card.type_line.includes('Sorcery') },
  { label: 'Lands', test: (card: ScryfallCard) => card.type_line.includes('Land') },
];

function imageFor(card: ScryfallCard) {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small;
}

function formatDate(date?: string) {
  if (!date) return 'Release date unavailable';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function groupDeckCards(cards: Array<{ card: ScryfallCard; quantity: number }>) {
  const grouped = GROUPS.map((group) => ({ ...group, cards: cards.filter((entry) => group.test(entry.card)) }))
    .filter((group) => group.cards.length > 0);
  const groupedIds = new Set(grouped.flatMap((group) => group.cards.map((entry) => entry.card.id)));
  const other = cards.filter((entry) => !groupedIds.has(entry.card.id));
  if (other.length > 0) grouped.push({ label: 'Other', test: () => true, cards: other });
  return grouped;
}

export default function CommanderDeck() {
  const { setCode, deckSlug } = useParams<{ setCode: string; deckSlug: string }>();
  const { data, loading, error } = useCommanderDeck(setCode, deckSlug);
  const [exportFormat, setExportFormat] = useState<'arena' | 'moxfield' | 'mtgo' | 'archidekt'>('moxfield');
  const [copiedFormat, setCopiedFormat] = useState<'arena' | 'moxfield' | 'mtgo' | 'archidekt' | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [isManaBoxOpen, setIsManaBoxOpen] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [collectionVersion, setCollectionVersion] = useState(0);
  const [arenaMode, setArenaMode] = useState(false);

  const liveMarketValue = useMemo(() => {
    if (!data) return { total: null as number | null, ownedTotal: null as number | null };

    const collection = loadOwnedCollection();
    const ownedMap = new Map<string, number>();
    for (const c of collection) ownedMap.set(c.name.toLowerCase(), c.quantity);

    let total = 0;
    let ownedTotal = 0;
    let pricedQuantity = 0;
    const allEntries = [...data.commander, ...data.deck];

    for (const entry of allEntries) {
      const indexed = resolveCardPrice(entry.card.name, entry.card.set);
      const scryfallPrice = entry.card.prices?.usd ? Number(entry.card.prices.usd) : NaN;
      const price = indexed?.usd ?? (Number.isFinite(scryfallPrice) && scryfallPrice > 0 ? scryfallPrice : null);
      if (price === null) continue;
      const qty = entry.quantity;
      total += price * qty;
      pricedQuantity += qty;
      const ownedQty = ownedMap.get(entry.card.name.toLowerCase()) || 0;
      if (ownedQty > 0) ownedTotal += price * Math.min(ownedQty, qty);
    }
    return { total: pricedQuantity ? Number(total.toFixed(2)) : null, ownedTotal: pricedQuantity ? Number(ownedTotal.toFixed(2)) : null };
  }, [data, collectionVersion]);

  const arenaWildcards = calculateArenaMorphWildcardCosts(data ? [...data.commander, ...data.deck] : []);
  const sealedBaseline = data && typeof data.approxValue === 'number' && data.approxValue > 0 ? data.approxValue : null;

  if (loading) {
    return <DecklistSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-8">
          <Link href="/precons" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Commander Precon Archive
          </Link>
          <div className="mt-8 border-2 border-border bg-card p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-2xl font-bold">Decklist Unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error || 'Could not locate the requested commander precon decklist.'}</p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/precons">Browse Precon Archive</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const deckSlugLabel = deckSlug ? decodeURIComponent(deckSlug).replace(/-/g, ' ') : data.name;

  const exportCommander = data.commander.map((e) => ({ name: e.card.name, quantity: e.quantity }));
  const exportDeck = data.deck.map((e) => ({ name: e.card.name, quantity: e.quantity }));

  const handleCopyExport = async () => {
    let output = '';
    if (exportFormat === 'moxfield') {
      output = formatMoxfieldDecklist(exportCommander, exportDeck);
    } else if (exportFormat === 'arena') {
      output = arenaMode ? formatArenaVariantDecklist(exportCommander, exportDeck) : formatArenaDecklist(exportCommander, exportDeck);
    } else if (exportFormat === 'mtgo') {
      output = formatMtgoDecklist(exportCommander, exportDeck);
    } else if (exportFormat === 'archidekt') {
      output = formatArchidektDecklist(exportCommander, exportDeck);
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopiedFormat(exportFormat);
      setCopyError(false);
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch {
      setCopyError(true);
    }
  };

  const marketContext = getPreconMarketContext([...data.commander, ...data.deck].map((e) => ({ name: e.card.name, set_code: e.card.set, usd: e.card.prices?.usd ?? undefined })));

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="border-b border-border bg-card">
        <div className="container py-6 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/precons" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Commander Precon Archive
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="border border-border bg-background px-2 py-0.5 font-mono text-xs uppercase text-muted-foreground">{data.setCode}</span>
                <span className="text-sm font-medium text-muted-foreground">{formatDate(data.releaseDate)}</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{data.name}</h1>
              {data.setName && <p className="mt-1 text-base text-muted-foreground">{data.setName}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsManaBoxOpen(true)} className="gap-2 font-mono text-xs uppercase">
                <Sparkles className="h-4 w-4 text-primary" /> Import ManaBox Inventory
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsShoppingListOpen(true)} className="gap-2 font-mono text-xs uppercase">
                Missing Singles Shopping List
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-8 space-y-10">
        <PreconStickyHeader
          deckName={data.name}
          approxValue={liveMarketValue.total ?? sealedBaseline}
          ownedApproxValue={liveMarketValue.ownedTotal}
          commanderCards={data.commander.map((entry: DecklistEntry) => ({ name: entry.card.name, count: entry.quantity, set_code: entry.card.set }))}
          mainCards={data.deck.map((entry: DecklistEntry) => ({ name: entry.card.name, count: entry.quantity, set_code: entry.card.set }))}
        />
        <div className="mb-10">
          <DeckCompletionCard
            deckCards={[
              ...data.commander.map((entry: DecklistEntry) => ({ name: entry.card.name, quantity: entry.quantity, usd: entry.card.prices?.usd ? Number(entry.card.prices.usd) : null })),
              ...data.deck.map((entry: DecklistEntry) => ({ name: entry.card.name, quantity: entry.quantity, usd: entry.card.prices?.usd ? Number(entry.card.prices.usd) : null })),
            ]}
            onOpenImportModal={() => setIsManaBoxOpen(true)}
            onOpenShoppingList={() => setIsShoppingListOpen(true)}
          />
        </div>

        {data.primaryCommander && (
          <section className="mb-12 border-2 border-primary/30 bg-primary/5 p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> Main commander
            </div>
            <div className="grid gap-7 lg:grid-cols-[220px_1fr] lg:items-center">
              <CardImage card={data.primaryCommander.card} priority />
              <div>
                <h2 className="text-3xl font-bold">{data.primaryCommander.card.name}</h2>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{data.primaryCommander.card.type_line}</p>
                {data.primaryCommander.card.oracle_text && <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted-foreground">{data.primaryCommander.card.oracle_text}</p>}
                {data.commander.length > 1 && <p className="mt-5 border-l-2 border-primary pl-3 text-sm text-muted-foreground">Partner commander: {data.commander.slice(1).map((entry: DecklistEntry) => entry.card.name).join(', ')}</p>}
              </div>
            </div>
          </section>
        )}

        <ValuationComparisonSection commanderEntries={data.commander} deckEntries={data.deck} sealedApproxValue={sealedBaseline} />

        <PreconStrategyPrimer
          deckName={data.name}
          setName={data.setName}
          commanderNames={data.commander.map((e: DecklistEntry) => e.card.name)}
          commanderEntries={data.commander}
          deckEntries={data.deck}
          approxValue={liveMarketValue.total ?? sealedBaseline}
        />

        <MissingCardsSinglesSection
          deckName={data.name}
          commanderEntries={data.commander}
          deckEntries={data.deck}
          sealedApproxValue={sealedBaseline}
        />

        <section className="mb-8 border-2 border-primary/30 bg-primary/5 p-5 sm:p-6" aria-labelledby="precon-market-context-heading">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5">
                <Sparkles className="h-3 w-3" /> Market Intelligence &amp; History
              </div>
              <h3 id="precon-market-context-heading" className="mt-2 text-2xl font-bold tracking-tight">Precon Price History &amp; Buyout Context</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                Analysis for <strong className="text-foreground">{data.name}</strong> based on historical spikes, land watchlists, and EDHREC popularity index.
              </p>
            </div>
            <div className="border border-border bg-card p-4 shrink-0">
              <p className="text-xs font-mono uppercase text-muted-foreground">Highlighted Mover Cards</p>
              <p className="mt-1 text-lg font-bold text-emerald-500">{marketContext.totalHighlightedCards} Cards</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{marketContext.indexedCards}/{marketContext.pricedCards || marketContext.indexedCards} indexed card prices</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {marketContext.highlights.map((highlight: PreconMarketHighlight) => (
              <div key={highlight.cardName} className="border-2 border-amber-500/60 bg-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Link href={highlight.cardHref} className="font-mono text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 hover:underline">{highlight.cardName}</Link>
                    <span className="font-mono text-[10px] font-bold text-emerald-500">+{highlight.weeklyVolatilityPercent.toFixed(1)}%</span>
                  </div>
                  <p className="mt-2 font-mono text-xs font-bold text-primary">${highlight.currentUsd.toFixed(2)} indexed baseline</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{highlight.movementNote}</p>
                </div>
                <Link href={highlight.articleHref} className="mt-4 border-t border-border pt-3 font-mono text-[10px] font-bold uppercase text-amber-500 hover:underline">Read mover post →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Decklist Export & Arena-Morph Section */}
        <section className="border-2 border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Decklist Export &amp; Arena-Morph</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                Export this Commander deck list in formats compatible with Moxfield, MTGO, Archidekt, or Magic: The Gathering Arena. Use Arena-Morph to swap unavailable cards with Arena-legal counterparts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setArenaMode(false)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase font-bold transition-colors ${!arenaMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Standard List
                </button>
                <button
                  type="button"
                  onClick={() => setArenaMode(true)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase font-bold transition-colors ${arenaMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Arena-Morph
                </button>
              </div>

              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="border border-border bg-background px-3 py-2 font-mono text-xs uppercase font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="moxfield">Moxfield</option>
                <option value="arena">Magic Arena</option>
                <option value="mtgo">MTGO (.txt)</option>
                <option value="archidekt">Archidekt</option>
              </select>

              <Button onClick={handleCopyExport} className="gap-2 font-mono text-xs uppercase font-bold">
                {copiedFormat === exportFormat ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                {copiedFormat === exportFormat ? 'Copied to Clipboard!' : `Copy ${exportFormat.toUpperCase()} Export`}
              </Button>
            </div>
          </div>

          {arenaMode && (
            <div className="mt-6 border border-amber-500/40 bg-amber-500/10 p-4">
              <h3 className="font-bold text-sm text-amber-500 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Arena-Morph Wildcard Budget Required
              </h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs">
                <div className="border border-amber-500/30 bg-card p-2">
                  <p className="text-muted-foreground uppercase text-[10px]">Common</p>
                  <p className="mt-1 font-bold text-sm">{arenaWildcards.common}</p>
                </div>
                <div className="border border-amber-500/30 bg-card p-2">
                  <p className="text-muted-foreground uppercase text-[10px]">Uncommon</p>
                  <p className="mt-1 font-bold text-sm">{arenaWildcards.uncommon}</p>
                </div>
                <div className="border border-amber-500/30 bg-card p-2">
                  <p className="text-muted-foreground uppercase text-[10px]">Rare</p>
                  <p className="mt-1 font-bold text-sm">{arenaWildcards.rare}</p>
                </div>
                <div className="border border-amber-500/30 bg-card p-2">
                  <p className="text-muted-foreground uppercase text-[10px]">Mythic</p>
                  <p className="mt-1 font-bold text-sm">{arenaWildcards.mythic}</p>
                </div>
              </div>
            </div>
          )}

          {copyError && <p className="mt-3 text-xs font-mono text-destructive">Failed to copy to clipboard. Please select and copy manually.</p>}
        </section>

        {/* Grouped 100-card Decklist View */}
        {groupDeckCards([...data.commander, ...data.deck]).map((group) => (
          <section key={group.label} className="border-2 border-border bg-card p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider">{group.label}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {group.cards.reduce((acc: number, entry: { quantity: number }) => acc + entry.quantity, 0)} cards
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.cards.map((entry: { card: ScryfallCard; quantity: number }, index: number) => (
                <DeckCardRow key={`${group.label}-${entry.card.id}-${entry.card.set}-${entry.card.collector_number}-${index}`} entry={{ ...entry, zone: 'deck' }} refreshKey={collectionVersion} arenaMode={arenaMode} />
              ))}
            </div>
          </section>
        ))}

        {data.commander.length > 1 && (
          <section className="border-t border-border pt-8">
            <h2 className="text-xl font-bold">Additional commander cards</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.commander.slice(1).map((entry: DecklistEntry, index: number) => (
                <DeckCardRow key={`additional-commander-${entry.card.id}-${entry.card.set}-${entry.card.collector_number}-${index}`} entry={entry} refreshKey={collectionVersion} arenaMode={arenaMode} />
              ))}
            </div>
          </section>
        )}
      </main>
      <span className="sr-only">{deckSlugLabel}</span>

      <ManaBoxImportModal
        isOpen={isManaBoxOpen}
        onClose={() => setIsManaBoxOpen(false)}
        onCollectionUpdated={() => setCollectionVersion((v) => v + 1)}
      />

      <ShoppingListModal
        isOpen={isShoppingListOpen}
        onClose={() => setIsShoppingListOpen(false)}
        deckName={data.name}
        commanderCards={data.commander.map((entry: DecklistEntry) => ({ name: entry.card.name, count: entry.quantity }))}
        mainCards={data.deck.map((entry: DecklistEntry) => ({ name: entry.card.name, count: entry.quantity }))}
      />
    </div>
  );
}

function CardImage({ card, priority = false }: { card: ScryfallCard; priority?: boolean }) {
  const imageUrl = imageFor(card);
  return imageUrl ? (
    <img src={imageUrl} alt={card.name} className="aspect-[2.5/3.5] w-full border border-border object-cover shadow-sm" loading={priority ? 'eager' : 'lazy'} />
  ) : (
    <div className="flex aspect-[2.5/3.5] w-full items-center justify-center border border-border bg-muted p-3 text-center text-xs text-muted-foreground">{card.name}</div>
  );
}
