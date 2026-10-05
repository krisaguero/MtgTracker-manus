export interface EdhrecCommanderRank {
  rank: number;
  name: string;
  decksPastMonth: number;
  period: 'past-month';
  sourceUrl: string;
}

export const edhrecSnapshotDate = '2026-10-04';
export const edhrecSourceUrl = 'https://edhrec.com/commanders/month';

/** Snapshot captured from EDHREC's public Top Commanders (Past Month) page. */
const rankedCommanders: Array<[string, number]> = [
  ['Hearthhull, the Worldseed', 5201],
  ["Y'shtola, Night's Blessed", 5087],
  ['Vivi Ornitier', 3833],
  ['Kefka, Court Mage', 3659],
  ['The Ur-Dragon', 3600],
  ['Edgar Markov', 3571],
  ['Teval, the Balanced Scale', 3462],
  ['Ragost, Deft Gastronaut', 3449],
  ['Cloud, Ex-SOLDIER', 3379],
  ['Kilo, Apogee Mind', 3184],
  ['Sephiroth, Fabled SOLDIER', 3070],
  ['Kaalia of the Vast', 2855],
  ['Ms. Bumbleflower', 2826],
  ["Atraxa, Praetors' Voice", 2814],
  ['Krenko, Mob Boss', 2731],
  ['Pantlaza, Sun-Favored', 2692],
  ['Jodah, the Unifier', 2553],
  ['Giada, Font of Hope', 2507],
  ['Sauron, the Dark Lord', 2481],
  ['The Wise Mothman', 2479],
];

export const edhrecTopCommanders: EdhrecCommanderRank[] = rankedCommanders.map(([name, decksPastMonth], index) => ({
  rank: index + 1,
  name,
  decksPastMonth,
  period: 'past-month' as const,
  sourceUrl: `${edhrecSourceUrl}`,
}));

export function edhrecCommanderHref(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-');
  return `https://edhrec.com/commanders/${slug.replace(/-+$/, '')}`;
}
