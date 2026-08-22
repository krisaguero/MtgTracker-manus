import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Bell, Calendar, ExternalLink, Flame, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadSavedReports, generateLatestMarketReport, computeSelloutQueueMatches, type DailyMarketReportArchive, type SelloutQueueMatch } from '@/lib/latestMarketTextWallEngine';
import { loadOwnedCollection } from '@/lib/manaboxParser';

export default function LatestMarketReport() {
  const [reports, setReports] = useState<DailyMarketReportArchive[]>(() => loadSavedReports());
  const [selectedDate, setSelectedDate] = useState<string>(() => reports[0]?.dateKey || '');
  const [copiedText, setCopiedText] = useState(false);

  const activeReport = useMemo(() => {
    return reports.find((r) => r.dateKey === selectedDate) || reports[0] || generateLatestMarketReport();
  }, [reports, selectedDate]);

  const selloutMatches = useMemo(() => computeSelloutQueueMatches(), []);

  const handleRunMorningRefresh = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newReport = generateLatestMarketReport(today);
    setReports((prev) => {
      const filtered = prev.filter((r) => r.dateKey !== today);
      const updated = [newReport, ...filtered];
      return updated;
    });
    setSelectedDate(today);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Header / Navigation */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container py-3 flex items-center justify-between">
          <Link href="/movers" className="inline-flex items-center gap-2 font-mono text-xs uppercase hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Daily Movers
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground uppercase">
            <span className="text-primary font-bold">Automated Morning Feed</span>
            <span>·</span>
            <span>Backed-Up Daily Blog</span>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-10">
        {/* Hero Title & Morning Refresh Trigger */}
        <div className="border-2 border-border bg-card p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 border-2 border-primary bg-primary/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
              <Flame className="h-4 w-4 text-primary" /> Morning Market Intel &amp; Stock Ticker
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{activeReport.headline}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Consolidated multi-outlet pricing intelligence (TCGplayer, Card Kingdom, MTGGoldfish) structured as an institutional text wall and backed up daily as a shorthand blog digest.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button onClick={handleRunMorningRefresh} className="gap-2 font-mono text-xs uppercase font-bold">
              <Sparkles className="h-4 w-4" /> Run Morning Scan &amp; Publish
            </Button>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-border bg-background px-3 py-2 font-mono text-xs uppercase focus:outline-none focus:border-primary"
            >
              {reports.map((rep) => (
                <option key={rep.dateKey} value={rep.dateKey}>
                  {rep.dateKey} {rep.dateKey === new Date().toISOString().slice(0, 10) ? '(Today)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sellout Queue Alert Banner for Owned Cards */}
        {selloutMatches.length > 0 && (
          <div className="border-2 border-amber-500/50 bg-amber-500/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-500 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-amber-400 uppercase tracking-wide">Sellout Queue Alert: Owned Cards Matching Spikes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You hold {selloutMatches.length} card(s) in your ManaBox collection currently experiencing abnormal buyout or price momentum. Review for potential exit or buylist arbitrage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {selloutMatches.map((match) => (
                <div key={match.cardName} className="border-2 border-border bg-background p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 font-bold">
                        Owned: {match.ownedQuantity}x
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-400">+</span>
                    </div>
                    <Link href={`/card/${encodeURIComponent(match.cardName)}`} className="font-bold text-sm hover:text-primary block line-clamp-1">
                      {match.cardName}
                    </Link>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase">{match.setCode.toUpperCase()} · Category: {match.category}</p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-xs">
                    <span className="text-primary font-bold">${match.marketPrice.toFixed(2)}</span>
                    <span className="text-emerald-400 font-bold">+{match.percentChange}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid: Stock Text Wall & Shorthand Blog Post */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Stock Text Wall (Left 8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border-2 border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b-2 border-border pb-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary">
                  <TrendingUp className="h-4 w-4" /> Live Stock Ticker &amp; Macro Breakdown
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(activeReport.stockTextWall);
                    setCopiedText(true);
                    window.setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="border-2 border-border bg-background px-3 py-1 font-mono text-xs uppercase hover:border-primary transition-colors"
                >
                  {copiedText ? 'Copied Text Wall' : 'Copy Text Wall'}
                </button>
              </div>

              <div className="font-mono text-xs sm:text-sm bg-black/60 text-emerald-400 p-6 border border-border whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {activeReport.stockTextWall}
              </div>
            </div>
          </div>

          {/* Shorthand Blog Post & Top Movers Sidebar (Right 4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border-2 border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-3">
                <Calendar className="h-4 w-4" /> Shorthand Blog Archive
              </div>
              <div className="prose prose-invert text-sm space-y-3 leading-relaxed">
                <h3 className="font-bold text-base">{activeReport.headline}</h3>
                <p className="text-xs text-muted-foreground">Generated at: {new Date(activeReport.generatedAt).toLocaleString()}</p>
                <div className="border-t border-border pt-3 font-mono text-xs space-y-2 text-muted-foreground whitespace-pre-wrap">
                  {activeReport.shorthandBreakdown}
                </div>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-6 space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-3">
                Top Session Gainers
              </h3>
              <div className="space-y-3">
                {activeReport.topMovers.slice(0, 6).map((mover, idx) => (
                  <div key={mover.name} className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="space-y-0.5 max-w-[180px]">
                      <span className="font-mono text-[10px] text-muted-foreground block">{idx + 1}. {mover.setCode.toUpperCase()}</span>
                      <Link href={`/card/${encodeURIComponent(mover.name)}`} className="font-bold text-xs hover:text-primary truncate block">
                        {mover.name}
                      </Link>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="font-bold text-primary block">${mover.price.toFixed(2)}</span>
                      <span className="text-emerald-400 text-[10px]">+{mover.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
