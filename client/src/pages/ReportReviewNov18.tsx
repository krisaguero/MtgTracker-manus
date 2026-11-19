import { ArrowLeft, ExternalLink, ShieldAlert, ShoppingCart } from 'lucide-react';
import { Link } from 'wouter';
import MarketMoverCardArt from '@/components/MarketMoverCardArt';

type Candidate = {
  name: string;
  deck: string;
  deckHref: string;
  action: string;
  status: 'developing' | 'mechanically-supported' | 'unverified';
  note: string;
};

const candidates: Candidate[] = [
  {
    name: 'Academy Ruins',
    deck: 'We Are the Borg',
    deckHref: '/deck/eoc/we-are-the-borg',
    action: 'Refresh exact printing',
    status: 'developing',
    note: 'The report claims a new lower observation; the existing desk baseline stays unchanged until the printing and price measure are joined.',
  },
  {
    name: 'World at War',
    deck: 'Klingon Fury',
    deckHref: '/deck/eoc/klingon-fury',
    action: 'Bundle if confirmed',
    status: 'developing',
    note: 'Strong play-fit candidate for extra combats, but the pasted set identifier needs reconciliation before entering the basket.',
  },
  {
    name: 'Windcrag Siege',
    deck: 'Klingon Fury',
    deckHref: '/deck/eoc/klingon-fury',
    action: 'Buy for play only',
    status: 'mechanically-supported',
    note: 'A narrow deck upgrade rather than a broad market mover. Keep it out of the primary mover stream.',
  },
  {
    name: 'Etherium Sculptor',
    deck: 'We Are the Borg',
    deckHref: '/deck/eoc/we-are-the-borg',
    action: 'Reserve-owned first',
    status: 'mechanically-supported',
    note: 'Portable artifact curve support. Deduct copies already allocated to Borg or another artifact deck before buying.',
  },
  {
    name: 'Orb of the Emissary - Alhammarret\'s Archive',
    deck: 'Federation Fleet',
    deckHref: '/deck/eoc/federation-fleet',
    action: 'Watch / bundle',
    status: 'developing',
    note: 'Potentially useful below the budget ceiling, but the reported listing and market prices are not yet a verified checkout quote.',
  },
];

const statusLabel: Record<Candidate['status'], string> = {
  developing: 'Developing',
  'mechanically-supported': 'Deck fit supported',
  unverified: 'Unverified',
};

export default function ReportReviewNov18() {
  return (
    <main className="container py-6 sm:py-10">
      <Link href="/market-desk" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Market Desk
      </Link>
      <header className="mt-5 border-2 border-primary bg-primary/5 p-5 sm:p-8">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Source review · November 18, 2026</p>
        <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">Useful radar. No automatic promotion.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          This external radar adds a few promising Star Trek bundle candidates, but its newer prices and set identifiers are not yet reconciled with the tracker. Existing baselines remain intact.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/market-desk/post-launch/star-trek" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            Open execution desk <ExternalLink className="h-4 w-4" />
          </Link>
          <Link href="/market-desk/report-review/2026-11-17" className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold">
            Compare Nov. 17 review
          </Link>
        </div>
      </header>

      <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Review summary">
        <div className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">New candidates</p><p className="mt-2 text-2xl font-black text-primary">5</p><p className="mt-1 text-xs text-muted-foreground">Kept in a compact watch lane</p></div>
        <div className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price updates</p><p className="mt-2 text-2xl font-black text-primary">Pending</p><p className="mt-1 text-xs text-muted-foreground">Exact printing refresh required</p></div>
        <div className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">New purchases</p><p className="mt-2 text-2xl font-black text-primary">0</p><p className="mt-1 text-xs text-muted-foreground">No unverified checkout totals</p></div>
      </section>

      <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-700">Promotion gate</p>
            <h2 className="mt-2 text-2xl font-black">Do not overwrite the launch baselines.</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">The report’s listing, market, and median prices are preserved as external observations. They become actionable only after set code, collector number, finish, seller depth, and current collection gaps are confirmed.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Compact action lane</p><h2 className="mt-2 text-2xl font-black">Bundle candidates, not market calls.</h2></div>
          <ShoppingCart className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-4 divide-y divide-border">
          {candidates.map((candidate) => (
            <article key={candidate.name} className="grid gap-4 py-5 md:grid-cols-[auto_1fr_auto] md:items-start">
              <MarketMoverCardArt name={candidate.name} size="small" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><Link href={`/card/${encodeURIComponent(candidate.name)}`} className="font-black text-primary underline">{candidate.name}</Link><span className="border border-border px-2 py-1 font-mono text-[9px] font-black uppercase text-muted-foreground">{statusLabel[candidate.status]}</span></div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{candidate.deck}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{candidate.note}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end"><span className="border border-primary/40 bg-primary/5 px-2 py-1 font-mono text-[10px] font-black uppercase text-primary">{candidate.action}</span><Link href={candidate.deckHref} className="text-xs font-bold text-primary underline">Open deck</Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
        <strong className="text-foreground">Next refresh:</strong> resolve exact printings, refresh current prices and seller depth, then deduct owned and reserved copies before adding anything to the Star Trek basket. Nauctis sea-monster purchases remain on hold until official decklists are available.
      </section>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">This is hobby research and deck-building commentary, not financial advice. Verify condition, printing, fees, shipping, and completed-sale evidence before buying.</p>
    </main>
  );
}
