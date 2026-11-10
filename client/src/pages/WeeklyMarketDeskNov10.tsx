import { ArrowLeft, CalendarDays, Filter, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { MarketMoverCardArt } from "@/components/MarketMoverCardArt";
import { CardIndexLink } from "@/components/CardIndexLink";
import feed from "@/data/marketResearchFeed.json";

type FeedCard = {
  name: string;
  setCode: string;
  setName?: string;
  collectorNumber?: string;
  currentUsd?: number;
  previousUsd?: number;
  percentChange?: number;
  category?: string;
  sourceCount?: number;
  confidence?: string;
  action?: string;
  thesis?: string;
  risk?: string;
  verifiedAt?: string;
};

type WeeklyCard = FeedCard & { dates: string[]; appearances: number };

const startDate = "2026-11-01";
const endDate = "2026-11-07";
const dailyPosts = feed.posts.filter(post => post.dateKey >= startDate && post.dateKey <= endDate);
const cardMap = new Map<string, WeeklyCard>();
for (const post of dailyPosts) {
  for (const card of (post.cards as FeedCard[])) {
    const key = `${card.name.toLowerCase()}|${card.setCode}|${card.collectorNumber || ""}`;
    const existing = cardMap.get(key);
    if (existing) {
      existing.appearances += 1;
      if (!existing.dates.includes(post.dateKey)) existing.dates.push(post.dateKey);
      if ((card.percentChange ?? 0) > (existing.percentChange ?? 0)) Object.assign(existing, card);
    } else {
      cardMap.set(key, { ...card, dates: [post.dateKey], appearances: 1 });
    }
  }
}
const weeklyCards = Array.from(cardMap.values()).sort((a, b) => Math.abs(b.percentChange ?? 0) - Math.abs(a.percentChange ?? 0));

function money(value?: number) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : "Unverified";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00Z`));
}

function WeeklyCard({ card }: { card: WeeklyCard }) {
  const positive = (card.percentChange ?? 0) >= 0;
  return (
    <article className="border-2 border-border bg-card p-3 sm:p-4">
      <MarketMoverCardArt name={card.name} setCode={card.setCode} collectorNumber={card.collectorNumber} size="small" className="mx-auto h-48 w-32 sm:h-56 sm:w-36" />
      <div className="mt-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-black leading-5">{card.name}</h3>
          <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">{card.setCode} · #{card.collectorNumber || "n/a"}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 font-mono text-xs font-black ${positive ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}>
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {typeof card.percentChange === "number" ? `${card.percentChange > 0 ? "+" : ""}${card.percentChange.toFixed(1)}%` : "n/a"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-y border-border py-2 font-mono text-[10px]">
        <span>{money(card.currentUsd)} now</span>
        <span className="text-right text-muted-foreground">{card.appearances} report{card.appearances === 1 ? "" : "s"}</span>
      </div>
      <p className="mt-3 text-xs leading-5"><strong>Why highlighted:</strong> {card.thesis || "Snapshot-derived movement qualified for the weekly desk."}</p>
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground"><strong className="text-foreground">Risk:</strong> {card.risk || "Verify liquidity, exact printing, and completed sales before acting."}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="border border-border px-2 py-1 font-mono text-[9px] font-bold uppercase text-muted-foreground">{card.confidence || "Unverified"}</span>
        <span className="border border-border px-2 py-1 font-mono text-[9px] uppercase text-muted-foreground">{card.category || "Uncategorized signal"}</span>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">Seen {card.dates.map(dateLabel).join(" · ")}</p>
      <CardIndexLink name={card.name} compact className="mt-3" />
    </article>
  );
}

export function WeeklyMarketDeskNov10() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
          <Link href="/market-reports" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Market Desk archive</Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" /> Week ending November 7, 2026</p>
              <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Weekly Market Desk · every mover, one useful read</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">A visual consolidation of the daily mover queue. Repeated cards are deduplicated, every surfaced card keeps its reason and risk, and the raw daily records remain available for audit instead of filling the public feed with empty posts.</p>
            </div>
            <span className="border-2 border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground">{weeklyCards.length} unique movers</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] font-black uppercase tracking-wider">
            <span className="border border-border bg-background px-3 py-2">{dailyPosts.length} daily source records</span>
            <span className="border border-border bg-background px-3 py-2">{weeklyCards.filter(card => (card.percentChange ?? 0) > 0).length} gainers</span>
            <span className="border border-border bg-background px-3 py-2">{weeklyCards.filter(card => (card.percentChange ?? 0) < 0).length} decliners</span>
            <span className="border border-border bg-background px-3 py-2">Exact printings preserved</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-8">
        <section className="border-l-4 border-amber-500 bg-amber-500/5 p-4 sm:p-5" role="note">
          <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><Filter className="h-4 w-4" /> Reading rule</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">These are snapshot-derived research signals, not automatic buy calls. A large percentage on a low-dollar card can reflect thin listings or a single source. The highlighted explanation is the reason the card entered the desk; the risk line is the reason to slow down.</p>
        </section>
        <section className="border-2 border-primary/30 bg-primary/5 p-5 sm:p-7">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Cadence reset</p>
          <h2 className="mt-2 text-2xl font-black">Daily data stays backstage; weekly synthesis gets the front page.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">The daily scanner continues to preserve dated observations, predictions, and source metadata. Reader-facing publication now favors one weekly visual desk with all qualifying movers, plus separate focused articles when a product, deck, or collection decision deserves more room.</p>
        </section>
        <section aria-label="All weekly movers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {weeklyCards.map(card => <WeeklyCard key={`${card.name}-${card.setCode}-${card.collectorNumber}`} card={card} />)}
        </section>
        <footer className="border-t-2 border-border pt-5 text-xs leading-5 text-muted-foreground">Source window: daily market research feed entries dated November 1–7, 2026. Card art is representative and sourced through the app’s Scryfall lookup; verify exact finish, condition, listing depth, and completed sales.</footer>
      </main>
    </div>
  );
}
export default WeeklyMarketDeskNov10;
