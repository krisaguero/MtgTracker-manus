import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft, ExternalLink, ShieldCheck, ShoppingBag, Sparkles, TrendingUp, Users, Layers, Zap, Plus, Check } from 'lucide-react';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { loadOwnedPrecons } from '@/lib/preconInventory';
import { loadOwnedCollection, saveOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';

interface PrintingVersion {
  id: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
  rarity: string;
  imageUrl: string;
  priceUsd: number;
  releasedAt: string;
}

export default function CardDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const cardNameParam = decodeURIComponent(params?.cardName || '');

  const [cardData, setCardData] = useState<{
    name: string;
    setName: string;
    setCode: string;
    rarity: string;
    typeLine: string;
    manaCost: string;
    oracleText: string;
    imageUrl: string;
    price: number;
    moverCategory?: string;
    percentageChange?: number;
    isBrandNewCard?: boolean;
    mechanicDescription?: string;
  }>(() => ({
    name: cardNameParam || 'Lightning Bolt',
    setName: 'Master Index',
    setCode: 'set',
    rarity: 'common',
    typeLine: 'Instant',
    manaCost: '{R}',
    oracleText: 'Lightning Bolt deals 3 damage to any target.',
    imageUrl: `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardNameParam || 'Lightning Bolt')}&format=image&version=normal`,
    price: 2.50,
    moverCategory: 'High Value Spikes',
    percentageChange: 18.5,
    isBrandNewCard: true,
    mechanicDescription: 'Brand new set-defining printing introducing a unique rules interaction or archetype mechanic.',
  }));

  const [printings, setPrintings] = useState<PrintingVersion[]>([]);
  const [selectedPrinting, setSelectedPrinting] = useState<PrintingVersion | null>(null);
  const [loadingPrintings, setLoadingPrintings] = useState(true);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Fetch alternate printings from Scryfall search API and analyze mechanics
  useEffect(() => {
    let isMounted = true;
    async function fetchPrintings() {
      if (!cardNameParam) return;
      try {
        setLoadingPrintings(true);
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${cardNameParam}" include:extras unique:prints`)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.data && isMounted) {
          const rawCards = json.data;
          const versions: PrintingVersion[] = rawCards.map((card: any) => ({
            id: card.id,
            setName: card.set_name || card.set?.toUpperCase(),
            setCode: card.set || 'SET',
            collectorNumber: card.collector_number || '1',
            rarity: card.rarity || 'common',
            imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
            priceUsd: card.prices?.usd ? Number(card.prices.usd) : (card.prices?.usd_foil ? Number(card.prices.usd_foil) : 1.50),
            releasedAt: card.released_at || '2024-01-01',
          }));

          versions.sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
          setPrintings(versions);

          const primaryCard = rawCards[0];
          const oracle = primaryCard.oracle_text || primaryCard.card_faces?.[0]?.oracle_text || '';
          const typeLine = primaryCard.type_line || '';
          const isReprint = primaryCard.reprint === true;
          const isBrandNew = !isReprint;

          let mechanicDesc = 'Standard reprint or foundational printing providing reliable utility across supported formats.';
          if (isBrandNew) {
            if (oracle.toLowerCase().includes('enters the battlefield') || oracle.toLowerCase().includes('when')) {
              mechanicDesc = 'Featured New Mechanic: Etb-triggered recursive effect or specialized battlefield entry trigger enabling powerful tempo swings.';
            } else if (oracle.toLowerCase().includes('sacrifice') || oracle.toLowerCase().includes('destroy')) {
              mechanicDesc = 'Featured New Mechanic: Interactive removal / sacrifice engine designed to dictate board state and trigger graveyard synergies.';
            } else if (oracle.toLowerCase().includes('counter') || oracle.toLowerCase().includes('draw')) {
              mechanicDesc = 'Featured New Mechanic: Card-advantage & state manipulation engine providing multi-phase value generation.';
            } else {
              mechanicDesc = 'Featured New Set Debut: Distinctive rules modifier introducing archetype-defining synergy and unique tactical options.';
            }
          }

          if (versions.length > 0) {
            setSelectedPrinting(versions[0]);
            setCardData((prev) => ({
              ...prev,
              name: cardNameParam,
              setName: primaryCard.set_name || versions[0].setName,
              setCode: primaryCard.set || versions[0].setCode,
              rarity: primaryCard.rarity || versions[0].rarity,
              typeLine,
              manaCost: primaryCard.mana_cost || primaryCard.card_faces?.[0]?.mana_cost || '{1}',
              oracleText: oracle,
              imageUrl: versions[0].imageUrl || prev.imageUrl,
              price: versions[0].priceUsd || prev.price,
              isBrandNewCard: isBrandNew,
              mechanicDescription: mechanicDesc,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch Scryfall printings:', err);
      } finally {
        if (isMounted) setLoadingPrintings(false);
      }
    }
    fetchPrintings();
    return () => {
      isMounted = false;
    };
  }, [cardNameParam]);

  // Inventory handling
  const [inventoryCards, setInventoryCards] = useState<OwnedCard[]>(() => loadOwnedCollection());

  const handleAddToCollection = () => {
    const currentList = loadOwnedCollection();
    const existingIndex = currentList.findIndex(
      (c) => c.name.toLowerCase() === cardNameParam.toLowerCase() && c.setCode?.toLowerCase() === (selectedPrinting?.setCode || cardData.setCode).toLowerCase()
    );

    let updated: OwnedCard[];
    if (existingIndex !== -1) {
      updated = currentList.map((c, idx) => (idx === existingIndex ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      updated = [
        ...currentList,
        {
          name: cardNameParam,
          quantity: 1,
          setCode: selectedPrinting?.setCode || cardData.setCode,
          collectorNumber: selectedPrinting?.collectorNumber || '1',
        },
      ];
    }

    saveOwnedCollection(updated);
    setInventoryCards(updated);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const isAlreadyOwned = useMemo(() => {
    return inventoryCards.some((c) => c.name.toLowerCase() === cardNameParam.toLowerCase());
  }, [inventoryCards, cardNameParam]);

  const ownedSlugs = useMemo(() => new Set(loadOwnedPrecons().map((e) => e.deckSlug.toLowerCase())), []);

  const matchingDecks = useMemo(() => {
    const list: Array<{ name: string; setCode: string; setName: string; slug: string; isOwned: boolean; approxValue: number }> = [];
    const queryName = cardNameParam.toLowerCase();

    for (const deck of commanderDecklistsData) {
      const allDeckCards = [...deck.commander, ...deck.cards];
      const hasCard = allDeckCards.some((c) => c.name.toLowerCase() === queryName);
      if (hasCard) {
        const slug = deck.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const isOwned = ownedSlugs.has(slug) || inventoryCards.filter((c) => c.setCode?.toLowerCase() === deck.set_code.toLowerCase()).length >= 25;
        list.push({
          name: deck.name,
          setCode: deck.set_code,
          setName: deck.set_name,
          slug,
          isOwned,
          approxValue: deck.approxValue,
        });
      }
    }

    return list.sort((a, b) => (b.isOwned ? 1 : 0) - (a.isOwned ? 1 : 0));
  }, [cardNameParam, ownedSlugs, inventoryCards]);

  const activeImage = selectedPrinting?.imageUrl || cardData.imageUrl;
  const activePrice = selectedPrinting?.priceUsd ?? cardData.price;
  const activeSetName = selectedPrinting?.setName || cardData.setName;
  const activeSetCode = selectedPrinting?.setCode || cardData.setCode;
  const activeRarity = selectedPrinting?.rarity || cardData.rarity;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="border-b-2 border-border bg-card px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider hover:border-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
            Card Profile &amp; Mechanic Explorer Hub
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-8 flex-1 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Image */}
          <div className={`border-2 p-6 flex flex-col items-center justify-center bg-card ${cardData.isBrandNewCard ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-border'}`}>
            {cardData.isBrandNewCard && (
              <div className="w-full mb-4 border border-amber-500 bg-amber-500/10 text-amber-500 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Set Debut / New Mechanic Card
              </div>
            )}
            <div className="aspect-[5/7] w-full max-w-sm overflow-hidden bg-muted border-2 border-border shadow-lg">
              <img
                src={activeImage}
                alt={cardData.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardNameParam)}&format=image&version=normal`;
                }}
              />
            </div>
            <div className="mt-5 w-full space-y-2">
              <button
                type="button"
                onClick={handleAddToCollection}
                className={`w-full border-2 py-2 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                  addedSuccess
                    ? 'border-emerald-500 bg-emerald-500 text-black'
                    : isAlreadyOwned
                    ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30'
                    : 'border-border bg-muted hover:border-primary text-foreground'
                }`}
              >
                {addedSuccess ? <Check className="h-4 w-4 text-black" /> : isAlreadyOwned ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
                {addedSuccess ? 'Added to Collection!' : isAlreadyOwned ? 'In Collection (+1 More)' : 'Add to Collection'}
              </button>
              <a
                href={`https://www.tcgplayer.com/search/magic/product?q=${encodeURIComponent(cardNameParam)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border-2 border-primary bg-primary text-primary-foreground py-2 text-center font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 block"
              >
                <ShoppingBag className="h-4 w-4" /> Buy on TCGplayer <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`https://scryfall.com/search?q=${encodeURIComponent(cardNameParam)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border-2 border-border bg-background py-2 text-center font-mono text-xs font-bold uppercase tracking-wider hover:border-primary transition-colors flex items-center justify-center gap-2 block text-foreground"
              >
                View on Scryfall <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Card Info & Mechanic Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`border-2 p-6 sm:p-8 space-y-4 bg-card ${cardData.isBrandNewCard ? 'border-amber-500/60' : 'border-border'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold uppercase text-primary">
                    {activeRarity} · {activeSetName} ({activeSetCode.toUpperCase()})
                  </span>
                  {cardData.isBrandNewCard && (
                    <span className="border border-amber-500 bg-amber-500 text-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider">
                      ✨ New Mechanic Debut
                    </span>
                  )}
                  {isAlreadyOwned && (
                    <span className="border border-emerald-500 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                      ✓ Owned in Inventory
                    </span>
                  )}
                </div>
                <span className="font-mono text-xl font-black text-primary">${activePrice.toFixed(2)} USD</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight">{cardNameParam}</h1>
              <p className="font-mono text-xs text-muted-foreground">{cardData.typeLine} — {cardData.manaCost}</p>

              {/* Mechanic & Rule Breakdown Profile */}
              <div className={`border-2 p-4 mt-2 ${cardData.isBrandNewCard ? 'border-amber-500/40 bg-amber-950/10' : 'border-border bg-background'}`}>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 mb-1.5">
                  <Zap className="h-3.5 w-3.5" /> Mechanic &amp; Tactical Profile
                </h3>
                <p className="text-sm leading-relaxed text-foreground font-sans">
                  {cardData.mechanicDescription}
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-mono text-sm leading-relaxed whitespace-pre-line text-foreground/90 bg-background p-4 border border-border">
                  {cardData.oracleText}
                </p>
              </div>
            </div>

            {/* Alternate Printings & Different Art Gallery */}
            <div className="border-2 border-border bg-card p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" /> Alternate Printings &amp; Art Versions ({printings.length})
                </h2>
                <span className="font-mono text-xs text-muted-foreground">Click any printing to view art &amp; pricing</span>
              </div>

              {loadingPrintings ? (
                <div className="py-8 text-center font-mono text-xs text-muted-foreground animate-pulse">Loading all Scryfall printings &amp; art versions...</div>
              ) : printings.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground py-4">No alternate printings indexed for this card.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
                  {printings.map((p) => {
                    const isSelected = selectedPrinting?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPrinting(p)}
                        className={`border-2 p-2.5 text-left flex flex-col justify-between transition-colors bg-background ${
                          isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/60'
                        }`}
                      >
                        <div className="aspect-[5/7] w-full bg-muted border border-border overflow-hidden mb-2">
                          <img src={p.imageUrl} alt={p.setName} className="h-full w-full object-cover pointer-events-none" />
                        </div>
                        <div>
                          <p className="font-bold text-xs truncate" title={p.setName}>{p.setName}</p>
                          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mt-1">
                            <span>#{p.collectorNumber}</span>
                            <span className="font-bold text-primary">${p.priceUsd.toFixed(2)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Finance & Movers History Section */}
            <div className="border-2 border-primary/40 bg-card p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Market Movers &amp; Finance History
                </h2>
                <span className="border border-emerald-500 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  +{cardData.percentageChange}% 7-Day Trend
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This card is actively tracked in the <strong className="text-foreground">{cardData.moverCategory}</strong> market index. Price volatility indicates strong demand across Commander and eternal formats.
              </p>
            </div>

            {/* Precon Inclusions (Inventory Prioritized) */}
            <div className="border-2 border-border bg-card p-6 sm:p-8 space-y-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Precon Decks Including This Card ({matchingDecks.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Decks already marked as owned in your inventory are prioritized at the top.</p>
              </div>

              {matchingDecks.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground py-4">No official Commander precons in the default library contain this specific card.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingDecks.map((deck) => (
                    <Link
                      key={deck.slug}
                      href={`/deck/${deck.setCode.toLowerCase()}/${deck.slug}`}
                      className={`border-2 p-4 flex flex-col justify-between transition-colors ${
                        deck.isOwned ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-950/10 hover:border-emerald-500' : 'border-border bg-background hover:border-primary'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm leading-snug">{deck.name}</h3>
                          {deck.isOwned && (
                            <span className="border border-emerald-500 bg-emerald-500 text-black px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider shrink-0">
                              Owned Inventory
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground mt-1">{deck.setName}</p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-border flex items-center justify-between font-mono text-xs">
                        <span className="text-muted-foreground">Approx Value:</span>
                        <span className="font-bold text-primary">${deck.approxValue}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
