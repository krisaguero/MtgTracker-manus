import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Cloud,
  Database,
  FileSpreadsheet,
  GitBranch,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "wouter";

declare const __PRODUCTION_GIT_COMMIT_SHA__: string;

const productionCommitSha =
  typeof __PRODUCTION_GIT_COMMIT_SHA__ === "string"
    ? __PRODUCTION_GIT_COMMIT_SHA__
    : "";

const shippedItems = [
  // Keep the key storage terminology explicit for the roadmap contract: browser-dependent quotas.
  {
    title: "Q4 preorder risk monitoring",
    detail:
      "Product-level catalog for Star Trek Commander and Mystery Booster Commander Edition, release-risk dashboard, source-driven price coverage, volatility thresholds, marketplace links, no-chase guardrails, daily alert workflow, and weekly Q4 brief automation. Current seeded records intentionally remain awaiting retailer observations rather than inventing prices.",
  },
  {
    title: "ManaBox collection import and matching",
    detail:
      "Import a ManaBox CSV or text list, resolve printing matches, and use local ownership across set and Commander views. Collection rows stay in this browser unless a user separately chooses the manual backup flow.",
  },
  {
    title: "Collection and Commander workspace",
    detail:
      "Set goals, exact-variant wishlists, duplicate/trade piles, Commander Passport records, saved precon lists, duel inventories, valuation history, and deck workshop tools are available locally. Continuous account sync is not enabled.",
  },
  {
    title: "Retro Battle Box and Brawlternatives",
    detail:
      "The non-Commander 9-deck Battle Box includes local inventory queues and print/CSV export. Brawlternatives are separate, non-tuned Commander-preview concepts—not official Magic Brawl—and keep scan-derived ownership out of public data.",
  },
  {
    title: "Source-dated public market research",
    detail:
      "Browse historical mover rows, dated research reports, official product announcements, and the MTGJSON Commander price index with source dates and coverage counts. These static snapshots are not live quotes.",
  },
  {
    title: "Private mover watchlist",
    detail:
      "Star cards in the imported market snapshot and revisit a personal watchlist stored in this browser; it is not currently shared with other users.",
  },
];

const privateDataBoundaryItems = [
  "Collection rows, scans, order/proxy queues, and other user-specific records are not part of the public market datasets or static site bundles. Local workspace features remain browser-based by default.",
  "BYOK keys are session-scoped and are not embedded in public data. AI generation requires the user to opt in and explicitly generate; collection card names are not sent in that provider request.",
  "Optional Supabase workspace backup is separate, off by default, and transfers data only after a user signs in and presses a backup or restore action. This release does not change its behavior or Supabase settings/schema.",
  "The existing signed-in import flow may send a minimal import fingerprint/count record; it does not upload collection card rows. This release leaves that endpoint behavior unchanged.",
  "The new public Market Watch snapshot contains only dated research, exact-printing signal fields, official announcements, review outcomes, and public citations. Workspace IDs, relations, and personal records are excluded.",
];

const plannedItems = [
  {
    title: "Connect retailer observation adapters",
    detail:
      "The catalog and scoring layer are live, but retailer observations are not fabricated. Next implementation phase: add approved source adapters or authenticated feeds for product-level prices, availability, regional status, and completed-sales evidence.",
  },
  {
    title: "Persist alert lifecycle and prediction outcomes",
    detail:
      "Extend the append-only research ledger with detected, acknowledged, reviewed, resolved, and false-positive states, then link product alerts to weekly reports and prediction reviews.",
  },
  {
    title: "Production notification delivery",
    detail:
      "The GitHub workflows support optional webhook delivery through repository secrets. Email, Discord, or Slack delivery still requires a configured destination and should be enabled only after the user chooses the channel.",
  },
  {
    title: "Shared Battle Box review & publishing backend",
    detail:
      "Before any user-submitted build appears to other visitors, design and explicitly authorize a dedicated shared review/publishing backend with validation, moderation, privacy rules, and an attribution workflow. Builds may be featured or remixed only with visible author/source credit, and remixes must preserve the original author’s credit. The current form only saves a private browser draft or exports JSON; it does not publish. Supabase settings and schema are unchanged for this static feature.",
  },
  {
    title: "Expand Brawlternatives",
    detail:
      "The local Brawlternatives prototype starts with two precon-themed Commander-preview concepts. Future additions should be user-supplied, retain non-tuned/half-built status, and receive count, card-name, color-identity, and legality review. This custom alternative is not official Magic Brawl; the 2026 Retro Battle Box remains a separate non-Commander 1v1 set.",
  },
  {
    title: "More collection import formats",
    detail:
      "Add source-specific adapters for other exports (candidate sources include Moxfield, Archidekt, and Deckbox), with a mapping preview, clear parse errors, duplicate handling, and printing-level matching. These are ideas, not supported imports today.",
  },
  {
    title: "Large-collection storage that can grow",
    detail:
      "Move larger browser-local workspaces from localStorage to IndexedDB, handle quota errors explicitly, and benchmark real export files before setting supported collection sizes.",
  },
  {
    title: "Managed account sync beyond manual backup",
    detail:
      "The app offers a separate, opt-in manual Supabase backup; it does not continuously sync. Any future sync experience needs explicit consent, export, conflict handling, deletion and retention rules, and a local-only mode. Signing in must never silently upload a collection.",
  },
  {
    title: "Community watchlist, without public user profiles",
    detail:
      "Let users separately opt in to anonymous card-level watch signals. Show aggregate watcher counts and changes over time—not usernames, personal watchlists, collection contents, or who owns a card.",
  },
];

