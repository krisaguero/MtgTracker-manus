export type PreconReleaseStatus = 'released' | 'announced' | 'spoiler-watch';

export interface PreconReleaseRadarItem {
  name: string;
  productLine: string;
  releaseDate: string;
  status: PreconReleaseStatus;
  detail: string;
  sourceUrl: string;
  sourceLabel: string;
}

/**
 * Editorial release radar. Product names and dates are kept separate from the
 * decklist catalog so unspoiled products never masquerade as complete lists.
 */
export const preconReleaseRadar: PreconReleaseRadarItem[] = [
  {
    name: 'Calling All Angels',
    productLine: 'Foundations Commander / Reality Fracture',
    releaseDate: '2026-10-02',
    status: 'released',
    detail: 'Official decklist published. Mono-white beginner-friendly Angels and Clues strategy.',
    sourceUrl: 'https://magic.wizards.com/en/news/announcements/foundations-commander-decklists',
    sourceLabel: 'Wizards decklists',
  },
  {
    name: 'Keen Engineering',
    productLine: 'Foundations Commander / Reality Fracture',
    releaseDate: '2026-10-02',
    status: 'released',
    detail: 'Official decklist published. Mono-blue artifact, Thopter, and Myr strategy.',
    sourceUrl: 'https://magic.wizards.com/en/news/announcements/foundations-commander-decklists',
    sourceLabel: 'Wizards decklists',
  },
  {
    name: 'Wretched Ranks',
    productLine: 'Foundations Commander / Reality Fracture',
    releaseDate: '2026-10-02',
    status: 'released',
    detail: 'Official decklist published. Mono-black Zombie and Zombie Knight strategy.',
    sourceUrl: 'https://magic.wizards.com/en/news/announcements/foundations-commander-decklists',
    sourceLabel: 'Wizards decklists',
  },
  {
    name: 'Reign of Dragons',
    productLine: 'Foundations Commander / Reality Fracture',
    releaseDate: '2026-10-02',
    status: 'released',
    detail: 'Official decklist published. Mono-red Dragon and Treasure strategy.',
    sourceUrl: 'https://magic.wizards.com/en/news/announcements/foundations-commander-decklists',
    sourceLabel: 'Wizards decklists',
  },
  {
    name: 'Tramplesaurus Rex',
    productLine: 'Foundations Commander / Reality Fracture',
    releaseDate: '2026-10-02',
    status: 'released',
    detail: 'Official decklist published. Mono-green Beast and Phyrexian Beast strategy.',
    sourceUrl: 'https://magic.wizards.com/en/news/announcements/foundations-commander-decklists',
    sourceLabel: 'Wizards decklists',
  },
  {
    name: 'Magic: The Gathering | Star Trek',
    productLine: 'Universes Beyond set / Commander watch',
    releaseDate: '2026-11-13',
    status: 'announced',
    detail: 'Wizards has announced the November set, but official Commander product names and decklists are not published in the source used here.',
    sourceUrl: 'https://magic.wizards.com/en/news/announcements/everything-announced-for-magic-the-gathering-in-2026',
    sourceLabel: 'Wizards 2026 announcement',
  },
  {
    name: 'Mystery Booster Commander Edition',
    productLine: 'Community schedule watch',
    releaseDate: '2026-11-09',
    status: 'spoiler-watch',
    detail: 'Listed by a current community release schedule; treat product details and decklists as unverified until Wizards publishes them.',
    sourceUrl: 'https://playgroup.gg/sets',
    sourceLabel: 'Community schedule — verify',
  },
];

export function formatRadarDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
