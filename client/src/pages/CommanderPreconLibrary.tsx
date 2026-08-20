import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Check, ExternalLink, Filter, Search, ShieldCheck, ShoppingBag, Sparkles, Star, Users, Layers, Zap } from 'lucide-react';
import { commanderDecklistsData, type RawCommanderDeck } from '@/data/commanderDecklistsData';
import { slugify } from '@/hooks/useCommanderDeck';
import { loadOwnedPrecons, toggleOwnedPrecon, type OwnedPreconEntry } from '@/lib/preconInventory';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { productAssetFor } from '@/data/preconProductAssets';
import { CardImageZoom } from '@/components/CardImageZoom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PreconLibraryItem extends RawCommanderDeck {
  slug: string;
  msrp: number;
  orderUrl: string;
  isPartner: boolean;
  guild?: string;
}

const GUILDS = [
  { name: 'All Guilds / Colors', code: 'all' },
  { name: 'Azorius (WU)', code: 'WU' },
  { name: 'Dimir (UB)', code: 'UB' },
  { name: 'Rakdos (BR)', code: 'BR' },
  { name: 'Gruul (RG)', code: 'RG' },
  { name: 'Selesnya (GW)', code: 'GW' },
  { name: 'Orzhov (WB)', code: 'WB' },
  { name: 'Izzet (UR)', code: 'UR' },
  { name: 'Golgari (BG)', code: 'BG' },
  { name: 'Boros (RW)', code: 'RW' },
  { name: 'Simic (GU)', code: 'GU' },
  { name: 'Partner / Friends', code: 'PARTNER' },
];

const EXTENDED_PRECON_LIBRARY: PreconLibraryItem[] = commanderDecklistsData.map((deck) => {
  const slug = slugify(deck.name);
  const releaseYear = deck.release_date ? new Date(deck.release_date).getFullYear() : 2024;
  let msrp = 44.99;
  if (releaseYear >= 2024) msrp = 49.99;
  else if (releaseYear >= 2022) msrp = 42.99;
  else msrp = 39.99;

  if (deck.approxValue > 200) msrp = 59.99;

  const isPartner = deck.commander.length > 1 || deck.name.toLowerCase().includes('partner') || deck.name.toLowerCase().includes('&');

  let guild = 'WU';
  const nameLower = (deck.name + ' ' + (deck.commander[0]?.name || '')).toLowerCase();
  if (nameLower.includes('rakdos') || nameLower.includes('blitz') || nameLower.includes('blood')) guild = 'BR';
  else if (nameLower.includes('izzet') || nameLower.includes('spell') || nameLower.includes('storm')) guild = 'UR';
  else if (nameLower.includes('dimir') || nameLower.includes('rogue') || nameLower.includes('faerie')) guild = 'UB';
  else if (nameLower.includes('selesnya') || nameLower.includes('token') || nameLower.includes('elf')) guild = 'GW';
  else if (nameLower.includes('gruul') || nameLower.includes('dinosaur') || nameLower.includes('dragon')) guild = 'RG';
  else if (nameLower.includes('orzhov') || nameLower.includes('aristocrat') || nameLower.includes('ghost')) guild = 'WB';
  else if (nameLower.includes('golgari') || nameLower.includes('graveyard') || nameLower.includes('saproling')) guild = 'BG';
  else if (nameLower.includes('boros') || nameLower.includes('equipment') || nameLower.includes('soldier')) guild = 'RW';
  else if (nameLower.includes('simic') || nameLower.includes('counter') || nameLower.includes('landfall')) guild = 'GU';

  if (isPartner) guild = 'PARTNER';

  return {
    ...deck,
    slug,
    msrp,
    orderUrl: `https://www.tcgplayer.com/search/magic/product?q=${encodeURIComponent(deck.name + ' commander deck')}`,
    isPartner,
    guild,
  };
});

