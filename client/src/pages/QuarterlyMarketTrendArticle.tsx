import {
  ArrowLeft,
  ExternalLink,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";

type Highlight = {
  name: string;
  setCode: string;
  collectorNumber: string;
  price: string;
  move: string;
  note: string;
  direction: "up" | "down";
};

const highlights: Highlight[] = [
  {
    name: "Swamp",
    setCode: "znr",
    collectorNumber: "382",
    price: "$1.19",
    move: "+127.27% → +58.67%",
    note: "Best repeat-momentum signal across the two full-universe snapshots.",
    direction: "up",
  },
  {
    name: "Panther Robot",
    setCode: "msc",
    collectorNumber: "113",
    price: "$1.04",
    move: "+46.00% → +42.47%",
    note: "Clean consecutive rise with more persistence than a one-day spike.",
    direction: "up",
  },
  {
    name: "Bast, Panther Goddess",
    setCode: "msc",
    collectorNumber: "75",
    price: "$1.47",
    move: "+35.00% → +36.11%",
    note: "Consistent low-dollar momentum across both full snapshots.",
    direction: "up",
  },
  {
    name: "Mirkwood Bats",
    setCode: "ltr",
    collectorNumber: "95",
    price: "$2.28",
    move: "+40.00% → +30.29%",
    note: "Repeat gain at a higher latest price than most penny risers.",
    direction: "up",
  },
  {
    name: "Annie Joins Up",
    setCode: "msc",
    collectorNumber: "281",
    price: "$0.88",
    move: "+26.00% → +39.68%",
    note: "Accelerating repeat mover; still needs liquidity confirmation.",
    direction: "up",
  },
  {
    name: "Sulfur Falls",
    setCode: "soc",
    collectorNumber: "408",
    price: "$0.60",
    move: "+4.00% → +130.77%",
    note: "Large second-session jump from a very low price base.",
    direction: "up",
  },
  {
    name: "Counterspell",
    setCode: "mh2",
    collectorNumber: "267",
    price: "Early October volatility",
    move: "−19.53% → +11.90%",
    note: "Reprint/supply-driven oscillation rather than a clean trend.",
    direction: "down",
  },
  {
    name: "Tivit, Seller of Secrets",
    setCode: "ncc",
    collectorNumber: "10",
    price: "$15.00",
    move: "+233.33%",
    note: "Largest editorial spike, but only one observation in the archive.",
    direction: "up",
  },
  {
    name: "The Theorist, Jace Beleren",
    setCode: "fra",
    collectorNumber: "43",
    price: "$63.41",
    move: "+81.17%",
    note: "Highest-dollar major spike; exact treatment and sales liquidity need review.",
    direction: "up",
  },
  {
    name: "Temple of Triumph",
    setCode: "tdc",
    collectorNumber: "407",
    price: "$0.49",
    move: "+157.89%",
    note: "Largest latest-session percentage move; do not confuse magnitude with durability.",
    direction: "up",
  },
];

function imageUrl(card: Highlight) {
  return `https://api.scryfall.com/cards/${card.setCode}/${encodeURIComponent(card.collectorNumber)}?format=image&version=normal`;
}

function HighlightCard({ card }: { card: Highlight }) {
  const positive = card.direction === "up";
  return (
    <article className="border-2 border-border bg-card p-3 sm:p-4">
      <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <div className="overflow-hidden border-2 border-border bg-muted shadow-sm">
          <img
            src={imageUrl(card)}
            alt={`${card.name}, ${card.setCode.toUpperCase()} ${card.collectorNumber}, full card frame`}
            loading="lazy"
            decoding="async"
            className="aspect-[488/680] h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
            {card.setCode.toUpperCase()} · #{card.collectorNumber}
          </p>
          <h3 className="mt-2 text-lg font-black leading-tight">{card.name}</h3>
          <p
            className={`mt-3 inline-flex items-center gap-1 font-mono text-xs font-black ${positive ? "text-emerald-600" : "text-destructive"}`}
          >
            {positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {card.move}
          </p>
          <p className="mt-2 font-mono text-[10px] font-black uppercase text-muted-foreground">
            Latest observed · {card.price}
          </p>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {card.note}
          </p>
          <Link
            href={`/card/${encodeURIComponent(card.name)}`}
            className="mt-4 inline-flex border-t border-border pt-3 font-mono text-[10px] font-black uppercase text-primary hover:underline"
          >
            Open card profile →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function QuarterlyMarketTrendArticle() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          <Link
            href="/market-watch"
            className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Market Watch
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-4xl">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
                Quarterly trend comparison · October 22, 2026
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                October’s market was not simply bullish. It became broader,
                louder, and more two-sided.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                A scan-first comparison of the available Q3 historical sample,
                the early-October watch panel, and the October 20–22
                full-universe snapshots.
              </p>
            </div>
            <Link
              href="/market-report/quarterly-trend-comparison-2026-10-22"
              className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
            >
              Source report
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-primary bg-primary/5 p-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
              Q3 positive share
            </p>
            <p className="mt-2 text-3xl font-black">64.2%</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              79 positive versus 44 negative observations in the available
              historical sample.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
              Early October
            </p>
            <p className="mt-2 text-3xl font-black">59.6%</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              The nine-card panel was mixed, with visible Commander and reprint
              volatility.
            </p>
          </div>
          <div className="border-2 border-border bg-card p-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
              Oct. 20–22
            </p>
            <p className="mt-2 text-3xl font-black">48.2%</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Full-universe moves were nearly balanced: 4,034 positive and 4,341
              negative.
            </p>
          </div>
        </section>

        <section className="border-2 border-primary bg-primary/5 p-6 sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">
            The short read
          </p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            Coverage expansion explains part of the apparent regime shift.
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">
            October 1–16 used a nine-card watch panel. October 20–22 used
            approximately 12,511 signals per day. The later sample reveals more
            tail events, but it is not a clean apples-to-apples quarterly
            comparison. The strongest defensible conclusion is that October’s
            current tape is more two-sided and volatile, with Commander Picks
            dominating both gains and declines.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase">
              Median full-universe move · 2.94%
            </span>
            <span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase">
              10%+ moves · 467
            </span>
            <span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase">
              25%+ moves · 83
            </span>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">
                Cards in the tape
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Highlighted exact printings
              </h2>
            </div>
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              Full card frames are shown for the cards discussed in the
              comparison. Percentages are snapshot observations, not
              completed-sale returns.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {highlights.map(card => (
              <HighlightCard
                key={`${card.setCode}-${card.collectorNumber}`}
                card={card}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="border-2 border-border bg-card p-6">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">
              Quarterly pattern
            </p>
            <h2 className="mt-3 text-2xl font-black">
              Commander is the main risk-and-opportunity channel.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Commander Picks accounted for 3,905 positive and 4,288 negative
              observations in the October full-universe sample. That balance
              matters: the category is producing both demand opportunities and
              supply/reprint drawdowns. Exact printing, product context, and
              treatment are essential for interpretation.
            </p>
            <Link
              href="/commander-market"
              className="mt-5 inline-flex border-t border-border pt-3 font-mono text-[10px] font-black uppercase text-primary hover:underline"
            >
              Open Commander demand index →
            </Link>
          </article>
          <article className="border-2 border-border bg-card p-6">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">
              Do not chase
            </p>
            <h2 className="mt-3 text-2xl font-black">
              Triple-digit penny moves are discovery signals, not automatic
              buys.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Temple of Triumph, Sulfur Falls, Hammer of Purphoros, Reality
              Shift, Goblin Electromancer, Octomancer, Loyal Apprentice, and
              Guttersnipe all posted dramatic recent percentage moves. Most were
              still below $1. Require another observation, broader source
              confirmation, or completed-sale evidence before upgrading them.
            </p>
            <Link
              href="/movers"
              className="mt-5 inline-flex border-t border-border pt-3 font-mono text-[10px] font-black uppercase text-primary hover:underline"
            >
              Review current movers →
            </Link>
          </article>
        </section>

        <details className="border-2 border-border bg-card">
          <summary className="cursor-pointer px-5 py-4 font-mono text-xs font-black uppercase tracking-wider">
            Read the comparison methodology and limitations
          </summary>
          <div className="space-y-4 border-t border-border p-5 text-sm leading-7 text-muted-foreground sm:p-7">
            <p>
              <strong className="text-foreground">Periods:</strong> available Q3
              historical files, October 1–16 tracked-panel files, and October
              20–22 full-universe files.
            </p>
            <p>
              <strong className="text-foreground">Main limitation:</strong> the
              tracker changed from nine records per day to approximately 12,511
              signals per day. Raw mover counts are therefore not comparable
              without normalization.
            </p>
            <p>
              <strong className="text-foreground">Missing dates:</strong>{" "}
              October 17–19 daily snapshot files are absent from the local
              archive.
            </p>
            <p>
              <strong className="text-foreground">Interpretation rule:</strong>{" "}
              a percentage change does not establish completed-sale volume,
              liquidity, condition, finish, language, or treatment. Low-priced
              cards can create very large percentage changes from small absolute
              movements.
            </p>
            <p>
              <strong className="text-foreground">Source:</strong> the complete
              analysis is preserved in the{" "}
              <Link
                href="/market-report/quarterly-trend-comparison-2026-10-22"
                className="text-primary hover:underline"
              >
                dated comparison report
              </Link>
              .
            </p>
          </div>
        </details>

        <footer className="flex flex-wrap gap-3 border-t-2 border-border pt-5">
          <Link
            href="/market-report/quarterly-trend-comparison-2026-10-22"
            className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
          >
            Open full report <ExternalLink className="h-3 w-3" />
          </Link>
          <a
            href="https://github.com/krisaguero/MtgTracker-manus/blob/main/docs/market-quarterly-trend-comparison-2026-10-22.md"
            className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
          >
            GitHub source <ExternalLink className="h-3 w-3" />
          </a>
        </footer>
      </main>
    </div>
  );
}
