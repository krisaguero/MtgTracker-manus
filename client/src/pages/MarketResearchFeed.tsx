import { ArrowLeft, CalendarDays, ExternalLink, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import rawFeed from '@/data/marketResearchFeed.json';
import rawLedger from '@/data/marketPredictionLedger.json';
import { MarketCardPreview } from '@/components/MarketCardPreview';

type FeedCard = {
  rank: number;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string | null;
  currentUsd: number | null;
  previousUsd: number | null;
  percentChange: number;
  category: string;
  sourceCount: number;
  confidence: string;
  action: string;
  thesis: string;
  risk: string;
  verifiedAt: string;
  prediction?: { expectedDirection: string; projectedPctRange: number[]; evaluationDate: string; model: string };
};
type FeedPost = {
  id: string;
  dateKey: string;
  slug: string;
  title: string;
  label: string;
  kind: string;
  dataWindow: string;
  generatedAt: string;
  summary: string;
  body: string[];
  cards: FeedCard[];
  sources: string[];
  methodology: string;
  marketStatus: string;
  disclaimer: string;
};
const feed = rawFeed as { posts: FeedPost[]; schedule: { daily: string; topicExpansion: string; biweeklyTop10: string } };
const ledger = rawLedger as { records: Array<{ outcome?: { correct?: boolean } | null; prediction?: { expectedDirection: string }; name: string; dateKey: string }> };
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)); }
function actionLabel(action: string) { return action.replaceAll('_', ' '); }
function cardHref(name: string) { return `/card/${encodeURIComponent(name)}`; }

