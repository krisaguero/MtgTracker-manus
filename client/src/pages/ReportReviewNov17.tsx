import { ArrowLeft, CheckCircle2, CircleAlert, ExternalLink, History, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';

const metrics = [
  ['Prediction records', '158'],
  ['Evaluated outcomes', '45'],
  ['Unresolved outcomes', '113'],
  ['Directional accuracy', '31.11%'],
  ['Up-call precision', '35.48%'],
  ['Rise recall', '55.00%'],
];
const evidenceCards = [
  ['Academy Ruins', 'Artifact recursion / floor test'],
  ['Foundry Inspector', 'Cross-deck curve support'],
  ['Windcrag Siege', 'Klingon Fury trigger watch'],
  ['Open the Way', 'Landing Party land test'],
] as const;

export default function ReportReviewNov17() {
  const dispositions: Array<[string, string, boolean]> = [
    ['Keep', 'The anchor / bridge / upgrade structure, source dates, stock-list cuts, tradeoffs, and quiet-day posture.', true],
    ['Correct', 'Replace the Day 1 claim with an external-report baseline and join prior tracker records before selecting cards.', false],
    ['Hold', 'Leak-driven future-product upgrades, thin-listing ideas, and treatment premiums without verified player demand.', false],
    ['Promote later', 'Only cards with exact printing, documented deck purpose, verified price evidence, and a real collection gap.', true],
  ];
  return <main className="container py-6 sm:py-10">
    <Link href="/market-desk" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Market Desk</Link>
    <header className="mt-5 border-2 border-primary bg-primary/5 p-5 sm:p-8"><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Source review · November 17, 2026</p><h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">The report is useful. Its baseline is not.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">This review compares the pasted Precon Upgrade Radar with the tracker’s existing history before allowing any signal into the action queue.</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/market-desk/post-launch/star-trek" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Open execution desk <ExternalLink className="h-4 w-4" /></Link><Link href="/market-signal-audit" className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold">Open prediction audit</Link></div></header>
    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value]) => <div key={label} className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black text-primary">{value}</p></div>)}</section>
    <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Visual evidence strip</p><h2 className="mt-2 text-2xl font-black">Cards under review.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">These are visual anchors from the connected post-launch desk, not confirmed market winners. Exact printing, price direction, and deck fit remain separate review fields.</p></div><Link href="/market-desk/post-launch/star-trek" className="text-sm font-bold text-primary underline">Open full desk</Link></div><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{evidenceCards.map(([name, label]) => <Link key={name} href={`/card/${encodeURIComponent(name)}`} className="group border-2 border-border bg-background p-2 hover:border-primary"><img src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`} alt={`${name} card frame`} loading="lazy" className="aspect-[5/7] w-full object-cover" /><span className="mt-2 block text-sm font-black group-hover:text-primary">{name}</span><span className="mt-1 block font-mono text-[9px] uppercase text-muted-foreground">{label}</span></Link>)}</div></section>
    <section className="mt-6 grid gap-5 lg:grid-cols-2"><article className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-start gap-3"><History className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Continuity correction</p><h2 className="mt-2 text-2xl font-black">Not a tracker Day 1.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">The pasted report describes itself as a first baseline, but the tracker already has prediction records, Journal records, daily snapshots, and Star Trek-specific market artifacts. Treat it as an external-report baseline with an incomplete history join.</p></div></div></article><article className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-start gap-3"><ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-amber-700" /><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-700">Promotion gate</p><h2 className="mt-2 text-2xl font-black">Research Watch first.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Named cards remain provisional until exact printing, current price, prior thesis, deck route, floor status, and owned/reserved/missing quantities are joined.</p></div></div></article></section>
    <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Disposition</p><h2 className="mt-2 text-2xl font-black">What happens next</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{dispositions.map(([title, text, positive]) => <div key={title} className="border border-border p-4"><div className="flex items-center gap-2">{positive ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <CircleAlert className="h-4 w-4 text-amber-700" />}<strong>{title}</strong></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></section>
    <p className="mt-6 border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">This is hobby research and deck-building commentary, not financial advice. Price direction and deck usefulness are scored separately.</p>
  </main>;
}
