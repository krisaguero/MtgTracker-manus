import React, { useState } from "react";
import { BarChart3, CalendarDays, ChevronRight, Clock3, Newspaper, ShieldCheck, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import backlogData from "@/data/marketWatchBacklog.json";
import ledgerData from "@/data/marketPredictionLedger.json";

type CardSignal = {
  name: string;
  setCode: string;
  currentUsd: number | null;
  percentChange: number;
  category: string;
  action: string;
  thesis: string;
};
type WeeklyDesk = { week: string; label: string; posts: number; cards: CardSignal[] };
type DailyPost = { dateKey: string; title: string; label: string; slug: string; kind: string; summary: string; cards: CardSignal[]; fullCardCount: number };

type TabKey = "weekly" | "biweekly" | "accuracy" | "history";
const backlog = backlogData as { weekly: WeeklyDesk[]; dailyPosts: DailyPost[]; generatedAt: string };
const ledger = ledgerData as { records: Array<{ name: string; dateKey: string; outcome?: { correct?: boolean } | null; prediction?: { expectedDirection?: string } | null }> };

const tabs: Array<{ key: TabKey; label: string; kicker: string }> = [
  { key: "weekly", label: "Weekly desks", kicker: "Roll-ups" },
  { key: "biweekly", label: "Biweekly Top 10", kicker: "Ranked watchlist" },
  { key: "accuracy", label: "Accuracy review", kicker: "Prediction ledger" },
  { key: "history", label: "Historical reports", kicker: "Evidence archive" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}
function actionLabel(value: string) {
  return value.replaceAll("_", " ");
}
function CardLine({ card, rank }: { card: CardSignal; rank?: number }) {
  const positive = card.percentChange >= 0;
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-t border-border py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {rank !== undefined && <span className="font-mono text-xs font-black text-primary">#{rank}</span>}
          <Link href={`/card/${encodeURIComponent(card.name)}`} className="truncate font-black hover:text-primary">{card.name}</Link>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] uppercase text-muted-foreground">{card.setCode} · {card.category} · {actionLabel(card.action)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-mono text-sm font-black ${positive ? "text-emerald-600" : "text-destructive"}`}>{positive ? "+" : ""}{card.percentChange.toFixed(1)}%</p>
        <p className="font-mono text-[10px] text-muted-foreground">{card.currentUsd === null ? "price unverified" : `$${card.currentUsd.toFixed(2)}`}</p>
      </div>
    </div>
  );
}

function DeskCard({ desk }: { desk: WeeklyDesk }) {
  return (
    <article className="border-2 border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">{desk.label}</p>
          <h2 className="mt-2 text-2xl font-black">Weekly market desk</h2>
          <p className="mt-2 text-sm text-muted-foreground">{desk.posts} daily research post{desk.posts === 1 ? "" : "s"} consolidated into a ranked review layer.</p>
        </div>
        <Link href={`/blog/market-week-${desk.week}`} className="inline-flex items-center gap-1 border border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">Read desk <ChevronRight className="h-3 w-3" /></Link>
      </div>
      <div className="mt-2">{desk.cards.slice(0, 5).map((card, index) => <CardLine key={`${desk.week}-${card.setCode}-${card.name}`} card={card} rank={index + 1} />)}</div>
    </article>
  );
}

function WeeklyPanel() {
  return <section className="grid gap-5 lg:grid-cols-2" aria-label="Weekly market desks">{backlog.weekly.map(desk => <DeskCard key={desk.week} desk={desk} />)}</section>;
}

function BiweeklyPanel() {
  const posts = backlog.dailyPosts.filter(post => post.kind === "biweekly-top-10");
  return <section aria-label="Biweekly Top 10 watchlists" className="space-y-5">{posts.length === 0 ? <EmptyState text="No biweekly Top 10 watchlist has been generated yet." /> : posts.map(post => <article key={post.dateKey} className="border-2 border-primary/50 bg-primary/5 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Biweekly cycle · {formatDate(post.dateKey)}</p><h2 className="mt-2 text-2xl font-black">{post.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{post.summary}</p></div><Link href={`/market-watch?date=${post.dateKey}&desk=${post.slug}`} className="inline-flex items-center gap-1 border border-primary/50 bg-background px-3 py-2 font-mono text-[10px] font-black uppercase text-primary hover:border-primary">Open source desk <ChevronRight className="h-3 w-3" /></Link></div><div className="mt-3">{post.cards.slice(0, 10).map((card, index) => <CardLine key={`${post.dateKey}-${card.setCode}-${card.name}`} card={card} rank={index + 1} />)}</div></article>)}</section>;
}

function AccuracyPanel() {
  const evaluated = ledger.records.filter(record => record.outcome?.correct !== undefined);
  const correct = evaluated.filter(record => record.outcome?.correct).length;
  const pending = ledger.records.length - evaluated.length;
  const accuracy = evaluated.length ? Math.round((correct / evaluated.length) * 100) : null;
  const recent = [...ledger.records].sort((a, b) => b.dateKey.localeCompare(a.dateKey)).slice(0, 12);
  return <section className="space-y-5" aria-label="Prediction accuracy review"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Tracked calls" value={String(ledger.records.length)} /><Metric label="Evaluated" value={String(evaluated.length)} /><Metric label="Directional accuracy" value={accuracy === null ? "Pending" : `${accuracy}%`} /></div><div className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="text-2xl font-black">Forecast review, not performance theater</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Calls stay unresolved until the exact printing and evaluation window are available. Pending calls are shown separately so the accuracy rate cannot be inflated by silently dropping misses.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-border p-3"><p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Correct</p><p className="mt-1 text-2xl font-black text-emerald-600">{correct}</p></div><div className="border border-border p-3"><p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Incorrect</p><p className="mt-1 text-2xl font-black text-destructive">{Math.max(0, evaluated.length - correct)}</p></div><div className="border border-border p-3"><p className="font-mono text-[10px] font-black uppercase text-muted-foreground">Pending</p><p className="mt-1 text-2xl font-black">{pending}</p></div></div><Link href="/market-signal-audit" className="mt-5 inline-flex items-center gap-2 font-mono text-xs font-black uppercase text-primary hover:underline">Open full signal audit <ChevronRight className="h-4 w-4" /></Link></div><div className="border-2 border-border bg-card p-5 sm:p-7"><h2 className="text-xl font-black">Recent calls</h2><div className="mt-2">{recent.map((record, index) => <div key={`${record.dateKey}-${record.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4"><div><p className="font-black">{record.name}</p><p className="font-mono text-[10px] uppercase text-muted-foreground">{formatDate(record.dateKey)} · {record.prediction?.expectedDirection || "direction unresolved"}</p></div><span className="font-mono text-[10px] font-black uppercase text-muted-foreground">{record.outcome?.correct === undefined ? "pending review" : record.outcome.correct ? "correct" : "incorrect"}</span></div>)}</div></div></section>;
}

function HistoryPanel() {
  const posts = [...backlog.dailyPosts].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return <section aria-label="Historical market reports" className="space-y-4"><div className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-start gap-3"><Newspaper className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="text-2xl font-black">Daily evidence archive</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">These are preserved source-date records from the scanner. They are useful for backtesting and context, but they are not automatically current recommendations.</p></div></div></div>{posts.map(post => <Link key={post.dateKey} href={`/market-watch?date=${post.dateKey}&desk=${post.slug}`} className="block border-2 border-border bg-card p-5 hover:border-primary"><div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase text-primary"><CalendarDays className="h-4 w-4" />{formatDate(post.dateKey)}</span><span className="font-mono text-[10px] uppercase text-muted-foreground">{post.cards.length} surfaced · {post.fullCardCount} screened</span></div><h3 className="mt-3 text-xl font-black">{post.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.summary}</p></Link>)}</section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border-2 border-border bg-card p-5"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black text-primary">{value}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="border-2 border-dashed border-border p-8 text-sm text-muted-foreground">{text}</div>; }

export default function MarketDesk() {
  const [location] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : location.split("?")[1] || "";
  const initial = new URLSearchParams(search).get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(tabs.some(tab => tab.key === initial) ? initial as TabKey : "weekly");
  const selectTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") window.history.replaceState({}, "", `/market-desk?tab=${tab}`);
  };
  const panel = activeTab === "weekly" ? <WeeklyPanel /> : activeTab === "biweekly" ? <BiweeklyPanel /> : activeTab === "accuracy" ? <AccuracyPanel /> : <HistoryPanel />;
  return <div className="min-h-screen bg-background text-foreground"><header className="border-b-2 border-border bg-card"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><Link href="/market-watch" className="font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline">← Market Watch terminal</Link><p className="mt-7 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Market intelligence index</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">Market Desk</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">One deliberate entry point for the weekly read, biweekly watchlist, forecast review, and historical evidence—without making the journal carry market navigation.</p></div><BarChart3 className="h-12 w-12 text-primary" /></div><div className="mt-6 flex flex-wrap gap-2"><Link href="/movers" className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">Current movers</Link><Link href="/market-watch" className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">Research terminal</Link><span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase text-muted-foreground">Updated {formatDate(backlog.generatedAt.slice(0, 10))}</span></div></div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-8"><nav className="grid gap-2 border-2 border-border bg-card p-2 sm:grid-cols-4" aria-label="Market Desk sections">{tabs.map(tab => <button key={tab.key} type="button" onClick={() => selectTab(tab.key)} className={`min-h-16 border-2 px-3 py-3 text-left transition-colors ${activeTab === tab.key ? "border-primary bg-primary text-primary-foreground" : "border-transparent hover:border-primary"}`} aria-pressed={activeTab === tab.key}><span className="block font-mono text-[10px] font-black uppercase tracking-widest opacity-75">{tab.kicker}</span><span className="mt-1 block text-sm font-black">{tab.label}</span></button>)}</nav><div className="mt-8">{panel}</div><footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t-2 border-border pt-5 font-mono text-[10px] uppercase text-muted-foreground"><span className="inline-flex items-center gap-2"><Clock3 className="h-3 w-3" /> Generated from committed research artifacts</span><span className="inline-flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Verify exact printings before acting</span></footer></main></div>;
}
