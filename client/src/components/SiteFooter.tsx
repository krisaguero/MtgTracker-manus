import { Link } from 'wouter';
import { ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react';

const builtHere = [
  'Nine 60-card non-Commander Battle Box lists with flagged source-list discrepancies.',
  'Private, browser-local inventory matching with printable and CSV order/proxy queues.',
  'BYOK AI remains explicit opt-in; no AI is used for Battle Box inventory matching.',
];

const stillCooking = [
  'Shared community Battle Box submission and moderation backend.',
  'Commander Battle Box concept (future idea; separate from the current 1v1 box).',
  'Larger local-workspace storage and additional collection import formats.',
];

export function SiteFooter() {
  return <footer className="border-t-2 border-border bg-muted/25 px-4 py-7 sm:px-8" aria-label="Project accomplishments and next ideas">
    <div className="mx-auto max-w-7xl">
      <section className="mb-6 border border-border bg-background p-4" aria-label="Site creator and Battle Box credit policy">
        <p className="text-sm"><strong>MTG Tracker was created by Kris Aguero.</strong> The Battle Box decklists are shared static site content; visitor inventories and queues remain local.</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">User-submitted builds may be featured or remixed only with visible author/source credit, and remixes preserve original authorship. Shared review and publishing are not available yet; <Link href="/battle-box" className="font-semibold text-primary underline">open the Battle Box</Link> or see the <Link href="/roadmap" className="font-semibold text-primary underline">future backend plan</Link>.</p>
      </section>
      <div className="grid gap-7 md:grid-cols-2">
        <section>
          <h2 className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary"><CheckCircle2 className="h-4 w-4" /> Built / working copy</h2>
          <ul className="mt-3 space-y-2">{builtHere.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span aria-hidden="true" className="text-primary">✓</span><span>{item}</span></li>)}</ul>
        </section>
        <section>
          <h2 className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-muted-foreground"><CircleDashed className="h-4 w-4" /> Still on the list</h2>
          <ul className="mt-3 space-y-2">{stillCooking.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span aria-hidden="true">○</span><span>{item}</span></li>)}</ul>
        </section>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>This footer is a working checklist, not a deployment or completion claim. Collection matching stays in the browser.</p>
        <Link href="/roadmap" className="inline-flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-primary hover:underline">Full project roadmap <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  </footer>;
}
