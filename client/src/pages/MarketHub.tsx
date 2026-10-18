import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'wouter';

const sections = [
  { title: 'Dated price snapshots', intro: 'The imported 250-row mover table is dated 2026-08-25; specialist report desks show their publication date and source limits.', links: [
    ['/movers', 'Imported mover snapshot · Aug 25'], ['/movers/confirmed', 'Imported report · confirmed'], ['/movers/penny', 'Imported report · penny & portable'], ['/movers/buyout-risk', 'Imported report · buyout-risk'], ['/movers/supply-clock', 'Imported report · supply events'],
  ] },
  { title: 'Reports & briefings', intro: 'Browse published market analysis and archived reports.', links: [
    ['/blog', 'Daily prose articles · Blog / Journal (published)'],
    ['/market-report', 'Market report'], ['/market-watch', 'Source-dated Market Watch'], ['/market-reports', 'Report archive'], ['/market-today', 'Historical market brief'], ['/market-movers-manus-report', 'Published mover report'],
  ] },
  { title: 'Research tools & articles', intro: 'Explore watchlists, audits, signal explainers, and featured articles.', links: [
    ['/market-watch', 'Source-dated Market Watch'], ['/market-articles', 'Market deep dives'], ['/market-signal-audit', 'Signal audit'], ['/market-watch-article', 'Historical Market Watch analysis'], ['/signal-matrix-article', 'Featured signal matrix'], ['/costco-deal-article', 'Historical Costco price note'],
  ] },
];

export default function MarketHub() {
  return <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8 sm:py-10"><div className="mx-auto max-w-6xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Home</Link><header className="mt-6 border-b-2 border-primary pb-5"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Market index</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Market research, in one place.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Choose a price-signal view, report archive, or research tool. Snapshot views may be historical; each page should show its data date and coverage.</p></header><div className="mt-6 grid gap-5 lg:grid-cols-3">{sections.map((section) => <section key={section.title} className="border-2 border-border bg-card p-4 sm:p-5"><h2 className="text-lg font-black">{section.title}</h2><p className="mt-1 min-h-12 text-xs leading-5 text-muted-foreground">{section.intro}</p><ul className="mt-3 divide-y divide-border border-y border-border">{section.links.map(([href, label]) => <li key={href}><Link href={href} className="flex min-h-11 items-center justify-between gap-2 py-2 text-sm font-semibold hover:text-primary">{label}<ArrowUpRight className="h-4 w-4 shrink-0" /></Link></li>)}</ul></section>)}</div></div></main>;
}
