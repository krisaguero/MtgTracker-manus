import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Package, ShieldAlert, Sparkles, Swords } from "lucide-react";
import { Link } from "wouter";
import { CardIndexLink } from "@/components/CardIndexLink";
import { MarketMoverCardArt } from "@/components/MarketMoverCardArt";

type CampaignCard = { name: string; qty: number; role?: string };
type CampaignDeck = {
  id: string;
  title: string;
  subtitle: string;
  colors: string;
  mission: string;
  note: string;
  cards: CampaignCard[];
  upgrades: Array<{ name: string; swap: string; reason: string; rarity: string }>;
};

const decks: CampaignDeck[] = [
  {
    id: "fleet",
    title: "The Fleet",
    subtitle: "All Hands to Stations",
    colors: "White / Blue · Spacecraft and enters-value",
    mission: "Establish a crew, get value from entering permanents, then bring your ships online.",
    note: "Keep early creatures alongside meaningful Spacecraft; avoid a hand full of ships with no crew.",
    cards: [
      { name: "Assembly Specialist", qty: 2 }, { name: "Andromedan Automatons", qty: 2 }, { name: "Emergency Medical Hologram", qty: 2 }, { name: "Interstellar Effigy", qty: 2 }, { name: "Suurok-Class Science Vessel", qty: 2 }, { name: "Oberth-Class Starship", qty: 2 }, { name: "Hemmer, Fixing What Is Broken", qty: 1 }, { name: "Constable Odo", qty: 1 }, { name: "Malfunctioning Holodeck", qty: 2 }, { name: "Command Decision", qty: 2 }, { name: "Guidance Failure", qty: 2 }, { name: "Make It So", qty: 1 }, { name: "Warp Core", qty: 1 }, { name: "Class-F Shuttlecraft", qty: 1 }, { name: "Plains", qty: 9, role: "land" }, { name: "Island", qty: 8, role: "land" },
    ],
    upgrades: [{ name: "Rutherford, Upgraded Ensign", swap: "Assembly Specialist", reason: "Card selection and additional Spacecraft value.", rarity: "Uncommon" }, { name: "Ghost of Illyria", swap: "Command Decision", reason: "Flying body plus another way to reuse enters effects.", rarity: "Uncommon" }, { name: "Scotty, Miracle Worker", swap: "Class-F Shuttlecraft", reason: "A spell-reuse direction; retest the mana rather than treating it as automatic.", rarity: "Mythic" }],
  },
  {
    id: "boarding-party",
    title: "Boarding Party",
    subtitle: "A Good Day to Trade",
    colors: "Black / Red · Klingons, sacrifice, and death value",
    mission: "Attack early, make trades uncomfortable, and turn expendable bodies into additional resources.",
    note: "If the removal package repeatedly dismantles the other decks, exchange one removal spell for a modest creature.",
    cards: [
      { name: "Battle-Scarred Survivalist", qty: 2 }, { name: "Starfleet Security", qty: 2 }, { name: "Dahar Master", qty: 2 }, { name: "Savvy Profiteer", qty: 2 }, { name: "Cha'DIch Investigator", qty: 2 }, { name: "Fugitive Listener", qty: 2 }, { name: "The Duras Sisters", qty: 1 }, { name: "L'Rell, Fierce Visionary", qty: 1 }, { name: "Eject the Warp Core", qty: 2 }, { name: "He's Dead, Jim", qty: 2 }, { name: "Plasma Cascade", qty: 2 }, { name: "Planetary Bombardment", qty: 1 }, { name: "A Good Day to Die", qty: 1 }, { name: "Pattern Buffer Preservation", qty: 1 }, { name: "Swamp", qty: 9, role: "land" }, { name: "Mountain", qty: 8, role: "land" },
    ],
    upgrades: [{ name: "D'Ghor Bloodletter", swap: "Dahar Master", reason: "Supports Klingon and death synergies.", rarity: "Uncommon" }, { name: "Khan, Despot by Design", swap: "Battle-Scarred Survivalist", reason: "A larger threat whose enters effect can punish small creatures.", rarity: "Uncommon" }, { name: "General Chang, Cold Warrior", swap: "Dahar Master", reason: "Test the combat/sacrifice direction; rarity alone is not a reason to add it.", rarity: "Rare" }],
  },
  {
    id: "anomaly",
    title: "The Anomaly",
    subtitle: "Nothing Stays Buried",
    colors: "Black / Green · Graveyard value and recovery",
    mission: "Fill the graveyard, recover useful cards, and reward cards leaving it.",
    note: "Protect the engine from early pressure and avoid adding more expensive cards until the curve has been tested.",
    cards: [
      { name: "Xenobotanist", qty: 2 }, { name: "Temporal Conqueror", qty: 2 }, { name: "Dominion Assault Force", qty: 2 }, { name: "Fugitive Listener", qty: 2 }, { name: "Battle-Scarred Survivalist", qty: 2 }, { name: "Vash, Freelance Archaeologist", qty: 1 }, { name: "Daniels, Temporal Agent", qty: 1 }, { name: "Hologram Stalker", qty: 1 }, { name: "Cybernetic Specialist", qty: 1 }, { name: "Pattern Buffer Preservation", qty: 2 }, { name: "He's Dead, Jim", qty: 2 }, { name: "Common Goal", qty: 2 }, { name: "First Contact", qty: 1 }, { name: "Warp Core", qty: 1 }, { name: "Eject the Warp Core", qty: 1 }, { name: "Forest", qty: 9, role: "land" }, { name: "Swamp", qty: 8, role: "land" },
    ],
    upgrades: [{ name: "Vash, Freelance Archaeologist", swap: "—", reason: "Already included; prioritize finding the first copy.", rarity: "Uncommon" }, { name: "Hologram Stalker", swap: "—", reason: "Already included; consider a second only after testing.", rarity: "Uncommon" }, { name: "Daniels, Temporal Agent", swap: "—", reason: "Keep the hybrid signpost rather than replacing it reflexively.", rarity: "Uncommon" }],
  },
  {
    id: "strange-new-worlds",
    title: "Strange New Worlds",
    subtitle: "The Long Way Home",
    colors: "Green / Blue · Differently named lands and late-game value",
    mission: "Develop mana, diversify land names, and turn that setup into efficient payoffs.",
    note: "The two Planet slots are deliberate named-land slots. Basic-only substitutions weaken the central plan.",
    cards: [
      { name: "Xenobotanist", qty: 2 }, { name: "Astute Terraformer", qty: 2 }, { name: "Dominion Assault Force", qty: 2 }, { name: "Interstellar Effigy", qty: 2 }, { name: "The Traveler", qty: 1 }, { name: "D'Vana Tendi, Optimistic Ensign", qty: 1 }, { name: "Hologram Stalker", qty: 1 }, { name: "U.S.S. Voyager, Lone Wanderer", qty: 1 }, { name: "Final Frontier", qty: 2 }, { name: "Common Goal", qty: 2 }, { name: "Make It So", qty: 2 }, { name: "Cloak and Phaser", qty: 1 }, { name: "Warp Speed", qty: 1 }, { name: "Guidance Failure", qty: 1 }, { name: "Warp Core", qty: 1 }, { name: "Class-F Shuttlecraft", qty: 1 }, { name: "Forest", qty: 8, role: "land" }, { name: "Island", qty: 7, role: "land" }, { name: "Planet land slot · green", qty: 1, role: "named land" }, { name: "Planet land slot · blue", qty: 1, role: "named land" },
    ],
    upgrades: [{ name: "David and Carol Marcus, Creators", swap: "Dominion Assault Force", reason: "Adds ramp, fixing, and another Planet to the plan.", rarity: "Uncommon" }, { name: "V'Ger, the Intruder", swap: "Hologram Stalker", reason: "Evasive top end with immediate value; do not add it on top of every expensive card.", rarity: "Uncommon" }, { name: "Seven of Nine, Unassimilated", swap: "Interstellar Effigy", reason: "A payoff for leaning into differently named worlds.", rarity: "Mythic" }],
  },
];

