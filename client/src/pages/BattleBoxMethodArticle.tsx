import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, ClipboardList, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

const deckNotes = [
  ['Goblin Cavalcade', 'Mono-red swarm · cheap attackers and attack-triggered pressure'],
  ['Kavu Beastmaster', 'RG midrange · Invasion / Planeshift callback'],
  ['Oldschool Zombie Tribal', 'Mono-black attrition · recursion and tribal payoffs'],
  ['Lightning Burn', 'Direct damage · spell pressure and prowess'],
  ['RG Eldrazi Ramp & Stompy', 'Ramp into colorless finishers · explicitly no Elves'],
  ['Theros Boros Soldiers', 'Heroic / formation aggro · board-wide payoff turns'],
  ['Azorius Control', 'UW draw-go · countermagic, sweepers, and finishers'],
  ['Simic Evasive Tempo & Midrange', 'UG flyers and bounce · tempo into value'],
  ['Mono-White Lifegain & Sunbond Heroic', 'White lifegain and heroic aura counters · optional house-rule overlay is separate'],
];

export default function BattleBoxMethodArticle() {
  useEffect(() => {
    document.title = 'How the Retro 9-Deck Battle Box Was Built | MTG Sets Tracker';
    const description = 'A transparent build record for the retro nine-deck, 60-card Magic Battle Box: design method, inventory privacy, validation, proxy queue, and limitations.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = description;
    return () => { if (created && meta?.parentNode) meta.parentNode.removeChild(meta); };
  }, []);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link href="/battle-box" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to the Battle Box</Link>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Build record · 2026</span>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-14">
      <article>
        <div className="max-w-4xl border-l-4 border-primary pl-5 sm:pl-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary">Method, checks &amp; limitations</p>
          <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">From inventory to a retro 9-deck Battle Box</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">This page records how the supplied lists became a browsable build, what the data checks confirm, and what still needs human playtesting. The adjacent builder is the output: deck layouts, complete lists, and a private order/proxy queue.</p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/battle-box" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground hover:opacity-90">Open the 9-deck output <ArrowRight className="h-4 w-4" /></Link>
          <a href="https://youtu.be/sBOU-dB3Qfg?si=aozGgmCvDoDKa1cu" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">Eternal Durdles reference video</a>
        </div>

        <section className="mt-10 grid gap-3 sm:grid-cols-3" aria-label="Build totals">
          {[['9', 'separate duel decks'], ['540', 'cards in the supplied lists'], ['60', 'cards per deck']].map(([value, label]) => <div key={label} className="border-2 border-border bg-card p-5"><strong className="block text-4xl font-black text-primary">{value}</strong><span className="mt-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span></div>)}
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8 text-[15px] leading-7">
            <section>
              <h2 className="text-2xl font-black">The goal: pick up and play</h2>
              <p className="mt-3">The starting point was a self-contained set of distinct, non-Commander 60-card constructed decks: keep the choice of game simple, preserve different Magic eras and recognizable plans, and make a ready-to-play box rather than asking players to draft or dismantle Commander decks. The eight original lists cover Goblin swarm, Kavu midrange, Zombie attrition, burn, green-red Eldrazi ramp, Theros-themed Soldiers, Azorius control, and Simic tempo. Deck 9 adds mono-white lifegain and heroic auras.</p>
              <p className="mt-3">The source discusses working from two personal inventory exports. Those records are not part of this public page or its static data. Inventory matching here reads only a collection already saved in this browser or files the visitor chooses to load; selected files are parsed in memory for this tab and are not uploaded or saved. When multiple scans are selected, visitors choose whether to deduplicate overlapping records (default: maximum quantity per matching printing) or add them as separate piles.</p>
            </section>
            <section>
              <h2 className="text-2xl font-black">The repeatable method</h2>
              <ol className="mt-4 space-y-4">
                <li className="flex gap-3"><span className="font-mono font-black text-primary">01</span><span><strong>Choose distinct plans.</strong> Keep a defined job for each deck—swarm, attrition, ramp, control, or tempo—so the box offers meaningful choices.</span></li>
                <li className="flex gap-3"><span className="font-mono font-black text-primary">02</span><span><strong>Build to a fixed size.</strong> Keep each supplied list at 60 cards and separate its nonland groups from its lands for quick assembly and review.</span></li>
                <li className="flex gap-3"><span className="font-mono font-black text-primary">03</span><span><strong>Cross-check inventory privately.</strong> Aggregate deck demand by card name, keep matched set/collector/Scryfall printing IDs visible locally, and track paper copies separately from proxies. For overlapping exports, deduplicate a matching printing by the larger quantity; choose add mode only when the files represent separate piles.</span></li>
                <li className="flex gap-3"><span className="font-mono font-black text-primary">04</span><span><strong>Mark gaps explicitly.</strong> Preserve the original <code>[PROXY]</code> annotations and compute additional shortages only when a visitor loads their own collection.</span></li>
                <li className="flex gap-3"><span className="font-mono font-black text-primary">05</span><span><strong>Playtest before calling it balanced.</strong> Rotate decks and pilots, log results, and change a few cards at a time. A coherent theme or matching deck size is not evidence of balanced matchups.</span></li>
              </ol>
            </section>
            <section>
              <h2 className="text-2xl font-black">The nine plans</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">{deckNotes.map(([name, text], index) => <div key={name} className="border border-border bg-card p-4"><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">0{index + 1}</span><h3 className="mt-1 font-black">{name}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div>
            </section>
          </div>
          <aside className="space-y-4">
            <div className="border-2 border-primary/40 bg-primary/5 p-5"><div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary"><ShieldCheck className="h-4 w-4" /> Local by design</div><p className="mt-3 text-sm leading-6">Static decklists are public build data. Collection quantities and printing details stay in the visitor’s browser. No inventory is sent to AI or a community endpoint by this feature.</p></div>
            <div className="border-2 border-amber-600/50 bg-amber-500/5 p-5"><div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400"><CircleAlert className="h-4 w-4" /> Source-count mismatch</div><p className="mt-3 text-sm leading-6">The original eight-list handoff claims 35 distinct proxy cards / 40 copies. Counting those lists’ actual <code>[PROXY]</code> lines gives <strong>21 distinct names / 62 copies</strong>. The builder preserves those original annotations and flags the mismatch; Deck 9 makes no scan-derived ownership or proxy claim.</p></div>
            <div className="border-2 border-amber-600/50 bg-amber-500/5 p-5"><div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400"><CircleAlert className="h-4 w-4" /> List review notes</div><ul className="mt-3 space-y-2 text-sm leading-6"><li>• The Goblin deck includes black <em>Shambling Goblin</em>.</li><li>• The Boros-labeled Soldiers list includes black <em>Bloodcrazed Hoplite</em> and <em>Alesha’s Vanguard</em>.</li><li>• Lightning Burn contains five <em>Monastery Swiftspears</em> (2 + 3 proxy-marked).</li><li>• Simic Tempo contains five <em>Peregrine Drakes</em> (1 + 4 proxy-marked).</li><li>• Deck 9’s source headings disagree with its quantities; the corrected categories are 20 creatures, 17 noncreature spells, and 23 Plains (60 total). <em>Heliod’s Pilgrim</em> is a creature.</li><li>• The attachment gives two different Celestial Resurgence triggers; the overlay calls out which wording it uses.</li></ul><p className="mt-3 text-xs leading-5 text-muted-foreground">The two original four-copy-limit notes remain source-list review flags. Deck 9’s category correction preserves every supplied quantity; other decklists are unchanged.</p></div>
          </aside>
        </div>

        <section className="mt-10 border-2 border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">What was verified—and what was not</h2></div>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div><h3 className="font-black">Checked</h3><ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground"><li>• The original eight lists total 480 cards; Deck 9 totals 60, for 540 across nine lists.</li><li>• Deck 9’s supplied card quantities add to 60. Its corrected sections are 20 creatures, 17 noncreature spells, and 23 lands; the source heading totals were inconsistent.</li><li>• Scryfall identifies <em>Heliod’s Pilgrim</em> as Creature — Human Cleric, so it belongs with the creatures.</li><li>• The original eight lists’ proxy lines total 62 copies across 21 card names; the handoff’s 35 / 40 summary does not match.</li><li>• The original 106 unique names were found with Scryfall name lookup; the split card <em>Assault // Battery</em> required the named-card endpoint rather than the collection batch.</li><li>• The five-copy Swiftspear line and color-label exceptions are shown without rewriting the original eight lists.</li></ul></div>
            <div><h3 className="font-black">Not claimed</h3><ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground"><li>• No complete inventory audit: the two provided scans are explicitly incomplete, and a count match is not proof of allocation.</li><li>• No proof of matchup balance or playtest results.</li><li>• No exact printing recommendation or purchase-price estimate in the public dataset.</li><li>• “Oldschool” in one deck title is a theme label, not a claim of formal Old School format legality.</li></ul></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Identity reference: <a className="underline decoration-primary underline-offset-2 hover:text-primary" href="https://scryfall.com/docs/api/cards/named" target="_blank" rel="noreferrer">Scryfall exact name lookup docs</a>. Four-copy context: <a className="underline decoration-primary underline-offset-2 hover:text-primary" href="https://magic.wizards.com/en/news/feature/four-kind-2016-08-11" target="_blank" rel="noreferrer">Wizards’ deckbuilding article</a>. These checks do not validate strategy or balance.</p>
        </section>

        <section className="mt-10 border-t-2 border-border pt-6">
          <div className="flex items-center gap-3"><ClipboardList className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Output and next steps</h2></div>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">The builder contains all nine lists, a private inventory-matching queue, print and CSV exports, and local-only community-build drafts. Optional proxy-print support is off by default and sends nothing to external services unless a visitor manually pastes or drops a selected list there. The Celestial Resurgence overlay is optional house-rule material, separate from Deck 9’s 60-card non-Commander list. Brawlternatives is a separate, custom collection of precon-themed Commander previews—an alternative to Brawl, not official Magic Brawl—and does not change this Retro Battle Box’s non-Commander identity.</p>
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/battle-box#deck-library" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground">Deck library <ArrowRight className="h-4 w-4" /></Link><Link href="/battle-box-proxy-print" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">Proxy-print how-to <ArrowRight className="h-4 w-4" /></Link><Link href="/roadmap#planned-heading" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary"><Sparkles className="h-4 w-4" /> Future work</Link><Link href="/roadmap#implemented-heading" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary"><Database className="h-4 w-4" /> Project record</Link></div>
        </section>
      </article>
    </main>
  </div>;
}
