import {
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  ShieldAlert,
  ShoppingCart,
} from "lucide-react";
import { Link } from "wouter";
import products from "@/../../data/releases/preorder-products.json";
import { InternalPageNav } from "@/components/InternalPageNav";

type Product = (typeof products.products)[number];
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
const days = (value: string) =>
  Math.ceil((new Date(`${value}T00:00:00Z`).getTime() - Date.now()) / 86400000);
const marketplace = (name: string) =>
  encodeURIComponent(`Magic The Gathering ${name}`);

function ProductCard({ product }: { product: Product }) {
  const daysLeft = days(product.releaseDate);
  const prices = Object.entries(product.prices || {}).reduce<
    [string, number][]
  >((entries, [source, value]) => {
    if (typeof value === "number") entries.push([source, value]);
    return entries;
  }, []);
  return (
    <article className="border-2 border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
            {product.setCode} · {product.productType}
          </p>
          <h2 className="mt-2 text-xl font-black leading-tight">
            {product.name}
          </h2>
        </div>
        <span
          className={`shrink-0 border px-2 py-1 font-mono text-[9px] font-black uppercase ${product.riskBand === "high" ? "border-red-600 bg-red-600/10 text-red-700" : product.riskBand === "elevated" ? "border-amber-600 bg-amber-600/10 text-amber-700" : "border-border text-muted-foreground"}`}
        >
          {product.riskBand || "watch"} risk
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="border border-border p-3">
          <p className="font-mono text-[9px] uppercase text-muted-foreground">
            Release
          </p>
          <p className="mt-1 font-bold">{formatDate(product.releaseDate)}</p>
          <p className="mt-1 text-muted-foreground">
            {daysLeft >= 0 ? `${daysLeft} days` : "released"}
          </p>
        </div>
        <div className="border border-border p-3">
          <p className="font-mono text-[9px] uppercase text-muted-foreground">
            Evidence
          </p>
          <p className="mt-1 font-bold">
            {prices.length ? `${prices.length} sources` : "Awaiting prices"}
          </p>
          <p className="mt-1 text-muted-foreground">
            Score {product.riskScore ?? "—"}/100
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {product.riskFlags?.join(" · ") || "No additional risk flags."}
      </p>
      {prices.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {prices.map(([source, value]) => (
            <span
              key={source}
              className="border border-border px-2 py-1 font-mono text-[10px] uppercase"
            >
              {source}: ${value.toFixed(2)}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <a
          href={`https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${marketplace(product.retailerSearchName)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 border border-border px-2 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
        >
          <ShoppingCart className="h-3 w-3" /> TCGplayer
        </a>
        <a
          href={product.officialSourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 border border-border px-2 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
        >
          Official <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

export default function Q4ReleaseRisk() {
  const sorted = [...products.products].sort(
    (a, b) =>
      a.releaseDate.localeCompare(b.releaseDate) || a.name.localeCompare(b.name)
  );
  const observed = sorted.filter(product => product.sourceCount > 0).length;
  const highRisk = sorted.filter(
    product => product.riskBand === "high" || product.riskBand === "elevated"
  ).length;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <InternalPageNav />
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
            Q4 release risk desk · {products.asOf}
          </p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">
            Preorders under pressure.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Product-level monitoring for Star Trek Commander decks and Mystery
            Booster Commander Edition. Sealed products stay separate from
            card-printing prices, and missing quotes remain missing.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-primary bg-primary/5 p-5">
            <CalendarClock className="h-5 w-5 text-primary" />
            <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-widest text-primary">
              Products tracked
            </p>
            <p className="mt-2 text-3xl font-black">{sorted.length}</p>
          </div>
          <div className="border-2 border-amber-600/60 bg-amber-600/5 p-5">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-widest text-amber-700">
              Elevated watch
            </p>
            <p className="mt-2 text-3xl font-black">{highRisk}</p>
          </div>
          <div className="border-2 border-border bg-card p-5">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Price coverage
            </p>
            <p className="mt-2 text-3xl font-black">
              {observed}/{sorted.length}
            </p>
          </div>
        </section>
        <section className="border-2 border-amber-600/50 bg-amber-600/5 p-5">
          <p className="font-mono text-xs font-black uppercase tracking-widest text-amber-700">
            Guardrail
          </p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            A high risk score means volatility, thin supply, release proximity,
            or source disagreement. It is not a buy signal. Recheck after
            inventory broadens and compare completed sales.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {sorted.map(product => (
            <ProductCard key={product.id} product={product as Product} />
          ))}
        </section>
        <div className="flex flex-wrap gap-3 border-t-2 border-border pt-5">
          <Link
            href="/market-watch"
            className="border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
          >
            Market Watch
          </Link>
          <Link
            href="/spoiler-calendar"
            className="border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
          >
            Release calendar
          </Link>
          <Link
            href="/roadmap"
            className="border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"
          >
            Roadmap
          </Link>
        </div>
      </main>
    </div>
  );
}