export default function CommanderPreconLibrary() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuild, setSelectedGuild] = useState('all');
  const [filterOwnedOnly, setFilterOwnedOnly] = useState(false);
  const [ownedPrecons, setOwnedPrecons] = useState<OwnedPreconEntry[]>(() => loadOwnedPrecons());
  const [inventoryCards] = useState(() => loadOwnedCollection());

  const inventoryNamesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of inventoryCards) {
      map.set(card.name.toLowerCase(), card.quantity);
    }
    return map;
  }, [inventoryCards]);

  const handleToggleOwned = (deck: PreconLibraryItem) => {
    const updated = toggleOwnedPrecon(deck.slug, deck.name, deck.set_code);
    setOwnedPrecons(updated);
  };

  const filteredDecks = useMemo(() => {
    return EXTENDED_PRECON_LIBRARY.filter((deck) => {
      if (selectedGuild !== 'all' && deck.guild !== selectedGuild) return false;
      if (filterOwnedOnly) {
        const isManuallyOwned = ownedPrecons.some((o) => o.deckSlug.toLowerCase() === deck.slug.toLowerCase());
        const deckCardNames = [...deck.commander, ...deck.cards].map((c) => c.name.toLowerCase());
        const matchedCount = deckCardNames.filter((name) => (inventoryNamesMap.get(name) || 0) > 0).length;
        const coveragePct = Math.round((matchedCount / Math.max(1, deckCardNames.length)) * 100);
        if (!isManuallyOwned && coveragePct < 50) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = deck.name.toLowerCase().includes(q);
        const matchesSet = deck.set_name.toLowerCase().includes(q) || deck.set_code.toLowerCase().includes(q);
        const matchesCommander = deck.commander.some((c) => c.name.toLowerCase().includes(q));
        if (!matchesName && !matchesSet && !matchesCommander) return false;
      }
      return true;
    });
  }, [searchQuery, selectedGuild, filterOwnedOnly, ownedPrecons, inventoryNamesMap]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="w-full px-4 py-3 sm:px-6 lg:px-8 2xl:px-12 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 font-mono text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Back to Sets
          </Button>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground uppercase">
            <span>Commander Precon Archive ({EXTENDED_PRECON_LIBRARY.length} Decks)</span>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8 sm:px-6 lg:px-8 2xl:px-12 space-y-8">
        {/* Hero Banner with Creative Art Styling */}
        <div className="relative border-2 border-border bg-card overflow-hidden p-6 sm:p-10">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 hidden lg:block bg-gradient-to-l from-primary to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 border-2 border-primary bg-primary/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-4 w-4" /> Creative Deck Archive &amp; Inventory Suite
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Commander Precon Library</h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Explore chronologically sequenced Commander preconfigured decks with boxed product artwork, primary commanders, live market valuations, street MSRP, and automatic baseline inventory matching against your collection.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="border-2 border-border bg-card p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search precons by name, set code, or primary commander..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 font-mono text-xs bg-background border-2 border-border"
              />
            </div>

            {/* Guild Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary shrink-0" />
              <select
                value={selectedGuild}
                onChange={(e) => setSelectedGuild(e.target.value)}
                className="bg-background border-2 border-border px-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none w-full sm:w-auto"
              >
                {GUILDS.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Owned Toggle */}
            <button
              type="button"
              onClick={() => setFilterOwnedOnly(!filterOwnedOnly)}
              className={`border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors shrink-0 inline-flex items-center justify-center gap-2 ${
                filterOwnedOnly ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-border bg-background text-foreground hover:border-emerald-500'
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> {filterOwnedOnly ? 'Showing Owned / 50%+ Complete' : 'Filter Owned Decks'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border font-mono text-xs text-muted-foreground">
            <span>Showing <strong className="text-foreground">{filteredDecks.length}</strong> of {EXTENDED_PRECON_LIBRARY.length} precons</span>
            <span>Click any precon card or decklist button to inspect 100-card contents &amp; missing singles</span>
          </div>
        </div>

        {/* Precon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const isManuallyOwned = ownedPrecons.some((o) => o.deckSlug.toLowerCase() === deck.slug.toLowerCase());
            const deckCardNames = [...deck.commander, ...deck.cards].map((c) => c.name.toLowerCase());
            const matchedCount = deckCardNames.filter((name) => (inventoryNamesMap.get(name) || 0) > 0).length;
            const coveragePct = Math.round((matchedCount / Math.max(1, deckCardNames.length)) * 100);
            const isOwned = isManuallyOwned || coveragePct >= 50;

            const asset = productAssetFor(deck.name);
            const boxArtUrl = asset?.imageUrl || `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(deck.commander[0]?.name || deck.name)}&format=image&version=normal`;
            const commanderArtUrl = deck.commander[0]?.name ? `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(deck.commander[0].name)}&format=image&version=art_crop` : boxArtUrl;

            return (
              <div
                key={deck.slug}
                className="border-2 border-border bg-card flex flex-col justify-between group hover:border-primary transition-all duration-200 relative shadow-sm"
              >
                <div>
                  {/* Creative Art Visual Header */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-background border-b-2 border-border">
                    {/* Background Art Blur Layer */}
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-md opacity-30 transform scale-110 group-hover:scale-125 transition-transform duration-500"
                      style={{ backgroundImage: `url(${commanderArtUrl})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

                    {/* Boxed Product Image Container */}
                    <div className="relative z-10 h-full w-full p-4 flex items-center justify-center">
                      <img
                        src={boxArtUrl}
                        alt={deck.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><rect fill="%231e293b" width="300" height="160"/><text x="150" y="75" font-family="monospace" font-size="14" fill="%23cbd5e1" text-anchor="middle">${encodeURIComponent(deck.name)}</text><text x="150" y="95" font-family="monospace" font-size="11" fill="%2394a3b8" text-anchor="middle">${deck.set_name}</text></svg>`;
                        }}
                      />
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="border border-border bg-background/90 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground shadow-xs">
                          {deck.set_code.toUpperCase()}
                        </span>
                        {deck.isPartner && (
                          <span className="border border-amber-500 bg-amber-500 text-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                            <Users className="h-3 w-3" /> Partner
                          </span>
                        )}
                        {isOwned && (
                          <span className="border border-emerald-500 bg-emerald-500 text-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                            <Check className="h-3 w-3" /> {coveragePct}% Owned
                          </span>
                        )}
                      </div>
                      <span className="border-2 border-primary bg-primary text-primary-foreground px-2.5 py-0.5 font-mono text-xs font-black shadow-md">
                        ~${deck.approxValue} USD
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{deck.set_name} · {deck.release_date || 'Recent Release'}</span>
                      <h3 className="font-extrabold text-lg leading-snug group-hover:text-primary transition-colors">{deck.name}</h3>
                    </div>

                    <p className="font-mono text-xs text-muted-foreground line-clamp-2 leading-relaxed">{deck.synopsis}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border font-mono text-xs">
                      <div>
                        <span className="text-muted-foreground uppercase block text-[10px]">Street MSRP</span>
                        <span className="font-bold">${deck.msrp.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground uppercase block text-[10px]">Primary Commander</span>
                        <span className="font-bold truncate block" title={deck.commander[0]?.name}>{deck.commander[0]?.name || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Inventory Coverage Progress Bar */}
                    <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                      <div className="flex justify-between items-center font-mono text-xs">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Collection Match</span>
                        <span className="font-bold text-primary">{matchedCount} / 100 cards ({coveragePct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-muted border border-border overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${coveragePct >= 75 ? 'bg-emerald-500' : coveragePct >= 40 ? 'bg-primary' : 'bg-amber-500'}`}
                          style={{ width: `${coveragePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <Link
                    href={`/deck/${deck.set_code.toLowerCase()}/${deck.slug}`}
                    className="border-2 border-border bg-background py-2 text-center font-mono text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Decklist ↗
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleOwned(deck)}
                    className={`border-2 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                      isManuallyOwned
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-border bg-card text-foreground hover:border-emerald-500 hover:text-emerald-600'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> {isManuallyOwned ? 'In Inventory' : 'Mark Owned'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDecks.length === 0 && (
          <div className="border-2 border-border bg-card p-12 text-center space-y-3 font-mono">
            <p className="text-sm text-muted-foreground">No Commander precons match your search criteria or guild filter.</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedGuild('all'); setFilterOwnedOnly(false); }} className="mt-2">
              Reset Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
