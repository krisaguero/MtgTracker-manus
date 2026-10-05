import { useMemo, useState } from 'react';

interface MarketCardPreviewProps {
  name: string;
  setCode?: string;
  size?: 'sm' | 'md';
}

function cleanCardName(name: string) {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

export function MarketCardPreview({ name, setCode, size = 'sm' }: MarketCardPreviewProps) {
  const cleanName = cleanCardName(name);
  const candidates = useMemo(() => {
    const params = new URLSearchParams({ fuzzy: cleanName, format: 'image', version: 'normal' });
    if (setCode && setCode !== '—') params.set('set', setCode.toLowerCase());
    const withSet = `https://api.scryfall.com/cards/named?${params.toString()}`;
    params.delete('set');
    const withoutSet = `https://api.scryfall.com/cards/named?${params.toString()}`;
    return [withSet, withoutSet];
  }, [cleanName, setCode]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const dimensions = size === 'md' ? 'h-36 w-24' : 'h-24 w-16';
  return (
    <div className={`${dimensions} flex-shrink-0 overflow-hidden border-2 border-border bg-muted shadow-sm`}>
      {failed ? <div className="flex h-full w-full items-center justify-center p-2 text-center font-mono text-[9px] uppercase leading-tight text-muted-foreground">{setCode || 'MTG'}<br />art unavailable</div> : <img src={candidates[candidateIndex]} alt={`${name} card preview`} loading="lazy" className="h-full w-full object-cover" onError={() => { if (candidateIndex < candidates.length - 1) setCandidateIndex(candidateIndex + 1); else setFailed(true); }} />}
    </div>
  );
}
