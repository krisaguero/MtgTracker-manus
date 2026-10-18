import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, CalendarDays, LockKeyhole } from 'lucide-react';
import { Link, useParams } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { chronologicalMarketEntries } from '@/data/marketChronology';
import articles from '@/data/journalArticles.json';
import marketReports from '@/data/marketJournalReports.json';
import { brawlDecks, brawlDeckPath, cardReference } from '@/lib/brawlDecks';
import { retroBattleBoxDecks } from '@/lib/retroBattleBox';
import { battleBoxReferences } from '@/lib/battleBoxStrategy';

const reports = [
  ...chronologicalMarketEntries.filter(entry => entry.kind === 'catalyst brief'),
  ...marketReports.map(report => ({ id: `journal-${report.date}`, dateKey: report.date, title: report.title, href: `/blog/market-watch-${report.date}`, kind: 'source-dated Market Watch article', dataWindow: report.dataWindow, caveat: report.caveat })),
];
type JournalArticle = { slug: string; category: string; title: string; dateLabel: string; summary: string; body: string; sourceUrl?: string; dataWindow?: string; caveat?: string };
const allArticles: JournalArticle[] = [...articles, ...marketReports.map(report => ({ slug: `market-watch-${report.date}`, category: 'Historical Market Watch', title: report.title, dateLabel: `${report.date} original report · published journal copy`, summary: report.summary, body: report.body, sourceUrl: report.sourceUrl, dataWindow: report.dataWindow, caveat: report.caveat }))];
const dashboards = [
  { title: 'Market Movers dashboards', href: '/movers', description: 'Price charts, categories, and signal exploration. Start here for the numbers, not the daily prose.' },
  { title: 'Market research feed', href: '/market-watch', description: 'Source-aware watchlists with exact-printing notes and uncertainty labels.' },
  { title: 'Market signal audit', href: '/market-signal-audit', description: 'Historical evidence and prediction-review context, kept separate from new daily observations.' },
];
const brawlCards = brawlDecks.map(deck => ({ id: deck.id, name: deck.commander, description: deck.subtitle, href: brawlDeckPath(deck.id), image: cardReference(deck.commander)?.artUrl ?? cardReference(deck.commander)?.imageUrl ?? undefined }));
const battleCards = retroBattleBoxDecks.map(deck => {
  const representative = deck.groups.flatMap(group => group.cards).find(card => battleBoxReferences[card.name]);
  const ref = representative ? battleBoxReferences[representative.name] : undefined;
  return { id: deck.id, name: deck.name, description: deck.summary, href: `/battle-box/${encodeURIComponent(deck.id)}`, image: ref?.image_uris?.normal, cardName: representative?.name };
});