const ecosystemBuildQueue = [
  { title: "Sealed precon ownership graph", detail: "Connect sealed product records to expected deck contents, then track sealed, opened, partially reconciled, and fully reconciled states without conflating them with scanned ownership." },
  { title: "Exact-printing confidence queue", detail: "Route ambiguous scans and name-only imports through a review queue that records set, collector number, finish, language, condition, and confidence before committing a card identity." },
  { title: "Owned-aware upgrade planner", detail: "Label recommendations as already owned, in another deck, inside sealed product, missing, or candidate, then calculate incremental purchase cost rather than replacement cost." },
  { title: "Physical transfer optimizer", detail: "Allocate copies among decks, binders, trade, sale, and precon-derived stock while protecting only copies and preserving reversible transfer history." },
  { title: "Market and decision audit trail", detail: "Attach source, timestamp, exact printing, freshness, confidence, and user overrides to prices, signals, recommendations, and prediction outcomes." },
  { title: "Progressive inventory workspace", detail: "Keep the first view focused on owned, missing, sealed, scanned, allocated, and next action; reveal printing, location, condition, and provenance only when expanded." },
  { title: "Scanner-agnostic intake hub", detail: "Support ManaBox, Dragon Shield, Delver Lens, TCGplayer, CSV, text, and decklist inputs through previewable adapters with parse, duplicate, and metadata-loss reports." },
  { title: "Precon upgrade and substitution ledger", detail: "Version upgrade plans against a specific product and inventory snapshot, tracking added, cut, borrowed, substituted, purchased, returned, and reverted cards." },
  { title: "Transfer-first procurement planner", detail: "Check internal copies, inactive decks, duplicates, and unopened products before producing marketplace purchase links or seller/cart comparisons." },
  { title: "Privacy-aware sharing and export", detail: "Offer read-only deck, precon, inventory, missing-card, and research links with controls for hiding quantity, location, acquisition cost, and valuation." },
  { title: "Three-ledger portfolio views", detail: "Keep acquisition cost, estimated current value, and deck/precon replacement cost visibly separate, with exact versus unresolved printing filters." },
  { title: "Import interoperability test harness", detail: "Show parsed, resolved, ambiguous, rejected, duplicate, and metadata-lost records for every supported source before the user commits an import." },
];

