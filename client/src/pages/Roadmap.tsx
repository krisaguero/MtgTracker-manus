import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Cloud,
  Database,
  FileSpreadsheet,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'wouter';

declare const __PRODUCTION_GIT_COMMIT_SHA__: string;

const productionCommitSha = typeof __PRODUCTION_GIT_COMMIT_SHA__ === 'string'
  ? __PRODUCTION_GIT_COMMIT_SHA__
  : '';

const shippedItems = [
  {
    title: 'ManaBox collection import and matching',
    detail: 'Import a ManaBox CSV or text list, resolve printing matches, and use local ownership across set and Commander views. Collection rows stay in this browser unless a user separately chooses the manual backup flow.',
  },
  {
    title: 'Collection and Commander workspace',
    detail: 'Set goals, exact-variant wishlists, duplicate/trade piles, Commander Passport records, saved precon lists, duel inventories, valuation history, and deck workshop tools are available locally. Continuous account sync is not enabled.',
  },
  {
    title: 'Retro Battle Box and Brawlternatives',
    detail: 'The non-Commander 9-deck Battle Box includes local inventory queues and print/CSV export. Brawlternatives are separate, non-tuned Commander-preview concepts—not official Magic Brawl—and keep scan-derived ownership out of public data.',
  },
  {
    title: 'Source-dated public market research',
    detail: 'Browse historical mover rows, dated research reports, official product announcements, and the MTGJSON Commander price index with source dates and coverage counts. These static snapshots are not live quotes.',
  },
  {
    title: 'Private mover watchlist',
    detail: 'Star cards in the imported market snapshot and revisit a personal watchlist stored in this browser; it is not currently shared with other users.',
  },
];

const privateDataBoundaryItems = [
  'Collection rows, scans, order/proxy queues, and other user-specific records are not part of the public market datasets or static site bundles. Local workspace features remain browser-based by default.',
  'BYOK keys are session-scoped and are not embedded in public data. AI generation requires the user to opt in and explicitly generate; collection card names are not sent in that provider request.',
  'Optional Supabase workspace backup is separate, off by default, and transfers data only after a user signs in and presses a backup or restore action. This release does not change its behavior or Supabase settings/schema.',
  'The existing signed-in import flow may send a minimal import fingerprint/count record; it does not upload collection card rows. This release leaves that endpoint behavior unchanged.',
  'The new public Market Watch snapshot contains only dated research, exact-printing signal fields, official announcements, review outcomes, and public citations. Workspace IDs, relations, and personal records are excluded.',
];

