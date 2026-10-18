import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { loadOwnedCollection } from '@/lib/manaboxParser';
interface Release { code: string; name: string; released_at?: string; card_count: number; set_type: string; digital?: boolean; }
export default function CollectionSetIndex() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [query, setQuery] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const owned = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of loadOwnedCollection()) if (!card.proxy && card.setCode) map.set(card.setCode.toLowerCase(), (map.get(card.setCode.toLowerCase()) || 0) + card.quantity);
    return map;
  }, []);
  useEffect(() => {
    let alive = true;
    fetch('https://api.scryfall.com/sets', { headers: { Accept: 'application/json' } }).then(async response => {
      if (!response.ok) throw new Error();
      const body = await response.json();
      if (!Array.isArray(body.data)) throw new Error();
      if (alive) setReleases(body.data);
    }).catch(() => { if (alive) setError(true); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const filtered = releases.filter(set => (!ownedOnly || owned.has(set.code)) && `${set.name} ${set.code} ${set.set_type}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="container py-8 sm:py-12">
    <Link href="/collection" className="text-sm font-semibold text-primary">← Private collection</Link>
    <header className="mt-6 border-l-4 border-primary pl-5"><p className="text-xs font-bold uppercase tracking-widest text-primary">Release directory</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Every set. Your own checklist.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Open any release to explore all catalog printings, compare your scanned inventory locally, and review each card. Set size is public catalog information—not a claim about how much of your physical library is scanned.</p></header>
    <div className="my-6 flex flex-wrap gap-3"><input aria-label="Search MTG releases" placeholder="Search release, set code, or type…" className="min-h-11 min-w-0 flex-1 border border-border bg-background px-4" value={query} onChange={event => setQuery(event.target.value)} /><label className="flex items-center gap-2 border border-border px-4 text-sm"><input type="checkbox" checked={ownedOnly} onChange={event => setOwnedOnly(event.target.checked)} /> Sets in my scans</label></div>
    {loading && <p role="status">Loading the public release index…</p>}{error && <p role="alert">The release index could not load. Your private records are unchanged.</p>}
    <p className="mb-4 text-xs text-muted-foreground">{filtered.length.toLocaleString()} releases · Tokens, promos, variants and digital releases are included. Ownership counts never leave this browser.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(set => <Link key={set.code} href={`/collection/sets/${set.code}`} className="border border-border bg-card p-5 transition-colors hover:border-primary"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-bold uppercase text-primary">{set.code}</span><span className="text-xs text-muted-foreground">{set.released_at || 'Release date unknown'}</span></div><h2 className="mt-3 text-lg font-bold">{set.name}</h2><p className="mt-2 text-xs text-muted-foreground">{set.card_count.toLocaleString()} catalog cards · {set.set_type.replaceAll('_', ' ')}{set.digital ? ' · Digital' : ''}</p><p className="mt-3 text-sm font-semibold">{owned.has(set.code) ? `${owned.get(set.code)!.toLocaleString()} scanned copies` : 'No matched scan entries · ownership unknown'} →</p></Link>)}</div>
  </main>;
}
