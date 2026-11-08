import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import {
  loadDeckGalleryTunedChildren,
  type DeckGalleryTunedChild,
  type DeckGalleryTunedChildChange,
} from "@/lib/deckGalleryTunedChildren";

export function DeckGalleryTunedChildView({ child }: { child: DeckGalleryTunedChild }) {
  const pairedCuts = new Map<string, number>();
  const pairedAdds = new Map<string, number>();
  for (const swap of child.exactChanges.swaps) {
    pairedCuts.set(swap.cut.name, (pairedCuts.get(swap.cut.name) || 0) + swap.cut.quantity);
    pairedAdds.set(swap.replacement.name, (pairedAdds.get(swap.replacement.name) || 0) + swap.replacement.quantity);
  }
  const unpairedCuts = remainderChanges(child.exactChanges.cuts, pairedCuts);
  const unpairedAdds = remainderChanges(child.exactChanges.adds, pairedAdds);

  return (
    <main className="container min-h-[75vh] py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 text-xs font-bold">
        <Link href="/deck-gallery/children" className="inline-flex min-h-11 items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tuned children
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="max-w-[min(70vw,42rem)] truncate text-muted-foreground">{child.title}</span>
      </nav>

      <header className="mx-auto mt-4 max-w-6xl border-2 border-border bg-card shadow-sm">
        <div className="p-5 sm:p-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
            Separate child revision · source list unchanged
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
            <Badge>{child.status}</Badge>
            <Badge>{child.tuningLevel}</Badge>
            <Badge>Ownership unknown · not checked</Badge>
            {child.hypothetical && <Badge>Hypothetical</Badge>}
          </div>
          <h1 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-5xl">{child.title}</h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">{child.plan.commanderPlan}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Main deck" value={`${child.validation.mainCount} cards`} detail="Singleton main list" />
            <Stat label="Command zone" value={`${child.validation.commanderCount} card${child.validation.commanderCount === 1 ? "" : "s"}`} detail={child.commanders.map(card => card.name).join(" + ")} />
            <Stat label="Total" value={`${child.validation.totalCount} / 100`} detail="Includes commander zone" />
            <Stat label="Land cards" value={`${child.validation.scryfallLandCount}`} detail="From Scryfall card type lines" />
          </div>
        </div>
        <div className="grid gap-0 border-t-2 border-border lg:grid-cols-2">
          <div className="border-b-2 border-border p-5 lg:border-b-0 lg:border-r-2 sm:p-6">
            <h2 className="text-sm font-black">Parent Deckbox source</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The linked parent is read-only. This child revision does not change its saved card rows, order, or sideboard.</p>
            <Link href={child.parentHref} className="mt-3 inline-flex min-h-11 items-center gap-2 break-words text-sm font-bold text-primary underline-offset-4 hover:underline">
              {child.sourceTitle} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Visible parent source counts: {child.visibleSourceCounts.mainCopies} main copies and {child.visibleSourceCounts.sideboardCopies} sideboard copies.
            </p>
            {child.sourceCompletenessNote && (
              <div className="mt-3 border-l-4 border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/20">
                <h3 className="text-xs font-black uppercase tracking-wide">Visible-source completeness</h3>
                <p className="mt-2 text-xs leading-5 text-amber-950 dark:text-amber-100">{child.sourceCompletenessNote}</p>
              </div>
            )}
          </div>
          <div className="p-5 sm:p-6">
            <h2 className="text-sm font-black">Status and attribution</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{child.attributionNote}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{child.ownershipStatus} This is proposed and unplayed; no purchase or ownership claim is made.</p>
          </div>
        </div>
        {child.parentSectionsOmitted && (
          <p className="border-t-2 border-amber-500 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100 sm:px-8">
            {child.sourceNote}
          </p>
        )}
      </header>

      <div className="mx-auto mt-7 grid max-w-6xl gap-6">
        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="edhrec-heading">
          <SectionHeading id="edhrec-heading">EDHREC themes and aggregate context</SectionHeading>
          <ContextBlock context={child.edhrecContext} />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Aggregates guide the plan; they are not proof of ownership, playtesting, legality, or a requirement to copy another list.</p>
        </section>

        {(child.relatedPublicBuilds.length > 0 || child.relatedBuildsNote) && (
          <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="tracker-context-heading">
            <SectionHeading id="tracker-context-heading">Related public tracker builds and context</SectionHeading>
            {child.relatedBuildsNote && <p className="mt-4 border-l-4 border-primary bg-muted/40 p-4 text-sm leading-6">{child.relatedBuildsNote}</p>}
            {child.relatedPublicBuilds.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {child.relatedPublicBuilds.map(build => (
                  <article key={build.publicHref} className="border border-border bg-background p-4">
                    <Link href={build.publicHref} className="font-bold text-primary underline-offset-4 hover:underline">{build.title}</Link>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{build.format}</p>
                    <p className="mt-2 text-sm leading-6">{build.relation}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="plan-heading">
          <SectionHeading id="plan-heading">How the child plays</SectionHeading>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <PlanCard title="Subthemes and package roles"><Subthemes value={child.plan.subthemes} /></PlanCard>
            <PlanCard title="Curve and tempo">{child.plan.curveTempo}</PlanCard>
            <PlanCard title="Interaction">{child.plan.interaction}</PlanCard>
            <PlanCard title="Card advantage">{child.plan.cardAdvantage}</PlanCard>
            <PlanCard title="Mana plan">{child.plan.mana}</PlanCard>
            <PlanCard title="Closing plan">{child.plan.closingPlan}</PlanCard>
          </div>
          <div className="mt-4 border-l-4 border-primary bg-muted/40 p-4">
            <h3 className="text-sm font-black">Why this is a more coherent tuned-casual build</h3>
            <p className="mt-2 text-sm leading-6">{child.plan.coherence}</p>
          </div>
        </section>

        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="roles-heading">
          <SectionHeading id="roles-heading">Estimated role mix</SectionHeading>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Each main-deck card has one exclusive primary role; counts are estimates for this child revision.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(child.roleEstimates).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2">
                <span className="text-xs font-semibold">{labelRole(role)}</span>
                <span className="font-mono text-sm font-bold tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="changes-heading">
          <SectionHeading id="changes-heading">Exact source cuts and replacements</SectionHeading>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Counts are card copies. Each row below is an exact cut → replacement pairing; any remaining cuts or additions are listed separately. Commander-zone moves are shown apart from main-deck changes.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label="Cut copies" value={`${copyTotal(child.exactChanges.cuts)}`} detail={`${child.exactChanges.cuts.length} source cards`} />
            <Stat label="Added copies" value={`${copyTotal(child.exactChanges.adds)}`} detail={`${child.exactChanges.adds.length} added cards`} />
            <Stat label="Paired swaps" value={`${child.exactChanges.swaps.length}`} detail="Exact cut → replacement rows" />
          </div>
          {child.exactChanges.zoneMoves.length > 0 && (
            <div className="mt-5 border-l-4 border-primary bg-muted/40 p-4">
              <h3 className="text-sm font-black">Commander-zone move(s)</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6">
                {child.exactChanges.zoneMoves.map((move, index) => (
                  <li key={`${move.name}-${index}`}><strong>{move.quantity}× {move.name}</strong>: {zoneLabel(move.from)} → {zoneLabel(move.to)}. {move.reason}</li>
                ))}
              </ul>
            </div>
          )}
          {child.exactChanges.swaps.length > 0 && (
            <details className="mt-5 border border-border bg-background">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold">Show all {child.exactChanges.swaps.length} exact cut → replacement mappings</summary>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full min-w-[42rem] border-collapse text-left text-xs">
                  <thead className="bg-muted/60 font-mono uppercase tracking-wide text-muted-foreground">
                    <tr><th className="px-3 py-3">Cut</th><th className="px-3 py-3">Replacement + estimated role</th><th className="px-3 py-3">Why</th></tr>
                  </thead>
                  <tbody>
                    {child.exactChanges.swaps.map((swap, index) => (
                      <tr key={`${swap.cut.name}-${swap.replacement.name}-${index}`} className="border-t border-border align-top">
                        <td className="px-3 py-3 font-semibold">{swap.cut.quantity}× {swap.cut.name}</td>
                        <td className="px-3 py-3"><span className="font-semibold">{swap.replacement.quantity}× {swap.replacement.name}</span>{swap.replacement.role && <span className="mt-1 block text-muted-foreground">Role: {labelRole(swap.replacement.role)}</span>}</td>
                        <td className="px-3 py-3 leading-5 text-muted-foreground">{swap.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {unpairedCuts.length > 0 && <ChangeList title="Additional cuts without a paired replacement" rows={unpairedCuts} />}
            {unpairedAdds.length > 0 && <ChangeList title="Additional additions without a paired cut" rows={unpairedAdds} />}
          </div>
        </section>

        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="list-heading">
          <SectionHeading id="list-heading">Full proposed Commander list</SectionHeading>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The command zone is separate. The main list totals {child.validation.mainCount} cards; the proposed child is not a change to the linked parent list.</p>
          <div className="mt-4 border-l-4 border-primary bg-muted/40 p-4">
            <h3 className="text-sm font-black">Command zone</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {child.commanders.map(card => <li key={card.name}>{card.quantity}× {card.name}</li>)}
            </ul>
          </div>
          <details className="mt-4 border border-border bg-background">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold">Show the full 99-card main list by estimated role</summary>
            <div className="grid gap-5 border-t border-border p-4 md:grid-cols-2">
              {groupMainByRole(child.main).map(([role, cards]) => (
                <div key={role}>
                  <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-primary">{labelRole(role)}</h3>
                  <ul className="mt-2 divide-y divide-border border border-border">
                    {cards.map(card => <li key={card.name} className="flex justify-between gap-3 px-3 py-2 text-xs"><span>{card.name}</span><span className="shrink-0 font-mono tabular-nums">{card.quantity}×</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </section>

        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="validation-heading">
          <SectionHeading id="validation-heading">Checks actually performed</SectionHeading>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Checked {child.validation.checkedAsOf}. These are data checks, not playtesting.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <Check label="Commander count" value={`${child.validation.mainCount} main + ${child.validation.commanderCount} command zone = ${child.validation.totalCount} total`} />
            <Check label="Unique card names resolved through Scryfall" value={`${child.validation.cardNamesResolved}; unresolved in batch: ${child.validation.scryfallNamesUnresolved}`} />
            <Check label="Commander color identity" value={`${child.validation.colorIdentityCheck} · ${child.validation.commanderColorIdentity.join(", ") || "colorless"}`} />
            <Check label="Scryfall Commander legality" value={child.validation.commanderLegalityCheck} />
            <Check label="Commander-zone eligibility" value={child.validation.commanderEligibilityCheck} />
            <Check label="Singleton construction" value={child.validation.singletonCheck} />
            <Check label="Source cuts/additions and visible parent rows" value={child.validation.exactSourceDiffCheck} />
            <Check label="Land cards from Scryfall type lines" value={`${child.validation.scryfallLandCount}`} />
          </ul>
          <p className="mt-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
            Scryfall card records supplied the color identity, Commander legality, commander eligibility, singleton exceptions, and land type lines. No numeric mana-value curve audit, color-source consistency analysis, pod-specific ban check, purchase, ownership match, or playtest is claimed.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {child.validation.references.map(reference => <a key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">{reference.label}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>)}
            {child.evidence.map(item => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">{item.label}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>)}
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
            {child.evidence.map(item => <li key={`${item.url}-purpose`}><strong>{item.label}:</strong> {item.usedFor}</li>)}
          </ul>
        </section>
      </div>

      <footer className="mx-auto mt-8 flex max-w-6xl flex-wrap gap-3 border-t-2 border-border pt-5">
        <Link href={child.parentHref} className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Return to parent list</Link>
        <Link href="/deck-gallery/children" className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary">More tuned children <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </footer>
    </main>
  );
}

function ContextBlock({ context }: { context: DeckGalleryTunedChild["edhrecContext"] }) {
  if (typeof context === "string")
    return <p className="mt-3 text-sm leading-7">{context}</p>;
  const summary = typeof context.summary === "string" ? context.summary : "EDHREC recommendations and themes informed this child.";
  const aggregate = context.aggregateDeckCount;
  const tags = context.popularTags;
  const tagRows = typeof tags === "object" && tags !== null && !Array.isArray(tags)
    ? Object.entries(tags as Record<string, unknown>).filter((entry): entry is [string, number] => typeof entry[1] === "number")
    : [];
  const recs = Array.isArray(context.recommendationExamples)
    ? context.recommendationExamples
    : Array.isArray(context.recommendationContext)
      ? context.recommendationContext
      : [];
  const otherNotes = Object.entries(context).filter(([key, value]) =>
    !["summary", "aggregateDeckCount", "popularTags", "recommendationExamples", "recommendationContext"].includes(key) && typeof value === "string"
  );
  return (
    <div>
      <p className="mt-3 text-sm leading-7">{summary}</p>
      {aggregate !== undefined && <p className="mt-2 text-xs font-semibold text-muted-foreground">EDHREC aggregate: {String(aggregate)}</p>}
      {tagRows.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tagRows.map(([tag, count]) => <span key={tag} className="border border-border bg-background px-2 py-1 text-xs">{tag} · {count}</span>)}</div>}
      {recs.length > 0 && <p className="mt-3 text-xs leading-5 text-muted-foreground"><strong>Recommendation examples:</strong> {recs.filter((item): item is string => typeof item === "string").join(", ")}</p>}
      {otherNotes.map(([key, value]) => <p key={key} className="mt-2 text-xs leading-5 text-muted-foreground">{String(value)}</p>)}
    </div>
  );
}

function Subthemes({ value }: { value: DeckGalleryTunedChild["plan"]["subthemes"] }) {
  if (typeof value === "string") return <p>{value}</p>;
  if (!value.length) return <p className="text-muted-foreground">No separate subtheme package was supplied.</p>;
  return (
    <ul className="space-y-3">
      {value.map((item, index) => typeof item === "string" ? (
        <li key={`${item}-${index}`}>{item}</li>
      ) : (
        <li key={`${item.name || "package"}-${index}`}>
          {item.name && <strong className="block">{item.name}</strong>}
          {item.role && <span>{item.role}</span>}
          {item.cards?.length ? <span className="mt-1 block text-xs text-muted-foreground">Examples: {item.cards.join(", ")}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function ChangeList({ title, rows }: { title: string; rows: DeckGalleryTunedChildChange[] }) {
  return (
    <div className="border border-border bg-background p-4">
      <h3 className="text-sm font-black">{title}</h3>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((row, index) => <li key={`${row.name}-${index}`} className="py-3 text-xs leading-5"><strong>{row.quantity}× {row.name}</strong>{row.role && <span className="ml-2 text-muted-foreground">· role: {labelRole(row.role)}</span>}{row.sourceClass && <span className="ml-2 text-muted-foreground">· {row.sourceClass === "public_sideboard" ? "promoted from visible public sideboard" : "new addition"}</span>}{row.reason && <p className="mt-1 text-muted-foreground">{row.reason}</p>}</li>)}
      </ul>
    </div>
  );
}

function PlanCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="border border-border bg-background p-4"><h3 className="text-xs font-black uppercase tracking-wide">{title}</h3><div className="mt-2 text-sm leading-6">{children}</div></article>;
}

function Check({ label, value }: { label: string; value: string }) {
  return <li className="border border-border bg-background p-3"><p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xs font-bold">{value}</p></li>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="border border-border bg-background px-2 py-1">{children}</span>;
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-xl font-black tracking-tight sm:text-2xl">{children}</h2>;
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="border border-border bg-background p-3"><p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-bold">{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}

function remainderChanges(rows: DeckGalleryTunedChildChange[], paired: Map<string, number>) {
  return rows.flatMap(row => {
    const quantity = row.quantity - (paired.get(row.name) || 0);
    return quantity > 0 ? [{ ...row, quantity }] : [];
  });
}

function copyTotal(rows: DeckGalleryTunedChildChange[]) {
  return rows.reduce((sum, row) => sum + row.quantity, 0);
}

function labelRole(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function zoneLabel(value: string) {
  if (/public_main|\bmain\b/i.test(value)) return "visible parent main deck";
  if (/sideboard/i.test(value)) return "visible parent sideboard";
  if (/command/i.test(value)) return "command zone";
  return value.replace(/_/g, " ");
}

function groupMainByRole(main: DeckGalleryTunedChild["main"]) {
  const grouped = new Map<string, DeckGalleryTunedChild["main"]>();
  for (const card of main) {
    const rows = grouped.get(card.role) || [];
    rows.push(card);
    grouped.set(card.role, rows);
  }
  return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
}

export default function DeckGalleryTunedChildDetail({ params }: { params: { childSlug: string } }) {
  const [children, setChildren] = useState<DeckGalleryTunedChild[] | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Loading tuned child · Deck Gallery | MTG Tracker";
    let active = true;
    loadDeckGalleryTunedChildren()
      .then(payload => { if (active) setChildren(payload.children); })
      .catch((reason: unknown) => {
        if (active) setLoadError(reason instanceof Error ? reason.message : "Tuned-child suggestions are temporarily unavailable.");
      });
    return () => {
      active = false;
      document.title = previousTitle;
    };
  }, [params.childSlug]);

  const child = children?.find(candidate => candidate.childSlug === params.childSlug);
  useEffect(() => {
    if (child) document.title = `${child.title} · Tuned child | Deck Gallery`;
  }, [child?.title]);

  if (loadError) return <MessagePage title="Tuned child unavailable" message={loadError} />;
  if (!children) return <MessagePage title="Loading tuned child" message="Loading the separate proposed child revision…" status />;
  if (!child) return <MessagePage title="Tuned child not found" message="This child revision is not in the public tuned-child catalog." />;
  return <DeckGalleryTunedChildView child={child} />;
}

function MessagePage({ title, message, status = false }: { title: string; message: string; status?: boolean }) {
  return <main className="container min-h-[60vh] py-12"><h1 className="text-3xl font-black">{title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground" role={status ? "status" : "alert"}>{message}</p><Link href="/deck-gallery/children" className="mt-6 inline-flex min-h-11 items-center gap-2 text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tuned children</Link></main>;
}
