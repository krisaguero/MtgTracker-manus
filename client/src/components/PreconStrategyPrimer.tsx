import React from 'react';
import { BookOpen, ExternalLink, ShieldAlert, Sparkles, TrendingUp, Youtube } from 'lucide-react';
import type { ScryfallCard } from '@/hooks/useSetDetail';
import { resolveCardPrice } from '@/lib/marketPriceIndex';
import { moversForCard } from '@/lib/marketMoverLinks';
import { Link } from 'wouter';

interface PreconStrategyPrimerProps {
  deckName: string;
  setName: string;
  commanderNames: string[];
  commanderEntries: Array<{ card: ScryfallCard; quantity: number }>;
  deckEntries: Array<{ card: ScryfallCard; quantity: number }>;
  approxValue: number | null;
}

export function PreconStrategyPrimer({
  deckName,
  setName,
  commanderNames,
  commanderEntries,
  deckEntries,
  approxValue,
}: PreconStrategyPrimerProps) {
  // Identify top 5 most expensive cards in the deck
  const allCards = [...commanderEntries, ...deckEntries];
  const sortedByPrice = [...allCards].sort((a, b) => {
    const priceA = resolveCardPrice(a.card.name, a.card.set)?.usd ?? (Number(a.card.prices?.usd) || 0);
    const priceB = resolveCardPrice(b.card.name, b.card.set)?.usd ?? (Number(b.card.prices?.usd) || 0);
    return priceB - priceA;
  });

  const topValueCards = sortedByPrice.slice(0, 5);

  // Approximate power level based on approx value and synergy
  let powerLevel = 'Bracket 2 / Casual Upgrade (Power 6-7)';
  if (approxValue !== null && approxValue > 120) powerLevel = 'Bracket 3 / High Synergy Casual (Power 7-8)';
  if (approxValue !== null && approxValue < 45) powerLevel = 'Bracket 1 / Out-of-the-Box Precon (Power 5-6)';

  const edhrecSearchUrl = `https://edhrec.com/precon/${encodeURIComponent(deckName.toLowerCase())}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(deckName + ' ' + setName + ' commander precon upgrade guide 50 dollars')}`;

  return (
    <div className="space-y-8 my-10">
      {/* Strategy Primer & Power Level */}
      <section className="border-2 border-primary/40 bg-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <span className="border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              Strategy Primer &amp; Power Level
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3">Playstyle &amp; Commander Strategy</h2>
          </div>
          <div className="border-2 border-primary bg-primary/10 px-4 py-2 font-mono text-xs font-bold text-primary">
            Estimated Power: <strong className="text-foreground">{powerLevel}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">{deckName}</strong> ({setName}) is built around commanders <strong className="text-foreground">{commanderNames.join(' and ')}</strong>. Out of the box, this deck focuses on executing proactive synergy loops, establishing board presence, and leveraging key card advantages to outpace opponents in multiplayer pods.
            </p>
            <p>
              The strategy revolves around maximizing the commander's unique tap or triggered abilities while supporting the 99-card library with reliable ramp, targeted removal, and win-condition finishers. Players looking to tune this deck typically target mana curve smoothness and high-impact $50 upgrades found in EDHREC community recommendations.
            </p>
          </div>

          <div className="border-2 border-border bg-background p-5 space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Community Resources
            </h3>
            <div className="space-y-2.5 font-mono text-xs">
              <a
                href={edhrecSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-border bg-card p-2.5 hover:border-primary transition-colors text-foreground font-semibold"
              >
                <span>EDHREC Precon Guide</span>
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </a>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-border bg-card p-2.5 hover:border-primary transition-colors text-foreground font-semibold"
              >
                <span>YouTube $50 Upgrade Videos</span>
                <Youtube className="h-3.5 w-3.5 text-red-500" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Top Value Cards & Unique Finds */}
      <section className="border-2 border-border bg-card p-6 sm:p-8">
        <div className="border-b border-border pb-4 mb-6">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Equity Drivers</span>
          <h3 className="text-xl font-bold mt-1">Top Value Cards &amp; Unique Finds</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topValueCards.map((entry, index) => {
            const img = entry.card.image_uris?.normal || entry.card.card_faces?.[0]?.image_uris?.normal;
            const price = resolveCardPrice(entry.card.name, entry.card.set)?.usd ?? (Number(entry.card.prices?.usd) || null);
            const mover = moversForCard(entry.card.name, entry.card.set).find((item) => item.percentChange > 0);

            return (
              <div key={`${entry.card.id}-${entry.card.set}-${entry.card.collector_number}-${index}`} className={`border-2 bg-background p-3 flex flex-col justify-between ${mover ? 'border-amber-500/70' : 'border-border'}`}>
                <div>
                  <div className="aspect-[5/7] w-full overflow-hidden bg-muted mb-3">
                    {img && <img src={img} alt={entry.card.name} className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <h4 className="font-bold text-sm leading-snug line-clamp-1">{entry.card.name}</h4>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1">{entry.card.type_line}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-border font-mono text-xs font-bold text-primary">
                  <div className="flex items-center justify-between"><span>Market:</span><span>{price === null ? 'Unavailable' : `$${price.toFixed(2)} USD`}</span></div>
                  {mover && <Link href={mover.articleHref} className="mt-2 inline-flex items-center text-[10px] uppercase text-amber-500 hover:underline">Hot watch · read mover post →</Link>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