export function PublishedBadge() {
  return <span className="inline-flex items-center gap-1 border border-amber-500/60 bg-amber-500/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-300"><LockKeyhole className="h-3 w-3" /> Published article / journal</span>;
}
function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-foreground sm:px-8 sm:py-12">{children}</main>;
}
function DeckCards({ type }: { type: 'brawl' | 'battle' }) {
  const cards = type === 'brawl' ? brawlCards : battleCards;
  return <section className="mt-10 border-t-2 border-border pt-8" aria-label={type === 'brawl' ? 'All seven Brawlternative decks' : 'All nine Battle Box decks'}>
    <h2 className="text-3xl font-black">{type === 'brawl' ? 'Explore every Brawlternative' : 'Pick your next matchup'}</h2>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">Representative card imagery from Scryfall, © Wizards of the Coast. Art is not a printing or ownership claim. Buy Online opens the deck's shopping section; it does not place an order.</p>
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards.map(deck => <article key={deck.id} className="flex min-w-0 flex-col overflow-hidden border-2 border-border bg-card">
      <Link href={deck.href} className="block aspect-[16/9] overflow-hidden bg-muted" aria-label={`View ${deck.name}`}>
        {deck.image && <img src={deck.image} alt={`Representative art for ${deck.name}`} loading="lazy" className="h-full w-full object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col p-5"><h3 className="text-xl font-black"><Link href={deck.href} className="hover:text-primary">{deck.name}</Link></h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{type === 'brawl' && ['the-wise-mothman', 'rakdos-lord-of-riots', 'karlov-of-the-ghost-council'].includes(deck.id) ? 'Complete 60-card editorial revision published for reference. The submitted list remains separately available on the page.' : deck.description}</p>
        <div className="mt-auto pt-5"><Link href={`${deck.href}#buy-online`} className="flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-4 py-3 font-black text-primary-foreground hover:opacity-90">Buy Online <ArrowRight className="h-4 w-4" /></Link>
          <Link href={deck.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary underline">Read the deck & export list</Link></div>
      </div>
    </article>)}</div>
  </section>;
}
function Hub() {
  return <Shell><header className="border-b-2 border-border pb-8"><PublishedBadge /><p className="mt-6 font-mono text-xs font-black uppercase tracking-widest text-primary">Decks, games, and the daily market notebook</p><h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Blog / Journal</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">The stories live here. The charts have their own desk. Browse a dated market report, meet a new brew, or find a way to play it with a friend.</p><p className="mt-4 max-w-3xl border-l-2 border-amber-500 pl-4 text-sm leading-6 text-amber-800 dark:text-amber-300">Published journal articles and editorial deck revisions retain their source-list history and pending playtesting caveats. Existing historical reports keep their own report dates and data windows.</p></header>
    <section className="mt-9" aria-label="Published journal articles"><h2 className="text-3xl font-black">From the play table</h2><div className="mt-5 grid gap-5 md:grid-cols-3">{articles.map(article => <Link key={article.slug} href={`/blog/${article.slug}`} className="border-2 border-border bg-card p-5 hover:border-primary"><p className="font-mono text-xs font-black uppercase text-primary">{article.category}</p><h3 className="mt-3 text-xl font-black">{article.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{article.summary}</p><p className="mt-4 text-xs text-muted-foreground">{article.dateLabel}</p></Link>)}</div></section>
    <section className="mt-12 border-t-2 border-border pt-8" aria-label="Chronological daily Market Watch articles"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Text-heavy daily posts</p><h2 className="mt-2 text-3xl font-black">Market Watch, by report date</h2></div><BookOpen className="h-8 w-8 shrink-0 text-primary" /></div><p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">Each source report stays in its own dated entry. A historical observation is not a new mover claim, and missing dates are not filled with invented reports.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{[...reports].sort((a,b) => b.dateKey.localeCompare(a.dateKey)).map(entry => <Link key={entry.id} href={entry.href} className="min-w-0 border-2 border-border bg-card p-5 hover:border-primary"><div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-mono text-xs font-black text-primary"><CalendarDays className="h-4 w-4" /> {entry.dateKey}</span><span className="font-mono text-[10px] font-black uppercase text-muted-foreground">{entry.kind}</span></div><h3 className="mt-3 text-xl font-black">{entry.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.dataWindow}</p><p className="mt-3 text-xs leading-5 text-amber-800 dark:text-amber-300">{entry.caveat}</p></Link>)}</div></section>
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
  return <Shell><header className="border-b-2 border-border pb-7"><Link href="/blog" className="inline-flex min-h-11 items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Blog / Journal</Link><div className="mt-6 flex flex-wrap items-center gap-3"><PublishedBadge /><span className="text-xs text-muted-foreground">{article.dateLabel}</span></div><p className="mt-5 font-mono text-xs font-black uppercase tracking-widest text-primary">{article.category}</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{article.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{article.summary}</p></header>
    {'sourceUrl' in article && <aside className="mt-6 max-w-3xl border-l-4 border-amber-500 bg-amber-500/5 p-4 text-sm leading-7"><p><strong>Historical source window:</strong> {article.dataWindow}.</p><p className="mt-2">{article.caveat}</p><a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-bold text-primary underline">Original report source</a><p className="mt-2"><strong>Published journal source copy:</strong> this entry preserves the original report context; prices and named catalysts below are historical source claims, not freshly verified quotes or new daily moves.</p></aside>}
    <article className="prose prose-neutral mt-8 max-w-3xl break-words text-base leading-8 dark:prose-invert prose-a:text-primary"><ReactMarkdown>{article.body.replace(/^# [^\n]*\n+/, '')}</ReactMarkdown></article>
    {'sourceUrl' in article && <nav aria-label="Separate market chart tools" className="mt-8 flex flex-wrap gap-4 border-t border-border pt-5"><Link href="/movers" className="font-bold text-primary underline">Open chart dashboards</Link><Link href="/market-watch" className="font-bold text-primary underline">Source watchlist feed</Link></nav>}
    {slug === 'brawlternative-shelf-roundup' && <DeckCards type="brawl" />}
    {slug === 'battle-box-october-17-recap' && <DeckCards type="battle" />}
    <footer className="mt-10 border-t border-border pt-5"><Link href="/blog" className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline"><ArrowLeft className="h-4 w-4" /> Back to the journal</Link></footer>
  </Shell>;
}