function DeckCard({ card }: { card: CampaignCard }) {
  const placeholder = card.name.startsWith("Planet land slot");
  return <article className="min-w-0 border border-border bg-card p-2.5"><div className="relative mx-auto w-fit">{placeholder ? <div className="flex h-40 w-28 items-center justify-center border border-dashed border-primary bg-primary/5 p-2 text-center font-mono text-[9px] font-black uppercase text-primary">Choose an opened Planet land</div> : <MarketMoverCardArt name={card.name} size="small" className="h-40 w-28 sm:h-48 sm:w-32" />}<span className="absolute -right-2 -top-2 border-2 border-background bg-primary px-1.5 py-0.5 font-mono text-[10px] font-black text-primary-foreground">×{card.qty}</span></div><p className="mt-2 text-xs font-black leading-4">{card.name}</p><p className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">{card.role || "core card"}</p>{!placeholder && <CardIndexLink name={card.name} compact className="mt-2" />}</article>;
}

function UpgradeTray({ deck }: { deck: CampaignDeck }) {
  return <section className="mt-6 border-t-2 border-border pt-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">Optional character tray</p><h3 className="mt-1 text-xl font-black">Open a character, make one swap</h3></div><span className="font-mono text-[9px] uppercase text-muted-foreground">Keep separate from base deck</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{deck.upgrades.map(upgrade => <article key={upgrade.name} className="border border-border bg-background p-3"><div className="flex items-center justify-between gap-2"><span className="font-mono text-[9px] font-black uppercase text-primary">{upgrade.rarity}</span><span className="font-mono text-[9px] uppercase text-muted-foreground">optional</span></div><div className="mt-2 flex gap-3"><MarketMoverCardArt name={upgrade.name} size="small" /><div className="min-w-0"><h4 className="text-sm font-black leading-5">{upgrade.name}</h4><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Swap out {upgrade.swap}.</p></div></div><p className="mt-3 border-t border-border pt-2 text-xs leading-5 text-muted-foreground">{upgrade.reason}</p><CardIndexLink name={upgrade.name} compact className="mt-2" /></article>)}</div></section>;
}

