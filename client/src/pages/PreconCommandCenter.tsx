import { Link } from 'wouter';
import { ArrowRight, BarChart3, BookOpen, Boxes, Compass, Layers3, Library, Radar as RadarIcon, Sparkles, WandSparkles } from 'lucide-react';

const destinations = [
      { href: '/precon-studio', icon: Boxes, eyebrow: 'Start here', title: 'Precon Studio', text: 'Unified browse, collect, upgrade, buy-next, and execution workflows for the precon portfolio.', accent: 'text-primary' },
  { href: '/precons', icon: Library, eyebrow: 'Browse', title: 'Precon Library', text: 'Search, sort, paginate, inspect commanders, track acquisitions, and compare regular versus collector editions.', accent: 'text-cyan-600' },
  { href: '/precons#precon-color-barometer', icon: Compass, eyebrow: 'Understand', title: 'Color Barometer', text: 'See pair coverage separately from mono-color, tri-color, four-color, five-color, partner, and colorless identities.', accent: 'text-emerald-600' },
  { href: '/collection', icon: Boxes, eyebrow: 'Connect', title: 'Collection & Inventory', text: 'Use acquired precons and ManaBox cards as two layers: sealed ownership plus card-level deck completion.', accent: 'text-amber-600' },
  { href: '/commander', icon: Layers3, eyebrow: 'Compare', title: 'Commander Archive', text: 'Move from a release overview into a specific decklist only when you are ready for card-level detail.', accent: 'text-violet-600' },
  { href: '/commander-market', icon: BarChart3, eyebrow: 'Value', title: 'Commander Market', text: 'Review exact-printing coverage and market context without crowding the browse experience.', accent: 'text-rose-600' },
  { href: '/blog', icon: BookOpen, eyebrow: 'Learn', title: 'Upgrade Journal', text: 'Read set-specific strategy primers, upgrade paths, sourced EDHREC context, and market-aware build notes.', accent: 'text-blue-600' },
];

const transferIdeas = [
  { title: 'Avengers Assemble → Fantastic Four', text: 'Treat owned Marvel cards as a shared pool. Move artifact ramp, legendary support, and flexible interaction into the Fantastic Four shell before buying duplicate staples.' },
  { title: 'Breed Lethality → blue splash lab', text: 'Use the graveyard and sacrifice core as a base, then test blue for card selection, stack interaction, and recursion rather than rebuilding from zero.' },
  { title: 'Owned cards → upgrade radar', text: 'A card already present in ManaBox is a free upgrade candidate. The site should distinguish “own,” “partial,” and “buy next” instead of treating every recommendation as a purchase.' },
];

export default function PreconCommandCenter() {
  return (
    <main className="container py-8 sm:py-12">
      <header className="border-2 border-primary bg-primary/5 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Precon command center</p><h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">One place to decide what to browse, build, buy, and move.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">The archive is the source layer. The command center is the map. Start with a short route, then open the deeper decklist, collection, market, or upgrade view only when it helps answer the next question.</p></div>
          <RadarIcon className="h-12 w-12 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-6 flex flex-wrap gap-2"><Link href="/precons" className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Open precon library <ArrowRight className="h-4 w-4" /></Link><Link href="/collection" className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold">Open collection</Link></div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Precon destinations">{destinations.map(({ href, icon: Icon, eyebrow, title, text, accent }) => <Link key={href} href={href} className="group border-2 border-border bg-card p-4 transition-colors hover:border-primary"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{eyebrow}</p><h2 className="mt-2 text-lg font-black">{title}</h2></div><Icon className={`h-5 w-5 ${accent}`} /></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-widest text-primary">Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}</section>

      <section className="mt-8 border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="transfer-lab"><div className="flex items-center gap-2"><WandSparkles className="h-5 w-5 text-primary" /><h2 id="transfer-lab" className="text-2xl font-black">Deck-to-deck transfer lab</h2></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">This is the connective tissue between your owned precons and future builds. It should answer: “What can I move from a deck I already own into this one, and what new function does that unlock?”</p><div className="mt-5 grid gap-3 md:grid-cols-3">{transferIdeas.map((idea) => <article key={idea.title} className="border border-border bg-background p-4"><h3 className="font-bold">{idea.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{idea.text}</p></article>)}</div><details className="mt-5 border border-border bg-background p-4"><summary className="cursor-pointer font-mono text-xs font-black uppercase tracking-widest">How the future deck lab should work</summary><div className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-3"><p><strong className="text-foreground">1. Select a target deck.</strong> Choose Fantastic Four, Breed Lethality, or any archived precon.</p><p><strong className="text-foreground">2. Match your inventory.</strong> Separate exact-printing owned cards from cards only present in another sealed deck.</p><p><strong className="text-foreground">3. Preview the result.</strong> Show swaps, unlocked themes, missing cards, and an upgrade route before saving.</p></div></details></section>

      <section className="mt-8 grid gap-3 md:grid-cols-3"><div className="border border-border bg-primary/5 p-4"><Sparkles className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black">Set-specific writing</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Every precon should have a short synopsis, commander plan, play-pattern notes, and upgrades that refer to its actual set mechanics—not generic MTGJSON boilerplate.</p></div><div className="border border-border bg-amber-500/5 p-4"><BookOpen className="h-5 w-5 text-amber-600" /><h2 className="mt-3 font-black">Visible upgrades</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Keep the first screen concise, then expose EDHREC-sourced power additions, budget swaps, and owned-card matches in a dedicated upgrade panel or modal.</p></div><div className="border border-border bg-emerald-500/5 p-4"><Boxes className="h-5 w-5 text-emerald-600" /><h2 className="mt-3 font-black">Two inventory layers</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Acquired precons track sealed ownership and cost basis. ManaBox tracks individual cards. Automatic completion connects the two without confusing them.</p></div></section>
    </main>
  );
}
