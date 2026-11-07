import { ArrowLeft, CalendarDays, ShieldAlert } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";
import { Link } from "wouter";
import { MarketMoverCardArt } from "@/components/MarketMoverCardArt";
import sourceBrief from "@/data/marketBriefs/2026-11-06-daily-mtg-market-movers.md?raw";

const reportBody = sourceBrief.replace(/^# Daily MTG Market Movers — 30-Signal Brief\s*/, "");
const markdownComponents: Components = {
  a: ({ href, children, node: _node, ...props }) => (
    <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="break-words text-primary underline underline-offset-2 hover:opacity-80">{children}</a>
  ),
};

const briefMoverArtCards = [
  { name: "Nethergoyf", setCode: "mh3", group: "30-signal brief" },
  { name: "Gandalf, White Rider", group: "30-signal brief" },
  { name: "Teferi, Master of Time", group: "30-signal brief" },
  { name: "Valgavoth, Terror Eater", setCode: "dsk", group: "30-signal brief" },
  { name: "Loki’s Double", group: "30-signal brief" },
  { name: "The Darkness Crystal", setCode: "fin", group: "30-signal brief" },
  { name: "Lifegift", setCode: "bok", group: "30-signal brief" },
  { name: "Unmask", group: "30-signal brief" },
  { name: "Llanowar Elves", setCode: "lea", group: "30-signal brief" },
  { name: "Royal Assassin", group: "30-signal brief" },
  { name: "Kardur, Doomscourge", setCode: "khm", group: "30-signal brief" },
  { name: "Ajani’s Welcome", setCode: "m19", group: "30-signal brief" },
  { name: "Tarmogoyf", group: "30-signal brief" },
  { name: "Obsidian Charmaw", setCode: "mh2", group: "30-signal brief" },
  { name: "Smaug the Magnificent", group: "30-signal brief" },
  { name: "Balefire Dragon", group: "30-signal brief" },
  { name: "Sword of Truth and Justice", group: "30-signal brief" },
  { name: "Copy Artifact", setCode: "leb", group: "Bearish watch" },
  { name: "Imperial Recruiter", setCode: "ptk", group: "Bearish watch" },
  { name: "Lord of Atlantis", setCode: "3ed", group: "Bearish watch" },
  { name: "Warp Artifact", setCode: "3ed", group: "Bearish watch" },
  { name: "Lifelace", group: "Price-spread watch" },
  { name: "Desperate Charge", group: "Price-spread watch" },
];

export function November06MarketBrief() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link href="/market-reports" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Dated report archive</Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" /> November 6, 2026 · supplied research brief</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Daily MTG Market Movers — 30-Signal Brief</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">A dated source brief with price, Commander, and supply signals—not a complete live price tape.</p>
            </div>
            <span className="border border-amber-600/50 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">Historical · source-limited</span>
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Data window:</strong> November 5, 2026 / most recent verified weekly snapshot.</p>
          <div className="mt-5 border-l-4 border-amber-500 bg-amber-500/5 p-4" role="note" aria-label="Important price-verification limitation">
            <p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Read as a dated watch brief, not a live price tape</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The source could not independently verify same-day completed-sale volume, eBay sold listings, buylist moves for every card, or precise prior-day card-by-card changes. Some figures are weekly, and several cards lack exact printing detail. Check the cited source and current listings before relying on any number.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/market-report/star-trek-market-watch-2026-11-07" className="inline-flex min-h-10 items-center border-2 border-primary bg-primary px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90">Open Nov. 7 Star Trek release watch</Link>
            <Link href="/market-watch" className="inline-flex min-h-10 items-center border-2 border-border bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Open Market Watch feed</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
        <section className="border-2 border-primary/30 bg-primary/5 p-5 sm:p-7" aria-labelledby="brief-takeaways">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Quick read</p>
          <h2 id="brief-takeaways" className="mt-2 text-2xl font-black">What matters from this brief</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            <li className="border-l-2 border-primary pl-3"><strong className="text-foreground">Nethergoyf:</strong> reported above $10, up from about $5 two weeks earlier, with renewed Modern adoption cited.</li>
            <li className="border-l-2 border-primary pl-3"><strong className="text-foreground">Commander:</strong> Gandalf, White Rider was reported near a $9 high amid Denzilore / +1/+1-counter interest.</li>
            <li className="border-l-2 border-primary pl-3"><strong className="text-foreground">Star Trek:</strong> prerelease runs Nov. 6–12, with tabletop release Nov. 13; the separate live watch now has its own Nov. 7 update.</li>
            <li className="border-l-2 border-primary pl-3"><strong className="text-foreground">Caution:</strong> weekly, daily, and speculative signals are not interchangeable; several exact printings and completed-sale checks are missing.</li>
          </ul>
        </section>
        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="brief-mover-art">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Card art index</p>
          <h2 id="brief-mover-art" className="mt-2 text-2xl font-black">Named movers from the brief</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">These representative images cover the unique card names in the 30 signal rows plus the brief’s bearish and price-spread watchlists; repeated names appear once. Some entries do not specify an exact printing, so the art may differ from the quoted copy. The Star Trek chase-card signal describes an upcoming group, not one named card.</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {briefMoverArtCards.map(card => (
              <li key={card.name} className="flex min-w-0 flex-col items-center border border-border bg-background p-3 text-center">
                <MarketMoverCardArt name={card.name} setCode={card.setCode} size="small" />
                <p className="mt-2 text-xs font-bold leading-snug">{card.name}</p>
                <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{card.group}</p>
              </li>
            ))}
          </ul>
        </section>
        <details className="border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-black uppercase tracking-wider text-primary">Open full 30-signal source brief</summary>
          <article className="prose prose-neutral max-w-none break-words border-t border-border p-5 dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-muted-foreground sm:p-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{reportBody}</ReactMarkdown>
          </article>
        </details>
      </main>
    </div>
  );
}

export default November06MarketBrief;
