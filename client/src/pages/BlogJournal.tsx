import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, CalendarDays, LockKeyhole } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { ArticleCover, CardSpotlightGallery, ReadingBody, ReadingMeta, ReadingOverview, RelatedReading, journalCardImage } from '@/components/JournalReading';
import { chronologicalMarketEntries } from '@/data/marketChronology';
import articles from '@/data/journalArticles.json';
import automatedArticles from '@/data/automatedSpoilerArticles.json';
import spoilerFeed from '@/data/spoilerAnnouncementFeed.json';
import marketReports from '@/data/marketJournalReports.json';
import marketBacklog from '@/data/marketWatchBacklog.json';
import { brawlDecks, brawlDeckPath, cardReference } from '@/lib/brawlDecks';
import { retroBattleBoxDecks } from '@/lib/retroBattleBox';
import { battleBoxReferences } from '@/lib/battleBoxStrategy';

const reports = [
  ...chronologicalMarketEntries.filter(entry => entry.kind === 'catalyst brief'),
  ...marketReports.map(report => ({ id: `journal-${report.date}`, dateKey: report.date, title: report.title, href: `/blog/market-watch-${report.date}`, kind: 'source-dated Market Watch article', dataWindow: report.dataWindow, caveat: report.caveat })),
];
type JournalArticle = { slug: string; category: string; title: string; dateLabel: string; summary: string; body: string; sourceUrl?: string; dataWindow?: string; caveat?: string };
type WeeklyDesk = { week: string; label: string; posts: number; cards: Array<{ name: string; setCode: string; percentChange: number; currentUsd: number | null; category: string; thesis: string; risk: string; action: string; appearances?: number }> };
const weeklyDesks: JournalArticle[] = (marketBacklog.weekly as WeeklyDesk[]).map((desk) => {
  const topCards = desk.cards.slice(0, 10);
  const cardEmbeds = topCards.map(card => `\`\`\`mtg-card\n${JSON.stringify({ name: card.name, setCode: card.setCode, sourceDate: desk.week })}\n\`\`\``).join('\n\n');
  const body = [
    `This weekly desk consolidates ${desk.posts} daily research post${desk.posts === 1 ? '' : 's'} into a ranked, source-aware watchlist. It is a reading layer over the underlying evidence log—not a claim that every percentage move represents durable demand.`,
    cardEmbeds,
    `## What stood out`,
    topCards.length ? topCards.map((card, index) => `${index + 1}. **${card.name}** (${card.setCode.toUpperCase()}) — ${card.percentChange >= 0 ? '+' : ''}${card.percentChange.toFixed(1)}%${card.currentUsd == null ? '' : ` at $${card.currentUsd.toFixed(2)}`}. **${card.action.replaceAll('_', ' ')}.** ${card.thesis}`).join('\n') : 'No ranked cards were promoted for this week.',
    `## How to use this desk`,
    `Start with the current [Market Watch terminal](/market-watch), verify the exact printing, and then compare the signal against completed sales, supply, reprint risk, and your own collection goals. Repeated appearance is a reason to investigate—not proof of a buy signal.`,
    `## Evidence and review`,
    `The daily source records remain available in the collapsible evidence archive on the [journal hub](/blog). Prediction outcomes belong in the [market signal audit](/market-signal-audit), where the original forecast and later result can be compared without rewriting history.`,
  ].join('\n\n');
  return {
    slug: `market-week-${desk.week}`,
    category: 'Weekly Market Desk',
    title: `Weekly Market Desk · ${desk.label}`,
    dateLabel: `${desk.label} · Published desk`,
    summary: `${topCards.length} ranked cards from ${desk.posts} daily research post${desk.posts === 1 ? '' : 's'}, with exact-printing and confidence caveats preserved.`,
    body,
  };
});
const marketArchiveArticles: JournalArticle[] = marketReports.map(report => ({ slug: `market-watch-${report.date}`, category: 'Historical Market Watch', title: report.title, dateLabel: `${report.date} original report · published journal copy`, summary: report.summary, body: report.body, sourceUrl: report.sourceUrl, dataWindow: report.dataWindow, caveat: report.caveat }));
const editorialArticles: JournalArticle[] = [...articles];
const allArticles: JournalArticle[] = [...editorialArticles, ...automatedArticles, ...weeklyDesks, ...marketArchiveArticles];
const dashboards = [
  { title: 'Market Movers dashboards', href: '/movers', description: 'Price charts, categories, and signal exploration. Start here for the numbers, not the daily prose.' },
  { title: 'Market research feed', href: '/market-watch', description: 'Source-aware watchlists with exact-printing notes and uncertainty labels.' },
  { title: 'Market signal audit', href: '/market-signal-audit', description: 'Historical evidence and prediction-review context, kept separate from new daily observations.' },
];
const brawlCards = brawlDecks.map(deck => ({ id: deck.id, name: deck.commander, description: deck.subtitle, href: brawlDeckPath(deck.id), image: cardReference(deck.commander)?.imageUrl ?? undefined, cardName: deck.commander, oracleText: cardReference(deck.commander)?.oracleText ?? '' }));
const battleCards = retroBattleBoxDecks.map(deck => {
  const representative = deck.groups.flatMap(group => group.cards).find(card => battleBoxReferences[card.name]);
  const ref = representative ? battleBoxReferences[representative.name] : undefined;
  const image = ref?.image_uris?.normal;
  return { id: deck.id, name: deck.name, description: deck.summary, href: `/battle-box/${encodeURIComponent(deck.id)}`, image: image?.replace('/normal/', '/art_crop/'), cardName: representative?.name };
});

