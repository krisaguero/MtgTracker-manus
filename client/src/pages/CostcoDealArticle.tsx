import { ArrowLeft, ExternalLink, Sparkles, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { Link } from 'wouter';

export default function CostcoDealArticle() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/movers" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Market Hub
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/signal-matrix-article" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Signal Matrix
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="space-y-8">
          <div className="border-b-2 border-primary pb-6">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> Retail Arbitrage &amp; Sealed Deal Alert · Costco Exclusive
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
              The Costco TMNT Booster Tin Collection Deal: $49.97 Breakdown &amp; Value Analysis
            </h1>
            <p className="mt-4 text-sm font-mono text-muted-foreground">
              Published August 19, 2026 · By Manus AI Market Desk
            </p>
          </div>

          {/* Deal Callout Box */}
          <div className="border-2 border-primary bg-primary/5 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/3 border-2 border-border bg-card p-4 text-center">
                <span className="inline-block bg-primary text-primary-foreground font-mono text-[10px] font-extrabold uppercase px-2.5 py-1 mb-3">
                  Online Only Deal
                </span>
                <p className="font-mono text-3xl font-extrabold text-primary">$49.97</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">Costco Wholesale Member Price</p>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShoppingBag className="h-4 w-4" /> Delivery Available
                </div>
              </div>
              <div className="w-full md:w-2/3 space-y-3">
                <h3 className="text-xl font-bold">Magic: The Gathering – Teenage Mutant Ninja Turtles Universes Beyond 5-Tin Booster Collection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Costco has dropped a blockbuster sealed product offering for the <span className="text-foreground font-semibold">Universes Beyond: Teenage Mutant Ninja Turtles</span> crossover collection. Priced at $49.97, this bundle delivers incredible value compared to single-tin or standard booster pack MSRPs.
                </p>
                <div className="pt-2">
                  <a
                    href="https://www.costco.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border-2 border-primary bg-primary text-primary-foreground px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90"
                  >
                    Check Costco Offer <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-base leading-relaxed">
            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">What’s Included in the 5-Tin Booster Collection</h2>
            <p>
              Targeting both casual collectors and competitive commander players looking for exclusive crossover variants, the 5-Tin Collector Box packs substantial sealed value. Here is the exact breakdown of contents across the five collector tins:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 font-mono text-xs">
              <div className="border-2 border-border bg-card p-4 space-y-2">
                <span className="font-bold text-primary block uppercase text-sm">5 Distinct Tins</span>
                <p className="text-muted-foreground">Sturdy, collectible metal tins featuring iconic TMNT and Magic crossover artwork, ideal for deck storage.</p>
              </div>
              <div className="border-2 border-border bg-card p-4 space-y-2">
                <span className="font-bold text-primary block uppercase text-sm">15 Play Boosters Total</span>
                <p className="text-muted-foreground">3 Universes Beyond: TMNT Play Boosters packed inside each of the 5 tins (15 packs total).</p>
              </div>
              <div className="border-2 border-border bg-card p-4 space-y-2">
                <span className="font-bold text-primary block uppercase text-sm">Promo Cards &amp; Extras</span>
                <p className="text-muted-foreground">5 Foil Promo cards (1 exclusive foil promo per tin) plus 5 exclusive collector stickers.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">Sealed Value &amp; Arbitrage Analysis</h2>
            <p>
              When evaluating sealed product purchases, experienced MTG finance analysts look at pack-per-dollar ratios and exclusive promo liquidity. At $49.97 for 15 Play Boosters plus 5 foil promos and metal storage tins, the per-pack cost sits at approximately <span className="font-semibold text-foreground">$3.33 per booster</span>—well below standard LGS or online retail pricing for Universes Beyond specialty sets.
            </p>
            <p>
              Furthermore, crossover promos featuring Leonardo, Donatello, Raphael, Michelangelo, and Shredder variants historically command strong secondary market premiums upon release. For collectors already tracking our Daily Movers hub, securing sealed product at wholesale club pricing provides a hedged entry point before single card buyouts commence.
            </p>

            <div className="border border-border bg-muted/40 p-4 font-mono text-xs space-y-2">
              <span className="font-bold text-foreground uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Collector Advice &amp; Purchasing Strategy
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Costco online-only drops for high-profile Universes Beyond products tend to experience rapid initial inventory depletion. If you plan to crack packs for Commander staples or hold sealed tins for long-term appreciation, review our collection manager to cross-reference duplicates before ordering.
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
