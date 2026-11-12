import React, { useState } from "react";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { CardIndexLink } from "@/components/CardIndexLink";
import { MarketMoverCardArt } from "@/components/MarketMoverCardArt";

type Signal = {
  id: string;
  deck: string;
  set: string;
  commander: string;
  posture: "Buy for play" | "Wait for supply" | "Leave alone" | "Watch";
  thesis: string;
  add: string;
  cut: string;
  price: string;
  priceNote: string;
  role: string;
  risk: string;
  sourceUrl: string;
  sourceLabel: string;
};

const signals: Signal[] = [
  {
    id: "borg",
    deck: "We Are the Borg",
    set: "Star Trek · 2026",
    commander: "The Borg Queen",
    posture: "Wait for supply",
    thesis: "The guide gives the deck a useful direction, but the release-week evidence still supports waiting: choose Borg Queen assimilation or Locutus tokens before committing to charge-counter cards.",
    add: "Collation Trimatrix",
    cut: "Korok, Liberated Rage",
    price: "Unverified",
    priceNote: "Nov. 11 guide baseline · no verified quote",
    role: "Token card advantage",
    risk: "The recommendation is a play upgrade, not adoption or price evidence. Confirm final rules text, exact printing, and the released stock list before buying.",
    sourceUrl: "https://edhrec.com/guides/we-are-the-borg-star-trek-precon-guide",
    sourceLabel: "EDHREC We Are the Borg guide",
  },
  {
    id: "legends",
    deck: "Legends' Legacy",
    set: "Dominaria United · 2022",
    commander: "Dihada, Binder of Wills",
    posture: "Buy for play",
    thesis: "A Mardu legendary-creature shell with a clear graveyard bottleneck. Primevals’ Glorious Rebirth converts setup into a high-ceiling recovery turn.",
    add: "Primevals' Glorious Rebirth",
    cut: "Zetalpa, Primal Dawn",
    price: "$2.49",
    priceNote: "Observed Nov. 9 · verified price only",
    role: "Legendary mass reanimation",
    risk: "Seven mana makes the card slow without a stocked graveyard. The win-rate observation is a baseline, not a guarantee of future performance.",
    sourceUrl: "https://edhrec.com/precon/legends-legacy",
    sourceLabel: "EDHREC precon page",
  },
  {
    id: "doom",
    deck: "Doom Prevails",
    set: "Marvel Super Heroes · 2026",
    commander: "Doctor Doom, King of Latveria",
    posture: "Leave alone",
    thesis: "The artifact-and-villain control plan benefits from cheap protection, but the current Lightning Greaves observation is above the project’s budget-upgrade target.",
    add: "Lightning Greaves",
    cut: "Loxodon Warhammer",
    price: "$4.99",
    priceNote: "Observed Nov. 9 · verified price only",
    role: "Zero-equip protection",
    risk: "Shroud can interfere with your own targeted buffs or untap effects. Do not confuse a useful play upgrade with a market buy signal.",
    sourceUrl: "https://edhrec.com/precon/doom-prevails",
    sourceLabel: "EDHREC precon page",
  },
  {
    id: "endless",
    deck: "Endless Punishment",
    set: "Duskmourn · 2024",
    commander: "Valgavoth, Harrower of Souls",
    posture: "Watch",
    thesis: "Spiteful Visions was the most practical reviewed damage-engine swap in the supplied scan, but the move needs a current exact-printing check before buying.",
    add: "Spiteful Visions",
    cut: "Roiling Vortex",
    price: "$2.99",
    priceNote: "Observed Nov. 9 · verified price only",
    role: "Consistent damage",
    risk: "Group-slug effects can accelerate opponents too. Treat the card as a play-pattern choice, not a guaranteed demand thesis.",
    sourceUrl: "https://edhrec.com/precon/endless-punishment",
    sourceLabel: "EDHREC precon page",
  },
];

