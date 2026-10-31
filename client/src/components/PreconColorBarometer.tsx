import { useMemo } from 'react';
import { Compass, Info, Sparkles } from 'lucide-react';

interface ColorDeck {
  slug: string;
  name: string;
  guild?: string;
  colorCategory?: string;
  isCollectorEdition: boolean;
}

const PAIRS = [
  { code: 'WU', label: 'Azorius', tone: '#60a5fa' }, { code: 'UB', label: 'Dimir', tone: '#818cf8' },
  { code: 'BR', label: 'Rakdos', tone: '#f87171' }, { code: 'RG', label: 'Gruul', tone: '#fb923c' },
  { code: 'WG', label: 'Selesnya', tone: '#a3e635' }, { code: 'WB', label: 'Orzhov', tone: '#d1d5db' },
  { code: 'UR', label: 'Izzet', tone: '#c084fc' }, { code: 'BG', label: 'Golgari', tone: '#4ade80' },
  { code: 'WR', label: 'Boros', tone: '#facc15' }, { code: 'UG', label: 'Simic', tone: '#2dd4bf' },
];
const IDENTITY_GROUPS = [
  { code: 'PAIRS', label: 'Two-color pairs', tone: '#60a5fa' }, { code: 'MONO', label: 'Mono-color', tone: '#a78bfa' },
  { code: 'TRI', label: 'Three-color', tone: '#f59e0b' }, { code: 'QUAD', label: 'Four-color', tone: '#f43f5e' },
  { code: 'FIVE', label: 'Five-color', tone: '#14b8a6' }, { code: 'PARTNER', label: 'Partner / Friends', tone: '#ec4899' },
  { code: 'COLORLESS', label: 'Colorless', tone: '#94a3b8' },
];

function groupFor(category: string | undefined) {
  if (!category) return 'UNKNOWN';
  if (PAIRS.some((pair) => pair.code === category)) return 'PAIRS';
  if (category.startsWith('MONO-')) return 'MONO';
  if (category.startsWith('TRI-')) return 'TRI';
  if (category.startsWith('QUAD-')) return 'QUAD';
  return category;
}

function Pie({ counts, segments, total, label }: { counts: Record<string, number>; segments: { code: string; tone: string }[]; total: number; label: string }) {
  let cursor = 0;
  const gradient = segments.flatMap((segment) => {
    const value = counts[segment.code] || 0;
    if (!value || !total) return [];
    const start = cursor;
    cursor += (value / total) * 100;
    return `${segment.tone} ${start}% ${cursor}%`;
  });
  return <div className="h-28 w-28 shrink-0 border-2 border-border" style={{ background: gradient.length ? `conic-gradient(${gradient.join(', ')})` : 'var(--muted)' }} role="img" aria-label={`${label} across ${total} precons`} />;
}

export function PreconColorBarometer({ decks, ownedSlugs }: { decks: ColorDeck[]; ownedSlugs?: Set<string> }) {
  const regularDecks = useMemo(() => decks.filter((deck) => !deck.isCollectorEdition), [decks]);
  const ownedDecks = useMemo(() => regularDecks.filter((deck) => ownedSlugs?.has(deck.slug.toLowerCase())), [regularDecks, ownedSlugs]);
  const pairCounts = useMemo(() => countPairs(regularDecks), [regularDecks]);
  const ownedPairCounts = useMemo(() => countPairs(ownedDecks), [ownedDecks]);
  const groupCounts = useMemo(() => countGroups(regularDecks), [regularDecks]);
  const groupSegments = IDENTITY_GROUPS.map(({ code, tone }) => ({ code, tone }));
  const pairTargets = useMemo(() => PAIRS.map((pair) => ({ ...pair, archive: pairCounts[pair.code] || 0, owned: ownedPairCounts[pair.code] || 0 })).sort((a, b) => (a.owned / Math.max(1, a.archive)) - (b.owned / Math.max(1, b.archive))).slice(0, 3), [pairCounts, ownedPairCounts]);
  const maxPair = Math.max(1, ...Object.values(pairCounts));

  return (
    <section className="border-2 border-primary/40 bg-primary/5 p-4 sm:p-5" aria-labelledby="precon-color-barometer">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary"><Compass className="h-4 w-4" /> Collection color barometer</div>
          <h2 id="precon-color-barometer" className="mt-2 text-xl font-black tracking-tight">See your precon range at a glance</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Authoritative Scryfall commander identities now separate pairs from mono-color, three-color, four-color, five-color, partner, and colorless decks. Collector editions stay out of the default mix.</p>
        </div>
        <div className="flex flex-wrap gap-3"><div className="flex items-center gap-3 border border-border bg-background p-3"><Pie counts={groupCounts} segments={groupSegments} total={regularDecks.length} label="Identity groups" /><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity groups</p><p className="mt-1 text-2xl font-black">{regularDecks.length}</p><p className="text-xs text-muted-foreground">regular precons</p></div></div></div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="border border-border bg-background p-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">{PAIRS.map((pair) => <div key={pair.code} className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase"><span className="h-2.5 w-2.5" style={{ backgroundColor: pair.tone }} />{pair.code} <span className="text-muted-foreground">{pairCounts[pair.code] || 0}</span></div>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{PAIRS.map((pair) => <div key={pair.code} className="border border-border p-2"><p className="font-mono text-[10px] font-black uppercase">{pair.label}</p><div className="mt-2 h-1.5 bg-muted"><div className="h-full" style={{ width: `${((pairCounts[pair.code] || 0) / maxPair) * 100}%`, backgroundColor: pair.tone }} /></div><p className="mt-1 font-mono text-[10px] text-muted-foreground">{pairCounts[pair.code] || 0} decks</p></div>)}</div>
        </div>
        <div className="border border-border bg-background p-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Identity breakdown</p>
          <div className="mt-3 grid grid-cols-2 gap-2">{IDENTITY_GROUPS.map((group) => <div key={group.code} className="border border-border px-3 py-2"><p className="text-xs font-bold">{group.label}</p><p className="mt-1 font-mono text-lg font-black" style={{ color: group.tone }}>{groupCounts[group.code] || 0}</p></div>)}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border bg-background p-3"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Range expansion targets</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Owned coverage: <strong className="text-foreground">{ownedDecks.length}</strong> regular precons. Your lowest-covered pairs are:</p></div></div><div className="mt-3 space-y-2">{pairTargets.map((pair) => <div key={pair.code} className="flex items-center justify-between border border-border px-3 py-2"><span className="font-mono text-xs font-black uppercase">{pair.code} · {pair.label}</span><span className="font-mono text-[10px] text-muted-foreground">{pair.owned} / {pair.archive} owned</span></div>)}</div></div>
        <div className="flex items-start gap-2 border border-border bg-background p-3 text-[10px] leading-4 text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" />Identity source: Scryfall <code>color_identity</code> for the commander printing IDs in the archive. Repeated names are keyed by deck name plus set code, so older and newer versions do not overwrite each other.</div>
      </div>
    </section>
  );
}

function countPairs(decks: ColorDeck[]) {
  return decks.reduce<Record<string, number>>((counts, deck) => { const category = deck.colorCategory || deck.guild; if (category && PAIRS.some((pair) => pair.code === category)) counts[category] = (counts[category] || 0) + 1; return counts; }, {});
}
function countGroups(decks: ColorDeck[]) {
  return decks.reduce<Record<string, number>>((counts, deck) => { const group = groupFor(deck.colorCategory || deck.guild); if (group !== 'UNKNOWN') counts[group] = (counts[group] || 0) + 1; return counts; }, {});
}
