import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import {
  loadDeckGalleryTunedChildren,
  type DeckGalleryTunedChild,
  type DeckGalleryTunedChildChange,
} from "@/lib/deckGalleryTunedChildren";
import { CardIndexLink, CardMediaFrame, cardIndexHref } from "@/components/CardIndexLink";
import { CardImageZoom } from "@/components/CardImageZoom";
import { getPublicCardImageUri } from "@/lib/deckGalleryImageUris";

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
        <section className="border-2 border-primary/30 bg-primary/5 p-5 sm:p-7" aria-labelledby="build-thesis-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tuned child · proposed upgrade</p>
              <SectionHeading id="build-thesis-heading">Build thesis</SectionHeading>
            </div>
            <span className="font-mono text-xs font-bold text-primary">{child.validation.totalCount} cards · {child.validation.scryfallLandCount} lands</span>
          </div>
          <p className="mt-4 max-w-4xl text-base leading-7">{child.plan.commanderPlan} {child.plan.closingPlan} {child.plan.coherence}</p>
          <div className="mt-5 border-t border-primary/20 pt-5">
            <h3 className="text-sm font-black uppercase tracking-wide">Themes and signature cards</h3>
            <div className="mt-4"><Subthemes value={child.plan.subthemes} /></div>
          </div>
        </section>

        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="list-heading">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border pb-4">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">The proposed revision</p>
              <SectionHeading id="list-heading">Upgraded Commander decklist</SectionHeading>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">The final 100-card child list is shown first. These are the cards to build; the source cuts and exact swap logic follow below.</p>
            </div>
            <div className="flex gap-2 text-xs font-bold"><Badge>{child.validation.mainCount} main</Badge><Badge>{child.validation.commanderCount} command</Badge></div>
          </div>
          <div className="mt-5 border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
            <h3 className="text-sm font-black uppercase tracking-wide">Command zone</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-3xl">{child.commanders.map(card => <VisualChildCard key={card.name} name={card.name} quantity={card.quantity} />)}</div>
          </div>
          <div className="mt-7 space-y-8">
            {groupMainByRole(child.main).map(([role, cards]) => (
              <section key={role} aria-labelledby={`role-${role}`}>
                <div className="flex items-baseline justify-between border-b border-border pb-3"><h3 id={`role-${role}`} className="text-2xl font-black">{labelRole(role)}</h3><span className="font-mono text-xs text-primary">{cards.reduce((sum, card) => sum + card.quantity, 0)} copies · {cards.length} cards</span></div>
                <div className="mt-4 grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">{cards.map(card => <VisualChildCard key={card.name} name={card.name} quantity={card.quantity} />)}</div>
              </section>
            ))}
          </div>
        </section>

        <section className="border-2 border-border bg-card p-5 sm:p-7" aria-labelledby="changes-heading">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border pb-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Make these changes</p><SectionHeading id="changes-heading">Cuts and upgrade swaps</SectionHeading><p className="mt-2 text-sm leading-6 text-muted-foreground">Exact source cuts and replacements. The visual list above is the destination; use this section as the cut sheet from the original build.</p></div><div className="flex gap-2"><Badge>{copyTotal(child.exactChanges.cuts)} cuts</Badge><Badge>{copyTotal(child.exactChanges.adds)} adds</Badge></div></div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {unpairedCuts.length > 0 && <ChangeList title="Cut from the source build" rows={unpairedCuts} />}
            {unpairedAdds.length > 0 && <ChangeList title="Add to the tuned build" rows={unpairedAdds} />}
          </div>
          {child.exactChanges.swaps.length > 0 && <details className="mt-5 border border-border bg-background"><summary className="cursor-pointer px-4 py-3 text-sm font-bold">Show all {child.exactChanges.swaps.length} exact cut → replacement mappings</summary><div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">{child.exactChanges.swaps.map((swap, index) => <article key={`${swap.cut.name}-${swap.replacement.name}-${index}`} className="border border-border bg-card p-3"><div className="grid grid-cols-2 gap-2"><VisualChildCard name={swap.cut.name} quantity={swap.cut.quantity} compact /><VisualChildCard name={swap.replacement.name} quantity={swap.replacement.quantity} compact /></div>{swap.replacement.role && <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-primary">Role: {labelRole(swap.replacement.role)}</p>}<p className="mt-3 text-xs leading-5 text-muted-foreground">{swap.reason}</p></article>)}</div></details>}
        </section>

        <details className="border-2 border-border bg-card p-5 sm:p-7">
          <summary className="cursor-pointer text-xl font-black">Research context, role mix, and validation</summary>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div><h3 className="text-sm font-black uppercase tracking-wide">EDHREC context</h3><ContextBlock context={child.edhrecContext} /></div>
            <div><h3 className="text-sm font-black uppercase tracking-wide">Estimated role mix</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(child.roleEstimates).map(([role, count]) => <div key={role} className="flex items-center justify-between border border-border bg-background px-3 py-2 text-xs"><span>{labelRole(role)}</span><b>{count}</b></div>)}</div>{(child.relatedBuildsNote || child.relatedPublicBuilds.length > 0) && <><h3 className="mt-6 text-sm font-black uppercase tracking-wide">Related public tracker builds</h3>{child.relatedBuildsNote && <p className="mt-3 border-l-4 border-primary bg-muted/40 p-3 text-xs leading-5">{child.relatedBuildsNote}</p>}{child.relatedPublicBuilds.length > 0 && <div className="mt-4 space-y-2">{child.relatedPublicBuilds.map(build => <Link key={build.publicHref} href={build.publicHref} className="block border border-border bg-background p-3 text-xs hover:border-primary"><span className="font-bold text-primary">{build.title}</span><span className="mt-1 block text-muted-foreground">{build.format} · {build.relation}</span></Link>)}</div>}</>}</div>
          </div>
        </details>

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
  const aggregateLabel = typeof aggregate === "number" ? `${aggregate.toLocaleString()} decks` : aggregate;
  const tagRows = typeof tags === "object" && tags !== null && !Array.isArray(tags)
    ? Object.entries(tags as Record<string, unknown>).filter((entry): entry is [string, string | number] => typeof entry[1] === "number" || typeof entry[1] === "string")
    : [];
  const recs = Array.isArray(context.recommendationExamples) ? context.recommendationExamples : [];
  const themeNotes = Array.isArray(context.themeNotes)
    ? context.themeNotes.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item))
    : [];
  return (
    <div>
      <p className="mt-3 text-sm leading-7">{summary}</p>
      {aggregateLabel !== undefined && <p className="mt-2 text-xs font-semibold text-muted-foreground">EDHREC aggregate: {String(aggregateLabel)}</p>}
      {tagRows.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tagRows.map(([tag, count]) => <span key={tag} className="border border-border bg-background px-2 py-1 text-xs">{tag} · {count}</span>)}</div>}
      {recs.length > 0 && <div className="mt-4"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Card examples</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{recs.filter((item): item is string => typeof item === "string").slice(0, 6).map(name => <CardMention key={name} name={name} compact />)}</div></div>}
      {themeNotes.length > 0 && (
        <ul className="mt-3 space-y-3">
          {themeNotes.map((note, index) => {
            const title = typeof note.title === "string" ? note.title : "EDHREC theme";
            const noteSummary = typeof note.summary === "string" ? note.summary : "";
            const count = note.aggregateDeckCount;
            const countLabel = typeof count === "number" ? `${count.toLocaleString()} decks` : count;
            const url = typeof note.url === "string" && note.url.startsWith("https://edhrec.com/") ? note.url : "";
            return <li key={`${title}-${index}`} className="border-l-2 border-primary/50 pl-3 text-xs leading-5">
              <p><strong>{title}</strong>{countLabel !== undefined && <> · {String(countLabel)}</>}</p>
              {noteSummary && <p className="mt-1 text-muted-foreground">{noteSummary}</p>}
              {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-primary underline-offset-4 hover:underline">Open EDHREC theme</a>}
            </li>;
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">These are public aggregate themes and a few card examples, not copied third-party decklists.</p>
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
          {item.name && <CardMention name={item.name} />}
          {item.role && <span>{item.role}</span>}
          {item.cards?.length ? <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{item.cards.map(card => <CardMention key={card} name={card} compact />)}</div> : null}
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
        {rows.map((row, index) => <li key={`${row.name}-${index}`} className="py-3 text-xs leading-5"><CardMention name={row.name} quantity={row.quantity} compact />{row.role && <span className="ml-2 text-muted-foreground">· role: {labelRole(row.role)}</span>}{row.sourceClass && <span className="ml-2 text-muted-foreground">· {row.sourceClass === "public_sideboard" ? "promoted from visible public sideboard" : "new addition"}</span>}{row.reason && <p className="mt-1 text-muted-foreground">{row.reason}</p>}</li>)}
      </ul>
    </div>
  );
}

function PlanCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="border border-border bg-background p-4"><h3 className="text-xs font-black uppercase tracking-wide">{title}</h3><div className="mt-2 text-sm leading-6">{children}</div></article>;
}

function VisualChildCard({ name, quantity, compact = false }: { name: string; quantity?: number; compact?: boolean }) {
  const imageUri = getPublicCardImageUri(name, "normal");
  return (
    <article className="min-w-0 border border-border bg-card">
      <CardMediaFrame className={compact ? "" : "bg-muted/40"}>
        {imageUri ? <CardImageZoom src={imageUri} alt={name} /> : <div className="flex h-full items-center justify-center p-3 text-center text-xs font-bold text-muted-foreground">{name}<br />Artwork unavailable</div>}
      </CardMediaFrame>
      <div className="min-w-0 p-2.5 sm:p-3">
        <div className="flex flex-wrap gap-1.5"><span className="border border-border px-1.5 py-0.5 text-[10px] font-bold">{quantity ?? 1}×</span></div>
        <h4 className="mt-2 break-words text-sm font-black leading-5">{name}</h4>
        <CardIndexLink name={name} compact className="mt-2" />
      </div>
    </article>
  );
}

function CardMention({ name, quantity, compact = false }: { name: string; quantity?: number; compact?: boolean }) {
  const imageUri = getPublicCardImageUri(name, "normal");
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      <a href={cardIndexHref(name)} className={`group block shrink-0 border border-border bg-muted shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compact ? "w-10" : "w-14 sm:w-16"}`} aria-label={`Open ${name} card details`}>
        <CardMediaFrame>
          {imageUri ? <img src={imageUri} alt={`${name} card frame`} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center p-1 text-center text-[8px] font-bold leading-tight text-muted-foreground">{name}</span>}
        </CardMediaFrame>
      </a>
      <span className="min-w-0">
        <span className="block font-semibold leading-5">{quantity ? `${quantity}× ` : ""}{name}</span>
        <CardIndexLink name={name} compact className="mt-1" />
      </span>
    </span>
  );
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