const buildTimeline = [
  {
    date: "Oct 31",
    commit: "94820ec → 00f97a1",
    title: "Collection intelligence became the foundation",
    detail: "Cross-precon coverage, conflict-aware workspace sync, automatic full-deck detection, and authoritative color identities turned the tracker from a card catalog into a collection-aware operating system.",
    status: "Shipped",
    href: "/precon-collection",
    label: "Open collection command center",
  },
  {
    date: "Nov 1",
    commit: "1937593 → e2d3151",
    title: "Invisible Woman became a real upgrade project",
    detail: "The Fantastic Four work gained a detailed Wall conversion path, card spotlight imagery, budget lanes, and an editorial explanation of why Invisible Woman wants toughness-based pressure rather than generic goodstuff.",
    status: "Shipped",
    href: "/blog/invisible-woman-build-the-wall",
    label: "Read the Invisible Woman article",
  },
  {
    date: "Nov 1",
    commit: "10d068b → 61ab8cb",
    title: "Transfers and announcements became repeatable workflows",
    detail: "The Simic/Dimir transfer optimizer, spoiler/precon announcement watcher, and cross-deck upgrade bridges established the next-action layer: move cards internally before buying more.",
    status: "Shipped",
    href: "/precon-portfolio",
    label: "Open the portfolio workspace",
  },
  {
    date: "Nov 2",
    commit: "dc36d49 → d6e6cc6",
    title: "Market Watch was compressed into a decision terminal",
    detail: "Recovered daily reports now feed weekly digests and a compact 25-mover terminal, replacing a long text wall with a surface for sorting, scanning, and drilling into history.",
    status: "Shipped",
    href: "/market-watch",
    label: "Open Market Watch",
  },
  {
    date: "Nov 2",
    commit: "c9e541b → 16b7a6a",
    title: "The deck-change loop reached testable 100-card diffs",
    detail: "The bridge planner now reserves source-deck copies, the final diff builder validates one- and two-commander products, and synthetic swaps can be run across the archived precon universe before a physical import.",
    status: "Shipped",
    href: "/precon-portfolio",
    label: "Run a deck diff simulation",
  },
  {
    date: "Next",
    commit: "Roadmap ECO-06",
    title: "Finish the scanner-agnostic intake hub",
    detail: "The next high-impact build is a single import preview for ManaBox and other deck/collection exports, with parse errors, duplicate handling, metadata-loss reporting, and exact-printing review before commit.",
    status: "Next build",
    href: "/collection",
    label: "Open collection intake",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">
      {children}
    </p>
  );
}

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-12">
          <SectionLabel>
            Product roadmap · build history through November 2, 2026
          </SectionLabel>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-6xl">
                Your collection, your choice to sync.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg">
                A transparent snapshot of what is live, how private data is
                handled, what has only been tested in staging, and what could
                come next.
              </p>
            </div>
            <div className="border-2 border-amber-500/70 bg-amber-500/5 p-3 sm:p-4">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Status boundary
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Production source commit:{" "}
                <code className="break-all font-mono text-foreground">
                  {productionCommitSha ||
                    "provided by the Vercel production build"}
                </code>
                . This release updates public roadmap and market-data
                disclosures only; it does not change user data, backup behavior,
                production records, or Supabase settings/schema.
              </p>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 font-mono text-[10px] font-black uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 border border-emerald-600/50 bg-emerald-600/5 px-3 py-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Live in production
            </span>
            <span className="inline-flex items-center gap-2 border border-amber-600/50 bg-amber-600/5 px-3 py-2 text-amber-700 dark:text-amber-400">
              <HardDrive className="h-3.5 w-3.5" /> Private data boundary
            </span>
            <span className="inline-flex items-center gap-2 border border-sky-600/50 bg-sky-600/5 px-3 py-2 text-sky-700 dark:text-sky-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Staging validation
            </span>
            <span className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Planned ideas
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-8 sm:py-10">
        <section aria-labelledby="progress-heading" className="border-2 border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel>Progress snapshot · source of truth</SectionLabel>
              <h2 id="progress-heading" className="mt-1 text-2xl font-black">What is live, next, and still being designed</h2>
            </div>
            <Link href="#implemented-heading" className="inline-flex items-center gap-2 border border-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground">Browse shipped work <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-3">
            <div className="bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Shipped surfaces</p><p className="mt-1 text-3xl font-black">{shippedItems.length}</p><p className="mt-1 text-xs text-muted-foreground">Available in production</p></div>
            <div className="bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Next proposals</p><p className="mt-1 text-3xl font-black">{plannedItems.length}</p><p className="mt-1 text-xs text-muted-foreground">Not promised or silently active</p></div>
            <div className="bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Ecosystem queue</p><p className="mt-1 text-3xl font-black">{ecosystemBuildQueue.length}</p><p className="mt-1 text-xs text-muted-foreground">Tracked ownership-layer items</p></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">The footer is intentionally quiet now. This page is where progress, implementation boundaries, history, privacy notes, and future work belong.</p>
        </section>

        <section aria-labelledby="timeline-heading" className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-primary" />
            <div>
              <SectionLabel>History · GitHub-backed milestones</SectionLabel>
              <h2 id="timeline-heading" className="mt-1 text-2xl font-black sm:text-3xl">How the tracker got here</h2>
            </div>
          </div>
          <p className="mb-6 max-w-4xl text-sm leading-6 text-muted-foreground">This is the working history behind the current product—not a list of disconnected ideas. Each milestone points to the live surface or article that explains what changed, while the final entry turns the next unfinished roadmap item into a concrete action.</p>
          <div className="relative space-y-4 border-l-2 border-primary/25 pl-5 sm:pl-7">
            {buildTimeline.map(item => <article key={`${item.date}-${item.title}`} className="relative border border-border bg-card p-4 sm:p-5"><span className="absolute -left-[29px] top-5 h-3 w-3 border-2 border-primary bg-background sm:-left-[37px]" aria-hidden="true" /><div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest"><span className="text-primary">{item.date}</span><span className="text-muted-foreground">{item.commit}</span><span className={`border px-2 py-1 ${item.status === 'Shipped' ? 'border-emerald-600/40 bg-emerald-600/5 text-emerald-700' : 'border-amber-600/40 bg-amber-600/5 text-amber-700'}`}>{item.status}</span></div><h3 className="mt-3 text-lg font-black sm:text-xl">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p><Link href={item.href} className="mt-4 inline-flex items-center gap-2 border border-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary hover:bg-primary hover:text-primary-foreground">{item.label} <ArrowRight className="h-3.5 w-3.5" /></Link></article>)}
          </div>
        </section>

        <section aria-labelledby="implemented-heading">
          <div className="mb-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <SectionLabel>Shipped · current production</SectionLabel>
              <h2 id="implemented-heading" className="mt-1 text-2xl font-black">
                Implemented checklist
              </h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {shippedItems.map(item => (
              <article
                key={item.title}
                className="border-2 border-border bg-card p-4 sm:p-5"
              >
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-4 border-l-2 border-amber-500 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Public market and roadmap files contain no user inventory, scans,
            order/proxy queues, BYOK keys, or workspace records. Collection rows
            stay browser-local by default; the separate manual backup and
            minimal signed-in import metadata are described below and are
            unchanged by this release.
          </p>
        </section>

        <section
          className="grid gap-6 lg:grid-cols-2"
          aria-label="Privacy boundary and staging status"
        >
          <article className="border-2 border-amber-600/50 bg-amber-600/5 p-4 sm:p-7">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              <div>
                <SectionLabel>Production privacy boundary</SectionLabel>
                <h2 className="mt-1 text-2xl font-black">
                  Private data stays out of public bundles
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The public site publishes shared card/product reference data and
              source-dated research—not personal workspace records.
              Browser-local defaults and existing explicit transfer paths are
              distinguished below.
            </p>
            <ul className="mt-4 space-y-3">
              {privateDataBoundaryItems.map(item => (
                <li key={item} className="flex gap-3 text-sm leading-6">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Browser storage is not encrypted and can be removed by browser
              cleanup. A backup file can contain personal inventory details, so
              keep it private.
            </p>
          </article>

          <article className="border-2 border-sky-600/50 bg-sky-600/5 p-4 sm:p-7">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-sky-700 dark:text-sky-400" />
              <div>
                <SectionLabel>Staging only · synthetic data</SectionLabel>
                <h2 className="mt-1 text-2xl font-black">
                  Cloud ownership checks
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A separate approved Supabase staging project has a four-table
              collections/decks schema with row-level security and synthetic
              fixtures. All 38 isolation checks passed.
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-3">
                <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" />
                <span>
                  Staging ownership policies are tested against cross-user
                  access; this is not a production launch.
                </span>
              </li>
              <li className="flex gap-3">
                <Database className="mt-1 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" />
                <span>
                  The populated production Supabase project is untouched. No
                  real user records or collection contents were copied to
                  staging.
                </span>
              </li>
              <li className="flex gap-3">
                <Cloud className="mt-1 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" />
                <span>
                  The organization is on Supabase Free; staging validation does
                  not establish production capacity or long-term cost.
                </span>
              </li>
            </ul>
          </article>
        </section>

        <section
          className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-8"
          aria-labelledby="csv-heading"
        >
          <div className="flex items-start gap-4">
            <FileSpreadsheet className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <SectionLabel>Answer · CSVs and data size</SectionLabel>
              <h2
                id="csv-heading"
                className="mt-2 text-2xl font-black sm:text-3xl"
              >
                Yes, it is feasible—and a card list is not inherently too much
                data.
              </h2>
              <p className="mt-4 max-w-5xl text-sm leading-7 text-muted-foreground sm:text-base">
                The right design is to read the CSV, show a preview, normalize
                card identity and quantity, then save structured card rows. Keep
                the original CSV on the user’s device and discard the parsed
                file buffer; it usually adds no value to retain a second copy.
                Other exporters can be added as separate import adapters because
                their column names and printing identifiers differ.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="border border-border bg-background p-4">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                    Today
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    The collection and personal mover watchlist use browser{" "}
                    <code>localStorage</code>, which has browser-dependent
                    quotas. That is fine for modest lists, but not a promise of
                    unlimited capacity.
                  </p>
                </div>
                <div className="border border-border bg-background p-4">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                    Scale up
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    For larger collections, use IndexedDB locally and store one
                    normalized row per printing/condition grouping. Test quota
                    behavior with real exports before publishing a size limit.
                  </p>
                </div>
                <div className="border border-border bg-background p-4">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                    If cloud sync is added
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    Sync selected structured rows only after an explicit opt-in.
                    Avoid raw CSV archives, card images, or duplicate price data
                    in each user’s collection.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Practical answer: typical collections are manageable when
                modeled as compact card records, but browser quota and the
                Supabase plan must be measured—not assumed. Local-first
                workspace tools are live; continuous account sync is not
                offered, while a separate manual backup remains optional and
                user-triggered.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="planned-heading">
          <div className="mb-4 flex items-center gap-3">
            <CircleDashed className="h-5 w-5 text-muted-foreground" />
            <div>
              <SectionLabel>Not implemented · proposals</SectionLabel>
              <h2 id="planned-heading" className="mt-1 text-2xl font-black">
                Future checklist
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {plannedItems.map((item, index) => (
              <article
                key={item.title}
                className="grid gap-3 border-2 border-border bg-card p-4 sm:grid-cols-[54px_minmax(0,1fr)] sm:items-start sm:p-6"
              >
                <div className="font-mono text-xl font-black text-primary">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-2 max-w-5xl text-sm leading-6 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="ecosystem-build-heading" className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <SectionLabel>New build queue · ecosystem expansion</SectionLabel>
              <h2 id="ecosystem-build-heading" className="mt-1 text-2xl font-black">The twelve-part ownership layer</h2>
            </div>
          </div>
          <p className="mb-5 max-w-4xl text-sm leading-6 text-muted-foreground">These are now the tracked build items for the broader ecosystem program. The first vertical slice—ownership graph, printing review queue, upgrade ledger, and transfer optimizer foundation—is in progress; later slices will land behind the same local-first privacy boundary.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {ecosystemBuildQueue.map((item, index) => <article key={item.title} className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">ECO-{String(index + 1).padStart(2, '0')}</p><h3 className="mt-2 font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p></article>)}
          </div>
        </section>

        <section
          className="border-2 border-border bg-card p-4 sm:p-8"
          aria-labelledby="community-heading"
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <SectionLabel>Community watchlist · design idea</SectionLabel>
          </div>
          <h2
            id="community-heading"
            className="mt-2 text-2xl font-black sm:text-3xl"
          >
            Shared signal, not shared personal lists.
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
            A community view is possible as a separate opt-in. The safe version
            would count distinct opted-in users watching a card, publish only
            aggregate counts/trends, rate-limit changes, and suppress very small
            counts. Names, account IDs, collection ownership, and each person’s
            private watchlist would never appear in the public view. It should
            be clearly labeled as community attention—not a price forecast or
            buying recommendation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/movers"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground hover:opacity-90"
            >
              Open personal watchlist <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/collection"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary"
            >
              Collection tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          Roadmap status is a snapshot, not a delivery promise. Current
          production functionality is separated from private-data handling,
          synthetic staging validation, and future proposals. This release
          changes public copy and static market data only; it does not modify
          user records, backup behavior, or Supabase settings/schema.
        </footer>
      </main>
    </div>
  );
}