export function StarTrekCampaignBox() {
  const [activeDeck, setActiveDeck] = useState("fleet");
  const [completed, setCompleted] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);
  const current = decks.find(deck => deck.id === activeDeck) || decks[0];
  const sharedNames = useMemo(() => { const counts = new Map<string, number>(); for (const deck of decks) for (const card of deck.cards) if (!card.role?.includes("land")) counts.set(card.name, (counts.get(card.name) || 0) + card.qty); return Array.from(counts.entries()).filter(([, count]) => count > 2); }, []);
  const toggleCompleted = (id: string) => setCompleted(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  return <div className="min-h-screen bg-background text-foreground"><header className="border-b-2 border-border bg-card"><div className="mx-auto max-w-7xl px-4 py-7 sm:px-8"><Link href="/market-watch" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Market watch</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Separate collection lab · Star Trek</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">Four-Deck Campaign Box</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">A commons-and-uncommons-first quasi Battle Box: four independent 40-card decks, optional character upgrades, and a small progression tray for cards you open later.</p></div><Package className="h-12 w-12 text-primary" aria-hidden="true" /></div><div className="mt-6 flex flex-wrap gap-2"><span className="border border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground">4 decks · 40 cards each</span><span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase">23 nonlands · 17 lands</span><span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase">Rare-free base lists</span></div></div></header><main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-8"><section className="border-l-4 border-amber-500 bg-amber-500/5 p-4 sm:p-5"><p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Sample constructed-from-pulls lists</p><p className="mt-2 text-sm leading-6 text-muted-foreground">These are untested sample brews inspired by Wizards' published archetypes and Limited coverage. They are not official decklists, and one booster box is not guaranteed to contain every listed copy. Substitute within the card's role when your pulls differ.</p></section><section className="grid gap-2 border-2 border-border bg-card p-2 sm:grid-cols-4" aria-label="Campaign deck selector">{decks.map(deck => <button key={deck.id} type="button" onClick={() => setActiveDeck(deck.id)} className={`min-h-16 border-2 px-3 py-3 text-left ${activeDeck === deck.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent hover:border-primary"}`}><span className="block font-mono text-[10px] font-black uppercase tracking-widest opacity-75">{deck.colors}</span><span className="mt-1 block text-sm font-black">{deck.title}</span><span className="mt-1 block text-xs opacity-75">{deck.subtitle}</span></button>)}</section><section className="border-2 border-border bg-card p-5 sm:p-7" id={`campaign-${current.id}`}><div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Episode {decks.findIndex(deck => deck.id === current.id) + 1} · base deck</p><h2 className="mt-1 text-3xl font-black">{current.title}: {current.subtitle}</h2><p className="mt-1 text-sm font-bold text-muted-foreground">{current.colors}</p></div><button type="button" onClick={() => toggleCompleted(current.id)} className={`inline-flex items-center gap-2 border-2 px-3 py-2 font-mono text-[10px] font-black uppercase ${completed.includes(current.id) ? "border-emerald-600 bg-emerald-600 text-white" : "border-border hover:border-primary"}`}>{completed.includes(current.id) ? <Check className="h-3 w-3" /> : null}{completed.includes(current.id) ? "Tested" : "Mark tested"}</button></div><p className="mt-5 max-w-4xl text-base leading-7"><strong>Mission:</strong> {current.mission}</p><p className="mt-3 border-l-2 border-primary pl-3 text-sm leading-6 text-muted-foreground">{current.note}</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{current.cards.map(card => <DeckCard key={card.name} card={card} />)}</div><UpgradeTray deck={current} /></section><section className="border-2 border-border bg-card p-5 sm:p-7"><button type="button" onClick={() => setShowRules(prev => !prev)} className="flex w-full items-center justify-between text-left"><span><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">Campaign rules</p><h2 className="mt-1 text-2xl font-black">Build, test, then open one episode upgrade</h2></span><ChevronDown className={`h-5 w-5 transition-transform ${showRules ? "rotate-180" : ""}`} /></button>{showRules && <div className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2"><ul className="space-y-2"><li><strong className="text-foreground">Base box:</strong> zero rares or mythics, 40 cards, generally two colors, and duplicates capped at two.</li><li><strong className="text-foreground">Substitute:</strong> preserve early plays, core enablers, interaction, then role-equivalent payoffs.</li><li><strong className="text-foreground">Guest stars:</strong> add at most one rare or mythic after testing, and keep that version separate.</li></ul><ul className="space-y-2"><li><strong className="text-foreground">Solo pairs:</strong> Fleet versus Boarding Party, then Anomaly versus Strange New Worlds.</li><li><strong className="text-foreground">Record:</strong> did the deck enact its theme, which card was awkward, and which single swap makes the next game more interesting?</li><li><strong className="text-foreground">Copy conflicts:</strong> do not buy extra copies just to match the first draft.</li></ul></div>}</section><section className="border-2 border-primary/30 bg-primary/5 p-5 sm:p-7"><div className="flex items-center gap-2"><Swords className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Shared-copy and upgrade tray</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">These names appear across base lists or are intended to stay outside the decks until you open them. Preserve the first three decks before chasing a fourth copy.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{sharedNames.map(([name, count]) => <div key={name} className="border border-border bg-card p-3"><p className="text-sm font-black">{name}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{count} requested across drafts</p><CardIndexLink name={name} compact className="mt-2" /></div>)}{["Rutherford / Ghost of Illyria", "D'Ghor / Khan", "David and Carol / V'Ger", "Rare guest stars"].map(name => <div key={name} className="border border-dashed border-primary bg-card p-3"><Sparkles className="h-4 w-4 text-primary" /><p className="mt-2 text-sm font-black">{name}</p><p className="mt-1 text-xs text-muted-foreground">Keep outside the base decks as an optional episode upgrade.</p></div>)}</div></section><footer className="border-t-2 border-border pt-5 text-xs leading-5 text-muted-foreground"><p><strong className="text-foreground">Separate from the market radar:</strong> this page is a playtesting and collection-construction lab, not a price recommendation or official precon archive entry.</p><p className="mt-2">Archetype references: Wizards' Star Trek Prerelease Guide and cited Limited reviews supplied with the campaign brief.</p></footer></main></div>;
}

export default StarTrekCampaignBox;
