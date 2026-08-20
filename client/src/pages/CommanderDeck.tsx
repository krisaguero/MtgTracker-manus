// Design philosophy: hard-edged MTG editorial interface with indigo wayfinding, paper-like surfaces, and dense card catalog detail.
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Clipboard, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommanderDeck } from '@/hooks/useCommanderDeck';
import type { ScryfallCard } from '@/hooks/useSetDetail';
import { formatArenaDecklist, formatArchidektDecklist, formatMoxfieldDecklist, formatMtgoDecklist } from '@/lib/decklistExport';
import { ManaBoxImportModal } from '@/components/ManaBoxImportModal';
import { DeckCompletionCard } from '@/components/DeckCompletionCard';
import { ShoppingListModal } from '@/components/ShoppingListModal';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { getPreconMarketContext } from '@/lib/preconMarketContext';
import { getArenaCardStatus, formatArenaVariantDecklist, calculateArenaMorphWildcardCosts } from '@/lib/arenaLegality';
import { PreconStrategyPrimer } from '@/components/PreconStrategyPrimer';
import { MissingCardsSinglesSection } from '@/components/MissingCardsSinglesSection';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-8">
          <Link href={setCode ? `/${setCode}` : '/'} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to set
          </Link>
          <div className="flex min-h-[55vh] items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading the full in-app decklist…
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-8">
          <Link href={setCode ? `/${setCode}` : '/'} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to set
          </Link>
          <div className="mt-12 border-2 border-destructive/50 bg-destructive/10 p-6">
            <h1 className="text-xl font-bold">Decklist unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error ?? 'This Commander precon could not be found.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const grouped = groupDeckCards(data.deck);
  const deckSlugLabel = data.name;
  const liveMarketValue = useMemo(() => {
    let sum = 0;
    let pricedCount = 0;
    const allEntries = [...data.commander, ...data.deck];
    for (const entry of allEntries) {
      const priceStr = entry.card.prices?.usd;
      const num = priceStr ? Number(priceStr) : NaN;
      if (Number.isFinite(num) && num >= 0) {
        sum += num * entry.quantity;
        pricedCount += entry.quantity;
      }
    }
    return {
      total: Number(sum.toFixed(2)),
      pricedCount,
      totalCount: allEntries.reduce((acc, e) => acc + e.quantity, 0),
    };
  }, [data.commander, data.deck]);

  const marketContext = useMemo(() => getPreconMarketContext(data.deck.map((e) => ({ name: e.card.name, usd: e.card.prices?.usd ?? undefined }))), [data.deck]);
  const exportCommander = data.commander.map((entry) => ({ name: entry.card.name, quantity: entry.quantity }));
  const exportDeck = data.deck.map((entry) => ({ name: entry.card.name, quantity: entry.quantity }));
  const exportText = {
    arena: formatArenaVariantDecklist(exportCommander, exportDeck),
    moxfield: formatMoxfieldDecklist(exportCommander, exportDeck),
    mtgo: formatMtgoDecklist(exportCommander, exportDeck),
    archidekt: formatArchidektDecklist(exportCommander, exportDeck),
  };

  const wildcardCosts = useMemo(() => calculateArenaMorphWildcardCosts([...data.commander, ...data.deck]), [data.commander, data.deck]);

  async function copyExport(format: 'arena' | 'moxfield' | 'mtgo' | 'archidekt') {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(exportText[format]);
      setCopiedFormat(format);
      window.setTimeout(() => setCopiedFormat(null), 2200);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container py-5">
          <Link href={`/${data.setCode.toLowerCase()}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to {data.setName}
          </Link>
          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Commander precon / {data.setCode}</p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{data.name}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{data.setName} · released {formatDate(data.releaseDate)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="border-2 border-primary bg-primary/10 px-5 py-3 text-sm font-extrabold text-primary shadow-xs">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                  <span>Total Deck Value</span>
                  <span>({liveMarketValue.pricedCount}/{liveMarketValue.totalCount} cards)</span>
                </div>
                <div className="text-2xl font-black text-primary">
                  ${liveMarketValue.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-mono font-normal text-muted-foreground">USD</span>
                </div>
              </div>
              <div className="border border-border bg-background px-3 py-2 text-sm font-semibold">{data.totalCards} cards</div>
              <div className="border border-border bg-background px-3 py-2 text-sm font-semibold">{data.deckCards} in deck</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={() => copyExport('arena')}>
                  {copiedFormat === 'arena' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiedFormat === 'arena' ? 'Arena list copied' : 'Copy for Arena'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => copyExport('moxfield')}>
                  {copiedFormat === 'moxfield' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiedFormat === 'moxfield' ? 'Moxfield list copied' : 'Copy for Moxfield'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => copyExport('mtgo')}>
                  {copiedFormat === 'mtgo' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiedFormat === 'mtgo' ? 'MTGO list copied' : 'Copy for MTGO'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => copyExport('archidekt')}>
                  {copiedFormat === 'archidekt' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiedFormat === 'archidekt' ? 'Archidekt list copied' : 'Copy for Archidekt'}
                </Button>
              </div>
            </div>
          </div>
          {data.synopsis && (
            <div className="mt-6 max-w-4xl border-l-2 border-primary bg-background/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Deck Synopsis</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.synopsis}</p>
            </div>
          )}
          {copyError && (
            <p className="mt-3 text-right text-xs text-destructive">Clipboard access was unavailable. Select the decklist text below and copy it manually.</p>
          )}
        </div>
      </header>

      <main className="container py-10">

        <ManaBoxImportModal
          isOpen={isManaBoxOpen}
          onClose={() => setIsManaBoxOpen(false)}
          onCollectionUpdated={() => setCollectionVersion((value) => value + 1)}
        />

        <ShoppingListModal
          isOpen={isShoppingListOpen}
          onClose={() => setIsShoppingListOpen(false)}
          deckName={data.name}
          commanderCards={data.commander.map((entry) => ({ name: entry.card.name, count: entry.quantity, set_code: entry.card.set }))}
          mainCards={data.deck.map((entry) => ({ name: entry.card.name, count: entry.quantity, set_code: entry.card.set }))}
        />
        <div className="mb-10">
          <DeckCompletionCard
            deckCards={[
              ...data.commander.map((entry) => ({ name: entry.card.name, quantity: entry.quantity, usd: entry.card.prices?.usd ? Number(entry.card.prices.usd) : null })),
              ...data.deck.map((entry) => ({ name: entry.card.name, quantity: entry.quantity, usd: entry.card.prices?.usd ? Number(entry.card.prices.usd) : null })),
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
                {data.commander.length > 1 && <p className="mt-5 border-l-2 border-primary pl-3 text-sm text-muted-foreground">Partner commander: {data.commander.slice(1).map((entry) => entry.card.name).join(', ')}</p>}
              </div>
            </div>
          </section>
        )}

        <ValuationComparisonSection commanderEntries={data.commander} deckEntries={data.deck} sealedApproxValue={data.approxValue} />

        <PreconStrategyPrimer
          deckName={data.name}
          setName={data.setName}
          commanderNames={data.commander.map((e) => e.card.name)}
          commanderEntries={data.commander}
          deckEntries={data.deck}
          approxValue={liveMarketValue.total || data.approxValue || 45}
        />

        <MissingCardsSinglesSection
          deckName={data.name}
          commanderEntries={data.commander}
          deckEntries={data.deck}
          sealedApproxValue={liveMarketValue.total || data.approxValue || 45}
        />

        <section className="mb-8 border-2 border-primary/30 bg-primary/5 p-5 sm:p-6" aria-labelledby="precon-market-context-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Precon Market Context (10–20 Week Analysis)</p>
              <h2 id="precon-market-context-heading" className="mt-1 text-lg font-bold">Historical Top-1000 &amp; Volatility Highlights</h2>
            </div>
            <span className="border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
              {marketContext.totalHighlightedCards} volatile / tracked cards in deck
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{marketContext.summaryBanner}</p>
        </section>

        <section className="mb-12 border-2 border-border bg-card p-5 sm:p-7">
          <div className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Export decklist</p>
              <h2 className="mt-2 text-2xl font-bold">Copy and paste into your deck tool</h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">Choose a destination format. Arena, MTGO, Moxfield, and Archidekt each receive a plain-text list with their expected section labels.</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-bold uppercase tracking-wider">
              Preview format
              <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as typeof exportFormat)} className="bg-transparent font-mono text-xs font-semibold outline-none">
                <option value="moxfield">Moxfield</option>
                <option value="arena">Magic Arena</option>
                <option value="mtgo">MTGO</option>
                <option value="archidekt">Archidekt</option>
              </select>
            </label>
          </div>
          <textarea
            readOnly
            value={exportText[exportFormat]}
            aria-label={`${exportFormat} compatible decklist preview`}
            className="mt-5 min-h-40 w-full resize-y border border-border bg-background p-3 font-mono text-xs leading-5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="default" className="gap-2" onClick={() => copyExport(exportFormat)}>
              {copiedFormat === exportFormat ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copiedFormat === exportFormat ? `${exportFormat} list copied` : `Copy ${exportFormat} format`}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => copyExport('arena')}>Copy Arena</Button>
            <Button variant="outline" className="gap-2" onClick={() => copyExport('moxfield')}>Copy Moxfield</Button>
            <Button variant="outline" className="gap-2" onClick={() => copyExport('mtgo')}>Copy MTGO</Button>
            <Button variant="outline" className="gap-2" onClick={() => copyExport('archidekt')}>Copy Archidekt</Button>
          </div>

          <div className="mt-6 border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Arena-Morph Wildcard Cost Calculator</p>
                <h3 className="mt-1 text-base font-bold">Required digital wildcards for paper substitutions</h3>
              </div>
              <span className="border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                {wildcardCosts.totalSubstitutions} paper replacements required
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-border bg-background p-3 text-center">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Common</p>
                <p className="mt-1 text-xl font-extrabold text-foreground">{wildcardCosts.common}</p>
              </div>
              <div className="border border-border bg-background p-3 text-center">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uncommon</p>
                <p className="mt-1 text-xl font-extrabold text-foreground">{wildcardCosts.uncommon}</p>
              </div>
              <div className="border border-border bg-background p-3 text-center">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">Rare</p>
                <p className="mt-1 text-xl font-extrabold text-primary">{wildcardCosts.rare}</p>
              </div>
              <div className="border border-border bg-background p-3 text-center">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Mythic</p>
                <p className="mt-1 text-xl font-extrabold text-amber-600 dark:text-amber-400">{wildcardCosts.mythic}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Wildcard counts reflect the exact number of digital copies needed to build the strategy-preserving Arena-Morph variant for this deck.</p>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Complete contents</p>
              <h2 className="mt-2 text-3xl font-bold">The full 100-card decklist</h2>
            </div>
            <p className="text-sm text-muted-foreground">Quantities include the main commander separately.</p>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Arena-Morph Strategy Variant</p>
              <p className="text-sm text-muted-foreground">Toggle to view strategy-preserving functional counterparts playable on MTG Arena (Historic Brawl).</p>
            </div>
            <button
              type="button"
              onClick={() => setArenaMode((val) => !val)}
              className={`border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                arenaMode ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {arenaMode ? 'Viewing Arena-Morph Variant' : 'Switch to Arena-Morph Variant'}
            </button>
          </div>

          {grouped.map((group) => (
            <section key={group.label} className="mb-10">
              <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
                <h3 className="text-xl font-bold">{group.label}</h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.cards.reduce((sum, entry) => sum + entry.quantity, 0)} cards</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.cards.map((entry) => <DeckCardRow key={entry.card.id} entry={entry} refreshKey={collectionVersion} arenaMode={arenaMode} />)}
              </div>
            </section>
          ))}
        </section>

        {data.commander.length > 1 && (
          <section className="border-t border-border pt-8">
            <h2 className="text-xl font-bold">Additional commander cards</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.commander.slice(1).map((entry) => <DeckCardRow key={entry.card.id} entry={entry} refreshKey={collectionVersion} arenaMode={arenaMode} />)}
            </div>
          </section>
        )}
      </main>
      <span className="sr-only">{deckSlugLabel}</span>
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

