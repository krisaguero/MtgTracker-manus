import { useMemo } from 'react';
import { Link } from 'wouter';
import { Archive, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';
import { InternalPageNav } from '@/components/InternalPageNav';
import { loadSavedReports } from '@/lib/latestMarketTextWallEngine';

export default function LatestMarketReport() {
  const savedEntryCount = useMemo(() => loadSavedReports().length, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <InternalPageNav active="/latest-market-report" />
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          <Link href="/market-watch" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Source-dated Market Watch</Link>
          <div className="mt-8 inline-flex items-center gap-2 border-2 border-amber-500 bg-amber-500/10 px-3 py-1 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300"><ShieldAlert className="h-4 w-4" /> Source verification required</div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">The morning market scan is paused</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">This legacy route did not verify a live multi-vendor feed before assigning a new report date to embedded sample movements. Its live ticker, percentage changes, sellout alerts, and “publish” control are disabled so sample values are not mistaken for fresh market evidence.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
        <section role="note" className="border-2 border-amber-500/60 bg-amber-500/10 p-5 sm:p-7">
          <p className="font-mono text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-300">No current quotes or personal sellout signals</p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">No new report is generated here. Existing browser-local Morning Feed entries, if any, are left untouched but are not shown or exported because their underlying source dates and provider values have not been verified. No collection data was sent or changed by this notice.</p>
          <p className="mt-3 font-mono text-xs text-muted-foreground">Previously stored local entries: {savedEntryCount}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link href="/market-watch" className="group border-2 border-border bg-card p-5 transition-colors hover:border-primary sm:p-7">
            <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary"><Archive className="h-4 w-4" /> Dated research archive</div>
            <h2 className="mt-3 text-2xl font-black group-hover:text-primary">Open Market Watch</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Read the static report and signal snapshot with stated dates, exact-printing coverage, and source links.</p>
          </Link>
          <Link href="/commander-market" className="group border-2 border-border bg-card p-5 transition-colors hover:border-primary sm:p-7">
            <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary"><ExternalLink className="h-4 w-4" /> Source-backed price index</div>
            <h2 className="mt-3 text-2xl font-black group-hover:text-primary">Open Commander demand index</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Check the MTGJSON quote date, USD coverage, and the separate EDHREC demand snapshot.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
