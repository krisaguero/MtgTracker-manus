import { Link } from 'wouter';
import { ArrowLeft, ExternalLink, ShieldAlert, Zap, BookOpen, Sparkles } from 'lucide-react';

export function FeaturedSignalMatrixArticle() {
  const featuredCards = [
    { name: 'Tyvar, the Pummeler', set: 'PPDSK', price: '$52.08', change: '+969.40%', thesis: 'Promo pack scarcity spike following aggressive Golgari aggro adoption.' },
    { name: 'Andúril, Narsil Reforged', set: 'HOC', price: '$75.00', change: '+581.82%', thesis: 'The Hobbit Equipment synergy boosting borderless collector demand.' },
    { name: 'Circle of Protection: Black', set: '2ED', price: '$13.65', change: '+493.48%', thesis: 'Low-liquidity buyout targeting reserved/old-school protection enchantments.' },
    { name: 'Eluge, the Shoreless Sea', set: 'PPBLB', price: '$27.57', change: '+416.29%', thesis: 'Bloomburrow fish commander promotion driving regional promo card absorption.' },
    { name: 'Idol of Oblivion', set: 'PLST', price: '$19.90', change: '+397.50%', thesis: 'The List printing absorbing token deck demand across casual tables.' },
    { name: 'Gimli of the Glittering Caves', set: 'LTC', price: '$37.98', change: '+379.55%', thesis: 'Lord of the Rings Dwarf legend synergy with new equipment and treasure packages.' },
    { name: 'Berserk', set: 'LEA', price: '$2675.47', change: '+273.67%', thesis: 'Alpha reserve list scarcity buyout hitting high-grade collector portfolios.' },
    { name: 'Dwarven Recruiter', set: 'ODY', price: '$8.50', change: '+359.40%', thesis: 'Core dwarf tribal tutor experiencing renewed buyout speculation.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/movers" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Daily Movers Hub
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/market-watch-article" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Previous: The Hobbit Spike
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="space-y-8">
          <div className="border-b-2 border-primary pb-6">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> Featured Market Analysis · 250-Card Signal Matrix
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Magic Market-Signal Matrix: Scope, Methodology, and Top Findings
            </h1>
            <p className="mt-4 text-sm font-mono text-muted-foreground">
              By Manus AI · Based on MTGStocks regular-price Interests feed dated August 18, 2026, retrieved August 19, 2026 UTC
            </p>
          </div>

          <div className="border-2 border-primary/30 bg-primary/5 p-4 font-mono text-xs">
            <span className="font-bold text-primary uppercase block mb-1">Research & Methodology Disclosure</span>
            Live mover data are sourced from the MTGStocks public regular-price Interests feed dated 2026-08-18 and retrieved 2026-08-19 UTC. Scryfall card text, legality, printing counts, EDHREC rank, and USD reference fields are refreshed during build. This package is research and analysis only, not personalized financial advice.
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-base leading-relaxed">
            <p>
              The <strong>Magic Market-Signal Matrix</strong> evaluates exactly 250 card printing records distributed across ten specialized secondary market categories (25 entries per category). By separating high-value spikes from penny buyout targets, Commander staples, Rules Committee watchlists, and Standard breakouts, collectors can distinguish structural format demand from thin-printing anomalies.
            </p>

            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">Featured Cards Mentioned in This Article</h2>
            <p className="text-muted-foreground">
              The following curated picks represent the strongest structural signals and buyout targets identified in the 250-card matrix. Click any card to inspect live multi-outlet pricing and price history.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 my-6">
              {featuredCards.map((card, idx) => (
                <div key={idx} className="border-2 border-border bg-card p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase bg-primary/10 text-primary px-2 py-0.5">{card.set}</span>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{card.change}</span>
                    </div>
                    <h3 className="mt-2 font-bold text-lg">{card.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{card.thesis}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold">{card.price}</span>
                    <Link href={`/movers?search=${encodeURIComponent(card.name)}`} className="font-mono text-xs font-bold text-primary hover:underline">
                      View in Hub →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">Category Breakdown & Inclusion Rules</h2>
            <p>
              To maintain analytical discipline, each category enforces strict inclusion boundaries and explicit risk warnings:
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full text-left border-2 border-border font-mono text-xs">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Inclusion Rule</th>
                    <th className="p-3">Primary Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-bold">High Value Spikes</td>
                    <td className="p-3 text-muted-foreground">Present regular-price field ≥ $25.00 with positive movement.</td>
                    <td className="p-3 text-muted-foreground">Thin premium printing volatility.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Penny Risers & Buyouts</td>
                    <td className="p-3 text-muted-foreground">Present regular-price field ≤ $3.00 with positive movement.</td>
                    <td className="p-3 text-muted-foreground">Low float and illiquid order books.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Commander Staples</td>
                    <td className="p-3 text-muted-foreground">High EDHREC usage rank with active supply absorption.</td>
                    <td className="p-3 text-muted-foreground">Popularity does not equal immediate liquidity.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">RC Rule Watchers</td>
                    <td className="p-3 text-muted-foreground">Cards connected to Format Panel policy or ban list discussions.</td>
                    <td className="p-3 text-muted-foreground">Discussion is not a promise of unbanning.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">Conclusion & Analytical Takeaway</h2>
            <p>
              Market spikes are research prompts rather than automatic buy orders. By cross-referencing quote movements with official rules announcements and Scryfall reference data, participants can successfully separate durable format adoption from transient collector ripples.
            </p>
          </div>

          <div className="border-t-2 border-border pt-6 mt-12 flex flex-wrap items-center justify-between gap-4">
            <Link href="/movers" className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90">
              ← Return to Daily Movers Hub
            </Link>
            <Link href="/market-watch-article" className="inline-flex items-center gap-2 border-2 border-border bg-card px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary">
              Read The Hobbit Article →
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
