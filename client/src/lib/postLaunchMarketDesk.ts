export type FloorStatus = 'still-falling' | 'possible-floor' | 'rebounding' | 'low-liquidity-noise' | 'unresolved';

export type PostLaunchCard = {
  name: string;
  setCode: string;
  collectorNumber?: string;
  role: 'portable utility' | 'precon fit' | 'theme speculation';
  deck: string;
  deckHref: string;
  cardHref: string;
  baselineUsd: number | null;
  latestUsd: number | null;
  snapshots: Array<{ date: string; usd: number | null }>;
  sellerDepth: 'broad' | 'thin' | 'unknown';
  thesis: string;
  action: 'buy-for-play' | 'bundle' | 'hold' | 'watch';
  quantityNeeded: number;
};

export const postLaunchCards: PostLaunchCard[] = [
  {
    name: 'Academy Ruins', setCode: 'eoc', role: 'portable utility', deck: 'We Are the Borg', deckHref: '/deck/eoc/we-are-the-borg', cardHref: '/card/Academy%20Ruins',
    baselineUsd: 9.5, latestUsd: 5.25, snapshots: [{ date: '2026-11-13', usd: 9.5 }, { date: '2026-11-15', usd: 5.5 }, { date: '2026-11-16', usd: 5.25 }], sellerDepth: 'broad',
    thesis: 'Broad artifact-recursion demand makes this the cleanest utility-floor test after new Star Trek supply.', action: 'bundle', quantityNeeded: 1,
  },
  {
    name: 'Foundry Inspector', setCode: 'eoc', role: 'portable utility', deck: 'We Are the Borg', deckHref: '/deck/eoc/we-are-the-borg', cardHref: '/card/Foundry%20Inspector',
    baselineUsd: 3.25, latestUsd: 1.1, snapshots: [{ date: '2026-11-13', usd: 3.25 }, { date: '2026-11-15', usd: 1.2 }, { date: '2026-11-16', usd: 1.1 }], sellerDepth: 'broad',
    thesis: 'One copy bridges artifact-heavy builds; reserve before buying duplicates for Keen Engineering.', action: 'buy-for-play', quantityNeeded: 2,
  },
  {
    name: 'World at War', setCode: 'eoc', role: 'precon fit', deck: 'Klingon Fury', deckHref: '/deck/eoc/klingon-fury', cardHref: '/card/World%20at%20War',
    baselineUsd: 5.75, latestUsd: 2.4, snapshots: [{ date: '2026-11-13', usd: 5.75 }, { date: '2026-11-15', usd: 2.6 }, { date: '2026-11-16', usd: 2.4 }], sellerDepth: 'broad',
    thesis: 'A real extra-combat upgrade, but the reprint is too fresh to treat as a rebound candidate.', action: 'watch', quantityNeeded: 1,
  },
  {
    name: 'Windcrag Siege', setCode: 'eoc', role: 'theme speculation', deck: 'Klingon Fury', deckHref: '/deck/eoc/klingon-fury', cardHref: '/card/Windcrag%20Siege',
    baselineUsd: 4.5, latestUsd: 3.8, snapshots: [{ date: '2026-11-13', usd: 4.5 }, { date: '2026-11-15', usd: 3.75 }, { date: '2026-11-16', usd: 3.8 }], sellerDepth: 'thin',
    thesis: 'Worf-facing demand is plausible, but the narrow buyer base makes seller depth more important than the headline price.', action: 'watch', quantityNeeded: 1,
  },
  {
    name: 'Open the Way', setCode: 'eoc', role: 'precon fit', deck: 'Landing Party', deckHref: '/deck/eoc/landing-party', cardHref: '/card/Open%20the%20Way',
    baselineUsd: 3.9, latestUsd: 2.15, snapshots: [{ date: '2026-11-13', usd: 3.9 }, { date: '2026-11-15', usd: 2.1 }, { date: '2026-11-16', usd: 2.15 }], sellerDepth: 'broad',
    thesis: 'Test the land-name threshold in Commander Spock before treating this as a necessary purchase.', action: 'watch', quantityNeeded: 1,
  },
  {
    name: 'Merrow Commerce', setCode: 'eoc', role: 'theme speculation', deck: 'Explorers of the Deep', deckHref: '/deck/lcc/explorers-of-the-deep', cardHref: '/card/Merrow%20Commerce',
    baselineUsd: 2.5, latestUsd: 2.5, snapshots: [{ date: '2026-11-13', usd: 2.5 }, { date: '2026-11-15', usd: 2.5 }, { date: '2026-11-16', usd: 2.5 }], sellerDepth: 'unknown',
    thesis: 'Hold existing copies for a possible Nauctis bridge; do not buy before the full Merfolk list is confirmed.', action: 'hold', quantityNeeded: 1,
  },
];

export function floorStatus(card: Pick<PostLaunchCard, 'snapshots' | 'sellerDepth'>): FloorStatus {
  const values = card.snapshots.map(snapshot => snapshot.usd).filter((value): value is number => value != null);
  if (values.length < 3) return 'unresolved';
  if (card.sellerDepth === 'thin' && Math.abs(values[values.length - 1] - values[values.length - 2]) < 0.15) return 'low-liquidity-noise';
  const [a, b, c] = values.slice(-3);
  if (Math.abs(c - b) <= Math.max(0.1, b * 0.04)) return 'possible-floor';
  if (c < b && b < a) return 'still-falling';
  if (c > b && b <= a) return 'rebounding';
  return 'unresolved';
}

export function percentChange(baselineUsd: number | null, latestUsd: number | null) {
  if (baselineUsd == null || latestUsd == null || baselineUsd === 0) return null;
  return ((latestUsd - baselineUsd) / baselineUsd) * 100;
}

export const floorStatusLabels: Record<FloorStatus, string> = {
  'still-falling': 'Still falling',
  'possible-floor': 'Possible floor',
  rebounding: 'Rebounding',
  'low-liquidity-noise': 'Low-liquidity noise',
  unresolved: 'Unresolved',
};