export function PublishedBadge() {
  return <span className="inline-flex items-center gap-1 border border-amber-500/60 bg-amber-500/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-300"><LockKeyhole className="h-3 w-3" /> Published article / journal</span>;
}
function Shell({ children }: { children: React.ReactNode }) {
  return <main className="journal-page mx-auto min-h-screen max-w-6xl px-4 py-8 text-foreground sm:px-8 sm:py-12">{children}</main>;
}
function DeckCards({ type }: { type: 'brawl' | 'battle' }) {
  const cards = type === 'brawl' ? brawlCards : battleCards;
  return <section id="deck-library" className="mt-10 scroll-mt-24 border-t-2 border-border pt-8" aria-label={type === 'brawl' ? 'All seven Brawlternative decks' : 'All nine Battle Box decks'}>
    <h2 className="text-3xl font-black">{type === 'brawl' ? 'Explore every Brawlternative' : 'Pick your next matchup'}</h2>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">Representative card imagery from Scryfall, © Wizards of the Coast. Art is not a printing or ownership claim. Buy Online opens the deck's shopping section; it does not place an order.</p>
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map(deck => <article key={deck.id} className="flex min-w-0 flex-col overflow-hidden border-2 border-border bg-card">
      <Link href={deck.href} className={`journal-deck-image ${type === 'battle' ? 'journal-deck-image--art' : 'journal-deck-image--card'}`} aria-label={`View ${deck.name}`}>
        {deck.image && <img src={deck.image} alt={`${deck.cardName} — representative ${type === 'battle' ? 'art crop' : 'card'} for ${deck.name}`} loading="lazy" width={type === 'battle' ? '640' : '488'} height={type === 'battle' ? '360' : '680'} />}
      </Link>
      <div className="flex flex-1 flex-col p-5"><h3 className="text-xl font-black"><Link href={deck.href} className="hover:text-primary">{deck.name}</Link></h3>
        {type === 'brawl' && 'oracleText' in deck && typeof deck.oracleText === 'string' && deck.oracleText && <div className="journal-commander-profile mt-3"><p className="journal-eyebrow">Printed Oracle text · {deck.cardName}</p><p className="mt-1 whitespace-pre-line text-sm leading-6">{deck.oracleText}</p></div>}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{type === 'brawl' && ['the-wise-mothman', 'rakdos-lord-of-riots', 'karlov-of-the-ghost-council'].includes(deck.id) ? 'Complete 60-card editorial revision published for reference. The submitted list remains separately available on the page.' : deck.description}</p>
        <div className="mt-auto pt-5"><Link href={`${deck.href}#buy-online`} className="flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-4 py-3 font-black text-primary-foreground hover:opacity-90">Buy Online <ArrowRight className="h-4 w-4" /></Link>
          <Link href={deck.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary underline">Read the deck & export list</Link></div>
      </div>
    </article>)}</div>
  </section>;
}
function Hub() {
  return <Shell><header className="border-b-2 border-border pb-8"><PublishedBadge /><p className="mt-6 font-mono text-xs font-black uppercase tracking-widest text-primary">Decks, games, and the daily market notebook</p><h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Blog / Journal</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">The stories live here. The charts have their own desk. Browse a dated market report, meet a new brew, or find a way to play it with a friend.</p><p className="mt-4 max-w-3xl border-l-2 border-amber-500 pl-4 text-sm leading-6 text-amber-800 dark:text-amber-300">Published journal articles and editorial deck revisions retain their source-list history and pending playtesting caveats. Existing historical reports keep their own report dates and data windows.</p></header>
    <section className="mt-9" aria-label="Published journal articles"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="journal-eyebrow">Decks, products, and play ideas</p><h2 className="mt-2 text-3xl font-black">From the play table</h2></div><span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{editorialArticles.length} editorial stories</span></div><div className="mt-5 grid gap-5 md:grid-cols-3">{editorialArticles.map(article => <Link key={article.slug} href={`/blog/${article.slug}`} className="journal-hub-card"><div className={`journal-hub-image ${article.slug === 'brawlternative-shelf-roundup' ? 'journal-hub-image--commander' : ''}`}><img src={article.slug === 'brawlternative-shelf-roundup' ? journalCardImage(article.slug)?.imageUrl : journalCardImage(article.slug)?.artUrl ?? journalCardImage(article.slug)?.imageUrl ?? undefined} alt="" loading="lazy" width="626" height="457" /></div><div className="journal-hub-card-content"><span className="journal-eyebrow">{article.category}</span><h3>{article.title}</h3><p>{article.summary}</p>{article.slug === 'brawlternative-shelf-roundup' && <div className="journal-hub-commander"><strong>The Wise Mothman · Oracle text</strong><p>{cardReference('The Wise Mothman')?.oracleText}</p></div>}<div className="journal-card-end"><ReadingMeta body={article.body} /><p className="!mt-2 !text-xs">{article.dateLabel}</p><span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-black text-primary">Read the story <ArrowRight size={16} aria-hidden="true" /> </span></div></div></Link>)}</div><p className="mt-3 text-xs text-muted-foreground">The Journal prioritizes durable deck, product, and play stories. Market numbers live in the dedicated Market Desk below.</p></section>
    <section className="mt-10 border-2 border-border bg-card p-5 sm:p-6" aria-label="Official release radar"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="journal-eyebrow">One living source index</p><h2 className="mt-2 text-2xl font-black">Official spoiler &amp; precon release radar</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">The daily scanner updates this index instead of creating a new Journal article when nothing meaningful changed. It currently tracks {spoilerFeed.records.length} official or calendar-backed records as of {spoilerFeed.asOf}.</p></div><Link href="/spoiler-calendar" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary px-4 py-2 text-sm font-black text-primary hover:bg-primary hover:text-primary-foreground">Open release radar <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    <section className="mt-12 border-y-2 border-border py-7" aria-label="Market Desk index"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="journal-eyebrow">Numbers have their own room</p><h2 className="mt-2 text-3xl font-black">Market Desk index</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Weekly synthesis, forecast review, and source logs are linked here without turning the Journal into a mover dashboard.</p></div><Link href="/market-desk" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary px-4 py-2 text-sm font-black text-primary hover:bg-primary hover:text-primary-foreground">Open Market Desk <ArrowRight size={16} aria-hidden="true" /></Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{weeklyDesks.map(desk => <Link key={desk.slug} href={`/blog/${desk.slug}`} className="border border-border bg-card p-4 hover:border-primary"><div className="flex items-start justify-between gap-3"><div><span className="journal-eyebrow">Weekly synthesis</span><h3 className="mt-2 text-lg font-black">{desk.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{desk.summary}</p></div><BarChart3 className="h-5 w-5 shrink-0 text-primary" /></div><span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-primary">Read the desk <ArrowRight size={14} aria-hidden="true" /></span></Link>)}</div></section>
    <section className="mt-12 border-t-2 border-border pt-8" aria-label="Daily Market Watch evidence archive"><details><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><span><span className="font-mono text-xs font-black uppercase tracking-widest text-primary">Evidence archive</span><span className="mt-2 block text-3xl font-black">Daily Market Watch logs</span></span><BookOpen className="h-8 w-8 shrink-0 text-primary" /></summary><div className="mt-4"><p className="max-w-3xl text-sm leading-6 text-muted-foreground">Every dated source record remains available for audit and prediction review. These are logs, not fresh recommendations; historical observations are not current quotes.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{[...reports].sort((a,b) => b.dateKey.localeCompare(a.dateKey)).map(entry => <Link key={entry.id} href={entry.href} className="min-w-0 border-2 border-border bg-card p-5 hover:border-primary"><div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-mono text-xs font-black text-primary"><CalendarDays className="h-4 w-4" /> {entry.dateKey}</span><span className="font-mono text-[10px] font-black uppercase text-muted-foreground">{entry.kind}</span></div><h3 className="mt-3 text-xl font-black">{entry.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.dataWindow}</p><p className="mt-3 text-xs leading-5 text-amber-800 dark:text-amber-300">{entry.caveat}</p></Link>)}</div></div></details></section>
    <section className="mt-12 border-t-2 border-border pt-8" aria-label="Separate chart dashboards"><div className="flex items-end justify-between gap-3"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Chart-focused dashboards</p><h2 className="mt-2 text-3xl font-black">Explore the visual desks</h2></div><BarChart3 className="h-8 w-8 shrink-0 text-primary" /></div><div className="mt-5 grid gap-4 md:grid-cols-3">{dashboards.map(item => <Link key={item.href} href={item.href} className="border border-border p-5 hover:border-primary"><h3 className="font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></Link>)}</div></section>
  </Shell>;
}
export default function BlogJournal() {
  const { slug } = useParams<{ slug?: string }>();
  const article = allArticles.find(entry => entry.slug === slug);
  useEffect(() => {
    const previous = document.title;
    document.title = `${article?.title ?? 'Blog / Journal'} · Published journal`;
    return () => { document.title = previous; };
  }, [article]);
  if (!slug) return <Hub />;
  if (!article) return <Shell><Link href="/blog" className="text-primary underline">← Blog / Journal</Link><h1 className="mt-8 text-3xl font-black">Article not found</h1></Shell>;
  return <Shell><header className="border-b-2 border-border"><Link href="/blog" className="inline-flex min-h-11 items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Blog / Journal</Link><div className="mt-5 flex flex-wrap items-center gap-3"><PublishedBadge /><span className="text-xs text-muted-foreground">{article.dateLabel}</span><ReadingMeta body={article.body} /></div><div className="journal-hero"><div><p className="journal-eyebrow mb-4">{article.category}</p><h1>{article.title}</h1><p className="journal-hero-summary">{article.summary}</p></div><ArticleCover slug={slug} /></div></header>
    {'sourceUrl' in article && <aside className="mt-6 max-w-3xl border-l-4 border-amber-500 bg-amber-500/5 p-4 text-sm leading-7"><p><strong>Historical source window:</strong> {article.dataWindow}.</p><p className="mt-2">{article.caveat}</p><a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-bold text-primary underline">Original report source</a><p className="mt-2"><strong>Published journal source copy:</strong> this entry preserves the original report context; prices and named catalysts below are historical source claims, not freshly verified quotes or new daily moves.</p></aside>}
    <ReadingOverview article={article} />
    <CardSpotlightGallery slug={slug} />
    <ReadingBody article={article} />
    {'sourceUrl' in article && <nav aria-label="Separate market chart tools" className="mt-8 flex flex-wrap gap-4 border-t border-border pt-5"><Link href="/movers" className="font-bold text-primary underline">Open chart dashboards</Link><Link href="/market-watch" className="font-bold text-primary underline">Source watchlist feed</Link></nav>}
    {slug === 'brawlternative-shelf-roundup' && <DeckCards type="brawl" />}
    {slug === 'battle-box-october-17-recap' && <DeckCards type="battle" />}
      <RelatedReading articles={allArticles} currentSlug={slug} />
    <footer className="mt-10 border-t border-border pt-5"><Link href="/blog" className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline"><ArrowLeft className="h-4 w-4" /> Back to the journal</Link></footer>
  </Shell>;
}