function postureTone(posture: Signal["posture"]) {
  return posture === "Buy for play" ? "text-emerald-700 dark:text-emerald-400" : posture === "Leave alone" ? "text-destructive" : "text-amber-700 dark:text-amber-300";
}

function SignalCard({ signal }: { signal: Signal }) {
  const positive = signal.posture === "Buy for play";
  return <article className="border-2 border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">{signal.set}</p><h3 className="mt-1 text-xl font-black">{signal.deck}</h3><p className="mt-1 text-xs font-bold text-muted-foreground">Helmed by {signal.commander}</p></div>
      <span className={`inline-flex items-center gap-1 border border-current px-2 py-1 font-mono text-[10px] font-black uppercase ${postureTone(signal.posture)}`}>{positive ? <TrendingUp className="h-3 w-3" /> : signal.posture === "Leave alone" ? <TrendingDown className="h-3 w-3" /> : null}{signal.posture}</span>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-[132px_1fr]">
      <div><MarketMoverCardArt name={signal.add} size="small" className="mx-auto h-48 w-32" /><CardIndexLink name={signal.add} compact className="mt-2" /></div>
      <div><p className="text-sm leading-6 text-muted-foreground">{signal.thesis}</p><div className="mt-4 border-y border-border py-3"><p className="font-mono text-[10px] font-black uppercase text-primary">Direct upgrade</p><p className="mt-1 text-sm font-black">ADD · {signal.add}</p><p className="mt-1 text-xs text-muted-foreground">{signal.role}</p><p className="mt-2 text-xs font-bold text-destructive">CUT · {signal.cut}</p></div><div className="mt-3 flex flex-wrap items-baseline justify-between gap-2"><span className="font-mono text-lg font-black">{signal.price}</span><span className="font-mono text-[9px] uppercase text-muted-foreground">{signal.priceNote}</span></div></div>
    </div>
    <p className="mt-4 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Risk:</strong> {signal.risk}</p>
    <div className="mt-4 flex flex-wrap gap-2"><a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 border border-border px-2 py-1 font-mono text-[9px] font-bold uppercase hover:border-primary">{signal.sourceLabel} <ExternalLink className="h-3 w-3" /></a><a href={`/card/${encodeURIComponent(signal.commander)}`} className="inline-flex min-h-9 items-center border border-border px-2 py-1 font-mono text-[9px] font-bold uppercase hover:border-primary">Commander profile</a></div>
  </article>;
}

export function PreconMarketSignalModule() {
  const [filter, setFilter] = useState<"all" | Signal["posture"]>("all");
  const visible = filter === "all" ? signals : signals.filter(signal => signal.posture === filter);
  return <section className="mt-6 border-y-2 border-primary/40 bg-primary/5 px-4 py-7 sm:px-8" aria-labelledby="precon-market-signals-heading"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Editorial overlay · Gemini brief · Nov. 9, 2026</p><h2 id="precon-market-signals-heading" className="mt-2 text-3xl font-black tracking-tight">Precon Upgrade &amp; Market Signals</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">A deck-first watch module: each row connects a precon, its commander, one direct add/cut, an observed price, and a practical buy posture. Prices are dated observations, not live quotes or investment advice.</p></div><a href="/blog/precon-upgrade-market-radar-2026-11-10" className="inline-flex min-h-11 items-center border-2 border-primary px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground">Read the full precon desk</a></div><div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Precon signal filters">{(["all", "Buy for play", "Wait for supply", "Watch", "Leave alone"] as const).map(value => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`border-2 px-3 py-2 font-mono text-[10px] font-black uppercase ${filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>{value === "all" ? "All signal rows" : value}</button>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2">{visible.map(signal => <SignalCard key={signal.id} signal={signal} />)}</div><p className="mt-5 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">Decision rule: buy a card because it improves a deck you intend to play; wait on release-week Star Trek singles; leave a card alone when the upgrade is useful but the price or evidence does not fit the current plan.</p></div></section>;
}

export default PreconMarketSignalModule;
