import React from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, Play, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import spotlight from '@/data/tabletopPaperSpotlight.json';

export function TabletopPaperSpotlightTeaser() {
  return <section aria-labelledby="creator-spotlight-heading" className="mb-6 border-2 border-primary bg-primary/5 p-5 sm:p-7">
    <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Creator spotlight · October 17, 2026</p>
    <h2 id="creator-spotlight-heading" className="mt-3 text-2xl font-black tracking-tight">{spotlight.title}</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{spotlight.summary}</p>
    <Link href={spotlight.href} className="mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-xs font-black uppercase text-primary hover:underline">Read the spotlight & watch on YouTube <ArrowUpRight className="h-4 w-4" /></Link>
  </section>;
}

export default function TabletopPaperSpotlight() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <Link href="/market-reports" className="inline-flex min-h-11 items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Dated article archive</Link>
        <p className="mt-6 flex w-fit items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" /> October 17, 2026 · Creator spotlight</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{spotlight.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{spotlight.summary}</p>
        <a href={spotlight.channel.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"><Play className="h-4 w-4" /> {spotlight.channel.name} on YouTube</a>
      </div>
    </header>
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
      <section aria-labelledby="spotlight-intro" className="space-y-4 text-sm leading-7 text-muted-foreground">
        <h2 id="spotlight-intro" className="text-2xl font-black text-foreground">Seven names for the watchlist—not a buy list</h2>
        {spotlight.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
      <section aria-labelledby="spotlight-videos">
        <h2 id="spotlight-videos" className="text-2xl font-black">The video behind the picks</h2>
        <div className="mt-4 grid gap-4">{spotlight.videos.map((video) => <article key={video.url} className="min-w-0 border-2 border-border bg-card p-5">
          <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">{video.channelName}</p>
          <h3 className="mt-2 text-lg font-black leading-tight">{video.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{video.note}</p>
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"><Play className="h-4 w-4" /> Watch on YouTube <ArrowUpRight className="h-4 w-4" /></a>
        </article>)}</div>
      </section>
      <section aria-labelledby="spotlight-cards">
        <h2 id="spotlight-cards" className="text-2xl font-black">The seven-card spotlight</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{spotlight.cards.map((card, index) => <article key={card.name} className="min-w-0 border-2 border-border bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-primary/40 bg-primary/5 font-mono text-sm font-black text-primary">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><h3 className="break-words text-lg font-black leading-tight"><Link href={`/card/${encodeURIComponent(card.name)}`} className="hover:text-primary">{card.name}</Link></h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{card.note}</p></div></div>
          <p className="mt-4 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">{card.attribution}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2"><Link href={`/card/${encodeURIComponent(card.name)}`} className="inline-flex min-h-11 items-center text-xs font-bold text-primary hover:underline">Card profile →</Link><a href={card.rulesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs font-bold text-primary hover:underline">Rules on Scryfall ↗</a>{card.videoUrl && <a href={card.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-primary hover:underline">Watch at {card.timestamp} <ArrowUpRight className="h-3 w-3" /></a>}</div>
        </article>)}</div>
      </section>
      <aside className="border-l-4 border-amber-500 bg-amber-500/5 p-4" role="note"><h2 className="flex items-center gap-2 text-sm font-black"><ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" /> Watch first. Verify before buying.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{spotlight.disclaimer}</p></aside>
      <footer className="border-t border-border pt-4 text-xs leading-6 text-muted-foreground">Independent fan commentary. {spotlight.verificationNote} Video titles and channel credit belong to their creators. Magic: The Gathering is a Wizards of the Coast property.</footer>
    </main>
  </div>;
}
