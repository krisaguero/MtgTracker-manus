import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Clipboard, Copy, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { InternalPageNav } from '@/components/InternalPageNav';
import { brawlMazirekDeck, countBrawlDeck, flattenBrawlDeck, type BrawlDeckVersion } from '@/data/brawlMazirek';
import { formatMoxfieldDecklist } from '@/lib/decklistExport';
import { loadOwnedCollection } from '@/lib/manaboxParser';

function cardImage(name: string) {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function BrawlMazirek() {
  const [version, setVersion] = useState<BrawlDeckVersion>('optimized');
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [collectionVersion, setCollectionVersion] = useState(0);
  const deck = brawlMazirekDeck.versions[version];
  const owned = useMemo(() => loadOwnedCollection(), [collectionVersion]);
  const ownedByName = useMemo(() => new Map(owned.map((entry) => [entry.name.toLowerCase(), entry.quantity])), [owned]);
  const cards = flattenBrawlDeck(version);
  const uniqueCards = new Set(cards.map((card) => card.toLowerCase())).size;
  const commanderExport = [{ name: brawlMazirekDeck.commander, quantity: 1 }];
  const mainExport = cards.slice(1).map((name) => ({ name, quantity: 1 }));
  const exportText = formatMoxfieldDecklist(commanderExport, mainExport);

  const copyDeck = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const toggleCard = (key: string) => setChecked((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <InternalPageNav active="/brawl/mazirek" />
      <header className="border-b-2 border-border bg-card">
        <div className="container py-7 sm:py-10">
          <Link href="/dupe-decks" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> 1v1 &amp; deck lab</Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <span className="border border-primary bg-primary px-2 py-1 text-primary-foreground">New format lab</span>
                <span className="border border-border px-2 py-1 text-muted-foreground">60-card singleton</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{brawlMazirekDeck.name}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Trim the Commander bloat without losing the Golgari sacrifice engine. This construction lab keeps Mazirek as the identity anchor and lets you compare a strict conversion against a lower-curve upgrade path.</p>
            </div>
            <div className="border-2 border-primary/40 bg-primary/5 p-4 sm:min-w-[220px]">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Build status</div>
              <div className="mt-2 text-3xl font-black">{countBrawlDeck(version)} / 60</div>
              <div className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{uniqueCards} unique cards · {brawlMazirekDeck.colors}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container space-y-8 py-7 sm:py-10">
        <section className="border-2 border-amber-500/50 bg-amber-500/10 p-4 sm:p-5" aria-label="Format note">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-bold uppercase tracking-tight text-amber-900 dark:text-amber-200">Format clarification</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">{brawlMazirekDeck.formatNote} The attached list uses a historic card pool, so use this as a house-rule, casual Brawl-style construction unless your playgroup agrees otherwise.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
          <div className="border-2 border-primary bg-primary p-5 text-primary-foreground">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">Commander</div>
            <h2 className="mt-2 text-2xl font-black">{brawlMazirekDeck.commander}</h2>
            <p className="mt-2 text-sm leading-6 opacity-85">The deck wants every expendable creature, Spawn, Scion, and utility body to become a permanent-wide counter trigger.</p>
            <a href={`https://scryfall.com/search?q=${encodeURIComponent(brawlMazirekDeck.commander)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase underline underline-offset-4">Open card record <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="border-2 border-border bg-card p-5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conversion logic</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li><strong className="text-foreground">Higher engine density:</strong> fewer backup plans means more sacrifice pieces every game.</li>
              <li><strong className="text-foreground">Lower curve:</strong> early ramp and cheap recursion replace expensive finishers.</li>
              <li><strong className="text-foreground">Explosive close:</strong> token deaths become counters, evasion, and a Living Death swing.</li>
            </ul>
          </div>
          <div className="border-2 border-border bg-card p-5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Build controls</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {(Object.keys(brawlMazirekDeck.versions) as BrawlDeckVersion[]).map((key) => (
                <button key={key} type="button" onClick={() => setVersion(key)} className={`border px-3 py-3 text-left transition-colors ${version === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wider">{brawlMazirekDeck.versions[key].label}</span>
                  <span className={`mt-1 block text-xs ${version === key ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{key === 'optimized' ? 'Lower curve + tutors' : 'Strict original-pool trim'}</span>
                </button>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={() => void copyDeck()} className="mt-3 w-full gap-2 font-mono text-[10px] font-bold uppercase"><Copy className="h-3.5 w-3.5" /> {copied ? 'Copied decklist' : 'Copy Moxfield decklist'}</Button>
          </div>
        </section>

        <section className="border-2 border-border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Active construction</div>
              <h2 className="mt-2 text-2xl font-black">{deck.label}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{deck.description}</p>
            </div>
            <div className="font-mono text-xs font-bold uppercase text-muted-foreground">{deck.sections.reduce((total, section) => total + section.cards.length, 0)} main + 1 commander</div>
          </div>

          <div className="mt-7 space-y-8">
            {deck.sections.map((section) => (
              <div key={section.label}>
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-mono text-xs font-black uppercase tracking-[0.16em]">{section.label}</h3>
                  <span className="font-mono text-[10px] text-muted-foreground">{section.cards.length} slots</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {section.cards.map((name, index) => {
                    const key = `${version}-${section.label}-${index}-${slugify(name)}`;
                    const ownedQty = ownedByName.get(name.toLowerCase()) || 0;
                    const isOwned = (checked[key] || false) || ownedQty > 0;
                    return (
                      <div key={key} className={`group relative overflow-hidden border bg-background transition-colors ${isOwned ? 'border-emerald-500/70' : 'border-border hover:border-primary'}`}>
                        <div className="flex items-center gap-3 p-2.5">
                          <img src={cardImage(name)} alt={`${name} full card frame`} loading="lazy" className="h-24 w-[68px] shrink-0 border border-border object-cover object-top transition-transform duration-200 group-hover:scale-[1.03]" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium leading-5">{name}</div>
                            <div className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">Singleton slot · {ownedQty > 0 ? `Owned ${ownedQty}` : 'Not matched'}</div>
                            <button type="button" onClick={() => toggleCard(key)} className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase text-primary hover:underline"><Check className={`h-3 w-3 ${isOwned ? 'text-emerald-600' : 'opacity-40'}`} /> {isOwned ? 'In build' : 'Mark in build'}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="border-2 border-border bg-card p-5">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-xl font-black">Upgrade map</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The optimized list replaces slow recursion and high-cost payoff slots with Sakura-Tribe Elder, Dread Return, Sidisi, and Living Death.</p>
          </div>
          <div className="border-2 border-border bg-card p-5">
            <Clipboard className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-xl font-black">Collection-aware build</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Import your ManaBox inventory on the <Link href="/collection" className="font-bold text-primary underline">Collection page</Link>, then return here to see name matches against each version.</p>
            <button type="button" onClick={() => setCollectionVersion((value) => value + 1)} className="mt-3 font-mono text-[10px] font-bold uppercase text-primary hover:underline">Refresh collection matches</button>
          </div>
          <div className="border-2 border-border bg-card p-5">
            <ExternalLink className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-xl font-black">Next playtest</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Log the first five games as a house-rule Brawl test: opening hand, first engine, sacrifice count, and whether the deck found a closing loop.</p>
            <Link href="/duel-battle-box" className="mt-3 inline-flex font-mono text-[10px] font-bold uppercase text-primary underline">Open playtest tools</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
