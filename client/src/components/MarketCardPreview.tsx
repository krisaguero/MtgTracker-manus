import { useEffect, useMemo, useState } from 'react';

interface MarketCardPreviewProps {
  name: string;
  setCode?: string;
  size?: 'sm' | 'md';
}

interface ScryfallImageResponse {
  image_uris?: { normal?: string; art_crop?: string };
  card_faces?: Array<{ image_uris?: { normal?: string; art_crop?: string } }>;
}

const MIN_SCRYFALL_REQUEST_GAP_MS = 550;
const imageLookupCache = new Map<string, Promise<string | null>>();
let queuedRequests: Promise<void> = Promise.resolve();
let lastRequestStartedAt = 0;

function cleanCardName(name: string) {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

function lookupCardImage(url: string): Promise<string | null> {
  const cached = imageLookupCache.get(url);
  if (cached) return cached;

  const request = queuedRequests.then(async () => {
    const elapsed = Date.now() - lastRequestStartedAt;
    if (lastRequestStartedAt && elapsed < MIN_SCRYFALL_REQUEST_GAP_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_SCRYFALL_REQUEST_GAP_MS - elapsed));
    }
    lastRequestStartedAt = Date.now();

    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const card = await response.json() as ScryfallImageResponse;
      return card.image_uris?.normal || card.card_faces?.find(face => face.image_uris?.normal)?.image_uris?.normal ||
        card.image_uris?.art_crop || card.card_faces?.find(face => face.image_uris?.art_crop)?.image_uris?.art_crop || null;
    } catch {
      return null;
    }
  });
  queuedRequests = request.then(() => undefined, () => undefined);
  imageLookupCache.set(url, request);
  return request;
}

export function MarketCardPreview({ name, setCode, size = 'sm' }: MarketCardPreviewProps) {
  const cleanName = cleanCardName(name);
  const candidates = useMemo(() => {
    const params = new URLSearchParams({ fuzzy: cleanName, format: 'json' });
    if (setCode && setCode !== '—') params.set('set', setCode.toLowerCase());
    const withSet = `https://api.scryfall.com/cards/named?${params.toString()}`;
    params.delete('set');
    const withoutSet = `https://api.scryfall.com/cards/named?${params.toString()}`;
    return [withSet, withoutSet];
  }, [cleanName, setCode]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const dimensions = size === 'md' ? 'h-44 w-32' : 'h-24 w-16';

  useEffect(() => {
    let active = true;
    setImageUrl(null);
    setFailed(false);
    const loadImage = async () => {
      for (const candidate of candidates) {
        const found = await lookupCardImage(candidate);
        if (!active) return;
        if (found) {
          setImageUrl(found);
          return;
        }
      }
      if (active) setFailed(true);
    };
    void loadImage();
    return () => { active = false; };
  }, [candidates]);

  return (
    <div className={`${dimensions} flex-shrink-0 overflow-hidden border-2 border-border bg-muted shadow-sm`} title={`${name} · card image via Scryfall`}>
      {failed ? (
        <div className="flex h-full w-full items-center justify-center p-2 text-center font-mono text-[9px] uppercase leading-tight text-muted-foreground">{setCode || 'MTG'}<br />art unavailable</div>
      ) : imageUrl ? (
        <img src={imageUrl} alt={`${name} card image from Scryfall`} loading="lazy" decoding="async" className="h-full w-full object-cover" onError={() => { setImageUrl(null); setFailed(true); }} />
      ) : (
        <div className="h-full w-full animate-pulse bg-gradient-to-br from-primary/15 via-muted to-background" aria-label={`Loading ${name} card image`} />
      )}
    </div>
  );
}
