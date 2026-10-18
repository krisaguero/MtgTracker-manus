import { Link } from 'wouter';
import { MarketPostCard } from '@/components/MarketPostCard';
import { ArrowLeft, ExternalLink, ShieldAlert, Zap, BookOpen } from 'lucide-react';

export function MarketWatchArticle() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/movers" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Dated Movers
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/market-report" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Market Report
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="space-y-8">
          <div className="border-b-2 border-primary pb-6">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <BookOpen className="h-4 w-4" /> Commander Market Watch Research · August 19, 2026
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
              The Hobbit Dwarf Spike Meets a 500-Printing Mover Screen
            </h1>
            <p className="mt-4 text-sm font-mono text-muted-foreground">
              MTG Tracker editorial · Historical data retrieved August 19, 2026 UTC · Source data date August 18, 2026
            </p>
          </div>

          <div className="border-2 border-primary/30 bg-primary/5 p-4 font-mono text-xs">
            <span className="font-bold text-primary uppercase block mb-1">Market-Risk Note</span>
            Historical snapshot: all prices, screening observations, and market language in this article refer to source data dated August 18, 2026, retrieved August 19, 2026 UTC. They are not current quotes. Verify current listings and exact printings before acting. Research only, not personalized financial advice. Card prices are volatile and illiquid; a large percentage move can reflect a handful of changed listings rather than durable player demand.
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-base leading-relaxed">
            <p>
              The first rule of market-watch writing is simple: <strong>a mover is a research prompt, not a trade signal</strong>. In the August 18 snapshot, <em>Magic: The Gathering | The Hobbit</em> was newly released, adding a deep Dwarf-and-Equipment package alongside Human recruit, Elf landfall, and Goblin amass. The dated 500-printing Commander-eligible screen contained a cluster of reported movement in Middle-earth Dwarves, Equipment, token cards, and premium versions of older staples.
            </p>
            <p>
              The practical conclusion is not “buy every Dwarf.” It is that Commander players have a real new tribal reason to revisit a small group of old cards, while collectors should distinguish <strong>mechanically supported demand</strong> from a one-printing price anomaly.
            </p>

            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">What the 500-Printing Screen Actually Measures</h2>
            <p>
              The screen begins with the public MTGStocks <code>average/regular</code> Interests feed dated <strong>August 18, 2026</strong>. It returned 7,254 records. We removed art-series entries and non-tournament-playable cards, retained Commander-legal printings, removed repeated day/week entries, and took the first <strong>500 distinct printings</strong> in the source’s order. This yielded 5,877 eligible source records before the 500-printing cut. The source does not document that order as a formal “top 500” ranking, so this is properly described as a <strong>500-printing mover screen</strong>, not an independently ranked 500-card leaderboard.
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full text-left border-2 border-border font-mono text-xs">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="p-3">Screen Statistic</th>
                    <th className="p-3 text-right">Result</th>
                    <th className="p-3">Why It Matters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-bold">Raw source records</td>
                    <td className="p-3 text-right">7,254</td>
                    <td className="p-3 text-muted-foreground">Shows the feed is broader than the published screen.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Commander-eligible records</td>
                    <td className="p-3 text-right">5,877</td>
                    <td className="p-3 text-muted-foreground">Removes non-game pieces such as art cards.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Distinct printings in screen</td>
                    <td className="p-3 text-right">500</td>
                    <td className="p-3 text-muted-foreground">Delivers the requested 500-card universe without day/week duplicates.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">The Hobbit printings in screen</td>
                    <td className="p-3 text-right">78</td>
                    <td className="p-3 text-muted-foreground">The release appeared in 78 printings in the August 18, 2026 source screen.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">Signals in the Historical Screen</h2>
            <p>
              The most persuasive market data points are not isolated cards; they are cards that share a coherent deckbuilding story. The <em>Hobbit</em> Dwarf package provides that story. Wizards describes storied as rewarding a player who controls a storied permanent plus three artifacts, legendary permanents, and/or Sagas. The set also pushes Equipment through hone counters and Dwarves through token and artifact incentives.
            </p>

            <h3 className="text-xl font-bold pt-2">The Eight-Card Niche Watchlist</h3>
            <p>
              The August 18 screen changes the emphasis of the original Dwarf thesis. Premium Middle-earth cards appeared in that dated snapshot, so the research question is no longer “Which premium Hobbit card should spike?” It is “Which older, low-supply support card had a fresh use case and had not been fully repriced in that source window?”
            </p>

            <div className="space-y-4 pt-2">
              <MarketPostCard name="Dwarven Recruiter" sourceDate="2026-08-18" kicker="Historical niche watchlist">
                <p className="text-sm leading-6 text-muted-foreground">Stacks any number of Dwarves; the new tribe now has far more named targets and payoff density. Two printings; August 18 Scryfall USD reference $10.56, foil $76.39.</p>
              </MarketPostCard>
              <MarketPostCard name="Dwarven Bloodboiler" sourceDate="2026-08-18" kicker="Historical niche watchlist">
                <p className="text-sm leading-6 text-muted-foreground">Converts spare Dwarves into combat power, with token-producing Dwarves giving it more board presence. Two printings; Judgment foil reference $120.13.</p>
              </MarketPostCard>
              <MarketPostCard name="Reyav, Master Smith" sourceDate="2026-08-18" kicker="Historical niche watchlist">
                <p className="text-sm leading-6 text-muted-foreground">Grants double strike to attacking equipped creatures; fits Dwarf Equipment and hone counters cleanly. Eight printings; budget entry under $0.25.</p>
              </MarketPostCard>
              <MarketPostCard name="Glóin, Dwarf Emissary" sourceDate="2026-08-18" kicker="Historical niche watchlist">
                <p className="text-sm leading-6 text-muted-foreground">Historic-spell Treasure making shares storied’s artifacts, legends, and Sagas building blocks. Five printings.</p>
              </MarketPostCard>
            </div>

            <h2 className="text-2xl font-bold tracking-tight pt-4 border-t border-border">Method and Disclosure</h2>
            <p>
              <strong>Basis.</strong> The article uses official Wizards product and format announcements, Scryfall Oracle text and reference-price fields, and the MTGStocks public <code>average/regular</code> Interests feed.
            </p>
            <p>
              <strong>Time.</strong> The mover feed was dated <strong>August 18, 2026</strong> and retrieved <strong>August 19, 2026 UTC</strong>.
            </p>
          </div>

          <div className="border-t-2 border-border pt-6 mt-12">
            <Link href="/movers" className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90">
              ← Return to Dated Movers Hub
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
