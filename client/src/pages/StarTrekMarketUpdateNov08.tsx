import { ArrowLeft, CalendarDays, ShieldAlert, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { CardIndexLink } from "@/components/CardIndexLink";
import { MarketMoverCardArt } from "@/components/MarketMoverCardArt";
import { starTrekProductWatch } from "@/data/starTrekMarketWatch";

const focusGroups = [
  {
    title: "Reported mover · investigate, do not chase",
    detail: "The reported weekly move is source-dated and not cleanly attributable to Star Trek demand.",
    cards: [
      { name: "Leonardo da Vinci", label: "Reported $1.20 → ~$3", tone: "Reported mover" },
      { name: "Memnarch, the Warden", label: "Artifact-copy catalyst", tone: "Reality Fracture context" },
      { name: "Darksteel Angel", label: "Artifact-copy target", tone: "Reality Fracture context" },
      { name: "Jace, the Living Guildpact", label: "Reported $2–$3 → $5+", tone: "Speculative comparison" },
    ],
  },
  {
    title: "Federation Fleet · first play-copy investigation",
    detail: "The documented direction is historic cost reduction, legendary mana, and a more focused Spacecraft engine.",
    cards: [
      { name: "Jhoira's Familiar", label: "Historic cost reduction", tone: "First check" },
      { name: "Relic of Legends", label: "Legendary mana", tone: "Price-check one" },
      { name: "Etherium Sculptor", label: "Artifact cost reduction", tone: "Potential add-on" },
      { name: "Cloud Key", label: "Sleeper research", tone: "Unverified" },
    ],
  },
  {
    title: "Artifact engine · expanded research board",
    detail: "These are play-testing candidates from adjacent Commander ecosystems, not verified Star Trek movers.",
    cards: [
      { name: "Scrap Trawler", label: "Artifact recovery", tone: "Strongest expanded lead" },
      { name: "Research Thief", label: "Combat draw", tone: "Experiment" },
      { name: "Sharding Sphinx", label: "Artifact tokens", tone: "Six-mana setup" },
      { name: "Thopter Spy Network", label: "Tokens + cards", tone: "Slow setup" },
      { name: "Drafna, Founder of Lat-Nam", label: "Copy / replay", tone: "High-effort wildcard" },
      { name: "Teshar, Ancestor's Apostle", label: "Historic recovery", tone: "Fair-value test" },
      { name: "Myr Retriever", label: "Low-cost recovery", tone: "Budget role" },
      { name: "Junk Diver", label: "Flying recovery", tone: "Redundancy" },
    ],
  },
  {
    title: "Landing Party · landfall and blink board",
    detail: "Treat these as deck-fit candidates while the official list and release-week supply settle.",
    cards: [
      { name: "Tatyova, Benthic Druid", label: "Landfall draw", tone: "First price-check" },
      { name: "Ephemerate", label: "Blink value", tone: "First price-check" },
      { name: "Soulherder", label: "Repeatable blink", tone: "First price-check" },
      { name: "Felidar Retreat", label: "Landfall payoff", tone: "Watch" },
      { name: "Tireless Provisioner", label: "Landfall ramp", tone: "First price-check" },
      { name: "Emeria Shepherd", label: "Land recovery", tone: "Seven-mana test" },
      { name: "Tireless Tracker", label: "Clue value", tone: "Watch" },
      { name: "Zendikar's Roil", label: "Landfall tokens", tone: "Watch" },
    ],
  },
] as const;

function ImageCard({ card }: { card: (typeof focusGroups)[number]["cards"][number] }) {
  return <article className="min-w-0 border border-border bg-card p-3"><MarketMoverCardArt name={card.name} size="small" className="mx-auto h-40 w-28 sm:h-48 sm:w-32" /><div className="mt-3"><p className="text-sm font-black leading-5">{card.name}</p><p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wide text-primary">{card.tone}</p><p className="mt-2 text-[11px] leading-4 text-muted-foreground">{card.label}</p><CardIndexLink name={card.name} compact className="mt-3" /></div></article>;
}

export function StarTrekMarketUpdateNov08() {
  return <div className="min-h-screen bg-background text-foreground"><header className="border-b-2 border-border bg-card"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-8"><Link href="/market-reports" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Dated market archive</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" /> November 8, 2026 · Star Trek potential movers</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Star Trek potential movers: play first, chase later</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">A visual upgrade and market watch for the four Commander precons, separating documented deck fit from reported movement, adjacent-card research, and unverified price narratives.</p></div><span className="border border-amber-600/50 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">Selective · spend $0</span></div><p className="mt-5 max-w-4xl text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Release clock:</strong> prerelease events run Nov. 6–12; tabletop release is Nov. 13. Published guides support the upgrade directions below, but no delivered basket, completed-sale acceleration, or Star Trek-driven buyout has been verified.</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/market-report/star-trek-market-watch-2026-11-07" className="inline-flex min-h-10 items-center border-2 border-border bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Open Nov. 7 release watch</Link><a href="/market-watch#star-trek-market-watch-heading" className="inline-flex min-h-10 items-center border-2 border-primary bg-primary px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90">Open market watch</a></div></div></header><main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8"><section className="border-l-4 border-amber-500 bg-amber-500/5 p-4 sm:p-5" role="note"><p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Potential mover is not verified movement</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The Leonardo da Vinci comparison comes from a weekly roundup using rounded figures and does not isolate finish or completed sales. Guide recommendations establish deck-building context, not demand or price appreciation. Verify exact printings, listing depth, condition, shipping, and post-release sales before buying.</p></section><section className="border-2 border-primary/30 bg-primary/5 p-5 sm:p-7"><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Quick read</p><h2 className="mt-2 text-2xl font-black">The useful signal is selective</h2><div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-4"><p className="border-l-2 border-primary pl-3"><strong className="text-foreground">Federation Fleet:</strong> investigate Jhoira's Familiar and Relic of Legends.</p><p className="border-l-2 border-primary pl-3"><strong className="text-foreground">Borg:</strong> choose the artifact route before buying overlapping engines.</p><p className="border-l-2 border-primary pl-3"><strong className="text-foreground">Landing Party:</strong> prioritize landfall and blink overlap.</p><p className="border-l-2 border-primary pl-3"><strong className="text-foreground">Klingon Fury:</strong> keep the research combat-focused; do not force artifact spillover.</p></div></section>{focusGroups.map(group => <section key={group.title} className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Full card-image watchlist</p><h2 className="mt-1 text-2xl font-black">{group.title}</h2></div><span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-bold uppercase text-muted-foreground">{group.cards.length} visual entries</span></div><p className="mt-4 max-w-4xl text-sm leading-6 text-muted-foreground">{group.detail}</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{group.cards.map(card => <ImageCard key={card.name} card={card} />)}</div></section>)}<section className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">The provisional $6 play basket</h2></div><p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">If you want playable copies rather than speculation, the report’s discretionary ceiling is one Jhoira's Familiar at $1.50, one Scrap Trawler at $1.50, and one Teshar at $0.50, with a $6 maximum delivered total. These are planning limits, not verified checkout quotes.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{["Jhoira's Familiar", "Scrap Trawler", "Teshar, Ancestor's Apostle"].map(name => <div key={name} className="flex items-center gap-3 border border-border bg-background p-3"><MarketMoverCardArt name={name} size="small" /><div><p className="text-sm font-black">{name}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Play copy · verify exact printing</p><CardIndexLink name={name} compact className="mt-2" /></div></div>)}</div></section><section className="border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><p><strong className="text-foreground">Sources:</strong> EDHREC Star Trek precon guides for Federation Fleet, We Are the Borg, Landing Party, and Klingon Fury; Draftsim weekly price-spike roundup for the Leonardo da Vinci comparison; EDHREC precon upgrade pages; Wizards' official Star Trek product timing.</p><p className="mt-2">This is hobby research and deck-building commentary, not financial advice. Card usefulness does not guarantee resale demand.</p></section></main></div>;
}

export default StarTrekMarketUpdateNov08;
