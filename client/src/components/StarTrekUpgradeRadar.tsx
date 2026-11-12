import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { CardIndexLink, CardMediaFrame } from "@/components/CardIndexLink";
import { CardImageZoom } from "@/components/CardImageZoom";
import { getMarketCardImageUrls } from "@/lib/marketCardArtLookup";
import { useMarketPriceIndex, type ResolvedCardPrice } from "@/lib/marketPriceIndex";

const radarDecks = [
  {
    id: "landing-party",
    name: "Landing Party",
    identity: "Bant · lands, landfall, and blink",
    thesis: "Keep the stock land-and-blink identity, then improve mana consistency and repeatable commander value before adding expensive finishers.",
    route: "Build around the existing landfall and blink packages.",
    sourceUrl: "https://edhrec.com/guides/landing-party-star-trek-precon-guide",
    sourceLabel: "EDHREC Landing Party guide",
    upgrades: [
      { name: "Tatyova, Benthic Druid", role: "Landfall draw", reason: "Connects directly to the land plan; displayed at 37% inclusion on the precon page.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "Ephemerate", role: "Blink value", reason: "A low-cost way to reuse commander and enter-the-battlefield triggers; displayed at 25%.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "Soulherder", role: "Repeatable blink", reason: "Supports the blink direction without replacing the deck's identity; displayed at 19%.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "Tireless Provisioner", role: "Landfall ramp", reason: "Turns the existing land plan into repeatable mana and Treasure value; displayed at 17%.", status: "Watch", cut: "Verify stock list before naming a cut" },
    ],
    guideCuts: ["Sam Kirk, Xenoanthropologist", "McCoy, Not a Bricklayer", "Christine Chapel, Combat Medic", "The Guardian of Forever", "Giant Space Amoeba"],
  },
  {
    id: "federation-fleet",
    name: "Federation Fleet",
    identity: "Jeskai · historic permanents, ships, and second-card-drawn payoffs",
    thesis: "Make the historic and Spacecraft engine cheaper and more focused. Trim group-hug effects that give opponents cards without advancing your own board.",
    route: "Prioritize cost reduction, legendary mana, and protection before premium finishers.",
    sourceUrl: "https://edhrec.com/guides/federation-fleet-star-trek-precon-guide",
    sourceLabel: "EDHREC Federation Fleet guide",
    upgrades: [
      { name: "Jhoira's Familiar", role: "Historic cost reduction", reason: "Budget-oriented cost reduction for the legendary and historic-heavy engine.", status: "Watch", cut: "Howling Mine is the guide's first cut candidate" },
      { name: "Relic of Legends", role: "Legendary mana", reason: "Turns the deck's legendary density into a more reliable mana engine.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "Lady Octopus", role: "Historic payoff", reason: "Supports the deck's artifact and historic sequencing plan.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "Inspired Inventor", role: "Artifact engine", reason: "Adds another artifact-centered value angle without forcing a new archetype.", status: "Watch", cut: "Verify stock list before naming a cut" },
    ],
    guideCuts: ["Howling Mine"],
  },
  {
    id: "klingon-fury",
    name: "Klingon Fury",
    identity: "Mardu · attacks, tokens, sacrifice, and combat access",
    thesis: "Make every combat step productive. Favor cheap token production, sacrifice outlets, and efficient attackers over expensive packages that only matter after the board is already wide.",
    route: "Test the combat plan before pursuing infinite-combat lines.",
    sourceUrl: "https://edhrec.com/guides/klingon-fury-star-trek-precon-guide",
    sourceLabel: "EDHREC Klingon Fury guide",
    upgrades: [
      { name: "General Chang, Cold Warrior", role: "Combat support", reason: "Guide-recommended support for making attacks and temporary attackers matter.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "Gowron, Eager for Battle", role: "Token pressure", reason: "Reinforces the deck's attack-wide and sacrifice-value direction.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "L'Rell, Fierce Visionary", role: "Combat payoff", reason: "Adds a more focused reward for turning combat into card access.", status: "Watch", cut: "Verify stock list before naming a cut" },
      { name: "D-7 Battle Cruiser", role: "Klingon support", reason: "In-universe support that advances the deck's attack and removal plan.", status: "Watch", cut: "Verify stock list before naming a cut" },
    ],
    guideCuts: ["Test the four-to-five-mana cards with low immediate impact first"],
  },
  {
    id: "we-are-the-borg",
    name: "We Are the Borg",
    identity: "Esper · artifacts, assimilation, tokens, and charge counters",
    thesis: "Choose the commander route before buying upgrades. The Borg Queen, Locutus, and the charge-counter plan want different additions, so do not combine all three packages blindly.",
    route: "Test The Borg Queen and Locutus separately before spending on redundant engines.",
    sourceUrl: "https://edhrec.com/guides/we-are-the-borg-star-trek-precon-guide",
    sourceLabel: "EDHREC We Are the Borg guide",
    upgrades: [
      { name: "Primary Unimatrix Adjunct", role: "Borg route", reason: "Guide-recommended in-universe addition for the assimilation and artifact-creature direction.", status: "Watch", cut: "Locutus, the One Who Speaks is an initial cut candidate" },
      { name: "Borg Cube", role: "Artifact creature", reason: "Supports the Queen/Locutus artifact-creature route without assuming the charge-counter package.", status: "Watch", cut: "Stratagem Emulator is an initial cut candidate" },
      { name: "Death is Irrelevant", role: "Recursion", reason: "Adds resilience to the artifact-creature board, but should be checked against the curve.", status: "Watch", cut: "Korok, Liberated Rage is another candidate" },
      { name: "Crystalline Entity", role: "Artifact payoff", reason: "A route-specific threat; do not add it until the commander route is selected.", status: "Route first", cut: "Seven of Nine becomes more questionable if charge counters are abandoned" },
    ],
    guideCuts: ["Locutus, the One Who Speaks", "Stratagem Emulator", "Korok, Liberated Rage", "Seven of Nine if abandoning charge counters"],
  },
] as const;

function RadarCard({ name, role, status }: { name: string; role: string; status: string }) {
  const [imageSrc, setImageSrc] = useState<string>();
  useEffect(() => {
    let active = true;
    void getMarketCardImageUrls(name).then(urls => {
      if (active) setImageSrc(urls?.normal || urls?.small);
    });
    return () => { active = false; };
  }, [name]);
  return (
    <article className="min-w-0 border border-border bg-card">
      <CardMediaFrame className="relative mx-auto max-w-[230px] border-2 border-border bg-[#171a24]">
        {imageSrc ? <CardImageZoom src={imageSrc} alt={name} /> : <div className="flex h-full items-center justify-center p-4 text-center font-mono text-[10px] uppercase text-muted-foreground">Loading card frame</div>}
      </CardMediaFrame>
      <div className="p-3">
        <div className="flex flex-wrap gap-1.5"><span className="border border-border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">{status}</span><span className="border border-primary/30 bg-primary/5 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-primary">{role}</span></div>
        <h4 className="mt-2 break-words text-sm font-black leading-5">{name}</h4>
        <CardIndexLink name={name} compact className="mt-2" />
      </div>
    </article>
  );
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function UpgradeBudget({ deck, prices, loading }: { deck: (typeof radarDecks)[number]; prices: Map<string, ResolvedCardPrice>; loading: boolean }) {
  const [cap, setCap] = useState(3);
  const rows = useMemo(() => deck.upgrades.map(card => ({ ...card, price: prices.get(card.name) })), [deck.upgrades, prices]);
  const priced = rows.filter(row => row.price);
  const knownSubtotal = priced.reduce((sum, row) => sum + (row.price?.usd || 0), 0);
  const underCap = priced.filter(row => (row.price?.usd || 0) <= cap);
  const overCap = priced.filter(row => (row.price?.usd || 0) > cap);
  const coverage = rows.length ? Math.round((priced.length / rows.length) * 100) : 0;
  const provisionalCeiling = knownSubtotal + (rows.length - priced.length) * cap;
  return (
    <div className="mt-7 border-2 border-primary/30 bg-primary/5 p-4 sm:p-5" aria-label={`${deck.name} price tracking and budget breakdown`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">Price tracking · snapshot index</p><h4 className="mt-1 text-xl font-black">Upgrade budget breakdown</h4></div>
        <span className="border border-border bg-card px-2 py-1 font-mono text-[10px] font-bold uppercase">{loading ? "Loading prices" : `${priced.length}/${rows.length} priced · ${coverage}% coverage`}</span>
      </div>
      <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Indexed subtotal</p><p className="mt-1 text-2xl font-black text-primary">{money(knownSubtotal)}</p><p className="mt-1 text-[10px] text-muted-foreground">Known cards only</p></div>
        <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">At or under cap</p><p className="mt-1 text-2xl font-black">{underCap.length} cards</p><p className="mt-1 text-[10px] text-muted-foreground">{money(underCap.reduce((sum, row) => sum + (row.price?.usd || 0), 0))} indexed spend</p></div>
        <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Planning ceiling</p><p className="mt-1 text-2xl font-black">{money(provisionalCeiling)}</p><p className="mt-1 text-[10px] text-muted-foreground">Unknown cards modeled at {money(cap)} each</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] font-black uppercase text-muted-foreground">Per-card cap</span>{[1, 3, 5, 10].map(value => <button key={value} type="button" onClick={() => setCap(value)} className={`border px-3 py-2 font-mono text-[10px] font-black ${cap === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>{money(value)}</button>)}</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(row => <div key={row.name} className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-2 text-xs"><span className="min-w-0"><strong className="block truncate">{row.name}</strong><span className="font-mono text-[9px] uppercase text-muted-foreground">{row.role}</span></span><span className={`shrink-0 font-mono font-black ${row.price ? (row.price.usd <= cap ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-300") : "text-muted-foreground"}`}>{row.price ? money(row.price.usd) : "Unverified"}</span></div>)}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{overCap.length} priced card{overCap.length === 1 ? "" : "s"} exceed the selected cap. Totals use the tracker’s indexed snapshot and exclude shipping, tax, finish differences, and unavailable prices; they are not live quotes.</p>
    </div>
  );
}

function DeckRadar({ deck, priceIndex }: { deck: (typeof radarDecks)[number]; priceIndex: ReturnType<typeof useMarketPriceIndex> }) {
  const priceMap = useMemo(() => {
    const map = new Map<string, ResolvedCardPrice>();
    for (const card of deck.upgrades) {
      const price = priceIndex.resolveCardPrice(card.name);
      if (price) map.set(card.name, price);
    }
    return map;
  }, [deck.upgrades, priceIndex.ready]);
  return (
    <section className="scroll-mt-24 border-2 border-border bg-card p-5 sm:p-7" id={`radar-${deck.id}`} aria-labelledby={`radar-${deck.id}-heading`}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4">
        <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Deck clinic · release week watch</p><h3 id={`radar-${deck.id}-heading`} className="mt-1 text-3xl font-black tracking-tight">{deck.name}</h3><p className="mt-1 text-sm font-bold text-muted-foreground">{deck.identity}</p></div>
        <a href={deck.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary hover:text-primary">{deck.sourceLabel} <ExternalLink className="h-3 w-3" /></a>
      </div>
      <p className="mt-5 max-w-4xl text-base leading-7">{deck.thesis} {deck.route}</p>
      <div className="mt-6 flex flex-wrap gap-2"><a href="#radar-watchlist" className="border border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground">Watch these upgrades</a><span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-bold uppercase text-muted-foreground">Price status · unverified</span></div>
      <div className="mt-6 grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">{deck.upgrades.map(card => <RadarCard key={card.name} name={card.name} role={card.role} status={card.status} />)}</div>
      <div className="mt-7 border-t border-border pt-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="text-xl font-black">Direct upgrade cuts</h4><span className="font-mono text-[10px] uppercase text-muted-foreground">Verify against official list before purchase</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{deck.upgrades.map(card => <div key={`${card.name}-cut`} className="border border-border bg-background p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-black text-emerald-700 dark:text-emerald-400">ADD · {card.name}</span><span className="font-mono text-[9px] font-bold uppercase text-amber-700">{card.status}</span></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{card.reason}</p><p className="mt-3 border-t border-border pt-2 text-xs font-bold text-destructive">CUT · {card.cut}</p></div>)}</div></div>
      <UpgradeBudget deck={deck} prices={priceMap} loading={priceIndex.loading} />
      <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"><strong>Guide cut candidates:</strong> {deck.guideCuts.join(" · ")}</div>
    </section>
  );
}

export function StarTrekUpgradeRadar() {
  const priceIndex = useMarketPriceIndex();
  return (
    <section className="mt-5 border-y-2 border-primary/40 bg-primary/5 px-4 py-6 sm:px-8" aria-labelledby="star-trek-upgrade-radar-heading">
      <div className="mx-auto max-w-7xl">
        <div className="border-2 border-primary/30 bg-card p-5 sm:p-7">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Commander precon style · source-dated watchlist</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h2 id="star-trek-upgrade-radar-heading" className="text-3xl font-black tracking-tight sm:text-4xl">Star Trek Precon Upgrade Radar</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Four release-week deck clinics with larger card frames, direct add/cut candidates, and a strict separation between documented upgrade support and verified market pricing.</p></div><div className="border border-amber-500 bg-amber-500/10 p-3 text-right"><p className="font-mono text-[9px] font-black uppercase text-amber-700">Today’s decision</p><p className="mt-1 text-xl font-black text-amber-800 dark:text-amber-300">Spend $0</p><p className="text-[10px] text-amber-800 dark:text-amber-200">Wait for Nov. 13 supply</p></div></div>
          <div className="mt-5 grid gap-3 border-2 border-primary/30 bg-primary/5 p-4 sm:grid-cols-3" aria-label="November 11 Star Trek spoiler-season posture"><div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Spoiler-season lens · Nov. 11</p><p className="mt-1 text-sm font-black">Artifacts and energy are developing themes</p></div><div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Federation / Borg</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Test historic cost reduction and artifact-creature routes only after choosing the commander line.</p></div><div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-primary">Evidence rule</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The supplied market brief leaves Star Trek prices unverified; wait for full lists and release-week supply.</p></div></div>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Star Trek upgrade radar decks">{radarDecks.map(deck => <a key={deck.id} href={`#radar-${deck.id}`} className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary hover:text-primary">{deck.name}</a>)}</nav>
        </div>
        <div id="radar-watchlist" className="mt-5 border border-amber-500/60 bg-amber-50 p-4 dark:bg-amber-950/20"><p className="text-xs leading-5 text-amber-950 dark:text-amber-100"><strong>Evidence rule:</strong> EDHREC recommendations and guide cut candidates are not current prices, completed sales, or confirmed official cuts. Printing, condition, shipping, legality, and release-week supply still need verification.</p></div>
        <div className="mt-6 grid gap-6">{radarDecks.map(deck => <DeckRadar key={deck.id} deck={deck} priceIndex={priceIndex} />)}</div>
      </div>
    </section>
  );
}
