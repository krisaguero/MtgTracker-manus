import React from 'react';
import { Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRight, BookOpen, Check, Clock3, Layers3, List, MonitorPlay, ShoppingBag } from 'lucide-react';
import { cardReference } from '@/lib/brawlDecks';
import { battleBoxReferences } from '@/lib/battleBoxStrategy';
import { MarketPostMarkdown } from './MarketPostMarkdown';
import { marketJournalWithEmbeds } from '@/lib/marketJournalEmbeds';
import './journal-reading.css';

export type ReadingArticle = { slug: string; title: string; body: string; summary: string };
const features = {
  'remote-play-shuffle-tests': {
    label: 'Choose your table', icon: MonitorPlay, card: 'The Wise Mothman',
    href: '/brawl-box/the-wise-mothman',
    takeaways: ['Pick a webcam, browser, or digital-client table.', 'Copy or download a list, then review the import.', 'Test opening hands before buying physical cards.'],
    action: 'Explore the Brawlternative shelf', target: '/brawl-box',
  },
  'brawlternative-shelf-roundup': {
    label: 'Find your next brew', icon: Layers3, card: 'The Wise Mothman',
    href: '/brawl-box/the-wise-mothman',
    takeaways: ['Seven distinct custom 60-card Commander previews.', 'Three editorial finishes keep submitted lists intact.', 'Read the plan, export the list, then test the matchup.'],
    action: 'Browse all seven decks', target: '#deck-library',
  },
  'battle-box-october-17-recap': {
    label: 'Build a game night', icon: Layers3, card: 'Cavalcade of Calamity',
    href: '/battle-box/goblin-cavalcade',
    takeaways: ['Nine shared 60-card decks, each with its own game plan.', 'The build record and new deck pages have distinct dates.', 'Check source warnings and agree on house rules first.'],
    action: 'Choose a Battle Box deck', target: '#deck-library',
  },
  'commanders-100-percent-worth-building-around': {
    label: 'Watch, then build', icon: MonitorPlay, card: 'Sakiko, Mother of Summer',
    href: '/card/Sakiko%2C%20Mother%20of%20Summer',
    imageUrl: 'https://i.ytimg.com/vi/9Zg1zAsXsQ8/hqdefault.jpg',
    takeaways: ['Seven chaptered commanders with distinct build-around constraints.', 'Short video excerpts are labeled capture notes, not certified transcript quotes.', 'Open each card profile and test the plan before buying into it.'],
    action: 'Open the Commander Library', target: '/commander',
  },
  'simple-builds-that-dominate-your-playgroup': {
    label: 'Simple build showcase', icon: MonitorPlay, card: 'Jasmine Boreal of the Seven',
    href: '/card/Jasmine%20Boreal%20of%20the%20Seven',
    imageUrl: 'https://i.ytimg.com/vi/x8KK0-U8FAc/hqdefault.jpg',
    takeaways: ['Eight commander showcases from the video and its retrieved captions.', 'Each section reduces the deck to a short, testable set of jobs.', 'Quoted excerpts include timestamps and link back to the original video.'],
    action: 'Browse the Commander Library', target: '/commander',
  },
};
export function readingFeature(slug: string) { return features[slug as keyof typeof features]; }
export function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.split(/\s+/).length / 220)); }
export function headingId(text: string) { return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
export function articleSections(body: string) {
  return Array.from(body.matchAll(/^## (.+)$/gm)).map(match => ({ title: match[1], id: headingId(match[1]) }));
}

export function ArticleCover({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const feature = readingFeature(slug);
  if (!feature) return null;
  const ref = journalCardImage(slug);
  if (!ref?.imageUrl) return null;
  const artOnly = slug === 'battle-box-october-17-recap';
  return <figure className={`journal-cover ${compact ? 'journal-cover--compact' : ''} ${artOnly ? 'journal-cover--art' : 'journal-cover--commander'}`}>
    <Link href={feature.href} aria-label={`Explore ${feature.card}`} className="journal-cover-link">
      <img src={artOnly ? ref.artUrl : ref.imageUrl} alt={artOnly ? `Representative artwork for Goblin Cavalcade` : feature.card} width={artOnly ? '626' : '488'} height={artOnly ? '457' : '680'} loading={compact ? 'lazy' : 'eager'} />
    </Link>
    <figcaption><span>{artOnly ? 'Representative deck artwork' : 'Primary commander · full card'}</span><Link href={feature.href}>{artOnly ? 'Goblin Cavalcade' : feature.card} <ArrowRight size={14} aria-hidden="true" /></Link>{!artOnly && cardReference(feature.card)?.oracleText && <p className="journal-cover-oracle"><strong>Oracle text</strong><br />{cardReference(feature.card)!.oracleText}</p>}<small>Card art{artOnly ? '' : ' and Oracle text'} via Scryfall · © Wizards of the Coast</small></figcaption>
  </figure>;
}

export function journalCardImage(slug: string) {
  const feature = readingFeature(slug);
  if (!feature) return undefined;
  if ('imageUrl' in feature && feature.imageUrl) return { imageUrl: feature.imageUrl, artUrl: feature.imageUrl };
  const brawl = cardReference(feature.card);
  if (brawl) return { imageUrl: brawl.imageUrl ?? undefined, artUrl: brawl.artUrl ?? undefined };
  const battle = battleBoxReferences[feature.card];
  return battle ? { imageUrl: battle.image_uris?.normal, artUrl: battle.image_uris?.normal?.replace('/normal/', '/art_crop/') } : undefined;
}

export function ReadingOverview({ article }: { article: ReadingArticle }) {
  const feature = readingFeature(article.slug);
  const sections = articleSections(article.body);
  const Icon = feature?.icon ?? BookOpen;
  return <aside className="journal-overview" aria-label="Article overview">
    {feature && <div className="journal-takeaways"><p className="journal-eyebrow"><Icon size={18} aria-hidden="true" /> The short version</p><ul>{feature.takeaways.map(item => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
      <Link href={feature.target} className="journal-primary-link">{feature.action}<ArrowRight size={17} aria-hidden="true" /></Link>
    </div>}
    <nav aria-label="On this page" className="journal-toc"><p className="journal-eyebrow"><List size={18} aria-hidden="true" /> In this article</p><ol>{sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>)}</ol>{feature?.target === '#deck-library' && <a className="journal-toc-library" href="#deck-library">Jump to the deck cards <ArrowRight size={14} aria-hidden="true" /></a>}</nav>
  </aside>;
}

const spotlights = [
  { heading: 'Mothman:', name: 'The Wise Mothman', href: '/brawl-box/the-wise-mothman', text: 'See the counter plan, compare the source list, and export the editorial revision.' },
  { heading: 'Rakdos:', name: 'Rakdos, Lord of Riots', href: '/brawl-box/rakdos-lord-of-riots', text: 'Review the life-loss setup and creature sequencing alongside the full list.' },
  { heading: 'Karlov:', name: 'Karlov of the Ghost Council', href: '/brawl-box/karlov-of-the-ghost-council', text: 'Explore the life-gain packages and the distinct roles of both Daxos cards.' },
];
function InlineDeck({ name, href, text }: typeof spotlights[number]) {
  const reference = cardReference(name);
  const image = reference?.imageUrl;
  return <aside className="journal-inline-deck" aria-label={`${name} deck tools`}>
    {image && <Link href={href} tabIndex={-1} aria-hidden="true"><img src={image} alt="" width="488" height="680" loading="lazy" /></Link>}
    <div><p className="journal-eyebrow">Put the idea into play</p><p className="journal-inline-title"><Link href={href}>{name}</Link></p><p>{text}</p>{reference?.oracleText && <p className="journal-inline-oracle"><strong>Printed Oracle text</strong><br />{reference.oracleText}</p>}<div className="journal-inline-actions"><Link className="journal-primary-link" href={`${href}#buy-online`}><ShoppingBag size={16} aria-hidden="true" /> Buy Online</Link><Link className="journal-text-link" href={href}>Deck & export tools <ArrowRight size={14} aria-hidden="true" /></Link></div></div>
  </aside>;
}

export function ReadingBody({ article }: { article: ReadingArticle }) {
  const body = article.body.replace(/^# [^\n]*\n+/, '');
  if (article.slug.startsWith('market-watch-')) {
    const sourceDate = article.slug.slice('market-watch-'.length);
    return <article className="journal-prose" aria-label="Article text"><MarketPostMarkdown body={marketJournalWithEmbeds(body, sourceDate)} sourceDate={sourceDate} /></article>;
  }
  const sections = body.split(/(?=^## )/m);
  return <article className="journal-prose" aria-label="Article text">{sections.map((section, index) => {
    const title = section.match(/^## (.+)/)?.[1];
    return <section className={title ? 'journal-section' : 'journal-intro'} key={index} aria-label={title}>
      {section.split(/(?=^### )/m).map((subsection, subIndex) => <React.Fragment key={subIndex}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h2: ({ children }) => <h2 id={headingId(String(children))}><span className="journal-section-number" aria-hidden="true">{String(index).padStart(2, '0')}</span>{children}</h2>,
        h3: ({ children }) => <h3>{children}</h3>,
        a: ({ href, children }) => href?.startsWith('/') ? <Link href={href}>{children}</Link> : <a href={href} {...(href?.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>,
      }}>{subsection}</ReactMarkdown>
      {article.slug === 'brawlternative-shelf-roundup' && subsection.startsWith('### ') && spotlights.filter(item => subsection.split('\n')[0].includes(item.href)).map(item => <InlineDeck key={item.href} {...item} />)}
      </React.Fragment>)}
    </section>;
  })}</article>;
}

export function ReadingMeta({ body }: { body: string }) {
  return <span className="journal-reading-time"><Clock3 size={15} aria-hidden="true" /> {readingMinutes(body)} min read</span>;
}

export function RelatedReading({ articles, currentSlug }: { articles: ReadingArticle[]; currentSlug: string }) {
  return <nav className="journal-related" aria-label="Keep reading"><p className="journal-eyebrow"><BookOpen size={17} aria-hidden="true" /> Keep exploring</p><h2>From the notebook to the table</h2><div>{articles.filter(item => item.slug !== currentSlug).map(item => <Link key={item.slug} href={`/blog/${item.slug}`}><span>{readingFeature(item.slug)?.label ?? 'Play journal'}</span><h3>{item.title}</h3><p>{item.summary}</p><strong>Read the story <ArrowRight size={16} aria-hidden="true" /></strong></Link>)}</div></nav>;
}
