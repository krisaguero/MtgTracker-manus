import { useMemo } from 'react';
import { Compass, Info, Sparkles } from 'lucide-react';

interface ColorDeck {
  slug: string;
  name: string;
  guild?: string;
  isCollectorEdition: boolean;
}

const COLORS = [
  { code: 'WU', label: 'Azorius', short: 'WU', tone: '#60a5fa' },
  { code: 'UB', label: 'Dimir', short: 'UB', tone: '#818cf8' },
  { code: 'BR', label: 'Rakdos', short: 'BR', tone: '#f87171' },
  { code: 'RG', label: 'Gruul', short: 'RG', tone: '#fb923c' },
  { code: 'GW', label: 'Selesnya', short: 'GW', tone: '#a3e635' },
  { code: 'WB', label: 'Orzhov', short: 'WB', tone: '#d1d5db' },
  { code: 'UR', label: 'Izzet', short: 'UR', tone: '#c084fc' },
  { code: 'BG', label: 'Golgari', short: 'BG', tone: '#4ade80' },
  { code: 'RW', label: 'Boros', short: 'RW', tone: '#facc15' },
  { code: 'GU', label: 'Simic', short: 'GU', tone: '#2dd4bf' },
];

function Pie({ counts, total }: { counts: Record<string, number>; total: number }) {
  let cursor = 0;
  const segments = COLORS.flatMap((color) => {
    const value = counts[color.code] || 0;
    if (!value || !total) return [];
    const start = cursor;
    cursor += (value / total) * 100;
    return `${color.tone} ${start}% ${cursor}%`;
  });
  return <div className="h-28 w-28 shrink-0 border-2 border-border" style={{ background: segments.length ? `conic-gradient(${segments.join(', ')})` : 'var(--muted)' }} role="img" aria-label={`Color distribution across ${total} precons`} />;
}

export function PreconColorBarometer({ decks, ownedSlugs }: { decks: ColorDeck[]; ownedSlugs?: Set<string> }) {
  const regularDecks = useMemo(() => decks.filter((deck) => !deck.isCollectorEdition), [decks]);
  const archiveCounts = useMemo(() => countByColor(regularDecks), [regularDecks]);
  const ownedDecks = useMemo(() => regularDecks.filter((deck) => ownedSlugs?.has(deck.slug.toLowerCase())), [regularDecks, ownedSlugs]);
  const ownedCounts = useMemo(() => countByColor(ownedDecks), [ownedDecks]);
  const rankedGaps = useMemo(() => COLORS.map((color) => ({ ...color, archive: archiveCounts[color.code] || 0, owned: ownedCounts[color.code] || 0 })).sort((a, b) => (a.owned / Math.max(1, a.archive)) - (b.owned / Math.max(1, b.archive))), [archiveCounts, ownedCounts]);
  const lowest = rankedGaps.slice(0, 3);

  return (
    <section className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-5" aria-labelledby="precon-color-barometer">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary"><Compass className="h-4 w-4" /> Collection color barometer</div>
          <h2 id="precon-color-barometer" className="mt-2 text-xl font-black tracking-tight">See your precon range at a glance</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The pie shows the regular-edition archive mix. The gap list compares your fully owned or inventory-complete decks with that available range, so missing Simic or other color pairs surface as deliberate next-build ideas.</p>
        </div>
        <div className="flex items-center gap-4 border border-border bg-background p-3"><Pie counts={archiveCounts} total={regularDecks.length} /><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Archive mix</p><p className="mt-1 text-2xl font-black">{regularDecks.length}</p><p className="text-xs text-muted-foreground">regular precons mapped</p></div></div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="border border-border bg-background p-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">{COLORS.map((color) => <div key={color.code} className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase"><span className="h-2.5 w-2.5" style={{ backgroundColor: color.tone }} />{color.short} <span className="text-muted-foreground">{archiveCounts[color.code] || 0}</span></div>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{COLORS.map((color) => <div key={color.code} className="border border-border p-2"><p className="font-mono text-[10px] font-black uppercase">{color.label}</p><div className="mt-2 h-1.5 bg-muted"><div className="h-full" style={{ width: `${Math.min(100, ((archiveCounts[color.code] || 0) / Math.max(1, Math.max(...Object.values(archiveCounts)))) * 100)}%`, backgroundColor: color.tone }} /></div><p className="mt-1 font-mono text-[10px] text-muted-foreground">{archiveCounts[color.code] || 0} decks</p></div>)}</div>
        </div>
        <div className="border border-border bg-background p-3">
          <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Range expansion targets</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Owned coverage: <strong className="text-foreground">{ownedDecks.length}</strong> regular precons. Start with the lowest-covered pairs:</p></div></div>
          <div className="mt-3 space-y-2">{lowest.map((color) => <div key={color.code} className="flex items-center justify-between border border-border px-3 py-2"><span className="font-mono text-xs font-black uppercase">{color.short} · {color.label}</span><span className="font-mono text-[10px] text-muted-foreground">{color.owned} / {color.archive} owned</span></div>)}</div>
          <div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" />Color pairs are the library’s current deck/commander classifier. Partner and collector records are excluded from the default barometer.</div>
        </div>
      </div>
    </section>
  );
}

function countByColor(decks: ColorDeck[]) {
  return decks.reduce<Record<string, number>>((counts, deck) => {
    if (deck.guild && COLORS.some((color) => color.code === deck.guild)) counts[deck.guild] = (counts[deck.guild] || 0) + 1;
    return counts;
  }, {});
}