function FeedCardView({ card }: { card: FeedCard }) {
  const rising = card.percentChange >= 0;
  return <article className="border-2 border-border bg-card p-4 sm:p-5">
    <div className="flex items-start gap-4">
      <div className="shrink-0"><MarketCardPreview name={card.name} setCode={card.setCode} size="md" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><p className="font-mono text-xs font-black text-primary">#{card.rank} · {card.setCode.toUpperCase()}</p><Link href={cardHref(card.name)} className="mt-1 block text-lg font-black leading-tight hover:text-primary">{card.name}</Link><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{card.setName} · {card.collectorNumber || 'printing unresolved'}</p></div>
          <span className={`inline-flex items-center gap-1 font-mono text-xs font-black ${rising ? 'text-emerald-600' : 'text-destructive'}`}>{rising ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{rising ? '+' : ''}{card.percentChange.toFixed(1)}%</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] font-bold uppercase"><span className="border border-primary/40 bg-primary/5 px-2 py-1 text-primary">{actionLabel(card.action)}</span><span className="border border-border px-2 py-1 text-muted-foreground">{card.confidence}</span><span className="border border-border px-2 py-1 text-muted-foreground">{card.category}</span></div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.thesis}</p>
        <p className="mt-3 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Risk:</strong> {card.risk}</p>
        {card.prediction && <p className="mt-3 border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">14-day guess:</strong> {card.prediction.expectedDirection.replaceAll('_', ' ')} ({card.prediction.projectedPctRange[0]}% to {card.prediction.projectedPctRange[1]}%). Evaluate {formatDate(card.prediction.evaluationDate)}. <span className="text-[10px] uppercase">{card.prediction.model}</span></p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 font-mono text-[10px] uppercase text-muted-foreground"><span>{card.currentUsd === null ? 'Price unverified' : `$${card.currentUsd.toFixed(2)}`} · {card.sourceCount} source{card.sourceCount === 1 ? '' : 's'}</span><Link href={cardHref(card.name)} className="text-primary hover:underline">Card profile →</Link></div>
      </div>
    </div>
  </article>;
}

export default function MarketResearchFeed() {
  const posts = feed.posts || [];
  const requestedDate = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('date') : null;
  const latest = posts.find((post) => post.dateKey === requestedDate) || posts[0];
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-border bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8"><Link href="/movers" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Market watch</Link><div className="flex flex-wrap gap-2"><Link href="/movers" className="border-2 border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">Live movers</Link><Link href="/market-movers-manus-report" className="border-2 border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">Source post</Link></div></div></header>
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
      <section className="border-2 border-primary bg-primary/5 p-6 sm:p-10"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Recurring market-watch blog feed</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Daily signals, focused desks, and the Top 10 watchlist.</h1><p className="mt-4 max-w-4xl text-base leading-7 text-muted-foreground">A dated research queue generated from the project’s market snapshots. The weekday desk rotates the lens; every other Friday expands into a ranked Top 10 watchlist. Snapshot velocity is a prompt for verification, not a confirmed trade signal.</p><div className="mt-6 grid gap-3 font-mono text-[10px] font-black uppercase sm:grid-cols-3"><span className="border-2 border-border bg-background p-3">Daily · {feed.schedule.daily}</span><span className="border-2 border-border bg-background p-3">Topic · {feed.schedule.topicExpansion}</span><span className="border-2 border-border bg-background p-3">Top 10 · {feed.schedule.biweeklyTop10}</span></div></section>
      {latest && <section className="border-2 border-border bg-card p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary"><CalendarDays className="mr-2 inline h-4 w-4" /> Latest · {formatDate(latest.dateKey)}</p><h2 className="mt-3 text-3xl font-black tracking-tight">{latest.title}</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">{latest.summary}</p></div><span className="border-2 border-amber-500/60 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase text-amber-700">{latest.label}</span></div><div className="mt-6 grid gap-4 lg:grid-cols-2">{latest.cards.map((card) => <FeedCardView key={`${latest.id}-${card.name}-${card.setCode}`} card={card} />)}</div><div className="mt-6 border-t border-border pt-5 text-sm leading-7 text-muted-foreground">{latest.body.map((paragraph) => <p key={paragraph} className="mb-3">{paragraph}</p>)}<p className="flex items-start gap-2 border-t border-border pt-4 font-mono text-[10px] font-bold uppercase"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> {latest.disclaimer}</p></div></section>}
      <section className="grid gap-4 border-2 border-border bg-card p-5 sm:grid-cols-3 sm:p-6"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Prediction ledger</p><p className="mt-2 text-2xl font-black">{ledger.records.length}</p><p className="text-xs text-muted-foreground">prompt-backed picks retained in GitHub</p></div><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Evaluated calls</p><p className="mt-2 text-2xl font-black">{ledger.records.filter((record) => record.outcome?.correct !== undefined).length}</p><p className="text-xs text-muted-foreground">resolved only when an exact printing reappears</p></div><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Accuracy</p><p className="mt-2 text-2xl font-black">{(() => { const evaluated = ledger.records.filter((record) => record.outcome?.correct !== undefined); return evaluated.length ? `${Math.round((evaluated.filter((record) => record.outcome?.correct).length / evaluated.length) * 100)}%` : 'Pending'; })()}</p><p className="text-xs text-muted-foreground">directional score, not investment performance</p></div></section>
      <section><div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-border pb-4"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Dated archive</p><h2 className="mt-2 text-2xl font-black">Previous market-watch expansions</h2></div><span className="font-mono text-xs uppercase text-muted-foreground">{posts.length} posts retained</span></div><div className="grid gap-4 md:grid-cols-2">{posts.slice(1).map((post) => <Link key={post.id} href={`/market-watch?date=${post.dateKey}&desk=${post.slug}`} className="border-2 border-border bg-card p-5 hover:border-primary"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-black uppercase text-primary">{formatDate(post.dateKey)}</span><span className="font-mono text-[10px] uppercase text-muted-foreground">{post.cards.length} cards</span></div><h3 className="mt-3 text-xl font-black">{post.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.summary}</p></Link>)}</div></section>
      <footer className="border-t-2 border-border pt-5 font-mono text-[10px] uppercase text-muted-foreground">Sources: {latest?.sources?.join(' · ') || 'Awaiting next refresh'} <a href="https://scryfall.com" target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline">Verify on Scryfall <ExternalLink className="h-3 w-3" /></a></footer>
    </main>
  </div>;
}