const plannedItems = [
  {
    title: 'Shared Battle Box review & publishing backend',
    detail: 'Before any user-submitted build appears to other visitors, design and explicitly authorize a dedicated shared review/publishing backend with validation, moderation, privacy rules, and an attribution workflow. Builds may be featured or remixed only with visible author/source credit, and remixes must preserve the original author’s credit. The current form only saves a private browser draft or exports JSON; it does not publish. Supabase settings and schema are unchanged for this static feature.',
  },
  {
    title: 'Expand Brawlternatives',
    detail: 'The local Brawlternatives prototype starts with two precon-themed Commander-preview concepts. Future additions should be user-supplied, retain non-tuned/half-built status, and receive count, card-name, color-identity, and legality review. This custom alternative is not official Magic Brawl; the 2026 Retro Battle Box remains a separate non-Commander 1v1 set.',
  },
  {
    title: 'More collection import formats',
    detail: 'Add source-specific adapters for other exports (candidate sources include Moxfield, Archidekt, and Deckbox), with a mapping preview, clear parse errors, duplicate handling, and printing-level matching. These are ideas, not supported imports today.',
  },
  {
    title: 'Large-collection storage that can grow',
    detail: 'Move larger browser-local workspaces from localStorage to IndexedDB, handle quota errors explicitly, and benchmark real export files before setting supported collection sizes.',
  },
  {
    title: 'Managed account sync beyond manual backup',
    detail: 'The app offers a separate, opt-in manual Supabase backup; it does not continuously sync. Any future sync experience needs explicit consent, export, conflict handling, deletion and retention rules, and a local-only mode. Signing in must never silently upload a collection.',
  },
  {
    title: 'Community watchlist, without public user profiles',
    detail: 'Let users separately opt in to anonymous card-level watch signals. Show aggregate watcher counts and changes over time—not usernames, personal watchlists, collection contents, or who owns a card.',
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">{children}</p>;
}

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-12">
          <SectionLabel>Product roadmap · reviewed October 16, 2026</SectionLabel>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-6xl">Your collection, your choice to sync.</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg">
                A transparent snapshot of what is live, how private data is handled, what has only been tested in staging, and what could come next.
              </p>
            </div>
            <div className="border-2 border-amber-500/70 bg-amber-500/5 p-3 sm:p-4">
              <p className="font-mono text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Status boundary</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Production source commit: <code className="break-all font-mono text-foreground">{productionCommitSha || 'provided by the Vercel production build'}</code>. This release updates public roadmap and market-data disclosures only; it does not change user data, backup behavior, production records, or Supabase settings/schema.</p>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 font-mono text-[10px] font-black uppercase tracking-wider">
            <span className="inline-flex items-center gap-2 border border-emerald-600/50 bg-emerald-600/5 px-3 py-2 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Live in production</span>
            <span className="inline-flex items-center gap-2 border border-amber-600/50 bg-amber-600/5 px-3 py-2 text-amber-700 dark:text-amber-400"><HardDrive className="h-3.5 w-3.5" /> Private data boundary</span>
            <span className="inline-flex items-center gap-2 border border-sky-600/50 bg-sky-600/5 px-3 py-2 text-sky-700 dark:text-sky-400"><ShieldCheck className="h-3.5 w-3.5" /> Staging validation</span>
            <span className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-muted-foreground"><Sparkles className="h-3.5 w-3.5" /> Planned ideas</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-8 sm:py-10">
        <section aria-labelledby="implemented-heading">
          <div className="mb-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div><SectionLabel>Shipped · current production</SectionLabel><h2 id="implemented-heading" className="mt-1 text-2xl font-black">Implemented checklist</h2></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {shippedItems.map((item) => <article key={item.title} className="border-2 border-border bg-card p-4 sm:p-5">
              <h3 className="text-lg font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </article>)}
          </div>
          <p className="mt-4 border-l-2 border-amber-500 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Public market and roadmap files contain no user inventory, scans, order/proxy queues, BYOK keys, or workspace records. Collection rows stay browser-local by default; the separate manual backup and minimal signed-in import metadata are described below and are unchanged by this release.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2" aria-label="Privacy boundary and staging status">
          <article className="border-2 border-amber-600/50 bg-amber-600/5 p-4 sm:p-7">
            <div className="flex items-center gap-3"><HardDrive className="h-5 w-5 text-amber-700 dark:text-amber-400" /><div><SectionLabel>Production privacy boundary</SectionLabel><h2 className="mt-1 text-2xl font-black">Private data stays out of public bundles</h2></div></div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">The public site publishes shared card/product reference data and source-dated research—not personal workspace records. Browser-local defaults and existing explicit transfer paths are distinguished below.</p>
            <ul className="mt-4 space-y-3">
              {privateDataBoundaryItems.map((item) => <li key={item} className="flex gap-3 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" /><span>{item}</span></li>)}
            </ul>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Browser storage is not encrypted and can be removed by browser cleanup. A backup file can contain personal inventory details, so keep it private.</p>
          </article>

          <article className="border-2 border-sky-600/50 bg-sky-600/5 p-4 sm:p-7">
            <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-sky-700 dark:text-sky-400" /><div><SectionLabel>Staging only · synthetic data</SectionLabel><h2 className="mt-1 text-2xl font-black">Cloud ownership checks</h2></div></div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">A separate approved Supabase staging project has a four-table collections/decks schema with row-level security and synthetic fixtures. All 38 isolation checks passed.</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-3"><LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" /><span>Staging ownership policies are tested against cross-user access; this is not a production launch.</span></li>
              <li className="flex gap-3"><Database className="mt-1 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" /><span>The populated production Supabase project is untouched. No real user records or collection contents were copied to staging.</span></li>
              <li className="flex gap-3"><Cloud className="mt-1 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" /><span>The organization is on Supabase Free; staging validation does not establish production capacity or long-term cost.</span></li>
            </ul>
          </article>
        </section>

        <section className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-8" aria-labelledby="csv-heading">
          <div className="flex items-start gap-4">
            <FileSpreadsheet className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <SectionLabel>Answer · CSVs and data size</SectionLabel>
              <h2 id="csv-heading" className="mt-2 text-2xl font-black sm:text-3xl">Yes, it is feasible—and a card list is not inherently too much data.</h2>
              <p className="mt-4 max-w-5xl text-sm leading-7 text-muted-foreground sm:text-base">
                The right design is to read the CSV, show a preview, normalize card identity and quantity, then save structured card rows. Keep the original CSV on the user’s device and discard the parsed file buffer; it usually adds no value to retain a second copy. Other exporters can be added as separate import adapters because their column names and printing identifiers differ.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="border border-border bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Today</p><p className="mt-2 text-sm leading-6">The collection and personal mover watchlist use browser <code>localStorage</code>, which has browser-dependent quotas. That is fine for modest lists, but not a promise of unlimited capacity.</p></div>
                <div className="border border-border bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Scale up</p><p className="mt-2 text-sm leading-6">For larger collections, use IndexedDB locally and store one normalized row per printing/condition grouping. Test quota behavior with real exports before publishing a size limit.</p></div>
                <div className="border border-border bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">If cloud sync is added</p><p className="mt-2 text-sm leading-6">Sync selected structured rows only after an explicit opt-in. Avoid raw CSV archives, card images, or duplicate price data in each user’s collection.</p></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Practical answer: typical collections are manageable when modeled as compact card records, but browser quota and the Supabase plan must be measured—not assumed. Local-first workspace tools are live; continuous account sync is not offered, while a separate manual backup remains optional and user-triggered.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="planned-heading">
          <div className="mb-4 flex items-center gap-3"><CircleDashed className="h-5 w-5 text-muted-foreground" /><div><SectionLabel>Not implemented · proposals</SectionLabel><h2 id="planned-heading" className="mt-1 text-2xl font-black">Future checklist</h2></div></div>
          <div className="space-y-3">
            {plannedItems.map((item, index) => <article key={item.title} className="grid gap-3 border-2 border-border bg-card p-4 sm:grid-cols-[54px_minmax(0,1fr)] sm:items-start sm:p-6">
              <div className="font-mono text-xl font-black text-primary">0{index + 1}</div>
              <div><h3 className="text-lg font-black">{item.title}</h3><p className="mt-2 max-w-5xl text-sm leading-6 text-muted-foreground">{item.detail}</p></div>
            </article>)}
          </div>
        </section>

        <section className="border-2 border-border bg-card p-4 sm:p-8" aria-labelledby="community-heading">
          <div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><SectionLabel>Community watchlist · design idea</SectionLabel></div>
          <h2 id="community-heading" className="mt-2 text-2xl font-black sm:text-3xl">Shared signal, not shared personal lists.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">A community view is possible as a separate opt-in. The safe version would count distinct opted-in users watching a card, publish only aggregate counts/trends, rate-limit changes, and suppress very small counts. Names, account IDs, collection ownership, and each person’s private watchlist would never appear in the public view. It should be clearly labeled as community attention—not a price forecast or buying recommendation.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/movers" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground hover:opacity-90">Open personal watchlist <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/collection" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">Collection tools <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <footer className="border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          Roadmap status is a snapshot, not a delivery promise. Current production functionality is separated from private-data handling, synthetic staging validation, and future proposals. This release changes public copy and static market data only; it does not modify user records, backup behavior, or Supabase settings/schema.
        </footer>
      </main>
    </div>
  );
}