function isNewRelease(card: ScryfallCard) {
  return card.reprint === false;
}

function DeckCardRow({ entry, refreshKey, arenaMode }: { entry: { card: ScryfallCard; quantity: number }; refreshKey: number; arenaMode: boolean }) {
  const [ownedQuantity, setOwnedQuantity] = useState(0);
  const [hasCollection, setHasCollection] = useState(false);
  useEffect(() => {
    const collection = loadOwnedCollection();
    const owned = collection.find((item) => item.name.toLowerCase() === entry.card.name.toLowerCase());
    setOwnedQuantity(owned?.quantity || 0);
    setHasCollection(collection.length > 0);
  }, [entry.card.name, refreshKey]);

  const cardName = encodeURIComponent(entry.card.name);
  const tcplayerUrl = `https://www.tcgplayer.com/search/all/product?q=${cardName}`;
  const arenaStatus = useMemo(() => getArenaCardStatus(entry.card), [entry.card]);
  const cardMarketHighlight = useMemo(() => {
    const list = getPreconMarketContext([{ name: entry.card.name, usd: entry.card.prices?.usd ?? undefined }]);
    return list.highlights[0] || null;
  }, [entry.card.name, entry.card.prices?.usd]);
  const ckUrl = `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${cardName}`;
  const amazonUrl = `https://www.amazon.com/s?k=Magic+The+Gathering+${cardName}`;
  const isNew = isNewRelease(entry.card);
  const price = entry.card.prices?.usd ? `$${entry.card.prices.usd}` : null;
  const isFullyOwned = ownedQuantity >= entry.quantity;
  const isPartiallyOwned = ownedQuantity > 0 && ownedQuantity < entry.quantity;
  const ownershipState = hasCollection ? (isFullyOwned ? 'owned' : isPartiallyOwned ? 'partial' : 'missing') : 'unknown';
  const stateClasses = ownershipState === 'owned'
    ? 'border-emerald-500/60 bg-emerald-500/5'
    : ownershipState === 'partial'
      ? 'border-amber-500/60 bg-amber-500/5'
      : ownershipState === 'missing'
        ? 'border-rose-500/40 bg-rose-500/5'
        : 'border-border bg-card';

  return (
    <div className={`group relative flex flex-col justify-between border p-3 transition-colors hover:border-primary ${stateClasses}`}>
      <div className="flex items-start gap-3">
        <div className="h-[76px] w-[54px] shrink-0 overflow-hidden bg-muted">
          <CardImage card={entry.card} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{entry.card.name}</p>
            <span className="shrink-0 border border-border bg-background px-1.5 py-0.5 text-xs font-bold">{entry.quantity}×</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{entry.card.type_line}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isNew ? (
              <span className="border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary" title="Card debuted in this release">NEW</span>
            ) : (
              <span className="border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground" title="Previously printed card">REPRINT</span>
            )}
            {price && <span className="border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground">{price} USD</span>}
            {arenaMode && (
              <span className={`border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${arenaStatus.isArenaLegal ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`} title={arenaStatus.reason}>
                {arenaStatus.isArenaLegal ? 'Arena Legal' : `Morph Sub: ${arenaStatus.substitutionName}`}
              </span>
            )}
            {cardMarketHighlight && (
              <span className="border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary" title={`Rank #${cardMarketHighlight.historicalRank} mover (${cardMarketHighlight.weeklyVolatilityPercent}% 20-wk volatility)`}>
                TOP 1K (#{cardMarketHighlight.historicalRank}) · {cardMarketHighlight.weeklyVolatilityPercent}% VOL
              </span>
            )}
            {ownershipState === 'owned' && (
              <span className="inline-flex items-center gap-1 border border-emerald-600/50 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700" title={`You own ${ownedQuantity} of ${entry.quantity} required`}>
                <CheckCircle2 className="h-3 w-3" /> OWNED
              </span>
            )}
            {ownershipState === 'partial' && (
              <span className="inline-flex items-center gap-1 border border-amber-600/50 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800" title={`You own ${ownedQuantity} of ${entry.quantity} required`}>
                <AlertCircle className="h-3 w-3" /> {ownedQuantity}/{entry.quantity} OWNED
              </span>
            )}
            {ownershipState === 'missing' && (
              <span className="border border-rose-600/50 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-700" title={`You need ${entry.quantity} copy${entry.quantity === 1 ? '' : 'ies'}`}>
                NEED {entry.quantity}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-primary">Buy singles:</span>
        <div className="flex items-center gap-2">
          <a href={ckUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">Card Kingdom</a>
          <span>•</span>
          <a href={tcplayerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">TCGplayer</a>
          <span>•</span>
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">Amazon</a>
        </div>
      </div>
    </div>
  );
}


function ValuationComparisonSection({ commanderEntries, deckEntries, sealedApproxValue }: { commanderEntries: Array<{ card: ScryfallCard; quantity: number }>; deckEntries: Array<{ card: ScryfallCard; quantity: number }>; sealedApproxValue?: number }) {
  const allEntries = [...commanderEntries, ...deckEntries];
  const pricedEntries = allEntries
    .map((entry) => ({
      ...entry,
      usdNum: entry.card.prices?.usd ? parseFloat(entry.card.prices.usd) : 0,
    }))
    .filter((entry) => entry.usdNum > 0)
    .sort((a, b) => b.usdNum - a.usdNum);

  const topFive = pricedEntries.slice(0, 5);
  const topFiveSum = topFive.reduce((sum, item) => sum + item.usdNum * item.quantity, 0);

  return (
    <section className="mb-12 border-2 border-border bg-card p-5 sm:p-7">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Value & Equity Breakdown</p>
          <h2 className="mt-2 text-2xl font-bold">Sealed Precon vs. Top 5 Singles</h2>
        </div>
        <div className="text-xs text-muted-foreground">Cards and prices are refreshed from the Scryfall source index</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sealed Precon Retail / Est.</p>
          <p className="mt-3 text-3xl font-bold">{sealedApproxValue ? `$${sealedApproxValue}` : 'Unpriced'}</p>
          <p className="mt-2 text-xs text-muted-foreground">Approximate market benchmark for the complete sealed product box.</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top 5 Singles Total</p>
          <p className="mt-3 text-3xl font-bold">{topFiveSum > 0 ? `$${topFiveSum.toFixed(2)}` : '—'}</p>
          <p className="mt-2 text-xs text-muted-foreground">Combined market value of the five highest-valued singles in this 100-card list.</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buying Strategy</p>
          <p className="mt-3 text-sm font-semibold leading-relaxed">
            {sealedApproxValue && topFiveSum >= sealedApproxValue
              ? 'The top singles alone outvalue or nearly match the sealed precon price—buying the sealed box offers strong equity.'
              : 'Singles total is below the sealed box price; purchasing individual singles is likely more cost-effective if you only want specific cards.'}
          </p>
        </div>
      </div>

      {topFive.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Highest-valued cards in this deck</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {topFive.map((item, idx) => {
              const cardName = encodeURIComponent(item.card.name);
              const ckRef = (import.meta.env.VITE_CARD_KINGDOM_PARTNER as string) || '';
              const tcgRef = (import.meta.env.VITE_TCGPLAYER_PARTNER as string) || '';
              const ckUrl = `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${cardName}${ckRef ? `&partner=${ckRef}&utm_source=partner&utm_medium=affiliate&utm_campaign=${ckRef}` : ''}`;
              const tcgUrl = `https://www.tcgplayer.com/search/all/product?q=${cardName}${tcgRef ? `&utm_campaign=affiliate&utm_medium=api&utm_source=${tcgRef}` : ''}`;
              const isNew = isNewRelease(item.card);
              return (
                <div key={item.card.id} className="group relative flex flex-col justify-between border border-border bg-background p-3 text-xs transition-colors hover:border-primary">
                  <div>
                    <div className="flex items-center justify-between font-bold text-primary">
                      <span>#{idx + 1}</span>
                      <span>${item.usdNum.toFixed(2)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className={`border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${isNew ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground'}`} title={isNew ? 'Card debuted in this release' : 'Previously printed card'}>
                        {isNew ? 'NEW' : 'REPRINT'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.quantity}× in deck</span>
                    </div>
                    <p className="mt-2 truncate font-semibold group-hover:text-primary" title={item.card.name}>{item.card.name}</p>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.card.type_line}</p>
                  </div>
                  <div className="mt-4 border-t border-border pt-2 flex items-center justify-between text-[11px]">
                    <a href={ckUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">Card Kingdom</a>
                    <span className="text-muted-foreground">·</span>
                    <a href={tcgUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">TCGplayer</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
